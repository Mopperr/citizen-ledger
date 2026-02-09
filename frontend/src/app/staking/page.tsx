"use client";

import { useState, useEffect } from "react";
import { useStaking } from "@/hooks/useContracts";
import { useWallet } from "@/hooks/useWallet";
import { DISPLAY_DENOM, DECIMALS } from "@/config/chain";

function formatAmount(amount: string | number): string {
  const n = typeof amount === "string" ? parseInt(amount) : amount;
  return (n / 10 ** DECIMALS).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

export default function StakingPage() {
  const { address } = useWallet();
  const { getSupply, getStakerInfo, getEmissionRate, stake, unstake, claimRewards } =
    useStaking();
  const [supply, setSupply] = useState<any>(null);
  const [staker, setStaker] = useState<any>(null);
  const [emissionRate, setEmissionRate] = useState<any>(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");

  useEffect(() => {
    loadData();
  }, [address]);

  const loadData = async () => {
    try {
      const [s, e] = await Promise.all([getSupply(), getEmissionRate()]);
      setSupply(s);
      setEmissionRate(e);
      if (address) {
        const info = await getStakerInfo();
        setStaker(info);
      }
    } catch {}
  };

  const handleStake = async () => {
    if (!stakeAmount) return;
    try {
      const micro = (parseFloat(stakeAmount) * 10 ** DECIMALS).toString();
      await stake(micro);
      setStakeAmount("");
      await loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleUnstake = async () => {
    if (!unstakeAmount) return;
    try {
      const micro = (parseFloat(unstakeAmount) * 10 ** DECIMALS).toString();
      await unstake(micro);
      setUnstakeAmount("");
      await loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleClaim = async () => {
    try {
      await claimRewards();
      await loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Staking & Emissions
      </h1>

      {/* Supply Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Max Supply",
            value: supply ? formatAmount(supply.max_supply) : "—",
          },
          {
            label: "Total Minted",
            value: supply ? formatAmount(supply.total_minted) : "—",
          },
          {
            label: "Total Staked",
            value: supply ? formatAmount(supply.total_staked) : "—",
          },
          {
            label: "Remaining",
            value: supply ? formatAmount(supply.remaining_to_mint) : "—",
          },
        ].map((stat) => (
          <div key={stat.label} className="card text-center">
            <div className="text-xl font-bold text-citizen-700">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Emission rate */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold mb-3">Current Emission Rate</h2>
        {emissionRate ? (
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Phase:</span>{" "}
              <span className="font-medium">{emissionRate.current_phase}</span>
            </div>
            <div>
              <span className="text-gray-500">Per Block:</span>{" "}
              <span className="font-medium">
                {formatAmount(emissionRate.tokens_per_block)} {DISPLAY_DENOM}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Blocks Remaining:</span>{" "}
              <span className="font-medium">
                {emissionRate.blocks_remaining_in_phase?.toLocaleString() || "—"}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">Connect to chain to view</p>
        )}
      </div>

      {/* Staker info + actions */}
      {address && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* My stake */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">My Stake</h2>
            {staker ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Staked:</span>
                  <span className="font-medium">
                    {formatAmount(staker.staked)} {DISPLAY_DENOM}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Pending Rewards:</span>
                  <span className="font-medium text-citizen-600">
                    {formatAmount(staker.pending_rewards)} {DISPLAY_DENOM}
                  </span>
                </div>
                <button onClick={handleClaim} className="btn-primary w-full mt-4">
                  Claim Rewards
                </button>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">
                No staking position found
              </p>
            )}
          </div>

          {/* Stake / Unstake */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">Stake / Unstake</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder={`Stake amount (${DISPLAY_DENOM})`}
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button onClick={handleStake} className="btn-primary text-sm">
                  Stake
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder={`Unstake amount (${DISPLAY_DENOM})`}
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button onClick={handleUnstake} className="btn-secondary text-sm">
                  Unstake
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
