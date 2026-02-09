use citizen_common::treasury::FundCategory;
use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Uint128};
use cw_storage_plus::{Item, Map};

pub const ADMIN: Item<Addr> = Item::new("admin");
pub const GOVERNANCE: Item<Addr> = Item::new("governance");
pub const TREASURY: Item<Addr> = Item::new("treasury");
pub const GRANT_COUNT: Item<u64> = Item::new("grant_count");
pub const TOTAL_DISBURSED: Item<Uint128> = Item::new("total_disbursed");

/// Authorized grant reviewers (oracle committee members)
pub const REVIEWERS: Map<&Addr, bool> = Map::new("reviewers");

/// Research category registry
pub const RESEARCH_CATEGORIES: Map<&str, ResearchCategory> = Map::new("research_cats");

/// Research grant cycle tracking
pub const CYCLE_COUNT: Item<u64> = Item::new("cycle_count");
pub const RESEARCH_CYCLES: Map<u64, ResearchCycle> = Map::new("research_cycles");

#[cw_serde]
pub struct ResearchCategory {
    pub name: String,
    pub description: String,
    pub funding_pool: Uint128,
    pub total_funded: Uint128,
    pub active: bool,
    pub max_grant_size: Uint128,
}

#[cw_serde]
pub struct ResearchCycle {
    pub id: u64,
    pub title: String,
    pub categories: Vec<String>,
    pub total_budget: Uint128,
    pub allocated: Uint128,
    pub start_height: u64,
    pub end_height: u64,
    pub status: CycleStatus,
}

#[cw_serde]
pub enum CycleStatus {
    Open,
    Reviewing,
    Funded,
    Closed,
}

pub const GRANTS: Map<u64, StoredGrant> = Map::new("grants");
/// Secondary index: applicant → grant IDs
pub const APPLICANT_GRANTS: Map<(&Addr, u64), bool> = Map::new("app_grants");

#[cw_serde]
pub struct StoredGrant {
    pub id: u64,
    pub applicant: Addr,
    pub title: String,
    pub description: String,
    pub category: FundCategory,
    pub total_amount: Uint128,
    pub disbursed: Uint128,
    pub status: StoredGrantStatus,
    pub proposal_id: Option<u64>,
    pub milestones: Vec<StoredMilestone>,
}

#[cw_serde]
pub enum StoredGrantStatus {
    Pending,
    Approved,
    Active,
    Completed,
    Rejected,
    Cancelled,
}

#[cw_serde]
pub struct StoredMilestone {
    pub id: u32,
    pub description: String,
    pub amount: Uint128,
    pub completed: bool,
    pub evidence: Option<String>,
    /// Address that approved this milestone (governance, admin, or reviewer)
    pub approved_by: Option<Addr>,
}
