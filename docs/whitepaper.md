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

### 9.1 Consensus: Proof of Stake (Not Proof of Work)

Citizen Ledger uses **Delegated Proof of Stake (DPoS)** via CometBFT (formerly Tendermint). This is fundamentally different from Bitcoin or Ethereum's old model:

| | Bitcoin / Old Ethereum (PoW) | Citizen Ledger (DPoS) |
|---|---|---|
| How blocks are made | GPUs/ASICs solve math puzzles | Validators take turns proposing blocks |
| Energy use | Massive — warehouse-scale mining | Minimal — runs on a Raspberry Pi |
| Hardware requirement | $5,000+ GPU rigs or ASIC miners | $50–$500 (Pi, Mini PC, or cloud VPS) |
| Who earns rewards | Whoever burns the most electricity | Anyone who stakes tokens + runs a node |
| Barrier to entry | Very high (capital + electricity) | Very low (stake tokens + cheap hardware) |
| Security model | 51% of hash power | ⅔ of staked tokens |

**In plain English:** You don't mine CITIZEN. You don't need a GPU, you don't need to solve puzzles, and you don't burn electricity. You lock (stake) your CITIZEN tokens, run a lightweight node, and the protocol selects validators to produce blocks based on their stake. Honest validators earn rewards every block (~6 seconds). Dishonest ones get slashed.

This is the same model used by modern Ethereum (post-Merge), Cosmos Hub, Osmosis, and other major networks.

### 9.2 Emission Model — Concrete Numbers

CITIZEN has a **hard cap of 10,000,000,000 tokens (10 billion)**. New tokens are minted per block on a declining schedule:

| Phase | Duration | Tokens per Block | Blocks/Year* | Annual Emission | Cumulative |
|---|---|---|---|---|---|
| Phase 1 (Growth) | Years 0–2 | 475.6 CITIZEN | 5,256,000 | ~2,500,000,000 | 2,500,000,000 (25%) |
| Phase 2 (Maturation) | Years 2–5 | 190.2 CITIZEN | 5,256,000 | ~1,000,000,000 | 5,500,000,000 (55%) |
| Phase 3 (Stability) | Years 5–10 | 114.2 CITIZEN | 5,256,000 | ~600,000,000 | 8,500,000,000 (85%) |
| Phase 4 (Terminal) | Years 10–15 | 57.1 CITIZEN | 5,256,000 | ~300,000,000 | 10,000,000,000 (100%) |

*\*Based on ~6-second block time → ~14,400 blocks/day → ~5,256,000 blocks/year.*

Once the 10 billion cap is reached (estimated year ~15), **no new tokens are minted.** The protocol becomes fully fee-sustained.

### 9.3 Two-Layer Distribution Model

Citizen Ledger uses a **two-layer distribution model** rather than a single flat split. Different income types have different splits, reflecting who created the value:

| Income Type | Stakers / Validators | Treasury | Rationale |
|---|---|---|---|
| **Block emissions** | **75%** | **25%** | Rewards stakers while providing stronger treasury funding for the capital-intensive mission |
| **Transaction fees** | **80%** | **20%** | Validators earn more from the network activity they secure |
| **Infrastructure revenue** (hospitals, factories, warehouses) | **40%** | **60%** | Treasury funded these assets — it recaptures more to fund MORE assets |
| **Patent / IP royalties** | **50%** | **50%** | Even split — rewards holders while growing the IP portfolio |
| **Slashed tokens** | **0%** | **100%** | Penalties go entirely to public programs |

**Why two layers?** A hospital that the treasury built and funded should return more to the treasury so it can build the *next* hospital. Meanwhile, block emissions and fees should primarily reward the people securing the network. This creates a compounding flywheel: treasury → builds assets → revenue → 60% back to treasury → builds more assets.

### 9.4 Emission Split (per block)

Every block, newly minted tokens are split 75/25:

| Recipient | Share | Phase 1 per Block | Phase 2 per Block |
|---|---|---|---|
| **Validators & Stakers** | 75% | 356.7 CITIZEN | 142.7 CITIZEN |
| **Treasury** | 25% | 118.9 CITIZEN | 47.6 CITIZEN |
| **Total** | 100% | 475.6 CITIZEN | 190.2 CITIZEN |

### 9.5 Staking Mechanics

