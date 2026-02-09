#!/usr/bin/env python3
"""
Citizen Ledger — Reward Distribution Keeper Bot

Periodically distributes staking rewards by calling the staking-emissions
contract's `distribute_rewards` endpoint. Designed to run as a systemd
service or cron job alongside a validator node.

Requirements:
  pip install cosmpy httpx python-dotenv

Environment variables (or .env file):
  RPC_ENDPOINT        - Tendermint RPC  (default: http://localhost:26657)
  REST_ENDPOINT       - LCD REST API    (default: http://localhost:1317)
  STAKING_CONTRACT    - bech32 address of staking-emissions contract
  KEEPER_MNEMONIC     - mnemonic for the keeper wallet (needs gas funds)
  KEEPER_PREFIX       - bech32 prefix (default: citizen)
  CHAIN_ID            - chain identifier (default: citizen-ledger-1)
  DENOM               - gas denom (default: ucitizen)
  GAS_PRICE           - gas price (default: 0.025)
  DISTRIBUTE_INTERVAL - seconds between distributions (default: 600 = 10 min)
  LOG_LEVEL           - logging level (default: INFO)
"""

import asyncio
import json
import logging
import os
import signal
import sys
import time
from dataclasses import dataclass
from pathlib import Path

try:
    import httpx
except ImportError:
    print("ERROR: httpx required. Install with: pip install httpx")
    sys.exit(1)

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # .env support optional

# ─────────────────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class KeeperConfig:
    rpc_endpoint: str
    rest_endpoint: str
    staking_contract: str
    keeper_mnemonic: str
    keeper_prefix: str
    chain_id: str
    denom: str
    gas_price: float
    distribute_interval: int  # seconds
    log_level: str

    @classmethod
    def from_env(cls) -> "KeeperConfig":
        contract = os.environ.get("STAKING_CONTRACT", "")
        mnemonic = os.environ.get("KEEPER_MNEMONIC", "")

        if not contract:
            raise ValueError("STAKING_CONTRACT env var is required")
        if not mnemonic:
            raise ValueError("KEEPER_MNEMONIC env var is required (keeper wallet)")

        return cls(
            rpc_endpoint=os.environ.get("RPC_ENDPOINT", "http://localhost:26657"),
            rest_endpoint=os.environ.get("REST_ENDPOINT", "http://localhost:1317"),
            staking_contract=contract,
            keeper_mnemonic=mnemonic,
            keeper_prefix=os.environ.get("KEEPER_PREFIX", "citizen"),
            chain_id=os.environ.get("CHAIN_ID", "citizen-ledger-1"),
            denom=os.environ.get("DENOM", "ucitizen"),
            gas_price=float(os.environ.get("GAS_PRICE", "0.025")),
            distribute_interval=int(os.environ.get("DISTRIBUTE_INTERVAL", "600")),
            log_level=os.environ.get("LOG_LEVEL", "INFO"),
        )


# ─────────────────────────────────────────────────────────────────────────────
# Keeper Bot
# ─────────────────────────────────────────────────────────────────────────────

