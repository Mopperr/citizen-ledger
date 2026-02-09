"use client";

import Link from "next/link";
import { useState } from "react";

interface FAQItem {
  question: string;
  answer: React.ReactNode;
  category: string;
}

const faqItems: FAQItem[] = [
  // ── General
  {
    category: "General",
    question: "What is Citizen Ledger?",
    answer: (
      <p>
        Citizen Ledger is a citizen-led blockchain network designed for
        transparent governance, community treasury management, and real-world
        infrastructure funding. It uses privacy-preserving identity verification
        (ZK proofs) and one-person-one-vote governance to ensure fair, inclusive
        decision-making.
      </p>
    ),
  },
  {
    category: "General",
    question: "Is this a CBDC (Central Bank Digital Currency)?",
    answer: (
      <p>
        No. Citizen Ledger is a fully decentralised, community-governed
        blockchain. It has no affiliation with any government or central bank. It
        is not a digital currency issued by a state — it is a public utility
        governed by its citizen participants.
      </p>
    ),
  },
  {
    category: "General",
    question: "Is this open source?",
    answer: (
      <p>
        Yes. Every smart contract, the full frontend code, the whitepaper, and
        all documentation are publicly available on{" "}
        <a
          href="https://github.com/Mopperr/citizen-ledger"
          target="_blank"
          rel="noopener noreferrer"
          className="text-citizen-600 hover:text-citizen-700 underline"
        >
          GitHub
        </a>
        . You can audit the code yourself.
      </p>
    ),
  },
  {
    category: "General",
    question: "How is this different from other crypto projects?",
    answer: (
      <div className="space-y-2">
        <p>Most crypto projects are speculative financial instruments. Citizen Ledger is fundamentally different:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Governance:</strong> One person, one vote (identity-based) instead of token-weighted voting.</li>
          <li><strong>Revenue:</strong> Real income from hospitals, factories, patents, and products — not just token price speculation.</li>
          <li><strong>Distribution:</strong> No VC allocation, no team pre-mine. Every token is earned.</li>
          <li><strong>Purpose:</strong> Funds research, builds infrastructure, manufactures products the public votes to create.</li>
        </ul>
      </div>
    ),
  },

  // ── Privacy & Data
  {
    category: "Privacy & Data",
    question: "Where is my data stored?",
    answer: (
      <div className="space-y-2">
        <p>Citizen Ledger is designed for minimal data exposure:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>On-chain (public):</strong> Votes, treasury transactions, grant milestones, token balances. No personal information.</li>
          <li><strong>Your wallet (local):</strong> Private keys stay in your browser wallet (Keplr, Leap, or Cosmostation). We never have access.</li>
          <li><strong>Identity verification (off-chain):</strong> Documents go to a verified third-party provider. Only a ZK proof of eligibility reaches the chain — your name and documents are never stored on-chain.</li>
          <li><strong>This website:</strong> Static site, no tracking, no data collection. The only local storage is your wallet preference for auto-reconnect.</li>
        </ul>
      </div>
    ),
  },
  {
    category: "Privacy & Data",
    question: "Can you see my personal information?",
    answer: (
      <p>
        No. Citizen Ledger uses zero-knowledge proofs for identity verification.
        Your documents are processed by a third-party verifier who issues a
        cryptographic proof that you meet eligibility criteria. The protocol only
        sees the proof — never your name, address, ID number, or any personal
        data.
      </p>
    ),
  },

  // ── Wallet & Getting Started
  {
    category: "Wallet & Getting Started",
    question: "What wallet do I need?",
    answer: (
      <div className="space-y-2">
        <p>Citizen Ledger supports three Cosmos-compatible wallets:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <a href="https://www.keplr.app/" target="_blank" rel="noopener noreferrer" className="text-citizen-600 hover:text-citizen-700 underline">
              Keplr
            </a>{" "}
            — The most popular Cosmos wallet (browser extension + mobile)
          </li>
          <li>
            <a href="https://www.leapwallet.io/" target="_blank" rel="noopener noreferrer" className="text-citizen-600 hover:text-citizen-700 underline">
              Leap
            </a>{" "}
            — Mobile-friendly with an excellent UI
          </li>
          <li>
            <a href="https://www.cosmostation.io/" target="_blank" rel="noopener noreferrer" className="text-citizen-600 hover:text-citizen-700 underline">
              Cosmostation
            </a>{" "}
            — Feature-rich Cosmos wallet with staking support
          </li>
        </ul>
        <p className="text-sm text-gray-400">
          Install any of these as a browser extension, create an account, and
          click &quot;Connect Wallet&quot; on Citizen Ledger.
        </p>
      </div>
    ),
  },
  {
    category: "Wallet & Getting Started",
    question: "Can I use MetaMask?",
    answer: (
      <div className="space-y-2">
        <p>
          Citizen Ledger runs on the Cosmos ecosystem, not Ethereum, so MetaMask
          doesn&apos;t connect directly. However, you have options:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Import your seed phrase:</strong> If you have an existing
            MetaMask seed phrase, you can import it into Keplr or Leap to use
            the same keys on Cosmos.
          </li>
          <li>
            <strong>Create a new wallet:</strong> Install Keplr, Leap, or
            Cosmostation and create a fresh account. It only takes 30 seconds.
          </li>
        </ul>
      </div>
    ),
  },
  {
    category: "Wallet & Getting Started",
    question: "I'm new to crypto. How do I get started?",
    answer: (
      <div className="space-y-3">
        <p>Getting started takes about 2 minutes:</p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            <strong>Install a wallet:</strong> Go to{" "}
            <a href="https://www.leapwallet.io/" target="_blank" rel="noopener noreferrer" className="text-citizen-600 underline">
              leapwallet.io
            </a>{" "}
            and install the browser extension (Chrome, Brave, Edge, or Firefox).
          </li>
          <li>
            <strong>Create an account:</strong> Open Leap, click &quot;Create new wallet,&quot;
            and follow the prompts. <strong>Write down your seed phrase and store it
            safely</strong> — this is the only way to recover your wallet.
          </li>
          <li>
            <strong>Connect to Citizen Ledger:</strong> Come back to this site and click
            &quot;Connect Wallet&quot; → select &quot;Leap&quot;. Your wallet will ask you to approve
            the connection.
          </li>
          <li>
            <strong>Start participating:</strong> Once connected, you can view
            governance proposals, explore the treasury, and (once the testnet is
            live) vote and stake.
          </li>
        </ol>
        <p className="text-sm text-gray-400">
          You don&apos;t need to buy any tokens to browse the site. A wallet is only
          required for voting, staking, and submitting proposals.
        </p>
      </div>
    ),
  },

  // ── Tokens & Value
  {
    category: "Tokens & Value",
    question: "What is the CITIZEN token?",
    answer: (
      <p>
        CITIZEN is the native token of the Citizen Ledger network. It is used for
        staking (earning rewards), governance (voting on proposals), and
        accessing treasury-funded services. The total supply is capped at 1
        billion CITIZEN with a declining emission schedule.
      </p>
    ),
  },
  {
    category: "Tokens & Value",
    question: "How do I earn income from holding CITIZEN?",
    answer: (
      <div className="space-y-2">
        <p>CITIZEN holders who stake earn from multiple real-world income streams:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Infrastructure Yield:</strong> Income from protocol-owned hospitals, warehouses, and facilities.</li>
          <li><strong>Product Revenue:</strong> Sales revenue from products created through the Demand Discovery Engine.</li>
          <li><strong>Research Royalties:</strong> Patent licensing fees from funded research breakthroughs.</li>
          <li><strong>Staking Rewards:</strong> Block emission rewards on a declining schedule.</li>
          <li><strong>Fee Share:</strong> A percentage of all on-chain transaction fees.</li>
        </ul>
      </div>
    ),
  },
  {
    category: "Tokens & Value",
    question: "Was there a pre-mine or VC allocation?",
    answer: (
      <p>
        No. There is no pre-mine, no VC allocation, and no team token reserve.
        Every CITIZEN token enters circulation through staking rewards and
        protocol emissions. This ensures fair distribution and aligns incentives
        with active participation.
      </p>
    ),
  },

  // ── Governance
  {
    category: "Governance",
    question: "How does voting work?",
    answer: (
      <div className="space-y-2">
        <p>Citizen Ledger uses two voting methods:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>One-person-one-vote:</strong> Used for core constitutional
            changes and treasury policies. Every verified citizen gets exactly
            one vote, regardless of token holdings.
          </li>
          <li>
            <strong>Quadratic voting:</strong> Used for funding allocation across
            categories. This balances intensity of preference with breadth of
            support.
          </li>
        </ul>
      </div>
    ),
  },
  {
    category: "Governance",
    question: "What is the Demand Discovery Engine?",
    answer: (
      <div className="space-y-2">
        <p>
          The Demand Discovery Engine (also called &quot;The Machine&quot;) is a system
          where anyone can submit product ideas. An AI curation layer
          deduplicates and enriches submissions, then citizens vote on which
          products to build. Winning ideas are funded, prototyped, and
          manufactured in protocol-owned facilities — with sales revenue flowing
          back to CITIZEN stakers.
        </p>
        <p className="text-sm text-gray-400">
          Think of it as a citizen-governed product company: the world tells you
          what to build, you vote on it, the treasury funds it, and everyone
          earns from the result.
        </p>
      </div>
    ),
  },

  // ── Technical
  {
    category: "Technical",
    question: "What blockchain is this built on?",
    answer: (
      <p>
        Citizen Ledger is built on the Cosmos SDK with CosmWasm smart contracts
        (written in Rust). It runs as a sovereign application-specific
        blockchain with interoperability via IBC (Inter-Blockchain Communication
        protocol).
      </p>
    ),
  },
  {
    category: "Technical",
    question: "Can I export my data?",
    answer: (
      <p>
        Yes. The Transparency Dashboard provides JSON and CSV export for treasury
        transactions, grant records, and governance activity. All on-chain data
        is also directly queryable via the public RPC and REST endpoints.
      </p>
    ),
  },
  {
    category: "Technical",
    question: "How do I run a node?",
    answer: (
      <div className="space-y-2">
        <p>
          Citizen Ledger supports two types of nodes:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Home nodes:</strong> Minimal hardware (Raspberry Pi or basic PC). Great for decentralisation.</li>
          <li><strong>Institutional nodes:</strong> Higher-availability servers with stronger SLAs.</li>
        </ul>
        <p className="text-sm text-gray-400">
          See the{" "}
          <a
            href="https://github.com/Mopperr/citizen-ledger/blob/main/docs/node-operator-guide.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-citizen-600 underline"
          >
            Node Operator Guide
          </a>{" "}
          for full setup instructions.
        </p>
      </div>
    ),
  },
];

