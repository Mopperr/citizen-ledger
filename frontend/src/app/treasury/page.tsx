"use client";

import { useState, useEffect, useCallback } from "react";
import { useTreasury } from "@/hooks/useContracts";
import { useWallet } from "@/hooks/useWallet";
import { DISPLAY_DENOM, DECIMALS } from "@/config/chain";
import { PageHeader, EmptyState, LoadingSpinner, CategoryTag } from "@/components/ui";
import StatCard from "@/components/ui/StatCard";

function formatAmount(amount: string | number): string {
  const n = typeof amount === "string" ? parseInt(amount) : amount;
  return (n / 10 ** DECIMALS).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

export default function TreasuryPage() {
  const { address } = useWallet();
  const { getBalance, getAllocations, getSpendHistory, deposit } = useTreasury();
  const [balance, setBalance] = useState<any>(null);
  const [allocations, setAllocations] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [depositAmount, setDepositAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [b, a, h] = await Promise.all([
        getBalance(),
        getAllocations(),
        getSpendHistory(20),
      ]);
      setBalance(b);
      setAllocations(a);
      setHistory(h);
    } catch {
      setError("Unable to connect to chain. Treasury data will appear once the network is live.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeposit = async () => {
    if (!depositAmount) return;
    setActionLoading(true);
    try {
      const amountMicro = (parseFloat(depositAmount) * 10 ** DECIMALS).toString();
      await deposit(amountMicro);
      setDepositAmount("");
      await loadData();
    } catch (e: any) {
      setError(e.message);
    }
    setActionLoading(false);
  };

  const totalSpent = history.reduce(
    (acc, r) => acc + parseInt(r.amount || "0"),
    0
  );

  if (loading) {
    return (
      <div>
        <PageHeader title="Community Treasury" description="Transparent, on-chain fund management with citizen-controlled allocations." icon="🏛️" />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Community Treasury"
        description="Transparent, on-chain fund management with citizen-controlled allocations."
        icon="🏛️"
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

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Treasury Balance"
          value={balance ? `${formatAmount(balance.total)} ${DISPLAY_DENOM}` : "—"}
          icon="💰"
          accent="citizen"
        />
        <StatCard
          title="Total Spent"
          value={`${formatAmount(totalSpent)} ${DISPLAY_DENOM}`}
          icon="📤"
          accent="yellow"
        />
        <StatCard
          title="Allocations"
          value={allocations ? allocations.allocations?.length?.toString() || "0" : "—"}
          subtitle="Category buckets"
          icon="📊"
          accent="blue"
        />
        <StatCard
          title="Transactions"
          value={history.length.toString()}
          subtitle="Spend records"
          icon="📋"
          accent="purple"
        />
      </div>

      {/* Deposit Section */}
      {address && (
        <div className="card mb-8 border-l-4 border-citizen-200">
          <h2 className="text-lg font-semibold mb-3">Deposit Funds</h2>
          <p className="text-sm text-gray-500 mb-4">Contribute to the community treasury to fund public-benefit programs.</p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder={`Amount (${DISPLAY_DENOM})`}
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-citizen-500 focus:border-transparent"
            />
            <button
              onClick={handleDeposit}
              disabled={actionLoading || !depositAmount}
              className="btn-primary disabled:opacity-50"
            >
              {actionLoading ? "Depositing..." : "Deposit"}
            </button>
          </div>
        </div>
      )}

      {/* Allocations */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold mb-4">Fund Allocations</h2>
        {allocations && allocations.allocations?.length > 0 ? (
          <div className="space-y-4">
            {allocations.allocations.map(([cat, bps]: [string, number]) => (
              <div key={cat}>
                <div className="flex items-center justify-between mb-1">
                  <CategoryTag category={cat} size="md" />
                  <span className="text-sm font-semibold text-gray-700">
                    {(bps / 100).toFixed(1)}%
                  </span>
                </div>
                <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-citizen-400 to-citizen-600 h-3 rounded-full transition-all"
                    style={{ width: `${bps / 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">
            Allocation data will appear once the network is live.
          </p>
        )}
      </div>

      {/* Spend history */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Spending History</h2>
        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-3 font-medium">ID</th>
                  <th className="pb-3 font-medium">Recipient</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Memo</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 text-gray-400">#{r.id}</td>
                    <td className="py-3 font-mono text-xs">
                      {r.recipient?.slice(0, 12)}...{r.recipient?.slice(-6)}
                    </td>
                    <td className="py-3 font-medium">
                      {formatAmount(r.amount)} {DISPLAY_DENOM}
                    </td>
                    <td className="py-3">
                      <CategoryTag category={r.category || "unknown"} />
                    </td>
                    <td className="py-3 text-gray-500 max-w-[200px] truncate">{r.memo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon="📜"
            title="No spending records yet"
            description="Treasury transactions will appear here as funds are allocated to public programs."
          />
        )}
      </div>
    </div>
  );
}
