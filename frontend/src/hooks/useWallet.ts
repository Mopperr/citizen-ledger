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

/**
 * Wait for wallet extension to inject into the window object.
 * Browser extensions inject globals asynchronously — polling ensures we
 * don't miss them on fast page loads or lazy-injection wallets like Leap.
 */
function waitForWalletInjection(
  check: () => boolean,
  timeout = 3000,
  interval = 100
): Promise<boolean> {
  return new Promise((resolve) => {
    if (check()) return resolve(true);
    const start = Date.now();
    const timer = setInterval(() => {
      if (check()) {
        clearInterval(timer);
        resolve(true);
      } else if (Date.now() - start >= timeout) {
        clearInterval(timer);
        resolve(false);
      }
    }, interval);
  });
}

/** Resolve the Leap extension — handles both old (`window.leap`) and new (`window.leap.cosmos`) namespaces */
function resolveLeap(): any | null {
  const w = window as any;
  // Newer Leap versions nest the Cosmos-compatible API under .cosmos
  if (w.leap?.cosmos?.enable) return w.leap.cosmos;
  // Older Leap versions expose it directly
  if (w.leap?.enable) return w.leap;
  return null;
}

/** Detect available wallet extensions (synchronous check) */
function getWalletExtension(provider?: WalletProvider): { ext: any; name: WalletProvider } | null {
  if (typeof window === "undefined") return null;

  const w = window as any;

  // If user prefers a specific provider, try that first
  if (provider === "leap") {
    const leap = resolveLeap();
    if (leap) return { ext: leap, name: "leap" };
  }
  if (provider === "keplr" && w.keplr) return { ext: w.keplr, name: "keplr" };

  // Auto-detect: Keplr first, then Leap
  if (w.keplr) return { ext: w.keplr, name: "keplr" };
  const leap = resolveLeap();
  if (leap) return { ext: leap, name: "leap" };

  return null;
}

/**
 * Detect wallet with async polling — waits for extension injection.
 * Use this for user-initiated connects and auto-reconnect.
 */
async function getWalletExtensionAsync(
  provider?: WalletProvider
): Promise<{ ext: any; name: WalletProvider } | null> {
  // First try immediately
  const immediate = getWalletExtension(provider);
  if (immediate) return immediate;

  // Wait for the specific provider (or any wallet) to inject
  const checkFn = provider
    ? () => {
        if (provider === "leap") return !!resolveLeap();
        return !!(window as any)[provider];
      }
    : () => !!(window as any).keplr || !!resolveLeap();

  const found = await waitForWalletInjection(checkFn);
  if (found) return getWalletExtension(provider);

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
      const wallet = await getWalletExtensionAsync(preferredProvider);
      if (!wallet) {
        throw new Error(
          "No wallet found. Please install Keplr (keplr.app) or Leap (leapwallet.io) browser extension and refresh the page."
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

      // Wait for the wallet extension to inject (extensions load asynchronously)
      const wallet = await getWalletExtensionAsync(provider);
      if (!wallet) return;

      await get().connect(provider);
    } catch {
      // Silently fail — user can manually reconnect
    }
  },
}));
