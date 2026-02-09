#!/bin/bash
# ────────────────────────────────────────────────────────────────────
# Citizen Ledger – Contract Deployment Script
# Deploys all 5 CosmWasm contracts to a wasmd-based chain.
#
# Usage:
#   ./deploy.sh [--chain-id citizen-ledger-1] [--node http://localhost:26657] [--keyname admin]
#
# Prerequisites:
#   - wasmd CLI installed and configured
#   - Key named $KEYNAME in local keyring
#   - Chain running at $NODE
# ────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Defaults ─────────────────────────────────────────────────────
CHAIN_ID="${CHAIN_ID:-citizen-ledger-1}"
NODE="${NODE:-http://localhost:26657}"
KEYNAME="${KEYNAME:-admin}"
GAS_PRICES="0.025ucitizen"
GAS="auto"
GAS_ADJUSTMENT="1.4"
DENOM="ucitizen"
WASM_DIR="../target/wasm32-unknown-unknown/release"

# ── Parse CLI args ───────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case $1 in
    --chain-id) CHAIN_ID="$2"; shift 2;;
    --node)     NODE="$2"; shift 2;;
    --keyname)  KEYNAME="$2"; shift 2;;
    *) echo "Unknown option: $1"; exit 1;;
  esac
done

TXFLAGS="--chain-id $CHAIN_ID --node $NODE --from $KEYNAME --gas $GAS --gas-adjustment $GAS_ADJUSTMENT --gas-prices $GAS_PRICES -y --output json"

echo "================================================"
echo "  Citizen Ledger – Contract Deployment"
echo "  Chain:   $CHAIN_ID"
echo "  Node:    $NODE"
echo "  Key:     $KEYNAME"
echo "================================================"

ADMIN_ADDR=$(wasmd keys show "$KEYNAME" -a --keyring-backend test 2>/dev/null || wasmd keys show "$KEYNAME" -a)
echo "Admin address: $ADMIN_ADDR"

# ── Helper: store wasm and return code_id ────────────────────────
store_contract() {
  local name=$1
  local wasm_file="$WASM_DIR/${name}.wasm"
  
  if [ ! -f "$wasm_file" ]; then
    # Try with hyphens replaced by underscores
    wasm_file="$WASM_DIR/$(echo $name | tr '-' '_').wasm"
  fi

  echo ""
  echo "▸ Storing $name ($wasm_file)..."
  local tx_result
  tx_result=$(wasmd tx wasm store "$wasm_file" $TXFLAGS 2>&1)
  local txhash=$(echo "$tx_result" | jq -r '.txhash')
  
  echo "  TX: $txhash"
  sleep 6  # Wait for block confirmation
  
  local code_id
  code_id=$(wasmd query tx "$txhash" --node "$NODE" --output json 2>/dev/null | \
    jq -r '.events[] | select(.type=="store_code") | .attributes[] | select(.key=="code_id") | .value')
  
  echo "  Code ID: $code_id"
  echo "$code_id"
}

# ── Helper: instantiate contract and return address ──────────────
instantiate_contract() {
  local code_id=$1
  local label=$2
  local init_msg=$3
  
  echo "  Instantiating $label (code $code_id)..."
  local tx_result
  tx_result=$(wasmd tx wasm instantiate "$code_id" "$init_msg" \
    --label "$label" --admin "$ADMIN_ADDR" $TXFLAGS 2>&1)
  local txhash=$(echo "$tx_result" | jq -r '.txhash')
  
  sleep 6
  
  local contract_addr
  contract_addr=$(wasmd query tx "$txhash" --node "$NODE" --output json 2>/dev/null | \
    jq -r '.events[] | select(.type=="instantiate") | .attributes[] | select(.key=="_contract_address") | .value')
  
  echo "  Contract: $contract_addr"
  echo "$contract_addr"
}

# ── 1. Store all contracts ───────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════"
echo "  Step 1: Store Contract Binaries"
echo "════════════════════════════════════════════════"

CRED_CODE=$(store_contract "credential_registry")
TREASURY_CODE=$(store_contract "treasury")
VOTING_CODE=$(store_contract "voting")
GRANTS_CODE=$(store_contract "grants")
STAKING_CODE=$(store_contract "staking_emissions")

# ── 2. Instantiate Credential Registry ───────────────────────────
echo ""
echo "════════════════════════════════════════════════"
echo "  Step 2: Instantiate Credential Registry"
echo "════════════════════════════════════════════════"

CRED_INIT=$(cat <<EOF
{
  "admin": "$ADMIN_ADDR",
  "issuers": ["$ADMIN_ADDR"]
}
EOF
)
CRED_ADDR=$(instantiate_contract "$CRED_CODE" "citizen-credential-registry" "$CRED_INIT")

# ── 3. Instantiate Treasury ──────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════"
echo "  Step 3: Instantiate Treasury"
echo "════════════════════════════════════════════════"

