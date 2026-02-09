use cosmwasm_std::{
    entry_point, to_json_binary, BankMsg, Binary, Coin, Deps, DepsMut, Env, MessageInfo, Response,
    StdResult, Uint128,
};
use cw2::set_contract_version;

use citizen_common::errors::ContractError;

use crate::msg::*;
use crate::state::*;

const CONTRACT_NAME: &str = "crates.io:citizen-staking-emissions";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");
const REWARD_SCALE: u128 = 1_000_000_000_000; // 1e12

// ── Instantiate ─────────────────────────────────────────────────────

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;

    ADMIN.save(deps.storage, &deps.api.addr_validate(&msg.admin)?)?;
    DENOM.save(deps.storage, &msg.denom)?;
    MAX_SUPPLY.save(deps.storage, &msg.max_supply)?;
    TOTAL_MINTED.save(deps.storage, &msg.initial_supply)?;
    TOTAL_STAKED.save(deps.storage, &Uint128::zero())?;
    TOTAL_STAKERS.save(deps.storage, &0u64)?;
    TREASURY.save(deps.storage, &deps.api.addr_validate(&msg.treasury)?)?;
    TREASURY_SHARE_BPS.save(deps.storage, &msg.treasury_share_bps)?;
    LAST_DISTRIBUTION_HEIGHT.save(deps.storage, &env.block.height)?;
    PHASES.save(deps.storage, &msg.phases)?;
    GLOBAL_REWARD_INDEX.save(deps.storage, &Uint128::zero())?;
    SLASH_PENALTY_BPS.save(deps.storage, &msg.slash_penalty_bps)?;
    TOTAL_SLASHED.save(deps.storage, &Uint128::zero())?;
    SLASH_COUNT.save(deps.storage, &0u64)?;

    Ok(Response::new()
        .add_attribute("action", "instantiate")
        .add_attribute("max_supply", msg.max_supply.to_string())
        .add_attribute("denom", msg.denom))
}

// ── Execute ─────────────────────────────────────────────────────────

#[entry_point]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::Stake {} => execute_stake(deps, env, info),
        ExecuteMsg::Unstake { amount } => execute_unstake(deps, env, info, amount),
        ExecuteMsg::ClaimRewards {} => execute_claim(deps, env, info),
        ExecuteMsg::DistributeEmissions {} => execute_distribute(deps, env, info),
        ExecuteMsg::UpdatePhases { phases } => execute_update_phases(deps, info, phases),
        ExecuteMsg::Slash { staker, reason } => execute_slash(deps, env, info, staker, reason),
        ExecuteMsg::UpdateSlashPenalty { slash_penalty_bps } => {
            execute_update_slash_penalty(deps, info, slash_penalty_bps)
        }
    }
}

/// Get the current emission rate for a given block height
fn get_emission_rate(phases: &[EmissionPhase], height: u64) -> Uint128 {
    for phase in phases {
        if height >= phase.start_block && (phase.end_block == 0 || height <= phase.end_block) {
            return phase.tokens_per_block;
        }
    }
    Uint128::zero() // No active phase = no emissions
}

