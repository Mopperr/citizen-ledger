use citizen_common::credential::{CredentialType, ZkProof};
use cosmwasm_schema::{cw_serde, QueryResponses};

#[cw_serde]
pub struct InstantiateMsg {
    /// Admin who can add/remove issuers
    pub admin: String,
    /// Initial set of trusted credential issuers
    pub issuers: Vec<String>,
}

#[cw_serde]
pub enum ExecuteMsg {
    /// Issue a new credential with a ZK proof commitment
    IssueCredential {
        holder: String,
        credential_type: CredentialType,
        commitment: String,
        expires_at: u64,
    },
    /// Verify a credential using a ZK proof
    VerifyCredential {
        credential_id: String,
        proof: ZkProof,
    },
    /// Revoke a credential (issuer or admin only)
    RevokeCredential {
        credential_id: String,
        reason: String,
    },
    /// Add a trusted issuer (admin only)
    AddIssuer { issuer: String },
    /// Remove a trusted issuer (admin only)
    RemoveIssuer { issuer: String },
    /// Transfer admin role
    TransferAdmin { new_admin: String },
    /// Submit a verification result from an authorized relayer (step 28-29)
    SubmitVerificationResult {
        request_id: String,
        applicant: String,
        credential_type: CredentialType,
        commitment: String,
        approved: bool,
    },
    /// Request key recovery – migrates credentials from old address to new (step 30)
    RequestKeyRecovery {
        old_address: String,
        reverification_id: String,
    },
    /// Execute a pending recovery after timelock expires
    ExecuteRecovery { recovery_id: String },
    /// Contest a recovery (only callable by old address during timelock)
    ContestRecovery { recovery_id: String },
}

/// Message for contract migration
#[cw_serde]
pub struct MigrateMsg {}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    /// Get credential by ID
    #[returns(CredentialResponse)]
    GetCredential { credential_id: String },

    /// Check if a holder has a valid credential of a given type
    #[returns(HasCredentialResponse)]
    HasValidCredential {
        holder: String,
        credential_type: CredentialType,
    },

    /// List all credentials for a holder
    #[returns(CredentialsListResponse)]
    ListCredentials {
        holder: String,
        start_after: Option<String>,
        limit: Option<u32>,
    },

    /// List all trusted issuers
    #[returns(IssuersResponse)]
    ListIssuers {},

    /// Get contract config
    #[returns(ConfigResponse)]
    Config {},

    /// Get a recovery request by ID
    #[returns(RecoveryResponse)]
    GetRecovery { recovery_id: String },
}

// ── Response types ──────────────────────────────────────────────────

#[cw_serde]
pub struct CredentialResponse {
    pub id: String,
    pub holder: String,
    pub credential_type: CredentialType,
    pub commitment: String,
    pub issuer: String,
    pub issued_at: u64,
    pub expires_at: u64,
    pub revoked: bool,
}

#[cw_serde]
pub struct HasCredentialResponse {
    pub has_credential: bool,
    pub credential_id: Option<String>,
}

#[cw_serde]
pub struct CredentialsListResponse {
    pub credentials: Vec<CredentialResponse>,
}

#[cw_serde]
pub struct IssuersResponse {
    pub issuers: Vec<String>,
}

#[cw_serde]
pub struct ConfigResponse {
    pub admin: String,
    pub total_credentials: u64,
}

#[cw_serde]
pub struct RecoveryResponse {
    pub recovery_id: String,
    pub old_address: String,
    pub new_address: String,
    pub status: String,
    pub requested_at: u64,
    pub execute_after: u64,
}