Token holders stake CITIZEN to:
- **Earn block rewards** — Pro-rata share of the 75% staker emission.
- **Earn fee share** — 80% of transaction fees distributed to stakers.
- **Earn infrastructure yield** — 40% of real-world revenue (hospitals, patents, factories).
- **Participate in governance** — Stakers demonstrate long-term commitment.
- **Qualify for node operation** — Minimum stake required to run a validator node.

**Unbonding period:** 21 days. When you unstake, tokens are locked for 21 days before they become liquid. This prevents short-term speculation and ensures validators maintain skin in the game.

### 9.6 Staking APY by Phase

The Annual Percentage Yield (APY) for stakers depends on total staked supply. These estimates assume **40% of circulating supply is staked** (typical for Cosmos chains):

| Phase | Circulating Supply | 40% Staked | Annual Emission to Stakers (75%) | Base Staking APY |
|---|---|---|---|---|
| Phase 1 | ~1.25B (midpoint) | 500M | 1,875,000,000 | **~375%** (early high, decreasing rapidly) |
| Phase 2 | ~4B (midpoint) | 1.6B | 750,000,000 | **~47%** |
| Phase 3 | ~7B (midpoint) | 2.8B | 450,000,000 | **~16%** |
| Phase 4 | ~9.25B (midpoint) | 3.7B | 225,000,000 | **~6%** |
| Post-cap | 10B | 4B | 0 (fees + revenue only) | **~4–8%** (fees + infrastructure yield + IP royalties) |

*Note: Phase 1 APY is very high to bootstrap the network. Early stakers earn the most, similar to early Bitcoin miners. APY naturally declines as more tokens enter circulation.*

### 9.7 Compound Staking — What $1,000 Becomes

If you stake and **re-stake all rewards every month** (compounding), here's what a $1,000 initial position grows to across different entry points:

#### Scenario A: Enter at Launch (Phase 1)

Assumes initial purchase of 100,000 CITIZEN at $0.01 each.

| Year | Your Staked Balance | Cumulative Yield Earned | Effective APY (compounded) |
|---|---|---|---|
| Year 1 | 100,000 → 432,000 CITIZEN | +332,000 CITIZEN | ~332% |
| Year 2 | 432,000 → 1,080,000 CITIZEN | +980,000 CITIZEN | ~150% (rate declining) |
| Year 3 | 1,080,000 → 1,570,000 CITIZEN | +1,470,000 CITIZEN | ~45% |
| Year 5 | 1,570,000 → 2,060,000 CITIZEN | +1,960,000 CITIZEN | ~16% |
| Year 10 | 2,060,000 → 2,680,000 CITIZEN | +2,580,000 CITIZEN | ~5% |

**Result: Your initial 100,000 CITIZEN grows to ~2,680,000 CITIZEN through compounding alone — 26.8× your original position.**

#### Scenario B: Enter at Year 3 (Phase 2)

Assumes purchase of 100,000 CITIZEN at market price.

| Year | Your Staked Balance | Cumulative Yield Earned | Effective APY (compounded) |
|---|---|---|---|
| Year 3 | 100,000 → 145,000 CITIZEN | +45,000 CITIZEN | ~45% |
| Year 5 | 145,000 → 198,000 CITIZEN | +98,000 CITIZEN | ~17% |
| Year 10 | 198,000 → 261,000 CITIZEN | +161,000 CITIZEN | ~5.5% |

**Result: 100,000 → ~261,000 CITIZEN — 2.6× your position over 7 years.**

#### Scenario C: Enter at Year 6 (Phase 3, Steady State)

| Year | Your Staked Balance | Cumulative Yield Earned | Effective APY (compounded) |
|---|---|---|---|
| Year 6 | 100,000 → 117,000 CITIZEN | +17,000 CITIZEN | ~17% |
| Year 10 | 117,000 → 146,000 CITIZEN | +46,000 CITIZEN | ~5.7% |
| Year 15 | 146,000 → 178,000 CITIZEN | +78,000 CITIZEN | ~4% (fees + revenue) |

**Result: 100,000 → ~178,000 CITIZEN — 1.78× over 9 years, sustainable long-term.**

*All scenarios exclude infrastructure yield, governance bonuses, and token price appreciation — actual returns may be higher.*

### 9.8 Governance Participation Bonus

Stakers who also **actively vote on governance proposals** earn a yield multiplier:

| Voting Activity | Multiplier on Base Yield |
|---|---|
| No votes cast | 1.0× (base rate) |
| Voted on 25%+ of proposals | 1.1× |
| Voted on 50%+ of proposals | 1.25× |
| Voted on 75%+ of proposals | 1.5× |
| Voted on 100% of proposals | 1.8× |

