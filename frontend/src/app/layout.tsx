import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Citizen Ledger — Governance by the People",
  description:
    "A citizen-led blockchain for transparent governance, community treasury management, privacy-preserving identity, and real-world income from infrastructure, manufacturing, and patents. One person, one vote.",
  keywords: ["citizen ledger", "blockchain governance", "cosmos", "dao", "treasury", "staking", "zero knowledge", "civic tech"],
  openGraph: {
    title: "Citizen Ledger — Governance by the People",
    description:
      "Transparent civic governance on-chain. Treasury oversight, privacy-preserving identity, and real-world yield from infrastructure and manufacturing.",
    type: "website",
    siteName: "Citizen Ledger",
  },
  twitter: {
    card: "summary_large_image",
    title: "Citizen Ledger — Governance by the People",
    description: "Transparent civic governance on-chain. One person, one vote.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased">
        {/* Skip to content — accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-citizen-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm"
        >
          Skip to main content
        </a>
        <Navbar />
        <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main">
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  );
}
