"use client";

import { useState, useEffect } from "react";
import { useCredentials } from "@/hooks/useContracts";
import { useWallet } from "@/hooks/useWallet";
import {
  isZkSupported,
  generateCommitment,
  type IdentityInputs,
} from "@/lib/zk";

export default function IdentityPage() {
  const { address } = useWallet();
  const { hasCredential, listCredentials } = useCredentials();
  const [credentials, setCredentials] = useState<any[]>([]);
  const [hasCitizenship, setHasCitizenship] = useState(false);
  const [zkSupported, setZkSupported] = useState(true);

  // Verification request form
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [verificationStep, setVerificationStep] = useState<
    "form" | "generating" | "submitted"
  >("form");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    idNumber: "",
    nationality: "",
  });
  const [commitment, setCommitment] = useState<string | null>(null);

  useEffect(() => {
    setZkSupported(isZkSupported());
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

  const handleRequestVerification = async () => {
    if (!address || !formData.firstName || !formData.dateOfBirth) return;

    setVerificationStep("generating");

    try {
      const inputs: IdentityInputs = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: new Date(formData.dateOfBirth),
        idNumber: formData.idNumber,
        nationality: formData.nationality,
      };

      // Generate commitment locally (private data never leaves browser)
      const { commitment: comm, salt } = await generateCommitment(inputs);
      setCommitment(comm);

      // Store salt in localStorage (user needs this for future proofs)
      localStorage.setItem(
        `citizen-ledger-salt-${address}`,
        JSON.stringify({
          salt,
          commitment: comm,
          createdAt: new Date().toISOString(),
        })
      );

      // In production: Submit commitment to a trusted issuer for verification
      // The issuer verifies the identity off-chain (gov ID, video call, etc.)
      // Then issues a credential with this commitment on-chain

      setVerificationStep("submitted");
    } catch (error) {
      console.error("Failed to generate commitment:", error);
      setVerificationStep("form");
    }
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

          {/* Request Verification Button / Form */}
          {!hasCitizenship && !showRequestForm && (
            <div className="card mb-8">
              <h2 className="text-lg font-semibold mb-2">Get Verified</h2>
              <p className="text-sm text-gray-500 mb-4">
                Request citizenship verification to participate in governance.
                Your identity data is processed locally and never stored on-chain.
              </p>
              {zkSupported ? (
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="btn-primary"
                >
                  Start Verification Request
                </button>
              ) : (
                <p className="text-sm text-red-500">
                  Your browser doesn&apos;t support the required cryptographic APIs.
                  Please use a modern browser like Chrome, Firefox, or Edge.
                </p>
              )}
            </div>
          )}

          {/* Verification Request Form */}
          {showRequestForm && (
            <div className="card mb-8">
              <h2 className="text-lg font-semibold mb-4">
                {verificationStep === "submitted"
                  ? "Verification Requested"
                  : "Identity Verification Request"}
              </h2>

              {verificationStep === "form" && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 mb-4">
                    Enter your identity information below. This data is hashed
                    locally — only a cryptographic commitment is generated.
                    <strong> Your personal data never leaves your browser.</strong>
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                        className="input-field"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        className="input-field"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        setFormData({ ...formData, dateOfBirth: e.target.value })
                      }
                      className="input-field"
                      placeholder="YYYY-MM-DD"
                      title="Your date of birth"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      National ID Number
                    </label>
                    <input
                      type="text"
                      value={formData.idNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, idNumber: e.target.value })
                      }
                      className="input-field"
                      placeholder="Your government-issued ID number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nationality (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.nationality}
                      onChange={(e) =>
                        setFormData({ ...formData, nationality: e.target.value })
                      }
                      className="input-field"
                      placeholder="e.g., United States"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleRequestVerification}
                      disabled={!formData.firstName || !formData.dateOfBirth}
                      className="btn-primary disabled:opacity-50"
                    >
                      Generate Commitment
                    </button>
                    <button
                      onClick={() => setShowRequestForm(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {verificationStep === "generating" && (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-citizen-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">
                    Generating cryptographic commitment...
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Your data is being hashed locally
                  </p>
                </div>
              )}

              {verificationStep === "submitted" && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium">
                      Commitment generated successfully!
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      Your identity commitment has been created. Share this with
                      a trusted issuer to complete verification.
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Commitment (share with issuer):
                    </label>
                    <code className="block text-xs bg-white p-3 rounded border font-mono break-all">
                      {commitment}
                    </code>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Important:</strong> Your salt has been saved locally.
                      You&apos;ll need it to generate proofs later. If you clear your
                      browser data, you may need to re-verify.
                    </p>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => {
                        setShowRequestForm(false);
                        setVerificationStep("form");
                        setFormData({
                          firstName: "",
                          lastName: "",
                          dateOfBirth: "",
                          idNumber: "",
                          nationality: "",
                        });
                      }}
                      className="btn-secondary"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

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