*Example: If base staking APY is 17% and you vote on all proposals, your effective APY is 17% × 1.8 = 30.6%.*

### 9.9 Slashing

Validators who violate network rules face slashing penalties:

| Violation | Penalty | Jail Duration |
|---|---|---|
| Downtime (missed >50 of last 100 blocks) | 0.5% of stake | 10 minutes |
| Double signing (equivocation) | 5% of stake | Permanent (governance can unjail) |
| Censorship (proven tx filtering) | 3% of stake | 24 hours |

Slashed tokens are sent to the treasury, not burned — they fund public programs.

### 9.10 Post-Cap Economics — How Fees Work After All Tokens Are Minted

Around year ~15, all 10,000,000,000 CITIZEN (10 billion) will have been minted. At that point, **no new tokens are created — ever.** The network must sustain itself entirely through fees and real-world revenue. Here's exactly how that works:

#### Where the money comes from (three sources)

**1. Transaction Fees (on-chain activity)**

Every action on Citizen Ledger costs a small fee paid in CITIZEN:

| Action | Estimated Fee |
|---|---|
| Simple token transfer | 0.01–0.05 CITIZEN |
| Governance vote | 0.02 CITIZEN |
| Grant proposal submission | 0.50 CITIZEN |
| Credential verification | 0.10 CITIZEN |
| Smart contract execution | 0.05–0.50 CITIZEN |
| Demand Discovery idea submission | 0.10 CITIZEN |
| DEX swap (future) | 0.1% of trade value |

These fees exist during the emission period too, but post-cap they become the **primary** reward source for validators.

**Projected fee revenue at maturity (Year 15+):**

| Scenario | Daily Transactions | Avg Fee | Daily Fee Pool | Annual Fee Pool |
|---|---|---|---|---|
| Conservative | 100,000 tx/day | 0.05 CITIZEN | 5,000 | ~1,825,000 CITIZEN/yr |
| Moderate | 500,000 tx/day | 0.05 CITIZEN | 25,000 | ~9,125,000 CITIZEN/yr |
| Optimistic | 2,000,000 tx/day | 0.05 CITIZEN | 100,000 | ~36,500,000 CITIZEN/yr |

*For comparison: Cosmos Hub processes ~500K–1M transactions/day at maturity. Osmosis peaks at ~2M/day.*

**2. Infrastructure Revenue (real-world income)**

By year 15, the protocol will have funded hospitals, warehouses, factories, and patents. These generate recurring revenue:

| Revenue Source | Estimated Annual Revenue (Year 15) |
|---|---|
| Hospital network (5+ facilities) | 10,000,000–50,000,000 CITIZEN equivalent |
| Patent licensing portfolio (50+ patents) | 2,000,000–10,000,000 CITIZEN equivalent |
| Warehouse & manufacturing operations | 5,000,000–20,000,000 CITIZEN equivalent |
| Equipment leasing | 1,000,000–5,000,000 CITIZEN equivalent |
| **Total real-world revenue** | **18,000,000–85,000,000 CITIZEN equivalent/yr** |

*Revenue is collected off-chain in fiat, converted to CITIZEN (or stablecoins), and distributed on-chain by the treasury contract.*

**3. Optional Deflationary Mechanisms (governance-controlled)**

Citizens can vote to activate:
- **Fee burns** — A percentage of transaction fees are permanently burned, reducing supply below 10B. Fewer tokens + same income = each token worth more.
- **Buyback & burn** — Treasury uses a portion of revenue to buy CITIZEN on the open market and burn it.
- **Minimum fee floor** — Governance can set a minimum fee to ensure validators always earn a baseline.

#### How income is distributed post-cap

The two-layer split continues — each income type retains its own ratio:

```
  ┌─────────────────────────────────────────────────────────────┐
  │                  TOTAL POST-CAP INCOME                      │
  │  (no new tokens minted — all income from fees & revenue)    │
  └──────────────────────┬──────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────────┐
        │                │                    │
  Transaction Fees  Infrastructure Rev   Patent/IP Royalties
   (80% / 20%)       (40% / 60%)          (50% / 50%)
   Stakers Treasury   Stakers Treasury    Stakers Treasury
        │                │                    │
        └────────────────┴────────────────────┘
                         │
               ┌─────────┴──────────┐
               │                    │
          STAKER POOL          TREASURY POOL
          │                    │
     Validators &         Grants, Research,
     Delegators           New Infrastructure
```

