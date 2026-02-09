# Citizen Ledger — Whitepaper v1.0

**Governance by the People. Funded by the People. Built for the People.**

*February 2026*

---

## Abstract

Citizen Ledger is a citizen-led blockchain network that verifies eligibility through privacy-preserving credentials, enables inclusive governance through identity-based voting, and funds public-benefit initiatives through a programmable on-chain treasury. The network is built on CosmWasm smart contracts atop Cosmos SDK, providing a transparent, milestone-based funding pipeline for research, healthcare infrastructure, and regional investment — all governed by verified citizens under one-person-one-vote rules.

This whitepaper details the architecture, governance mechanics, tokenomics, and long-term vision of the Citizen Ledger protocol.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Problem Statement](#2-problem-statement)
3. [Vision and Goals](#3-vision-and-goals)
4. [System Architecture](#4-system-architecture)
5. [Identity and Privacy](#5-identity-and-privacy)
6. [Governance Model](#6-governance-model)
7. [Community Treasury](#7-community-treasury)
8. [Grants and Public-Benefit Funding](#8-grants-and-public-benefit-funding)
9. [Staking and Emissions](#9-staking-and-emissions)
10. [Node Network](#10-node-network)
11. [Research Programs](#11-research-programs)
12. [Healthcare Infrastructure Program](#12-healthcare-infrastructure-program)
13. [How Citizens Invest & Grow Their Holdings](#13-how-citizens-invest--grow-their-holdings)
14. [Why Hold CITIZEN — Value Accrual](#14-why-hold-citizen--value-accrual)
15. [Tokenomics](#15-tokenomics)
16. [Transparency and Accountability](#16-transparency-and-accountability)
17. [Risk and Compliance](#17-risk-and-compliance)
18. [Roadmap](#18-roadmap)
19. [Technical Specifications](#19-technical-specifications)
20. [Glossary](#20-glossary)

---

## 1. Introduction

Public institutions around the world struggle with the same core problems: opaque funding, unverifiable identity, and governance systems that exclude the citizens they claim to serve. Citizen Ledger is designed from the ground up to address these failures.

The protocol creates an identity-gated blockchain where only verified citizens can participate in governance. Rather than token-weighted voting — which concentrates power among wealthy holders — Citizen Ledger uses one-person-one-vote for core decisions and quadratic voting for funding allocation. A programmable treasury automatically splits funding across categories chosen and managed by citizens themselves.

The result is a system where:
- **Identity is private.** Citizens prove eligibility without revealing personal data, using zero-knowledge proofs.
- **Governance is fair.** One person, one vote. No plutocracy.
- **Funding is transparent.** Every allocation, every grant, every milestone is publicly tracked on-chain.
- **Income is real.** Token holders earn directly from funded infrastructure, patents, and staking rewards — not speculation.

---

## 2. Problem Statement

Current digital financial systems and public funding models face challenges that limit citizen participation and long-term accountability:

**Centralized Identity.** Most identity systems require centralized authorities to verify and store sensitive personal data. This creates honeypots for data breaches and gives institutions gatekeeping power over who can participate.

**Opaque Public Funding.** Government budgets and charitable organizations often lack real-time transparency. Citizens cannot easily verify where money goes, whether milestones were met, or how decisions were made.

**Wealth-Weighted Governance.** Existing blockchain governance models (e.g. token-weighted voting) replicate the same plutocratic dynamics they claim to disrupt. Large holders dominate decisions regardless of the broader community's preferences.

**No Infrastructure Accountability.** Long-term public infrastructure projects span decades but rarely provide ongoing transparent reporting to the people who funded them. Cost overruns, delays, and corruption go unchecked.

**Research Funding Gaps.** Breakthrough research in medicine, materials science, and public health is chronically underfunded by governments and bottlenecked by institutional grant processes. Citizens have no direct mechanism to fund the research they care about.

Citizen Ledger addresses these gaps with privacy-preserving credentials, transparent allocation, milestone-based funding, and identity-gated governance.

---

## 3. Vision and Goals

The network is built on four foundational goals:

1. **Enable citizen-only participation** through privacy-preserving identity verification. Only verified citizens can vote, propose, or apply for grants — but their personal data never touches the blockchain.

2. **Provide fair governance** with one-person-one-vote for core decisions and quadratic voting for funding allocation. No amount of wealth can override the community's voice.

3. **Maintain a sustainable treasury** for public-benefit programs with transparent, real-time reporting. Every allocation follows citizen-approved rules, and every disbursement is tracked on-chain.

4. **Support long-term infrastructure** that spans decades without depending on any single institution, corporation, or government. The protocol is the institution — governed by citizens, immutable by design.

---

## 4. System Architecture

### 4.1 Layered Design

The platform is a three-layer system:

| Layer | Components | Role |
|---|---|---|
| **Identity Layer** | Off-chain verification providers, ZK proof generation | Privacy-preserving credential issuance and eligibility proofs |
| **Core Chain** | CosmWasm smart contracts on Cosmos SDK (wasmd) | Treasury, Voting, Grants, Staking, and Credential Registry |
| **Application Layer** | Next.js dashboard, public transparency portal | Citizen interaction, proposal creation, fund tracking |

### 4.2 Smart Contract Architecture

Five core contracts form the protocol backbone:

| Contract | Purpose |
|---|---|
| **Credential Registry** | Issues, verifies, and revokes privacy-preserving credentials (SBTs or ZK commitments) |
| **Voting** | Manages proposals, one-person-one-vote and quadratic voting, timelocked execution |
| **Treasury** | Collects fees and emissions, splits funds across citizen-governed categories |
| **Grants** | Milestone-based grant applications, funding, and evidence-verified disbursement |
| **Staking & Emissions** | Token staking, block reward distribution, emission schedule enforcement |

### 4.3 Data Flow

```
Citizen → Verification Provider → Credential Registry (on-chain)
                                       ↓
                              Eligibility Proof (ZK)
                                       ↓
                              Voting → Treasury → Grants
                                  ↓         ↓
                             Staking    Public Dashboard
```

All on-chain events are captured by an indexer service and surfaced through the public transparency dashboard — no wallet connection required to view protocol data.

### 4.4 Technology Stack

| Component | Technology |
|---|---|
| Blockchain | Cosmos SDK / wasmd (CosmWasm) |
| Consensus | CometBFT (Tendermint) |
| Smart Contracts | Rust (CosmWasm) |
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Chain Client | CosmJS v0.32 |
| Wallet Support | Keplr, Leap |
| Indexer | Custom event indexer with PostgreSQL |
| Identity Proofs | Zero-Knowledge (ZK) commitments |

---

## 5. Identity and Privacy

### 5.1 Verification Flow

1. **Document Submission.** A citizen submits identity documents to an approved verification provider (off-chain). Documents are processed and destroyed after verification — never stored on-chain.

2. **Credential Issuance.** The provider issues a non-transferable credential (SBT) or a ZK commitment to the on-chain Credential Registry. The credential records only: holder address, credential type, commitment hash, and expiration.

3. **Eligibility Proofs.** When a citizen needs to access gated functions (voting, grant applications), they generate a zero-knowledge proof that demonstrates eligibility without revealing any personal data.

### 5.2 Credential Types

| Type | Purpose |
|---|---|
| Citizenship | Verified national citizenship — gates voting and governance |
| Residency | Verified residency — may gate regional programs |
| AgeOver18 | Age verification for participation eligibility |
| HealthcareEligibility | Verified eligibility for healthcare programs |
| Custom | Application-specific credentials |

### 5.3 Privacy Guarantees

- **Data minimization.** Only cryptographic commitments are stored on-chain. No names, addresses, dates of birth, or government IDs ever touch the blockchain.
- **Zero-knowledge verification.** Eligibility checks use ZK proofs that reveal nothing beyond "this person is eligible."
- **Recovery without custody.** If a citizen loses their keys, they re-verify with the provider to recover their credential. No custodial backup is needed.
- **Selective disclosure.** Citizens choose which credentials to prove, and each proof reveals only the minimum required claim.

### 5.4 Credential Lifecycle

Each credential follows a defined lifecycle:
- **Issue** — Provider verifies and issues credential.
- **Active** — Citizen uses credential for eligibility proofs.
- **Expire** — Time-limited credentials require renewal.
- **Revoke** — Provider or governance can revoke for cause.
- **Recover** — Key recovery via re-verification with the original provider.

---

## 6. Governance Model

### 6.1 Proposal Lifecycle

Every governance action follows a formal, on-chain lifecycle:

| Stage | Description | Duration |
|---|---|---|
| **Draft** | Proposer posts a proposal with clear objective, description, and budget impact | — |
| **Active** | Citizens cast votes during the voting period | Configurable (default ~7 days) |
| **Tally** | Votes are tallied; quorum and threshold checked | Automatic |
| **Timelocked** | Passed proposals enter a timelock period before execution | Configurable (default ~1 day) |
| **Execute** | Approved proposals execute via on-chain transactions | — |

Proposals can also be Rejected (failed threshold), Expired (quorum not met), or Cancelled (by proposer before voting ends).

### 6.2 Voting Methods

**One-Person-One-Vote (1P1V):** Used for core constitutional changes, treasury policy updates, and major governance decisions. Each verified citizen gets exactly one vote regardless of token holdings. This prevents plutocratic capture and ensures equal representation.

**Quadratic Voting:** Used for funding allocation across categories. Citizens allocate voting tokens where the cost of votes increases quadratically (1 vote = 1 token, 2 votes = 4 tokens, 3 votes = 9 tokens). This balances intensity of preference with breadth of support.

### 6.3 Governance Parameters

| Parameter | Default | Governance-Adjustable |
|---|---|---|
| Voting Period | 604,800 blocks (~7 days) | Yes |
| Quorum | 20% of eligible voters | Yes |
| Pass Threshold | 50% of votes | Yes |
| Timelock Period | 86,400 blocks (~1 day) | Yes |

All parameters are adjustable through governance proposals, creating a self-evolving system.

---

## 7. Community Treasury

### 7.1 Revenue Sources

The treasury receives funds from multiple sources:
- **Transaction fees** — A portion of all on-chain transaction fees route to the treasury.
- **Emission allocations** — A configurable share of newly minted tokens flows to the treasury.
- **External contributions** — Donations, partnerships, and government grants.
- **Revenue from funded assets** — Infrastructure revenue, patent royalties, and licensing fees.

### 7.2 Allocation Categories

Treasury funds are split across citizen-governed categories:

| Category | Purpose | Default Allocation |
|---|---|---|
| Research | Fund scientific research grants | 25% |
| Healthcare | Healthcare infrastructure programs | 20% |
| Infrastructure | Physical and digital infrastructure | 25% |
| Node Incentives | Rewards for node operators | 15% |
| Education | Educational programs and training | 10% |
| Emergency | Emergency reserves | 5% |

Allocations are adjustable through governance proposals. Every change is recorded on-chain with full transparency.

### 7.3 Spending Rules

- All spending requires governance approval or pre-approved category budgets.
- Every disbursement records: recipient, amount, category, memo, and block height.
- Category spending cannot exceed its allocation without a governance vote.
- Emergency reserves require supermajority vote (66%) to access.

---

## 8. Grants and Public-Benefit Funding

### 8.1 Grant Lifecycle

The grants system provides milestone-based funding for public-benefit projects:

1. **Application.** A team or individual submits a grant application with: title, description, category, milestones, and requested funding per milestone.

2. **Review.** The community and review committee evaluate the application. Governance vote approves or rejects.

3. **Funding.** Approved grants receive funds from the treasury, released milestone-by-milestone.

4. **Milestone Evidence.** The grantee submits evidence (documentation, code, reports) for each milestone.

5. **Verification.** An approved oracle or review committee verifies milestone completion.

6. **Disbursement.** Upon verification, the milestone payment is released from the treasury.

7. **Completion.** All milestones met — grant is marked complete. Full history remains publicly viewable.

### 8.2 Grant Categories

Grants cover the same categories as treasury allocations:
- Infrastructure projects (bridges, buildings, digital systems)
- Research grants (medical, scientific, technological)
- Healthcare programs (equipment, staffing, facilities)
- Educational initiatives (training programs, curriculum development)
- Emergency response (disaster relief, rapid response)

### 8.3 Accountability

Every grant is fully transparent:
- Application details are public from submission.
- Milestone evidence is stored on-chain or referenced via content-addressable links.
- All approvals, rejections, and disbursements are recorded with timestamps.
- The public transparency dashboard shows pipeline status in real-time.

---

## 9. Staking and Emissions

### 9.1 Emission Model

CITIZEN has a **capped total supply** with a time-based emission schedule. New tokens are minted per block according to a declining phase schedule:

| Phase | Tokens per Block | Duration |
|---|---|---|
| Phase 1 (Growth) | Higher rate | First ~2 years |
| Phase 2 (Maturation) | Medium rate | Years 2–5 |
| Phase 3 (Stability) | Lower rate | Years 5–10 |
| Phase 4 (Terminal) | Minimal rate | Until cap reached |

Once the cap is reached, no new tokens are minted. The protocol becomes fully fee-sustained.

### 9.2 Staking Mechanics

Token holders stake CITIZEN to:
- **Earn block rewards** — Pro-rata share of newly minted tokens.
- **Earn fee share** — Portion of transaction fees distributed to stakers.
- **Participate in governance** — Stakers demonstrate long-term commitment.
- **Qualify for node operation** — Minimum stake required to run a validator node.

### 9.3 Treasury Share

A configurable percentage of emissions (default: 20%) routes directly to the treasury rather than to stakers, ensuring continuous funding for public programs even during early network stages.

### 9.4 Slashing

Validators who violate network rules face slashing penalties:
- **Downtime** — Small percentage slashed for extended unavailability.
- **Malicious behavior** — Larger penalty for equivocation or censorship attempts.
- Default slash penalty: 5% of staked amount.

---

## 10. Node Network

### 10.1 Node Types

The network is secured by a mixed node ecosystem designed for broad participation:

**Home Nodes.** Individual citizens running low-cost hardware (e.g., Raspberry Pi or Mini PC). Lower stake requirement, designed to maximize geographic distribution and decentralization.

**Institutional Nodes.** Organizations running higher-availability infrastructure with stronger uptime guarantees, larger stakes, and professional monitoring.

### 10.2 Incentives

- **Fee sharing** — Node operators earn a share of transaction fees proportional to uptime and stake.
- **Emission rewards** — Block rewards distributed to active validators.
- **Governance participation bonus** — Nodes that also actively participate in governance earn boosted rewards.

### 10.3 Distribution Goals

The protocol explicitly targets geographic diversity through:
- Incentive bonuses for nodes in underserved regions.
- Maximum cap per region to prevent geographic concentration.
- Redundancy targets to ensure network resilience.

---

## 11. Research Programs

### 11.1 Focus Areas

Research funding focuses on high-impact public-health categories:

| Area | Description |
|---|---|
| Regenerative Medicine | Organ health, tissue engineering, stem cell therapy |
| Oncology | Cancer immunotherapy, early detection, treatment innovations |
| Neurodegeneration | Alzheimer's, Parkinson's, cognitive health research |
| Cardiovascular | Heart disease prevention, treatment, and monitoring |
| Rare Diseases | Underserved conditions lacking commercial funding incentives |

### 11.2 Funding Mechanism

1. Citizens vote to allocate treasury funds to research categories via quadratic voting.
2. Research teams apply for grants through the on-chain grants system.
3. Applications are reviewed by an elected Research Committee and voted on by citizens.
4. Funded research follows the milestone-based grants pipeline.
5. All research outputs, papers, and data are referenced on-chain.

### 11.3 Intellectual Property

When funded research produces patentable innovations:
- The protocol retains joint or full IP ownership (defined in grant agreements).
- Patents are licensed commercially — royalties flow back to the treasury.
- Citizens vote on licensing terms: exclusive vs. non-exclusive, pricing, humanitarian waivers.
- A Patent & IP Committee (elected by governance) manages the portfolio.

---

## 12. Healthcare Infrastructure Program

### 12.1 Vision

The project includes a long-term regional healthcare infrastructure program where citizens directly fund, govern, and benefit from physical medical facilities.

### 12.2 Components

**Regional Centers.** Citizen-funded hospitals and research hubs built through treasury grants. Each facility is held by a protocol-controlled legal entity (DAO LLC or foundation).

**Supply Chain.** Regional warehouses for medical equipment and supplies, with on-chain procurement tracking and inventory management.

**Governance.** Independent medical oversight boards with citizen-elected members. Performance reporting is published on-chain quarterly.

### 12.3 Revenue Flow

Completed facilities generate revenue through:
- Patient fees and insurance reimbursements
- Equipment leasing
- Rental income from co-located facilities
- Government reimbursements

Revenue flows back to the on-chain treasury, where a governance-set percentage is distributed to stakers as **Infrastructure Yield**.

---

## 13. How Citizens Invest & Grow Their Holdings

### 13.1 One Token, Many Units

There is only **one type of token: CITIZEN.** But you can own as many CITIZEN as you want — 10, 1,000, or 1,000,000. Think of it like a stock: there's one class of share, but you buy as many shares as you choose.

| Concept | Explanation |
|---|---|
| Token name | CITIZEN |
| Smallest unit | ucitizen (1 CITIZEN = 1,000,000 ucitizen) |
| Total supply cap | 1,000,000,000 CITIZEN — once minted, no more are created |
| Who can hold? | Anyone with a wallet — verified citizens get extra governance rights |
| Can I buy more? | Yes — there is no limit on how many tokens you hold |

### 13.2 Ways to Invest (Grow Your Holdings)

Citizens have **six concrete ways** to accumulate more CITIZEN tokens and increase the value of the ones they already hold:

#### 1. Staking (Earn New Tokens Every Block)
Lock your CITIZEN in the staking contract and earn a share of **newly minted tokens + transaction fees** every block (~6 seconds). The more you stake, the larger your share.

> *Example: If total staked supply is 100M CITIZEN and you stake 10,000 CITIZEN, you receive 0.01% of every block's rewards.*

#### 2. Governance Participation Bonus
Citizens who **actively vote on proposals** earn a yield multiplier. If you stake *and* vote, your effective yield is higher than someone who only stakes. This rewards civic engagement, not just capital.

#### 3. Running a Node
Operate a validator node from home (Raspberry Pi) or professionally. Node operators earn:
- Block rewards (emissions)
- Fee share
- Extra governance bonus if they also vote

#### 4. Supplying Liquidity (Future — DEX Listing)
Once CITIZEN is listed on a decentralised exchange (DEX), holders can provide liquidity pairs (e.g. CITIZEN/ATOM or CITIZEN/USDC) and earn trading fees. This is additional income on top of staking.

#### 5. Buy and Hold (Scarce Supply + Growing Revenue)
Because supply is **permanently capped** and the network continuously generates real-world revenue (from hospitals, patents, factories, warehouses), each CITIZEN token represents a growing share of the network's total income. Holding is itself an investment strategy, similar to owning equity in a growing company.

#### 6. Reinvesting Yields (Compounding)
All staking rewards, fee shares, and yield distributions are paid in CITIZEN. You can **re-stake** those earnings to compound your position — your rewards earn rewards.

### 13.3 What Makes Each Token More Valuable Over Time

The price of one CITIZEN token is driven by supply and demand. Here's why demand rises while supply stays capped:

```
  SUPPLY (fixed)                       DEMAND (growing)
  ─────────────                        ─────────────────
  ✖ Capped at 1B CITIZEN              ✔ Real income rises each quarter
  ✖ No inflation after cap             ✔ More hospitals, factories, patents
  ✖ Optional burn (deflationary)       ✔ New citizens join → buy CITIZEN
  ✖ Stakers lock tokens (reduces       ✔ DEX liquidity demand
    circulating supply)                ✔ Node operators lock stake
                                       ✔ Governance requires holding
```

**In plain English:** The pie (total tokens) doesn't get bigger, but the income flowing through it does. So each slice (your tokens) becomes worth more.

### 13.4 Worked Example: Year 1 → Year 5

| Metric | Year 1 | Year 3 | Year 5 |
|---|---|---|---|
| Your holdings | 10,000 CITIZEN | 13,200 CITIZEN (compounded staking) | 16,800 CITIZEN |
| Network revenue stream | 1 hospital | 3 hospitals + 2 patents | 5 hospitals + 8 patents + 1 factory |
| Your annual yield | ~8% staking only | ~12% staking + infrastructure yield | ~15% all income streams |
| Governance bonus | +1.2x (you vote) | +1.5x (active voter) | +1.8x (delegate + voter) |

*Figures are illustrative. Actual yields depend on total staked supply, network revenue, and governance decisions.*

### 13.5 How Is This Different From Other Crypto?

| Factor | Typical Crypto Token | CITIZEN |
|---|---|---|
| Income source | None — speculative only | Hospitals, patents, factories, fees |
| Supply model | Often inflationary forever | Hard capped at 1B |
| Why price rises | Hype, narratives | Growing real revenue per token |
| Governance power | Vote weight = wealth | One person, one vote (fair) |
| Compounding | Only if you trade | Automatic via restaking |
| Exit strategy | Sell before crash | Hold for lifetime income |

---

## 14. Why Hold CITIZEN — Value Accrual

CITIZEN is not a speculative token — it is a **productive asset** backed by real-world income streams.

### 14.1 Income Streams

| Stream | Source | Distribution | Frequency |
|---|---|---|---|
| Infrastructure Yield | Hospital revenue, rent, equipment leasing | Pro-rata to stakers | Monthly |
| Research Royalty Yield | Patent licensing, IP royalties from funded research | Pro-rata to stakers | Quarterly |
| Staking Emissions | Block rewards (declining schedule until cap) | Pro-rata to stakers | Per block |
| Fee Share | Transaction fees on the network | Pro-rata to stakers | Per block |
| Governance Bonus | Active voting participation bonus | Multiplier on yields | Monthly |

### 14.2 Compounding Value Flywheel

The model creates a compounding cycle:

```
Citizens buy CITIZEN → Treasury grows → Funds research & buildings
                                         ↓
                                    Patents & revenue generated
                                         ↓
                                    Royalties & income flow to stakers
                                         ↓
                                    Higher yield → More demand for CITIZEN
                                         ↓
                                    Token value increases → Treasury buys more
                                         ↓
                                    More projects funded → More patents & buildings
                                         ↓
                                    (Cycle repeats — value compounds)
```

### 14.3 Why This Matters

1. **Real income, not speculation.** Holders earn from hospitals, patents, and infrastructure.
2. **Compounding returns.** Revenue funds more projects, generating more revenue.
3. **Scarce supply with growing demand.** Capped supply + rising income = increasing value.
4. **Governance over real assets.** Holders decide what gets built and how income is distributed.
5. **Societal impact.** Investment funds hospitals, cures diseases, builds public infrastructure.
6. **Full transparency.** Every pound of revenue, every patent, every building is tracked on-chain.

---

## 15. Tokenomics

### 15.1 Supply Model

| Parameter | Value |
|---|---|
| Token Name | CITIZEN |
| Denomination | ucitizen (1 CITIZEN = 1,000,000 ucitizen) |
| Maximum Supply | 1,000,000,000 CITIZEN (1 Trillion ucitizen) |
| Initial Supply | 0 (all tokens are emitted via the staking contract) |
| Supply Model | Capped with declining emission schedule |
| Deflationary Levers | Optional fee burns or buyback (governance vote) |

### 15.2 Emission Schedule

Tokens are emitted on a block-by-block declining schedule across four phases:

| Phase | Duration | Emission Rate | Cumulative Supply |
|---|---|---|---|
| Phase 1 (Growth) | ~2 years | Highest per-block rate | ~25% of max |
| Phase 2 (Maturation) | Years 2–5 | ~50% reduction | ~55% of max |
| Phase 3 (Stability) | Years 5–10 | ~75% reduction | ~85% of max |
| Phase 4 (Terminal) | Year 10+ | Minimal rate | 100% of max (cap) |

### 15.3 Allocation Split (per block)

| Recipient | Share |
|---|---|
| Stakers | 80% of emissions |
| Treasury | 20% of emissions |

The treasury share ensures continuous public-benefit funding throughout the emission schedule. After emissions end, the protocol sustains itself through transaction fees and revenue from funded assets.

### 15.4 No Pre-mine, No VC Allocation

All CITIZEN tokens are emitted through the staking contract. There is:
- No pre-mine
- No venture capital allocation
- No team allocation
- No initial coin offering or airdrop

Every token in existence was earned through staking and network participation. This ensures maximum fairness and prevents early insiders from controlling the supply.

---

## 16. Transparency and Accountability

Transparency is a first-class feature, not an afterthought:

- **Public Transparency Dashboard.** Real-time read-only view of all protocol data: treasury balance, allocations, grant status, proposal outcomes, emission progress. No wallet required.
- **Open-Source Contracts.** All smart contracts are publicly auditable on GitHub.
- **On-Chain Records.** Every treasury disbursement, governance vote, grant milestone, and credential action is permanently recorded on-chain.
- **Audit Reports.** Periodic independent security audits published publicly.
- **Infrastructure Reporting.** Funded real-world assets publish quarterly financial reports on-chain.

---

## 17. Risk and Compliance

### 17.1 Risk Matrix

| Risk | Severity | Mitigation |
|---|---|---|
| Privacy breach | High | ZK proofs, data minimization, no PII on-chain |
| Smart contract exploit | High | Multiple audits, formal verification, bug bounty program |
| Credential fraud | Medium | Issuer audits, revocation policies, contestable recovery |
| Treasury depletion | Medium | Emergency reserves (5%), spending caps per category |
| Regulatory action | Medium | Jurisdiction analysis, conservative rollout, legal counsel |
| Validator centralization | Low | Geographic distribution incentives, stake caps |
| Low voter turnout | Low | Governance participation bonuses, delegation support |

### 16.2 Compliance Approach

- Jurisdiction-specific legal analysis before each regional launch.
- KYC/AML compliance through verified issuers (off-chain, privacy-preserving).
- Revenue-sharing from real-world assets structured through compliant legal entities.
- Regulatory liaison team for ongoing engagement with financial authorities.

---

## 18. Roadmap

### Phase 0: Foundations
- Define scope, success criteria, and technical architecture.
- Select base chain (Cosmos SDK / wasmd).
- Design identity verification approach and credential lifecycle.

### Phase 1: Identity + Core Contracts
- Implement Credential Registry, Treasury, Voting, Grants, and Staking contracts.
- Build citizen dashboard, voting UI, and grants portal.
- Internal testnet with full contract suite.

### Phase 2: Treasury + Voting + Grants MVP
- Node operator tooling, staking UI, and reward distribution.
- Public transparency dashboard.
- Security and privacy reviews.
- Limited public testnet with verified users.

### Phase 3: Node Network + Observability
- Expand node distribution with geographic incentives.
- Metrics collection, health reporting, and monitoring.
- Collect data and refine treasury parameters.

### Phase 4: Research Funding + Infrastructure Pilot
- Research category registry and initial funding pools.
- First research grant cycle.
- Infrastructure pilot: regional center and warehouse.
- Infrastructure reporting integrated into dashboard.

### Phase 5: Scale + Governance Maturity
- Multi-region expansion.
- Formal governance audits and periodic policy review.
- IP portfolio management and licensing program.
- Publish v2 roadmap based on metrics and community feedback.

---

## 19. Technical Specifications

### 19.1 Chain Configuration

| Parameter | Value |
|---|---|
| Chain ID | citizen-ledger-1 (mainnet) |
| Consensus | CometBFT |
| Block Time | ~6 seconds |
| Smart Contract Platform | CosmWasm v2 |
| Native Denomination | ucitizen |
| Display Denomination | CITIZEN |
| Decimal Places | 6 |
| Bech32 Prefix | citizen |

### 19.2 Contract Addresses

Deployed on testnet. Mainnet addresses will be published at launch.

### 19.3 API Endpoints

| Service | Description |
|---|---|
| RPC | Tendermint RPC for transaction submission and queries |
| REST | LCD (Light Client Daemon) for REST API access |
| gRPC | Native gRPC for high-performance integrations |
| Indexer | Custom indexer API for aggregated analytics |

---

## 20. Glossary

| Term | Definition |
|---|---|
| **CITIZEN** | The native token of the Citizen Ledger network |
| **ucitizen** | The smallest denomination of CITIZEN (1 CITIZEN = 1,000,000 ucitizen) |
| **SBT** | Soulbound Token — a non-transferable token used for identity or eligibility |
| **ZK Proof** | Zero-Knowledge Proof — cryptographic proof that validates a claim without revealing underlying data |
| **CosmWasm** | Smart contract platform for Cosmos SDK chains |
| **CometBFT** | Byzantine Fault Tolerant consensus engine (formerly Tendermint) |
| **Quadratic Voting** | Voting method where cost of votes increases quadratically to balance intensity and fairness |
| **Treasury Split** | A fixed allocation of protocol revenues across citizen-governed categories |
| **Milestone Grant** | A grant that releases funds incrementally as milestones are verified |
| **Credential Registry** | On-chain registry tracking verified citizen credentials |
| **Timelock** | A delay period between proposal passage and execution, allowing community oversight |
| **Slashing** | Penalty (token deduction) for validators who violate network rules |

---

*Citizen Ledger is open source. All contracts, documentation, and frontend code are available at [github.com/Mopperr/citizen-ledger](https://github.com/Mopperr/citizen-ledger).*

*This is a living document. Updates will be published through governance proposals and reflected in the project repository.*
