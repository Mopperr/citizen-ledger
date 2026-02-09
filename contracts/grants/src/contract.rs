use cosmwasm_std::{
    entry_point, to_json_binary, Binary, CosmosMsg, Deps, DepsMut, Env, MessageInfo, Order,
    Response, StdResult, Uint128, WasmMsg,
};
use cw2::set_contract_version;

use citizen_common::errors::ContractError;
use citizen_common::treasury::FundCategory;

use crate::msg::*;
use crate::state::*;

const CONTRACT_NAME: &str = "crates.io:citizen-grants";
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
    GOVERNANCE.save(
        deps.storage,
        &deps.api.addr_validate(&msg.governance_contract)?,
    )?;
    TREASURY.save(
        deps.storage,
        &deps.api.addr_validate(&msg.treasury_contract)?,
    )?;
    GRANT_COUNT.save(deps.storage, &0u64)?;
    TOTAL_DISBURSED.save(deps.storage, &Uint128::zero())?;
    CYCLE_COUNT.save(deps.storage, &0u64)?;

    Ok(Response::new().add_attribute("action", "instantiate"))
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
        ExecuteMsg::Apply {
            title,
            description,
            category,
            milestones,
        } => execute_apply(deps, env, info, title, description, category, milestones),
        ExecuteMsg::Approve {
            grant_id,
            proposal_id,
        } => execute_approve(deps, info, grant_id, proposal_id),
        ExecuteMsg::SubmitMilestone {
            grant_id,
            milestone_id,
            evidence,
        } => execute_submit_milestone(deps, info, grant_id, milestone_id, evidence),
        ExecuteMsg::ApproveMilestone {
            grant_id,
            milestone_id,
        } => execute_approve_milestone(deps, info, grant_id, milestone_id),
        ExecuteMsg::Reject { grant_id, reason } => execute_reject(deps, info, grant_id, reason),
        ExecuteMsg::Cancel { grant_id } => execute_cancel(deps, info, grant_id),
        ExecuteMsg::AddReviewer { reviewer } => execute_add_reviewer(deps, info, reviewer),
        ExecuteMsg::RemoveReviewer { reviewer } => execute_remove_reviewer(deps, info, reviewer),
        ExecuteMsg::RegisterResearchCategory {
            name,
            description,
            funding_pool,
            max_grant_size,
        } => execute_register_research_category(
            deps,
            info,
            name,
            description,
            funding_pool,
            max_grant_size,
        ),
        ExecuteMsg::OpenResearchCycle {
            title,
            categories,
            total_budget,
            duration_blocks,
        } => execute_open_research_cycle(
            deps,
            env,
            info,
            title,
            categories,
            total_budget,
            duration_blocks,
        ),
        ExecuteMsg::CloseResearchCycle { cycle_id } => {
            execute_close_research_cycle(deps, info, cycle_id)
        }
    }
}

fn execute_apply(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    title: String,
    description: String,
    category: FundCategory,
    milestones: Vec<MilestoneInput>,
) -> Result<Response, ContractError> {
    let count = GRANT_COUNT.load(deps.storage)?;
    let new_id = count + 1;

    let total_amount: Uint128 = milestones.iter().map(|m| m.amount).sum();

    let stored_milestones: Vec<StoredMilestone> = milestones
        .iter()
        .enumerate()
        .map(|(i, m)| StoredMilestone {
            id: (i + 1) as u32,
            description: m.description.clone(),
            amount: m.amount,
            completed: false,
            evidence: None,
            approved_by: None,
        })
        .collect();

    let grant = StoredGrant {
        id: new_id,
        applicant: info.sender.clone(),
        title: title.clone(),
        description,
        category,
        total_amount,
        disbursed: Uint128::zero(),
        status: StoredGrantStatus::Pending,
        proposal_id: None,
        milestones: stored_milestones,
    };

    GRANTS.save(deps.storage, new_id, &grant)?;
    APPLICANT_GRANTS.save(deps.storage, (&info.sender, new_id), &true)?;
    GRANT_COUNT.save(deps.storage, &new_id)?;

    Ok(Response::new()
        .add_attribute("action", "apply_grant")
        .add_attribute("grant_id", new_id.to_string())
        .add_attribute("applicant", info.sender.as_str())
        .add_attribute("title", title)
        .add_attribute("total_amount", total_amount.to_string()))
}

