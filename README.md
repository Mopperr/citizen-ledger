# Citizen Ledger

[![CI](https://github.com/Mopperr/citizen-ledger/actions/workflows/ci.yml/badge.svg)](https://github.com/Mopperr/citizen-ledger/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Rust](https://img.shields.io/badge/Rust-1.80%2B-orange.svg)](https://www.rust-lang.org/)
[![CosmWasm](https://img.shields.io/badge/CosmWasm-2.2-blue.svg)](https://cosmwasm.com/)

**Governance by the People. Funded by the People. Built for the People.**

A citizen-led blockchain network that verifies eligibility through privacy-preserving credentials, enables inclusive governance through one-person-one-vote, and funds public-benefit initiatives through a programmable on-chain treasury. Built on Cosmos SDK with CosmWasm smart contracts.

## 🌟 Key Features

- **🔐 Privacy-Preserving Identity** — ZK proof credentials without storing personal data on-chain
- **🗳️ Fair Governance** — One-person-one-vote (no plutocracy) + quadratic voting for funding
- **💰 Transparent Treasury** — Category-based allocations with real-time public tracking
- **🎯 Milestone Grants** — Evidence-verified disbursements for research & infrastructure
- **📈 Sustainable Tokenomics** — Capped supply with declining emission curve

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

**37 tests pass** across the workspace:

| Crate | Tests | Coverage |
|---|---|---|
| credential-registry | 5 | Instantiate, issue, unauthorized, revoke, issuer management |
| treasury | 4 | Instantiate, deposit, unauthorized spend, invalid allocations |
| voting | 4 | Create proposal, 1P1V vote, double-vote rejection, tally |
| grants | 2 | Apply, full approve + milestone flow |
| staking-emissions | 5 | Instantiate, stake, emission rate, supply cap, schedule |
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

## Additional Resources

| Resource | Description |
|---|---|
| [Faucet](faucet/) | Testnet token faucet service (Node.js) |
| [Chain Registry](chain-registry/) | Cosmos chain-registry format metadata |
| [Indexer](indexer/) | PostgreSQL indexer schema |
| [Schemas](schema/) | JSON schemas for all contract messages |

## Documentation

| Document | Description |
|---|---|
| [Whitepaper](../whitepaper-outline.md) | Project vision and governance philosophy |
| [Technical Design](../technical-design.md) | Architecture and implementation details |
| [Roadmap](../roadmap.md) | 50-step build plan |
| [Testnet Launch Guide](docs/testnet-launch-guide.md) | Step-by-step testnet deployment |
| [Node Operator Guide](docs/node-operator-guide.md) | Running a validator node |
| [Mainnet Launch Plan](docs/mainnet-launch-plan.md) | Production deployment checklist |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`cargo test --workspace`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
