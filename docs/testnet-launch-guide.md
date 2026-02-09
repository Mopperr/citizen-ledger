# Citizen Ledger — Testnet Launch Guide

Step-by-step instructions to launch and validate the Citizen Ledger testnet,
from genesis to full contract deployment and end-to-end smoke tests.

---

## Prerequisites

| Component        | Version    | Check Command           |
|------------------|------------|-------------------------|
| Go               | ≥ 1.22     | `go version`            |
| Rust             | ≥ 1.80     | `rustc --version`       |
| wasmd            | ≥ 0.53     | `wasmd version`         |
| jq               | any        | `jq --version`          |
| Node.js (opt)    | ≥ 18       | `node --version`        |

---

## Phase 1: Build Contracts

```bash
cd citizen-ledger

# Build all contracts for wasm target
cargo build --release --target wasm32-unknown-unknown

# Verify all 5 .wasm files exist
ls -la target/wasm32-unknown-unknown/release/*.wasm

# Expected:
#   credential_registry.wasm
#   treasury.wasm
#   voting.wasm
#   grants.wasm
#   staking_emissions.wasm

# Run all tests before deploying
cargo test --workspace
# Expected: 37 tests passed
```

---

## Phase 2: Launch Local Testnet

```bash
cd scripts

# Launch single-node testnet (resets if exists)
chmod +x local-testnet.sh
./local-testnet.sh

# This will:
#   1. Initialize wasmd chain "citizen-ledger-1"
#   2. Create admin + 3 citizen test keys
#   3. Fund genesis accounts
#   4. Start the node

# Verify chain is running:
curl -s http://localhost:26657/status | jq '.result.sync_info.latest_block_height'
```

### Key Addresses Created

| Key       | Role                    | Funded Amount          |
|-----------|-------------------------|------------------------|
| admin     | Chain admin + deployer  | 10,000,000,000,000 ucitizen |
| citizen1  | Test citizen            | 10,000,000,000 ucitizen |
| citizen2  | Test citizen            | 10,000,000,000 ucitizen |
| citizen3  | Test citizen            | 10,000,000,000 ucitizen |

---

## Phase 3: Deploy Contracts

```bash
# Deploy all 5 contracts
chmod +x deploy.sh
./deploy.sh --chain-id citizen-ledger-1 --node http://localhost:26657 --keyname admin

# The script will output all contract addresses. Save them:
# CREDENTIAL_REGISTRY=citizen1...
# TREASURY=citizen1...
# VOTING=citizen1...
# GRANTS=citizen1...
# STAKING_EMISSIONS=citizen1...
```

---

## Phase 4: Smoke Tests

Run these manually or create a smoke-test script to validate the full deployment.

### 4.1 Credential Registry

```bash
# Query config
wasmd query wasm contract-state smart $CREDENTIAL_REGISTRY '{"config":{}}' --node http://localhost:26657

# Issue a citizenship credential
wasmd tx wasm execute $CREDENTIAL_REGISTRY '{
  "issue_credential": {
    "holder": "'$(wasmd keys show citizen1 -a --keyring-backend test)'",
    "credential_type": "Citizenship",
    "expires_at": null,
    "metadata": "test-credential"
  }
}' --from admin --chain-id citizen-ledger-1 --gas auto --gas-adjustment 1.4 --gas-prices 0.025ucitizen -y --keyring-backend test

# Verify credential
wasmd query wasm contract-state smart $CREDENTIAL_REGISTRY '{
  "has_valid_credential": {
    "holder": "'$(wasmd keys show citizen1 -a --keyring-backend test)'",
    "credential_type": "Citizenship"
  }
}' --node http://localhost:26657
# Expected: {"has_credential": true}
```

### 4.2 Treasury

```bash
# Check balance
wasmd query wasm contract-state smart $TREASURY '{"balance":{}}' --node http://localhost:26657

# Deposit funds into treasury
wasmd tx wasm execute $TREASURY '{"deposit":{}}' \
  --from admin --amount 1000000000ucitizen \
  --chain-id citizen-ledger-1 --gas auto --gas-adjustment 1.4 --gas-prices 0.025ucitizen -y --keyring-backend test

# Verify balance increased
wasmd query wasm contract-state smart $TREASURY '{"balance":{}}' --node http://localhost:26657
```

### 4.3 Governance

```bash
# Create a proposal
wasmd tx wasm execute $VOTING '{
  "create_proposal": {
    "title": "Test Proposal",
    "description": "First testnet proposal",
    "voting_method": "OnePersonOneVote"
  }
}' --from admin --chain-id citizen-ledger-1 --gas auto --gas-adjustment 1.4 --gas-prices 0.025ucitizen -y --keyring-backend test

# List proposals
wasmd query wasm contract-state smart $VOTING '{"list_proposals":{"limit":10}}' --node http://localhost:26657

# Cast vote (citizen1 must have credential)
wasmd tx wasm execute $VOTING '{
  "cast_vote": {"proposal_id": 1, "vote": "Yes"}
}' --from citizen1 --chain-id citizen-ledger-1 --gas auto --gas-adjustment 1.4 --gas-prices 0.025ucitizen -y --keyring-backend test
```

