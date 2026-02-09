# Sybil Resistance Design

**Document Status:** Design Specification  
**Last Updated:** 2026-02-09

## Overview

Citizen Ledger's governance model uses **one-person-one-vote (1P1V)** instead of token-weighted voting. This creates a fundamental challenge: preventing one person from creating multiple wallets to gain disproportionate voting power (a **Sybil attack**).

This document outlines our multi-layered approach to Sybil resistance.

## The Core Problem

In traditional blockchain governance:
- Voting power = tokens held
- Attack cost = token acquisition cost (expensive)

In 1P1V governance:
- Voting power = 1 per person
- Attack cost = creating new wallets (nearly free)

Without identity verification, a single actor could create thousands of wallets and dominate every vote.

## Defense Layers

### Layer 1: Privacy-Preserving Identity Credentials

The **Credential Registry** contract stores cryptographic commitments that prove a user has been verified as a unique human, without storing any personal data on-chain.

```
┌─────────────────────────────────────────────────────────────┐
│                    IDENTITY FLOW                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User's Browser          Trusted Issuer         On-Chain    │
│  ─────────────────       ──────────────         ─────────   │
│                                                             │
│  1. User enters          2. Issuer verifies     4. Store    │
│     identity data           (video call,           only      │
│     locally                 gov ID scan)           commitment│
│           │                     │                     ▲      │
│           ▼                     │                     │      │
│  3. Generate ZK              ───┘                     │      │
│     commitment ──────────────────────────────────────┘      │
│     (hash of data + salt)                                   │
│                                                             │
│  ✓ Private data NEVER leaves browser                        │
│  ✓ Only commitment stored on-chain                          │
│  ✓ User can generate proofs later                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Layer 2: Nullifier-Based Double-Registration Prevention

When a user registers, their identity generates a **nullifier** — a deterministic hash that's unique to their identity but reveals nothing about it.

```typescript
nullifier = Poseidon(identityCommitment, secretKey, domain)
```

**Properties:**
- Same person → same nullifier (cannot register twice)
- Different people → different nullifiers (no collisions)
- Nullifier reveals nothing about identity (unlinkable)

The contract maintains a nullifier set. If someone tries to register with an identity that's already been used (even with a different wallet), the same nullifier would be generated and rejected.

### Layer 3: Trusted Issuer Network

Credentials are only issued by **trusted issuers** — entities that have been vetted and added to the Credential Registry's issuer whitelist.

**Issuer Types (Progressive Decentralization):**

| Phase | Issuer Type | Verification Method |
|-------|-------------|---------------------|
| 1. Bootstrap | Core team | Manual video call + ID check |
| 2. Early Growth | Partner organizations | Delegated KYC with audit trail |
| 3. Mature | DAOs / Nation-states | Federated verification protocols |
| 4. Full Decentralization | Web-of-trust | Vouching + reputation stakes |

**Issuer Responsibilities:**
- Verify identity documents (passport, national ID)
- Conduct liveness checks (video call, biometric)
- Ensure geographic/jurisdictional compliance
- Maintain audit logs (off-chain, privacy-preserving)

**Issuer Accountability:**
- Issuers stake tokens as collateral
- Fraudulent issuance → slashing + removal
- Community governance can add/remove issuers

### Layer 4: Credential Typing & Jurisdictional Binding

Different credential types serve different purposes:

| Credential Type | Use Case | Verification Strength |
|-----------------|----------|----------------------|
| `Citizenship` | Voting, proposals | High (full KYC) |
| `Residency` | Local governance | Medium (proof of address) |
| `AgeOver18` | Age-restricted proposals | Low (DOB check only) |
| `HealthcareEligibility` | Health-related grants | High (medical records) |

Jurisdictional binding prevents "citizenship shopping":
- Each nationality can have its own issuer network
- Cross-border voting requires explicit treaties
- Local governance restricted to residents

### Layer 5: Economic Deterrents

Even with perfect identity verification, we add economic friction:

1. **Credential Fee**: Small fee to issue credentials (covers issuer costs)
2. **Staking Requirement**: Must stake minimum tokens to vote
3. **Slashing for Fraud**: Accounts caught with fraudulent credentials lose stake
4. **Reputation Decay**: Inactive credentials lose voting weight over time

### Layer 6: Behavioral Analysis (Future)

Post-launch monitoring for suspicious patterns:

- Voting from same IP/device across multiple accounts
- Statistically unlikely voting patterns (all accounts vote identically)
- Rapid credential requests from same issuer
- Machine-learning anomaly detection

Flagged accounts undergo additional verification or temporary suspension.

## Verification Flow (Citizen Perspective)

```
1. INITIATE VERIFICATION
   └── User visits Identity page
   └── Clicks "Get Verified"
   └── Enters identity data (stays in browser)

