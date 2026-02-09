# Citizen Ledger — V2 Roadmap

> Building on Year 1 foundations: metrics-driven expansion of citizen-led governance infrastructure.

---

## Preamble

This roadmap is a **living document** to be refined based on:
- On-chain governance metrics from Year 1 operations
- Community feedback gathered via quarterly surveys
- Audit findings from the Governance Audit Framework
- Technical lessons from mainnet operations

All items require governance approval before implementation.

---

## V2 Themes

| Theme | Description |
|-------|-------------|
| **Scale** | Support 10× growth in citizens, validators, and transactions |
| **Interoperability** | Connect Citizen Ledger to broader Cosmos ecosystem and beyond |
| **Privacy 2.0** | Advanced ZK credential proofs with selective disclosure |
| **Real-World Impact** | Expand infrastructure pilot to multiple communities |
| **Autonomous Governance** | Reduce manual overhead with smart governance automation |

---

## Phase 1 — Foundation Hardening (Months 1-3)

### 1.1  Performance Optimization

| Task | Description | Priority |
|------|-------------|----------|
| Block time optimization | Target 3s blocks (from 6s) via consensus tuning | High |
| Contract gas optimization | Re-audit and optimize all 5 contracts for gas efficiency | High |
| State pruning | Implement archive-vs-pruned node configuration | Medium |
| Query indexer v2 | Migrate indexer to event-streaming architecture (Kafka/NATS) | Medium |

### 1.2  Security Hardening

| Task | Description | Priority |
|------|-------------|----------|
| Formal verification | Formally verify critical contract paths (credential, treasury) | High |
| Bug bounty program | Launch public bug bounty (10 000 – 500 000 CITIZEN) | High |
| Penetration testing | Annual external pentest of node infrastructure | Medium |
| Incident response playbook | Detailed runbook for security incidents | Medium |

### 1.3  Developer Experience

| Task | Description | Priority |
|------|-------------|----------|
| SDK release | Publish `@citizen-ledger/sdk` npm package | High |
| API documentation | OpenAPI spec for all RPC and LCD endpoints | High |
| Developer portal | docs.citizenledger.org with guides + tutorials | Medium |
| Testnet faucet | Web-based faucet for public testnet | Medium |

---

## Phase 2 — Interoperability (Months 3-6)

### 2.1  IBC Integration

| Task | Description | Priority |
|------|-------------|----------|
| IBC relayer setup | Hermes relayers to Cosmos Hub, Osmosis, Juno | High |
| IBC transfer support | Enable CITIZEN token transfers via IBC | High |
| Cross-chain identity | Verify Citizen credentials on partner chains via IBC queries | Medium |
| IBC governance | Allow cross-chain governance participation | Low |

### 2.2  Bridge Infrastructure

| Task | Description | Priority |
|------|-------------|----------|
| EVM bridge | Bridge CITIZEN ↔ Ethereum/Polygon via Axelar or Gravity | Medium |
| Wrapped CITIZEN (wCITIZEN) | ERC-20 representation for DeFi participation | Medium |
| Bridge monitoring | Real-time bridge health dashboard | Medium |

### 2.3  Ecosystem Partnerships

| Task | Description | Priority |
|------|-------------|----------|
| DEX listing | CITIZEN on Osmosis + Astroport | High |
| Oracle integration | Chainlink/Band price feeds for CITIZEN | Medium |
| Wallet integrations | Keplr, Leap, Cosmostation native support | High |
| Block explorer | Mintscan / Ping.pub integration | High |

---

## Phase 3 — Privacy 2.0 (Months 6-9)

### 3.1  Advanced ZK Credentials

| Task | Description | Priority |
|------|-------------|----------|
| Selective disclosure | Prove attributes without revealing full credential | High |
| ZK age proofs | Prove "over 18" without revealing birth date | High |
| ZK residency proofs | Prove "lives in Region X" without revealing address | High |
| Credential composition | Combine multiple credentials into composite proof | Medium |

### 3.2  Privacy-Preserving Governance

| Task | Description | Priority |
|------|-------------|----------|
| Anonymous voting | ZK-SNARK based anonymous vote casting | High |
| Encrypted proposals | Proposals visible only to verified citizens until voting starts | Medium |
| Private delegation | Delegate stake without revealing delegator identity | Low |

### 3.3  Data Sovereignty

| Task | Description | Priority |
|------|-------------|----------|
| Personal data vault | Encrypted off-chain storage with on-chain access control | Medium |
| Right to erasure | Mechanism to delete personal data while preserving chain integrity | Medium |
| Data export | Citizens can export all their data in standard format | Low |

---

## Phase 4 — Real-World Expansion (Months 9-12)

### 4.1  Infrastructure Scaling