### 4.4 Grants

```bash
# Apply for a grant
wasmd tx wasm execute $GRANTS '{
  "apply": {
    "title": "Test Grant",
    "description": "First testnet grant application",
    "category": "research",
    "milestones": [
      {"description": "Phase 1 - Research", "amount": "1000000"},
      {"description": "Phase 2 - Implementation", "amount": "2000000"}
    ]
  }
}' --from citizen1 --chain-id citizen-ledger-1 --gas auto --gas-adjustment 1.4 --gas-prices 0.025ucitizen -y --keyring-backend test

# List grants
wasmd query wasm contract-state smart $GRANTS '{"list_grants":{"limit":10}}' --node http://localhost:26657
```

### 4.5 Staking & Emissions

```bash
# Check supply
wasmd query wasm contract-state smart $STAKING_EMISSIONS '{"supply":{}}' --node http://localhost:26657

# Stake tokens
wasmd tx wasm execute $STAKING_EMISSIONS '{"stake":{}}' \
  --from citizen1 --amount 1000000000ucitizen \
  --chain-id citizen-ledger-1 --gas auto --gas-adjustment 1.4 --gas-prices 0.025ucitizen -y --keyring-backend test

# Check staker info
wasmd query wasm contract-state smart $STAKING_EMISSIONS '{
  "staker": {"address": "'$(wasmd keys show citizen1 -a --keyring-backend test)'"}
}' --node http://localhost:26657
```

---

## Phase 5: Frontend Connection

```bash
cd frontend

# Create .env.local with contract addresses
cat > .env.local << EOF
NEXT_PUBLIC_RPC_ENDPOINT=http://localhost:26657
NEXT_PUBLIC_REST_ENDPOINT=http://localhost:1317
NEXT_PUBLIC_CREDENTIAL_REGISTRY=$CREDENTIAL_REGISTRY
NEXT_PUBLIC_TREASURY=$TREASURY
NEXT_PUBLIC_VOTING=$VOTING
NEXT_PUBLIC_GRANTS=$GRANTS
NEXT_PUBLIC_STAKING_EMISSIONS=$STAKING_EMISSIONS
EOF

# Install dependencies and run
npm install
npm run dev

# Open http://localhost:3000
# Navigate to Transparency page — should show live chain data
```

---

## Phase 6: Monitoring Setup

```bash
cd scripts

# Setup Prometheus + node_exporter (Linux only)
chmod +x setup-metrics.sh
sudo ./setup-metrics.sh

# Verify:
#   Prometheus: http://localhost:9090
#   Node metrics: http://localhost:9100/metrics
#   Chain metrics: http://localhost:26660/metrics
```

---

## Phase 7: Keeper Bot

```bash
cd scripts

# Configure the keeper
cp reward-keeper.env.example .env
# Edit .env with actual contract address and keeper mnemonic

# Run keeper
pip install httpx python-dotenv
python3 reward-keeper.py

# Or install as systemd service:
sudo cp citizen-reward-keeper.service /etc/systemd/system/
sudo systemctl enable --now citizen-reward-keeper
```

---

## Validation Checklist

| Test                                | Expected                     | Status |
|-------------------------------------|------------------------------|--------|
| Chain starts and produces blocks    | Height incrementing          | ⬜     |
| All 5 contracts store successfully  | 5 code IDs returned          | ⬜     |
| All 5 contracts instantiate         | 5 contract addresses         | ⬜     |
| Issue credential → query valid      | `has_credential: true`       | ⬜     |
| Treasury deposit → balance increased| Balance reflects deposit     | ⬜     |
| Create proposal → list proposals    | Proposal visible             | ⬜     |
| Cast vote → tally proposal          | Vote counted, status updates | ⬜     |
| Apply grant → list grants           | Grant visible with milestones| ⬜     |
| Stake tokens → check staker info    | Stake amount recorded        | ⬜     |
| Frontend loads transparency page    | Stats displayed              | ⬜     |
| Keeper bot distributes rewards      | Distribution tx confirmed    | ⬜     |
| Prometheus scrapes metrics          | Targets UP in Prometheus     | ⬜     |

---

## Troubleshooting

| Problem                          | Solution                                                   |
|----------------------------------|------------------------------------------------------------|
| `wasmd: command not found`       | Install wasmd: `go install github.com/CosmWasm/wasmd/cmd/wasmd@latest` |
| Wasm files not found             | Run `cargo build --release --target wasm32-unknown-unknown` |
| "account not found"              | Genesis account not funded — re-run local-testnet.sh       |
| "out of gas"                     | Increase `--gas-adjustment` to 2.0                         |
| Port 26657 refused               | Chain not running — start with `wasmd start --home ~/.citizen-ledger` |
| Frontend shows "—" for all stats | Set contract addresses in `.env.local` and restart dev server |
| Keeper "STAKING_CONTRACT required"| Set env vars in `.env` file                                |

---

*Citizen Ledger — Testnet Launch Guide v1.0*
