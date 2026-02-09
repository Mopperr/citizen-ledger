"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero */}
      <section className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 bg-gradient-to-br from-citizen-900 via-citizen-800 to-emerald-900 text-white px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
            About Citizen Ledger
          </h1>
          <p className="text-lg text-citizen-100 max-w-2xl mx-auto leading-relaxed">
            A citizen-led blockchain where governance, treasury, and real-world
            infrastructure are transparent, accountable, and controlled by the
            people — not corporations or venture capital.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
        <div className="prose prose-gray max-w-none space-y-4 text-gray-600">
          <p>
            Citizen Ledger exists to prove that public money can be transparent,
            public decisions can be verifiable, and public infrastructure can be
            funded and governed by ordinary people — without intermediaries,
            lobbyists, or opaque institutions.
          </p>
          <p>
            We are building a programmable, on-chain treasury that funds research
            into life-saving medicine, constructs hospitals and manufacturing
            facilities, and produces real products that the public votes to
            create. Every penny is tracked on-chain. Every decision is auditable.
          </p>
        </div>
      </section>

      {/* Principles */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Core Principles</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {[
            {
              icon: "🗳️",
              title: "One Person, One Vote",
              desc: "Governance is identity-based, not wealth-based. Your vote counts the same whether you hold 10 tokens or 10 million.",
            },
            {
              icon: "🔒",
              title: "Privacy-Preserving Identity",
              desc: "We verify eligibility using zero-knowledge proofs. Your personal data never touches the blockchain.",
            },
            {
              icon: "🏗️",
              title: "Real-World Impact",
              desc: "Treasury funds build real hospitals, factories, and products. Token holders earn income from physical assets — not speculation.",
            },
            {
              icon: "🔍",
              title: "Radical Transparency",
              desc: "Every treasury transaction, every grant milestone, every vote is publicly auditable on-chain in real time.",
            },
            {
              icon: "🚫",
              title: "No VCs, No Pre-Mine",
              desc: "No venture capital allocation. No team token grab. Every CITIZEN token is earned through staking and participation.",
            },
            {
              icon: "🌍",
              title: "Built for Everyone",
              desc: "Low-cost home nodes, accessible wallet onboarding, and civic tools designed for citizens of all technical backgrounds.",
            },
          ].map((p) => (
            <div key={p.title} className="card p-6">
              <span className="text-3xl mb-3 block">{p.icon}</span>
              <h3 className="font-semibold text-gray-900 mb-2">{p.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How Data is Stored */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Where is Your Data Stored?
        </h2>
        <div className="card p-8">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <span className="text-2xl flex-shrink-0">⛓️</span>
              <div>
                <h3 className="font-semibold text-gray-900">On-Chain (Public Blockchain)</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Votes, treasury transactions, grant milestones, proposal metadata,
                  and token balances. This data is public, immutable, and auditable by anyone.
                  <strong> No personal information is stored on-chain.</strong>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-2xl flex-shrink-0">🔐</span>
              <div>
                <h3 className="font-semibold text-gray-900">Your Wallet (Local)</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Your private keys and signing credentials stay in your browser wallet
                  (Keplr, Leap, or Cosmostation). Citizen Ledger never has access to
                  your private keys.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-2xl flex-shrink-0">🛡️</span>
              <div>
                <h3 className="font-semibold text-gray-900">Off-Chain (Identity Verification)</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Identity documents are submitted to a verified third-party provider.
                  Only a zero-knowledge proof of eligibility is sent to the blockchain —
                  your documents, name, and personal data are never stored on-chain or by the protocol.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-2xl flex-shrink-0">🌐</span>
              <div>
                <h3 className="font-semibold text-gray-900">This Website</h3>
                <p className="text-sm text-gray-500 mt-1">
                  The frontend is a static site hosted on Vercel. It reads from the
                  blockchain and does not collect, store, or transmit any personal data.
                  The only local storage used is your wallet provider preference for
                  auto-reconnect. All source code is{" "}
                  <a
                    href="https://github.com/Mopperr/citizen-ledger"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-citizen-600 hover:text-citizen-700 underline"
                  >
                    open source on GitHub
                  </a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Technology</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "Blockchain", value: "Cosmos SDK / CosmWasm", icon: "⛓️" },
            { label: "Smart Contracts", value: "Rust (CosmWasm)", icon: "🦀" },
            { label: "Identity", value: "ZK Proofs (Groth16)", icon: "🔒" },
            { label: "Frontend", value: "Next.js + TypeScript", icon: "⚛️" },
            { label: "Wallets", value: "Keplr, Leap, Cosmostation", icon: "👛" },
            { label: "Hosting", value: "Vercel (static)", icon: "🌐" },
          ].map((t) => (
            <div key={t.label} className="card p-4 text-center">
              <span className="text-2xl block mb-2">{t.icon}</span>
              <div className="text-xs text-gray-400 uppercase tracking-wide">{t.label}</div>
              <div className="text-sm font-medium text-gray-800 mt-1">{t.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Differentiation */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          How is This Different?
        </h2>
        <div className="card p-8">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 pr-4 font-medium text-gray-500">Feature</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Most Crypto</th>
                  <th className="text-left py-3 pl-4 font-medium text-citizen-700">Citizen Ledger</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                {[
                  ["Governance", "Token-weighted (rich = more power)", "One person, one vote"],
                  ["Treasury", "Opaque multisig or VC-controlled", "On-chain, publicly auditable"],
                  ["Revenue", "Token speculation only", "Real income from buildings, patents, products"],
                  ["Identity", "Anonymous (Sybil-prone)", "Privacy-preserving ZK credentials"],
                  ["Token Distribution", "VC/team pre-mine", "No pre-mine — earned through participation"],
                  ["Real-World Assets", "None", "Hospitals, factories, warehouses, products"],
                ].map(([feature, most, cl]) => (
                  <tr key={feature} className="border-b border-gray-100">
                    <td className="py-3 pr-4 font-medium text-gray-800">{feature}</td>
                    <td className="py-3 px-4 text-gray-400">{most}</td>
                    <td className="py-3 pl-4 text-citizen-700 font-medium">{cl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Open Source */}
      <section className="max-w-4xl mx-auto">
        <div className="card bg-citizen-50 border-citizen-200 p-8 text-center">
          <h2 className="text-2xl font-bold text-citizen-900 mb-3">100% Open Source</h2>
          <p className="text-citizen-700 mb-6 max-w-lg mx-auto">
            Every smart contract, every line of frontend code, and the full
            whitepaper are public. Audit it yourself.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://github.com/Mopperr/citizen-ledger"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              View on GitHub
            </a>
            <Link href="/transparency" className="btn-secondary">
              Transparency Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Get Involved</h2>
        <p className="text-gray-500 mb-6">
          Citizen Ledger is built by citizens, for citizens. Join the community.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="https://github.com/Mopperr/citizen-ledger"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            GitHub
          </a>
          <Link href="/faq" className="btn-secondary">
            Read the FAQ
          </Link>
          <Link href="/" className="btn-secondary">
            Back to Home
          </Link>
        </div>
      </section>
    </div>
  );
}
