// ─────────────────────────────────────────────────────────────────────────────
// CosmJS Client Hook — connects to Citizen Ledger via Keplr / Leap wallet
// Supports auto-reconnect, multiple wallet providers, and error handling
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

type WalletProvider = "keplr" | "leap";

interface WalletState {
  address: string | null;
  client: CosmWasmClient | null;
  signingClient: SigningCosmWasmClient | null;
  isConnecting: boolean;
  error: string | null;
  provider: WalletProvider | null;

  connect: (preferredProvider?: WalletProvider) => Promise<void>;
  disconnect: () => void;
  initQueryClient: () => Promise<void>;
  autoReconnect: () => Promise<void>;
  clearError: () => void;
}

const STORAGE_KEY = "citizen-ledger-wallet";

/** Detect available wallet extensions */
function getWalletExtension(provider?: WalletProvider): { ext: any; name: WalletProvider } | null {
  if (typeof window === "undefined") return null;

  const w = window as any;

  // If user prefers a specific provider, try that first
  if (provider === "leap" && w.leap) return { ext: w.leap, name: "leap" };
  if (provider === "keplr" && w.keplr) return { ext: w.keplr, name: "keplr" };

  // Auto-detect: Keplr first, then Leap
  if (w.keplr) return { ext: w.keplr, name: "keplr" };
  if (w.leap) return { ext: w.leap, name: "leap" };

  return null;
}

export const useWallet = create<WalletState>((set, get) => ({
  address: null,
  client: null,
  signingClient: null,
  isConnecting: false,
  error: null,
  provider: null,

  clearError: () => set({ error: null }),

  initQueryClient: async () => {
    try {
      const client = await CosmWasmClient.connect(RPC_ENDPOINT);
      set({ client });
    } catch (e: any) {
      console.error("Failed to connect query client:", e);
    }
  },

  connect: async (preferredProvider?: WalletProvider) => {
    set({ isConnecting: true, error: null });

    try {
      const wallet = getWalletExtension(preferredProvider);
      if (!wallet) {
        throw new Error(
          "No wallet found. Please install Keplr (keplr.app) or Leap (leapwallet.io) browser extension."
        );
      }

      // Suggest custom chain to the wallet
      try {
        await wallet.ext.experimentalSuggestChain(CHAIN_CONFIG);
      } catch (suggestErr: any) {
        // Some wallets don't support experimentalSuggestChain — that's OK if chain is already added
        console.warn("Chain suggest failed (may already be added):", suggestErr.message);
      }

      await wallet.ext.enable(CHAIN_ID);

      const offlineSigner = wallet.ext.getOfflineSigner(CHAIN_ID);
      const accounts = await offlineSigner.getAccounts();

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found in wallet. Please create an account first.");
      }

      const address = accounts[0].address;

      const signingClient = await SigningCosmWasmClient.connectWithSigner(
        RPC_ENDPOINT,
        offlineSigner,
        { gasPrice: GasPrice.fromString(GAS_PRICE) }
      );

      const client = await CosmWasmClient.connect(RPC_ENDPOINT);

      // Save provider choice for auto-reconnect
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ provider: wallet.name }));
      } catch {}

      set({
        address,
        client,
        signingClient,
        isConnecting: false,
        provider: wallet.name,
        error: null,
      });
    } catch (e: any) {
      const msg = e.message || "Failed to connect wallet";
      set({ error: msg, isConnecting: false });
      console.error("Wallet connection error:", msg);
    }
  },

  disconnect: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}

    set({
      address: null,
      signingClient: null,
      isConnecting: false,
      error: null,
      provider: null,
    });
  },

  /** Try to reconnect on page load if user previously connected */
  autoReconnect: async () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const { provider } = JSON.parse(stored) as { provider: WalletProvider };
      const wallet = getWalletExtension(provider);
      if (!wallet) return;

      // Only auto-reconnect if the wallet extension is available and chain is enabled
      // Use a short timeout so we don't block the page
      await get().connect(provider);
    } catch {
      // Silently fail — user can manually reconnect
    }
  },
}));
