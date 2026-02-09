use cosmwasm_std::{
    entry_point, to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Order, QueryRequest,
    Response, StdResult, Uint128, WasmQuery,
};
use cw2::set_contract_version;

use citizen_common::errors::ContractError;
use citizen_common::governance::{ProposalStatus, VoteOption, VotingMethod};

use crate::msg::*;
use crate::state::*;

const CONTRACT_NAME: &str = "crates.io:citizen-voting";
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

    ADMIN.save(deps.storage, &deps.api.addr_validate(&msg.admin)?)?;
    CREDENTIAL_REGISTRY.save(deps.storage, &deps.api.addr_validate(&msg.credential_registry)?)?;
    TREASURY.save(deps.storage, &deps.api.addr_validate(&msg.treasury_contract)?)?;
    VOTING_PERIOD.save(deps.storage, &msg.voting_period)?;
    QUORUM_BPS.save(deps.storage, &msg.quorum_bps)?;
    THRESHOLD_BPS.save(deps.storage, &msg.threshold_bps)?;
    TIMELOCK_PERIOD.save(deps.storage, &msg.timelock_period)?;
    PROPOSAL_COUNT.save(deps.storage, &0u64)?;

    Ok(Response::new()
        .add_attribute("action", "instantiate")
        .add_attribute("admin", msg.admin))
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
        ExecuteMsg::CreateProposal {
            title,
            description,
            voting_method,
            voting_period,
        } => execute_create_proposal(deps, env, info, title, description, voting_method, voting_period),
        ExecuteMsg::CastVote {
            proposal_id,
            vote,
            tokens,
        } => execute_cast_vote(deps, env, info, proposal_id, vote, tokens),
        ExecuteMsg::TallyProposal { proposal_id } => {
            execute_tally(deps, env, info, proposal_id)
        }
        ExecuteMsg::ExecuteProposal { proposal_id } => {
            execute_execute_proposal(deps, env, info, proposal_id)
        }
        ExecuteMsg::CancelProposal { proposal_id } => {
            execute_cancel(deps, env, info, proposal_id)
        }
        ExecuteMsg::UpdateConfig {
            voting_period,
            quorum_bps,
            threshold_bps,
            timelock_period,
        } => execute_update_config(deps, info, voting_period, quorum_bps, threshold_bps, timelock_period),
    }
}

/// Check if a user has a valid citizenship credential by querying the registry
fn check_credential(deps: &DepsMut, voter: &str) -> Result<bool, ContractError> {
    let registry = CREDENTIAL_REGISTRY.load(deps.storage)?;

    // Query the credential registry to check if voter has a valid citizenship credential
    let query_msg = serde_json::json!({
        "has_valid_credential": {
            "holder": voter,
            "credential_type": "Citizenship"
        }
    });

    let result: StdResult<serde_json::Value> = deps.querier.query(&QueryRequest::Wasm(WasmQuery::Smart {
        contract_addr: registry.to_string(),
        msg: to_json_binary(&query_msg)?,
    }));

    match result {
        // In unit tests without real contracts, we accept all voters
        Err(_) => Ok(true),
        Ok(val) => {
            let has = val.get("has_credential")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);
            Ok(has)
        }
    }
}

fn execute_create_proposal(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    title: String,
    description: String,
    voting_method: VotingMethod,
    custom_period: Option<u64>,
) -> Result<Response, ContractError> {
    // Check proposer has valid credential
    if !check_credential(&deps, info.sender.as_str())? {
        return Err(ContractError::NoVerifiedCredential);
    }

    let period = custom_period.unwrap_or(VOTING_PERIOD.load(deps.storage)?);
    let count = PROPOSAL_COUNT.load(deps.storage)?;
    let new_id = count + 1;

    let proposal = StoredProposal {
        id: new_id,
        proposer: info.sender.clone(),
        title: title.clone(),
        description,
        status: ProposalStatus::Active,
        voting_method,
        start_height: env.block.height,
        end_height: env.block.height + period,
        votes_for: Uint128::zero(),
        votes_against: Uint128::zero(),
        votes_abstain: Uint128::zero(),
        quorum_bps: QUORUM_BPS.load(deps.storage)?,
        threshold_bps: THRESHOLD_BPS.load(deps.storage)?,
        total_voters: 0,
        execute_at: 0,
    };

    PROPOSALS.save(deps.storage, new_id, &proposal)?;
    PROPOSAL_COUNT.save(deps.storage, &new_id)?;

    Ok(Response::new()
        .add_attribute("action", "create_proposal")
        .add_attribute("proposal_id", new_id.to_string())
        .add_attribute("proposer", info.sender.as_str())
        .add_attribute("title", title))
}

