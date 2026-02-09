use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Uint128};

/// Proposal status lifecycle
#[cw_serde]
pub enum ProposalStatus {
    /// Open for voting
    Active,
    /// Voting passed, waiting for timelock to expire
    Timelocked,
    /// Timelock expired, ready to execute
    Passed,
    /// Voting period ended, rejected
    Rejected,
    /// Passed and executed on-chain
    Executed,
    /// Cancelled by proposer or governance
    Cancelled,
    /// Expired without reaching quorum
    Expired,
}

/// Types of voting supported
#[cw_serde]
pub enum VotingMethod {
    /// One credential = one vote
    OnePersonOneVote,
    /// Quadratic voting: cost of N votes = N^2 tokens
    Quadratic,
}

/// A governance proposal
#[cw_serde]
pub struct Proposal {
    pub id: u64,
    pub proposer: Addr,
    pub title: String,
    pub description: String,
    pub status: ProposalStatus,
    pub voting_method: VotingMethod,
    /// Block height when voting starts
    pub start_height: u64,
    /// Block height when voting ends
    pub end_height: u64,
    /// Total votes for
    pub votes_for: Uint128,
    /// Total votes against
    pub votes_against: Uint128,
    /// Total votes abstain
    pub votes_abstain: Uint128,
    /// Minimum participation required (as percentage * 100, e.g. 3000 = 30%)
    pub quorum_bps: u64,
    /// Minimum yes-vote percentage to pass (basis points)
    pub threshold_bps: u64,
}

/// Individual vote record
#[cw_serde]
pub struct Vote {
    pub voter: Addr,
    pub proposal_id: u64,
    pub vote_option: VoteOption,
    pub weight: Uint128,
}

#[cw_serde]
pub enum VoteOption {
    Yes,
    No,
    Abstain,
}
