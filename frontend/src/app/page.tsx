"use client";

import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";
import { useEffect, useState } from "react";
import { CONTRACTS, RPC_ENDPOINT, DISPLAY_DENOM } from "@/config/chain";

// ── Live Stats Hook ─────────────────────────────────────────────────────────
function useLiveStats() {
  const [stats, setStats] = useState({
    blockHeight: "—",
    treasury: "—",
    proposals: "—",
    validators: "—",
    isLive: false,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const statusRes = await fetch(`${RPC_ENDPOINT}/status`);
        if (!statusRes.ok) throw new Error("RPC not reachable");
        const statusData = await statusRes.json();
        const height = statusData?.result?.sync_info?.latest_block_height || "—";
        setStats((s) => ({ ...s, blockHeight: Number(height).toLocaleString(), isLive: true }));
      } catch {
        setStats((s) => ({ ...s, blockHeight: "—", isLive: false }));
      }
    }
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return stats;
}

// ── Section Divider ─────────────────────────────────────────────────────────
function SectionDivider({ inverted = false }: { inverted?: boolean }) {
  return (
    <div className={inverted ? "bg-gray-900" : ""}>
      <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <path
          d="M0 30L60 25C120 20 240 10 360 15C480 20 600 40 720 45C840 50 960 40 1080 30C1200 20 1320 10 1380 15L1440 20V60H0V30Z"
          fill={inverted ? "#f5f5f5" : "#111827"}
        />
      </svg>
    </div>
  );
}