/// Update the global reward index based on new emissions
fn update_global_index(deps: &mut DepsMut, env: &Env) -> Result<Uint128, ContractError> {
    let last_height = LAST_DISTRIBUTION_HEIGHT.load(deps.storage)?;
    let current_height = env.block.height;

    if current_height <= last_height {
        return Ok(Uint128::zero());
    }

    let total_staked = TOTAL_STAKED.load(deps.storage)?;
    if total_staked.is_zero() {
        LAST_DISTRIBUTION_HEIGHT.save(deps.storage, &current_height)?;
        return Ok(Uint128::zero());
    }

    let phases = PHASES.load(deps.storage)?;
    let max_supply = MAX_SUPPLY.load(deps.storage)?;
    let total_minted = TOTAL_MINTED.load(deps.storage)?;
    let remaining = max_supply.saturating_sub(total_minted);

    // Calculate total emissions for blocks [last_height+1, current_height]
    let blocks = current_height - last_height;
    let rate = get_emission_rate(&phases, current_height);
    let mut raw_emission = rate * Uint128::from(blocks);

    // Cap at remaining supply
    if raw_emission > remaining {
        raw_emission = remaining;
    }

    if raw_emission.is_zero() {
        LAST_DISTRIBUTION_HEIGHT.save(deps.storage, &current_height)?;
        return Ok(Uint128::zero());
    }

    // Split: treasury gets treasury_share_bps, rest goes to stakers
    let treasury_bps = TREASURY_SHARE_BPS.load(deps.storage)?;
    let treasury_share = raw_emission.multiply_ratio(treasury_bps, 10000u128);
    let staker_share = raw_emission - treasury_share;

    // Update global index
    let mut global_idx = GLOBAL_REWARD_INDEX.load(deps.storage)?;
    let idx_increase = staker_share
        .checked_mul(Uint128::from(REWARD_SCALE))
        .map_err(|_| ContractError::Overflow)?
        .checked_div(total_staked)
        .map_err(|_| ContractError::Overflow)?;
    global_idx += idx_increase;
    GLOBAL_REWARD_INDEX.save(deps.storage, &global_idx)?;

    // Update total minted
    TOTAL_MINTED.save(deps.storage, &(total_minted + raw_emission))?;
    LAST_DISTRIBUTION_HEIGHT.save(deps.storage, &current_height)?;

    Ok(treasury_share)
}

fn execute_stake(
    mut deps: DepsMut,
    env: Env,
    info: MessageInfo,
) -> Result<Response, ContractError> {
    let denom = DENOM.load(deps.storage)?;
    let amount = info
        .funds
        .iter()
        .find(|c| c.denom == denom)
        .map(|c| c.amount)
        .unwrap_or(Uint128::zero());

    if amount.is_zero() {
        return Err(ContractError::InsufficientFunds {
            needed: "more than 0".to_string(),
            available: "0".to_string(),
        });
    }

    // Update global index first
    update_global_index(&mut deps, &env)?;

    let global_idx = GLOBAL_REWARD_INDEX.load(deps.storage)?;
    let mut staker = STAKERS
        .may_load(deps.storage, &info.sender)?
        .unwrap_or(StakerInfo {
            staked: Uint128::zero(),
            reward_debt: Uint128::zero(),
            pending_rewards: Uint128::zero(),
            last_claim_height: env.block.height,
        });

    // Calculate pending rewards before updating stake
    if !staker.staked.is_zero() {
        let reward = staker
            .staked
            .checked_mul(global_idx)
            .map_err(|_| ContractError::Overflow)?
            .checked_div(Uint128::from(REWARD_SCALE))
            .map_err(|_| ContractError::Overflow)?
            .saturating_sub(staker.reward_debt);
        staker.pending_rewards += reward;
    }

    let was_zero = staker.staked.is_zero();
    staker.staked += amount;
    staker.reward_debt = staker
        .staked
        .checked_mul(global_idx)
        .map_err(|_| ContractError::Overflow)?
        .checked_div(Uint128::from(REWARD_SCALE))
        .map_err(|_| ContractError::Overflow)?;

    STAKERS.save(deps.storage, &info.sender, &staker)?;

    let total = TOTAL_STAKED.load(deps.storage)?;
    TOTAL_STAKED.save(deps.storage, &(total + amount))?;

    if was_zero {
        let count = TOTAL_STAKERS.load(deps.storage)?;
        TOTAL_STAKERS.save(deps.storage, &(count + 1))?;
    }

    Ok(Response::new()
        .add_attribute("action", "stake")
        .add_attribute("staker", info.sender.as_str())
        .add_attribute("amount", amount.to_string()))
}

