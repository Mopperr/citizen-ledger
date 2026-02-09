"use client";

import { useState } from "react";
import { DISPLAY_DENOM } from "@/config/chain";

// ── Types ───────────────────────────────────────────────────────────

interface MilestoneStatus {
  id: number;
  name: string;
  budgetPct: number;
  status: "completed" | "in-progress" | "upcoming";
  spentPct: number;
}

interface FacilityReport {
  name: string;
  type: "community-center" | "digital-warehouse";
  location: string;
  status: string;
  uptime?: number;
  monthlyVisitors?: number;
  eventsThisMonth?: number;
  milestones: MilestoneStatus[];
  budget: { allocated: number; spent: number; remaining: number };
}

// ── Mock Data (populated from indexer in production) ─────────────

const FACILITIES: FacilityReport[] = [
  {
    name: "Citizen Community Center — Pilot",
    type: "community-center",
    location: "TBD (pending governance vote)",
    status: "Planning",
    monthlyVisitors: 0,
    eventsThisMonth: 0,
    milestones: [
      { id: 1, name: "Site acquisition + permits", budgetPct: 25, status: "upcoming", spentPct: 0 },
      { id: 2, name: "Construction / renovation", budgetPct: 45, status: "upcoming", spentPct: 0 },
      { id: 3, name: "Equipment + IT setup", budgetPct: 20, status: "upcoming", spentPct: 0 },
      { id: 4, name: "Grand opening", budgetPct: 5, status: "upcoming", spentPct: 0 },
      { id: 5, name: "3-month operational report", budgetPct: 5, status: "upcoming", spentPct: 0 },
    ],
    budget: { allocated: 400000, spent: 0, remaining: 400000 },
  },
  {
    name: "Digital Warehouse — Pilot",
    type: "digital-warehouse",
    location: "TBD (co-located with community center)",
    status: "Planning",
    uptime: 0,
    milestones: [
      { id: 1, name: "Space + connectivity", budgetPct: 30, status: "upcoming", spentPct: 0 },
      { id: 2, name: "Hardware + rack setup", budgetPct: 40, status: "upcoming", spentPct: 0 },
      { id: 3, name: "Software deploy + validator", budgetPct: 20, status: "upcoming", spentPct: 0 },
      { id: 4, name: "90-day uptime report", budgetPct: 10, status: "upcoming", spentPct: 0 },
    ],
    budget: { allocated: 200000, spent: 0, remaining: 200000 },
  },
];

