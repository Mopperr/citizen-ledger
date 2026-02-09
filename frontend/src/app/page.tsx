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
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const statusRes = await fetch(`${RPC_ENDPOINT}/status`);
        const statusData = await statusRes.json();
        const height = statusData?.result?.sync_info?.latest_block_height || "—";
        setStats((s) => ({ ...s, blockHeight: Number(height).toLocaleString() }));
      } catch {}
    }
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return stats;
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
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Live on Local Testnet — Block #{stats.blockHeight}
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
              Governance by
              <span className="block bg-gradient-to-r from-green-300 to-emerald-200 bg-clip-text text-transparent">
                the People
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              <strong className="text-white">Citizen Ledger</strong> is a next-generation blockchain
              where every citizen gets one vote, treasury spending is 100% transparent,
              and communities govern themselves — not corporations.
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
            </div>
          </div>
        </div>

        {/* Wave divider */}
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
            { label: "Max Supply", value: "1T CITIZEN", icon: "💰" },
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

      {/* ─── About Section ────────────────────────────────────────────── */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            What is Citizen Ledger?
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            A CosmWasm-powered blockchain designed from the ground up for
            <strong> transparent civic governance</strong>. No VCs, no pre-mine games —
            just citizens building the future together.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-citizen-50 to-white rounded-xl border border-citizen-100 p-8">
            <h3 className="text-xl font-bold text-citizen-800 mb-4">🏛️ The Problem</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex gap-2"><span className="text-red-500">✗</span> Most blockchains let whales dominate governance</li>
              <li className="flex gap-2"><span className="text-red-500">✗</span> Treasury spending is opaque and unaccountable</li>
              <li className="flex gap-2"><span className="text-red-500">✗</span> Identity systems sacrifice privacy for verification</li>
              <li className="flex gap-2"><span className="text-red-500">✗</span> Grant funding lacks milestone-based accountability</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-100 p-8">
            <h3 className="text-xl font-bold text-green-800 mb-4">✨ The Solution</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex gap-2"><span className="text-green-500">✓</span> <strong>One-Person-One-Vote</strong> — ZK credentials ensure fair voting</li>
              <li className="flex gap-2"><span className="text-green-500">✓</span> <strong>Transparent Treasury</strong> — every spend is on-chain and categorized</li>
              <li className="flex gap-2"><span className="text-green-500">✓</span> <strong>Privacy-Preserving ID</strong> — prove citizenship without revealing data</li>
              <li className="flex gap-2"><span className="text-green-500">✓</span> <strong>Milestone Grants</strong> — funds release only on verified delivery</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  "Zero-knowledge credential issuance and verification. Prove you're a citizen without revealing personal data. Trusted issuers gate access to governance.",
                href: "/identity",
                color: "from-indigo-500 to-purple-600",
              },
              {
                icon: "🗳️",
                title: "Governance & Voting",
                description:
                  "Create proposals, debate, and vote with One-Person-One-Vote or Quadratic voting. Timelock execution. Quorum enforcement. Democracy on-chain.",
                href: "/governance",
                color: "from-citizen-500 to-emerald-600",
              },
              {
                icon: "🏛️",
                title: "Community Treasury",
                description:
                  "Category-based fund allocation (Research, Healthcare, Infrastructure, Education). Every spend visible on-chain with mandatory memos.",
                href: "/treasury",
                color: "from-amber-500 to-orange-600",
              },
              {
                icon: "🎯",
                title: "Grant System",
                description:
                  "Apply for community funding with milestone plans. Independent oracles verify deliverables. Funds unlock progressively — no lump-sum risk.",
                href: "/grants",
                color: "from-pink-500 to-rose-600",
              },
              {
                icon: "⚡",
                title: "Staking & Emissions",
                description:
                  "Capped supply with multi-phase emission schedule. Stake to secure the network and earn rewards. 20% of emissions flow to the community treasury.",
                href: "/staking",
                color: "from-cyan-500 to-blue-600",
              },
              {
                icon: "📊",
                title: "Transparency Dashboard",
                description:
                  "Real-time public dashboard: treasury flows, governance stats, emission progress, and staking metrics. Trust through transparency.",
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
        </div>
      </section>

      {/* ─── Tokenomics ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Tokenomics
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Fair, transparent, and designed for long-term sustainability.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Supply info */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Supply Overview</h3>
              <div className="space-y-3">
                {[
                  { label: "Token Name", value: "CITIZEN" },
                  { label: "Denomination", value: "ucitizen (1 CITIZEN = 10⁶ ucitizen)" },
                  { label: "Max Supply", value: "1,000,000,000 CITIZEN (1 Trillion ucitizen)" },
                  { label: "Initial Supply", value: "0 — All tokens minted through emissions" },
                  { label: "Pre-mine", value: "None" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500">{row.label}</span>
                    <span className="text-sm font-medium text-gray-900">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Emission schedule */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Emission Schedule</h3>
              <div className="space-y-4">
                {[
                  { phase: "Bootstrap", blocks: "0 — 1M", rate: "1.0 CITIZEN/block", pct: "100%" },
                  { phase: "Growth", blocks: "1M — 5M", rate: "0.5 CITIZEN/block", pct: "60%" },
                  { phase: "Maturity", blocks: "5M — 20M", rate: "0.1 CITIZEN/block", pct: "30%" },
                  { phase: "Tail", blocks: "20M+", rate: "0.01 CITIZEN/block", pct: "10%" },
                ].map((p) => (
                  <div key={p.phase} className="flex items-center gap-4">
                    <div className="w-20 text-xs font-semibold text-citizen-700 bg-citizen-50 rounded-full py-1 px-3 text-center">
                      {p.phase}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Blocks {p.blocks}</span>
                        <span className="font-medium text-gray-900">{p.rate}</span>
                      </div>
                      <div className="mt-1 w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-citizen-500 to-emerald-500 h-2 rounded-full"
                          style={{ width: p.pct }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">
                20% of all emissions flow to the Community Treasury. Stakers earn 80%.
              </p>
            </div>
          </div>
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
                  "A trusted issuer verifies your identity and issues a ZK credential — your data stays private.",
              },
              {
                step: "02",
                title: "Stake & Earn",
                description:
                  "Stake CITIZEN tokens to secure the network. Earn emissions from a transparent, capped schedule.",
              },
              {
                step: "03",
                title: "Propose & Vote",
                description:
                  "Submit governance proposals. Every verified citizen gets one vote — wealth doesn't buy influence.",
              },
              {
                step: "04",
                title: "Fund & Build",
                description:
                  "Apply for grants from the community treasury. Funds release on milestone completion, verified by oracles.",
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

      {/* ─── Tech Stack ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Built on Proven Technology
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { name: "Cosmos SDK", desc: "Sovereign chain framework", icon: "⚛️" },
            { name: "CosmWasm", desc: "Secure smart contracts", icon: "🦀" },
            { name: "CometBFT", desc: "Byzantine fault tolerance", icon: "🔗" },
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
      </section>

      {/* ─── CTA Section ──────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-citizen-700 to-emerald-700 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Ready to be a Citizen?
          </h2>
          <p className="mt-4 text-lg text-green-200 max-w-2xl mx-auto">
            Join the testnet, explore governance, and help shape the future of
            community-led blockchain infrastructure.
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
                community treasury management, and privacy-preserving credentials.
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
