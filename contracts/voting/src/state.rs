use citizen_common::governance::{ProposalStatus, VoteOption, VotingMethod};
use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Uint128};
use cw_storage_plus::{Item, Map};

pub const ADMIN: Item<Addr> = Item::new("admin");
pub const CREDENTIAL_REGISTRY: Item<Addr> = Item::new("cred_reg");
pub const TREASURY: Item<Addr> = Item::new("treasury");
pub const VOTING_PERIOD: Item<u64> = Item::new("voting_period");
pub const QUORUM_BPS: Item<u64> = Item::new("quorum_bps");
pub const THRESHOLD_BPS: Item<u64> = Item::new("threshold_bps");
pub const TIMELOCK_PERIOD: Item<u64> = Item::new("timelock_period");
pub const PROPOSAL_COUNT: Item<u64> = Item::new("prop_count");

/// Proposals by ID
pub const PROPOSALS: Map<u64, StoredProposal> = Map::new("proposals");

/// Votes: (proposal_id, voter_addr) → vote
pub const VOTES: Map<(u64, &Addr), StoredVote> = Map::new("votes");

#[cw_serde]
pub struct StoredProposal {
    pub id: u64,
    pub proposer: Addr,
    pub title: String,
    pub description: String,
    pub status: ProposalStatus,
    pub voting_method: VotingMethod,
    pub start_height: u64,
    pub end_height: u64,
    pub votes_for: Uint128,
    pub votes_against: Uint128,
    pub votes_abstain: Uint128,
    pub quorum_bps: u64,
    pub threshold_bps: u64,
    pub total_voters: u64,
    /// Block height at which timelock expires and proposal can be executed
    pub execute_at: u64,
}

#[cw_serde]
pub struct StoredVote {
    pub voter: Addr,
    pub proposal_id: u64,
    pub vote: VoteOption,
    pub weight: Uint128,
}