const categories = [...new Set(faqItems.map((item) => item.category))];

function FAQAccordion({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-gray-900 group-hover:text-citizen-700 pr-4">
          {item.question}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="pb-5 text-sm text-gray-600 leading-relaxed pr-8">
          {item.answer}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="space-y-12 pb-16">
      {/* Header */}
      <section className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 bg-gradient-to-br from-citizen-900 via-citizen-800 to-emerald-900 text-white px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-citizen-100">
            Everything you need to know about Citizen Ledger.
          </p>
        </div>
      </section>

      {/* FAQ by Category */}
      <div className="max-w-3xl mx-auto space-y-10">
        {categories.map((cat) => (
          <section key={cat}>
            <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              {cat === "General" && "🌐"}
              {cat === "Privacy & Data" && "🔒"}
              {cat === "Wallet & Getting Started" && "👛"}
              {cat === "Tokens & Value" && "💰"}
              {cat === "Governance" && "🗳️"}
              {cat === "Technical" && "⚙️"}
              {cat}
            </h2>
            <div className="card divide-y divide-gray-100">
              {faqItems
                .filter((item) => item.category === cat)
                .map((item) => (
                  <FAQAccordion key={item.question} item={item} />
                ))}
            </div>
          </section>
        ))}
      </div>

      {/* Still have questions? */}
      <section className="max-w-3xl mx-auto text-center">
        <div className="card bg-citizen-50 border-citizen-200 p-8">
          <h2 className="text-xl font-bold text-citizen-900 mb-3">
            Still have questions?
          </h2>
          <p className="text-citizen-700 mb-6">
            Check out the full documentation or join the community on GitHub.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://github.com/Mopperr/citizen-ledger"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              GitHub
            </a>
            <Link href="/about" className="btn-secondary">
              About
            </Link>
            <Link href="/" className="btn-secondary">
              Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
