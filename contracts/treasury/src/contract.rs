use cosmwasm_std::{
    entry_point, to_json_binary, BankMsg, Binary, Coin, Deps, DepsMut, Env, MessageInfo, Order,
    Response, StdResult, Uint128,
};
use cw2::{get_contract_version, set_contract_version};

use citizen_common::errors::ContractError;
use citizen_common::treasury::FundCategory;

use crate::msg::*;
use crate::state::*;

const CONTRACT_NAME: &str = "crates.io:citizen-treasury";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

// ── Instantiate ─────────────────────────────────────────────────────

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;

    let admin = deps.api.addr_validate(&msg.admin)?;
    let gov = deps.api.addr_validate(&msg.governance_contract)?;

    ADMIN.save(deps.storage, &admin)?;
    GOVERNANCE.save(deps.storage, &gov)?;
    DENOM.save(deps.storage, &msg.denom)?;
    TOTAL_DEPOSITED.save(deps.storage, &Uint128::zero())?;
    TOTAL_SPENT.save(deps.storage, &Uint128::zero())?;
    SPEND_COUNT.save(deps.storage, &0u64)?;

    // Validate allocations sum to 10000 bps
    let total_bps: u64 = msg.allocations.iter().map(|(_, bps)| bps).sum();
    if total_bps != 10000 {
        return Err(ContractError::InvalidAllocation {
            reason: format!("Allocations must sum to 10000 bps, got {}", total_bps),
        });
    }

    for (cat, bps) in &msg.allocations {
        ALLOCATIONS.save(deps.storage, cat.to_string(), bps)?;
    }

    Ok(Response::new()
        .add_attribute("action", "instantiate")
        .add_attribute("admin", admin.as_str())
        .add_attribute("governance", gov.as_str())
        .add_attribute("denom", &msg.denom))
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
        ExecuteMsg::Deposit {} => execute_deposit(deps, info),
        ExecuteMsg::Spend {
            recipient,
            amount,
            category,
            memo,
        } => execute_spend(deps, env, info, recipient, amount, category, memo),
        ExecuteMsg::UpdateAllocations { allocations } => {
            execute_update_allocations(deps, info, allocations)
        }
        ExecuteMsg::UpdateGovernance {
            governance_contract,
        } => execute_update_governance(deps, info, governance_contract),
        ExecuteMsg::TransferAdmin { new_admin } => execute_transfer_admin(deps, info, new_admin),
    }
}

fn execute_deposit(deps: DepsMut, info: MessageInfo) -> Result<Response, ContractError> {
    let denom = DENOM.load(deps.storage)?;
    let deposit = info
        .funds
        .iter()
        .find(|c| c.denom == denom)
        .map(|c| c.amount)
        .unwrap_or(Uint128::zero());

    if deposit.is_zero() {
        return Err(ContractError::InsufficientFunds {
            needed: "more than 0".to_string(),
            available: "0".to_string(),
        });
    }

    let total = TOTAL_DEPOSITED.load(deps.storage)?;
    TOTAL_DEPOSITED.save(deps.storage, &(total + deposit))?;

    Ok(Response::new()
        .add_attribute("action", "deposit")
        .add_attribute("depositor", info.sender.as_str())
        .add_attribute("amount", deposit.to_string()))
}

fn execute_spend(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    recipient: String,
    amount: Uint128,
    category: FundCategory,
    memo: String,
) -> Result<Response, ContractError> {
    // Only governance contract can authorize spends
    let gov = GOVERNANCE.load(deps.storage)?;
    if info.sender != gov {
        return Err(ContractError::Unauthorized {
            reason: "Only governance contract can authorize spending".to_string(),
        });
    }

    let denom = DENOM.load(deps.storage)?;
    let recipient_addr = deps.api.addr_validate(&recipient)?;

    // Record the spend
    let count = SPEND_COUNT.load(deps.storage)?;
    let record = SpendRecord {
        id: count + 1,
        recipient: recipient_addr.clone(),
        amount,
        category: category.clone(),
        memo: memo.clone(),
        timestamp: env.block.time.seconds(),
    };
    SPEND_RECORDS.save(deps.storage, count + 1, &record)?;
    SPEND_COUNT.save(deps.storage, &(count + 1))?;

    // Update totals
    let total_spent = TOTAL_SPENT.load(deps.storage)?;
    TOTAL_SPENT.save(deps.storage, &(total_spent + amount))?;

    let cat_key = category.to_string();
    let cat_spent = CATEGORY_SPENT
        .may_load(deps.storage, cat_key.clone())?
        .unwrap_or(Uint128::zero());
    CATEGORY_SPENT.save(deps.storage, cat_key, &(cat_spent + amount))?;

    // Send funds
    let send_msg = BankMsg::Send {
        to_address: recipient.clone(),
        amount: vec![Coin { denom, amount }],
    };

    Ok(Response::new()
        .add_message(send_msg)
        .add_attribute("action", "spend")
        .add_attribute("recipient", recipient)
        .add_attribute("amount", amount.to_string())
        .add_attribute("category", category.to_string())
        .add_attribute("memo", memo))
}