#### Worked example: Post-cap earnings (moderate scenario)

| Income Source | Annual Total | Staker Share | Treasury Share |
|---|---|---|---|
| Transaction fees | 91,250,000 CITIZEN | 73,000,000 (80%) | 18,250,000 (20%) |
| Infrastructure revenue | 400,000,000 CITIZEN | 160,000,000 (40%) | 240,000,000 (60%) |
| Patent/IP royalties | 60,000,000 CITIZEN | 30,000,000 (50%) | 30,000,000 (50%) |
| **Totals** | **551,250,000** | **263,000,000** | **288,250,000** |

**Staker pool: ~263M CITIZEN/year.** Treasury pool: ~288M CITIZEN/year (funds the next wave of hospitals, research, and factories).

| Role | Your Stake | Share of Staker Pool | Annual Earnings | At $0.20/CITIZEN |
|---|---|---|---|---|
| Small delegator | 100,000 CITIZEN | 0.0025% | ~6,575 CITIZEN | ~$1,315 |
| Large delegator | 1,000,000 CITIZEN | 0.025% | ~65,750 CITIZEN | ~$13,150 |
| Home validator (100K self + 2M delegated) | 2,100,000 CITIZEN weight | 0.053% | ~138,080 CITIZEN + commission | ~$27,616 |
| Institutional validator (2M self + 50M delegated) | 52,000,000 CITIZEN weight | 1.3% | ~3,419,000 CITIZEN + commission | ~$683,800 |

*Assumes 4B total staked. Governance bonus multipliers apply on top of these numbers.*

#### Why this is sustainable forever

1. **Fees scale with usage.** More users = more transactions = more fees. The network doesn't need inflation to pay validators.
2. **Real-world revenue grows.** Every new hospital, patent, or factory adds permanent recurring income to the protocol.
3. **Supply is fixed (or shrinking).** If governance activates fee burns, supply drops below 10B, making each remaining token more valuable.
4. **No "death spiral" risk.** Unlike pure-emission chains that collapse when rewards dry up, Citizen Ledger has diversified income from real-world assets that don't depend on crypto market conditions.
5. **Validators are incentivised to support growth.** More network activity = more fee income for validators. Their interests align with the protocol's success.

**In plain English:** After year ~15, validators get paid from transaction fees (like credit card networks charge merchants) plus real-world revenue from the hospitals, patents, and factories the network built. No new coins needed — the pie doesn't grow, but the income flowing through it does.

---

## 10. Node Network

### 10.1 Consensus Model — How Validators Work

Citizen Ledger runs on **CometBFT consensus** (the engine behind Cosmos Hub, Osmosis, and 50+ production chains). Here's how it works:

1. **Validator set** — The top N staked nodes form the active validator set (initially N = 100, expandable by governance).
2. **Block proposal** — Each block, one validator is randomly selected (weighted by stake) to propose the block.
3. **Voting rounds** — The other validators vote to confirm the block in two rounds (pre-vote + pre-commit).
4. **Finality** — Once ⅔+ of stake weight confirms, the block is **instantly final** (no waiting for 6 confirmations like Bitcoin).
5. **Rewards** — The block proposer gets a slight bonus; all active validators earn proportional to their stake.

**Block time: ~6 seconds.** Final. No reorganizations. No orphan blocks.

### 10.2 Node Types and Requirements

| | Home Node | Institutional Node |
|---|---|---|
| **Hardware** | Raspberry Pi 5 (8GB), Mini PC, or old laptop | Dedicated server or cloud VPS |
| **CPU** | 4 cores | 8+ cores |
| **RAM** | 8 GB | 16–32 GB |
| **Storage** | 256 GB SSD | 1 TB NVMe SSD |
| **Internet** | 50 Mbps, stable residential | 1 Gbps, enterprise SLA |
| **Cost** | $50–$200 hardware + electricity | $50–$200/month cloud or co-location |
| **Min. stake** | 10,000 CITIZEN | 500,000 CITIZEN |
| **Max commission** | 10% | 20% |
| **Expected uptime** | 95%+ | 99.5%+ |

### 10.3 Validator Earnings — Concrete Numbers

Validator earnings come from three sources: **block emissions, transaction fees, and commission on delegated stake.**

#### Source 1: Block Emission Rewards

Total emission per year to stakers (75% of emission):

