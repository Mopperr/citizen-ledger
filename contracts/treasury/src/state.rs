use citizen_common::treasury::FundCategory;
use cosmwasm_std::{Addr, Uint128};
use cw_storage_plus::{Item, Map};

pub const ADMIN: Item<Addr> = Item::new("admin");
pub const GOVERNANCE: Item<Addr> = Item::new("governance");
pub const DENOM: Item<String> = Item::new("denom");

/// Allocation percentages (category → basis points)
pub const ALLOCATIONS: Map<String, u64> = Map::new("allocations");

/// Total deposited ever
pub const TOTAL_DEPOSITED: Item<Uint128> = Item::new("total_deposited");
/// Total spent ever
pub const TOTAL_SPENT: Item<Uint128> = Item::new("total_spent");
/// Spend per category
pub const CATEGORY_SPENT: Map<String, Uint128> = Map::new("cat_spent");

/// Spend records
pub const SPEND_RECORDS: Map<u64, SpendRecord> = Map::new("spend_records");
pub const SPEND_COUNT: Item<u64> = Item::new("spend_count");

use cosmwasm_schema::cw_serde;

#[cw_serde]
pub struct SpendRecord {
    pub id: u64,
    pub recipient: Addr,
    pub amount: Uint128,
    pub category: FundCategory,
    pub memo: String,
    pub timestamp: u64,
}