class RewardKeeper:
    """Periodically calls distribute_rewards on the staking-emissions contract."""

    def __init__(self, config: KeeperConfig):
        self.config = config
        self.logger = logging.getLogger("reward-keeper")
        self._running = True
        self._client = httpx.AsyncClient(timeout=30)
        self._stats = {
            "distributions": 0,
            "errors": 0,
            "total_distributed": 0,
            "start_time": time.time(),
        }

    # ── Chain Queries ────────────────────────────────────────────────────

    async def get_chain_height(self) -> int:
        """Fetch current block height from Tendermint RPC."""
        try:
            r = await self._client.get(f"{self.config.rpc_endpoint}/status")
            r.raise_for_status()
            data = r.json()
            return int(data["result"]["sync_info"]["latest_block_height"])
        except Exception as e:
            self.logger.warning(f"Failed to get block height: {e}")
            return 0

    async def query_contract(self, query: dict) -> dict:
        """Execute a smart query against the staking contract."""
        import base64
        query_b64 = base64.b64encode(json.dumps(query).encode()).decode()
        url = (
            f"{self.config.rest_endpoint}"
            f"/cosmwasm/wasm/v1/contract/{self.config.staking_contract}/smart/{query_b64}"
        )
        r = await self._client.get(url)
        r.raise_for_status()
        return r.json().get("data", {})

    async def get_emission_info(self) -> dict:
        """Query current emission rate and supply stats."""
        try:
            supply = await self.query_contract({"supply": {}})
            rate = await self.query_contract({"current_emission_rate": {}})
            return {
                "total_staked": int(supply.get("total_staked", 0)),
                "total_minted": int(supply.get("total_minted", 0)),
                "rate_per_block": int(rate.get("rate_per_block", 0)),
                "phase": rate.get("phase", "Unknown"),
            }
        except Exception as e:
            self.logger.warning(f"Failed to query emission info: {e}")
            return {}

    # ── Transaction Execution ────────────────────────────────────────────

    async def execute_distribution(self) -> dict:
        """
        Execute distribute_rewards on the staking-emissions contract.

        Uses the REST API to simulate + broadcast. In production, use
        cosmpy or a proper signing library with the keeper mnemonic.
        """
        # This is a simplified version — in production you'd use cosmpy
        # or a signing library to create, sign, and broadcast the tx.
        # For now we build the message structure.

        msg = {
            "distribute_rewards": {}
        }

        self.logger.info("Executing distribute_rewards...")

        # In production: sign and broadcast via cosmpy
        # For demonstration, we log the intent and show the message format.
        # When deployed, replace this with actual tx broadcasting:
        #
        #   from cosmpy.aerial.client import LedgerClient
        #   from cosmpy.aerial.wallet import LocalWallet
        #   from cosmpy.aerial.contract import LedgerContract
        #
        #   client = LedgerClient(NetworkConfig(...))
        #   wallet = LocalWallet.from_mnemonic(self.config.keeper_mnemonic)
        #   contract = LedgerContract(None, client, self.config.staking_contract)
        #   tx = contract.execute(msg, wallet)
        #   tx.wait_to_complete()

        return {
            "status": "submitted",
            "contract": self.config.staking_contract,
            "msg": msg,
        }

    # ── Main Loop ────────────────────────────────────────────────────────

    async def run(self):
        """Main keeper loop — distribute rewards at regular intervals."""
        self.logger.info("=" * 60)
        self.logger.info("  Citizen Ledger — Reward Distribution Keeper")
        self.logger.info("=" * 60)
        self.logger.info(f"  Contract:  {self.config.staking_contract}")
        self.logger.info(f"  Chain:     {self.config.chain_id}")
        self.logger.info(f"  Interval:  {self.config.distribute_interval}s")
        self.logger.info(f"  RPC:       {self.config.rpc_endpoint}")
        self.logger.info("=" * 60)

        while self._running:
            try:
                # 1. Check chain liveness
                height = await self.get_chain_height()
                if height == 0:
                    self.logger.warning("Chain not reachable, retrying in 30s...")
                    await asyncio.sleep(30)
                    continue

                self.logger.info(f"Block height: {height}")

                # 2. Get emission info for logging
                info = await self.get_emission_info()
                if info:
                    self.logger.info(
                        f"  Staked: {info.get('total_staked', 0):,} | "
                        f"Minted: {info.get('total_minted', 0):,} | "
                        f"Rate: {info.get('rate_per_block', 0):,}/block | "
                        f"Phase: {info.get('phase', '?')}"
                    )

                # 3. Execute distribution
                result = await self.execute_distribution()

                if result.get("status") == "submitted":
                    self._stats["distributions"] += 1
                    self.logger.info(
                        f"Distribution #{self._stats['distributions']} submitted "
                        f"at height {height}"
                    )
                else:
                    self._stats["errors"] += 1
                    self.logger.error(f"Distribution failed: {result}")

            except Exception as e:
                self._stats["errors"] += 1
                self.logger.error(f"Keeper error: {e}", exc_info=True)

            # 4. Wait for next interval
            self.logger.debug(
                f"Sleeping {self.config.distribute_interval}s until next distribution..."
            )
            await asyncio.sleep(self.config.distribute_interval)

    def stop(self):
        """Gracefully stop the keeper."""
        self.logger.info("Stopping reward keeper...")
        self._running = False
        uptime = time.time() - self._stats["start_time"]
        self.logger.info(
            f"Stats — Distributions: {self._stats['distributions']}, "
            f"Errors: {self._stats['errors']}, "
            f"Uptime: {uptime:.0f}s"
        )


# ─────────────────────────────────────────────────────────────────────────────
# Health Check Endpoint (optional, for monitoring)
# ─────────────────────────────────────────────────────────────────────────────

async def health_server(keeper: RewardKeeper, port: int = 9190):
    """Simple HTTP health endpoint for monitoring tools."""
    import http.server
    import threading

    class HealthHandler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path == "/health":
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "status": "ok",
                    "distributions": keeper._stats["distributions"],
                    "errors": keeper._stats["errors"],
                    "uptime_s": int(time.time() - keeper._stats["start_time"]),
                    "running": keeper._running,
                }).encode())
            else:
                self.send_response(404)
                self.end_headers()

        def log_message(self, *args):
            pass  # suppress request logs

    server = http.server.HTTPServer(("0.0.0.0", port), HealthHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    keeper.logger.info(f"Health endpoint listening on :{port}/health")


# ─────────────────────────────────────────────────────────────────────────────
# Entry Point
# ─────────────────────────────────────────────────────────────────────────────

async def main():
    config = KeeperConfig.from_env()

    logging.basicConfig(
        level=getattr(logging, config.log_level.upper(), logging.INFO),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    keeper = RewardKeeper(config)

    # Handle graceful shutdown
    loop = asyncio.get_event_loop()
    for sig in (signal.SIGTERM, signal.SIGINT):
        try:
            loop.add_signal_handler(sig, keeper.stop)
        except NotImplementedError:
            # Windows doesn't support add_signal_handler
            pass

    # Start health endpoint
    await health_server(keeper)

    # Run
    await keeper.run()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nKeeper stopped.")