fn execute_approve(
    deps: DepsMut,
    info: MessageInfo,
    grant_id: u64,
    proposal_id: u64,
) -> Result<Response, ContractError> {
    let gov = GOVERNANCE.load(deps.storage)?;
    if info.sender != gov {
        return Err(ContractError::Unauthorized {
            reason: "Only governance contract can approve grants".to_string(),
        });
    }

    let mut grant = GRANTS
        .may_load(deps.storage, grant_id)?
        .ok_or(ContractError::GrantNotFound { id: grant_id })?;

    if !matches!(grant.status, StoredGrantStatus::Pending) {
        return Err(ContractError::Unauthorized {
            reason: "Grant must be in Pending state to approve".to_string(),
        });
    }

    grant.status = StoredGrantStatus::Active;
    grant.proposal_id = Some(proposal_id);
    GRANTS.save(deps.storage, grant_id, &grant)?;

    Ok(Response::new()
        .add_attribute("action", "approve_grant")
        .add_attribute("grant_id", grant_id.to_string())
        .add_attribute("proposal_id", proposal_id.to_string()))
}

fn execute_submit_milestone(
    deps: DepsMut,
    info: MessageInfo,
    grant_id: u64,
    milestone_id: u32,
    evidence: String,
) -> Result<Response, ContractError> {
    let mut grant = GRANTS
        .may_load(deps.storage, grant_id)?
        .ok_or(ContractError::GrantNotFound { id: grant_id })?;

    if info.sender != grant.applicant {
        return Err(ContractError::Unauthorized {
            reason: "Only grantee can submit milestone evidence".to_string(),
        });
    }

    if !matches!(grant.status, StoredGrantStatus::Active) {
        return Err(ContractError::Unauthorized {
            reason: "Grant must be Active to submit milestones".to_string(),
        });
    }

    let milestone = grant
        .milestones
        .iter_mut()
        .find(|m| m.id == milestone_id)
        .ok_or(ContractError::MilestoneNotFound {
            grant_id,
            milestone_id,
        })?;

    milestone.evidence = Some(evidence.clone());
    GRANTS.save(deps.storage, grant_id, &grant)?;

    Ok(Response::new()
        .add_attribute("action", "submit_milestone")
        .add_attribute("grant_id", grant_id.to_string())
        .add_attribute("milestone_id", milestone_id.to_string()))
}

fn execute_approve_milestone(
    deps: DepsMut,
    info: MessageInfo,
    grant_id: u64,
    milestone_id: u32,
) -> Result<Response, ContractError> {
    let gov = GOVERNANCE.load(deps.storage)?;
    let admin = ADMIN.load(deps.storage)?;
    let is_reviewer = REVIEWERS
        .may_load(deps.storage, &info.sender)?
        .unwrap_or(false);
    if info.sender != gov && info.sender != admin && !is_reviewer {
        return Err(ContractError::Unauthorized {
            reason: "Only governance, admin, or authorized reviewer can approve milestones"
                .to_string(),
        });
    }

    let mut grant = GRANTS
        .may_load(deps.storage, grant_id)?
        .ok_or(ContractError::GrantNotFound { id: grant_id })?;

    let milestone = grant
        .milestones
        .iter_mut()
        .find(|m| m.id == milestone_id)
        .ok_or(ContractError::MilestoneNotFound {
            grant_id,
            milestone_id,
        })?;

    if milestone.completed {
        return Err(ContractError::Unauthorized {
            reason: "Milestone already completed".to_string(),
        });
    }

    if milestone.evidence.is_none() {
        return Err(ContractError::Unauthorized {
            reason: "No evidence submitted for milestone".to_string(),
        });
    }

    let disburse_amount = milestone.amount;
    milestone.completed = true;
    milestone.approved_by = Some(info.sender.clone());
    grant.disbursed += disburse_amount;

    // Check if all milestones completed
    let all_complete = grant.milestones.iter().all(|m| m.completed);
    if all_complete {
        grant.status = StoredGrantStatus::Completed;
    }

    GRANTS.save(deps.storage, grant_id, &grant)?;

    // Update total disbursed
    let total = TOTAL_DISBURSED.load(deps.storage)?;
    TOTAL_DISBURSED.save(deps.storage, &(total + disburse_amount))?;

    // Send a message to the treasury to release funds
    let treasury = TREASURY.load(deps.storage)?;
    let spend_msg = serde_json::json!({
        "spend": {
            "recipient": grant.applicant.to_string(),
            "amount": disburse_amount.to_string(),
            "category": grant.category,
            "memo": format!("Grant #{} milestone #{}", grant_id, milestone_id)
        }
    });

    let msg = CosmosMsg::Wasm(WasmMsg::Execute {
        contract_addr: treasury.to_string(),
        msg: to_json_binary(&spend_msg)?,
        funds: vec![],
    });

    Ok(Response::new()
        .add_message(msg)
        .add_attribute("action", "approve_milestone")
        .add_attribute("grant_id", grant_id.to_string())
        .add_attribute("milestone_id", milestone_id.to_string())
        .add_attribute("disbursed", disburse_amount.to_string()))
}

