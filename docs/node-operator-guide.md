# Citizen Ledger – Node Operator Guide

## Overview
This guide covers the full lifecycle of running a validator node on the Citizen Ledger network: hardware requirements, setup, monitoring, staking, and maintenance.

---

## 1. Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU       | 4 cores | 8+ cores (modern x86/ARM64) |
| RAM       | 16 GB   | 32 GB |
| Storage   | 500 GB SSD (NVMe) | 1 TB NVMe |
| Network   | 100 Mbps | 1 Gbps, low latency |
| OS        | Ubuntu 22.04 / Debian 12 | Ubuntu 24.04 LTS |

**Notes:**
- Archive nodes require 2TB+ storage.
- Use dedicated hardware or bare-metal for production validators.
- Cloud VMs are acceptable for testnet.

---

## 2. Software Prerequisites

```bash
# System packages
sudo apt update && sudo apt install -y build-essential git curl jq

# Go (required for wasmd / chain binary)
wget https://go.dev/dl/go1.22.5.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.22.5.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin' >> ~/.bashrc
source ~/.bashrc

# Cosmovisor (optional, for automatic upgrades)
go install cosmossdk.io/tools/cosmovisor/cmd/cosmovisor@latest
```

---

## 3. Chain Binary Setup

```bash
# Clone and build wasmd (or citizen-ledger binary when available)
git clone https://github.com/CosmWasm/wasmd.git
cd wasmd
git checkout v0.53.0  # Use the version matching the network
make install

# Verify installation
wasmd version
```

---

## 4. Node Initialization

```bash
# Initialize the node
MONIKER="your-node-name"
CHAIN_ID="citizen-ledger-1"

wasmd init "$MONIKER" --chain-id "$CHAIN_ID"

# Download genesis file (from the network coordinator)
curl -o ~/.wasmd/config/genesis.json https://raw.githubusercontent.com/citizen-ledger/mainnet/main/genesis.json

# Configure persistent peers
PEERS="node1@ip1:26656,node2@ip2:26656"
sed -i "s/persistent_peers = \"\"/persistent_peers = \"$PEERS\"/" ~/.wasmd/config/config.toml

# Set minimum gas prices
sed -i 's/minimum-gas-prices = ""/minimum-gas-prices = "0.025ucitizen"/' ~/.wasmd/config/app.toml
```

---

## 5. Staking & Becoming a Validator

### 5.1. Citizen Credential Requirement
All validators must hold a valid **Citizenship** credential issued through the credential registry. This ensures only verified citizens can participate in consensus.

### 5.2. Staking via Contract
```bash
# Stake tokens to become eligible
wasmd tx wasm execute $STAKING_CONTRACT \
  '{"stake":{}}' \
  --amount 1000000ucitizen \
  --from validator-key \
  --chain-id citizen-ledger-1 \
  --gas auto --gas-adjustment 1.3
```

### 5.3. Create Validator
```bash
wasmd tx staking create-validator \
  --amount 1000000ucitizen \
  --pubkey $(wasmd tendermint show-validator) \
  --moniker "$MONIKER" \
  --chain-id "$CHAIN_ID" \
  --commission-rate 0.10 \
  --commission-max-rate 0.20 \
  --commission-max-change-rate 0.01 \
  --min-self-delegation 1 \
  --from validator-key \
  --gas auto --gas-adjustment 1.3
```

---

## 6. Monitoring & Metrics

### 6.1. Prometheus Metrics
Enable Prometheus in `config.toml`:
```toml
[instrumentation]
prometheus = true
prometheus_listen_addr = ":26660"
```

### 6.2. Key Metrics to Monitor

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `tendermint_consensus_height` | Current block height | Falling behind > 10 blocks |
| `tendermint_consensus_rounds` | Rounds per height | > 2 rounds indicates issues |
| `tendermint_consensus_validators` | Active validator count | Unexpected changes |
| `tendermint_p2p_peers` | Connected peers | < 3 peers |
| `tendermint_mempool_size` | Pending transactions | > 5000 |
| `process_resident_memory_bytes` | Memory usage | > 80% of available |
| `process_cpu_seconds_total` | CPU usage | 100% sustained > 5 min |

### 6.3. Grafana Dashboard
Import the community Cosmos validator dashboard (ID: `11036`) and add custom panels for:
- Staking rewards claimed
- Slash events (from the staking-emissions contract)
- Emission rate / phase progress
- Uptime percentage

### 6.4. Health Check Script
```bash
#!/bin/bash
# healthcheck.sh – run via cron every minute
STATUS=$(curl -s http://localhost:26657/status)
CATCHING_UP=$(echo "$STATUS" | jq -r '.result.sync_info.catching_up')
LATEST=$(echo "$STATUS" | jq -r '.result.sync_info.latest_block_height')

if [ "$CATCHING_UP" = "true" ]; then
    echo "WARN: Node is catching up. Height: $LATEST"
    # Send alert via webhook
fi

# Check if validator is signing
SIGNING=$(echo "$STATUS" | jq -r '.result.validator_info.voting_power')
if [ "$SIGNING" = "0" ]; then
    echo "CRITICAL: Validator not signing! Power: 0"
fi
```

---

## 7. Slashing Conditions

| Offense | Penalty (BPS) | Description |
|---------|---------------|-------------|
| Double signing | 5000 (50%) | Signing two different blocks at the same height |
| Extended downtime | 1000 (10%) | Missing >500 consecutive blocks |
| Governance abuse | Configurable | Determined via governance proposal |

Slashing is enforced on-chain via the staking-emissions contract's `Slash` execute message, callable by admin/governance.

---

## 8. Reward Distribution

- **Emission Schedule**: Rewards follow the multi-phase emission curve.
- **Staker Rewards**: Proportional to stake via the reward-index model.
- **Treasury Share**: A configurable portion (default 20%) of emissions goes to the treasury.
- **Claiming**: Call `ClaimRewards {}` on the staking-emissions contract.
- **Automatic Distribution**: The `DistributeEmissions {}` message can be called by any keeper bot to trigger per-block emission accounting.

---

## 9. Maintenance

### Upgrades
```bash
# If using cosmovisor:
cosmovisor run start

# Manual upgrade:
# 1. Stop node at the upgrade height
# 2. Replace binary
# 3. Restart
```

### Backups
```bash
# Snapshot the data directory
tar -czf backup-$(date +%Y%m%d).tar.gz ~/.wasmd/data/
```

### Key Management
- Use a hardware security module (HSM) or KMS for validator signing keys.
- Store mnemonic offline in a secure location.
- For key recovery, use the credential registry's `RequestKeyRecovery` flow.

---

## 10. Troubleshooting

| Issue | Solution |
|-------|----------|
| Node won't sync | Check peers, ensure genesis matches, check firewall |
| Validator jailed | Unjail after fixing: `wasmd tx slashing unjail --from key` |
| Out of memory | Increase RAM, enable state-sync pruning |
| Disk full | Enable pruning: `pruning = "custom"`, keep-recent = 100 |
| Slow block times | Check network latency, reduce number of peers |

---

## Support
- GitHub Issues: Report bugs and feature requests
- Discord: Community support channel
- Governance: Propose changes via the voting contract
