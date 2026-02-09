// ─────────────────────────────────────────────────────────────────────────────
// Chain Configuration for Citizen Ledger
// ─────────────────────────────────────────────────────────────────────────────

export const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID || "citizen-ledger-local";
export const CHAIN_NAME = "Citizen Ledger";
export const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || "http://localhost:26657";
export const REST_ENDPOINT = process.env.NEXT_PUBLIC_REST_ENDPOINT || "http://localhost:1317";
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

// Keplr chain suggestion config
export const CHAIN_CONFIG = {
  chainId: CHAIN_ID,
  chainName: CHAIN_NAME,
  rpc: RPC_ENDPOINT,
  rest: REST_ENDPOINT,
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
