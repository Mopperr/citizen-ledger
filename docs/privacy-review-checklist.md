# Citizen Ledger — Privacy Review Checklist

A comprehensive review of privacy protections for citizen data,
credential management, and on-chain identity.

---

## 1. Zero-Knowledge Credential Privacy

### 1.1 Credential Data Minimization
- [ ] **No PII on-chain** — Personal information (name, DOB, address, ID numbers) NEVER stored in contract state
- [ ] **Credential = proof, not data** — On-chain credential contains only: holder address, type, issuer, issuance time, expiry, ZK proof hash
- [ ] **Proof reveals nothing** — ZK proof attests to a fact (e.g., "over 18") without revealing underlying data
- [ ] **No biometric data on-chain** — Biometric verification happens off-chain; only attestation stored
- [ ] **Credential metadata** — Review that no metadata leaks identity (e.g., sequential IDs don't reveal issuance order to external observers)

### 1.2 ZK Proof Properties
- [ ] **Zero-knowledge** — Verifier learns nothing beyond the statement's truth
- [ ] **Soundness** — Cannot forge a valid proof without valid witness data
- [ ] **Non-transferability** — Proofs bound to specific holder address
- [ ] **Unlinkability** — Multiple proofs from same person cannot be correlated (if using nullifier scheme)
- [ ] **Selective disclosure** — Citizens can prove specific attributes without revealing others

### 1.3 Verification Privacy
- [ ] **Off-chain verification** — Identity verification (Gov ID, biometric) happens off-chain with trusted verifier
- [ ] **Verifier segregation** — Verification service cannot link on-chain addresses to real-world identity
- [ ] **Attestation only** — On-chain `SubmitVerificationResult` receives pass/fail + ZK proof, not raw data
- [ ] **Verifier data retention** — Off-chain verifier deletes PII after issuing attestation (policy required)
- [ ] **Multiple verifiers** — Support for multiple independent verification providers to prevent single point of trust

---

## 2. Transaction Privacy

### 2.1 On-Chain Activity
- [ ] **Address pseudonymity** — Addresses are pseudonymous but linked to credential type → review linkability risk
- [ ] **Voting privacy** — Votes are recorded on-chain (transparent) — document this to citizens
  - Future: Consider commit-reveal scheme for vote privacy
- [ ] **Treasury transparency vs. privacy** — Treasury flows are intentionally public (transparency feature)
- [ ] **Grant applicant exposure** — Grant applications reveal applicant address → acceptable for accountability
- [ ] **Staking is public** — Staker addresses and amounts are visible → acceptable for network security

### 2.2 Key Recovery Privacy
- [ ] **Recovery request public** — Old address + new address published on-chain during recovery
- [ ] **Credential migration visible** — All credentials moved from old→new address; observers can link old↔new identity
- [ ] **Contestation public** — Contest action reveals old address is still active
- [ ] **Mitigation documented** — Users informed that key recovery will link their old and new addresses

### 2.3 Indexer Privacy
- [ ] **Indexed data = on-chain data** — Indexer only stores what's already public on-chain
- [ ] **No IP logging** — Indexer does not log user IP addresses when serving queries
- [ ] **Query privacy** — Consider rate-limiting or anonymizing query patterns
- [ ] **Retention policy** — Define how long indexed data is retained

---

## 3. Identity Governance

### 3.1 Right to Erasure
- [ ] **Credential revocation** — Users can request credential revocation (removes validity, hash remains on-chain)
- [ ] **Blockchain immutability** — Document that transaction history cannot be erased from chain
- [ ] **Data minimization** — Only store the minimum necessary credential metadata
- [ ] **State pruning** — Expired/revoked credentials can be pruned from state after retention period

### 3.2 Consent
- [ ] **Informed consent** — Users understand what data is stored on-chain before verification
- [ ] **Consent for verification** — Explicit consent before submitting to off-chain verification service
- [ ] **Terms of Service** — Clear privacy policy describing data handling practices
- [ ] **Opt-out** — Users can choose not to get credentials (cannot participate in 1P1V governance)

### 3.3 Access Control
- [ ] **Own credentials only** — Users can query only their own full credential details
- [ ] **Public verification** — Anyone can verify a holder has a valid credential (boolean only)
- [ ] **Issuer limitations** — Issuers can issue/revoke but cannot enumerate all holders
- [ ] **Admin limitations** — Admin can manage issuers but cannot access individual credential data

---

## 4. Network-Level Privacy

### 4.1 P2P Network
- [ ] **Transaction origin** — P2P gossip can leak tx originator IP → recommend Tor/VPN for sensitive users
- [ ] **Sentry node architecture** — Validators hidden behind sentry nodes (IP not exposed)
- [ ] **Peer privacy** — Address book not publicly enumerable

### 4.2 RPC / API Endpoints
- [ ] **No session tracking** — Public RPC endpoints don't set cookies or track sessions
- [ ] **HTTPS only** — All public API endpoints served over TLS
- [ ] **Access logs** — RPC access logs don't correlate IP→address (or are short-lived)
- [ ] **Rate limiting** — Prevents address enumeration attacks

---

## 5. Frontend Privacy

### 5.1 Client-Side
- [ ] **No analytics** — No Google Analytics, Mixpanel, or similar tracking on the dApp
- [ ] **No external fonts/CDN** — Serve all assets locally to prevent IP leaking to CDNs
- [ ] **LocalStorage audit** — Review what the frontend stores in localStorage/sessionStorage
- [ ] **Wallet address** — Only stored in-memory via Zustand store, not persisted
- [ ] **No social login** — Authentication is wallet-only, no social/OAuth tracking

### 5.2 Third-Party Dependencies
- [ ] **Keplr privacy** — Wallet extension may have its own telemetry → document
- [ ] **CosmJS** — Client-side only, no external calls beyond RPC endpoint
- [ ] **npm dependencies** — Audit for packages that phone home or collect telemetry

---

## 6. Compliance Considerations

### 6.1 Regulatory Alignment
- [ ] **GDPR considerations** — If serving EU users:
  - Right to access: Users can query their own credential data ✓
  - Right to rectification: Credentials can be re-issued after revocation ✓
  - Right to erasure: Limited by blockchain immutability — document
  - Data portability: Credential data queryable via standard APIs ✓
  - Privacy by design: ZK credentials are privacy-by-design ✓
- [ ] **No KYC data on-chain** — KYC/AML handled off-chain by verification providers
- [ ] **Jurisdiction** — Determine applicable privacy regulations

### 6.2 Data Controller Responsibilities
- [ ] **Off-chain verifier = data controller** — For PII collected during verification
- [ ] **On-chain = public** — No data controller for public blockchain data
- [ ] **DPA with verifiers** — Data Processing Agreement with verification service providers

---

## 7. Privacy Threat Model

| Threat                                | Mitigation                                       | Status |
|---------------------------------------|--------------------------------------------------|--------|
| On-chain address → real identity      | ZK credentials; no PII on-chain                  | ⬜     |
| Credential linkability                | Unique ZK proof per verification                 | ⬜     |
| Vote surveillance                     | Future: commit-reveal voting                     | ⬜     |
| Transaction graph analysis            | Pseudonymous addresses; no mandatory linking      | ⬜     |
| IP address correlation (P2P)          | Recommend Tor/VPN; sentry node architecture      | ⬜     |
| Key recovery de-anonymization         | Documented trade-off; user accepts linkage        | ⬜     |
| Off-chain verifier data breach        | Minimal data collection; immediate deletion       | ⬜     |
| Indexer surveillance                  | Public data only; no IP logging; query anonymity  | ⬜     |
| Frontend fingerprinting               | No tracking; local assets; minimal storage        | ⬜     |
| Governance proposal de-anonymization  | Proposer address public by design (accountability)| ⬜     |

---

## 8. Privacy Sign-Off

| Category                  | Reviewer        | Date | Status |
|---------------------------|----------------|------|--------|
| ZK Credential Privacy     | Crypto Team    |      | ⬜     |
| On-Chain Data Review       | Smart Contract |      | ⬜     |
| Infrastructure Privacy    | DevOps         |      | ⬜     |
| Frontend Privacy Audit    | Security Team  |      | ⬜     |
| Regulatory Compliance     | Legal/Privacy  |      | ⬜     |
| Privacy Impact Assessment | External       |      | ⬜     |

---

*Last updated: Initial draft*
*Citizen Ledger Privacy Team*
