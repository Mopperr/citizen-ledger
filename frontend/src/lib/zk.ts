/**
 * ZK Proof Generation Utilities for Citizen Ledger
 *
 * Uses snarkjs for client-side Groth16 proof generation.
 * All private identity data stays in the user's browser.
 */

import type { Groth16Proof, PublicSignals } from "snarkjs";

// Lazy load snarkjs (it's large)
let snarkjs: typeof import("snarkjs") | null = null;
let circomlibjs: typeof import("circomlibjs") | null = null;

async function loadSnarkjs() {
  if (!snarkjs) {
    snarkjs = await import("snarkjs");
  }
  return snarkjs;
}

async function loadCircomlib() {
  if (!circomlibjs) {
    circomlibjs = await import("circomlibjs");
  }
  return circomlibjs;
}

// ════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════

export interface IdentityInputs {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  idNumber: string;
  nationality?: string;
}

export interface CitizenshipProofInputs extends IdentityInputs {
  salt: bigint;
}

export interface ZkProofResult {
  proof_data: string;
  public_inputs: string[];
  vk_reference: string;
}

export interface CommitmentResult {
  commitment: string;
  salt: string;
}

// ════════════════════════════════════════════════════════════════════════════
// Poseidon Hashing (circuit-compatible)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Hash a string using Poseidon (same as in the Circom circuits)
 */
export async function poseidonHash(inputs: bigint[]): Promise<bigint> {
  const lib = await loadCircomlib();
  const poseidon = await lib.buildPoseidon();
  const hash = poseidon(inputs);
  return poseidon.F.toObject(hash);
}

/**
 * Convert a string to a field element for Poseidon
 * Uses a chunked approach to avoid overflow
 */
export function stringToFieldElement(str: string): bigint {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let result = BigInt(0);
  for (let i = 0; i < Math.min(bytes.length, 31); i++) {
    result = result * BigInt(256) + BigInt(bytes[i]);
  }
  return result;
}

/**
 * Hash a string using Poseidon
 */
export async function hashString(str: string): Promise<bigint> {
  const field = stringToFieldElement(str.toLowerCase().trim());
  return poseidonHash([field]);
}

// ════════════════════════════════════════════════════════════════════════════
// Commitment Generation (called by trusted issuer during verification)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Generate a commitment from identity data.
 * This is called by the issuer after verifying the user's identity off-chain.
 * The commitment is stored on-chain; the inputs stay off-chain.
 */
export async function generateCommitment(
  inputs: IdentityInputs
): Promise<CommitmentResult> {
  // Generate a random salt
  const saltArray = new Uint8Array(32);
  crypto.getRandomValues(saltArray);
  const salt = BigInt(
    "0x" + Array.from(saltArray, (b) => b.toString(16).padStart(2, "0")).join("")
  );

  // Hash identity fields
  const firstNameHash = await hashString(inputs.firstName);
  const lastNameHash = await hashString(inputs.lastName);
  const dobTimestamp = BigInt(Math.floor(inputs.dateOfBirth.getTime() / 1000));
  const idNumberHash = await hashString(inputs.idNumber);

  // Compute commitment: Poseidon(firstNameHash, lastNameHash, dob, idHash, salt)
  const commitment = await poseidonHash([
    firstNameHash,
    lastNameHash,
    dobTimestamp,
    idNumberHash,
    salt,
  ]);

  return {
    commitment: commitment.toString(),
    salt: salt.toString(),
  };
}

// ════════════════════════════════════════════════════════════════════════════
// Proof Generation (called by citizen in browser)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Generate a ZK proof of citizenship.
 * All computation happens client-side - private data never leaves the browser.
 *
 * @param inputs - The citizen's private identity data
 * @param commitment - The public commitment stored on-chain
 * @param minAgeYears - Minimum age requirement (default: 18)
 */
