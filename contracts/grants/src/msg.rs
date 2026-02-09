use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::Uint128;
use citizen_common::treasury::FundCategory;

#[cw_serde]
pub struct MilestoneInput {
    pub description: String,
    pub amount: Uint128,
}

#[cw_serde]
pub struct InstantiateMsg {
    pub admin: String,
    /// Governance (voting) contract that approves grants
    pub governance_contract: String,
    /// Treasury contract for fund disbursement
    pub treasury_contract: String,
}

#[cw_serde]
pub enum ExecuteMsg {
    /// Submit a grant application
    Apply {
        title: String,
        description: String,
        category: FundCategory,
        milestones: Vec<MilestoneInput>,
    },
    /// Approve a grant (governance only, after proposal passes)
    Approve {
        grant_id: u64,
        proposal_id: u64,
    },
    /// Submit evidence for a milestone completion
    SubmitMilestone {
        grant_id: u64,
        milestone_id: u32,
        evidence: String,
    },
    /// Approve milestone and release funds (governance or reviewer)
    ApproveMilestone {
        grant_id: u64,
        milestone_id: u32,
    },
    /// Reject a grant application (governance only)
    Reject {
        grant_id: u64,
        reason: String,
    },
    /// Cancel an active grant (admin or grantee)
    Cancel {
        grant_id: u64,
    },
    /// Add a reviewer to the review committee (admin/governance only)
    AddReviewer {
        reviewer: String,
    },
    /// Remove a reviewer from the review committee (admin/governance only)
    RemoveReviewer {
        reviewer: String,
    },
    /// Register a new research category (admin/governance)
    RegisterResearchCategory {
        name: String,
        description: String,
        funding_pool: Uint128,
        max_grant_size: Uint128,
    },
    /// Open a new research grant cycle (admin/governance)
    OpenResearchCycle {
        title: String,
        categories: Vec<String>,
        total_budget: Uint128,
        duration_blocks: u64,
    },
    /// Close a research cycle and finalize allocations
    CloseResearchCycle {
        cycle_id: u64,
    },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(GrantResponse)]
    GetGrant { grant_id: u64 },

    #[returns(GrantListResponse)]
    ListGrants {
        start_after: Option<u64>,
        limit: Option<u32>,
        status_filter: Option<String>,
    },

    #[returns(GrantListResponse)]
    ListGrantsByApplicant {
        applicant: String,
        start_after: Option<u64>,
        limit: Option<u32>,
    },

    #[returns(GrantConfigResponse)]
    Config {},

    #[returns(ResearchCategoryListResponse)]
    ListResearchCategories {},

    #[returns(ResearchCycleListResponse)]
    ListResearchCycles {
        start_after: Option<u64>,
        limit: Option<u32>,
    },
}

#[cw_serde]
pub struct GrantResponse {
    pub id: u64,
    pub applicant: String,
    pub title: String,
    pub description: String,
    pub category: FundCategory,
    pub total_amount: Uint128,
    pub disbursed: Uint128,
    pub status: String,
    pub proposal_id: Option<u64>,
    pub milestones: Vec<MilestoneResponse>,
}

#[cw_serde]
pub struct MilestoneResponse {
    pub id: u32,
    pub description: String,
    pub amount: Uint128,
    pub completed: bool,
    pub evidence: Option<String>,
    pub approved_by: Option<String>,
}

#[cw_serde]
pub struct GrantListResponse {
    pub grants: Vec<GrantResponse>,
}

#[cw_serde]
pub struct GrantConfigResponse {
    pub admin: String,
    pub governance_contract: String,
    pub treasury_contract: String,
    pub total_grants: u64,
    pub total_disbursed: Uint128,
}

#[cw_serde]
pub struct ResearchCategoryResponse {
    pub name: String,
    pub description: String,
    pub funding_pool: Uint128,
    pub total_funded: Uint128,
    pub active: bool,
    pub max_grant_size: Uint128,
}

#[cw_serde]
pub struct ResearchCategoryListResponse {
    pub categories: Vec<ResearchCategoryResponse>,
}

#[cw_serde]
pub struct ResearchCycleResponse {
    pub id: u64,
    pub title: String,
    pub categories: Vec<String>,
    pub total_budget: Uint128,
    pub allocated: Uint128,
    pub start_height: u64,
    pub end_height: u64,
    pub status: String,
}

#[cw_serde]
pub struct ResearchCycleListResponse {
    pub cycles: Vec<ResearchCycleResponse>,
}
