#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# Deploy all Citizen Ledger contracts inside the Docker container
# Designed for wasmd v0.54.0 output format
# ─────────────────────────────────────────────────────────────────────────────
set -e

NODE="http://localhost:26657"
CHAIN_ID="citizen-ledger-local"
DENOM="ucitizen"
KEYRING="--keyring-backend test"
WASM_DIR="/wasm"
GAS="--gas auto --gas-adjustment 1.5 --gas-prices 0.025${DENOM}"

ADMIN=$(wasmd keys show admin -a $KEYRING)

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  Citizen Ledger — Contract Deployment (Docker)           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Node:     $NODE"
echo "Chain ID: $CHAIN_ID"
echo "Admin:    $ADMIN"
echo ""

# ── Helper: store contract and return code_id ────────────────────────────────
store_and_get_code_id() {
    local name="$1"
    local wasm_file="${WASM_DIR}/${name}.wasm"

    if [ ! -f "$wasm_file" ]; then
        echo "ERROR: $wasm_file not found!" >&2
        exit 1
    fi

    echo "Storing $name..." >&2

    # Store the contract
    wasmd tx wasm store "$wasm_file" \
        --from admin $KEYRING \
        --chain-id "$CHAIN_ID" \
        --node "$NODE" \
        --gas auto --gas-adjustment 1.5 --gas-prices "0.025${DENOM}" \
        --output json -y > /tmp/store_result.json 2>/dev/null

    # Wait for tx to be included in a block
    sleep 6

    # Get the latest code id (last one in list-code output)
    local code_id
    local all_codes
    all_codes=$(wasmd query wasm list-code --node "$NODE" --output json 2>/dev/null)
    code_id=$(echo "$all_codes" | grep -o '"code_id":"[0-9]*"' | tail -1 | grep -o '[0-9]*')

    echo "  Stored $name -> code_id=$code_id" >&2
    echo "$code_id"
}

# ── Helper: instantiate contract and return address ──────────────────────────
instantiate_and_get_addr() {
    local code_id="$1"
    local label="$2"
    local init_msg="$3"

    echo "Instantiating $label (code_id=$code_id)..." >&2

    wasmd tx wasm instantiate "$code_id" "$init_msg" \
        --from admin $KEYRING \
        --chain-id "$CHAIN_ID" \
        --node "$NODE" \
        --label "$label" \
        --admin "$ADMIN" \
        --gas auto --gas-adjustment 1.5 --gas-prices "0.025${DENOM}" \
        --output json -y > /tmp/inst_result.json 2>/dev/null

    sleep 6

    # Query the contract address by code_id (last instantiated)
    local addr
    addr=$(wasmd query wasm list-contract-by-code "$code_id" --node "$NODE" --output json 2>/dev/null | \
        grep -o '"wasm1[a-z0-9]*"' | tail -1 | tr -d '"')

    echo "  Deployed $label -> $addr" >&2
    echo "$addr"
}

# ═══════════════════════════════════════════════════════════════════════════════
echo "═══ Phase 1: Store WASM Binaries ═══"
echo ""

CREDENTIAL_CODE=$(store_and_get_code_id "credential_registry")
TREASURY_CODE=$(store_and_get_code_id "treasury")
VOTING_CODE=$(store_and_get_code_id "voting")
GRANTS_CODE=$(store_and_get_code_id "grants")
STAKING_CODE=$(store_and_get_code_id "staking_emissions")

echo ""
echo "Code IDs:"
echo "  credential-registry: $CREDENTIAL_CODE"
echo "  treasury:            $TREASURY_CODE"
echo "  voting:              $VOTING_CODE"
echo "  grants:              $GRANTS_CODE"
echo "  staking-emissions:   $STAKING_CODE"
echo ""

# Verify we got all code IDs
for cid in "$CREDENTIAL_CODE" "$TREASURY_CODE" "$VOTING_CODE" "$GRANTS_CODE" "$STAKING_CODE"; do
    if [ -z "$cid" ]; then
        echo "ERROR: Failed to get a code_id. Aborting."
        exit 1
    fi