fn execute_reject(
    deps: DepsMut,
    info: MessageInfo,
    grant_id: u64,
    reason: String,
) -> Result<Response, ContractError> {
    let gov = GOVERNANCE.load(deps.storage)?;
    if info.sender != gov {
        return Err(ContractError::Unauthorized {
            reason: "Only governance can reject grants".to_string(),
        });
    }

    let mut grant = GRANTS
        .may_load(deps.storage, grant_id)?
        .ok_or(ContractError::GrantNotFound { id: grant_id })?;

    grant.status = StoredGrantStatus::Rejected;
    GRANTS.save(deps.storage, grant_id, &grant)?;

    Ok(Response::new()
        .add_attribute("action", "reject_grant")
        .add_attribute("grant_id", grant_id.to_string())
        .add_attribute("reason", reason))
}

fn execute_cancel(
    deps: DepsMut,
    info: MessageInfo,
    grant_id: u64,
) -> Result<Response, ContractError> {
    let admin = ADMIN.load(deps.storage)?;
    let mut grant = GRANTS
        .may_load(deps.storage, grant_id)?
        .ok_or(ContractError::GrantNotFound { id: grant_id })?;

    if info.sender != grant.applicant && info.sender != admin {
        return Err(ContractError::Unauthorized {
            reason: "Only grantee or admin can cancel".to_string(),
        });
    }

    grant.status = StoredGrantStatus::Cancelled;
    GRANTS.save(deps.storage, grant_id, &grant)?;

    Ok(Response::new()
        .add_attribute("action", "cancel_grant")
        .add_attribute("grant_id", grant_id.to_string()))
}

// ── Reviewer Management ─────────────────────────────────────────────

fn execute_add_reviewer(
    deps: DepsMut,
    info: MessageInfo,
    reviewer: String,
) -> Result<Response, ContractError> {
    let admin = ADMIN.load(deps.storage)?;
    let gov = GOVERNANCE.load(deps.storage)?;
    if info.sender != admin && info.sender != gov {
        return Err(ContractError::Unauthorized {
            reason: "Only admin or governance can manage reviewers".to_string(),
        });
    }
    let addr = deps.api.addr_validate(&reviewer)?;
    REVIEWERS.save(deps.storage, &addr, &true)?;
    Ok(Response::new()
        .add_attribute("action", "add_reviewer")
        .add_attribute("reviewer", reviewer))
}

fn execute_remove_reviewer(
    deps: DepsMut,
    info: MessageInfo,
    reviewer: String,
) -> Result<Response, ContractError> {
    let admin = ADMIN.load(deps.storage)?;
    let gov = GOVERNANCE.load(deps.storage)?;
    if info.sender != admin && info.sender != gov {
        return Err(ContractError::Unauthorized {
            reason: "Only admin or governance can manage reviewers".to_string(),
        });
    }
    let addr = deps.api.addr_validate(&reviewer)?;
    REVIEWERS.remove(deps.storage, &addr);
    Ok(Response::new()
        .add_attribute("action", "remove_reviewer")
        .add_attribute("reviewer", reviewer))
}

