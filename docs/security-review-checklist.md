# Citizen Ledger — Security Review Checklist

A comprehensive pre-mainnet security review covering smart contracts,
infrastructure, and operational practices.

---

## 1. Smart Contract Security

### 1.1 Access Control
- [ ] **Admin-only functions** — Verify every execute handler checks `info.sender == admin` or appropriate authority
  - `credential-registry`: IssueCredential, RevokeCredential, AddIssuer, RemoveIssuer, TransferAdmin, SubmitVerificationResult
  - `treasury`: Spend, UpdateAllocations
  - `voting`: UpdateConfig, ExecuteProposal (governance-gated)
  - `grants`: ApproveGrant, AddReviewer, RemoveReviewer
  - `staking-emissions`: Slash, UpdateEmissionConfig, UpdateSlashPenalty
- [ ] **Multi-sig requirement** — Admin keys should be multi-sig (3-of-5 minimum) before mainnet
- [ ] **Governance-gated execution** — Treasury spends and parameter changes require passed proposal
- [ ] **Reviewer authorization** — Grants milestone approval checks `REVIEWERS` map
- [ ] **Relayer authorization** — Verification results only from `AUTHORIZED_RELAYERS`

### 1.2 Integer Overflow / Underflow
- [ ] **Overflow checks enabled** — `overflow-checks = true` in Cargo profile
- [ ] **BPS calculations** — All basis-point math uses checked arithmetic (multiply then divide by 10000)
- [ ] **Token amounts** — Use `Uint128::checked_sub`, `checked_add`, `checked_mul` for all token math
- [ ] **Counter increments** — PROPOSAL_COUNT, GRANT_COUNT, CREDENTIAL_COUNT use checked_add

### 1.3 Reentrancy
- [ ] **State-before-external-calls** — All state mutations happen before `SubMsg` / bank sends
- [ ] **No callback loops** — Reply handlers don't re-enter execute paths
- [ ] **Treasury spend** — Balance deducted before `BankMsg::Send`

### 1.4 Input Validation
- [ ] **Address validation** — All addresses validated via `deps.api.addr_validate()`
- [ ] **Non-zero amounts** — Token operations reject zero-amount transfers/stakes
- [ ] **String length limits** — Title/description fields bounded (e.g., max 256/1024 chars)
- [ ] **BPS range** — Allocation BPS values ≤ 10000, sum = 10000
- [ ] **Credential types** — Validated against known `CredentialType` enum

### 1.5 State Consistency
- [ ] **Atomic milestone approval** — Grant status transitions are single-step
- [ ] **Recovery migration** — Key recovery moves ALL credentials from old→new atomically
- [ ] **Voting double-vote prevention** — `VOTES` map keyed by (proposal_id, voter) prevents duplicates
- [ ] **Credential dedup** — Same credential type can't be issued twice to same holder
- [ ] **Slash can't exceed stake** — Penalty capped at staker's actual balance

### 1.6 Timelock Security
- [ ] **Governance timelock** — Proposals in `Timelocked` state cannot execute until `block.height >= execute_at`
- [ ] **Recovery timelock** — 10080 blocks (~7 days) window for contestation
- [ ] **No timelock bypass** — Admin cannot skip timelock (only governance path)

### 1.7 Migration Safety
- [ ] **Contract versioning** — `cw2::set_contract_version` called in all instantiate handlers
- [ ] **Migrate handler** — Not yet implemented → must add before mainnet migration
- [ ] **State schema compatibility** — Plan forward-compatible state structures

---

## 2. Cryptographic Security

### 2.1 ZK Credentials
- [ ] **Proof verification** — ZK proofs verified on-chain (currently placeholder — needs real verifier)
- [ ] **Nullifier tracking** — Prevent proof replay / double-use
- [ ] **Trusted setup** — If using Groth16, ceremony must be publicly verifiable
- [ ] **Circuit audit** — ZK circuit logic independently reviewed

### 2.2 Key Management
- [ ] **Admin key rotation** — TransferAdmin allows key rotation
- [ ] **Key recovery contest window** — 7-day timelock allows old owner to contest
- [ ] **Mnemonic storage** — Keeper bot mnemonic stored securely (vault/HSM, not plaintext)
- [ ] **No private keys in code** — Grep codebase for mnemonic/seed/private patterns

---

## 3. Economic Security

