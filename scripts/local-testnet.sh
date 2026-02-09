#!/bin/bash
# ────────────────────────────────────────────────────────────────────
# Citizen Ledger – Local Testnet Setup
# Sets up a single-node wasmd testnet for local development.
#
# Prerequisites: wasmd binary in PATH
# ────────────────────────────────────────────────────────────────────

set -euo pipefail

CHAIN_ID="citizen-ledger-1"
MONIKER="citizen-local"
KEYNAME="admin"
DENOM="ucitizen"
HOME_DIR="$HOME/.citizen-ledger"
GENESIS_AMOUNT="1000000000000${DENOM}"  # 1 trillion ucitizen
STAKING_AMOUNT="100000000000${DENOM}"   # 100 billion staked

echo "================================================"
echo "  Citizen Ledger – Local Testnet Setup"
echo "  Chain ID:  $CHAIN_ID"
echo "  Home:      $HOME_DIR"
echo "================================================"

# ── Reset ────────────────────────────────────────────────────────
if [ -d "$HOME_DIR" ]; then
  echo "Removing existing chain data..."
  rm -rf "$HOME_DIR"
fi

# ── Init chain ───────────────────────────────────────────────────
echo "Initializing chain..."
wasmd init "$MONIKER" --chain-id "$CHAIN_ID" --home "$HOME_DIR" > /dev/null 2>&1

# ── Configure ────────────────────────────────────────────────────
# Set denom in genesis
sed -i "s/\"stake\"/\"$DENOM\"/g" "$HOME_DIR/config/genesis.json"

# Fast blocks for local dev (1 second)
sed -i 's/timeout_commit = "5s"/timeout_commit = "1s"/g' "$HOME_DIR/config/config.toml"

# Enable API
sed -i 's/enable = false/enable = true/g' "$HOME_DIR/config/app.toml"
sed -i 's/swagger = false/swagger = true/g' "$HOME_DIR/config/app.toml"

# CORS for frontend
sed -i 's/cors_allowed_origins = \[\]/cors_allowed_origins = ["*"]/g' "$HOME_DIR/config/config.toml"

# Minimum gas
sed -i "s/minimum-gas-prices = \"\"/minimum-gas-prices = \"0.025$DENOM\"/g" "$HOME_DIR/config/app.toml"

# ── Create key ───────────────────────────────────────────────────
echo "Creating admin key..."
wasmd keys add "$KEYNAME" --keyring-backend test --home "$HOME_DIR" 2>&1 | tee "$HOME_DIR/admin-key.txt"

ADMIN_ADDR=$(wasmd keys show "$KEYNAME" -a --keyring-backend test --home "$HOME_DIR")
echo ""
echo "Admin address: $ADMIN_ADDR"

# Also create a few test citizen keys
for i in 1 2 3; do
  wasmd keys add "citizen${i}" --keyring-backend test --home "$HOME_DIR" > /dev/null 2>&1
  CITIZEN_ADDR=$(wasmd keys show "citizen${i}" -a --keyring-backend test --home "$HOME_DIR")
  echo "Citizen $i:     $CITIZEN_ADDR"
done

# ── Genesis accounts ─────────────────────────────────────────────
echo ""
echo "Adding genesis accounts..."
wasmd genesis add-genesis-account "$KEYNAME" "$GENESIS_AMOUNT" --keyring-backend test --home "$HOME_DIR"

for i in 1 2 3; do
  wasmd genesis add-genesis-account "citizen${i}" "10000000000${DENOM}" --keyring-backend test --home "$HOME_DIR"
done

# ── Genesis transaction ──────────────────────────────────────────
echo "Creating genesis transaction..."
wasmd genesis gentx "$KEYNAME" "$STAKING_AMOUNT" \
  --chain-id "$CHAIN_ID" \
  --moniker "$MONIKER" \
  --keyring-backend test \
  --home "$HOME_DIR" > /dev/null 2>&1

wasmd genesis collect-gentxs --home "$HOME_DIR" > /dev/null 2>&1

# ── Validate ─────────────────────────────────────────────────────
echo "Validating genesis..."
wasmd genesis validate --home "$HOME_DIR"

echo ""
echo "================================================"
echo "  Local testnet ready!"
echo ""
echo "  Start with:"
echo "    wasmd start --home $HOME_DIR"
echo ""
echo "  Then deploy contracts:"
echo "    cd scripts && ./deploy.sh"
echo "================================================"