fn execute_unstake(
    mut deps: DepsMut,
    env: Env,
    info: MessageInfo,
    amount: Uint128,
) -> Result<Response, ContractError> {
    update_global_index(&mut deps, &env)?;

    let global_idx = GLOBAL_REWARD_INDEX.load(deps.storage)?;
    let mut staker =
        STAKERS
            .may_load(deps.storage, &info.sender)?
            .ok_or(ContractError::InsufficientFunds {
                needed: amount.to_string(),
                available: "0".to_string(),
            })?;

    if staker.staked < amount {
        return Err(ContractError::InsufficientFunds {
            needed: amount.to_string(),
            available: staker.staked.to_string(),
        });
    }

    // Calculate pending rewards
    let reward = staker
        .staked
        .checked_mul(global_idx)
        .map_err(|_| ContractError::Overflow)?
        .checked_div(Uint128::from(REWARD_SCALE))
        .map_err(|_| ContractError::Overflow)?
        .saturating_sub(staker.reward_debt);
    staker.pending_rewards += reward;

    staker.staked -= amount;
    staker.reward_debt = staker
        .staked
        .checked_mul(global_idx)
        .map_err(|_| ContractError::Overflow)?
        .checked_div(Uint128::from(REWARD_SCALE))
        .map_err(|_| ContractError::Overflow)?;

    let denom = DENOM.load(deps.storage)?;
    let total = TOTAL_STAKED.load(deps.storage)?;
    TOTAL_STAKED.save(deps.storage, &total.saturating_sub(amount))?;

    if staker.staked.is_zero() {
        let count = TOTAL_STAKERS.load(deps.storage)?;
        TOTAL_STAKERS.save(deps.storage, &count.saturating_sub(1))?;
    }

    STAKERS.save(deps.storage, &info.sender, &staker)?;

    let send = BankMsg::Send {
        to_address: info.sender.to_string(),
        amount: vec![Coin { denom, amount }],
    };

    Ok(Response::new()
        .add_message(send)
        .add_attribute("action", "unstake")
        .add_attribute("staker", info.sender.as_str())
        .add_attribute("amount", amount.to_string()))
}

fn execute_claim(
    mut deps: DepsMut,
    env: Env,
    info: MessageInfo,
) -> Result<Response, ContractError> {
    update_global_index(&mut deps, &env)?;

    let global_idx = GLOBAL_REWARD_INDEX.load(deps.storage)?;
    let mut staker =
        STAKERS
            .may_load(deps.storage, &info.sender)?
            .ok_or(ContractError::InsufficientFunds {
                needed: "staked tokens".to_string(),
                available: "none".to_string(),
            })?;

    // Calculate pending
    let reward = staker
        .staked
        .checked_mul(global_idx)
        .map_err(|_| ContractError::Overflow)?
        .checked_div(Uint128::from(REWARD_SCALE))
        .map_err(|_| ContractError::Overflow)?
        .saturating_sub(staker.reward_debt);

    let total_rewards = staker.pending_rewards + reward;
    if total_rewards.is_zero() {
        return Err(ContractError::InsufficientFunds {
            needed: "rewards to claim".to_string(),
            available: "0".to_string(),
        });
    }

    staker.pending_rewards = Uint128::zero();
    staker.reward_debt = staker
        .staked
        .checked_mul(global_idx)
        .map_err(|_| ContractError::Overflow)?
        .checked_div(Uint128::from(REWARD_SCALE))
        .map_err(|_| ContractError::Overflow)?;
    staker.last_claim_height = env.block.height;

    STAKERS.save(deps.storage, &info.sender, &staker)?;

    let denom = DENOM.load(deps.storage)?;
    let send = BankMsg::Send {
        to_address: info.sender.to_string(),
        amount: vec![Coin {
            denom,
            amount: total_rewards,
        }],
    };

    Ok(Response::new()
        .add_message(send)
        .add_attribute("action", "claim_rewards")
        .add_attribute("staker", info.sender.as_str())
        .add_attribute("rewards", total_rewards.to_string()))
}