// ── Helpers ──────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: "bg-green-500",
    "in-progress": "bg-yellow-500 animate-pulse",
    upcoming: "bg-gray-300",
  };
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status] || colors.upcoming}`} />;
}

// ── Page Component ──────────────────────────────────────────────

export default function InfrastructurePage() {
  const [tab, setTab] = useState<"overview" | "details">("overview");

  const totalBudget = FACILITIES.reduce((s, f) => s + f.budget.allocated, 0);
  const totalSpent = FACILITIES.reduce((s, f) => s + f.budget.spent, 0);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Infrastructure Reporting</h1>
        <p className="text-gray-500 mt-1">
          Public oversight of community-funded infrastructure projects.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500 uppercase tracking-wider">Active Projects</p>
          <p className="text-2xl font-bold text-citizen-700 mt-1">{FACILITIES.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 uppercase tracking-wider">Total Budget</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">
            {fmt(totalBudget)} {DISPLAY_DENOM}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 uppercase tracking-wider">Total Spent</p>
          <p className="text-2xl font-bold text-yellow-700 mt-1">
            {fmt(totalSpent)} {DISPLAY_DENOM}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 uppercase tracking-wider">Budget Remaining</p>
          <p className="text-2xl font-bold text-green-700 mt-1">
            {fmt(totalBudget - totalSpent)} {DISPLAY_DENOM}
          </p>
        </div>
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-2 border-b">
        {(["overview", "details"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 capitalize transition ${
              tab === t
                ? "border-citizen-600 text-citizen-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        <div className="space-y-6">
          {FACILITIES.map((facility, idx) => (
            <div key={idx} className="card">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {facility.type === "community-center" ? "🏛️" : "🖥️"}{" "}
                    {facility.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Location: {facility.location} &bull; Status:{" "}
                    <span className="font-medium text-citizen-600">{facility.status}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Budget Utilization</p>
                  <p className="text-lg font-bold text-gray-800">
                    {totalBudget > 0
                      ? ((facility.budget.spent / facility.budget.allocated) * 100).toFixed(1)
                      : "0"}
                    %
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-citizen-500 h-3 rounded-full transition-all"
                    style={{
                      width: `${
                        facility.budget.allocated > 0
                          ? (facility.budget.spent / facility.budget.allocated) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{fmt(facility.budget.spent)} spent</span>
                  <span>{fmt(facility.budget.allocated)} total</span>
                </div>
              </div>

              {/* Milestones */}
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-600 mb-2">Milestones</p>
                <div className="space-y-1">
                  {facility.milestones.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 text-sm">
                      <StatusDot status={m.status} />
                      <span className="flex-1 text-gray-700">{m.name}</span>
                      <span className="text-gray-400 w-16 text-right">{m.budgetPct}%</span>
                      <span className="text-xs text-gray-400 w-20 text-right capitalize">
                        {m.status.replace("-", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* KPIs */}
              {(facility.monthlyVisitors !== undefined || facility.uptime !== undefined) && (
                <div className="mt-4 flex gap-6 text-sm">
                  {facility.monthlyVisitors !== undefined && (
                    <div>
                      <span className="text-gray-500">Monthly Visitors:</span>{" "}
                      <span className="font-medium">{fmt(facility.monthlyVisitors)}</span>
                    </div>
                  )}
                  {facility.eventsThisMonth !== undefined && (
                    <div>
                      <span className="text-gray-500">Events This Month:</span>{" "}
                      <span className="font-medium">{facility.eventsThisMonth}</span>
                    </div>
                  )}
                  {facility.uptime !== undefined && (
                    <div>
                      <span className="text-gray-500">Uptime:</span>{" "}
                      <span className="font-medium">{facility.uptime}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Details Tab */}
      {tab === "details" && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Budget Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-4">Project</th>
                    <th className="py-2 pr-4">Allocated</th>
                    <th className="py-2 pr-4">Spent</th>
                    <th className="py-2 pr-4">Remaining</th>
                    <th className="py-2">Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {FACILITIES.map((f, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-2 pr-4 font-medium">{f.name}</td>
                      <td className="py-2 pr-4">{fmt(f.budget.allocated)} {DISPLAY_DENOM}</td>
                      <td className="py-2 pr-4">{fmt(f.budget.spent)} {DISPLAY_DENOM}</td>
                      <td className="py-2 pr-4">{fmt(f.budget.remaining)} {DISPLAY_DENOM}</td>
                      <td className="py-2">
                        {f.budget.allocated > 0
                          ? ((f.budget.spent / f.budget.allocated) * 100).toFixed(1)
                          : "0"}
                        %
                      </td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="py-2 pr-4">Total</td>
                    <td className="py-2 pr-4">{fmt(totalBudget)} {DISPLAY_DENOM}</td>
                    <td className="py-2 pr-4">{fmt(totalSpent)} {DISPLAY_DENOM}</td>
                    <td className="py-2 pr-4">{fmt(totalBudget - totalSpent)} {DISPLAY_DENOM}</td>
                    <td className="py-2">
                      {totalBudget > 0
                        ? ((totalSpent / totalBudget) * 100).toFixed(1)
                        : "0"}
                      %
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Governance Committee</h3>
            <p className="text-sm text-gray-500 mb-3">
              Infrastructure Pilot Committee — elected via governance proposal.
            </p>
            <div className="text-sm text-gray-400 italic">
              Committee members will be displayed here after election via governance vote.
              <br />
              See <span className="text-citizen-600">/governance</span> for active proposals.
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Reports</h3>
            <p className="text-sm text-gray-400 italic">
              Reports will appear here as infrastructure milestones are submitted and verified.
              Each report is stored on IPFS and referenced on-chain.
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 pb-8">
        Infrastructure pilot data sourced from on-chain grant milestones and treasury spend records.
        <br />
        Citizen Ledger — Transparent infrastructure governance.
      </div>
    </div>
  );
}