// ── Landing Page ────────────────────────────────────────────────────────────
export default function Home() {
  const { address, connect, isConnecting } = useWallet();
  const stats = useLiveStats();

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
      {/* ─── Hero Section ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-citizen-900 via-citizen-800 to-emerald-900 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-citizen-400 rounded-full filter blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-emerald-400 rounded-full filter blur-3xl" />
          <div className="absolute top-40 right-40 w-48 h-48 bg-green-300 rounded-full filter blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-8 border border-white/20">
              {stats.isLive ? (
                <>
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Live on Testnet — Block #{stats.blockHeight}
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                  Testnet — Launching Soon
                </>
              )}
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
              Governance by
              <span className="block bg-gradient-to-r from-green-300 to-emerald-200 bg-clip-text text-transparent">
                the People
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              <strong className="text-white">Citizen Ledger</strong> is a citizen-led blockchain network
              that verifies eligibility through privacy-preserving credentials, enables inclusive governance
              through identity-based voting, and funds public-benefit initiatives through a programmable
              on-chain treasury.
            </p>

            <p className="mt-4 text-base text-gray-400 max-w-2xl mx-auto">
              No VCs. No pre-mine. No team allocation. Every token is earned through staking and participation.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              {!address ? (
                <button
                  onClick={() => connect()}
                  disabled={isConnecting}
                  className="bg-white text-citizen-800 font-bold py-3 px-8 rounded-xl text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </button>
              ) : (
                <Link
                  href="/governance"
                  className="bg-white text-citizen-800 font-bold py-3 px-8 rounded-xl text-lg hover:bg-gray-100 transition-all shadow-lg"
                >
                  Enter dApp →
                </Link>
              )}
              <a
                href="#about"
                className="border-2 border-white/30 text-white font-semibold py-3 px-8 rounded-xl text-lg hover:bg-white/10 transition-all"
              >
                Learn More
              </a>
              <a
                href="#roadmap"
                className="border-2 border-white/30 text-white font-semibold py-3 px-8 rounded-xl text-lg hover:bg-white/10 transition-all"
              >
                Roadmap
              </a>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 50L48 45C96 40 192 30 288 35C384 40 480 60 576 65C672 70 768 60 864 50C960 40 1056 30 1152 35C1248 40 1344 60 1392 70L1440 80V100H0V50Z" fill="#f5f5f5" />
          </svg>
        </div>
      </section>

      {/* ─── Stats Bar ────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Block Height", value: stats.blockHeight, icon: "⛓️" },
            { label: "Smart Contracts", value: "5", icon: "📜" },
            { label: "Max Supply", value: "1B CITIZEN", icon: "💰" },
            { label: "Governance Model", value: "1P1V", icon: "🗳️" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl shadow-md border border-gray-100 p-5 text-center"
            >
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-xl font-bold text-citizen-700">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── About / What is Citizen Ledger ───────────────────────────── */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            What is Citizen Ledger?
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Public institutions around the world struggle with opaque funding, unverifiable identity,
            and governance systems that exclude the citizens they claim to serve. Citizen Ledger is an
            identity-gated blockchain where only verified citizens participate in governance — using
            <strong> one-person-one-vote</strong> for core decisions and <strong>quadratic voting</strong> for
            funding allocation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-citizen-50 to-white rounded-xl border border-citizen-100 p-8">
            <h3 className="text-xl font-bold text-citizen-800 mb-4">🏛️ The Problem</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex gap-3"><span className="text-red-500 mt-0.5">✗</span> <span><strong>Centralized Identity</strong> — systems require centralized authorities, creating honeypots for data breaches</span></li>
              <li className="flex gap-3"><span className="text-red-500 mt-0.5">✗</span> <span><strong>Opaque Public Funding</strong> — citizens cannot verify where money goes or whether milestones were met</span></li>
              <li className="flex gap-3"><span className="text-red-500 mt-0.5">✗</span> <span><strong>Wealth-Weighted Governance</strong> — large token holders dominate decisions regardless of community preferences</span></li>
              <li className="flex gap-3"><span className="text-red-500 mt-0.5">✗</span> <span><strong>No Infrastructure Accountability</strong> — long-term public projects lack transparent reporting</span></li>
              <li className="flex gap-3"><span className="text-red-500 mt-0.5">✗</span> <span><strong>Research Funding Gaps</strong> — breakthrough research is underfunded and bottlenecked by institutional processes</span></li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-100 p-8">
            <h3 className="text-xl font-bold text-green-800 mb-4">✨ The Solution</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex gap-3"><span className="text-green-500 mt-0.5">✓</span> <span><strong>Identity is Private</strong> — citizens prove eligibility without revealing personal data using zero-knowledge proofs</span></li>
              <li className="flex gap-3"><span className="text-green-500 mt-0.5">✓</span> <span><strong>Governance is Fair</strong> — one person, one vote — no plutocracy, no whale capture</span></li>
              <li className="flex gap-3"><span className="text-green-500 mt-0.5">✓</span> <span><strong>Funding is Transparent</strong> — every allocation, every grant, every milestone publicly tracked on-chain</span></li>
              <li className="flex gap-3"><span className="text-green-500 mt-0.5">✓</span> <span><strong>Income is Real</strong> — token holders earn from funded infrastructure, patents, and staking rewards</span></li>
              <li className="flex gap-3"><span className="text-green-500 mt-0.5">✓</span> <span><strong>Milestone Grants</strong> — funds release only on verified delivery, no lump-sum risk</span></li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─── System Architecture — Three Layers ──────────────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Three-Layer Architecture
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              A purpose-built stack from identity verification to citizen interaction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "🔐",
                title: "Identity Layer",
                description: "Off-chain verification providers generate ZK proofs. Citizens submit documents to approved providers — documents are processed and destroyed after verification. Only cryptographic commitments are stored on-chain.",
                color: "from-purple-500 to-indigo-600",
                detail: "Zero-Knowledge Proofs",
              },
              {
                icon: "⛓️",
                title: "Core Chain",
                description: "Five CosmWasm smart contracts on Cosmos SDK handle the protocol backbone: Credential Registry, Voting, Treasury, Grants, and Staking & Emissions — all fully auditable and open source.",
                color: "from-citizen-500 to-emerald-600",
                detail: "CosmWasm on Cosmos SDK",
              },
              {
                icon: "🖥️",
                title: "Application Layer",
                description: "Next.js dashboard and public transparency portal for citizen interaction, proposal creation, fund tracking, and real-time network monitoring. No wallet required to view public data.",
                color: "from-cyan-500 to-blue-600",
                detail: "Next.js + CosmJS",
              },
            ].map((layer) => (
              <div key={layer.title} className="relative bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 p-8 text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${layer.color} text-white text-3xl mb-5`}>
                  {layer.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{layer.title}</h3>
                <span className="inline-block text-xs font-medium bg-gray-100 text-gray-600 rounded-full px-3 py-1 mb-4">{layer.detail}</span>
                <p className="text-sm text-gray-500 leading-relaxed">{layer.description}</p>
              </div>
            ))}
          </div>

          {/* Data Flow */}
          <div className="mt-16 bg-gray-900 rounded-2xl p-8 text-center">
            <h3 className="text-lg font-bold text-white mb-6">Data Flow</h3>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-mono">
              {[
                { text: "Citizen", style: "bg-purple-600 text-white" },
                { text: "→", style: "text-gray-500" },
                { text: "Verification Provider", style: "bg-purple-800 text-purple-200" },
                { text: "→", style: "text-gray-500" },
                { text: "Credential Registry", style: "bg-citizen-600 text-white" },
                { text: "→", style: "text-gray-500" },
                { text: "ZK Eligibility", style: "bg-indigo-600 text-white" },
                { text: "→", style: "text-gray-500" },
                { text: "Voting", style: "bg-emerald-600 text-white" },
                { text: "→", style: "text-gray-500" },
                { text: "Treasury", style: "bg-amber-600 text-white" },
                { text: "→", style: "text-gray-500" },
                { text: "Grants", style: "bg-rose-600 text-white" },
              ].map((item, i) => (
                <span key={i} className={`px-3 py-1.5 rounded-lg ${item.style}`}>{item.text}</span>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4">
              All on-chain events are captured by an indexer and surfaced through the public transparency dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Five Core Contracts ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Five Core Contracts
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Everything on-chain. Everything auditable. Everything open source.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: "🛡️",
              title: "Credential Registry",
              description:
                "Issues, verifies, and revokes privacy-preserving credentials (SBTs or ZK commitments). Prove you're a citizen without revealing personal data. Trusted issuers gate access to governance.",
              href: "/identity",
              color: "from-indigo-500 to-purple-600",
            },
            {
              icon: "🗳️",
              title: "Governance & Voting",
              description:
                "Manages proposals with One-Person-One-Vote for core decisions and Quadratic Voting for funding allocation. Timelock execution, quorum enforcement, configurable parameters.",
              href: "/governance",
              color: "from-citizen-500 to-emerald-600",
            },
            {
              icon: "🏛️",
              title: "Community Treasury",
              description:
                "Collects fees and emission allocations, splits funds across citizen-governed categories. Every disbursement records recipient, amount, category, memo, and block height.",
              href: "/treasury",
              color: "from-amber-500 to-orange-600",
            },
            {
              icon: "🎯",
              title: "Grant System",
              description:
                "Milestone-based grant applications with independent oracle verification. Funds unlock progressively as deliverables are verified — no lump-sum risk.",
              href: "/grants",
              color: "from-pink-500 to-rose-600",
            },
            {
              icon: "⚡",
              title: "Staking & Emissions",
              description:
                "Capped supply with four-phase declining emission schedule. Stake to secure the network. 80% of emissions go to stakers, 20% flows to the community treasury.",
              href: "/staking",
              color: "from-cyan-500 to-blue-600",
            },
            {
              icon: "📊",
              title: "Transparency Dashboard",
              description:
                "Real-time public dashboard: treasury flows, governance stats, emission progress, grant pipeline, and staking metrics. No wallet required — trust through transparency.",
              href: "/transparency",
              color: "from-emerald-500 to-teal-600",
            },
          ].map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="group relative bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} text-white text-2xl mb-4`}
              >
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-citizen-600 transition-colors">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                {feature.description}
              </p>
              <span className="mt-4 inline-flex items-center text-sm font-medium text-citizen-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Explore →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Identity & Privacy ───────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-indigo-900 via-purple-900 to-citizen-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Identity & Privacy</h2>
            <p className="mt-4 text-lg text-gray-300 max-w-3xl mx-auto">
              Zero-knowledge credentials that prove eligibility without revealing personal data.
              Your identity stays private — always.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Verification Flow */}
            <div>
              <h3 className="text-xl font-bold mb-6 text-purple-200">Verification Flow</h3>
              <div className="space-y-6">
                {[
                  {
                    step: "1",
                    title: "Document Submission",
                    desc: "Citizen submits identity documents to an approved verification provider (off-chain). Documents are processed and destroyed after verification — never stored on-chain.",
                  },
                  {
                    step: "2",
                    title: "Credential Issuance",
                    desc: "The provider issues a non-transferable credential (SBT) or ZK commitment to the on-chain Credential Registry. Only: holder address, credential type, commitment hash, and expiration.",
                  },
                  {
                    step: "3",
                    title: "Eligibility Proofs",
                    desc: "When accessing gated functions (voting, grants), citizens generate a zero-knowledge proof demonstrating eligibility without revealing any personal data.",
                  },
                ].map((s) => (
                  <div key={s.step} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-lg font-bold">
                      {s.step}
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{s.title}</h4>
                      <p className="text-sm text-gray-300 mt-1 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Credential Types & Privacy */}
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold mb-4 text-purple-200">Credential Types</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { type: "Citizenship", desc: "Gates voting & governance" },
                    { type: "Residency", desc: "Gates regional programs" },
                    { type: "AgeOver18", desc: "Participation eligibility" },
                    { type: "Healthcare", desc: "Healthcare program access" },
                  ].map((c) => (
                    <div key={c.type} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                      <div className="font-semibold text-white text-sm">{c.type}</div>
                      <div className="text-xs text-gray-400 mt-1">{c.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4 text-purple-200">Privacy Guarantees</h3>
                <ul className="space-y-3">
                  {[
                    "Data minimization — only cryptographic commitments stored on-chain",
                    "Zero-knowledge verification — reveals nothing beyond eligibility",
                    "Recovery without custody — re-verify with provider to recover",
                    "Selective disclosure — prove only the minimum required claim",
                  ].map((g) => (
                    <li key={g} className="flex gap-2 text-sm text-gray-300">
                      <span className="text-green-400 mt-0.5">🔒</span>
                      {g}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-3 text-purple-200">Credential Lifecycle</h3>
                <div className="flex flex-wrap gap-2">
                  {["Issue", "Active", "Expire", "Revoke", "Recover"].map((stage) => (
                    <span key={stage} className="bg-white/10 border border-white/20 text-xs font-medium text-white px-3 py-1.5 rounded-full">
                      {stage}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Governance Model ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Governance Model
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            Every governance action follows a formal, on-chain lifecycle. All parameters
            are adjustable through governance proposals — a self-evolving system.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Proposal lifecycle */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-6">Proposal Lifecycle</h3>
            <div className="space-y-4">
              {[
                { stage: "Draft", desc: "Proposer posts a proposal with objective, description, and budget impact", icon: "📝", color: "bg-gray-100 text-gray-700" },
                { stage: "Active", desc: "Citizens cast votes during the configurable voting period (~7 days)", icon: "🗳️", color: "bg-blue-100 text-blue-700" },
                { stage: "Tally", desc: "Votes are tallied automatically; quorum and threshold checked", icon: "📊", color: "bg-amber-100 text-amber-700" },
                { stage: "Timelocked", desc: "Passed proposals enter a timelock period before execution (~1 day)", icon: "🔒", color: "bg-purple-100 text-purple-700" },
                { stage: "Execute", desc: "Approved proposals execute via on-chain transactions", icon: "✅", color: "bg-green-100 text-green-700" },
              ].map((s) => (
                <div key={s.stage} className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${s.color} flex items-center justify-center text-lg`}>
                    {s.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{s.stage}</h4>
                    <p className="text-sm text-gray-500 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Voting Methods & Parameters */}
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Voting Methods</h3>
              <div className="space-y-4">
                <div className="bg-citizen-50 rounded-xl border border-citizen-100 p-6">
                  <h4 className="font-bold text-citizen-800 mb-2">🗳️ One-Person-One-Vote (1P1V)</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Used for core constitutional changes, treasury policy updates, and major governance
                    decisions. Each verified citizen gets exactly one vote regardless of token holdings.
                    This prevents plutocratic capture and ensures equal representation.
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-6">
                  <h4 className="font-bold text-emerald-800 mb-2">📐 Quadratic Voting</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Used for funding allocation across categories. The cost of votes increases
                    quadratically (1 vote = 1 token, 2 votes = 4, 3 votes = 9). This balances
                    intensity of preference with breadth of support.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Governance Parameters</h3>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Parameter</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Default</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[
                      { param: "Voting Period", value: "604,800 blocks (~7 days)" },
                      { param: "Quorum", value: "20% of eligible voters" },
                      { param: "Pass Threshold", value: "50% of votes" },
                      { param: "Timelock Period", value: "86,400 blocks (~1 day)" },
                    ].map((r) => (
                      <tr key={r.param}>
                        <td className="py-3 px-4 text-gray-600">{r.param}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">{r.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 py-3 bg-gray-50 text-xs text-gray-500">
                  All parameters are governance-adjustable through on-chain proposals.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Treasury Allocation ──────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-amber-50 via-white to-orange-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Community Treasury
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              Treasury funds are split across citizen-governed categories. Every disbursement
              records recipient, amount, category, memo, and block height — fully transparent.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Allocation categories */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">Allocation Categories</h3>
              <div className="space-y-4">
                {[
                  { category: "Research", pct: 25, color: "bg-blue-500", desc: "Scientific research grants" },
                  { category: "Infrastructure", pct: 25, color: "bg-emerald-500", desc: "Physical and digital infrastructure" },
                  { category: "Healthcare", pct: 20, color: "bg-red-500", desc: "Healthcare infrastructure programs" },
                  { category: "Node Incentives", pct: 15, color: "bg-purple-500", desc: "Rewards for node operators" },
                  { category: "Education", pct: 10, color: "bg-amber-500", desc: "Educational programs and training" },
                  { category: "Emergency", pct: 5, color: "bg-gray-500", desc: "Emergency reserves (66% supermajority to access)" },
                ].map((c) => (
                  <div key={c.category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900">{c.category}</span>
                      <span className="text-gray-500">{c.pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div className={`${c.color} h-3 rounded-full transition-all`} style={{ width: `${c.pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue sources + spending rules */}
            <div className="space-y-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Revenue Sources</h3>
                <ul className="space-y-3">
                  {[
                    { icon: "💸", text: "Transaction fees — a portion of all on-chain fees" },
                    { icon: "⚡", text: "Emission allocations — 20% of newly minted tokens" },
                    { icon: "🤝", text: "External contributions — donations, partnerships, government grants" },
                    { icon: "🏥", text: "Revenue from funded assets — infrastructure revenue, patent royalties" },
                  ].map((s) => (
                    <li key={s.text} className="flex gap-3 text-sm text-gray-600">
                      <span className="text-lg">{s.icon}</span>
                      {s.text}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Spending Rules</h3>
                <ul className="space-y-2">
                  {[
                    "All spending requires governance approval or pre-approved category budgets",
                    "Every disbursement records: recipient, amount, category, memo, block height",
                    "Category spending cannot exceed its allocation without a governance vote",
                    "Emergency reserves require supermajority vote (66%) to access",
                  ].map((rule) => (
                    <li key={rule} className="flex gap-2 text-sm text-gray-600">
                      <span className="text-amber-500 mt-0.5 flex-shrink-0">▸</span>
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Grants & Public-Benefit Funding ──────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Grants & Public-Benefit Funding
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            Milestone-based funding for public-benefit projects. Every grant is fully
            transparent from application to completion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-12">
          {[
            { step: "1", label: "Apply", desc: "Submit proposal with milestones", color: "bg-rose-500" },
            { step: "2", label: "Review", desc: "Community evaluates", color: "bg-rose-500" },
            { step: "3", label: "Fund", desc: "Treasury allocates", color: "bg-amber-500" },
            { step: "4", label: "Build", desc: "Grantee delivers", color: "bg-amber-500" },
            { step: "5", label: "Evidence", desc: "Submit proof", color: "bg-emerald-500" },
            { step: "6", label: "Verify", desc: "Oracle confirms", color: "bg-emerald-500" },
            { step: "7", label: "Disburse", desc: "Funds released", color: "bg-citizen-500" },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div className={`${s.color} text-white w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-2`}>
                {s.step}
              </div>
              <div className="text-sm font-bold text-gray-900">{s.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Grant Categories</h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { icon: "🔬", label: "Research Grants", desc: "Medical, scientific, and technological research" },
                { icon: "🏗️", label: "Infrastructure Projects", desc: "Bridges, buildings, digital systems" },
                { icon: "🏥", label: "Healthcare Programs", desc: "Equipment, staffing, facilities" },
                { icon: "📚", label: "Educational Initiatives", desc: "Training programs, curriculum development" },
                { icon: "🚨", label: "Emergency Response", desc: "Disaster relief, rapid response" },
              ].map((cat) => (
                <div key={cat.label} className="flex gap-3 items-start">
                  <span className="text-xl">{cat.icon}</span>
                  <div>
                    <div className="font-medium text-sm text-gray-900">{cat.label}</div>
                    <div className="text-xs text-gray-500">{cat.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Accountability</h3>
            <ul className="space-y-3">
              {[
                "Application details are public from submission",
                "Milestone evidence stored on-chain or via content-addressable links",
                "All approvals, rejections, and disbursements recorded with timestamps",
                "Public transparency dashboard shows pipeline status in real-time",
                "Full grant history remains publicly viewable after completion",
              ].map((item) => (
                <li key={item} className="flex gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── Tokenomics ───────────────────────────────────────────────── */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Tokenomics</h2>
            <p className="mt-4 text-lg text-gray-400 max-w-3xl mx-auto">
              Fair, transparent, and designed for long-term sustainability.
              No pre-mine. No VC allocation. No team allocation. No ICO.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Supply info */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-6">
              <h3 className="font-bold text-white mb-4">Supply Overview</h3>
              <div className="space-y-3">
                {[
                  { label: "Token Name", value: "CITIZEN" },
                  { label: "Denomination", value: "ucitizen (1 CITIZEN = 10⁶ ucitizen)" },
                  { label: "Max Supply", value: "1,000,000,000 CITIZEN" },
                  { label: "Initial Supply", value: "0 — all tokens emitted via staking" },
                  { label: "Pre-mine", value: "None" },
                  { label: "VC / Team Allocation", value: "None" },
                  { label: "ICO / Airdrop", value: "None" },
                  { label: "Deflationary Levers", value: "Optional fee burns (governance vote)" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-sm text-gray-400">{row.label}</span>
                    <span className="text-sm font-medium text-white">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Emission schedule */}
            <div className="space-y-6">
              <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                <h3 className="font-bold text-white mb-4">Emission Schedule</h3>
                <div className="space-y-4">
                  {[
                    { phase: "Growth", duration: "~2 years", rate: "Highest per-block rate", cumulative: "~25% of max", pct: "100%" },
                    { phase: "Maturation", duration: "Years 2–5", rate: "~50% reduction", cumulative: "~55% of max", pct: "55%" },
                    { phase: "Stability", duration: "Years 5–10", rate: "~75% reduction", cumulative: "~85% of max", pct: "30%" },
                    { phase: "Terminal", duration: "Year 10+", rate: "Minimal rate", cumulative: "100% (cap)", pct: "10%" },
                  ].map((p) => (
                    <div key={p.phase}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-white">{p.phase}</span>
                        <span className="text-gray-400">{p.duration}</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2 mb-1">
                        <div
                          className="bg-gradient-to-r from-citizen-400 to-emerald-400 h-2 rounded-full"
                          style={{ width: p.pct }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{p.rate}</span>
                        <span>{p.cumulative}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                <h3 className="font-bold text-white mb-3">Per-Block Split</h3>
                <div className="flex gap-4">
                  <div className="flex-1 text-center bg-citizen-600/30 rounded-lg p-4">
                    <div className="text-2xl font-bold text-citizen-300">80%</div>
                    <div className="text-xs text-gray-400 mt-1">Stakers</div>
                  </div>
                  <div className="flex-1 text-center bg-amber-600/30 rounded-lg p-4">
                    <div className="text-2xl font-bold text-amber-300">20%</div>
                    <div className="text-xs text-gray-400 mt-1">Treasury</div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  After emissions end, the protocol sustains itself through transaction fees and revenue from funded assets.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Why Hold CITIZEN — Value Accrual ─────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Why Hold CITIZEN
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            CITIZEN is not a speculative token — it is a <strong>productive asset</strong> backed
            by real-world income streams from infrastructure, patents, and network fees.
          </p>
        </div>

        {/* Income Streams */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {[
            {
              icon: "🏥",
              title: "Infrastructure Yield",
              source: "Hospital revenue, rent, equipment leasing",
              dist: "Pro-rata to stakers",
              freq: "Monthly",
              color: "from-red-500 to-rose-600",
            },
            {
              icon: "🧬",
              title: "Research Royalty Yield",
              source: "Patent licensing, IP royalties from funded research",
              dist: "Pro-rata to stakers",
              freq: "Quarterly",
              color: "from-blue-500 to-indigo-600",
            },
            {
              icon: "⚡",
              title: "Staking Emissions",
              source: "Block rewards (declining schedule until cap)",
              dist: "Pro-rata to stakers",
              freq: "Per block",
              color: "from-citizen-500 to-emerald-600",
            },
            {
              icon: "💸",
              title: "Fee Share",
              source: "Transaction fees on the network",
              dist: "Pro-rata to stakers",
              freq: "Per block",
              color: "from-amber-500 to-orange-600",
            },
            {
              icon: "🗳️",
              title: "Governance Bonus",
              source: "Active voting participation bonus",
              dist: "Multiplier on yields",
              freq: "Monthly",
              color: "from-purple-500 to-violet-600",
            },
          ].map((stream) => (
            <div key={stream.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${stream.color} text-white text-xl mb-3`}>
                {stream.icon}
              </div>
              <h3 className="font-bold text-gray-900">{stream.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{stream.source}</p>
              <div className="mt-3 flex gap-2">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{stream.dist}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{stream.freq}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Value Flywheel */}
        <div className="bg-gradient-to-br from-citizen-50 to-emerald-50 rounded-2xl border border-citizen-100 p-8 lg:p-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Compounding Value Flywheel</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { step: "1", label: "Citizens stake CITIZEN", icon: "👥" },
              { step: "2", label: "Treasury grows", icon: "🏛️" },
              { step: "3", label: "Funds research & buildings", icon: "🔬" },
              { step: "4", label: "Patents & revenue generated", icon: "💰" },
              { step: "5", label: "Royalties flow to stakers", icon: "📈" },
              { step: "6", label: "More demand → cycle repeats", icon: "🔄" },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="w-8 h-8 rounded-full bg-citizen-600 text-white text-sm font-bold flex items-center justify-center mx-auto mb-2">{s.step}</div>
                <p className="text-xs text-gray-600 font-medium leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { point: "Real income, not speculation", desc: "Holders earn from hospitals, patents, and infrastructure" },
              { point: "Scarce supply + growing demand", desc: "Capped supply with rising income = increasing value" },
              { point: "Governance over real assets", desc: "Holders decide what gets built and how income is distributed" },
            ].map((p) => (
              <div key={p.point} className="bg-white/70 rounded-lg p-4">
                <div className="font-bold text-sm text-citizen-800">{p.point}</div>
                <p className="text-xs text-gray-500 mt-1">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Research Programs ─────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Research Programs</h2>
            <p className="mt-4 text-lg text-gray-300 max-w-3xl mx-auto">
              Citizens directly fund breakthrough research via quadratic voting. All research
              outputs, papers, and data are referenced on-chain.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              { icon: "🧬", area: "Regenerative Medicine", desc: "Organ health, tissue engineering, stem cell therapy" },
              { icon: "🎗️", area: "Oncology", desc: "Cancer immunotherapy, early detection, treatment innovations" },
              { icon: "🧠", area: "Neurodegeneration", desc: "Alzheimer's, Parkinson's, cognitive health research" },
              { icon: "❤️", area: "Cardiovascular", desc: "Heart disease prevention, treatment, and monitoring" },
              { icon: "🔬", area: "Rare Diseases", desc: "Underserved conditions lacking commercial funding" },
            ].map((r) => (
              <div key={r.area} className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <div className="text-3xl mb-3">{r.icon}</div>
                <h3 className="font-bold text-white mb-1">{r.area}</h3>
                <p className="text-sm text-gray-300">{r.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-white/5 rounded-xl border border-white/10 p-8">
            <h3 className="font-bold text-white mb-4">Intellectual Property</h3>
            <p className="text-sm text-gray-300 mb-4 leading-relaxed">
              When funded research produces patentable innovations, the protocol retains joint or full
              IP ownership. Patents are licensed commercially — royalties flow back to the treasury
              and then to stakers as <strong className="text-white">Research Royalty Yield</strong>.
            </p>
            <ul className="space-y-2">
              {[
                "Protocol retains joint or full IP ownership (defined in grant agreements)",
                "Citizens vote on licensing terms: exclusive vs. non-exclusive, pricing, humanitarian waivers",
                "A Patent & IP Committee (elected by governance) manages the portfolio",
              ].map((item) => (
                <li key={item} className="flex gap-2 text-sm text-gray-300">
                  <span className="text-blue-400 flex-shrink-0">▸</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── Healthcare Infrastructure ────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Healthcare Infrastructure Program
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            Citizens directly fund, govern, and benefit from physical medical facilities.
            Revenue flows back to the treasury and stakers as Infrastructure Yield.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {[
            {
              icon: "🏥",
              title: "Regional Centers",
              desc: "Citizen-funded hospitals and research hubs built through treasury grants. Each facility is held by a protocol-controlled legal entity (DAO LLC or foundation).",
            },
            {
              icon: "📦",
              title: "Supply Chain",
              desc: "Regional warehouses for medical equipment and supplies, with on-chain procurement tracking and inventory management.",
            },
            {
              icon: "🏛️",
              title: "Independent Governance",
              desc: "Independent medical oversight boards with citizen-elected members. Performance reporting published on-chain quarterly.",
            },
          ].map((c) => (
            <div key={c.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="text-4xl mb-4">{c.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{c.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-100 p-8">
          <h3 className="font-bold text-gray-900 mb-4">Revenue Flow Back to Citizens</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { source: "Patient Fees", icon: "💊" },
              { source: "Equipment Leasing", icon: "🔧" },
              { source: "Facility Rentals", icon: "🏢" },
              { source: "Government Reimbursements", icon: "📋" },
            ].map((r) => (
              <div key={r.source} className="text-center bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl mb-2">{r.icon}</div>
                <div className="text-sm font-medium text-gray-700">{r.source}</div>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4 text-center">
            All revenue flows to the on-chain treasury, where a governance-set percentage is distributed
            to stakers as <strong>Infrastructure Yield</strong>.
          </p>
        </div>
      </section>

      {/* ─── Node Network ─────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Node Network
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              A mixed node ecosystem designed for broad participation and geographic diversity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="text-4xl mb-4">🏠</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Home Nodes</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Individual citizens running low-cost hardware (e.g., Raspberry Pi or Mini PC).
                Lower stake requirement, designed to maximize geographic distribution and
                decentralization. Anyone can participate in securing the network.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="text-4xl mb-4">🏢</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Institutional Nodes</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Organizations running higher-availability infrastructure with stronger uptime
                guarantees, larger stakes, and professional monitoring. Ensures network
                reliability alongside citizen participation.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "💰",
                title: "Fee + Emission Rewards",
                desc: "Node operators earn fees proportional to uptime and stake, plus block reward distribution.",
              },
              {
                icon: "🗳️",
                title: "Governance Bonus",
                desc: "Nodes that actively participate in governance earn boosted rewards as an incentive.",
              },
              {
                icon: "🌍",
                title: "Geographic Diversity",
                desc: "Incentive bonuses for underserved regions, maximum caps per region to prevent concentration.",
              },
            ].map((n) => (
              <div key={n.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                <div className="text-2xl mb-3">{n.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{n.title}</h3>
                <p className="text-xs text-gray-500">{n.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Transparency & Accountability ────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Transparency & Accountability
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            Transparency is a first-class feature, not an afterthought. Every action on the
            protocol is publicly visible and permanently recorded.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: "📊",
              title: "Public Dashboard",
              desc: "Real-time read-only view of all protocol data: treasury balance, allocations, grant status, proposal outcomes, emission progress. No wallet required.",
            },
            {
              icon: "📂",
              title: "Open-Source Contracts",
              desc: "All smart contracts are publicly auditable on GitHub. Rust source code, schema files, and deployment scripts are fully open.",
            },
            {
              icon: "⛓️",
              title: "On-Chain Records",
              desc: "Every treasury disbursement, governance vote, grant milestone, and credential action is permanently recorded on-chain.",
            },
            {
              icon: "🔍",
              title: "Security Audits",
              desc: "Periodic independent security audits published publicly. Bug bounty program for responsible disclosure.",
            },
            {
              icon: "🏥",
              title: "Infrastructure Reporting",
              desc: "Funded real-world assets publish quarterly financial reports on-chain. Revenue, costs, and performance metrics fully visible.",
            },
            {
              icon: "⚖️",
              title: "Risk & Compliance",
              desc: "Jurisdiction-specific legal analysis, KYC/AML via verified issuers (off-chain, privacy-preserving), regulatory liaison team.",
            },
          ].map((t) => (
            <div key={t.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="text-2xl mb-3">{t.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{t.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────────────────── */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">How It Works</h2>
            <p className="mt-4 text-lg text-gray-400">
              From identity to governance in four steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Get Verified",
                description:
                  "A trusted issuer verifies your identity and issues a ZK credential. Your documents are destroyed after verification — your data never touches the blockchain.",
              },
              {
                step: "02",
                title: "Stake & Earn",
                description:
                  "Stake CITIZEN tokens to secure the network. Earn staking emissions, fee share, infrastructure yield, and research royalty yield — all real income.",
              },
              {
                step: "03",
                title: "Propose & Vote",
                description:
                  "Submit governance proposals. Every verified citizen gets one vote — wealth doesn't buy influence. Quadratic voting for funding allocation.",
              },
              {
                step: "04",
                title: "Fund & Build",
                description:
                  "Apply for grants from the community treasury. Funds release on milestone completion, verified by oracles. Revenue flows back to stakers.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-citizen-600 text-white text-lg font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Roadmap ──────────────────────────────────────────────────── */}
      <section id="roadmap" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Roadmap</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            A phased approach from foundations to scale. Each phase builds on the last,
            driven by metrics and community feedback.
          </p>
        </div>

        <div className="space-y-6">
          {[
            {
              phase: "Phase 0",
              title: "Foundations",
              status: "completed",
              items: [
                "Define scope, success criteria, and technical architecture",
                "Select base chain (Cosmos SDK / wasmd)",
                "Design identity verification approach and credential lifecycle",
              ],
            },
            {
              phase: "Phase 1",
              title: "Identity + Core Contracts",
              status: "active",
              items: [
                "Implement Credential Registry, Treasury, Voting, Grants, and Staking contracts",
                "Build citizen dashboard, voting UI, and grants portal",
                "Internal testnet with full contract suite",
              ],
            },
            {
              phase: "Phase 2",
              title: "Treasury + Voting + Grants MVP",
              status: "upcoming",
              items: [
                "Node operator tooling, staking UI, and reward distribution",
                "Public transparency dashboard",
                "Security and privacy reviews",
                "Limited public testnet with verified users",
              ],
            },
            {
              phase: "Phase 3",
              title: "Node Network + Observability",
              status: "upcoming",
              items: [
                "Expand node distribution with geographic incentives",
                "Metrics collection, health reporting, and monitoring",
                "Collect data and refine treasury parameters",
              ],
            },
            {
              phase: "Phase 4",
              title: "Research Funding + Infrastructure Pilot",
              status: "upcoming",
              items: [
                "Research category registry and initial funding pools",
                "First research grant cycle",
                "Infrastructure pilot: regional center and warehouse",
                "Infrastructure reporting integrated into dashboard",
              ],
            },
            {
              phase: "Phase 5",
              title: "Scale + Governance Maturity",
              status: "upcoming",
              items: [
                "Multi-region expansion",
                "Formal governance audits and periodic policy review",
                "IP portfolio management and licensing program",
                "Publish v2 roadmap based on metrics and community feedback",
              ],
            },
          ].map((p) => (
            <div
              key={p.phase}
              className={`rounded-xl border p-6 ${
                p.status === "completed"
                  ? "bg-green-50 border-green-200"
                  : p.status === "active"
                  ? "bg-citizen-50 border-citizen-200 ring-2 ring-citizen-300"
                  : "bg-white border-gray-100"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                <span
                  className={`inline-flex items-center gap-2 text-sm font-bold px-3 py-1 rounded-full w-fit ${
                    p.status === "completed"
                      ? "bg-green-200 text-green-800"
                      : p.status === "active"
                      ? "bg-citizen-200 text-citizen-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {p.status === "completed" && "✅ "}
                  {p.status === "active" && "🔨 "}
                  {p.phase}
                </span>
                <h3 className="text-lg font-bold text-gray-900">{p.title}</h3>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {p.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-gray-600">
                    <span className={`mt-0.5 flex-shrink-0 ${p.status === "completed" ? "text-green-500" : "text-gray-400"}`}>
                      {p.status === "completed" ? "✓" : "○"}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Tech Stack ───────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Built on Proven Technology
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {[
              { name: "Cosmos SDK", desc: "Sovereign chain framework", icon: "⚛️" },
              { name: "CosmWasm v2", desc: "Secure smart contracts in Rust", icon: "🦀" },
              { name: "CometBFT", desc: "Byzantine fault tolerant consensus", icon: "🔗" },
              { name: "Zero Knowledge", desc: "Privacy-preserving proofs", icon: "🔒" },
            ].map((tech) => (
              <div
                key={tech.name}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center"
              >
                <div className="text-3xl mb-3">{tech.icon}</div>
                <div className="font-bold text-gray-900">{tech.name}</div>
                <div className="text-xs text-gray-500 mt-1">{tech.desc}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Component</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Technology</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { component: "Blockchain", tech: "Cosmos SDK / wasmd (CosmWasm)" },
                  { component: "Consensus", tech: "CometBFT (Tendermint)" },
                  { component: "Smart Contracts", tech: "Rust (CosmWasm v2)" },
                  { component: "Frontend", tech: "Next.js 14, React 18, Tailwind CSS" },
                  { component: "Chain Client", tech: "CosmJS v0.32" },
                  { component: "Wallet Support", tech: "Keplr, Leap" },
                  { component: "Indexer", tech: "Custom event indexer with PostgreSQL" },
                  { component: "Identity Proofs", tech: "Zero-Knowledge (ZK) commitments" },
                  { component: "Chain ID", tech: "citizen-ledger-1 (mainnet)" },
                  { component: "Block Time", tech: "~6 seconds" },
                  { component: "Bech32 Prefix", tech: "citizen" },
                ].map((row) => (
                  <tr key={row.component}>
                    <td className="py-3 px-4 text-gray-600">{row.component}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{row.tech}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── CTA Section ──────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-citizen-700 to-emerald-700 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Ready to be a Citizen?
          </h2>
          <p className="mt-4 text-lg text-green-200 max-w-2xl mx-auto">
            Join the testnet, explore governance, and help shape the future of
            community-led blockchain infrastructure. Real income. Real governance. Real impact.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            {!address ? (
              <button
                onClick={() => connect()}
                disabled={isConnecting}
                className="bg-white text-citizen-800 font-bold py-3 px-8 rounded-xl text-lg hover:bg-gray-100 transition-all"
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            ) : (
              <Link
                href="/governance"
                className="bg-white text-citizen-800 font-bold py-3 px-8 rounded-xl text-lg hover:bg-gray-100 transition-all"
              >
                Go to Governance →
              </Link>
            )}
            <a
              href="https://github.com/Mopperr/citizen-ledger"
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-white/30 text-white font-semibold py-3 px-8 rounded-xl text-lg hover:bg-white/10 transition-all"
            >
              GitHub ↗
            </a>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Citizen Ledger</h3>
              <p className="text-sm leading-relaxed">
                A citizen-led blockchain for transparent governance,
                community treasury management, privacy-preserving credentials,
                and real-world infrastructure funding.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/governance" className="hover:text-white transition-colors">Governance</Link></li>
                <li><Link href="/treasury" className="hover:text-white transition-colors">Treasury</Link></li>
                <li><Link href="/grants" className="hover:text-white transition-colors">Grants</Link></li>
                <li><Link href="/staking" className="hover:text-white transition-colors">Staking</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/identity" className="hover:text-white transition-colors">Identity</Link></li>
                <li><Link href="/transparency" className="hover:text-white transition-colors">Transparency</Link></li>
                <li><Link href="/infrastructure" className="hover:text-white transition-colors">Infrastructure</Link></li>
                <li><a href="#roadmap" className="hover:text-white transition-colors">Roadmap</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Community</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="https://github.com/Mopperr/citizen-ledger" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-xs text-gray-500">
            © 2026 Citizen Ledger. Open source under MIT License.
          </div>
        </div>
      </footer>
    </div>
  );
}
