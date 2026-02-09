# Citizen Ledger — Testnet → Mainnet Checklist

> Every step needed to take the project from local development to public testnet to mainnet.
> Status: ✅ Done | 🟡 Partially Done | ⬜ Not Started

---

## Phase 0: Local Development (Current State)

### What You Have Now
- ✅ 5 CosmWasm contracts (credential-registry, treasury, voting, grants, staking-emissions)
- ✅ Rust workspace with cosmwasm-std 2.2, unit tests, shared types
- ✅ Docker single-node local testnet (`docker-compose.yml`)
- ✅ Local deploy script (`scripts/deploy-local.sh`)
- ✅ Production deploy script (`scripts/deploy.sh`) with CLI args
- ✅ Deterministic wasm optimizer (`scripts/optimize.sh` / `optimize.bat`)
- ✅ Next.js dashboard with 8 pages, wallet integration (Keplr + Leap)
- ✅ GitHub CI (contracts lint/test/build + frontend lint/build)
- ✅ Whitepaper, technical design, roadmap docs
- ✅ Public testnet genesis script (`scripts/public-testnet-genesis.sh`)
- ✅ Node operator guide, security checklist, mainnet launch plan docs
- ✅ Reward keeper bot (`scripts/reward-keeper.py`)
- ✅ Prometheus + node_exporter monitoring setup (`scripts/setup-metrics.sh`)

---

## Phase 1: Contract Hardening (Pre-Testnet)

These must be done BEFORE deploying a public testnet.

### 1.1 Integration Tests
- ⬜ **Write full integration test suite** using `cw-multi-test`
  - Credential issuance → voting eligibility flow
  - Proposal create → vote → pass → timelock → execute flow
  - Treasury deposit → allocation check → category spend flow
  - Grant apply → approve → submit milestone → verify → disburse flow
  - Staking stake → earn rewards → claim → unstake flow
  - Cross-contract calls (voting → treasury execution)
  - Edge cases: expired credentials, double voting, quorum failure, overspend
- ⬜ **Run integration tests in CI** — add to `.github/workflows/ci.yml`

### 1.2 Contract Audit Prep
- ⬜ **Run `cargo clippy` with all warnings** — fix everything
- ⬜ **Run `cargo audit`** — check dependency vulnerabilities
- ⬜ **Add overflow checks** — verify all arithmetic uses checked math (already `overflow-checks = true` in release profile ✅)
- ⬜ **Review access control** — every admin/governance-only function properly gated
- ⬜ **Review input validation** — all user inputs bounded and sanitized
- ⬜ **Add migration handlers** — each contract needs `migrate()` entry point for upgradability
- ⬜ **Document all entry points** — generate final JSON schemas (`scripts/generate-schemas.sh`)
- ⬜ **Freeze contract API** — no more breaking changes to execute/query messages

### 1.3 Optimized Builds
- ⬜ **Run deterministic optimizer** — `scripts/optimize.bat` (Windows) or `optimize.sh` (Linux)
- ⬜ **Verify checksums are reproducible** — build twice, compare `artifacts/checksums.txt`
- ⬜ **Record checksums in repo** — commit `artifacts/checksums.txt` for auditability
- ⬜ **Test optimized wasm** — deploy optimized binaries to local testnet and re-run smoke tests

---

## Phase 2: Public Testnet Launch

### 2.1 Infrastructure Setup

#### Server (VPS) — You need at least 1 server
- ⬜ **Rent a VPS** — Hetzner, DigitalOcean, or Contabo
  - Minimum: 4 CPU, 8 GB RAM, 200 GB SSD, Ubuntu 22.04
  - Cost: ~£15–30/month
- ⬜ **Install wasmd binary** — build from source or download release
  ```bash
  git clone https://github.com/CosmWasm/wasmd.git
  cd wasmd && git checkout v0.54.0
  make install
  ```
- ⬜ **Open firewall ports**
  - 26656 (P2P)
  - 26657 (RPC)
  - 1317 (REST API)
  - 9090 (gRPC)
  - 443 (HTTPS reverse proxy)

#### Domain & SSL
- ⬜ **Register a domain** (e.g., `citizenledger.io` or `citizen-ledger.network`)
- ⬜ **Set up DNS records**
  - `rpc.citizenledger.io` → VPS IP
  - `rest.citizenledger.io` → VPS IP
  - `app.citizenledger.io` → Vercel (frontend)
  - `faucet.citizenledger.io` → VPS IP (faucet service)
  - `explorer.citizenledger.io` → explorer service
