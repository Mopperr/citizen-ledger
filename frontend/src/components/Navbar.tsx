"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWallet } from "@/hooks/useWallet";

export function Navbar() {
  const { address, connect, disconnect, isConnecting, error, clearError, provider, autoReconnect } =
    useWallet();
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-reconnect on mount
  useEffect(() => {
    autoReconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-dismiss errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const truncatedAddr = address
    ? `${address.slice(0, 10)}...${address.slice(-6)}`
    : null;

  const providerLabel = provider === "leap" ? "Leap" : "Keplr";

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo / Brand */}
            <div className="flex items-center gap-8">
              <Link
                href="/"
                className="text-xl font-bold text-citizen-700 flex items-center gap-2"
              >
                <span className="w-8 h-8 bg-gradient-to-br from-citizen-500 to-emerald-600 rounded-lg flex items-center justify-center text-white text-sm font-black">
                  CL
                </span>
                Citizen Ledger
              </Link>

              {/* Desktop nav links */}
              <div className="hidden md:flex gap-6">
                {[
                  { href: "/governance", label: "Governance" },
                  { href: "/treasury", label: "Treasury" },
                  { href: "/grants", label: "Grants" },
                  { href: "/staking", label: "Staking" },
                  { href: "/identity", label: "Identity" },
                  { href: "/transparency", label: "Transparency" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-gray-600 hover:text-citizen-600 text-sm font-medium transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Wallet + mobile hamburger */}
            <div className="flex items-center gap-3">
              {/* Wallet section */}
              {address ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
                    <span className="w-2 h-2 bg-green-400 rounded-full" />
                    {providerLabel}
                  </div>
                  <span className="text-sm text-gray-500 font-mono bg-gray-50 px-3 py-1 rounded-lg">
                    {truncatedAddr}
                  </span>
                  <button onClick={disconnect} className="btn-secondary text-sm">
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowWalletMenu(!showWalletMenu)}
                    disabled={isConnecting}
                    className="btn-primary text-sm"
                  >
                    {isConnecting ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="animate-spin h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Connecting...
                      </span>
                    ) : (
                      "Connect Wallet"
                    )}
                  </button>

                  {/* Wallet picker dropdown */}
                  {showWalletMenu && !isConnecting && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                      <button
                        onClick={() => {
                          setShowWalletMenu(false);
                          connect("keplr");
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm"
                      >
                        <span className="text-lg">🟣</span>
                        <div>
                          <div className="font-medium text-gray-900">Keplr</div>
                          <div className="text-xs text-gray-400">
                            Most popular Cosmos wallet
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setShowWalletMenu(false);
                          connect("leap");
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm"
                      >
                        <span className="text-lg">🟢</span>
                        <div>
                          <div className="font-medium text-gray-900">Leap</div>
                          <div className="text-xs text-gray-400">
                            Mobile-friendly Cosmos wallet
                          </div>
                        </div>
                      </button>
                      <div className="border-t border-gray-100 mt-1 pt-1 px-4 py-2">
                        <button
                          onClick={() => {
                            setShowWalletMenu(false);
                            connect();
                          }}
                          className="text-xs text-citizen-600 hover:text-citizen-700"
                        >
                          Auto-detect wallet →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md">
            <div className="px-4 py-3 space-y-2">
              {[
                { href: "/governance", label: "Governance" },
                { href: "/treasury", label: "Treasury" },
                { href: "/grants", label: "Grants" },
                { href: "/staking", label: "Staking" },
                { href: "/identity", label: "Identity" },
                { href: "/transparency", label: "Transparency" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 px-3 text-gray-700 hover:bg-citizen-50 hover:text-citizen-700 rounded-lg text-sm font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Error toast */}
      {error && (
        <div className="fixed top-20 right-4 z-50 max-w-sm animate-slide-in">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <span className="text-red-500 text-lg flex-shrink-0">⚠️</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800">Wallet Error</p>
                <p className="text-xs text-red-600 mt-1 break-words">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-600 flex-shrink-0"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