// ── Research Category & Cycle Management ────────────────────────────

fn execute_register_research_category(
    deps: DepsMut,
    info: MessageInfo,
    name: String,
    description: String,
    funding_pool: Uint128,
    max_grant_size: Uint128,
) -> Result<Response, ContractError> {
    let admin = ADMIN.load(deps.storage)?;
    let gov = GOVERNANCE.load(deps.storage)?;
    if info.sender != admin && info.sender != gov {
        return Err(ContractError::Unauthorized {
            reason: "Only admin or governance can register research categories".to_string(),
        });
    }

    let cat = ResearchCategory {
        name: name.clone(),
        description,
        funding_pool,
        total_funded: Uint128::zero(),
        active: true,
        max_grant_size,
    };

    RESEARCH_CATEGORIES.save(deps.storage, &name, &cat)?;

    Ok(Response::new()
        .add_attribute("action", "register_research_category")
        .add_attribute("category", &name)
        .add_attribute("funding_pool", funding_pool.to_string()))
}

fn execute_open_research_cycle(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    title: String,
    categories: Vec<String>,
    total_budget: Uint128,
    duration_blocks: u64,
) -> Result<Response, ContractError> {
    let admin = ADMIN.load(deps.storage)?;
    let gov = GOVERNANCE.load(deps.storage)?;
    if info.sender != admin && info.sender != gov {
        return Err(ContractError::Unauthorized {
            reason: "Only admin or governance can open research cycles".to_string(),
        });
    }

    // Verify all categories exist
    for cat_name in &categories {
        if RESEARCH_CATEGORIES
            .may_load(deps.storage, cat_name)?
            .is_none()
        {
            return Err(ContractError::Unauthorized {
                reason: format!("Research category '{}' not registered", cat_name),
            });
        }
    }

    let count = CYCLE_COUNT.load(deps.storage)?;
    let new_id = count + 1;

    let cycle = ResearchCycle {
        id: new_id,
        title: title.clone(),
        categories,
        total_budget,
        allocated: Uint128::zero(),
        start_height: env.block.height,
        end_height: env.block.height + duration_blocks,
        status: CycleStatus::Open,
    };

    RESEARCH_CYCLES.save(deps.storage, new_id, &cycle)?;
    CYCLE_COUNT.save(deps.storage, &new_id)?;

    Ok(Response::new()
        .add_attribute("action", "open_research_cycle")
        .add_attribute("cycle_id", new_id.to_string())
        .add_attribute("title", title)
        .add_attribute("budget", total_budget.to_string()))
}

fn execute_close_research_cycle(
    deps: DepsMut,
    info: MessageInfo,
    cycle_id: u64,
) -> Result<Response, ContractError> {
    let admin = ADMIN.load(deps.storage)?;
    let gov = GOVERNANCE.load(deps.storage)?;
    if info.sender != admin && info.sender != gov {
        return Err(ContractError::Unauthorized {
            reason: "Only admin or governance can close research cycles".to_string(),
        });
    }

    let mut cycle =
        RESEARCH_CYCLES
            .may_load(deps.storage, cycle_id)?
            .ok_or(ContractError::Unauthorized {
                reason: format!("Research cycle {} not found", cycle_id),
            })?;

    cycle.status = CycleStatus::Closed;
    RESEARCH_CYCLES.save(deps.storage, cycle_id, &cycle)?;

    Ok(Response::new()
        .add_attribute("action", "close_research_cycle")
        .add_attribute("cycle_id", cycle_id.to_string()))
}

// ── Query ───────────────────────────────────────────────────────────

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetGrant { grant_id } => to_json_binary(&query_grant(deps, grant_id)?),
        QueryMsg::ListGrants {
            start_after,
            limit,
            status_filter,
        } => to_json_binary(&query_list_grants(deps, start_after, limit, status_filter)?),
        QueryMsg::ListGrantsByApplicant {
            applicant,
            start_after,
            limit,
        } => to_json_binary(&query_by_applicant(deps, applicant, start_after, limit)?),
        QueryMsg::Config {} => to_json_binary(&query_config(deps)?),
        QueryMsg::ListResearchCategories {} => to_json_binary(&query_research_categories(deps)?),
        QueryMsg::ListResearchCycles { start_after, limit } => {
            to_json_binary(&query_research_cycles(deps, start_after, limit)?)
        }
    }
}