| Phase | Annual Staker Emission | Per Validator (100 equal validators) | Per Validator per Month |
|---|---|---|---|
| Phase 1 | 1,875,000,000 CITIZEN | 18,750,000 CITIZEN/yr | ~1,562,500 CITIZEN/mo |
| Phase 2 | 750,000,000 CITIZEN | 7,500,000 CITIZEN/yr | ~625,000 CITIZEN/mo |
| Phase 3 | 450,000,000 CITIZEN | 4,500,000 CITIZEN/yr | ~375,000 CITIZEN/mo |
| Phase 4 | 225,000,000 CITIZEN | 2,250,000 CITIZEN/yr | ~187,500 CITIZEN/mo |

*Actual per-validator earnings scale with their stake weight. Top validators earn more; smaller validators earn less.*

#### Source 2: Transaction Fees

| Network Stage | Estimated Daily Transactions | Avg Fee | Daily Fee Pool | Annual Fee Pool |
|---|---|---|---|---|
| Early (Year 1) | 5,000 tx/day | 0.05 CITIZEN | 250 CITIZEN | ~91,250 CITIZEN |
| Growing (Year 3) | 50,000 tx/day | 0.05 CITIZEN | 2,500 CITIZEN | ~912,500 CITIZEN |
| Mature (Year 5+) | 200,000 tx/day | 0.05 CITIZEN | 10,000 CITIZEN | ~3,650,000 CITIZEN |

80% of fees go to validators/stakers, 20% to treasury. Infrastructure revenue is split 40/60, and IP royalties 50/50 (see Section 9.3).

#### Source 3: Commission

Validators set a **commission rate** on delegated stake. This is a percentage of the rewards that delegators earn through your node.

| Commission Rate | You Have Staked | Others Delegate to You | Your Commission Income (Phase 2, APY ~47%) |
|---|---|---|---|
| 5% | 100,000 CITIZEN | 1,000,000 delegated | 5% × 470,000 rewards = 23,500 CITIZEN/yr |
| 10% | 500,000 CITIZEN | 5,000,000 delegated | 10% × 2,350,000 rewards = 235,000 CITIZEN/yr |
| 5% | 1,000,000 CITIZEN | 20,000,000 delegated | 5% × 9,400,000 rewards = 470,000 CITIZEN/yr |

### 10.4 Worked Example: Home Node Validator (Phase 2, Year 3)

**Setup:** Raspberry Pi 5, 100,000 CITIZEN self-staked, 5% commission, 2,000,000 CITIZEN delegated to you, 98% uptime.

| Income Source | Annual Earnings |
|---|---|
| Self-stake rewards (100K at ~47% APY) | 47,000 CITIZEN |
| Commission (5% of delegator rewards: 2M × 47%) | 47,000 CITIZEN |
| Fee share (proportional: 2.1M/total_staked × fee pool) | ~1,200 CITIZEN |
| Governance bonus (vote on all proposals, 1.8×) | +42,300 CITIZEN bonus |
| **Total** | **~137,500 CITIZEN/year** |

At $0.05/CITIZEN = **~$6,875/year from a Raspberry Pi.**
At $0.10/CITIZEN = **~$13,750/year.**

**Hardware cost:** ~$100 one-time.   **Electricity:** ~$15/year.   **ROI: Weeks, not years.**

### 10.5 Worked Example: Institutional Validator (Phase 2, Year 3)

**Setup:** Cloud VPS, 2,000,000 CITIZEN self-staked, 10% commission, 50,000,000 CITIZEN delegated, 99.9% uptime.

| Income Source | Annual Earnings |
|---|---|
| Self-stake rewards (2M at ~47% APY) | 940,000 CITIZEN |
| Commission (10% of delegator rewards: 50M × 47%) | 2,350,000 CITIZEN |
| Fee share | ~68,000 CITIZEN |
| Governance bonus (1.5× — votes on 75% of proposals) | +705,000 CITIZEN bonus |
| **Total** | **~4,063,000 CITIZEN/year** |

At $0.05/CITIZEN = **~$203,150/year.**   At $0.10/CITIZEN = **~$406,300/year.**

**Operating cost:** ~$2,400/year (cloud VPS).

### 10.6 Delegation — Earning Without Running a Node

Citizens who don't want to run a node can **delegate** their CITIZEN to any validator and earn staking rewards minus the validator's commission:

