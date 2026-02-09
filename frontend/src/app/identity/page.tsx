"use client";

import { useState, useEffect } from "react";
import { useCredentials } from "@/hooks/useContracts";
import { useWallet } from "@/hooks/useWallet";

export default function IdentityPage() {
  const { address } = useWallet();
  const { hasCredential, listCredentials } = useCredentials();
  const [credentials, setCredentials] = useState<any[]>([]);
  const [hasCitizenship, setHasCitizenship] = useState(false);

  useEffect(() => {
    if (address) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const loadData = async () => {
    if (!address) return;
    try {
      const [has, creds] = await Promise.all([
        hasCredential(address, "Citizenship"),
        listCredentials(address),
      ]);
      setHasCitizenship(has);
      setCredentials(creds);
    } catch {}
  };

  const credentialTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      Citizenship: "🏛️",
      ResidencyProof: "🏠",
      AgeVerification: "📅",
      IncomeVerification: "💰",
    };
    return icons[type] || "📜";
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Identity & Credentials
      </h1>

      {!address ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">
            Connect your wallet to view your credentials
          </p>
        </div>
      ) : (
        <>
          {/* Citizenship status */}
          <div className="card mb-8">
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                  hasCitizenship ? "bg-green-100" : "bg-gray-100"
                }`}
              >
                {hasCitizenship ? "✅" : "❌"}
              </div>
              <div>
                <h2 className="text-lg font-semibold">Citizenship Status</h2>
                <p className="text-sm text-gray-500">
                  {hasCitizenship
                    ? "You have a verified citizenship credential. You can vote and create proposals."
                    : "No citizenship credential found. Contact an authorized issuer to get verified."}
                </p>
              </div>
            </div>
          </div>

          {/* Info about ZK credentials */}
          <div className="card mb-8 bg-citizen-50 border-citizen-200">
            <h3 className="text-sm font-semibold text-citizen-800 mb-2">
              How ZK Credentials Work
            </h3>
            <p className="text-sm text-citizen-700">
              Your credentials use zero-knowledge proofs to verify your identity
              without revealing personal information on-chain. Only a
              cryptographic commitment is stored — your actual data stays
              private.
            </p>
          </div>

          {/* Credentials list */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Your Credentials</h2>
            {credentials.length > 0 ? (
              <div className="space-y-4">
                {credentials.map((cred) => (
                  <div
                    key={cred.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {credentialTypeIcon(cred.credential_type)}
                      </span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {cred.credential_type}
                        </div>
                        <div className="text-xs text-gray-400">
                          ID: {cred.id.slice(0, 16)}...
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {cred.revoked ? (
                        <span className="badge-rejected">Revoked</span>
                      ) : cred.expires_at > 0 ? (
                        <span className="badge-active">
                          Expires: {new Date(cred.expires_at * 1000).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="badge-active">Active (No Expiry)</span>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        Issued by: {cred.issuer.slice(0, 12)}...
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">
                No credentials found. Connect to a running chain to check.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
