use cosmwasm_std::Addr;
use cw_storage_plus::{Item, Map};
use cosmwasm_schema::cw_serde;
use citizen_common::credential::Credential;

/// Contract admin address
pub const ADMIN: Item<Addr> = Item::new("admin");

/// Set of trusted issuers (address → true)
pub const ISSUERS: Map<&Addr, bool> = Map::new("issuers");

/// Credentials indexed by their unique ID
pub const CREDENTIALS: Map<&str, Credential> = Map::new("credentials");

/// Secondary index: holder address → list of credential IDs
pub const HOLDER_CREDENTIALS: Map<(&Addr, &str), bool> = Map::new("holder_creds");

/// Running counter for total credentials issued
pub const CREDENTIAL_COUNT: Item<u64> = Item::new("cred_count");

/// Authorized verification relayers (off-chain identity service → on-chain bridge)
pub const AUTHORIZED_RELAYERS: Map<&Addr, bool> = Map::new("relayers");

/// Recovery timelock in blocks (e.g. 10080 ≈ 7 days at 6s blocks)
pub const RECOVERY_TIMELOCK: Item<u64> = Item::new("recovery_tl");

/// Key recovery requests indexed by recovery_id
pub const RECOVERIES: Map<&str, StoredRecovery> = Map::new("recoveries");

#[cw_serde]
pub struct StoredRecovery {
    pub recovery_id: String,
    pub old_address: Addr,
    pub new_address: Addr,
    pub reverification_id: String,
    pub status: StoredRecoveryStatus,
    pub requested_at: u64,
    pub execute_after: u64,
}

#[cw_serde]
pub enum StoredRecoveryStatus {
    PendingVerification,
    TimelockWaiting,
    Executed,
    Contested,
    Cancelled,
}
