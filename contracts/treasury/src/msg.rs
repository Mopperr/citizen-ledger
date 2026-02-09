use citizen_common::treasury::FundCategory;
use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::Uint128;

#[cw_serde]
pub struct InstantiateMsg {
    pub admin: String,
    /// The governance contract that can authorize spends
    pub governance_contract: String,
    /// Native denom accepted by treasury
    pub denom: String,
    /// Initial allocation percentages (basis points, must total 10000)
    pub allocations: Vec<(FundCategory, u64)>,
}

#[cw_serde]
pub enum ExecuteMsg {
    /// Deposit funds (anyone can deposit by sending native tokens)
    Deposit {},
    /// Spend from treasury (governance only)
    Spend {
        recipient: String,
        amount: Uint128,
        category: FundCategory,
        memo: String,
    },
    /// Update allocation percentages (governance only)
    UpdateAllocations {
        allocations: Vec<(FundCategory, u64)>,
    },
    /// Update governance contract address (admin only)
    UpdateGovernance { governance_contract: String },
    /// Transfer admin
    TransferAdmin { new_admin: String },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    /// Get treasury balance
    #[returns(BalanceResponse)]
    Balance {},

    /// Get allocation config
    #[returns(AllocationsResponse)]
    Allocations {},

    /// Get spending history
    #[returns(SpendHistoryResponse)]
    SpendHistory {
        start_after: Option<u64>,
        limit: Option<u32>,
    },

    /// Get total spent per category
    #[returns(CategorySpendResponse)]
    CategorySpend { category: FundCategory },

    /// Get contract config
    #[returns(TreasuryConfigResponse)]
    Config {},
}

#[cw_serde]
pub struct BalanceResponse {
    pub denom: String,
    pub total: Uint128,
    pub allocated: Vec<(FundCategory, Uint128)>,
}

#[cw_serde]
pub struct AllocationsResponse {
    pub allocations: Vec<(FundCategory, u64)>,
}

#[cw_serde]
pub struct SpendHistoryResponse {
    pub records: Vec<SpendRecordResponse>,
}

#[cw_serde]
pub struct SpendRecordResponse {
    pub id: u64,
    pub recipient: String,
    pub amount: Uint128,
    pub category: FundCategory,
    pub memo: String,
    pub timestamp: u64,
}

#[cw_serde]
pub struct CategorySpendResponse {
    pub category: FundCategory,
    pub total_spent: Uint128,
}

#[cw_serde]
pub struct TreasuryConfigResponse {
    pub admin: String,
    pub governance_contract: String,
    pub denom: String,
    pub total_deposited: Uint128,
    pub total_spent: Uint128,
}
