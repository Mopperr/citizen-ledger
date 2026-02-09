// ─────────────────────────────────────────────────────────────────────────────
// CosmJS Client Hook — connects to Citizen Ledger via Keplr/Leap wallet
// ─────────────────────────────────────────────────────────────────────────────

import { create } from "zustand";
import {
  SigningCosmWasmClient,
  CosmWasmClient,
} from "@cosmjs/cosmwasm-stargate";
import { GasPrice } from "@cosmjs/stargate";
import {
  CHAIN_ID,
  RPC_ENDPOINT,
  GAS_PRICE,
  CHAIN_CONFIG,
} from "@/config/chain";

interface WalletState {
  address: string | null;
  client: CosmWasmClient | null;
  signingClient: SigningCosmWasmClient | null;
  isConnecting: boolean;
  error: string | null;

  connect: () => Promise<void>;
  disconnect: () => void;
  initQueryClient: () => Promise<void>;
}

export const useWallet = create<WalletState>((set, get) => ({
  address: null,
  client: null,
  signingClient: null,
  isConnecting: false,
  error: null,

  initQueryClient: async () => {
    try {
      const client = await CosmWasmClient.connect(RPC_ENDPOINT);
      set({ client });
    } catch (e: any) {
      console.error("Failed to connect query client:", e);
    }
  },

  connect: async () => {
    set({ isConnecting: true, error: null });

    try {
      // Try Keplr first, then Leap
      const keplr = (window as any).keplr;
      if (!keplr) {
        throw new Error(
          "Please install Keplr or Leap wallet extension"
        );
      }

      // Suggest chain to Keplr
      await keplr.experimentalSuggestChain(CHAIN_CONFIG);
      await keplr.enable(CHAIN_ID);

      const offlineSigner = keplr.getOfflineSigner(CHAIN_ID);
      const accounts = await offlineSigner.getAccounts();
      const address = accounts[0].address;

      const signingClient = await SigningCosmWasmClient.connectWithSigner(
        RPC_ENDPOINT,
        offlineSigner,
        { gasPrice: GasPrice.fromString(GAS_PRICE) }
      );

      const client = await CosmWasmClient.connect(RPC_ENDPOINT);

      set({
        address,
        client,
        signingClient,
        isConnecting: false,
      });
    } catch (e: any) {
      set({ error: e.message, isConnecting: false });
    }
  },

  disconnect: () => {
    set({
      address: null,
      signingClient: null,
      isConnecting: false,
      error: null,
    });
  },
}));