fn to_grant_response(g: StoredGrant) -> GrantResponse {
    GrantResponse {
        id: g.id,
        applicant: g.applicant.to_string(),
        title: g.title,
        description: g.description,
        category: g.category,
        total_amount: g.total_amount,
        disbursed: g.disbursed,
        status: format!("{:?}", g.status),
        proposal_id: g.proposal_id,
        milestones: g
            .milestones
            .into_iter()
            .map(|m| MilestoneResponse {
                id: m.id,
                description: m.description,
                amount: m.amount,
                completed: m.completed,
                evidence: m.evidence,
                approved_by: m.approved_by.map(|a| a.to_string()),
            })
            .collect(),
    }
}

fn query_grant(deps: Deps, grant_id: u64) -> StdResult<GrantResponse> {
    let g = GRANTS.load(deps.storage, grant_id)?;
    Ok(to_grant_response(g))
}

fn query_list_grants(
    deps: Deps,
    start_after: Option<u64>,
    limit: Option<u32>,
    _status_filter: Option<String>,
) -> StdResult<GrantListResponse> {
    let limit = limit.unwrap_or(30).min(100) as usize;
    let start = start_after.map(cw_storage_plus::Bound::exclusive);

    let grants: Vec<GrantResponse> = GRANTS
        .range(deps.storage, start, None, Order::Ascending)
        .take(limit)
        .filter_map(|r| r.ok())
        .map(|(_, g)| to_grant_response(g))
        .collect();

    Ok(GrantListResponse { grants })
}

fn query_by_applicant(
    deps: Deps,
    applicant: String,
    _start_after: Option<u64>,
    limit: Option<u32>,
) -> StdResult<GrantListResponse> {
    let addr = deps.api.addr_validate(&applicant)?;
    let limit = limit.unwrap_or(30).min(100) as usize;

    let grants: Vec<GrantResponse> = APPLICANT_GRANTS
        .prefix(&addr)
        .range(deps.storage, None, None, Order::Ascending)
        .take(limit)
        .filter_map(|r| r.ok())
        .filter_map(|(id, _)| GRANTS.load(deps.storage, id).ok())
        .map(to_grant_response)
        .collect();

    Ok(GrantListResponse { grants })
}

fn query_config(deps: Deps) -> StdResult<GrantConfigResponse> {
    Ok(GrantConfigResponse {
        admin: ADMIN.load(deps.storage)?.to_string(),
        governance_contract: GOVERNANCE.load(deps.storage)?.to_string(),
        treasury_contract: TREASURY.load(deps.storage)?.to_string(),
        total_grants: GRANT_COUNT.load(deps.storage)?,
        total_disbursed: TOTAL_DISBURSED.load(deps.storage)?,
    })
}

fn query_research_categories(deps: Deps) -> StdResult<ResearchCategoryListResponse> {
    let categories: Vec<ResearchCategoryResponse> = RESEARCH_CATEGORIES
        .range(deps.storage, None, None, Order::Ascending)
        .filter_map(|r| r.ok())
        .map(|(_, cat)| ResearchCategoryResponse {
            name: cat.name,
            description: cat.description,
            funding_pool: cat.funding_pool,
            total_funded: cat.total_funded,
            active: cat.active,
            max_grant_size: cat.max_grant_size,
        })
        .collect();

    Ok(ResearchCategoryListResponse { categories })
}

fn query_research_cycles(
    deps: Deps,
    start_after: Option<u64>,
    limit: Option<u32>,
) -> StdResult<ResearchCycleListResponse> {
    let limit = limit.unwrap_or(30).min(100) as usize;
    let start = start_after.map(cw_storage_plus::Bound::exclusive);

    let cycles: Vec<ResearchCycleResponse> = RESEARCH_CYCLES
        .range(deps.storage, start, None, Order::Ascending)
        .take(limit)
        .filter_map(|r| r.ok())
        .map(|(_, c)| ResearchCycleResponse {
            id: c.id,
            title: c.title,
            categories: c.categories,
            total_budget: c.total_budget,
            allocated: c.allocated,
            start_height: c.start_height,
            end_height: c.end_height,
            status: format!("{:?}", c.status),
        })
        .collect();

    Ok(ResearchCycleListResponse { cycles })
}

