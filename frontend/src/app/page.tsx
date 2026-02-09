"use client";

import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";

export default function Home() {
  const { address } = useWallet();

  const features = [
    {
      title: "Identity & Credentials",
      description: "Privacy-preserving ZK credentials for one-person-one-vote governance",
      href: "/identity",
      icon: "🛡️",
    },
    {
      title: "Governance",
      description: "Create proposals, vote with 1P1V or quadratic methods, shape the community",
      href: "/governance",
      icon: "🗳️",
    },
    {
      title: "Treasury",
      description: "Transparent community funds with category-based allocation and spending audit trail",
      href: "/treasury",
      icon: "🏛️",
    },
    {
      title: "Grants",
      description: "Apply for milestone-based funding, track progress, and release funds on delivery",
      href: "/grants",
      icon: "🎯",
    },
    {
      title: "Staking & Emissions",
      description: "Stake tokens, earn rewards from capped emissions, secure the network",
      href: "/staking",
      icon: "⚡",
    },
    {
      title: "Transparency",
      description: "Public dashboard showing treasury flows, governance stats, and emission progress",
      href: "/transparency",
      icon: "📊",
    },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="text-center py-16">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
          Citizen Ledger
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          A citizen-led blockchain for transparent governance, community
          treasury management, and privacy-preserving identity credentials.
        </p>
        {!address && (
          <p className="mt-6 text-sm text-gray-400">
            Connect your wallet to get started
          </p>
        )}
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="card hover:shadow-md transition-shadow group"
          >
            <div className="text-3xl mb-3">{feature.icon}</div>
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-citizen-600">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm text-gray-500">{feature.description}</p>
          </Link>
        ))}
      </div>

      {/* Stats placeholder */}
      <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "Total Citizens", value: "—" },
          { label: "Active Proposals", value: "—" },
          { label: "Treasury Balance", value: "—" },
          { label: "Total Staked", value: "—" },
        ].map((stat) => (
          <div key={stat.label} className="card text-center">
            <div className="text-2xl font-bold text-citizen-700">
              {stat.value}
            </div>
            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