### 3.1 Token Economics
- [ ] **Max supply cap** — 1T ucitizen hard-coded, emission cannot exceed
- [ ] **Emission curve** — 4-phase decay verified: 1000→500→250→125 per block
- [ ] **Treasury share** — 20% of emissions always routes to treasury contract
- [ ] **Slash bounds** — Slash penalty BPS ≤ 10000 (100%), default 10%
- [ ] **No inflation bug** — `distribute_rewards` cannot mint beyond max supply

### 3.2 Governance Attacks
- [ ] **Quorum requirement** — Minimum participation threshold (default 3333 BPS = 33.3%)
- [ ] **Threshold requirement** — Minimum yes-vote ratio (default 5000 BPS = 50%)
- [ ] **One-person-one-vote** — Credential-gated voting prevents Sybil
- [ ] **Timelock window** — Community can organize opposition during timelock
- [ ] **Flash-loan resistance** — 1P1V mode immune to token-weight manipulation

### 3.3 Grant Safety
- [ ] **Milestone-based release** — Funds only released per-milestone, not lump-sum
- [ ] **Reviewer accountability** — `approved_by` field creates audit trail
- [ ] **Treasury balance check** — Grant approval verifies treasury has sufficient funds

---

## 4. Infrastructure Security

### 4.1 Node Security
- [ ] **Firewall rules** — Only ports 26656 (P2P), 26657 (RPC), 1317 (LCD) exposed
- [ ] **RPC authentication** — Public RPC rate-limited; admin RPC behind firewall
- [ ] **TLS termination** — All public endpoints behind TLS reverse proxy
- [ ] **SSH hardening** — Key-only auth, no root login, fail2ban enabled
- [ ] **Sentry nodes** — Validators fronted by sentry architecture

### 4.2 Monitoring & Alerting
- [ ] **Prometheus metrics** — Node exporter + Tendermint metrics scraped
- [ ] **Block stall alert** — Fires if no new block in 5 minutes
- [ ] **Jail detection** — Alert when validator power drops to 0
- [ ] **Disk space alert** — < 10% triggers critical alert
- [ ] **Keeper health** — /health endpoint monitored

### 4.3 Backup & Recovery
- [ ] **State snapshots** — Daily `unsafe-reset-all`-safe snapshots
- [ ] **Key backup** — Validator keys backed up in offline/encrypted storage
- [ ] **Recovery runbook** — Documented steps to restore from snapshot
- [ ] **Tested restore** — Restore procedure tested on testnet

---

## 5. Frontend Security

### 5.1 Web Application
- [ ] **XSS prevention** — React auto-escapes; no `dangerouslySetInnerHTML`
- [ ] **CSP headers** — Content Security Policy configured in Next.js
- [ ] **CORS** — API endpoints restrict origins
- [ ] **Dependency audit** — `npm audit` shows zero critical vulnerabilities
- [ ] **No secrets in client** — No private keys or mnemonics in frontend bundle
- [ ] **Contract address validation** — Frontend validates addresses before submission

### 5.2 Wallet Integration
- [ ] **Keplr chain suggest** — Correct chain parameters in CHAIN_CONFIG
- [ ] **Transaction confirmation** — Users see tx details before signing
- [ ] **Error handling** — Wallet disconnection / rejection handled gracefully

---

## 6. CI/CD Security

- [ ] **Dependency pinning** — All Cargo.toml and package.json versions pinned
- [ ] **Supply chain** — `cargo audit` shows zero known vulnerabilities
- [ ] **Reproducible builds** — Wasm optimizer produces deterministic checksums
- [ ] **Code review** — All PRs require 2 approvals before merge
- [ ] **Branch protection** — Main branch requires CI pass + reviews

---

## 7. Pre-Mainnet Sign-Off

| Category               | Reviewer        | Date | Status |
|------------------------|----------------|------|--------|
| Smart Contract Audit   | External Firm  |      | ⬜     |
| ZK Circuit Audit       | External Firm  |      | ⬜     |
| Economic Model Review  | Tokenomics Rev |      | ⬜     |
| Infrastructure Review  | DevOps Lead    |      | ⬜     |
| Frontend Pentest       | Security Team  |      | ⬜     |
| Public Bug Bounty      | Community      |      | ⬜     |

---

*Last updated: $(date)*
*Citizen Ledger Security Team*