// ── Tests ───────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use cosmwasm_std::testing::{message_info, mock_dependencies, mock_env, MockApi};

    fn setup(deps: DepsMut) {
        let api = MockApi::default();
        let admin_addr = api.addr_make("admin");
        let governance_addr = api.addr_make("governance");
        let treasury_addr = api.addr_make("treasury");
        let creator_addr = api.addr_make("creator");
        let msg = InstantiateMsg {
            admin: admin_addr.to_string(),
            governance_contract: governance_addr.to_string(),
            treasury_contract: treasury_addr.to_string(),
        };
        let info = message_info(&creator_addr, &[]);
        instantiate(deps, mock_env(), info, msg).unwrap();
    }

    #[test]
    fn test_apply() {
        let mut deps = mock_dependencies();
        setup(deps.as_mut());

        let researcher_addr = deps.api.addr_make("researcher");
        let info = message_info(&researcher_addr, &[]);
        let msg = ExecuteMsg::Apply {
            title: "Cancer Research".to_string(),
            description: "Fund phase 1 cancer research".to_string(),
            category: FundCategory::Healthcare,
            milestones: vec![
                MilestoneInput {
                    description: "Literature review".to_string(),
                    amount: Uint128::new(5000),
                },
                MilestoneInput {
                    description: "Lab results".to_string(),
                    amount: Uint128::new(15000),
                },
            ],
        };
        let res = execute(deps.as_mut(), mock_env(), info, msg).unwrap();
        assert_eq!(res.attributes[0].value, "apply_grant");

        let grant = query_grant(deps.as_ref(), 1).unwrap();
        assert_eq!(grant.total_amount, Uint128::new(20000));
        assert_eq!(grant.milestones.len(), 2);
        assert_eq!(grant.status, "Pending");
    }

    #[test]
    fn test_approve_and_milestone_flow() {
        let mut deps = mock_dependencies();
        setup(deps.as_mut());

        // Apply
        let researcher_addr = deps.api.addr_make("researcher");
        let info = message_info(&researcher_addr, &[]);
        execute(
            deps.as_mut(),
            mock_env(),
            info.clone(),
            ExecuteMsg::Apply {
                title: "Test Grant".to_string(),
                description: "Test".to_string(),
                category: FundCategory::Research,
                milestones: vec![MilestoneInput {
                    description: "Phase 1".to_string(),
                    amount: Uint128::new(1000),
                }],
            },
        )
        .unwrap();

        // Approve (as governance)
        let governance_addr = deps.api.addr_make("governance");
        let gov_info = message_info(&governance_addr, &[]);
        execute(
            deps.as_mut(),
            mock_env(),
            gov_info.clone(),
            ExecuteMsg::Approve {
                grant_id: 1,
                proposal_id: 42,
            },
        )
        .unwrap();

        let grant = query_grant(deps.as_ref(), 1).unwrap();
        assert_eq!(grant.status, "Active");
        assert_eq!(grant.proposal_id, Some(42));

        // Submit milestone evidence
        execute(
            deps.as_mut(),
            mock_env(),
            info,
            ExecuteMsg::SubmitMilestone {
                grant_id: 1,
                milestone_id: 1,
                evidence: "ipfs://QmEvidence123".to_string(),
            },
        )
        .unwrap();

        // Approve milestone (as admin)
        let admin_addr = deps.api.addr_make("admin");
        let admin_info = message_info(&admin_addr, &[]);
        let res = execute(
            deps.as_mut(),
            mock_env(),
            admin_info,
            ExecuteMsg::ApproveMilestone {
                grant_id: 1,
                milestone_id: 1,
            },
        )
        .unwrap();

        // Should have a treasury spend sub-message
        assert_eq!(res.messages.len(), 1);

        let grant = query_grant(deps.as_ref(), 1).unwrap();
        assert_eq!(grant.status, "Completed"); // Only one milestone
        assert_eq!(grant.disbursed, Uint128::new(1000));
    }
}