# placeholder for governance — will update after voting is deployed
TREASURY_INIT=$(cat <<EOF
{
  "admin": "$ADMIN_ADDR",
  "governance_contract": "$ADMIN_ADDR",
  "denom": "$DENOM",
  "allocations": [
    ["Research", 2500],
    ["Healthcare", 2500],
    ["Infrastructure", 2000],
    ["NodeIncentives", 1500],
    ["Emergency", 1000],
    ["Education", 500]
  ]
}
EOF
)
TREASURY_ADDR=$(instantiate_contract "$TREASURY_CODE" "citizen-treasury" "$TREASURY_INIT")

# ── 4. Instantiate Voting ────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════"
echo "  Step 4: Instantiate Voting (Governance)"
echo "════════════════════════════════════════════════"

VOTING_INIT=$(cat <<EOF
{
  "admin": "$ADMIN_ADDR",
  "credential_registry": "$CRED_ADDR",
  "treasury_contract": "$TREASURY_ADDR",
  "voting_period": 50000,
  "quorum_bps": 3000,
  "threshold_bps": 5000
}
EOF
)
VOTING_ADDR=$(instantiate_contract "$VOTING_CODE" "citizen-voting" "$VOTING_INIT")

# ── 5. Update treasury governance pointer ────────────────────────
echo ""
echo "  Updating treasury governance to voting contract..."
wasmd tx wasm execute "$TREASURY_ADDR" \
  "{\"update_governance\":{\"governance_contract\":\"$VOTING_ADDR\"}}" \
  $TXFLAGS > /dev/null 2>&1
sleep 6
echo "  ✓ Treasury now governed by $VOTING_ADDR"

# ── 6. Instantiate Grants ───────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════"
echo "  Step 5: Instantiate Grants"
echo "════════════════════════════════════════════════"

GRANTS_INIT=$(cat <<EOF
{
  "admin": "$ADMIN_ADDR",
  "governance_contract": "$VOTING_ADDR",
  "treasury_contract": "$TREASURY_ADDR"
}
EOF
)
GRANTS_ADDR=$(instantiate_contract "$GRANTS_CODE" "citizen-grants" "$GRANTS_INIT")

# ── 7. Instantiate Staking + Emissions ───────────────────────────
echo ""
echo "════════════════════════════════════════════════"
echo "  Step 6: Instantiate Staking & Emissions"
echo "════════════════════════════════════════════════"

STAKING_INIT=$(cat <<EOF
{
  "admin": "$ADMIN_ADDR",
  "max_supply": "1000000000000",
  "initial_supply": "100000000000",
  "denom": "$DENOM",
  "phases": [
    {
      "label": "Year 1 - Bootstrap",
      "start_block": 0,
      "end_block": 5256000,
      "tokens_per_block": "100000"
    },
    {
      "label": "Year 2-3 - Growth",
      "start_block": 5256001,
      "end_block": 15768000,
      "tokens_per_block": "50000"
    },
    {
      "label": "Year 4-6 - Maturity",
      "start_block": 15768001,
      "end_block": 31536000,
      "tokens_per_block": "25000"
    },
    {
      "label": "Year 7+ - Steady State",
      "start_block": 31536001,
      "end_block": 0,
      "tokens_per_block": "10000"
    }
  ],
  "treasury": "$TREASURY_ADDR",
  "treasury_share_bps": 2000
}
EOF
)
STAKING_ADDR=$(instantiate_contract "$STAKING_CODE" "citizen-staking-emissions" "$STAKING_INIT")

# ── 8. Summary ───────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════"
echo "  Deployment Complete!"
echo "════════════════════════════════════════════════"
echo ""
echo "Contract Addresses:"
echo "  Credential Registry:  $CRED_ADDR"
echo "  Treasury:             $TREASURY_ADDR"
echo "  Voting (Governance):  $VOTING_ADDR"
echo "  Grants:               $GRANTS_ADDR"
echo "  Staking & Emissions:  $STAKING_ADDR"
echo ""

# ── Save addresses to file ───────────────────────────────────────
cat > deployed-addresses.json <<EOF
{
  "chain_id": "$CHAIN_ID",
  "deployed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "admin": "$ADMIN_ADDR",
  "contracts": {
    "credential_registry": {
      "code_id": $CRED_CODE,
      "address": "$CRED_ADDR"
    },
    "treasury": {
      "code_id": $TREASURY_CODE,
      "address": "$TREASURY_ADDR"
    },
    "voting": {
      "code_id": $VOTING_CODE,
      "address": "$VOTING_ADDR"
    },
    "grants": {
      "code_id": $GRANTS_CODE,
      "address": "$GRANTS_ADDR"
    },
    "staking_emissions": {
      "code_id": $STAKING_CODE,
      "address": "$STAKING_ADDR"
    }
  }
}
EOF

echo "Addresses saved to deployed-addresses.json"
echo ""
echo "Next steps:"
echo "  1. Fund the treasury:  wasmd tx wasm execute $TREASURY_ADDR '{\"deposit\":{}}' --amount 1000000$DENOM $TXFLAGS"
echo "  2. Issue a credential:  wasmd tx wasm execute $CRED_ADDR '{\"issue_credential\":{...}}' $TXFLAGS"
echo "  3. Create a proposal:   wasmd tx wasm execute $VOTING_ADDR '{\"create_proposal\":{...}}' $TXFLAGS"
