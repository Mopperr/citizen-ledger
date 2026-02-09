"use client";

import { useState, useEffect, useCallback } from "react";
import { useGrants } from "@/hooks/useContracts";
import { useWallet } from "@/hooks/useWallet";
import { DISPLAY_DENOM, DECIMALS } from "@/config/chain";
import { PageHeader, EmptyState, LoadingSpinner, CategoryTag } from "@/components/ui";
import StatusBadge from "@/components/ui/StatusBadge";

function formatAmount(amount: string | number): string {
  const n = typeof amount === "string" ? parseInt(amount) : amount;
  return (n / 10 ** DECIMALS).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

const CATEGORIES = ["Infrastructure", "Education", "Healthcare", "Research", "Emergency"];

export default function GrantsPage() {
  const { address } = useWallet();
  const { listGrants, applyForGrant, submitMilestone } = useGrants();
  const [grants, setGrants] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Infrastructure",
    milestones: [{ description: "", amount: "" }],
  });

  const loadGrants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listGrants(statusFilter || undefined);
      setGrants(data || []);
    } catch {
      setError("Unable to connect to chain. Grants will appear once the network is live.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadGrants();
  }, [loadGrants]);

  const addMilestone = () => {
    setForm({
      ...form,
      milestones: [...form.milestones, { description: "", amount: "" }],
    });
  };

  const removeMilestone = (idx: number) => {
    if (form.milestones.length <= 1) return;
    setForm({
      ...form,
      milestones: form.milestones.filter((_, i) => i !== idx),
    });
  };

  const updateMilestone = (idx: number, field: string, value: string) => {
    const updated = [...form.milestones];
    (updated[idx] as any)[field] = value;
    setForm({ ...form, milestones: updated });
  };

  const handleApply = async () => {
    if (!form.title || !form.description) return;
    setActionLoading("apply");
    try {
      const milestones = form.milestones.map((m) => ({
        description: m.description,
        amount: (parseFloat(m.amount || "0") * 10 ** DECIMALS).toString(),
      }));
      await applyForGrant(form.title, form.description, form.category, milestones);
      setShowForm(false);
      setForm({
        title: "",
        description: "",
        category: "Infrastructure",
        milestones: [{ description: "", amount: "" }],
      });
      await loadGrants();
    } catch (e: any) {
      setError(e.message);
    }
    setActionLoading(null);
  };

  const handleSubmitMilestone = async (grantId: number, milestoneId: number) => {
    const evidence = prompt("Provide evidence URL or description for this milestone:");
    if (!evidence) return;
    setActionLoading(`ms-${grantId}-${milestoneId}`);
    try {
      await submitMilestone(grantId, milestoneId, evidence);
      await loadGrants();
    } catch (e: any) {
      setError(e.message);
    }
    setActionLoading(null);
  };

  const totalGrantValue = grants.reduce(
    (acc, g) => acc + parseInt(g.total_amount || "0"),
    0
  );

  return (
    <div>
      <PageHeader
        title="Grants"
        description="Milestone-based public funding for research, infrastructure, and community programs."
        icon="🎯"
        actions={
          address ? (
            <button onClick={() => setShowForm(!showForm)} className="btn-primary">
              {showForm ? "Cancel" : "+ Apply for Grant"}
            </button>
          ) : undefined
        }
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Grants", value: grants.length.toString(), icon: "📝" },
            { label: "Pending", value: grants.filter((g) => g.status === "Pending").length.toString(), icon: "⏳" },
            { label: "Active", value: grants.filter((g) => g.status === "Active" || g.status === "Approved").length.toString(), icon: "🟢" },
            { label: "Total Value", value: `${formatAmount(totalGrantValue)} ${DISPLAY_DENOM}`, icon: "💎" },
          ].map((s) => (
            <div key={s.label} className="card text-center">
              <span className="text-2xl">{s.icon}</span>
              <div className="text-xl font-bold text-citizen-700 mt-1">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Application form */}
      {showForm && (
        <div className="card mb-8 border-l-4 border-citizen-400">
          <h2 className="text-lg font-semibold mb-4">Grant Application</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Project title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-citizen-500 focus:border-transparent text-gray-900"
            />
            <textarea
              placeholder="Describe your project, its goals, and expected outcomes..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={5}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-citizen-500 focus:border-transparent text-gray-900"
            />

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, category: c })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      form.category === c
                        ? "bg-citizen-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                Milestones
              </label>
              <div className="space-y-3">
                {form.milestones.map((m, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <span className="w-7 h-7 bg-citizen-100 text-citizen-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <input
                      type="text"
                      placeholder="Milestone description"
                      value={m.description}
                      onChange={(e) => updateMilestone(i, "description", e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      placeholder={`${DISPLAY_DENOM}`}
                      value={m.amount}
                      onChange={(e) => updateMilestone(i, "amount", e.target.value)}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    {form.milestones.length > 1 && (
                      <button
                        onClick={() => removeMilestone(i)}
                        className="text-red-400 hover:text-red-600 text-lg"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={addMilestone} className="text-sm text-citizen-600 hover:text-citizen-700 mt-2 font-medium">
                + Add Milestone
              </button>
            </div>

            <button
              onClick={handleApply}
              disabled={actionLoading === "apply" || !form.title || !form.description}
              className="btn-primary disabled:opacity-50"
            >
              {actionLoading === "apply" ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["", "Pending", "Approved", "Active", "Completed", "Rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-citizen-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Grants list */}
      {loading ? (
        <LoadingSpinner />
      ) : grants.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="No grants yet"
          description={
            error
              ? "Connect to a running chain to view and apply for grants."
              : "Apply for a grant to fund your public-benefit project."
          }
          action={
            address && !error
              ? { label: "Apply for Grant", onClick: () => setShowForm(true) }
              : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {grants.map((g) => (
            <div key={g.id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-gray-400 font-mono">#{g.id}</span>
                    <h3 className="font-semibold text-gray-900">{g.title}</h3>
                    <StatusBadge status={g.status} />
                    <CategoryTag category={g.category || "unknown"} />
                  </div>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{g.description}</p>
                  <div className="text-xs text-gray-400 mt-2">
                    <span>Applicant: {g.applicant?.slice(0, 12)}...{g.applicant?.slice(-6)}</span>
                    <span className="mx-2">&middot;</span>
                    <span>Total: {formatAmount(g.total_amount || 0)} {DISPLAY_DENOM}</span>
                  </div>
                </div>
              </div>

              {/* Milestones */}
              {g.milestones && g.milestones.length > 0 && (
                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-3">
                    Milestones ({g.milestones.filter((m: any) => m.completed).length}/{g.milestones.length})
                  </h4>
                  {/* Progress bar */}
                  <div className="bg-gray-200 rounded-full h-2 mb-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-citizen-400 to-green-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${(g.milestones.filter((m: any) => m.completed).length / g.milestones.length) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    {g.milestones.map((m: any) => (
                      <div key={m.id} className="flex items-center gap-3 text-sm">
                        <span
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            m.completed
                              ? "bg-green-500 border-green-500 text-white"
                              : "border-gray-300 text-gray-400"
                          }`}
                        >
                          {m.completed ? "✓" : m.id}
                        </span>
                        <span className={`flex-1 ${m.completed ? "text-gray-400 line-through" : "text-gray-700"}`}>
                          {m.description}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {formatAmount(m.amount || 0)} {DISPLAY_DENOM}
                        </span>
                        {!m.completed && address && g.applicant === address && (
                          <button
                            onClick={() => handleSubmitMilestone(g.id, m.id)}
                            disabled={actionLoading === `ms-${g.id}-${m.id}`}
                            className="text-xs bg-citizen-50 text-citizen-700 px-2 py-1 rounded font-medium hover:bg-citizen-100 disabled:opacity-50"
                          >
                            {actionLoading === `ms-${g.id}-${m.id}` ? "..." : "Submit"}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
