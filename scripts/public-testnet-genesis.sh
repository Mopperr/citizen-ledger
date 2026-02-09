#!/bin/bash
# ────────────────────────────────────────────────────────────────────
# Citizen Ledger – Public Testnet Genesis Configuration
# Generates genesis.json for a multi-validator public testnet.
#
# Usage:
#   ./public-testnet-genesis.sh [--chain-id citizen-testnet-1] [--validators 4]
# ────────────────────────────────────────────────────────────────────

set -euo pipefail

CHAIN_ID="${1:-citizen-testnet-1}"
NUM_VALIDATORS="${2:-4}"
DENOM="ucitizen"
HOME_BASE="$HOME/.citizen-testnet"
GENESIS_SUPPLY="1000000000000"        # 1T ucitizen total genesis
VALIDATOR_STAKE="10000000000"         # 10B stake per validator
FAUCET_AMOUNT="500000000000"          # 500B faucet for public users
RESERVE_AMOUNT="100000000000"         # 100B protocol reserve
BLOCK_TIME="5s"

echo "═══════════════════════════════════════════════════"
echo "  Citizen Ledger – Public Testnet Genesis"
echo "  Chain ID:    $CHAIN_ID"
echo "  Validators:  $NUM_VALIDATORS"
echo "  Block Time:  $BLOCK_TIME"
echo "═══════════════════════════════════════════════════"

# ── Clean slate ──────────────────────────────────────────────────
rm -rf "$HOME_BASE"
mkdir -p "$HOME_BASE"

# ── Init chain with validator-0 ──────────────────────────────────
GENESIS_HOME="$HOME_BASE/validator-0"
wasmd init "validator-0" --chain-id "$CHAIN_ID" --home "$GENESIS_HOME" > /dev/null 2>&1

# ── Patch genesis.json ───────────────────────────────────────────
GENESIS="$GENESIS_HOME/config/genesis.json"

# Set denom
sed -i "s/\"stake\"/\"$DENOM\"/g" "$GENESIS"

# Set block time
jq ".consensus.params.block.max_gas = \"100000000\"" "$GENESIS" > tmp.json && mv tmp.json "$GENESIS"

# Set governance parameters
jq '.app_state.gov.params.min_deposit[0].denom = "ucitizen" |
    .app_state.gov.params.min_deposit[0].amount = "10000000" |
    .app_state.gov.params.voting_period = "172800s" |
    .app_state.gov.params.max_deposit_period = "86400s"' "$GENESIS" > tmp.json && mv tmp.json "$GENESIS" 2>/dev/null || true

# Set slashing params
jq '.app_state.slashing.params.signed_blocks_window = "10000" |
    .app_state.slashing.params.min_signed_per_window = "0.050000000000000000" |
    .app_state.slashing.params.downtime_jail_duration = "600s" |
    .app_state.slashing.params.slash_fraction_double_sign = "0.050000000000000000" |
    .app_state.slashing.params.slash_fraction_downtime = "0.010000000000000000"' "$GENESIS" > tmp.json && mv tmp.json "$GENESIS" 2>/dev/null || true

echo "  Genesis patched with custom parameters"

# ── Create keys for all validators ───────────────────────────────
echo ""
echo "Creating validator keys..."
for i in $(seq 0 $((NUM_VALIDATORS - 1))); do
  VHOME="$HOME_BASE/validator-$i"
  if [ "$i" -gt 0 ]; then
    wasmd init "validator-$i" --chain-id "$CHAIN_ID" --home "$VHOME" > /dev/null 2>&1
  fi
  wasmd keys add "validator-$i" --keyring-backend test --home "$VHOME" > "$VHOME/key.txt" 2>&1
  ADDR=$(wasmd keys show "validator-$i" -a --keyring-backend test --home "$VHOME")
  echo "  Validator $i: $ADDR"
done

# ── Create faucet + reserve keys ─────────────────────────────────
echo ""
echo "Creating service accounts..."
wasmd keys add "faucet" --keyring-backend test --home "$GENESIS_HOME" > "$HOME_BASE/faucet-key.txt" 2>&1
FAUCET_ADDR=$(wasmd keys show "faucet" -a --keyring-backend test --home "$GENESIS_HOME")
echo "  Faucet:  $FAUCET_ADDR"

wasmd keys add "reserve" --keyring-backend test --home "$GENESIS_HOME" > "$HOME_BASE/reserve-key.txt" 2>&1
RESERVE_ADDR=$(wasmd keys show "reserve" -a --keyring-backend test --home "$GENESIS_HOME")
echo "  Reserve: $RESERVE_ADDR"