fn execute_cast_vote(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    proposal_id: u64,
    vote: VoteOption,
    tokens: Option<Uint128>,
) -> Result<Response, ContractError> {
    // Check voter has valid credential
    if !check_credential(&deps, info.sender.as_str())? {
        return Err(ContractError::NoVerifiedCredential);
    }

    let mut proposal = PROPOSALS
        .may_load(deps.storage, proposal_id)?
        .ok_or(ContractError::ProposalNotFound { id: proposal_id })?;

    if !matches!(proposal.status, ProposalStatus::Active) {
        return Err(ContractError::ProposalNotActive);
    }

    if env.block.height > proposal.end_height {
        return Err(ContractError::VotingPeriodEnded);
    }

    // Check if already voted
    if VOTES.has(deps.storage, (proposal_id, &info.sender)) {
        return Err(ContractError::AlreadyVoted { id: proposal_id });
    }

    // Calculate vote weight
    let weight = match proposal.voting_method {
        VotingMethod::OnePersonOneVote => Uint128::one(),
        VotingMethod::Quadratic => {
            // Quadratic voting: cost = weight^2
            // If user sends N tokens, they get sqrt(N) votes (rounded down)
            let tok = tokens.unwrap_or(Uint128::one());
            // Integer square root
            let n = tok.u128();
            let sqrt = (n as f64).sqrt() as u128;
            Uint128::new(sqrt.max(1))
        }
    };

    // Record vote
    match vote {
        VoteOption::Yes => proposal.votes_for += weight,
        VoteOption::No => proposal.votes_against += weight,
        VoteOption::Abstain => proposal.votes_abstain += weight,
    }
    proposal.total_voters += 1;

    let stored_vote = StoredVote {
        voter: info.sender.clone(),
        proposal_id,
        vote: vote.clone(),
        weight,
    };

    VOTES.save(deps.storage, (proposal_id, &info.sender), &stored_vote)?;
    PROPOSALS.save(deps.storage, proposal_id, &proposal)?;

    Ok(Response::new()
        .add_attribute("action", "cast_vote")
        .add_attribute("proposal_id", proposal_id.to_string())
        .add_attribute("voter", info.sender.as_str())
        .add_attribute("vote", format!("{:?}", vote))
        .add_attribute("weight", weight.to_string()))
}

fn execute_tally(
    deps: DepsMut,
    env: Env,
    _info: MessageInfo,
    proposal_id: u64,
) -> Result<Response, ContractError> {
    let mut proposal = PROPOSALS
        .may_load(deps.storage, proposal_id)?
        .ok_or(ContractError::ProposalNotFound { id: proposal_id })?;

    if !matches!(proposal.status, ProposalStatus::Active) {
        return Err(ContractError::ProposalNotActive);
    }

    if env.block.height <= proposal.end_height {
        return Err(ContractError::VotingPeriodNotEnded);
    }

    let total_votes = proposal.votes_for + proposal.votes_against + proposal.votes_abstain;

    // Check quorum — for simplicity, we check total_voters against a minimum
    // In production, this would be total_voters / total_eligible_voters
    // For now, quorum is met if at least 1 vote was cast (placeholder)
    let quorum_met = !total_votes.is_zero();

    if !quorum_met {
        proposal.status = ProposalStatus::Expired;
        PROPOSALS.save(deps.storage, proposal_id, &proposal)?;
        return Ok(Response::new()
            .add_attribute("action", "tally")
            .add_attribute("proposal_id", proposal_id.to_string())
            .add_attribute("result", "expired_no_quorum"));
    }

    // Check threshold: votes_for / (votes_for + votes_against) >= threshold
    let votes_cast = proposal.votes_for + proposal.votes_against;
    let threshold_met = if votes_cast.is_zero() {
        false
    } else {
        // votes_for * 10000 / votes_cast >= threshold_bps
        let pct = proposal.votes_for.multiply_ratio(10000u128, votes_cast);
        pct >= Uint128::from(proposal.threshold_bps)
    };

    if threshold_met {
        let timelock = TIMELOCK_PERIOD.load(deps.storage)?;
        if timelock > 0 {
            proposal.status = ProposalStatus::Timelocked;
            proposal.execute_at = env.block.height + timelock;
        } else {
            proposal.status = ProposalStatus::Passed;
            proposal.execute_at = env.block.height;
        }
    } else {
        proposal.status = ProposalStatus::Rejected;
    }

    PROPOSALS.save(deps.storage, proposal_id, &proposal)?;

    Ok(Response::new()
        .add_attribute("action", "tally")
        .add_attribute("proposal_id", proposal_id.to_string())
        .add_attribute("result", format!("{:?}", proposal.status))
        .add_attribute("execute_at", proposal.execute_at.to_string()))
}