- ⬜ **Install Nginx + Certbot** for HTTPS reverse proxy
  ```bash
  apt install nginx certbot python3-certbot-nginx
  certbot --nginx -d rpc.citizenledger.io -d rest.citizenledger.io
  ```
- ⬜ **Configure Nginx** to proxy:
  - `rpc.citizenledger.io` → `localhost:26657`
  - `rest.citizenledger.io` → `localhost:1317`

### 2.2 Genesis Configuration

- ⬜ **Choose testnet chain ID** — `citizen-testnet-1`
- ⬜ **Run genesis script** with production parameters
  ```bash
  ./scripts/public-testnet-genesis.sh citizen-testnet-1 1
  ```
- ⬜ **Customize genesis parameters**
  - Block time: 5s (testnet) → 6s (mainnet)
  - Denom: `ucitizen`
  - Bech32 prefix: `citizen` (change from `wasm` for production)
  - Wasm upload: `Everybody` (testnet) / `OnlyAddress` (mainnet)
  - Slashing: conservative for testnet
- ⬜ **Create genesis accounts**
  - Faucet account: large balance for distributing test tokens
  - Admin/deployer account: for contract deployment
  - Reserve account: protocol reserve
- ⬜ **Secure key storage** — export keys from test keyring to encrypted file keyring
  ```bash
  wasmd keys add admin --keyring-backend file
  ```

### 2.3 Start Testnet Node

- ⬜ **Initialize and start the node**
  ```bash
  wasmd start --home ~/.citizen-testnet/validator-0 \
    --rpc.laddr tcp://0.0.0.0:26657 \
    --api.enable --api.address tcp://0.0.0.0:1317 \
    --grpc.address 0.0.0.0:9090
  ```
- ⬜ **Create systemd service** for auto-restart
  ```ini
  [Unit]
  Description=Citizen Ledger Testnet Node
  After=network.target

  [Service]
  User=citizen
  ExecStart=/usr/local/bin/wasmd start --home /home/citizen/.citizen-testnet/validator-0
  Restart=on-failure
  RestartSec=5
  LimitNOFILE=65535

  [Install]
  WantedBy=multi-user.target
  ```
- ⬜ **Verify node is syncing** — `wasmd status --node http://localhost:26657`

### 2.4 Deploy Contracts to Testnet

- ⬜ **Build optimized wasm** — run optimizer on VPS or upload pre-built artifacts
- ⬜ **Deploy all 5 contracts**
  ```bash
  ./scripts/deploy.sh --chain-id citizen-testnet-1 --node http://localhost:26657 --keyname admin
  ```
- ⬜ **Save deployed addresses** — `deployed-addresses.json` generated automatically
- ⬜ **Smoke test every contract** (as per `docs/testnet-launch-guide.md`)
  - Issue a credential
  - Create and vote on a proposal
  - Deposit to treasury, check allocations
  - Submit a grant application
  - Stake tokens, check rewards

### 2.5 Testnet Faucet

- ⬜ **Build a faucet service** — simple HTTP server that sends test tokens
  - Input: recipient address
  - Output: tx hash
  - Rate limit: 1 request per address per 24 hours
  - Amount: 10,000 CITIZEN per request
- ⬜ **Deploy faucet** behind `faucet.citizenledger.io`
- ⬜ **Add faucet link** to frontend dashboard

### 2.6 Block Explorer