# ── Add genesis accounts ────────────────────────────────────────
echo ""
echo "Funding genesis accounts..."
for i in $(seq 0 $((NUM_VALIDATORS - 1))); do
  VHOME="$HOME_BASE/validator-$i"
  ADDR=$(wasmd keys show "validator-$i" -a --keyring-backend test --home "$VHOME")
  VALIDATOR_TOTAL=$((VALIDATOR_STAKE * 2))  # 2x stake for gas buffer
  wasmd genesis add-genesis-account "$ADDR" "${VALIDATOR_TOTAL}${DENOM}" --home "$GENESIS_HOME"
done
wasmd genesis add-genesis-account "$FAUCET_ADDR" "${FAUCET_AMOUNT}${DENOM}" --home "$GENESIS_HOME"
wasmd genesis add-genesis-account "$RESERVE_ADDR" "${RESERVE_AMOUNT}${DENOM}" --home "$GENESIS_HOME"

# ── Generate gentxs ─────────────────────────────────────────────
echo "Generating genesis transactions..."
for i in $(seq 0 $((NUM_VALIDATORS - 1))); do
  VHOME="$HOME_BASE/validator-$i"
  # Copy genesis to validator home
  cp "$GENESIS" "$VHOME/config/genesis.json"
  wasmd genesis gentx "validator-$i" "${VALIDATOR_STAKE}${DENOM}" \
    --chain-id "$CHAIN_ID" \
    --moniker "validator-$i" \
    --keyring-backend test \
    --home "$VHOME" > /dev/null 2>&1
  # Collect gentx
  cp "$VHOME/config/gentx/"* "$GENESIS_HOME/config/gentx/" 2>/dev/null || true
done

wasmd genesis collect-gentxs --home "$GENESIS_HOME" > /dev/null 2>&1
wasmd genesis validate --home "$GENESIS_HOME"

# ── Configure p2p seeds ──────────────────────────────────────────
echo ""
echo "Configuring network..."
NODE_ID_0=$(wasmd tendermint show-node-id --home "$HOME_BASE/validator-0" 2>/dev/null || echo "unknown")
SEED="${NODE_ID_0}@127.0.0.1:26656"

for i in $(seq 1 $((NUM_VALIDATORS - 1))); do
  VHOME="$HOME_BASE/validator-$i"
  cp "$GENESIS" "$VHOME/config/genesis.json"
  
  # Offset ports for local multi-node  
  P2P_PORT=$((26656 + i * 10))
  RPC_PORT=$((26657 + i * 10))
  API_PORT=$((1317 + i * 10))
  GRPC_PORT=$((9090 + i * 10))

  sed -i "s/26656/$P2P_PORT/g" "$VHOME/config/config.toml"
  sed -i "s/26657/$RPC_PORT/g" "$VHOME/config/config.toml"
  sed -i "s/1317/$API_PORT/g" "$VHOME/config/app.toml" 2>/dev/null || true
  sed -i "s/9090/$GRPC_PORT/g" "$VHOME/config/app.toml" 2>/dev/null || true
  sed -i "s/seeds = \"\"/seeds = \"$SEED\"/g" "$VHOME/config/config.toml"
done

# ── Export genesis ───────────────────────────────────────────────
FINAL_GENESIS="$HOME_BASE/genesis.json"
cp "$GENESIS" "$FINAL_GENESIS"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Public Testnet Genesis Ready!"
echo "═══════════════════════════════════════════════════"
echo ""
echo "  Genesis:     $FINAL_GENESIS"
echo "  Validators:  $NUM_VALIDATORS"
echo "  Faucet:      $FAUCET_ADDR"
echo "  Reserve:     $RESERVE_ADDR"
echo ""
echo "  Start validators:"
for i in $(seq 0 $((NUM_VALIDATORS - 1))); do
  echo "    wasmd start --home $HOME_BASE/validator-$i"
done
echo ""
echo "  Then deploy contracts:"
echo "    ./deploy.sh --chain-id $CHAIN_ID --node http://localhost:26657"
echo ""

# ── Save metadata ────────────────────────────────────────────────
cat > "$HOME_BASE/testnet-info.json" <<EOF
{
  "chain_id": "$CHAIN_ID",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "genesis_supply": "$GENESIS_SUPPLY",
  "num_validators": $NUM_VALIDATORS,
  "block_time": "$BLOCK_TIME",
  "faucet_address": "$FAUCET_ADDR",
  "reserve_address": "$RESERVE_ADDR",
  "seed_node": "$SEED"
}
EOF

echo "Testnet metadata saved to $HOME_BASE/testnet-info.json"