fn execute_distribute(
    mut deps: DepsMut,
    env: Env,
    _info: MessageInfo,
) -> Result<Response, ContractError> {
    let treasury_share = update_global_index(&mut deps, &env)?;

    let mut resp = Response::new().add_attribute("action", "distribute_emissions");

    // Send treasury share if any
    if !treasury_share.is_zero() {
        let treasury = TREASURY.load(deps.storage)?;
        let denom = DENOM.load(deps.storage)?;
        let send = BankMsg::Send {
            to_address: treasury.to_string(),
            amount: vec![Coin {
                denom,
                amount: treasury_share,
            }],
        };
        resp = resp
            .add_message(send)
            .add_attribute("treasury_share", treasury_share.to_string());
    }

    Ok(resp)
}

fn execute_update_phases(
    deps: DepsMut,
    info: MessageInfo,
    phases: Vec<EmissionPhase>,
) -> Result<Response, ContractError> {
    let admin = ADMIN.load(deps.storage)?;
    if info.sender != admin {
        return Err(ContractError::Unauthorized {
            reason: "Only admin can update emission phases".to_string(),
        });
    }

    PHASES.save(deps.storage, &phases)?;

    Ok(Response::new().add_attribute("action", "update_phases"))
}

fn execute_slash(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    staker_addr: String,
    reason: String,
) -> Result<Response, ContractError> {
    let admin = ADMIN.load(deps.storage)?;
    if info.sender != admin {
        return Err(ContractError::Unauthorized {
            reason: "Only admin/governance can slash".to_string(),
        });
    }

    let penalty_bps = SLASH_PENALTY_BPS.load(deps.storage)?;
    if penalty_bps == 0 {
        return Err(ContractError::Slashing {
            reason: "Slashing is disabled (penalty = 0)".to_string(),
        });
    }

    let addr = deps.api.addr_validate(&staker_addr)?;
    let mut staker = STAKERS
        .may_load(deps.storage, &addr)?
        .ok_or(ContractError::Slashing {
            reason: format!("Staker {} not found", staker_addr),
        })?;

    if staker.staked.is_zero() {
        return Err(ContractError::Slashing {
            reason: "Staker has nothing staked".to_string(),
        });
    }

    // Calculate slash amount
    let slash_amount = staker
        .staked
        .multiply_ratio(penalty_bps as u128, 10_000u128);
    staker.staked = staker.staked.saturating_sub(slash_amount);

    STAKERS.save(deps.storage, &addr, &staker)?;

    // Update global totals
    let total_staked = TOTAL_STAKED.load(deps.storage)?;
    TOTAL_STAKED.save(deps.storage, &total_staked.saturating_sub(slash_amount))?;

    let total_slashed = TOTAL_SLASHED.load(deps.storage)?;
    TOTAL_SLASHED.save(deps.storage, &(total_slashed + slash_amount))?;

    // Record slash event
    let count = SLASH_COUNT.load(deps.storage)?;
    let event_id = count + 1;
    SLASH_EVENTS.save(
        deps.storage,
        event_id,
        &SlashEvent {
            id: event_id,
            staker: addr,
            amount: slash_amount,
            reason: reason.clone(),
            height: env.block.height,
        },
    )?;
    SLASH_COUNT.save(deps.storage, &event_id)?;

    // Remove staker from count if fully slashed
    if staker.staked.is_zero() {
        let stakers = TOTAL_STAKERS.load(deps.storage)?;
        TOTAL_STAKERS.save(deps.storage, &stakers.saturating_sub(1))?;
    }

    Ok(Response::new()
        .add_attribute("action", "slash")
        .add_attribute("staker", staker_addr)
        .add_attribute("amount", slash_amount.to_string())
        .add_attribute("reason", reason))
}

