use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Coin, Uint128};

/// Treasury fund allocation categories
#[cw_serde]
pub enum FundCategory {
    Research,
    Healthcare,
    Infrastructure,
    Education,
    Emergency,
    NodeIncentives,
    Custom(String),
}

impl std::fmt::Display for FundCategory {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            FundCategory::Research => write!(f, "research"),
            FundCategory::Healthcare => write!(f, "healthcare"),
            FundCategory::Infrastructure => write!(f, "infrastructure"),
            FundCategory::Education => write!(f, "education"),
            FundCategory::Emergency => write!(f, "emergency"),
            FundCategory::NodeIncentives => write!(f, "node_incentives"),
            FundCategory::Custom(s) => write!(f, "custom:{}", s),
        }
    }
}

/// A grant application
#[cw_serde]
pub struct GrantApplication {
    pub id: u64,
    pub applicant: Addr,
    pub title: String,
    pub description: String,
    pub category: FundCategory,
    pub requested_amount: Uint128,
    pub milestones: Vec<Milestone>,
    pub status: GrantStatus,
    /// Governance proposal ID that approved this grant (if approved)
    pub proposal_id: Option<u64>,
}

#[cw_serde]
pub enum GrantStatus {
    Pending,
    Approved,
    Active,
    MilestoneCompleted(u32),
    Completed,
    Rejected,
    Cancelled,
}

#[cw_serde]
pub struct Milestone {
    pub id: u32,
    pub description: String,
    pub amount: Uint128,
    pub completed: bool,
    /// Evidence hash (IPFS CID or similar)
    pub evidence: Option<String>,
}

/// Treasury allocation configuration
#[cw_serde]
pub struct AllocationConfig {
    /// Percentage allocated to each category (basis points, total must = 10000)
    pub allocations: Vec<(FundCategory, u64)>,
}

/// A single spend record for transparency
#[cw_serde]
pub struct SpendRecord {
    pub id: u64,
    pub grant_id: u64,
    pub milestone_id: u32,
    pub recipient: Addr,
    pub amount: Coin,
    pub timestamp: u64,
    pub memo: String,
}