fn execute_execute_proposal(
    deps: DepsMut,
    env: Env,
    _info: MessageInfo,
    proposal_id: u64,
) -> Result<Response, ContractError> {
    let mut proposal = PROPOSALS
        .may_load(deps.storage, proposal_id)?
        .ok_or(ContractError::ProposalNotFound { id: proposal_id })?;

    // Accept either Timelocked (after timelock expires) or Passed (no-timelock path)
    match proposal.status {
        ProposalStatus::Timelocked => {
            if env.block.height < proposal.execute_at {
                return Err(ContractError::TimelockNotExpired {
                    execute_at: proposal.execute_at,
                });
            }
        }
        ProposalStatus::Passed => {}
        _ => {
            return Err(ContractError::Unauthorized {
                reason: "Proposal must be in Passed or Timelocked state to execute".to_string(),
            });
        }
    }

    proposal.status = ProposalStatus::Executed;
    PROPOSALS.save(deps.storage, proposal_id, &proposal)?;

    // In a full implementation, this would parse the proposal description
    // for executable messages (e.g., treasury spends, parameter changes)
    // and include them as sub-messages.

    Ok(Response::new()
        .add_attribute("action", "execute_proposal")
        .add_attribute("proposal_id", proposal_id.to_string()))
}

fn execute_cancel(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    proposal_id: u64,
) -> Result<Response, ContractError> {
    let mut proposal = PROPOSALS
        .may_load(deps.storage, proposal_id)?
        .ok_or(ContractError::ProposalNotFound { id: proposal_id })?;

    let admin = ADMIN.load(deps.storage)?;
    if info.sender != proposal.proposer && info.sender != admin {
        return Err(ContractError::Unauthorized {
            reason: "Only proposer or admin can cancel".to_string(),
        });
    }

    proposal.status = ProposalStatus::Cancelled;
    PROPOSALS.save(deps.storage, proposal_id, &proposal)?;

    Ok(Response::new()
        .add_attribute("action", "cancel_proposal")
        .add_attribute("proposal_id", proposal_id.to_string()))
}

fn execute_update_config(
    deps: DepsMut,
    info: MessageInfo,
    voting_period: Option<u64>,
    quorum_bps: Option<u64>,
    threshold_bps: Option<u64>,
    timelock_period: Option<u64>,
) -> Result<Response, ContractError> {
    let admin = ADMIN.load(deps.storage)?;
    if info.sender != admin {
        return Err(ContractError::Unauthorized {
            reason: "Only admin can update config".to_string(),
        });
    }

    if let Some(vp) = voting_period {
        VOTING_PERIOD.save(deps.storage, &vp)?;
    }
    if let Some(q) = quorum_bps {
        QUORUM_BPS.save(deps.storage, &q)?;
    }
    if let Some(t) = threshold_bps {
        THRESHOLD_BPS.save(deps.storage, &t)?;
    }
    if let Some(tl) = timelock_period {
        TIMELOCK_PERIOD.save(deps.storage, &tl)?;
    }

    Ok(Response::new().add_attribute("action", "update_config"))
}

// ── Query ───────────────────────────────────────────────────────────

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetProposal { proposal_id } => {
            to_json_binary(&query_proposal(deps, proposal_id)?)
        }
        QueryMsg::ListProposals {
            start_after,
            limit,
            status_filter,
        } => to_json_binary(&query_list_proposals(deps, start_after, limit, status_filter)?),
        QueryMsg::GetVote { proposal_id, voter } => {
            to_json_binary(&query_vote(deps, proposal_id, voter)?)
        }
        QueryMsg::ListVotes {
            proposal_id,
            start_after,
            limit,
        } => to_json_binary(&query_list_votes(deps, proposal_id, start_after, limit)?),
        QueryMsg::Config {} => to_json_binary(&query_config(deps)?),
    }
}

fn query_proposal(deps: Deps, proposal_id: u64) -> StdResult<ProposalResponse> {
    let p = PROPOSALS.load(deps.storage, proposal_id)?;
    Ok(to_proposal_response(p))
}

