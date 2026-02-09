"use client";

import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";

export function Navbar() {
  const { address, connect, disconnect, isConnecting } = useWallet();

  const truncatedAddr = address
    ? `${address.slice(0, 10)}...${address.slice(-6)}`
    : null;

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo / Brand */}
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-citizen-700">
              Citizen Ledger
            </Link>

            {/* Nav links */}
            <div className="hidden md:flex gap-6">
              <Link
                href="/governance"
                className="text-gray-600 hover:text-citizen-600 text-sm font-medium"
              >
                Governance
              </Link>
              <Link
                href="/treasury"
                className="text-gray-600 hover:text-citizen-600 text-sm font-medium"
              >
                Treasury
              </Link>
              <Link
                href="/grants"
                className="text-gray-600 hover:text-citizen-600 text-sm font-medium"
              >
                Grants
              </Link>
              <Link
                href="/staking"
                className="text-gray-600 hover:text-citizen-600 text-sm font-medium"
              >
                Staking
              </Link>
              <Link
                href="/identity"
                className="text-gray-600 hover:text-citizen-600 text-sm font-medium"
              >
                Identity
              </Link>
              <Link
                href="/transparency"
                className="text-gray-600 hover:text-citizen-600 text-sm font-medium"
              >
                Transparency
              </Link>
              <Link
                href="/infrastructure"
                className="text-gray-600 hover:text-citizen-600 text-sm font-medium"
              >
                Infrastructure
              </Link>
            </div>
          </div>

          {/* Wallet */}
          <div>
            {address ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 font-mono">
                  {truncatedAddr}
                </span>
                <button onClick={disconnect} className="btn-secondary text-sm">
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="btn-primary text-sm"
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