| Your Delegation | Validator Commission | Base APY | Your Effective APY | Annual Earnings |
|---|---|---|---|---|
| 10,000 CITIZEN | 5% | 47% (Phase 2) | 44.65% | 4,465 CITIZEN |
| 100,000 CITIZEN | 5% | 47% (Phase 2) | 44.65% | 44,650 CITIZEN |
| 100,000 CITIZEN | 10% | 16% (Phase 3) | 14.4% | 14,400 CITIZEN |
| 1,000,000 CITIZEN | 5% | 16% (Phase 3) | 15.2% | 152,000 CITIZEN |

*You keep custody of your tokens. Delegation does not transfer ownership — you can undelegate at any time (21-day unbonding period).*

### 10.7 Distribution Goals

The protocol explicitly targets geographic diversity through:
- Incentive bonuses for nodes in underserved regions (up to +20% reward boost).
- Maximum cap per region to prevent geographic concentration (no more than 15% of validator power in one country).
- Redundancy targets to ensure network resilience across continents.

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
| Total supply cap | 10,000,000,000 CITIZEN (10 billion) — once minted, no more are created |
| Who can hold? | Anyone with a wallet — verified citizens get extra governance rights |
| Can I buy more? | Yes — there is no limit on how many tokens you hold |

### 13.2 Ways to Invest (Grow Your Holdings)

Citizens have **six concrete ways** to accumulate more CITIZEN tokens and increase the value of the ones they already hold:

#### 1. Staking (Earn New Tokens Every Block)
Lock your CITIZEN in the staking contract and earn a share of **newly minted tokens + transaction fees** every block (~6 seconds). The more you stake, the larger your share.

> *Example: If total staked supply is 10B CITIZEN and you stake 100,000 CITIZEN, you receive 0.001% of every block's rewards.*

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
  ✖ Capped at 10B CITIZEN             ✔ Real income rises each quarter
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
| Your holdings | 100,000 CITIZEN | 132,000 CITIZEN (compounded staking) | 168,000 CITIZEN |
| Network revenue stream | 1 hospital | 3 hospitals + 2 patents | 5 hospitals + 8 patents + 1 factory |
| Your annual yield | ~8% staking only | ~12% staking + infrastructure yield | ~15% all income streams |
| Governance bonus | +1.2x (you vote) | +1.5x (active voter) | +1.8x (delegate + voter) |

*Figures are illustrative. Actual yields depend on total staked supply, network revenue, and governance decisions.*

### 13.5 How Is This Different From Other Crypto?

| Factor | Typical Crypto Token | CITIZEN |
|---|---|---|
| Income source | None — speculative only | Hospitals, patents, factories, fees |
| Supply model | Often inflationary forever | Hard capped at 10B |
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
| Maximum Supply | 10,000,000,000 CITIZEN (10 Trillion ucitizen) |
| Initial Supply | 0 (all tokens are emitted via the staking contract) |
| Supply Model | Capped with declining emission schedule |
| Deflationary Levers | Optional fee burns or buyback (governance vote) |

### 15.2 Emission Schedule

Tokens are emitted on a block-by-block declining schedule across four phases (~6-second blocks, ~5,256,000 blocks/year):

| Phase | Duration | Tokens per Block | Annual Emission | Cumulative Supply |
|---|---|---|---|---|
| Phase 1 (Growth) | Years 0–2 | 475.6 CITIZEN | ~2,500,000,000 | 2.5B → 5B (25–50%) |
| Phase 2 (Maturation) | Years 2–5 | 190.2 CITIZEN | ~1,000,000,000 | 5B → 8B (50–80%) |
| Phase 3 (Stability) | Years 5–10 | 114.2 CITIZEN | ~600,000,000 | 8B → 9.5B (80–95%) |
| Phase 4 (Terminal) | Years 10–15 | 57.1 CITIZEN | ~300,000,000 | 9.5B → 10B (100%) |

### 15.3 Two-Layer Distribution (per block and per revenue stream)

Citizen Ledger uses a two-layer distribution model. Each income type has its own split:

| Income Type | Stakers / Validators | Treasury |
|---|---|---|
| Block emissions | 75% | 25% |
| Transaction fees | 80% | 20% |
| Infrastructure revenue (hospitals, factories) | 40% | 60% |
| Patent / IP royalties | 50% | 50% |
| Slashed tokens | 0% | 100% |

The higher treasury share on infrastructure revenue ensures a compounding reinvestment cycle: treasury builds assets → assets generate revenue → 60% flows back to treasury → treasury builds more assets. After emissions end, the protocol sustains itself through transaction fees and real-world revenue from funded assets.

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
