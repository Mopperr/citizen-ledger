"use client";

import { useState, useEffect } from "react";
import { useGovernance } from "@/hooks/useContracts";
import { useWallet } from "@/hooks/useWallet";

export default function GovernancePage() {
  const { address } = useWallet();
  const { listProposals, createProposal, castVote, tallyProposal } =
    useGovernance();
  const [proposals, setProposals] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [votingMethod, setVotingMethod] = useState<
    "OnePersonOneVote" | "Quadratic"
  >("OnePersonOneVote");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    try {
      const data = await listProposals();
      setProposals(data);
    } catch {
      // Will fail without RPC — that's fine for scaffold
    }
  };

  const handleCreate = async () => {
    if (!title || !description) return;
    setLoading(true);
    try {
      await createProposal(title, description, votingMethod);
      setTitle("");
      setDescription("");
      setShowForm(false);
      await loadProposals();
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(false);
  };

  const handleVote = async (proposalId: number, vote: "Yes" | "No" | "Abstain") => {
    try {
      await castVote(proposalId, vote);
      await loadProposals();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleTally = async (proposalId: number) => {
    try {
      await tallyProposal(proposalId);
      await loadProposals();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const statusBadge = (status: string) => {
    const classes: Record<string, string> = {
      Active: "badge-active",
      Passed: "badge-passed",
      Rejected: "badge-rejected",
      Expired: "badge-pending",
      Executed: "bg-purple-100 text-purple-800 badge",
    };
    return <span className={classes[status] || "badge"}>{status}</span>;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Governance</h1>
        {address && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? "Cancel" : "+ New Proposal"}
          </button>
        )}
      </div>

      {/* Create proposal form */}
      {showForm && (
        <div className="card mb-8">
          <h2 className="text-lg font-semibold mb-4">Create Proposal</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Proposal title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-citizen-500 focus:border-transparent"
            />
            <textarea
              placeholder="Describe your proposal..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-citizen-500 focus:border-transparent"
            />
            <div className="flex gap-4 items-center">
              <label className="text-sm text-gray-600">Voting method:</label>
              <select
                value={votingMethod}
                onChange={(e) =>
                  setVotingMethod(e.target.value as typeof votingMethod)
                }
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="OnePersonOneVote">One Person, One Vote</option>
                <option value="Quadratic">Quadratic Voting</option>
              </select>
            </div>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? "Submitting..." : "Submit Proposal"}
            </button>
          </div>
        </div>
      )}

      {/* Proposals list */}
      <div className="space-y-4">
        {proposals.length === 0 ? (
          <div className="card text-center text-gray-400 py-12">
            No proposals yet. Connect to a running chain to see proposals.
          </div>
        ) : (
          proposals.map((p) => (
            <div key={p.id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{p.title}</h3>
                    {statusBadge(p.status)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{p.description}</p>
                  <div className="text-xs text-gray-400 mt-2">
                    Proposer: {p.proposer} | Method: {p.voting_method} |
                    Blocks: {p.start_height}–{p.end_height}
                  </div>
                </div>
              </div>

              {/* Vote counts */}
              <div className="flex gap-6 mt-4 text-sm">
                <span className="text-green-600">Yes: {p.votes_for}</span>
                <span className="text-red-600">No: {p.votes_against}</span>
                <span className="text-gray-400">Abstain: {p.votes_abstain}</span>
              </div>

              {/* Actions */}
              {p.status === "Active" && address && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleVote(p.id, "Yes")}
                    className="bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium"
                  >
                    Vote Yes
                  </button>
                  <button
                    onClick={() => handleVote(p.id, "No")}
                    className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium"
                  >
                    Vote No
                  </button>
                  <button
                    onClick={() => handleVote(p.id, "Abstain")}
                    className="bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium"
                  >
                    Abstain
                  </button>
                  <button
                    onClick={() => handleTally(p.id)}
                    className="btn-secondary text-sm ml-auto"
                  >
                    Tally
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
