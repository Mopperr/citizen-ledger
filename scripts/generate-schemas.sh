#!/usr/bin/env bash
# Generate JSON schemas for all contracts
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CONTRACTS=(
    credential-registry
    treasury
    voting
    grants
    staking-emissions
)

echo "╔═══════════════════════════════════════════╗"
echo "║  Generating JSON Schemas for All Contracts  ║"
echo "╚═══════════════════════════════════════════╝"

for contract in "${CONTRACTS[@]}"; do
    echo ""
    echo "── $contract ──"
    cargo run --bin schema --manifest-path "contracts/$contract/Cargo.toml"
    echo "   ✓ Schema written to contracts/$contract/schema/"
done

echo ""
echo "✅ All schemas generated successfully!"
echo "   Output: contracts/*/schema/*.json"
