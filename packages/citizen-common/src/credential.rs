use cosmwasm_schema::cw_serde;
use cosmwasm_std::Addr;

/// A privacy-preserving credential that proves citizenship or eligibility
/// without revealing the underlying identity data.
#[cw_serde]
pub struct Credential {
    /// Unique identifier (hash of the credential data)
    pub id: String,
    /// The holder's on-chain address
    pub holder: Addr,
    /// Type of credential (e.g., "citizenship", "residency", "age-over-18")
    pub credential_type: CredentialType,
    /// The ZK proof commitment (hash of the proof)
    pub commitment: String,
    /// Issuer address (trusted credential issuer)
    pub issuer: Addr,
    /// Unix timestamp of issuance
    pub issued_at: u64,
    /// Unix timestamp of expiry (0 = no expiry)
    pub expires_at: u64,
    /// Whether the credential has been revoked
    pub revoked: bool,
}

#[cw_serde]
pub enum CredentialType {
    Citizenship,
    Residency,
    AgeOver18,
    HealthcareEligibility,
    Custom(String),
}

impl std::fmt::Display for CredentialType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CredentialType::Citizenship => write!(f, "citizenship"),
            CredentialType::Residency => write!(f, "residency"),
            CredentialType::AgeOver18 => write!(f, "age_over_18"),
            CredentialType::HealthcareEligibility => write!(f, "healthcare_eligibility"),
            CredentialType::Custom(s) => write!(f, "custom:{}", s),
        }
    }
}

/// Simplified ZK proof placeholder.
/// In production, this would contain the actual zero-knowledge proof data
/// (e.g., Groth16 proof bytes, public inputs, verification key reference).
#[cw_serde]
pub struct ZkProof {
    /// The proof data (hex-encoded)
    pub proof_data: String,
    /// Public inputs to the proof circuit
    pub public_inputs: Vec<String>,
    /// Reference to the verification key (stored off-chain or in another contract)
    pub vk_reference: String,
}

/// Verification result from checking a ZK proof
#[cw_serde]
pub struct VerificationResult {
    pub valid: bool,
    pub credential_type: CredentialType,
    pub message: String,
}
