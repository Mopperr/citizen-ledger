#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Deploy all Citizen Ledger contracts to a running wasmd node
# Usage: ./scripts/deploy-local.sh [NODE_URL]
# Default NODE_URL: http://localhost:26657
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

NODE="${1:-http://localhost:26657}"
CHAIN_ID="citizen-ledger-local"
DENOM="ucitizen"
KEYRING="--keyring-backend test"
WASM_DIR="target/wasm32-unknown-unknown/release"
GAS="--gas auto --gas-adjustment 1.5 --gas-prices 0.025${DENOM}"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  Citizen Ledger — Contract Deployment                    ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Node:     $NODE"
echo "Chain ID: $CHAIN_ID"
echo ""

# ── Helpers ──────────────────────────────────────────────────────────────────

tx_hash() {
    echo "$1" | grep -o '"txhash":"[^"]*"' | cut -d'"' -f4
}

wait_tx() {
    local hash="$1"
    echo "  Waiting for tx $hash..."
    sleep 6
    wasmd query tx "$hash" --node "$NODE" --output json 2>/dev/null || {
        sleep 6
        wasmd query tx "$hash" --node "$NODE" --output json
    }
}

store_contract() {
    local name="$1"
    local wasm_file="${WASM_DIR}/${name}.wasm"
    
    if [ ! -f "$wasm_file" ]; then
        echo "ERROR: $wasm_file not found. Run 'cargo build --lib --target wasm32-unknown-unknown --release' first."
        exit 1
    fi

    echo "📦 Storing $name..."
    local result
    result=$(wasmd tx wasm store "$wasm_file" \
        --from admin $KEYRING \
        --chain-id "$CHAIN_ID" \
        --node "$NODE" \
        $GAS \
        --output json -y 2>&1)
    
    local hash
    hash=$(tx_hash "$result")
    local tx_result
    tx_result=$(wait_tx "$hash")
    
    local code_id
    code_id=$(echo "$tx_result" | grep -o '"key":"code_id","value":"[^"]*"' | head -1 | cut -d'"' -f8)
    echo "  ✅ $name stored as code_id=$code_id"
    echo "$code_id"
}

instantiate_contract() {
    local code_id="$1"
    local label="$2"
    local init_msg="$3"
    local admin_flag="${4:---no-admin}"
    
    echo "🚀 Instantiating $label (code_id=$code_id)..."
    local result
    result=$(wasmd tx wasm instantiate "$code_id" "$init_msg" \
        --from admin $KEYRING \
        --chain-id "$CHAIN_ID" \
        --node "$NODE" \
        --label "$label" \
        $admin_flag \
        $GAS \
        --output json -y 2>&1)
    
    local hash
    hash=$(tx_hash "$result")
    local tx_result
    tx_result=$(wait_tx "$hash")
    
    local addr
    addr=$(echo "$tx_result" | grep -o '"key":"_contract_address","value":"[^"]*"' | head -1 | cut -d'"' -f8)
    echo "  ✅ $label deployed at $addr"
    echo "$addr"
}

# ── Get account addresses ────────────────────────────────────────────────────

ADMIN=$(wasmd keys show admin -a $KEYRING 2>/dev/null)
echo "Admin address: $ADMIN"
echo ""

# ── 1. Store all contracts ───────────────────────────────────────────────────

echo "═══ Phase 1: Store WASM Binaries ═══"
echo ""

CREDENTIAL_CODE=$(store_contract "credential_registry")
echo ""
TREASURY_CODE=$(store_contract "treasury")
echo ""
VOTING_CODE=$(store_contract "voting")
echo ""
GRANTS_CODE=$(store_contract "grants")
echo ""
STAKING_CODE=$(store_contract "staking_emissions")
echo ""

echo "Stored code IDs:"
echo "  credential-registry: $CREDENTIAL_CODE"
echo "  treasury:            $TREASURY_CODE"
echo "  voting:              $VOTING_CODE"
echo "  grants:              $GRANTS_CODE"
echo "  staking-emissions:   $STAKING_CODE"
echo ""