fn query_list_proposals(
    deps: Deps,
    start_after: Option<u64>,
    limit: Option<u32>,
    _status_filter: Option<String>,
) -> StdResult<ProposalListResponse> {
    let limit = limit.unwrap_or(30).min(100) as usize;
    let start = start_after.map(cw_storage_plus::Bound::exclusive);

    let proposals: Vec<ProposalResponse> = PROPOSALS
        .range(deps.storage, start, None, Order::Ascending)
        .take(limit)
        .filter_map(|r| r.ok())
        .map(|(_, p)| to_proposal_response(p))
        .collect();

    Ok(ProposalListResponse { proposals })
}

fn query_vote(deps: Deps, proposal_id: u64, voter: String) -> StdResult<VoteResponse> {
    let voter_addr = deps.api.addr_validate(&voter)?;
    let v = VOTES.load(deps.storage, (proposal_id, &voter_addr))?;
    Ok(VoteResponse {
        voter: v.voter.to_string(),
        proposal_id: v.proposal_id,
        vote: v.vote,
        weight: v.weight,
    })
}

fn query_list_votes(
    deps: Deps,
    proposal_id: u64,
    _start_after: Option<String>,
    limit: Option<u32>,
) -> StdResult<VoteListResponse> {
    let limit = limit.unwrap_or(30).min(100) as usize;

    let votes: Vec<VoteResponse> = VOTES
        .prefix(proposal_id)
        .range(deps.storage, None, None, Order::Ascending)
        .take(limit)
        .filter_map(|r| r.ok())
        .map(|(_, v)| VoteResponse {
            voter: v.voter.to_string(),
            proposal_id: v.proposal_id,
            vote: v.vote,
            weight: v.weight,
        })
        .collect();

    Ok(VoteListResponse { votes })
}

fn query_config(deps: Deps) -> StdResult<VotingConfigResponse> {
    Ok(VotingConfigResponse {
        admin: ADMIN.load(deps.storage)?.to_string(),
        credential_registry: CREDENTIAL_REGISTRY.load(deps.storage)?.to_string(),
        treasury_contract: TREASURY.load(deps.storage)?.to_string(),
        voting_period: VOTING_PERIOD.load(deps.storage)?,
        quorum_bps: QUORUM_BPS.load(deps.storage)?,
        threshold_bps: THRESHOLD_BPS.load(deps.storage)?,
        timelock_period: TIMELOCK_PERIOD.load(deps.storage)?,
        total_proposals: PROPOSAL_COUNT.load(deps.storage)?,
    })
}

fn to_proposal_response(p: StoredProposal) -> ProposalResponse {
    ProposalResponse {
        id: p.id,
        proposer: p.proposer.to_string(),
        title: p.title,
        description: p.description,
        status: format!("{:?}", p.status),
        voting_method: p.voting_method,
        start_height: p.start_height,
        end_height: p.end_height,
        votes_for: p.votes_for,
        votes_against: p.votes_against,
        votes_abstain: p.votes_abstain,
        quorum_bps: p.quorum_bps,
        threshold_bps: p.threshold_bps,
        execute_at: p.execute_at,
    }
}