fn execute_update_slash_penalty(
    deps: DepsMut,
    info: MessageInfo,
    slash_penalty_bps: u64,
) -> Result<Response, ContractError> {
    let admin = ADMIN.load(deps.storage)?;
    if info.sender != admin {
        return Err(ContractError::Unauthorized {
            reason: "Only admin can update slash penalty".to_string(),
        });
    }
    if slash_penalty_bps > 10_000 {
        return Err(ContractError::Slashing {
            reason: "Slash penalty cannot exceed 100% (10000 bps)".to_string(),
        });
    }
    SLASH_PENALTY_BPS.save(deps.storage, &slash_penalty_bps)?;
    Ok(Response::new()
        .add_attribute("action", "update_slash_penalty")
        .add_attribute("slash_penalty_bps", slash_penalty_bps.to_string()))
}

// ── Query ───────────────────────────────────────────────────────────

#[entry_point]
pub fn query(deps: Deps, env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Staker { address } => to_json_binary(&query_staker(deps, address)?),
        QueryMsg::PendingRewards { address } => to_json_binary(&query_pending(deps, env, address)?),
        QueryMsg::CurrentEmissionRate {} => to_json_binary(&query_emission_rate(deps, env)?),
        QueryMsg::EmissionSchedule {} => to_json_binary(&query_schedule(deps)?),
        QueryMsg::Supply {} => to_json_binary(&query_supply(deps)?),
        QueryMsg::Config {} => to_json_binary(&query_config(deps)?),
        QueryMsg::SlashHistory { start_after, limit } => {
            to_json_binary(&query_slash_history(deps, start_after, limit)?)
        }
    }
}

fn query_staker(deps: Deps, address: String) -> StdResult<StakerResponse> {
    let addr = deps.api.addr_validate(&address)?;
    let staker = STAKERS
        .may_load(deps.storage, &addr)?
        .unwrap_or(StakerInfo {
            staked: Uint128::zero(),
            reward_debt: Uint128::zero(),
            pending_rewards: Uint128::zero(),
            last_claim_height: 0,
        });

    Ok(StakerResponse {
        address,
        staked: staker.staked,
        pending_rewards: staker.pending_rewards,
        last_claim_height: staker.last_claim_height,
    })
}

fn query_pending(deps: Deps, _env: Env, address: String) -> StdResult<PendingRewardsResponse> {
    let addr = deps.api.addr_validate(&address)?;
    let staker = STAKERS
        .may_load(deps.storage, &addr)?
        .unwrap_or(StakerInfo {
            staked: Uint128::zero(),
            reward_debt: Uint128::zero(),
            pending_rewards: Uint128::zero(),
            last_claim_height: 0,
        });

    let global_idx = GLOBAL_REWARD_INDEX.load(deps.storage)?;

    let reward = if staker.staked.is_zero() {
        Uint128::zero()
    } else {
        staker
            .staked
            .checked_mul(global_idx)
            .unwrap_or(Uint128::zero())
            .checked_div(Uint128::from(REWARD_SCALE))
            .unwrap_or(Uint128::zero())
            .saturating_sub(staker.reward_debt)
    };

    Ok(PendingRewardsResponse {
        rewards: staker.pending_rewards + reward,
    })
}

fn query_emission_rate(deps: Deps, env: Env) -> StdResult<EmissionRateResponse> {
    let phases = PHASES.load(deps.storage)?;
    let height = env.block.height;

    for phase in &phases {
        if height >= phase.start_block && (phase.end_block == 0 || height <= phase.end_block) {
            let remaining = if phase.end_block == 0 {
                u64::MAX
            } else {
                phase.end_block.saturating_sub(height)
            };
            return Ok(EmissionRateResponse {
                current_phase: phase.label.clone(),
                tokens_per_block: phase.tokens_per_block,
                blocks_remaining_in_phase: remaining,
            });
        }
    }

    Ok(EmissionRateResponse {
        current_phase: "None".to_string(),
        tokens_per_block: Uint128::zero(),
        blocks_remaining_in_phase: 0,
    })
}

