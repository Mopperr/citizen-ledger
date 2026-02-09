use citizen_common::governance::{VoteOption, VotingMethod};
use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::Uint128;

#[cw_serde]
pub struct InstantiateMsg {
    pub admin: String,
    /// Credential registry contract address (for verifying voter eligibility)
    pub credential_registry: String,
    /// Treasury contract address (for executing approved spends)
    pub treasury_contract: String,
    /// Default voting period in blocks
    pub voting_period: u64,
    /// Default quorum (basis points, e.g. 3000 = 30%)
    pub quorum_bps: u64,
    /// Default pass threshold (basis points, e.g. 5000 = 50%)
    pub threshold_bps: u64,
    /// Timelock period in blocks before a passed proposal can be executed (0 = no timelock)
    pub timelock_period: u64,
}

#[cw_serde]
pub enum ExecuteMsg {
    /// Create a new governance proposal (requires valid credential)
    CreateProposal {
        title: String,
        description: String,
        voting_method: VotingMethod,
        /// Optional custom voting period override
        voting_period: Option<u64>,
    },
    /// Cast a vote (requires valid credential)
    CastVote {
        proposal_id: u64,
        vote: VoteOption,
        /// For quadratic voting: number of tokens to spend on votes
        tokens: Option<Uint128>,
    },
    /// Tally and finalize a proposal after voting ends
    TallyProposal { proposal_id: u64 },
    /// Execute a passed proposal
    ExecuteProposal { proposal_id: u64 },
    /// Cancel a proposal (proposer or admin only)
    CancelProposal { proposal_id: u64 },
    /// Update config (admin only)
    UpdateConfig {
        voting_period: Option<u64>,
        quorum_bps: Option<u64>,
        threshold_bps: Option<u64>,
        timelock_period: Option<u64>,
    },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    /// Get proposal details
    #[returns(ProposalResponse)]
    GetProposal { proposal_id: u64 },

    /// List all proposals
    #[returns(ProposalListResponse)]
    ListProposals {
        start_after: Option<u64>,
        limit: Option<u32>,
        status_filter: Option<String>,
    },

    /// Get vote for a specific voter on a proposal
    #[returns(VoteResponse)]
    GetVote { proposal_id: u64, voter: String },

    /// List all votes for a proposal
    #[returns(VoteListResponse)]
    ListVotes {
        proposal_id: u64,
        start_after: Option<String>,
        limit: Option<u32>,
    },

    /// Get contract config
    #[returns(VotingConfigResponse)]
    Config {},
}

// ── Responses ───────────────────────────────────────────────────────

#[cw_serde]
pub struct ProposalResponse {
    pub id: u64,
    pub proposer: String,
    pub title: String,
    pub description: String,
    pub status: String,
    pub voting_method: VotingMethod,
    pub start_height: u64,
    pub end_height: u64,
    pub votes_for: Uint128,
    pub votes_against: Uint128,
    pub votes_abstain: Uint128,
    pub quorum_bps: u64,
    pub threshold_bps: u64,
    pub execute_at: u64,
}

#[cw_serde]
pub struct ProposalListResponse {
    pub proposals: Vec<ProposalResponse>,
}

#[cw_serde]
pub struct VoteResponse {
    pub voter: String,
    pub proposal_id: u64,
    pub vote: VoteOption,
    pub weight: Uint128,
}

#[cw_serde]
pub struct VoteListResponse {
    pub votes: Vec<VoteResponse>,
}

#[cw_serde]
pub struct VotingConfigResponse {
    pub admin: String,
    pub credential_registry: String,
    pub treasury_contract: String,
    pub voting_period: u64,
    pub quorum_bps: u64,
    pub threshold_bps: u64,
    pub timelock_period: u64,
    pub total_proposals: u64,
}