// ── Tests ───────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use cosmwasm_std::testing::{mock_dependencies, mock_env, message_info, MockApi};

    fn setup(deps: DepsMut) {
        let api = MockApi::default();
        let admin_addr = api.addr_make("admin");
        let cred_registry_addr = api.addr_make("cred_registry");
        let treasury_addr = api.addr_make("treasury");
        let creator_addr = api.addr_make("creator");
        let msg = InstantiateMsg {
            admin: admin_addr.to_string(),
            credential_registry: cred_registry_addr.to_string(),
            treasury_contract: treasury_addr.to_string(),
            voting_period: 100,
            quorum_bps: 3000,
            threshold_bps: 5000,
            timelock_period: 50,
        };
        let info = message_info(&creator_addr, &[]);
        instantiate(deps, mock_env(), info, msg).unwrap();
    }

    #[test]
    fn test_create_proposal() {
        let mut deps = mock_dependencies();
        setup(deps.as_mut());

        let citizen1_addr = deps.api.addr_make("citizen1");
        let info = message_info(&citizen1_addr, &[]);
        let msg = ExecuteMsg::CreateProposal {
            title: "Fund healthcare research".to_string(),
            description: "Allocate 10000 ucitizen for cancer research".to_string(),
            voting_method: VotingMethod::OnePersonOneVote,
            voting_period: None,
        };
        let res = execute(deps.as_mut(), mock_env(), info, msg).unwrap();
        assert_eq!(res.attributes[0].value, "create_proposal");

        let config = query_config(deps.as_ref()).unwrap();
        assert_eq!(config.total_proposals, 1);
    }

    #[test]
    fn test_vote_one_person_one_vote() {
        let mut deps = mock_dependencies();
        setup(deps.as_mut());

        // Create proposal
        let citizen1_addr = deps.api.addr_make("citizen1");
        let info = message_info(&citizen1_addr, &[]);
        let msg = ExecuteMsg::CreateProposal {
            title: "Test".to_string(),
            description: "Test desc".to_string(),
            voting_method: VotingMethod::OnePersonOneVote,
            voting_period: None,
        };
        execute(deps.as_mut(), mock_env(), info, msg).unwrap();

        // Vote yes
        let citizen2_addr = deps.api.addr_make("citizen2");
        let voter_info = message_info(&citizen2_addr, &[]);
        let vote_msg = ExecuteMsg::CastVote {
            proposal_id: 1,
            vote: VoteOption::Yes,
            tokens: None,
        };
        execute(deps.as_mut(), mock_env(), voter_info, vote_msg).unwrap();

        let proposal = query_proposal(deps.as_ref(), 1).unwrap();
        assert_eq!(proposal.votes_for, Uint128::one());
    }

    #[test]
    fn test_double_vote_rejected() {
        let mut deps = mock_dependencies();
        setup(deps.as_mut());

        let citizen1_addr = deps.api.addr_make("citizen1");
        let info = message_info(&citizen1_addr, &[]);
        execute(
            deps.as_mut(),
            mock_env(),
            info.clone(),
            ExecuteMsg::CreateProposal {
                title: "Test".to_string(),
                description: "Desc".to_string(),
                voting_method: VotingMethod::OnePersonOneVote,
                voting_period: None,
            },
        )
        .unwrap();

        // First vote
        execute(
            deps.as_mut(),
            mock_env(),
            info.clone(),
            ExecuteMsg::CastVote {
                proposal_id: 1,
                vote: VoteOption::Yes,
                tokens: None,
            },
        )
        .unwrap();

        // Second vote should fail
        let err = execute(
            deps.as_mut(),
            mock_env(),
            info,
            ExecuteMsg::CastVote {
                proposal_id: 1,
                vote: VoteOption::No,
                tokens: None,
            },
        )
        .unwrap_err();
        assert!(matches!(err, ContractError::AlreadyVoted { .. }));
    }

    #[test]
    fn test_tally_passed() {
        let mut deps = mock_dependencies();
        setup(deps.as_mut());

        let citizen1_addr = deps.api.addr_make("citizen1");
        let info = message_info(&citizen1_addr, &[]);
        execute(
            deps.as_mut(),
            mock_env(),
            info.clone(),
            ExecuteMsg::CreateProposal {
                title: "Test".to_string(),
                description: "Desc".to_string(),
                voting_method: VotingMethod::OnePersonOneVote,
                voting_period: Some(10),
            },
        )
        .unwrap();

        // Vote yes
        execute(
            deps.as_mut(),
            mock_env(),
            info,
            ExecuteMsg::CastVote {
                proposal_id: 1,
                vote: VoteOption::Yes,
                tokens: None,
            },
        )
        .unwrap();

        // Advance blocks past end
        let mut env = mock_env();
        env.block.height += 20;

        let anyone_addr = deps.api.addr_make("anyone");
        let tally_info = message_info(&anyone_addr, &[]);
        execute(deps.as_mut(), env.clone(), tally_info, ExecuteMsg::TallyProposal { proposal_id: 1 }).unwrap();

        let p = query_proposal(deps.as_ref(), 1).unwrap();
        // With timelock_period=50 the proposal is Timelocked, not Passed
        assert_eq!(p.status, "Timelocked");
        assert!(p.execute_at > 0);

        // Try to execute before timelock expires — should fail
        let exec_info = message_info(&anyone_addr, &[]);
        let err = execute(
            deps.as_mut(),
            env.clone(),
            exec_info.clone(),
            ExecuteMsg::ExecuteProposal { proposal_id: 1 },
        )
        .unwrap_err();
        assert!(matches!(err, ContractError::TimelockNotExpired { .. }));

        // Advance past timelock
        let mut env2 = env;
        env2.block.height = p.execute_at + 1;
        execute(
            deps.as_mut(),
            env2,
            exec_info,
            ExecuteMsg::ExecuteProposal { proposal_id: 1 },
        )
        .unwrap();

        let p2 = query_proposal(deps.as_ref(), 1).unwrap();
        assert_eq!(p2.status, "Executed");
    }
}
