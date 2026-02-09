// ─────────────────────────────────────────────────────────────────────────────
// Chain Configuration for Citizen Ledger
// ─────────────────────────────────────────────────────────────────────────────

export const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID || "citizen-ledger-local";
export const CHAIN_NAME = "Citizen Ledger";

// Raw endpoints — used by the wallet extension and for the Next.js proxy target
const RAW_RPC = process.env.NEXT_PUBLIC_RPC_ENDPOINT || "http://localhost:26657";
const RAW_REST = process.env.NEXT_PUBLIC_REST_ENDPOINT || "http://localhost:1317";

// Browser-safe endpoints — go through the Next.js rewrite proxy to avoid CORS.
// In production these can be overridden to point directly at the node if CORS is
// configured, but for local dev the /rpc and /rest proxies just work.
export const RPC_ENDPOINT =
  typeof window !== "undefined" ? "/rpc" : RAW_RPC;
export const REST_ENDPOINT =
  typeof window !== "undefined" ? "/rest" : RAW_REST;

export const DENOM = "ucitizen";
export const DISPLAY_DENOM = "CITIZEN";
export const DECIMALS = 6;
export const BECH32_PREFIX = process.env.NEXT_PUBLIC_BECH32_PREFIX || "wasm";
export const GAS_PRICE = "0.025ucitizen";

// Contract addresses — populated after deployment (see scripts/deploy.sh output)
export const CONTRACTS = {
  credentialRegistry: process.env.NEXT_PUBLIC_CREDENTIAL_REGISTRY || "",
  treasury: process.env.NEXT_PUBLIC_TREASURY || "",
  voting: process.env.NEXT_PUBLIC_VOTING || "",
  grants: process.env.NEXT_PUBLIC_GRANTS || "",
  stakingEmissions: process.env.NEXT_PUBLIC_STAKING_EMISSIONS || "",
};

// Keplr/Leap chain suggestion config — uses RAW endpoints because the wallet
// extension contacts the node directly (not through the browser page origin).
export const CHAIN_CONFIG = {
  chainId: CHAIN_ID,
  chainName: CHAIN_NAME,
  rpc: RAW_RPC,
  rest: RAW_REST,
  bip44: { coinType: 118 },
  bech32Config: {
    bech32PrefixAccAddr: BECH32_PREFIX,
    bech32PrefixAccPub: `${BECH32_PREFIX}pub`,
    bech32PrefixValAddr: `${BECH32_PREFIX}valoper`,
    bech32PrefixValPub: `${BECH32_PREFIX}valoperpub`,
    bech32PrefixConsAddr: `${BECH32_PREFIX}valcons`,
    bech32PrefixConsPub: `${BECH32_PREFIX}valconspub`,
  },
  currencies: [
    { coinDenom: DISPLAY_DENOM, coinMinimalDenom: DENOM, coinDecimals: DECIMALS },
  ],
  feeCurrencies: [
    {
      coinDenom: DISPLAY_DENOM,
      coinMinimalDenom: DENOM,
      coinDecimals: DECIMALS,
      gasPriceStep: { low: 0.01, average: 0.025, high: 0.04 },
    },
  ],
  stakeCurrency: {
    coinDenom: DISPLAY_DENOM,
    coinMinimalDenom: DENOM,
    coinDecimals: DECIMALS,
  },
};