done

# ═══════════════════════════════════════════════════════════════════════════════
echo "═══ Phase 2: Instantiate Contracts ═══"
echo ""

# 1. Credential Registry
#    Fields: admin, issuers
CREDENTIAL_ADDR=$(instantiate_and_get_addr "$CREDENTIAL_CODE" "citizen-credential-registry" \
    "{\"admin\":\"$ADMIN\",\"issuers\":[\"$ADMIN\"]}")
echo ""

# 2. Treasury
#    Fields: admin, governance_contract, denom, allocations: Vec<(FundCategory, u64)>
TREASURY_ADDR=$(instantiate_and_get_addr "$TREASURY_CODE" "citizen-treasury" \
    "{\"admin\":\"$ADMIN\",\"governance_contract\":\"$ADMIN\",\"denom\":\"$DENOM\",\"allocations\":[[\"research\",2500],[\"healthcare\",2500],[\"infrastructure\",2500],[\"education\",2500]]}")
echo ""

# 3. Voting
#    Fields: admin, credential_registry, treasury_contract, voting_period, quorum_bps, threshold_bps, timelock_period
VOTING_ADDR=$(instantiate_and_get_addr "$VOTING_CODE" "citizen-voting" \
    "{\"admin\":\"$ADMIN\",\"credential_registry\":\"$CREDENTIAL_ADDR\",\"treasury_contract\":\"$TREASURY_ADDR\",\"voting_period\":604800,\"quorum_bps\":2000,\"threshold_bps\":5000,\"timelock_period\":86400}")
echo ""

# 4. Grants
#    Fields: admin, governance_contract, treasury_contract
GRANTS_ADDR=$(instantiate_and_get_addr "$GRANTS_CODE" "citizen-grants" \
    "{\"admin\":\"$ADMIN\",\"governance_contract\":\"$VOTING_ADDR\",\"treasury_contract\":\"$TREASURY_ADDR\"}")
echo ""

# 5. Staking Emissions
#    Fields: admin, max_supply, initial_supply, denom, phases, treasury, treasury_share_bps, slash_penalty_bps
STAKING_ADDR=$(instantiate_and_get_addr "$STAKING_CODE" "citizen-staking-emissions" \
    "{\"admin\":\"$ADMIN\",\"max_supply\":\"1000000000000000\",\"initial_supply\":\"0\",\"denom\":\"$DENOM\",\"phases\":[{\"label\":\"bootstrap\",\"start_block\":0,\"end_block\":1000000,\"tokens_per_block\":\"1000000\"}],\"treasury\":\"$TREASURY_ADDR\",\"treasury_share_bps\":2000,\"slash_penalty_bps\":500}")
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
echo "═══ Phase 3: Configure Cross-References ═══"
echo ""

echo "Updating treasury governance to voting contract..."
wasmd tx wasm execute "$TREASURY_ADDR" \
    "{\"update_governance\":{\"governance_contract\":\"$VOTING_ADDR\"}}" \
    --from admin $KEYRING \
    --chain-id "$CHAIN_ID" \
    --node "$NODE" \
    --gas auto --gas-adjustment 1.5 --gas-prices "0.025${DENOM}" \
    -y > /dev/null 2>&1
sleep 6
echo "  Treasury governance -> $VOTING_ADDR"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  Deployment Complete!                                    ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "  credential-registry: $CREDENTIAL_ADDR"
echo "  treasury:            $TREASURY_ADDR"
echo "  voting:              $VOTING_ADDR"
echo "  grants:              $GRANTS_ADDR"
echo "  staking-emissions:   $STAKING_ADDR"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "  Admin: $ADMIN"
echo "  Node:  $NODE"
echo "╚═══════════════════════════════════════════════════════════╝"

# Save addresses
cat > /tmp/deploy-addresses.json <<EOF
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
echo "Addresses saved to /tmp/deploy-addresses.json"
