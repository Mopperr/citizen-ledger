import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Citizen Ledger — Governance by the People",
  description:
    "A citizen-led blockchain for transparent governance, community treasury management, and privacy-preserving identity. One person, one vote.",
  openGraph: {
    title: "Citizen Ledger",
    description: "Governance by the People. A next-generation blockchain for transparent civic governance.",
    type: "website",
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
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  );
}