export async function generateCitizenshipProof(
  inputs: CitizenshipProofInputs,
  commitment: string,
  minAgeYears: number = 18
): Promise<ZkProofResult> {
  const snarks = await loadSnarkjs();

  // Prepare private inputs
  const firstNameHash = await hashString(inputs.firstName);
  const lastNameHash = await hashString(inputs.lastName);
  const dobTimestamp = BigInt(Math.floor(inputs.dateOfBirth.getTime() / 1000));
  const idNumberHash = await hashString(inputs.idNumber);

  // Prepare public inputs
  const currentTime = BigInt(Math.floor(Date.now() / 1000));
  const minAgeSeconds = BigInt(minAgeYears * 365 * 24 * 60 * 60);

  const circuitInputs = {
    // Private
    firstNameHash: firstNameHash.toString(),
    lastNameHash: lastNameHash.toString(),
    dateOfBirth: dobTimestamp.toString(),
    idNumberHash: idNumberHash.toString(),
    salt: inputs.salt.toString(),
    // Public
    commitment: commitment,
    currentTime: currentTime.toString(),
    minAgeSeconds: minAgeSeconds.toString(),
  };

  // Generate the proof
  // In production, these files would be served from a CDN
  const { proof, publicSignals } = await snarks.groth16.fullProve(
    circuitInputs,
    "/circuits/citizenship.wasm",
    "/circuits/citizenship_final.zkey"
  );

  return formatProof(proof, publicSignals, "citizenship_v1");
}

/**
 * Generate a nullifier proof (for Sybil resistance).
 * The nullifier is deterministic for a given identity but unlinkable.
 */
export async function generateNullifierProof(
  inputs: IdentityInputs,
  secretKey: bigint,
  commitment: string,
  domain: string = "citizen-ledger"
): Promise<{ proof: ZkProofResult; nullifier: string }> {
  const snarks = await loadSnarkjs();

  const firstNameHash = await hashString(inputs.firstName);
  const lastNameHash = await hashString(inputs.lastName);
  const dobTimestamp = BigInt(Math.floor(inputs.dateOfBirth.getTime() / 1000));
  const idNumberHash = await hashString(inputs.idNumber);
  const nationalityHash = await hashString(inputs.nationality || "UNKNOWN");
  const domainHash = stringToFieldElement(domain);

  const circuitInputs = {
    // Private
    firstNameHash: firstNameHash.toString(),
    lastNameHash: lastNameHash.toString(),
    dateOfBirth: dobTimestamp.toString(),
    idNumberHash: idNumberHash.toString(),
    nationalityHash: nationalityHash.toString(),
    secretKey: secretKey.toString(),
    // Public
    expectedCommitment: commitment,
    domain: domainHash.toString(),
  };

  const { proof, publicSignals } = await snarks.groth16.fullProve(
    circuitInputs,
    "/circuits/nullifier.wasm",
    "/circuits/nullifier_final.zkey"
  );

  return {
    proof: formatProof(proof, publicSignals, "nullifier_v1"),
    nullifier: publicSignals[0], // First output is the nullifier
  };
}

// ════════════════════════════════════════════════════════════════════════════
// Proof Verification (can be done client-side or on-chain)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Verify a Groth16 proof locally (for testing/validation before submission)
 */
export async function verifyProof(
  proof: ZkProofResult,
  vkeyPath: string
): Promise<boolean> {
  const snarks = await loadSnarkjs();

  const vkey = await fetch(vkeyPath).then((r) => r.json());
  const proofData = JSON.parse(proof.proof_data);

  return snarks.groth16.verify(vkey, proof.public_inputs, proofData);
}

// ════════════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════════════

function formatProof(
  proof: Groth16Proof,
  publicSignals: PublicSignals,
  vkReference: string
): ZkProofResult {
  return {
    proof_data: JSON.stringify(proof),
    public_inputs: publicSignals.map(String),
    vk_reference: vkReference,
  };
}

/**
 * Derive a secret key from a wallet signature.
 * This creates a deterministic secret that only the wallet owner can produce.
 */
export async function deriveSecretKey(
  signMessage: (msg: string) => Promise<string>
): Promise<bigint> {
  const message =
    "Sign this message to generate your Citizen Ledger identity key.\n\nThis signature is used locally and never sent to any server.";

  const signature = await signMessage(message);

  // Hash the signature to get a field element
  const encoder = new TextEncoder();
  const data = encoder.encode(signature);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);

  // Convert to bigint (take first 31 bytes to stay in field)
  let result = BigInt(0);
  for (let i = 0; i < 31; i++) {
    result = result * BigInt(256) + BigInt(hashArray[i]);
  }

  return result;
}

/**
 * Check if the browser supports the required crypto APIs
 */
export function isZkSupported(): boolean {
  return (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function" &&
    typeof crypto.subtle !== "undefined" &&
    typeof BigInt !== "undefined"
  );
}