fn query_schedule(deps: Deps) -> StdResult<EmissionScheduleResponse> {
    Ok(EmissionScheduleResponse {
        phases: PHASES.load(deps.storage)?,
    })
}

fn query_supply(deps: Deps) -> StdResult<SupplyResponse> {
    let max = MAX_SUPPLY.load(deps.storage)?;
    let minted = TOTAL_MINTED.load(deps.storage)?;
    let staked = TOTAL_STAKED.load(deps.storage)?;
    Ok(SupplyResponse {
        max_supply: max,
        total_minted: minted,
        total_staked: staked,
        remaining_to_mint: max.saturating_sub(minted),
    })
}

fn query_config(deps: Deps) -> StdResult<StakingConfigResponse> {
    Ok(StakingConfigResponse {
        admin: ADMIN.load(deps.storage)?.to_string(),
        denom: DENOM.load(deps.storage)?,
        max_supply: MAX_SUPPLY.load(deps.storage)?,
        treasury: TREASURY.load(deps.storage)?.to_string(),
        treasury_share_bps: TREASURY_SHARE_BPS.load(deps.storage)?,
        total_staked: TOTAL_STAKED.load(deps.storage)?,
        total_stakers: TOTAL_STAKERS.load(deps.storage)?,
        last_distribution_height: LAST_DISTRIBUTION_HEIGHT.load(deps.storage)?,
        slash_penalty_bps: SLASH_PENALTY_BPS.load(deps.storage)?,
        total_slashed: TOTAL_SLASHED.load(deps.storage)?,
    })
}

fn query_slash_history(
    deps: Deps,
    start_after: Option<u64>,
    limit: Option<u32>,
) -> StdResult<SlashHistoryResponse> {
    use cosmwasm_std::Order;
    let limit = limit.unwrap_or(30).min(100) as usize;
    let start = start_after.map(cw_storage_plus::Bound::exclusive);

    let events: Vec<SlashEventResponse> = SLASH_EVENTS
        .range(deps.storage, start, None, Order::Ascending)
        .take(limit)
        .filter_map(|r| r.ok())
        .map(|(_, e)| SlashEventResponse {
            id: e.id,
            staker: e.staker.to_string(),
            amount: e.amount,
            reason: e.reason,
            height: e.height,
        })
        .collect();

    Ok(SlashHistoryResponse { events })
}

