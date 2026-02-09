# Citizen Ledger – CosmWasm Smart Contracts

A citizen-led, identity-gated blockchain for transparent governance, treasury management, and community-funded research. Built on Cosmos SDK with CosmWasm smart contracts.

## Architecture

```
citizen-ledger/
├── Cargo.toml                  # Workspace root
├── packages/
│   └── citizen-common/         # Shared types, errors, and helpers
├── contracts/
│   ├── credential-registry/    # ZK credential issuance & verification
│   ├── treasury/               # Community treasury with category allocations
│   ├── voting/                 # Governance proposals + 1P1V & quadratic voting
│   ├── grants/                 # Milestone-based grant funding
│   └── staking-emissions/      # Token staking + capped supply emissions
├── tests/
│   └── integration/            # Cross-contract integration tests (cw-multi-test)
├── scripts/
│   ├── deploy.sh               # Full deployment script for wasmd
│   └── local-testnet.sh        # Single-node local testnet setup
├── frontend/                   # Next.js + TypeScript + Tailwind UI
│   ├── src/app/                # App router pages (governance, treasury, grants, staking, identity)
│   ├── src/hooks/              # CosmJS wallet & contract hooks (Zustand)
│   └── src/config/             # Chain config + Keplr integration
└── .github/workflows/ci.yml   # GitHub Actions CI pipeline
```

## Contracts

| Contract | Description | Key Features |
|---|---|---|
| **credential-registry** | Privacy-preserving identity credentials | ZK proof commitment, issuer management, expiry/revocation |
| **treasury** | Community fund management | Category allocations (bps), deposit, governance-authorized spend, full audit trail |
| **voting** | Governance proposals and voting | One-person-one-vote, quadratic voting, credential-gated, quorum + threshold |
| **grants** | Milestone-based grant funding | Apply → approve → submit evidence → release funds, cross-contract treasury spend |
| **staking-emissions** | Token economics | Capped supply, phased emission curve, staking rewards, treasury share |

## Chain Parameters

| Parameter | Value |
|---|---|
| Chain Name | citizen-ledger |
| Chain ID | citizen-ledger-1 |
| Bech32 Prefix | citizen |
| Native Denom | ucitizen |

## Prerequisites

- **Rust** ≥ 1.80 with `wasm32-unknown-unknown` target
- **Go** ≥ 1.21 (for chain daemon, future)
- **Node.js** ≥ 18 (for frontend)

## Build & Test

```bash
# Check compilation
cargo check --workspace

# Run all tests (18 unit + 17 integration = 35 total)
cargo test --workspace

# Build optimized wasm binaries
cargo build --target wasm32-unknown-unknown --release
```

## Test Results

**35 tests pass** across the workspace:

| Crate | Tests | Coverage |
|---|---|---|
| credential-registry | 5 | Instantiate, issue, unauthorized, revoke, issuer management |
| treasury | 4 | Instantiate, deposit, unauthorized spend, invalid allocations |
| voting | 4 | Create proposal, 1P1V vote, double-vote rejection, tally |
| grants | 2 | Apply, full approve + milestone flow |
| staking-emissions | 3 | Instantiate, stake, emission rate |
| **integration** | **17** | Cross-contract: credential→voting, treasury governance, grants lifecycle, full end-to-end flow |

## Frontend

```bash
cd frontend
cp .env.example .env.local  # edit contract addresses
npm install
npm run dev                  # → http://localhost:3000
```

Pages: Dashboard, Governance, Treasury, Grants, Staking, Identity

## Deployment

```bash
# 1. Start local testnet
cd scripts && bash local-testnet.sh
wasmd start --home ~/.citizen-ledger

# 2. Deploy all contracts
bash deploy.sh  # outputs deployed-addresses.json
```

## Token Economics

- **Max Supply**: Capped (configurable at instantiation)
- **Emission Curve**: Multi-phase with decreasing tokens-per-block
- **Treasury Share**: Configurable percentage of emissions goes to community treasury
- **Staking**: Standard reward-index model for proportional distribution

## Related Documents

- [Whitepaper](../whitepaper-outline.md)
- [Technical Design](../technical-design.md)
- [Roadmap (50-step build plan)](../roadmap.md)
