"use client";

import { useState, useEffect, useCallback } from "react";
import { useGovernance } from "@/hooks/useContracts";
import { useWallet } from "@/hooks/useWallet";
import { PageHeader, EmptyState, LoadingSpinner } from "@/components/ui";
import StatusBadge from "@/components/ui/StatusBadge";

export default function GovernancePage() {
  const { address } = useWallet();
  const { listProposals, createProposal, castVote, tallyProposal, executeProposal, getVotingConfig } =
    useGovernance();
  const [proposals, setProposals] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [votingMethod, setVotingMethod] = useState<"OnePersonOneVote" | "Quadratic">(
    "OnePersonOneVote"
  );
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const loadProposals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, cfg] = await Promise.all([
        listProposals(statusFilter || undefined),
        getVotingConfig(),
      ]);
      setProposals(data || []);
      setConfig(cfg);
    } catch {
      setError("Unable to connect to chain. Proposals will appear once the network is live.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  const handleCreate = async () => {
    if (!title || !description) return;
    setActionLoading("create");
    try {
      await createProposal(title, description, votingMethod);
      setTitle("");
      setDescription("");
      setShowForm(false);
      await loadProposals();
    } catch (e: any) {
      setError(e.message);
    }
    setActionLoading(null);
  };

  const handleVote = async (proposalId: number, vote: "Yes" | "No" | "Abstain") => {
    setActionLoading(`vote-${proposalId}-${vote}`);
    try {
      await castVote(proposalId, vote);
      await loadProposals();
    } catch (e: any) {
      setError(e.message);
    }
    setActionLoading(null);
  };

  const handleTally = async (proposalId: number) => {
    setActionLoading(`tally-${proposalId}`);
    try {
      await tallyProposal(proposalId);
      await loadProposals();
    } catch (e: any) {
      setError(e.message);
    }
    setActionLoading(null);
  };

  const handleExecute = async (proposalId: number) => {
    setActionLoading(`exec-${proposalId}`);
    try {
      await executeProposal(proposalId);
      await loadProposals();
    } catch (e: any) {
      setError(e.message);
    }
    setActionLoading(null);
  };

  const voteBar = (p: any) => {
    const total = (p.votes_for || 0) + (p.votes_against || 0) + (p.votes_abstain || 0);
    if (total === 0) return null;
    const forPct = ((p.votes_for || 0) / total) * 100;
    const againstPct = ((p.votes_against || 0) / total) * 100;

    return (
      <div className="mt-3">
        <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
          <div className="bg-green-500 transition-all" style={{ width: `${forPct}%` }} />
          <div className="bg-red-500 transition-all" style={{ width: `${againstPct}%` }} />
        </div>
        <div className="flex gap-6 mt-2 text-xs">
          <span className="text-green-600 font-medium">Yes: {p.votes_for || 0}</span>
          <span className="text-red-600 font-medium">No: {p.votes_against || 0}</span>
          <span className="text-gray-400">Abstain: {p.votes_abstain || 0}</span>
          <span className="text-gray-400 ml-auto">Total: {total}</span>
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="Governance"
        description="One-person-one-vote and quadratic voting for transparent decision making."
        icon="🗳️"
        actions={
          address ? (
            <button onClick={() => setShowForm(!showForm)} className="btn-primary">
              {showForm ? "Cancel" : "+ New Proposal"}
            </button>
          ) : undefined
        }
      />

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Governance Parameters */}
      {config && (
        <div className="card mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Governance Parameters</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Voting Period</span>
              <p className="font-semibold">{config.voting_period?.toLocaleString() || "—"} blocks</p>
            </div>
            <div>
              <span className="text-gray-400">Quorum</span>
              <p className="font-semibold">{((config.quorum_bps || 0) / 100).toFixed(1)}%</p>
            </div>
            <div>
              <span className="text-gray-400">Threshold</span>
              <p className="font-semibold">{((config.threshold_bps || 0) / 100).toFixed(1)}%</p>
            </div>
            <div>
              <span className="text-gray-400">Timelock</span>
              <p className="font-semibold">{config.timelock_period?.toLocaleString() || "0"} blocks</p>
            </div>
          </div>
        </div>
      )}

      {/* Create proposal form */}
      {showForm && (
        <div className="card mb-8 border-l-4 border-citizen-400">
          <h2 className="text-lg font-semibold mb-4">Create Proposal</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Proposal title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-citizen-500 focus:border-transparent text-gray-900"
            />
            <textarea
              placeholder="Describe your proposal in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-citizen-500 focus:border-transparent text-gray-900"
            />
            <div className="flex flex-wrap gap-4 items-center">
              <label className="text-sm text-gray-600 font-medium">Voting method:</label>
              <div className="flex gap-2">
                {(["OnePersonOneVote", "Quadratic"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setVotingMethod(m)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      votingMethod === m
                        ? "bg-citizen-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {m === "OnePersonOneVote" ? "One Person, One Vote" : "Quadratic"}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={actionLoading === "create" || !title || !description}
              className="btn-primary disabled:opacity-50"
            >
              {actionLoading === "create" ? "Submitting..." : "Submit Proposal"}
            </button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["", "Active", "Passed", "Rejected", "Executed", "Timelocked"].map((s) => (
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

      {/* Proposals list */}
      {loading ? (
        <LoadingSpinner />
      ) : proposals.length === 0 ? (
        <EmptyState
          icon="🗳️"
          title="No proposals yet"
          description={
            error
              ? "Connect to a running chain to participate in governance."
              : "Be the first to create a proposal and shape the future of Citizen Ledger."
          }
          action={
            address && !error
              ? { label: "Create Proposal", onClick: () => setShowForm(true) }
              : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {proposals.map((p) => (
            <div key={p.id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-gray-400 font-mono">#{p.id}</span>
                    <h3 className="font-semibold text-gray-900">{p.title}</h3>
                    <StatusBadge status={p.status} />
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                      {p.voting_method === "OnePersonOneVote" ? "1P1V" : "Quadratic"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{p.description}</p>
                  <div className="text-xs text-gray-400 mt-2">
                    <span>Proposer: {p.proposer?.slice(0, 12)}...{p.proposer?.slice(-6)}</span>
                    <span className="mx-2">&middot;</span>
                    <span>Blocks {p.start_height}&ndash;{p.end_height}</span>
                  </div>
                </div>
              </div>

              {voteBar(p)}

              {address && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {p.status === "Active" && (
                    <>
                      {(["Yes", "No", "Abstain"] as const).map((v) => {
                        const colors = {
                          Yes: "bg-green-50 hover:bg-green-100 text-green-700",
                          No: "bg-red-50 hover:bg-red-100 text-red-700",
                          Abstain: "bg-gray-50 hover:bg-gray-100 text-gray-600",
                        };
                        const key = `vote-${p.id}-${v}`;
                        return (
                          <button
                            key={v}
                            onClick={() => handleVote(p.id, v)}
                            disabled={actionLoading === key}
                            className={`${colors[v]} px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50`}
                          >
                            {actionLoading === key ? "..." : `Vote ${v}`}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => handleTally(p.id)}
                        disabled={actionLoading === `tally-${p.id}`}
                        className="btn-secondary text-sm ml-auto disabled:opacity-50"
                      >
                        {actionLoading === `tally-${p.id}` ? "Tallying..." : "Tally"}
                      </button>
                    </>
                  )}
                  {p.status === "Timelocked" && (
                    <button
                      onClick={() => handleExecute(p.id)}
                      disabled={actionLoading === `exec-${p.id}`}
                      className="btn-primary text-sm disabled:opacity-50"
                    >
                      {actionLoading === `exec-${p.id}` ? "Executing..." : "Execute Proposal"}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
