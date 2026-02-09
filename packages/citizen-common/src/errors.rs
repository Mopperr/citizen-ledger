use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized: {reason}")]
    Unauthorized { reason: String },

    #[error("Credential not found: {id}")]
    CredentialNotFound { id: String },

    #[error("Credential already exists: {id}")]
    CredentialAlreadyExists { id: String },

    #[error("Credential expired")]
    CredentialExpired,

    #[error("Credential revoked")]
    CredentialRevoked,

    #[error("Invalid ZK proof: {reason}")]
    InvalidProof { reason: String },

    #[error("Issuer not authorized: {issuer}")]
    IssuerNotAuthorized { issuer: String },

    #[error("Proposal not found: {id}")]
    ProposalNotFound { id: u64 },

    #[error("Proposal not active")]
    ProposalNotActive,

    #[error("Voting period ended")]
    VotingPeriodEnded,

    #[error("Voting period not ended")]
    VotingPeriodNotEnded,

    #[error("Already voted on proposal {id}")]
    AlreadyVoted { id: u64 },

    #[error("No verified credential for voting")]
    NoVerifiedCredential,

    #[error("Insufficient funds: need {needed}, have {available}")]
    InsufficientFunds { needed: String, available: String },

    #[error("Grant not found: {id}")]
    GrantNotFound { id: u64 },

    #[error("Milestone not found: grant {grant_id}, milestone {milestone_id}")]
    MilestoneNotFound { grant_id: u64, milestone_id: u32 },

    #[error("Invalid allocation: {reason}")]
    InvalidAllocation { reason: String },

    #[error("Quorum not reached")]
    QuorumNotReached,

    #[error("Timelock has not expired yet; executable at height {execute_at}")]
    TimelockNotExpired { execute_at: u64 },

    #[error("Slashing: {reason}")]
    Slashing { reason: String },

    #[error("Overflow error")]
    Overflow,
}
