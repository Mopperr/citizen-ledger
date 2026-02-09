"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useTreasury,
  useGovernance,
  useGrants,
  useStaking,
} from "@/hooks/useContracts";
import { DISPLAY_DENOM, DECIMALS, CHAIN_ID } from "@/config/chain";
import { PageHeader, LoadingSpinner, CategoryTag } from "@/components/ui";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";

function fmt(amount: string | number): string {
  const n = typeof amount === "string" ? parseInt(amount) : amount;
  return (n / 10 ** DECIMALS).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

// ── Main Dashboard ──────────────────────────────────────────────────────────

export default function TransparencyDashboard() {
  // ── hooks
  const { getBalance, getAllocations, getSpendHistory } = useTreasury();
  const { listProposals, getVotingConfig } = useGovernance();
  const { listGrants } = useGrants();
  const { getSupply, getEmissionRate } = useStaking();

  // ── state
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // treasury
  const [treasuryBalance, setTreasuryBalance] = useState<string>("0");
  const [allocations, setAllocations] = useState<any[]>([]);
  const [spendHistory, setSpendHistory] = useState<any[]>([]);
  const [totalSpent, setTotalSpent] = useState<string>("0");

  // governance
  const [proposals, setProposals] = useState<any[]>([]);
  const [votingConfig, setVotingConfig] = useState<any>(null);

  // grants
  const [grants, setGrants] = useState<any[]>([]);
  const [totalDisbursed, setTotalDisbursed] = useState<string>("0");

  // staking / emissions
  const [supply, setSupply] = useState<any>(null);
  const [emissionRate, setEmissionRate] = useState<any>(null);

  // ── data loader
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [bal, alloc, history, props, config, grantList, sup, emission] =
        await Promise.all([
          getBalance().catch(() => null),
          getAllocations().catch(() => null),
          getSpendHistory(50).catch(() => []),
          listProposals().catch(() => []),
          getVotingConfig().catch(() => null),
          listGrants().catch(() => []),
          getSupply().catch(() => null),
          getEmissionRate().catch(() => null),
        ]);

      // Treasury
      if (bal) setTreasuryBalance(bal.total || "0");
      if (alloc) setAllocations(alloc.allocations || []);
      if (history) {
        setSpendHistory(history);
        const spent = history.reduce(
          (acc: number, r: any) => acc + parseInt(r.amount || "0"),
          0
        );
        setTotalSpent(spent.toString());
      }

      // Governance
      if (props) setProposals(props);
      if (config) setVotingConfig(config);

      // Grants
      if (grantList) {
        setGrants(grantList);
        const disbursed = grantList.reduce(
          (acc: number, g: any) => acc + parseInt(g.total_disbursed || "0"),
          0
        );
        setTotalDisbursed(disbursed.toString());
      }

      // Staking
      if (sup) setSupply(sup);
      if (emission) setEmissionRate(emission);

      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ── derived stats
  const proposalsByStatus = (status: string) =>
    proposals.filter((p: any) => p.status === status).length;

  const grantsByStatus = (status: string) =>
    grants.filter((g: any) => g.status === status).length;

  const maxSupply = 1_000_000_000_000; // 1T ucitizen
  const totalMinted = supply ? parseInt(supply.total_minted || "0") : 0;
  const totalStaked = supply ? parseInt(supply.total_staked || "0") : 0;
  const mintProgress = maxSupply > 0 ? (totalMinted / maxSupply) * 100 : 0;

  // ── render
  return (
    <div className="space-y-10">
      {/* Header */}
      <PageHeader
        title="Transparency Dashboard"
        description="Real-time on-chain data — fully public, no wallet required."
        icon="🔍"
        actions={
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <span className="text-xs text-gray-400">
                Updated {lastRefresh.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={loadAll}
              disabled={loading}
              className="btn-primary text-sm px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        }
      />

      {loading && proposals.length === 0 && <LoadingSpinner />}

      {/* ═══════════ TREASURY ═══════════ */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">🏛️</span> Treasury
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Balance"
            value={`${fmt(treasuryBalance)} ${DISPLAY_DENOM}`}
          />
          <StatCard
            title="Total Spent"
            value={`${fmt(totalSpent)} ${DISPLAY_DENOM}`}
            accent="yellow"
          />
          <StatCard
            title="Allocations"
            value={allocations.length.toString()}
            subtitle="Category buckets"
            accent="blue"
          />
          <StatCard
            title="Transactions"
            value={spendHistory.length.toString()}
            subtitle="Spend records"
            accent="purple"
          />
        </div>

        {/* Allocation Breakdown */}
        {allocations.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Budget Allocation Breakdown
            </h3>
            <div className="space-y-2">
              {allocations.map((a: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-28 capitalize">
                    {a.category?.replace(/_/g, " ") || `Category ${i}`}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-citizen-500 h-4 rounded-full transition-all"
                      style={{ width: `${(a.bps || 0) / 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-14 text-right">
                    {((a.bps || 0) / 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Spend History */}
        {spendHistory.length > 0 && (
          <div className="card mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Recent Treasury Transactions
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-4">Recipient</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Category</th>
                    <th className="py-2">Block</th>
                  </tr>
                </thead>
                <tbody>
                  {spendHistory.slice(0, 10).map((r: any, i: number) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-2 pr-4 font-mono text-xs">
                        {r.recipient
                          ? `${r.recipient.slice(0, 12)}...${r.recipient.slice(-6)}`
                          : "—"}
                      </td>
                      <td className="py-2 pr-4 font-medium">
                        {fmt(r.amount || "0")} {DISPLAY_DENOM}
                      </td>
                      <td className="py-2 pr-4 capitalize">
                        {r.category?.replace(/_/g, " ") || "—"}
                      </td>
                      <td className="py-2 text-gray-400">
                        #{r.block_height || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ═══════════ GOVERNANCE ═══════════ */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">🗳️</span> Governance
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatCard title="Total Proposals" value={proposals.length.toString()} />
          <StatCard
            title="Active"
            value={proposalsByStatus("Active").toString()}
            accent="green"
          />
          <StatCard
            title="Timelocked"
            value={proposalsByStatus("Timelocked").toString()}
            accent="yellow"
          />
          <StatCard
            title="Passed"
            value={proposalsByStatus("Passed").toString()}
            accent="blue"
          />
          <StatCard
            title="Executed"
            value={proposalsByStatus("Executed").toString()}
            accent="purple"
          />
          <StatCard
            title="Rejected"
            value={proposalsByStatus("Rejected").toString()}
            accent="red"
          />
        </div>

        {/* Voting Configuration */}
        {votingConfig && (
          <div className="card">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Governance Parameters
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Voting Period</span>
                <p className="font-medium">
                  {votingConfig.voting_period?.toLocaleString() || "—"} blocks
                </p>
              </div>
              <div>
                <span className="text-gray-500">Quorum</span>
                <p className="font-medium">
                  {((votingConfig.quorum_bps || 0) / 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <span className="text-gray-500">Threshold</span>
                <p className="font-medium">
                  {((votingConfig.threshold_bps || 0) / 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <span className="text-gray-500">Timelock</span>
                <p className="font-medium">
                  {votingConfig.timelock_period?.toLocaleString() || "0"} blocks
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Proposals */}
        {proposals.length > 0 && (
          <div className="card mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Recent Proposals
            </h3>
            <div className="space-y-2">
              {proposals.slice(0, 8).map((p: any, i: number) => {
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-8">
                        #{p.id}
                      </span>
                      <span className="text-sm font-medium text-gray-800">
                        {p.title}
                      </span>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ═══════════ GRANTS ═══════════ */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">🎯</span> Grants Pipeline
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <StatCard title="Total Grants" value={grants.length.toString()} />
          <StatCard
            title="Pending"
            value={grantsByStatus("Pending").toString()}
            accent="yellow"
          />
          <StatCard
            title="Approved"
            value={grantsByStatus("Approved").toString()}
            accent="green"
          />
          <StatCard
            title="Completed"
            value={grantsByStatus("Completed").toString()}
            accent="blue"
          />
          <StatCard
            title="Total Disbursed"
            value={`${fmt(totalDisbursed)} ${DISPLAY_DENOM}`}
            accent="purple"
          />
        </div>

        {/* Active Grants */}
        {grants.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Active Grant Funding
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-4">ID</th>
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4">Applicant</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {grants.slice(0, 10).map((g: any, i: number) => {
                    return (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-2 pr-4 text-gray-400">#{g.id}</td>
                        <td className="py-2 pr-4 font-medium">{g.title}</td>
                        <td className="py-2 pr-4 font-mono text-xs">
                          {g.applicant
                            ? `${g.applicant.slice(0, 10)}...${g.applicant.slice(-6)}`
                            : "—"}
                        </td>
                        <td className="py-2 pr-4">
                          {fmt(g.total_amount || "0")} {DISPLAY_DENOM}
                        </td>
                        <td className="py-2">
                          <StatusBadge status={g.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ═══════════ STAKING & EMISSIONS ═══════════ */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">⚡</span> Staking &amp; Emissions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Staked"
            value={supply ? `${fmt(totalStaked)} ${DISPLAY_DENOM}` : "—"}
            accent="green"
          />
          <StatCard
            title="Total Minted"
            value={supply ? `${fmt(totalMinted)} ${DISPLAY_DENOM}` : "—"}
            accent="blue"
          />
          <StatCard
            title="Max Supply"
            value={`${fmt(maxSupply)} ${DISPLAY_DENOM}`}
            accent="purple"
          />
          <StatCard
            title="Current Rate"
            value={
              emissionRate
                ? `${fmt(emissionRate.rate_per_block || "0")} / block`
                : "—"
            }
            accent="yellow"
          />
        </div>

        {/* Emission Progress Bar */}
        <div className="card">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Emission Progress
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
              <div
                className="bg-gradient-to-r from-citizen-400 to-citizen-600 h-6 rounded-full transition-all flex items-center justify-end pr-2"
                style={{ width: `${Math.min(mintProgress, 100)}%` }}
              >
                {mintProgress > 10 && (
                  <span className="text-xs font-medium text-white">
                    {mintProgress.toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
            {mintProgress <= 10 && (
              <span className="text-sm font-medium text-gray-600">
                {mintProgress.toFixed(2)}%
              </span>
            )}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>Genesis</span>
            <span>
              Phase 1 (25%) &bull; Phase 2 (50%) &bull; Phase 3 (75%) &bull;
              Phase 4 (100%)
            </span>
            <span>1T {DISPLAY_DENOM}</span>
          </div>
        </div>
      </section>

      {/* ═══════════ NETWORK INFO ═══════════ */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">🌐</span> Network Information
        </h2>
        <div className="card">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
            <div>
              <span className="text-gray-500">Chain ID</span>
              <p className="font-mono font-medium">{CHAIN_ID}</p>
            </div>
            <div>
              <span className="text-gray-500">Native Token</span>
              <p className="font-medium">{DISPLAY_DENOM} (ucitizen)</p>
            </div>
            <div>
              <span className="text-gray-500">Consensus</span>
              <p className="font-medium">CometBFT (Tendermint)</p>
            </div>
            <div>
              <span className="text-gray-500">Smart Contracts</span>
              <p className="font-medium">CosmWasm v2</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Note */}
      <div className="text-center text-xs text-gray-400 pb-8">
        All data sourced directly from on-chain state. No wallet connection
        required.
        <br />
        Citizen Ledger &mdash; Transparent governance by design.
      </div>
    </div>
  );
}
