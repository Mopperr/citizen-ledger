#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# Wasm Optimizer – deterministic builds via cosmwasm/optimizer
# Produces optimized .wasm binaries in artifacts/
# Requires Docker to be running.
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

OPTIMIZER_VERSION="0.16.1"

echo "╔═══════════════════════════════════════════╗"
echo "║  CosmWasm Optimizer – Deterministic Build   ║"
echo "╚═══════════════════════════════════════════╝"
echo ""
echo "Using cosmwasm/optimizer:${OPTIMIZER_VERSION}"
echo "Workspace: ${ROOT}"
echo ""

# Detect architecture for Apple Silicon / Intel
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then
    IMAGE="cosmwasm/optimizer-arm64:${OPTIMIZER_VERSION}"
    echo "Detected ARM64 architecture"
else
    IMAGE="cosmwasm/optimizer:${OPTIMIZER_VERSION}"
    echo "Detected x86_64 architecture"
fi

echo ""
echo "Pulling optimizer image..."
docker pull "$IMAGE"

echo ""
echo "Building optimized wasm binaries..."
docker run --rm \
    -v "${ROOT}:/code" \
    --mount type=volume,source="citizen_ledger_cache",target=/target \
    --mount type=volume,source="registry_cache",target=/usr/local/cargo/registry \
    "$IMAGE"

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║  Build Complete!                            ║"
echo "╚═══════════════════════════════════════════╝"
echo ""
echo "Optimized artifacts:"
ls -lh "${ROOT}/artifacts/"*.wasm 2>/dev/null || echo "  (no .wasm files found – check Docker output above)"
echo ""

# Show checksums for reproducibility
if [ -f "${ROOT}/artifacts/checksums.txt" ]; then
    echo "Checksums (for reproducible builds):"
    cat "${ROOT}/artifacts/checksums.txt"
fi
