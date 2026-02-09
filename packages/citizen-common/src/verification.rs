// ─────────────────────────────────────────────────────────────────────────────
// Verification Service Types – bridges off-chain identity verification
// with on-chain credential issuance
// ─────────────────────────────────────────────────────────────────────────────

use cosmwasm_schema::cw_serde;

/// Represents a verification request submitted off-chain and relayed on-chain.
#[cw_serde]
pub struct VerificationRequest {
    /// Unique request ID (UUID from the verification service)
    pub request_id: String,
    /// Applicant's on-chain address
    pub applicant: String,
    /// Type of verification requested
    pub verification_type: VerificationType,
    /// Hash of the identity data submitted (for audit, not stored on-chain)
    pub data_hash: String,
    /// Current status of the verification
    pub status: VerificationStatus,
    /// Timestamp of the request
    pub requested_at: u64,
    /// Timestamp of completion (0 = pending)
    pub completed_at: u64,
}

#[cw_serde]
pub enum VerificationType {
    /// Government ID check (passport, driver's license)
    GovernmentId,
    /// Proof of residency (utility bill, address verification)
    ProofOfResidency,
    /// Biometric verification (liveness + face match)
    Biometric,
    /// Social verification (vouched by N existing citizens)
    SocialVouching,
    /// Recovery re-verification (for lost key scenarios)
    RecoveryReverification,
}

#[cw_serde]
pub enum VerificationStatus {
    /// Request submitted, awaiting processing
    Pending,
    /// Identity provider is reviewing
    InReview,
    /// Verification passed — ready for credential issuance
    Approved,
    /// Verification failed
    Rejected,
    /// Verification expired (applicant took too long)
    Expired,
}

/// Configuration for the verification service integration.
#[cw_serde]
pub struct VerificationConfig {
    /// Base URL for the identity verification API
    pub api_endpoint: String,
    /// Authorized relayer addresses that can submit verification results on-chain
    pub authorized_relayers: Vec<String>,
    /// Minimum number of social vouches required (for SocialVouching type)
    pub min_social_vouches: u32,
    /// Verification result validity period in seconds
    pub result_validity_secs: u64,
    /// Whether biometric is required for all types
    pub require_biometric: bool,
}

/// A signed verification attestation from an authorized relayer.
#[cw_serde]
pub struct VerificationAttestation {
    /// The original request ID
    pub request_id: String,
    /// Address of the applicant
    pub applicant: String,
    /// Result of the verification
    pub result: VerificationStatus,
    /// The credential type to issue upon approval
    pub credential_type: String,
    /// ZK commitment generated from the verified data
    pub commitment: String,
    /// Relayer that submitted this attestation
    pub relayer: String,
    /// Block height at which this was recorded
    pub attested_at: u64,
}

/// Key recovery request — ties a new address to a previously verified identity.
#[cw_serde]
pub struct RecoveryRequest {
    /// The old address that lost access
    pub old_address: String,
    /// The new address requesting recovery
    pub new_address: String,
    /// Re-verification request ID (must pass verification again)
    pub reverification_id: String,
    /// Status of the recovery
    pub status: RecoveryStatus,
    /// Block height of the request
    pub requested_at: u64,
    /// Timelock: block height after which recovery executes
    pub execute_after: u64,
}

#[cw_serde]
pub enum RecoveryStatus {
    /// Re-verification pending
    PendingVerification,
    /// Verified, in timelock waiting period
    TimelockWaiting,
    /// Recovery executed — credentials migrated
    Executed,
    /// Contested by old address owner during timelock
    Contested,
    /// Recovery cancelled
    Cancelled,
}
