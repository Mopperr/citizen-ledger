use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Uint128};
use cw_storage_plus::{Item, Map};

use crate::msg::EmissionPhase;

pub const ADMIN: Item<Addr> = Item::new("admin");
pub const DENOM: Item<String> = Item::new("denom");
pub const MAX_SUPPLY: Item<Uint128> = Item::new("max_supply");
pub const TOTAL_MINTED: Item<Uint128> = Item::new("total_minted");
pub const TOTAL_STAKED: Item<Uint128> = Item::new("total_staked");
pub const TOTAL_STAKERS: Item<u64> = Item::new("total_stakers");
pub const TREASURY: Item<Addr> = Item::new("treasury");
pub const TREASURY_SHARE_BPS: Item<u64> = Item::new("treasury_bps");
pub const LAST_DISTRIBUTION_HEIGHT: Item<u64> = Item::new("last_dist_height");

/// Emission phases list
pub const PHASES: Item<Vec<EmissionPhase>> = Item::new("phases");

/// Global reward index (rewards per staked token, scaled by 1e12)
pub const GLOBAL_REWARD_INDEX: Item<Uint128> = Item::new("global_idx");

/// Per-staker data
pub const STAKERS: Map<&Addr, StakerInfo> = Map::new("stakers");

/// Slash penalty rate in basis points (e.g. 1000 = 10%)
pub const SLASH_PENALTY_BPS: Item<u64> = Item::new("slash_bps");

/// Tracks total amount slashed
pub const TOTAL_SLASHED: Item<Uint128> = Item::new("total_slashed");

/// Slash event log (auto-incrementing key)
pub const SLASH_COUNT: Item<u64> = Item::new("slash_count");
pub const SLASH_EVENTS: Map<u64, SlashEvent> = Map::new("slash_events");

#[cw_serde]
pub struct StakerInfo {
    pub staked: Uint128,
    pub reward_debt: Uint128,
    pub pending_rewards: Uint128,
    pub last_claim_height: u64,
}

#[cw_serde]
pub struct SlashEvent {
    pub id: u64,
    pub staker: Addr,
    pub amount: Uint128,
    pub reason: String,
    pub height: u64,
}
