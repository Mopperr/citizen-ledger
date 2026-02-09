"use client";

import { useState, useEffect } from "react";
import { useTreasury } from "@/hooks/useContracts";
import { useWallet } from "@/hooks/useWallet";
import { DISPLAY_DENOM, DECIMALS } from "@/config/chain";

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [b, a, h] = await Promise.all([
        getBalance(),
        getAllocations(),
        getSpendHistory(20),
      ]);
      setBalance(b);
      setAllocations(a);
      setHistory(h);
    } catch {}
  };

  const handleDeposit = async () => {
    if (!depositAmount) return;
    try {
      const amountMicro = (parseFloat(depositAmount) * 10 ** DECIMALS).toString();
      await deposit(amountMicro);
      setDepositAmount("");
      await loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const categoryColors: Record<string, string> = {
    infrastructure: "bg-blue-100 text-blue-800",
    education: "bg-purple-100 text-purple-800",
    healthcare: "bg-green-100 text-green-800",
    research: "bg-yellow-100 text-yellow-800",
    emergency: "bg-red-100 text-red-800",
    node_incentives: "bg-orange-100 text-orange-800",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Community Treasury</h1>

      {/* Balance + Deposit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Treasury Balance
          </h2>
          <div className="text-3xl font-bold text-citizen-700 mt-2">
            {balance
              ? `${formatAmount(balance.total)} ${DISPLAY_DENOM}`
              : "—"}
          </div>
        </div>

        {address && (
          <div className="card">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Deposit Funds
            </h2>
            <div className="flex items-center gap-3 mt-3">
              <input
                type="number"
                placeholder={`Amount (${DISPLAY_DENOM})`}
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              />
              <button onClick={handleDeposit} className="btn-primary">
                Deposit
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Allocations */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold mb-4">Fund Allocations</h2>
        {allocations ? (
          <div className="space-y-3">
            {allocations.allocations.map(([cat, bps]: [string, number]) => (
              <div key={cat} className="flex items-center gap-3">
                <span
                  className={`badge ${categoryColors[cat.toLowerCase()] || "bg-gray-100 text-gray-800"}`}
                >
                  {cat}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-3">
                  <div
                    className="bg-citizen-500 h-3 rounded-full"
                    style={{ width: `${bps / 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">
                  {bps / 100}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">
            Connect to a running chain to view allocations
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
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">ID</th>
                  <th className="pb-2">Recipient</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2">Memo</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50">
                    <td className="py-2">{r.id}</td>
                    <td className="py-2 font-mono text-xs">
                      {r.recipient.slice(0, 12)}...
                    </td>
                    <td className="py-2">
                      {formatAmount(r.amount)} {DISPLAY_DENOM}
                    </td>
                    <td className="py-2">
                      <span
                        className={`badge ${categoryColors[r.category.toLowerCase()] || ""}`}
                      >
                        {r.category}
                      </span>
                    </td>
                    <td className="py-2 text-gray-500">{r.memo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No spending records yet</p>
        )}
      </div>
    </div>
  );
}
