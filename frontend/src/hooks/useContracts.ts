// ─────────────────────────────────────────────────────────────────────────────
// Contract interaction hooks for all Citizen Ledger contracts
// ─────────────────────────────────────────────────────────────────────────────

import { useWallet } from "./useWallet";
import { CONTRACTS, DENOM } from "@/config/chain";
import { coin } from "@cosmjs/stargate";

// ── Credential Registry ─────────────────────────────────────────────────────

export function useCredentials() {
  const { client, signingClient, address } = useWallet();

  const hasCredential = async (
    holder: string,
    credentialType: string
  ): Promise<boolean> => {
    if (!client) return false;
    try {
      const res = await client.queryContractSmart(
        CONTRACTS.credentialRegistry,
        {
          has_valid_credential: {
            holder,
            credential_type: credentialType,
          },
        }
      );
      return res.has_credential;
    } catch {
      return false;
    }
  };

  const listCredentials = async (holder: string) => {
    if (!client) return [];
    const res = await client.queryContractSmart(
      CONTRACTS.credentialRegistry,
      { list_credentials: { holder, limit: 50 } }
    );
    return res.credentials;
  };

  const getCredential = async (credentialId: string) => {
    if (!client) return null;
    return client.queryContractSmart(CONTRACTS.credentialRegistry, {
      get_credential: { credential_id: credentialId },
    });
  };

  return { hasCredential, listCredentials, getCredential };
}

// ── Voting / Governance ─────────────────────────────────────────────────────

export function useGovernance() {
  const { client, signingClient, address } = useWallet();

  const listProposals = async (statusFilter?: string) => {
    if (!client) return [];
    const res = await client.queryContractSmart(CONTRACTS.voting, {
      list_proposals: { limit: 50, status_filter: statusFilter },
    });
    return res.proposals;
  };

  const getProposal = async (proposalId: number) => {
    if (!client) return null;
    return client.queryContractSmart(CONTRACTS.voting, {
      get_proposal: { proposal_id: proposalId },
    });
  };

  const createProposal = async (
    title: string,
    description: string,
    votingMethod: "OnePersonOneVote" | "Quadratic",
    votingPeriod?: number
  ) => {
    if (!signingClient || !address) throw new Error("Wallet not connected");
    return signingClient.execute(
      address,
      CONTRACTS.voting,
      {
        create_proposal: {
          title,
          description,
          voting_method: votingMethod,
          voting_period: votingPeriod,
        },
      },
      "auto"
    );
  };

  const castVote = async (
    proposalId: number,
    vote: "Yes" | "No" | "Abstain",
    tokens?: string
  ) => {
    if (!signingClient || !address) throw new Error("Wallet not connected");
    return signingClient.execute(
      address,
      CONTRACTS.voting,
      {
        cast_vote: {
          proposal_id: proposalId,
          vote,
          tokens: tokens || undefined,
        },
      },
      "auto"
    );
  };

  const tallyProposal = async (proposalId: number) => {
    if (!signingClient || !address) throw new Error("Wallet not connected");
    return signingClient.execute(
      address,
      CONTRACTS.voting,
      { tally_proposal: { proposal_id: proposalId } },
      "auto"
    );
  };

  const getVotingConfig = async () => {
    if (!client) return null;
    return client.queryContractSmart(CONTRACTS.voting, { config: {} });
  };

  const listVotes = async (proposalId: number, startAfter?: string, limit?: number) => {
    if (!client) return [];
    const res = await client.queryContractSmart(CONTRACTS.voting, {
      list_votes: { proposal_id: proposalId, start_after: startAfter, limit: limit || 50 },
    });
    return res.votes;
  };

  const getVote = async (proposalId: number, voter: string) => {
    if (!client) return null;
    return client.queryContractSmart(CONTRACTS.voting, {
      get_vote: { proposal_id: proposalId, voter },
    });
  };

  const executeProposal = async (proposalId: number) => {
    if (!signingClient || !address) throw new Error("Wallet not connected");
    return signingClient.execute(
      address,
      CONTRACTS.voting,
      { execute_proposal: { proposal_id: proposalId } },
      "auto"
    );
  };

  return {
    listProposals,
    getProposal,
    createProposal,
    castVote,
    tallyProposal,
    getVotingConfig,
    listVotes,
    getVote,
    executeProposal,
  };
}

// ── Treasury ────────────────────────────────────────────────────────────────

export function useTreasury() {
  const { client, signingClient, address } = useWallet();

  const getBalance = async () => {
    if (!client) return null;
    return client.queryContractSmart(CONTRACTS.treasury, {
      balance: {},
    });
  };

  const getAllocations = async () => {
    if (!client) return null;
    return client.queryContractSmart(CONTRACTS.treasury, {
      allocations: {},
    });
  };

  const getSpendHistory = async (limit?: number) => {
    if (!client) return [];
    const res = await client.queryContractSmart(CONTRACTS.treasury, {
      spend_history: { limit: limit || 20 },
    });
    return res.records;
  };

  const deposit = async (amount: string) => {
    if (!signingClient || !address) throw new Error("Wallet not connected");
    return signingClient.execute(
      address,
      CONTRACTS.treasury,
      { deposit: {} },
      "auto",
      undefined,
      [coin(amount, DENOM)]
    );
  };

  const getTreasuryConfig = async () => {
    if (!client) return null;
    return client.queryContractSmart(CONTRACTS.treasury, { config: {} });
  };

  const getCategorySpend = async (category: string) => {
    if (!client) return null;
    return client.queryContractSmart(CONTRACTS.treasury, {
      category_spend: { category },
    });
  };

  return { getBalance, getAllocations, getSpendHistory, deposit, getTreasuryConfig, getCategorySpend };
}