fn execute_update_allocations(
    deps: DepsMut,
    info: MessageInfo,
    allocations: Vec<(FundCategory, u64)>,
) -> Result<Response, ContractError> {
    let gov = GOVERNANCE.load(deps.storage)?;
    if info.sender != gov {
        return Err(ContractError::Unauthorized {
            reason: "Only governance can update allocations".to_string(),
        });
    }

    let total_bps: u64 = allocations.iter().map(|(_, bps)| bps).sum();
    if total_bps != 10000 {
        return Err(ContractError::InvalidAllocation {
            reason: format!("Must sum to 10000 bps, got {}", total_bps),
        });
    }

    // Clear old and save new
    let keys: Vec<String> = ALLOCATIONS
        .range(deps.storage, None, None, Order::Ascending)
        .filter_map(|r| r.ok())
        .map(|(k, _)| k)
        .collect();
    for k in keys {
        ALLOCATIONS.remove(deps.storage, k);
    }
    for (cat, bps) in &allocations {
        ALLOCATIONS.save(deps.storage, cat.to_string(), bps)?;
    }

    Ok(Response::new().add_attribute("action", "update_allocations"))
}

fn execute_update_governance(
    deps: DepsMut,
    info: MessageInfo,
    governance_contract: String,
) -> Result<Response, ContractError> {
    let admin = ADMIN.load(deps.storage)?;
    if info.sender != admin {
        return Err(ContractError::Unauthorized {
            reason: "Only admin can update governance contract".to_string(),
        });
    }
    let gov = deps.api.addr_validate(&governance_contract)?;
    GOVERNANCE.save(deps.storage, &gov)?;
    Ok(Response::new()
        .add_attribute("action", "update_governance")
        .add_attribute("governance", governance_contract))
}

fn execute_transfer_admin(
    deps: DepsMut,
    info: MessageInfo,
    new_admin: String,
) -> Result<Response, ContractError> {
    let admin = ADMIN.load(deps.storage)?;
    if info.sender != admin {
        return Err(ContractError::Unauthorized {
            reason: "Only admin can transfer admin".to_string(),
        });
    }
    let new = deps.api.addr_validate(&new_admin)?;
    ADMIN.save(deps.storage, &new)?;
    Ok(Response::new()
        .add_attribute("action", "transfer_admin")
        .add_attribute("new_admin", new_admin))
}

// ── Query ───────────────────────────────────────────────────────────

#[entry_point]
pub fn query(deps: Deps, env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Balance {} => to_json_binary(&query_balance(deps, env)?),
        QueryMsg::Allocations {} => to_json_binary(&query_allocations(deps)?),
        QueryMsg::SpendHistory { start_after, limit } => {
            to_json_binary(&query_spend_history(deps, start_after, limit)?)
        }
        QueryMsg::CategorySpend { category } => {
            to_json_binary(&query_category_spend(deps, category)?)
        }
        QueryMsg::Config {} => to_json_binary(&query_config(deps)?),
    }
}

fn query_balance(deps: Deps, env: Env) -> StdResult<BalanceResponse> {
    let denom = DENOM.load(deps.storage)?;
    let balance = deps.querier.query_balance(&env.contract.address, &denom)?;

    let allocs: Vec<(FundCategory, Uint128)> = ALLOCATIONS
        .range(deps.storage, None, None, Order::Ascending)
        .filter_map(|r| r.ok())
        .map(|(cat_str, bps)| {
            let allocated = balance.amount.multiply_ratio(bps, 10000u128);
            // Parse category back — simplified
            let cat = match cat_str.as_str() {
                "research" => FundCategory::Research,
                "healthcare" => FundCategory::Healthcare,
                "infrastructure" => FundCategory::Infrastructure,
                "education" => FundCategory::Education,
                "emergency" => FundCategory::Emergency,
                "node_incentives" => FundCategory::NodeIncentives,
                other => FundCategory::Custom(other.to_string()),
            };
            (cat, allocated)
        })
        .collect();

    Ok(BalanceResponse {
        denom,
        total: balance.amount,
        allocated: allocs,
    })
}

fn query_allocations(deps: Deps) -> StdResult<AllocationsResponse> {
    let allocs: Vec<(FundCategory, u64)> = ALLOCATIONS
        .range(deps.storage, None, None, Order::Ascending)
        .filter_map(|r| r.ok())
        .map(|(cat_str, bps)| {
            let cat = match cat_str.as_str() {
                "research" => FundCategory::Research,
                "healthcare" => FundCategory::Healthcare,
                "infrastructure" => FundCategory::Infrastructure,
                "education" => FundCategory::Education,
                "emergency" => FundCategory::Emergency,
                "node_incentives" => FundCategory::NodeIncentives,
                other => FundCategory::Custom(other.to_string()),
            };
            (cat, bps)
        })
        .collect();
    Ok(AllocationsResponse {
        allocations: allocs,
    })
}