2. GENERATE COMMITMENT
   └── Browser computes Poseidon hash
   └── Salt generated locally
   └── Commitment displayed to user

3. ISSUER VERIFICATION (off-chain)
   └── User contacts trusted issuer
   └── Video call + document review
   └── Issuer confirms identity matches commitment

4. ON-CHAIN ISSUANCE
   └── Issuer calls IssueCredential(holder, commitment, nullifier)
   └── Contract verifies:
       - Issuer is authorized
       - Nullifier not already used
       - Commitment format valid
   └── Credential stored with minimal on-chain data

5. PROOF GENERATION (for voting)
   └── User's browser generates ZK proof
   └── Proof demonstrates:
       - Knowledge of commitment pre-image
       - Credential not expired/revoked
       - Age requirements met (if applicable)
   └── Voting contract verifies proof
```

## Attack Vectors & Mitigations

### Attack: Bribery of Issuer

**Vector:** Attacker bribes an issuer to issue credentials without verification.

**Mitigations:**
- Issuer stake slashing (economic penalty > bribe value)
- Multi-issuer requirement for high-stakes votes
- Issuer rotation / random audits
- Community whistleblower bounties

### Attack: Stolen Identity

**Vector:** Attacker obtains someone else's ID documents.

**Mitigations:**
- Liveness check (video call with ID in frame)
- Biometric binding (future: fingerprint, face scan)
- Recovery mechanism with re-verification
- Fraud reporting with credential revocation

### Attack: Fake Documents

**Vector:** Attacker creates forged identity documents.

**Mitigations:**
- Multi-source verification (cross-reference databases)
- Document authenticity checks (holograms, NFC chips)
- Jurisdiction-specific issuer expertise
- Partnership with identity verification services (Jumio, Onfido)

### Attack: Collusion Ring

**Vector:** Group of people share identities to create extra credentials.

**Mitigations:**
- Nullifier prevents same identity from registering twice
- Social graph analysis (future)
- Vouching limits (can only vouch for N people)
- Tiered governance (not all votes are equally weighted)

### Attack: Issuer Compromise

**Vector:** Issuer's signing keys are stolen.

**Mitigations:**
- Multi-sig issuer keys
- Hardware security modules (HSM)
- Key rotation schedules
- Emergency pause mechanism
- Per-credential revocation

## Comparison with Alternatives

| Approach | Sybil Resistance | Privacy | Decentralization | Our Choice |
|----------|------------------|---------|------------------|------------|
| KYC (centralized) | Strong | Poor | None | Rejected |
| Token-weighted voting | Economic | Good | Good | Partially used for grants |
| Social vouching | Weak-Medium | Good | Good | Supplement |
| Government ID + ZK | Strong | Good | Medium | **Primary** |
| Biometrics (WorldCoin) | Strong | Medium | Low | Future option |

## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Credential Registry contract | ✅ Complete | Supports issuance, revocation, key recovery |
| Nullifier circuit | ✅ Complete | Circom circuit in `/circuits` |
| Commitment generation (frontend) | ✅ Complete | snarkjs integration |
| Trusted issuer management | ✅ Complete | Admin can add/remove issuers |
| Issuer staking/slashing | 🔜 Planned | v2 roadmap |
| Multi-issuer requirements | 🔜 Planned | For high-stakes proposals |
| Behavioral analysis | 📋 Research | Post-mainnet |

## Future Improvements

1. **Decentralized Issuer DAO**: Transition issuer management to community governance
2. **Zero-Knowledge Proofs for Voting**: Hide which proposal a user voted for
3. **Cross-Chain Credentials**: Use IBC to verify credentials across Cosmos chains
4. **World ID Integration**: Optional WorldCoin integration for additional Sybil resistance
5. **Reputation System**: Long-term participation increases governance weight

## References

- [Semaphore Protocol](https://semaphore.appliedzkp.org/) — ZK group membership
- [WorldCoin](https://worldcoin.org/) — Iris-based uniqueness proofs
- [BrightID](https://brightid.org/) — Social graph uniqueness
- [Proof of Humanity](https://proofofhumanity.id/) — Video + vouching
- [Circom Documentation](https://docs.circom.io/) — ZK circuit compiler

## Appendix: Credential Registry API

```rust
// Issue a new credential (trusted issuer only)
pub enum ExecuteMsg {
    IssueCredential {
        holder: String,
        credential_type: CredentialType,
        commitment: String,
        expires_at: u64,
    },
    // ... other messages
}

// Query: Check if user has valid credential
pub enum QueryMsg {
    HasValidCredential {
        holder: String,
        credential_type: CredentialType,
    },
}
```

See [Credential Registry Contract](../contracts/credential-registry/) for full API documentation.