- ⬜ **Deploy Ping.pub or Big Dipper** — open-source Cosmos explorers
  - Ping.pub is lightweight: [github.com/ping-pub/explorer](https://github.com/ping-pub/explorer)
  - Configure chain JSON with your RPC/REST endpoints
- ⬜ **Host at** `explorer.citizenledger.io`

### 2.7 Frontend Deployment

- ⬜ **Deploy to Vercel** — connect GitHub repo
  - Root directory: `frontend`
  - Framework: Next.js (auto-detected)
- ⬜ **Set environment variables** in Vercel dashboard:
  ```
  NEXT_PUBLIC_CHAIN_ID=citizen-testnet-1
  NEXT_PUBLIC_RPC_ENDPOINT=https://rpc.citizenledger.io
  NEXT_PUBLIC_REST_ENDPOINT=https://rest.citizenledger.io
  NEXT_PUBLIC_BECH32_PREFIX=citizen
  NEXT_PUBLIC_CREDENTIAL_REGISTRY=<address>
  NEXT_PUBLIC_TREASURY=<address>
  NEXT_PUBLIC_VOTING=<address>
  NEXT_PUBLIC_GRANTS=<address>
  NEXT_PUBLIC_STAKING_EMISSIONS=<address>
  ```
- ⬜ **Custom domain** — point `app.citizenledger.io` to Vercel
- ⬜ **Verify wallet connection** works with testnet chain config (Keplr suggest chain)

### 2.8 Monitoring & Observability

- ⬜ **Run setup-metrics.sh** on VPS — installs Prometheus + node_exporter
- ⬜ **Install Grafana** — dashboard for chain metrics
  ```bash
  apt install grafana
  systemctl enable grafana-server
  ```
- ⬜ **Import Cosmos dashboard** — pre-built Grafana dashboard for CometBFT
- ⬜ **Set up alerts** — PagerDuty/Discord webhook for node down, low peers, missed blocks
- ⬜ **Start reward keeper** — `scripts/reward-keeper.py` distributes staking rewards
  ```bash
  cp scripts/reward-keeper.env.example /etc/citizen/reward-keeper.env
  # Edit env vars, then:
  systemctl enable citizen-reward-keeper
  ```

### 2.9 Indexer

- ⬜ **Set up PostgreSQL** — for event indexing
  ```bash
  apt install postgresql
  psql -f indexer/schema.sql
  ```
- ⬜ **Configure indexer** — update `indexer/config.toml` with testnet endpoints
- ⬜ **Run indexer service** — captures all contract events for the transparency dashboard

### 2.10 Chain Registry (Optional for Testnet)

- ⬜ **Create chain registry JSON** — follow [cosmos/chain-registry](https://github.com/cosmos/chain-registry) format
  ```json
  {
    "chain_name": "citizenledgertestnet",
    "chain_id": "citizen-testnet-1",
    "bech32_prefix": "citizen",
    "slip44": 118,
    "apis": {
      "rpc": [{"address": "https://rpc.citizenledger.io"}],
      "rest": [{"address": "https://rest.citizenledger.io"}]
    }
  }
  ```
- ⬜ **Submit PR to cosmos/chain-registry** (testnets folder)

---

## Phase 3: Testnet Validation Period

Run the testnet for **at least 4–8 weeks** before considering mainnet.

### 3.1 Functional Testing
- ⬜ **Full credential lifecycle** — issue, verify, expire, revoke, re-issue
- ⬜ **Full governance cycle** — create proposal → vote → pass → timelock → execute (multiple rounds)
- ⬜ **Full grants cycle** — apply → approve → submit milestone → verify → disburse → complete
- ⬜ **Staking full cycle** — stake → earn rewards → claim → unstake → unbonding → withdraw
- ⬜ **Treasury operations** — deposit, check allocations, category spending, allocation updates via governance
- ⬜ **Edge cases** — expired proposals, failed quorum, rejected grants, credential revocation during vote
- ⬜ **Multi-user testing** — multiple citizens voting simultaneously, concurrent grant applications

### 3.2 Stress Testing
- ⬜ **Load test with 100+ accounts** — script to create accounts, issue credentials, submit votes
- ⬜ **Measure gas usage** — document gas costs for every transaction type
- ⬜ **Test block fullness** — what happens at high transaction throughput
- ⬜ **Memory/disk growth** — monitor node resource usage over time

### 3.3 Upgrade Testing
- ⬜ **Test contract migration** — deploy v1, then migrate to v2 with a code change
- ⬜ **Test chain halt/restart** — stop node, restart, verify state intact
- ⬜ **Test state export/import** — `wasmd export` → modify → `wasmd start` with new genesis
- ⬜ **Test key recovery** — restore validator from mnemonic on fresh machine

### 3.4 Community Feedback
- ⬜ **Invite beta testers** — share testnet faucet + dashboard URL
- ⬜ **Collect UI/UX feedback** — what's confusing, what's missing
- ⬜ **Fix bugs found** during testing
- ⬜ **Document known issues** and limitations

---

## Phase 4: Security (Pre-Mainnet)

### 4.1 Smart Contract Audit
- ⬜ **Engage an auditor** — Options (Cosmos/CosmWasm specialists):
  - [Oak Security](https://oaksecurity.io/) — CosmWasm specialists
  - [SCV Security](https://www.scvsecurity.com/) — Cosmos ecosystem
  - [Halborn](https://halborn.com/) — general smart contract audit
  - Budget: £10k–50k depending on scope
- ⬜ **Prepare audit package**
  - All contract source code
  - Architecture documentation (technical-design.md)
  - JSON schemas for all messages
  - Integration test suite
  - Known risks and assumptions
- ⬜ **Receive audit report** — fix all Critical and High findings
- ⬜ **Re-audit fixes** if significant changes were needed
- ⬜ **Publish audit report** to repo

### 4.2 Security Hardening
- ⬜ **Complete security-review-checklist.md** — all items green
- ⬜ **Complete privacy-review-checklist.md** — all items green
- ⬜ **Set up bug bounty program** — Immunefi or similar
  - Critical: up to $50,000
  - High: up to $10,000
  - Medium: up to $2,000
- ⬜ **Penetration test the frontend** — XSS, CSRF, wallet injection attacks
- ⬜ **Harden VPS** — SSH keys only, fail2ban, unattended upgrades, firewall

### 4.3 Key Management
- ⬜ **Generate mainnet admin keys** using hardware wallet (Ledger) or multi-sig
- ⬜ **Set up multi-sig** for admin operations (2-of-3 minimum)
- ⬜ **Plan admin key transition** — contracts start with admin key, governance votes to remove admin (fully decentralized)
- ⬜ **Document key recovery procedures**
- ⬜ **Backup validator keys** — encrypted, offline, geographically distributed

---

## Phase 5: Mainnet Preparation

### 5.1 Final Contract Build
- ⬜ **Freeze contract code** — no more changes after audit completion
- ⬜ **Deterministic build** — `scripts/optimize.bat` to produce final wasm binaries
- ⬜ **Record final checksums** — publish in release notes
- ⬜ **Tag release** — `git tag v1.0.0` and push

### 5.2 Genesis Configuration
- ⬜ **Choose mainnet chain ID** — `citizen-ledger-1`
- ⬜ **Set mainnet parameters**

  | Parameter | Testnet | Mainnet |
  |---|---|---|
  | Chain ID | `citizen-testnet-1` | `citizen-ledger-1` |
  | Block time | 5s | 6s |
  | Bech32 prefix | `citizen` | `citizen` |
  | Wasm upload | `Everybody` | `OnlyAddress` (governance) |
  | Voting period | 50,000 blocks (~3 days) | 604,800 blocks (~7 days) |
  | Quorum | 20% | 20% |
  | Pass threshold | 50% | 50% |
  | Timelock | 10,000 blocks (~14 hrs) | 86,400 blocks (~6 days) |
  | Slashing (double sign) | 5% | 5% |
  | Slashing (downtime) | 1% | 1% |

- ⬜ **Define genesis accounts**

  | Account | Amount | Purpose |
  |---|---|---|
  | Validator(s) | 100B ucitizen each | Validator stake + gas |
  | Faucet | 0 (no faucet on mainnet) | — |
  | Reserve | 100B ucitizen | Protocol reserve |
  | Staking contract | Minting rights | Emission schedule controller |

- ⬜ **Generate genesis.json** — validated with `wasmd genesis validate`

### 5.3 Infrastructure (Production)
- ⬜ **Production VPS** — minimum 2 servers for redundancy
  - Primary validator: 8 CPU, 32 GB RAM, 500 GB NVMe SSD
  - Sentry node: 4 CPU, 16 GB RAM, 200 GB SSD (DDoS protection)
- ⬜ **Sentry node architecture** — validator connects only to sentry nodes, never directly exposed
- ⬜ **Configure firewall** — validator P2P port open only to sentry IPs
- ⬜ **Set up automated backups** — daily state snapshots to off-site storage
- ⬜ **Production Nginx config** — rate limiting, WebSocket support for RPC
- ⬜ **Production monitoring** — Grafana + Prometheus + alerting to phone/Discord

### 5.4 Deployment Order (Mainnet Day)

Follow exactly this sequence:

```
 1. Start validator node with genesis
 2. Wait for first blocks (chain is live)
 3. Store credential-registry wasm → get code_id
 4. Store treasury wasm → get code_id
 5. Store voting wasm → get code_id
 6. Store grants wasm → get code_id
 7. Store staking-emissions wasm → get code_id
 8. Instantiate credential-registry (no dependencies)
 9. Instantiate treasury (admin = deployer initially)
10. Instantiate voting (depends on credential-registry)
11. Update treasury governance → voting contract
12. Instantiate grants (depends on voting + treasury)
13. Instantiate staking-emissions (depends on treasury)
14. Verify all contracts respond to queries
15. Issue first credential (admin self-credential for testing)
16. Create first governance proposal (smoke test)
17. Update frontend env vars → redeploy Vercel
18. Announce mainnet launch
```

### 5.5 Documentation
- ⬜ **Finalize whitepaper** — version 1.0, PDF generation
- ⬜ **Finalize node operator guide** — mainnet-specific instructions
- ⬜ **Create user guide** — how to connect wallet, vote, apply for grants, stake
- ⬜ **Landing page content** — update homepage for mainnet launch
- ⬜ **FAQ document** — common questions for users and node operators

---

## Phase 6: Mainnet Launch

### 6.1 Launch Day (T-0)

Timeline from `docs/mainnet-launch-plan.md`:

| Time | Action |
|---|---|
| T-7 days | Final security review, freeze code, build optimized wasm |
| T-3 days | Generate genesis, distribute to validators |
| T-1 day | Validators confirm genesis hash matches, dry run start |
| T-0 hour | All validators start nodes simultaneously |
| T+10 min | Verify chain producing blocks, check explorer |
| T+30 min | Deploy contracts via `deploy.sh` |
| T+1 hour | Verify all contracts, issue first credentials |
| T+2 hours | Update frontend env vars, point domain to Vercel |
| T+3 hours | Public announcement — chain and dashboard are live |

### 6.2 Post-Launch Week 1
- ⬜ **Monitor 24/7** — chain health, block production, missed blocks
- ⬜ **Issue credentials** to early community members
- ⬜ **First governance vote** — a simple parameter change to validate the full cycle
- ⬜ **First treasury deposit** — seed the treasury with initial funds
- ⬜ **Verify staking rewards** — keeper bot distributing correctly
- ⬜ **Fix any bugs** found during live operation

### 6.3 Post-Launch Month 1
- ⬜ **Onboard more validators** — distribute node operator guide, provide support
- ⬜ **Geographic diversity** — recruit nodes in different regions
- ⬜ **First grant cycle** — accept grant applications, community votes
- ⬜ **Community building** — Discord, Twitter/X, Telegram
- ⬜ **Publish monthly transparency report**
- ⬜ **IBC integration** — connect to Cosmos Hub / Osmosis for liquidity (v2 roadmap)

### 6.4 Post-Launch Month 3
- ⬜ **Governance maturity** — admin key removal vote (full decentralization)
- ⬜ **First research grant funded** and underway
- ⬜ **Token listed** on DEX (Osmosis via IBC)
- ⬜ **Chain registry PR** merged (cosmos/chain-registry mainnet)
- ⬜ **Second security audit** — post-launch review of any changes
- ⬜ **V2 roadmap** governance proposal

---

## Cost Estimates

| Item | Estimated Cost | When |
|---|---|---|
| VPS (testnet, 1 server) | £15–30/month | Phase 2 |
| Domain name | £10–30/year | Phase 2 |
| Smart contract audit | £10,000–50,000 | Phase 4 |
| VPS (mainnet, 2 servers) | £80–200/month | Phase 5 |
| Bug bounty pool | £5,000–50,000 | Phase 4 |
| Vercel hosting | Free (hobby) / £20/month (pro) | Phase 2 |
| Block explorer hosting | Free (self-hosted on VPS) | Phase 2 |

**Minimum viable launch budget: ~£200/month + one-time audit cost.**
Without audit (acceptable for early testnet): **~£50/month.**

---

## Quick Reference: What to Do Right Now

### Immediate Next Steps (This Week)
1. **Write integration tests** — the biggest gap in the codebase
2. **Run the optimizer** — `scripts/optimize.bat` to verify deterministic builds work
3. **Deploy to Vercel** — free, takes 5 minutes, gives you a live URL now
4. **Add `migrate()` entry points** to all 5 contracts

### Next Month
5. **Rent a VPS** and set up public testnet
6. **Build a simple faucet** service
7. **Deploy block explorer** (Ping.pub)
8. **Run testnet validation** for 4–8 weeks

### Before Mainnet
9. **Get contracts audited**
10. **Set up multi-sig** for admin keys
11. **Harden infrastructure** (sentry nodes, backups, monitoring)
12. **Launch mainnet** following the T-7 → T-0 timeline

---

*This document is a living checklist. Update status markers as items are completed.*