fn query_spend_history(
    deps: Deps,
    start_after: Option<u64>,
    limit: Option<u32>,
) -> StdResult<SpendHistoryResponse> {
    let limit = limit.unwrap_or(30).min(100) as usize;
    let start = start_after.map(cw_storage_plus::Bound::exclusive);

    let records: Vec<SpendRecordResponse> = SPEND_RECORDS
        .range(deps.storage, start, None, Order::Ascending)
        .take(limit)
        .filter_map(|r| r.ok())
        .map(|(_, rec)| SpendRecordResponse {
            id: rec.id,
            recipient: rec.recipient.to_string(),
            amount: rec.amount,
            category: rec.category,
            memo: rec.memo,
            timestamp: rec.timestamp,
        })
        .collect();

    Ok(SpendHistoryResponse { records })
}

fn query_category_spend(deps: Deps, category: FundCategory) -> StdResult<CategorySpendResponse> {
    let spent = CATEGORY_SPENT
        .may_load(deps.storage, category.to_string())?
        .unwrap_or(Uint128::zero());
    Ok(CategorySpendResponse {
        category,
        total_spent: spent,
    })
}

fn query_config(deps: Deps) -> StdResult<TreasuryConfigResponse> {
    Ok(TreasuryConfigResponse {
        admin: ADMIN.load(deps.storage)?.to_string(),
        governance_contract: GOVERNANCE.load(deps.storage)?.to_string(),
        denom: DENOM.load(deps.storage)?,
        total_deposited: TOTAL_DEPOSITED.load(deps.storage)?,
        total_spent: TOTAL_SPENT.load(deps.storage)?,
    })
}

// ── Migrate ─────────────────────────────────────────────────────────

#[entry_point]
pub fn migrate(deps: DepsMut, _env: Env, _msg: MigrateMsg) -> Result<Response, ContractError> {
    let version = get_contract_version(deps.storage)?;
    if version.contract != CONTRACT_NAME {
        return Err(ContractError::Unauthorized {
            reason: format!("Cannot migrate from {}", version.contract),
        });
    }
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    Ok(Response::new()
        .add_attribute("action", "migrate")
        .add_attribute("from_version", version.version)
        .add_attribute("to_version", CONTRACT_VERSION))
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
        let governance_addr = api.addr_make("governance");
        let creator_addr = api.addr_make("creator");
        let msg = InstantiateMsg {
            admin: admin_addr.to_string(),
            governance_contract: governance_addr.to_string(),
            denom: "ucitizen".to_string(),
            allocations: vec![
                (FundCategory::Research, 3000),
                (FundCategory::Healthcare, 3000),
                (FundCategory::Infrastructure, 2000),
                (FundCategory::NodeIncentives, 1000),
                (FundCategory::Emergency, 1000),
            ],
        };
        let info = message_info(&creator_addr, &[]);
        instantiate(deps, mock_env(), info, msg).unwrap();
    }

    #[test]
    fn test_instantiate() {
        let mut deps = mock_dependencies();
        setup(deps.as_mut());
        let config = query_config(deps.as_ref()).unwrap();
        let admin_addr = deps.api.addr_make("admin");
        assert_eq!(config.admin, admin_addr.to_string());
        assert_eq!(config.denom, "ucitizen");
    }

    #[test]
    fn test_deposit() {
        let mut deps = mock_dependencies();
        setup(deps.as_mut());

        let donor_addr = deps.api.addr_make("donor");
        let info = message_info(&donor_addr, &coins(1_000_000, "ucitizen"));
        let res = execute(deps.as_mut(), mock_env(), info, ExecuteMsg::Deposit {}).unwrap();
        assert_eq!(res.attributes[0].value, "deposit");

        let config = query_config(deps.as_ref()).unwrap();
        assert_eq!(config.total_deposited, Uint128::new(1_000_000));
    }

    #[test]
    fn test_unauthorized_spend() {
        let mut deps = mock_dependencies();
        setup(deps.as_mut());

        let random_addr = deps.api.addr_make("random");
        let researcher_addr = deps.api.addr_make("researcher");
        let info = message_info(&random_addr, &[]);
        let msg = ExecuteMsg::Spend {
            recipient: researcher_addr.to_string(),
            amount: Uint128::new(100),
            category: FundCategory::Research,
            memo: "test".to_string(),
        };
        let err = execute(deps.as_mut(), mock_env(), info, msg).unwrap_err();
        assert!(matches!(err, ContractError::Unauthorized { .. }));
    }

    #[test]
    fn test_invalid_allocations() {
        let mut deps = mock_dependencies();
        let admin_addr = deps.api.addr_make("admin");
        let governance_addr = deps.api.addr_make("governance");
        let creator_addr = deps.api.addr_make("creator");
        let msg = InstantiateMsg {
            admin: admin_addr.to_string(),
            governance_contract: governance_addr.to_string(),
            denom: "ucitizen".to_string(),
            allocations: vec![
                (FundCategory::Research, 5000),
                (FundCategory::Healthcare, 3000),
                // Only 8000, not 10000
            ],
        };
        let info = message_info(&creator_addr, &[]);
        let err = instantiate(deps.as_mut(), mock_env(), info, msg).unwrap_err();
        assert!(matches!(err, ContractError::InvalidAllocation { .. }));
    }
}
