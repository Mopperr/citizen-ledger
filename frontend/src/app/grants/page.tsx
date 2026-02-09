"use client";

import { useState, useEffect } from "react";
import { useGrants } from "@/hooks/useContracts";
import { useWallet } from "@/hooks/useWallet";
import { DISPLAY_DENOM, DECIMALS } from "@/config/chain";

function formatAmount(amount: string | number): string {
  const n = typeof amount === "string" ? parseInt(amount) : amount;
  return (n / 10 ** DECIMALS).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

export default function GrantsPage() {
  const { address } = useWallet();
  const { listGrants, applyForGrant, submitMilestone } = useGrants();
  const [grants, setGrants] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Infrastructure",
    milestones: [{ description: "", amount: "" }],
  });

  useEffect(() => {
    loadGrants();
  }, []);

  const loadGrants = async () => {
    try {
      const data = await listGrants();
      setGrants(data);
    } catch {}
  };

  const addMilestone = () => {
    setForm({
      ...form,
      milestones: [...form.milestones, { description: "", amount: "" }],
    });
  };

  const updateMilestone = (idx: number, field: string, value: string) => {
    const updated = [...form.milestones];
    (updated[idx] as any)[field] = value;
    setForm({ ...form, milestones: updated });
  };

  const handleApply = async () => {
    if (!form.title || !form.description) return;
    try {
      const milestones = form.milestones.map((m) => ({
        description: m.description,
        amount: (parseFloat(m.amount) * 10 ** DECIMALS).toString(),
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
      alert(e.message);
    }
  };

  const statusBadge = (status: string) => {
    const classes: Record<string, string> = {
      Pending: "badge-pending",
      Active: "badge-active",
      Completed: "badge-passed",
      Rejected: "badge-rejected",
    };
    return <span className={classes[status] || "badge"}>{status}</span>;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Grants</h1>
        {address && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? "Cancel" : "+ Apply for Grant"}
          </button>
        )}
      </div>

      {/* Application form */}
      {showForm && (
        <div className="card mb-8">
          <h2 className="text-lg font-semibold mb-4">Grant Application</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Project title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <textarea
              placeholder="Describe your project..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              {[
                "Infrastructure",
                "Education",
                "Healthcare",
                "Research",
                "Emergency",
              ].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Milestones
              </h3>
              {form.milestones.map((m, i) => (
                <div key={i} className="flex gap-3 mb-2">
                  <input
                    type="text"
                    placeholder="Milestone description"
                    value={m.description}
                    onChange={(e) =>
                      updateMilestone(i, "description", e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    placeholder={`Amount (${DISPLAY_DENOM})`}
                    value={m.amount}
                    onChange={(e) =>
                      updateMilestone(i, "amount", e.target.value)
                    }
                    className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              ))}
              <button onClick={addMilestone} className="text-sm text-citizen-600">
                + Add Milestone
              </button>
            </div>

            <button onClick={handleApply} className="btn-primary">
              Submit Application
            </button>
          </div>
        </div>
      )}

      {/* Grants list */}
      <div className="space-y-4">
        {grants.length === 0 ? (
          <div className="card text-center text-gray-400 py-12">
            No grants yet. Connect to a running chain to see grants.
          </div>
        ) : (
          grants.map((g) => (
            <div key={g.id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{g.title}</h3>
                    {statusBadge(g.status)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{g.description}</p>
                  <div className="text-xs text-gray-400 mt-2">
                    Applicant: {g.applicant} | Category: {g.category} |
                    Total: {formatAmount(g.total_amount)} {DISPLAY_DENOM}
                  </div>
                </div>
              </div>

              {/* Milestones */}
              {g.milestones && g.milestones.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">
                    Milestones
                  </h4>
                  <div className="space-y-2">
                    {g.milestones.map((m: any) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            m.completed
                              ? "bg-green-500 border-green-500 text-white"
                              : "border-gray-300"
                          }`}
                        >
                          {m.completed ? "✓" : m.id}
                        </span>
                        <span className={m.completed ? "text-gray-400 line-through" : ""}>
                          {m.description}
                        </span>
                        <span className="text-gray-400 ml-auto">
                          {formatAmount(m.amount)} {DISPLAY_DENOM}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