// ── Tests ───────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use cosmwasm_std::coins;
    use cosmwasm_std::testing::{message_info, mock_dependencies, mock_env, MockApi};

    fn setup(deps: DepsMut) {
        let api = MockApi::default();
        let admin_addr = api.addr_make("admin");
        let treasury_addr = api.addr_make("treasury");
        let creator_addr = api.addr_make("creator");
        let msg = InstantiateMsg {
            admin: admin_addr.to_string(),
            max_supply: Uint128::new(1_000_000_000_000), // 1 trillion
            initial_supply: Uint128::new(100_000_000_000), // 100 billion genesis
            denom: "ucitizen".to_string(),
            phases: vec![
                EmissionPhase {
                    label: "Year 1".to_string(),
                    start_block: 0,
                    end_block: 5_256_000, // ~1 year at 6s blocks
                    tokens_per_block: Uint128::new(100_000),
                },
                EmissionPhase {
                    label: "Year 2-3".to_string(),
                    start_block: 5_256_001,
                    end_block: 15_768_000,
                    tokens_per_block: Uint128::new(50_000),
                },
            ],
            treasury: treasury_addr.to_string(),
            treasury_share_bps: 2000, // 20% to treasury
            slash_penalty_bps: 1000,  // 10% slash
        };
        let info = message_info(&creator_addr, &[]);
        instantiate(deps, mock_env(), info, msg).unwrap();
    }

    #[test]
    fn test_instantiate() {
        let mut deps = mock_dependencies();
        setup(deps.as_mut());

        let supply = query_supply(deps.as_ref()).unwrap();
        assert_eq!(supply.max_supply, Uint128::new(1_000_000_000_000));
        assert_eq!(supply.total_minted, Uint128::new(100_000_000_000));
    }

    #[test]
    fn test_stake() {
        let mut deps = mock_dependencies();
        setup(deps.as_mut());

        let staker1_addr = deps.api.addr_make("staker1");
        let info = message_info(&staker1_addr, &coins(1_000_000, "ucitizen"));
        let res = execute(deps.as_mut(), mock_env(), info, ExecuteMsg::Stake {}).unwrap();
        assert_eq!(res.attributes[0].value, "stake");

        let staker = query_staker(deps.as_ref(), staker1_addr.to_string()).unwrap();
        assert_eq!(staker.staked, Uint128::new(1_000_000));

        let supply = query_supply(deps.as_ref()).unwrap();
        assert_eq!(supply.total_staked, Uint128::new(1_000_000));
    }

    #[test]
    fn test_emission_rate() {
        let mut deps = mock_dependencies();
        setup(deps.as_mut());

        let rate = query_emission_rate(deps.as_ref(), mock_env()).unwrap();
        assert_eq!(rate.current_phase, "Year 1");
        assert_eq!(rate.tokens_per_block, Uint128::new(100_000));
    }

    #[test]
    fn test_slash_staker() {
        let mut deps = mock_dependencies();
        setup(deps.as_mut());

        // Stake 1_000_000
        let staker1_addr = deps.api.addr_make("staker1");
        let info = message_info(&staker1_addr, &coins(1_000_000, "ucitizen"));
        execute(deps.as_mut(), mock_env(), info, ExecuteMsg::Stake {}).unwrap();

        // Slash (10% penalty = 100_000)
        let admin_addr = deps.api.addr_make("admin");
        let admin_info = message_info(&admin_addr, &[]);
        let res = execute(
            deps.as_mut(),
            mock_env(),
            admin_info,
            ExecuteMsg::Slash {
                staker: staker1_addr.to_string(),
                reason: "Double-signing violation".to_string(),
            },
        )
        .unwrap();
        assert_eq!(res.attributes[0].value, "slash");
        assert_eq!(res.attributes[2].value, "100000"); // 10% of 1M

        // Verify staker balance reduced
        let staker = query_staker(deps.as_ref(), staker1_addr.to_string()).unwrap();
        assert_eq!(staker.staked, Uint128::new(900_000));

        // Verify config reflects slashing totals
        let config = query_config(deps.as_ref()).unwrap();
        assert_eq!(config.total_slashed, Uint128::new(100_000));
        assert_eq!(config.total_staked, Uint128::new(900_000));

        // Verify slash history
        let history = query_slash_history(deps.as_ref(), None, None).unwrap();
        assert_eq!(history.events.len(), 1);
        assert_eq!(history.events[0].reason, "Double-signing violation");
    }

    #[test]
    fn test_non_admin_cannot_slash() {
        let mut deps = mock_dependencies();
        setup(deps.as_mut());

        let staker1_addr = deps.api.addr_make("staker1");
        let info = message_info(&staker1_addr, &coins(1_000_000, "ucitizen"));
        execute(deps.as_mut(), mock_env(), info, ExecuteMsg::Stake {}).unwrap();

        // Non-admin tries to slash
        let rando_addr = deps.api.addr_make("rando");
        let rando_info = message_info(&rando_addr, &[]);
        let err = execute(
            deps.as_mut(),
            mock_env(),
            rando_info,
            ExecuteMsg::Slash {
                staker: staker1_addr.to_string(),
                reason: "Attempted unauthorized slash".to_string(),
            },
        )
        .unwrap_err();
        assert!(matches!(err, ContractError::Unauthorized { .. }));
    }
}