# ── 2. Instantiate contracts ─────────────────────────────────────────────────

echo "═══ Phase 2: Instantiate Contracts ═══"
echo ""

# Credential Registry (no dependencies)
CREDENTIAL_ADDR=$(instantiate_contract "$CREDENTIAL_CODE" "citizen-credential-registry" \
    "{\"admin\":\"$ADMIN\"}" \
    "--admin $ADMIN")
echo ""

# Treasury (no dependencies initially)
TREASURY_ADDR=$(instantiate_contract "$TREASURY_CODE" "citizen-treasury" \
    "{\"admin\":\"$ADMIN\",\"governance\":\"$ADMIN\",\"allocations\":[{\"category\":\"operations\",\"bps\":3000},{\"category\":\"grants\",\"bps\":3000},{\"category\":\"development\",\"bps\":2000},{\"category\":\"reserve\",\"bps\":2000}]}" \
    "--admin $ADMIN")
echo ""

# Voting (depends on credential registry)
VOTING_ADDR=$(instantiate_contract "$VOTING_CODE" "citizen-voting" \
    "{\"admin\":\"$ADMIN\",\"credential_contract\":\"$CREDENTIAL_ADDR\"}" \
    "--admin $ADMIN")
echo ""

# Grants (depends on treasury and voting for governance)
GRANTS_ADDR=$(instantiate_contract "$GRANTS_CODE" "citizen-grants" \
    "{\"admin\":\"$ADMIN\",\"governance\":\"$VOTING_ADDR\",\"treasury\":\"$TREASURY_ADDR\"}" \
    "--admin $ADMIN")
echo ""

# Staking Emissions
STAKING_ADDR=$(instantiate_contract "$STAKING_CODE" "citizen-staking-emissions" \
    "{\"admin\":\"$ADMIN\",\"denom\":\"$DENOM\",\"treasury_address\":\"$TREASURY_ADDR\",\"treasury_share_bps\":2000}" \
    "--admin $ADMIN")
echo ""

# ── 3. Update cross-references ───────────────────────────────────────────────

echo "═══ Phase 3: Configure Cross-References ═══"
echo ""

# Update treasury governance to point at voting contract
echo "Updating treasury governance to voting contract..."
wasmd tx wasm execute "$TREASURY_ADDR" \
    "{\"update_governance\":{\"new_governance\":\"$VOTING_ADDR\"}}" \
    --from admin $KEYRING \
    --chain-id "$CHAIN_ID" \
    --node "$NODE" \
    $GAS \
    -y 2>/dev/null
sleep 6
echo "  ✅ Treasury governance → $VOTING_ADDR"

echo ""

# ── 4. Summary ───────────────────────────────────────────────────────────────

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  Deployment Complete!                                    ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "║  Contract Addresses:                                     ║"
echo "╠═══════════════════════════════════════════════════════════╣"
printf "║  %-20s %s\n" "credential-registry:" "$CREDENTIAL_ADDR  ║"
printf "║  %-20s %s\n" "treasury:" "$TREASURY_ADDR  ║"
printf "║  %-20s %s\n" "voting:" "$VOTING_ADDR  ║"
printf "║  %-20s %s\n" "grants:" "$GRANTS_ADDR  ║"
printf "║  %-20s %s\n" "staking-emissions:" "$STAKING_ADDR  ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "║  Admin: $ADMIN"
echo "║  Node:  $NODE"
echo "╚═══════════════════════════════════════════════════════════╝"

# Save addresses to file for scripts
cat > .deploy-addresses.json <<EOF
{
  "chain_id": "$CHAIN_ID",
  "node": "$NODE",
  "admin": "$ADMIN",
  "contracts": {
    "credential_registry": "$CREDENTIAL_ADDR",
    "treasury": "$TREASURY_ADDR",
    "voting": "$VOTING_ADDR",
    "grants": "$GRANTS_ADDR",
    "staking_emissions": "$STAKING_ADDR"
  }
}
EOF

echo ""
echo "Contract addresses saved to .deploy-addresses.json"
echo "Update frontend/.env.local with these addresses to connect the UI."
