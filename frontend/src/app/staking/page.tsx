"use client";

import { useState, useEffect, useCallback } from "react";
import { useStaking } from "@/hooks/useContracts";
import { useWallet } from "@/hooks/useWallet";
import { DISPLAY_DENOM, DECIMALS } from "@/config/chain";
import { PageHeader, LoadingSpinner } from "@/components/ui";
import StatCard from "@/components/ui/StatCard";

function formatAmount(amount: string | number): string {
  const n = typeof amount === "string" ? parseInt(amount) : amount;
  return (n / 10 ** DECIMALS).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

export default function StakingPage() {
  const { address } = useWallet();
  const {
    getSupply,
    getStakerInfo,
    getEmissionRate,
    getEmissionSchedule,
    getPendingRewards,
    stake,
    unstake,
    claimRewards,
  } = useStaking();
  const [supply, setSupply] = useState<any>(null);
  const [staker, setStaker] = useState<any>(null);
  const [pendingRewards, setPendingRewards] = useState<any>(null);
  const [emissionRate, setEmissionRate] = useState<any>(null);
  const [schedule, setSchedule] = useState<any>(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, e, sch] = await Promise.all([
        getSupply(),
        getEmissionRate(),
        getEmissionSchedule(),
      ]);
      setSupply(s);
      setEmissionRate(e);
      setSchedule(sch);
      if (address) {
        const [info, rewards] = await Promise.all([
          getStakerInfo().catch(() => null),
          getPendingRewards().catch(() => null),
        ]);
        setStaker(info);
        setPendingRewards(rewards);
      }
    } catch {
      setError("Unable to connect to chain. Staking data will appear once the network is live.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStake = async () => {
    if (!stakeAmount) return;
    setActionLoading("stake");
    try {
      const micro = (parseFloat(stakeAmount) * 10 ** DECIMALS).toString();
      await stake(micro);
      setStakeAmount("");
      await loadData();
    } catch (e: any) {
      setError(e.message);
    }
    setActionLoading(null);
  };

  const handleUnstake = async () => {
    if (!unstakeAmount) return;
    setActionLoading("unstake");
    try {
      const micro = (parseFloat(unstakeAmount) * 10 ** DECIMALS).toString();
      await unstake(micro);
      setUnstakeAmount("");
      await loadData();
    } catch (e: any) {
      setError(e.message);
    }
    setActionLoading(null);
  };

  const handleClaim = async () => {
    setActionLoading("claim");
    try {
      await claimRewards();
      await loadData();
    } catch (e: any) {
      setError(e.message);
    }
    setActionLoading(null);
  };

  const maxSupply = supply ? parseInt(supply.max_supply || "0") : 1_000_000_000_000;
  const totalMinted = supply ? parseInt(supply.total_minted || "0") : 0;
  const totalStaked = supply ? parseInt(supply.total_staked || "0") : 0;
  const remaining = supply ? parseInt(supply.remaining_to_mint || "0") : 0;
  const mintProgress = maxSupply > 0 ? (totalMinted / maxSupply) * 100 : 0;
  const stakeRatio = totalMinted > 0 ? (totalStaked / totalMinted) * 100 : 0;

  if (loading) {
    return (
      <div>
        <PageHeader title="Staking & Emissions" description="Stake CITIZEN tokens, earn rewards, and secure the network." icon="⚡" />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Staking & Emissions"
        description="Stake CITIZEN tokens, earn rewards, and secure the network."
        icon="⚡"
        actions={
          <button onClick={loadData} className="btn-secondary text-sm">
            Refresh
          </button>
        }
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Supply Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Max Supply" value={formatAmount(maxSupply)} subtitle={DISPLAY_DENOM} icon="🏔️" accent="purple" />
        <StatCard title="Total Minted" value={formatAmount(totalMinted)} subtitle={`${mintProgress.toFixed(2)}% of max`} icon="🪙" accent="blue" />
        <StatCard title="Total Staked" value={formatAmount(totalStaked)} subtitle={`${stakeRatio.toFixed(1)}% staked`} icon="🔒" accent="green" />
        <StatCard title="Remaining" value={formatAmount(remaining)} subtitle="Left to mint" icon="📦" accent="yellow" />
      </div>

      {/* Emission Progress */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold mb-4">Emission Progress</h2>
        <div className="flex items-center gap-4 mb-3">
          <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
            <div
              className="bg-gradient-to-r from-citizen-400 to-citizen-600 h-6 rounded-full transition-all flex items-center justify-end pr-3"
              style={{ width: `${Math.max(Math.min(mintProgress, 100), 2)}%` }}
            >
              {mintProgress > 8 && (
                <span className="text-xs font-bold text-white">{mintProgress.toFixed(2)}%</span>
              )}
            </div>
          </div>
          {mintProgress <= 8 && (
            <span className="text-sm font-medium text-gray-600">{mintProgress.toFixed(2)}%</span>
          )}
        </div>

        {/* Emission rate info */}
        {emissionRate && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Current Phase</span>
              <p className="font-semibold text-gray-900 mt-1">{emissionRate.current_phase || "—"}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Per Block</span>
              <p className="font-semibold text-gray-900 mt-1">
                {formatAmount(emissionRate.tokens_per_block || emissionRate.rate_per_block || "0")} {DISPLAY_DENOM}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Blocks Remaining</span>
              <p className="font-semibold text-gray-900 mt-1">
                {emissionRate.blocks_remaining_in_phase?.toLocaleString() || "—"}
              </p>
            </div>
          </div>
        )}

        {/* Emission Schedule */}
        {schedule?.phases && schedule.phases.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-600 mb-3">Emission Phases</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="pb-2 font-medium">Phase</th>
                    <th className="pb-2 font-medium">Start Block</th>
                    <th className="pb-2 font-medium">End Block</th>
                    <th className="pb-2 font-medium">Rate/Block</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.phases.map((phase: any, i: number) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-2 font-medium">{phase.label || `Phase ${i + 1}`}</td>
                      <td className="py-2 text-gray-600">{phase.start_block?.toLocaleString()}</td>
                      <td className="py-2 text-gray-600">{phase.end_block?.toLocaleString()}</td>
                      <td className="py-2 font-medium text-citizen-700">
                        {formatAmount(phase.tokens_per_block || "0")} {DISPLAY_DENOM}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Staker info + actions */}
      {address ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Stake */}
          <div className="card border-l-4 border-green-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🔒</span> My Stake
            </h2>
            {staker ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-500">Staked</span>
                  <span className="font-bold text-lg text-gray-900">
                    {formatAmount(staker.staked || "0")} {DISPLAY_DENOM}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-citizen-50 rounded-lg">
                  <span className="text-citizen-600">Pending Rewards</span>
                  <span className="font-bold text-lg text-citizen-700">
                    {formatAmount(pendingRewards?.pending || staker.pending_rewards || "0")} {DISPLAY_DENOM}
                  </span>
                </div>
                <button
                  onClick={handleClaim}
                  disabled={actionLoading === "claim"}
                  className="btn-primary w-full mt-2 disabled:opacity-50"
                >
                  {actionLoading === "claim" ? "Claiming..." : "Claim Rewards"}
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="text-3xl">🌱</span>
                <p className="text-gray-500 mt-3">No staking position found</p>
                <p className="text-xs text-gray-400 mt-1">Stake tokens to start earning rewards</p>
              </div>
            )}
          </div>

          {/* Stake / Unstake */}
          <div className="card border-l-4 border-blue-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>⚡</span> Stake / Unstake
            </h2>
            <div className="space-y-5">
              <div>
                <label className="text-sm text-gray-600 font-medium mb-2 block">Stake Tokens</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder={`Amount (${DISPLAY_DENOM})`}
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-citizen-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleStake}
                    disabled={actionLoading === "stake" || !stakeAmount}
                    className="btn-primary disabled:opacity-50"
                  >
                    {actionLoading === "stake" ? "..." : "Stake"}
                  </button>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-5">
                <label className="text-sm text-gray-600 font-medium mb-2 block">Unstake Tokens</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder={`Amount (${DISPLAY_DENOM})`}
                    value={unstakeAmount}
                    onChange={(e) => setUnstakeAmount(e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-citizen-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleUnstake}
                    disabled={actionLoading === "unstake" || !unstakeAmount}
                    className="btn-secondary disabled:opacity-50"
                  >
                    {actionLoading === "unstake" ? "..." : "Unstake"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <span className="text-4xl">🔗</span>
          <h3 className="text-lg font-semibold text-gray-700 mt-4">Connect Wallet to Stake</h3>
          <p className="text-sm text-gray-400 mt-2">
            Connect your wallet to stake tokens, earn rewards, and participate in securing the network.
          </p>
        </div>
      )}
    </div>
  );
}