// ── Grants ──────────────────────────────────────────────────────────────────

export function useGrants() {
  const { client, signingClient, address } = useWallet();

  const listGrants = async (statusFilter?: string) => {
    if (!client) return [];
    const res = await client.queryContractSmart(CONTRACTS.grants, {
      list_grants: { limit: 50, status_filter: statusFilter },
    });
    return res.grants;
  };

  const getGrant = async (grantId: number) => {
    if (!client) return null;
    return client.queryContractSmart(CONTRACTS.grants, {
      get_grant: { grant_id: grantId },
    });
  };

  const applyForGrant = async (
    title: string,
    description: string,
    category: string,
    milestones: { description: string; amount: string }[]
  ) => {
    if (!signingClient || !address) throw new Error("Wallet not connected");
    return signingClient.execute(
      address,
      CONTRACTS.grants,
      {
        apply: {
          title,
          description,
          category,
          milestones,
        },
      },
      "auto"
    );
  };

  const submitMilestone = async (
    grantId: number,
    milestoneId: number,
    evidence: string
  ) => {
    if (!signingClient || !address) throw new Error("Wallet not connected");
    return signingClient.execute(
      address,
      CONTRACTS.grants,
      {
        submit_milestone: {
          grant_id: grantId,
          milestone_id: milestoneId,
          evidence,
        },
      },
      "auto"
    );
  };

  const listGrantsByApplicant = async (applicant?: string) => {
    if (!client) return [];
    const res = await client.queryContractSmart(CONTRACTS.grants, {
      list_grants_by_applicant: { applicant: applicant || address, limit: 50 },
    });
    return res.grants;
  };

  const listResearchCategories = async () => {
    if (!client) return [];
    const res = await client.queryContractSmart(CONTRACTS.grants, {
      list_research_categories: {},
    });
    return res.categories;
  };

  const listResearchCycles = async () => {
    if (!client) return [];
    const res = await client.queryContractSmart(CONTRACTS.grants, {
      list_research_cycles: { limit: 50 },
    });
    return res.cycles;
  };

  return { listGrants, getGrant, applyForGrant, submitMilestone, listGrantsByApplicant, listResearchCategories, listResearchCycles };
}

// ── Staking & Emissions ─────────────────────────────────────────────────────

export function useStaking() {
  const { client, signingClient, address } = useWallet();

  const getSupply = async () => {
    if (!client) return null;
    return client.queryContractSmart(CONTRACTS.stakingEmissions, {
      supply: {},
    });
  };

  const getStakerInfo = async (addr?: string) => {
    if (!client) return null;
    return client.queryContractSmart(CONTRACTS.stakingEmissions, {
      staker: { address: addr || address },
    });
  };

  const getEmissionRate = async () => {
    if (!client) return null;
    return client.queryContractSmart(CONTRACTS.stakingEmissions, {
      current_emission_rate: {},
    });
  };

  const stake = async (amount: string) => {
    if (!signingClient || !address) throw new Error("Wallet not connected");
    return signingClient.execute(
      address,
      CONTRACTS.stakingEmissions,
      { stake: {} },
      "auto",
      undefined,
      [coin(amount, DENOM)]
    );
  };

  const unstake = async (amount: string) => {
    if (!signingClient || !address) throw new Error("Wallet not connected");
    return signingClient.execute(
      address,
      CONTRACTS.stakingEmissions,
      { unstake: { amount } },
      "auto"
    );
  };

  const claimRewards = async () => {
    if (!signingClient || !address) throw new Error("Wallet not connected");
    return signingClient.execute(
      address,
      CONTRACTS.stakingEmissions,
      { claim_rewards: {} },
      "auto"
    );
  };

  const getPendingRewards = async (addr?: string) => {
    if (!client) return null;
    return client.queryContractSmart(CONTRACTS.stakingEmissions, {
      pending_rewards: { address: addr || address },
    });
  };

  const getEmissionSchedule = async () => {
    if (!client) return null;
    return client.queryContractSmart(CONTRACTS.stakingEmissions, {
      emission_schedule: {},
    });
  };

  const getStakingConfig = async () => {
    if (!client) return null;
    return client.queryContractSmart(CONTRACTS.stakingEmissions, { config: {} });
  };

  return {
    getSupply,
    getStakerInfo,
    getEmissionRate,
    stake,
    unstake,
    claimRewards,
    getPendingRewards,
    getEmissionSchedule,
    getStakingConfig,
  };
}
