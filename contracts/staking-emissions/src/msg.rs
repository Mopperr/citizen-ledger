use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::Uint128;

/// An emission phase: defines how many tokens are emitted per block during a range of blocks
#[cw_serde]
pub struct EmissionPhase {
    /// Label (e.g., "Year 1", "Year 2-3")
    pub label: String,
    /// Start block height (inclusive)
    pub start_block: u64,
    /// End block height (inclusive, 0 = infinity)
    pub end_block: u64,
    /// Tokens emitted per block in this phase
    pub tokens_per_block: Uint128,
}

#[cw_serde]
pub struct InstantiateMsg {
    pub admin: String,
    /// Maximum total supply that can ever be minted
    pub max_supply: Uint128,
    /// Initial circulating supply (genesis allocation)
    pub initial_supply: Uint128,
    /// Native denom
    pub denom: String,
    /// Emission schedule phases
    pub phases: Vec<EmissionPhase>,
    /// Treasury address to receive a portion of emissions
    pub treasury: String,
    /// Percentage of block emissions that go to treasury (basis points)
    pub treasury_share_bps: u64,
    /// Slash penalty rate in basis points (e.g. 1000 = 10%). Default 0 = no slashing.
    pub slash_penalty_bps: u64,
}

#[cw_serde]
pub enum ExecuteMsg {
    /// Stake tokens
    Stake {},
    /// Unstake tokens
    Unstake { amount: Uint128 },
    /// Claim pending staking rewards
    ClaimRewards {},
    /// Distribute block emissions (called by chain or keeper)
    DistributeEmissions {},
    /// Update emission schedule (admin only, governance in future)
    UpdatePhases { phases: Vec<EmissionPhase> },
    /// Slash a staker's stake (admin/governance only)
    Slash { staker: String, reason: String },
    /// Update slash penalty rate (admin only)
    UpdateSlashPenalty { slash_penalty_bps: u64 },
}

/// Message for contract migration
#[cw_serde]
pub struct MigrateMsg {}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    /// Get staker info
    #[returns(StakerResponse)]
    Staker { address: String },

    /// Get pending rewards for a staker
    #[returns(PendingRewardsResponse)]
    PendingRewards { address: String },

    /// Get current emission rate
    #[returns(EmissionRateResponse)]
    CurrentEmissionRate {},

    /// Get all emission phases
    #[returns(EmissionScheduleResponse)]
    EmissionSchedule {},

    /// Get supply statistics
    #[returns(SupplyResponse)]
    Supply {},

    /// Get contract config
    #[returns(StakingConfigResponse)]
    Config {},

    /// Get slash history
    #[returns(SlashHistoryResponse)]
    SlashHistory {
        start_after: Option<u64>,
        limit: Option<u32>,
    },
}

#[cw_serde]
pub struct StakerResponse {
    pub address: String,
    pub staked: Uint128,
    pub pending_rewards: Uint128,
    pub last_claim_height: u64,
}

#[cw_serde]
pub struct PendingRewardsResponse {
    pub rewards: Uint128,
}

#[cw_serde]
pub struct EmissionRateResponse {
    pub current_phase: String,
    pub tokens_per_block: Uint128,
    pub blocks_remaining_in_phase: u64,
}

#[cw_serde]
pub struct EmissionScheduleResponse {
    pub phases: Vec<EmissionPhase>,
}

#[cw_serde]
pub struct SupplyResponse {
    pub max_supply: Uint128,
    pub total_minted: Uint128,
    pub total_staked: Uint128,
    pub remaining_to_mint: Uint128,
}

#[cw_serde]
pub struct StakingConfigResponse {
    pub admin: String,
    pub denom: String,
    pub max_supply: Uint128,
    pub treasury: String,
    pub treasury_share_bps: u64,
    pub total_staked: Uint128,
    pub total_stakers: u64,
    pub last_distribution_height: u64,
    pub slash_penalty_bps: u64,
    pub total_slashed: Uint128,
}

#[cw_serde]
pub struct SlashEventResponse {
    pub id: u64,
    pub staker: String,
    pub amount: Uint128,
    pub reason: String,
    pub height: u64,
}

#[cw_serde]
pub struct SlashHistoryResponse {
    pub events: Vec<SlashEventResponse>,
}