| Task | Description | Priority |
|------|-------------|----------|
| Warehouse expansion | 3 → 10 community warehouses across regions | High |
| Community center v2 | Templates + lessons learned from pilot for new sites | High |
| Shared services platform | Centralized procurement for warehouse equipment | Medium |
| Sustainability plan | Transition warehouses to self-funding via service fees | Medium |

### 4.2  Citizen Services

| Task | Description | Priority |
|------|-------------|----------|
| Digital identity card | Mobile app with NFC-based citizen credential | High |
| Community marketplace | P2P marketplace exclusive to verified citizens | Medium |
| Micro-lending pools | Community-governed lending using credentials as trust anchor | Medium |
| Skill certification | On-chain skill credentials with employer verification | Low |

### 4.3  Governance Scaling

| Task | Description | Priority |
|------|-------------|----------|
| Sub-DAOs | Regional governance bodies with delegated authority | High |
| Quadratic voting | Implement quadratic voting for specific proposal categories | Medium |
| Futarchy experiments | Prediction markets to inform governance decisions | Low |
| Constitution v2 | Ratify updated governance constitution based on Year 1 lessons | High |

---

## Phase 5 — Autonomous Governance (Months 12-18)

### 5.1  Smart Governance

| Task | Description | Priority |
|------|-------------|----------|
| Auto-parameter tuning | ML-based parameter suggestions from on-chain metrics | Medium |
| Proposal templates v2 | Pre-approved template proposals with auto-execution | High |
| Budget automation | Automatic quarterly budget allocation based on KPIs | Medium |
| Dispute resolution DAO | Automated dispute arbitration with human fallback | Medium |

### 5.2  Network Effects

| Task | Description | Priority |
|------|-------------|----------|
| Federation protocol | Allow independent Citizen Ledger instances to federate | Low |
| Cross-community governance | Joint governance between federated communities | Low |
| Reputation system | Non-transferable reputation scores from governance participation | Medium |
| Governance mining | Earn credentials by sustained governance participation | Medium |

### 5.3  Sustainability

| Task | Description | Priority |
|------|-------------|----------|
| Revenue model | Transaction fees, service fees, partnership revenue | High |
| Endowment fund | Long-term treasury reserve with yield strategy | Medium |
| Carbon neutrality | Offset validator energy costs via renewable credits | Low |
| Annual impact report | Publish measurable community impact metrics | High |

---

## Success Metrics for V2

| Metric | Year 1 Baseline | V2 Target (18 months) |
|--------|----------------:|----------------------:|
| Verified citizens | 1 000 | 50 000 |
| Active validators | 100 | 200 |
| Countries represented | 30 | 60 |
| Governance proposals/quarter | 20 | 100 |
| Governance participation rate | 15 % | 35 % |
| Treasury AUM (CITIZEN) | 100M | 500M |
| Active grants | 20 | 100 |
| Infrastructure sites | 2 | 12 |
| IBC connections | 0 | 10+ |
| Monthly active users | 500 | 25 000 |
| Developer ecosystem | 5 repos | 50+ repos |
| Uptime | 99.5 % | 99.9 % |

---

## Governance Process for V2

### Approval

Each V2 phase requires a governance proposal to proceed:

```json
{
  "title": "V2 Phase [N] Activation: [THEME]",
  "description": "Activate V2 Phase [N] covering [scope]...",
  "category": "roadmap",
  "phase": 1,
  "estimated_budget": "X CITIZEN",
  "duration": "3 months",
  "deliverables": ["..."],
  "success_criteria": ["..."],
  "rollback_plan": "..."
}
```

### Feedback Channels

| Channel | Purpose |
|---------|---------|
| On-chain proposals | Formal governance decisions |
| Community forum | Discussion, debate, temperature checks |
| Quarterly town halls | Live Q&A + roadmap review |
| Annual governance summit | In-person/virtual event for V2 direction |
| Feedback smart contract | Anonymous on-chain feedback submission |

### Roadmap Updates

- This roadmap is updated quarterly based on governance votes
- Any citizen can propose roadmap additions via standard proposal
- Prioritization is determined by community vote
- Each update is versioned and stored on IPFS

---

## Appendix: V1 → V2 Migration Checklist

| Item | Requirement |
|------|-------------|
| All V1 steps (1-50) complete | ✅ Required |
| Mainnet stable for ≥ 3 months | ✅ Required |
| ≥ 1 quarterly audit completed | ✅ Required |
| Community vote approving V2 | ✅ Required |
| V2 budget approved | ✅ Required |
| External security audit for V2 changes | ✅ Required |
| Testnet validation of V2 features | ✅ Required |
| Documentation updated | ✅ Required |

---

*Last updated: V2 template — pending community input and Year 1 metrics.*
*Citizen Ledger — Built by citizens, for citizens.*
