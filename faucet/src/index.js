// ─────────────────────────────────────────────────────────────────────────────
// Citizen Ledger Testnet Faucet
// Simple HTTP server that dispenses test tokens (rate-limited per address)
// ─────────────────────────────────────────────────────────────────────────────

import express from 'express';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { SigningStargateClient, GasPrice } from '@cosmjs/stargate';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// ── Configuration ───────────────────────────────────────────────────────────

const config = {
  // Chain
  rpcEndpoint: process.env.RPC_ENDPOINT || 'http://localhost:26657',
  chainId: process.env.CHAIN_ID || 'citizen-testnet-1',
  denom: process.env.DENOM || 'ucitizen',
  prefix: process.env.BECH32_PREFIX || 'citizen',
  gasPrice: process.env.GAS_PRICE || '0.025ucitizen',
  
  // Faucet
  mnemonic: process.env.FAUCET_MNEMONIC || '',
  amountPerRequest: process.env.AMOUNT_PER_REQUEST || '10000000000', // 10,000 CITIZEN
  port: parseInt(process.env.PORT || '3001', 10),
  
  // Rate limiting
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '86400', 10), // 24 hours in seconds
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX || '1', 10),   // 1 request per window
};

// ── Validate Config ─────────────────────────────────────────────────────────

if (!config.mnemonic) {
  console.error('ERROR: FAUCET_MNEMONIC environment variable is required');
  console.error('Generate one with: wasmd keys add faucet --keyring-backend test');
  console.error('Then export: wasmd keys export faucet --unarmored-hex --unsafe --keyring-backend test');
  process.exit(1);
}

// ── Rate Limiter ────────────────────────────────────────────────────────────

const rateLimiter = new RateLimiterMemory({
  points: config.rateLimitMaxRequests,
  duration: config.rateLimitWindow,
  keyPrefix: 'faucet',
});

// ── Wallet & Client ─────────────────────────────────────────────────────────

let wallet;
let client;
let faucetAddress;

async function initWallet() {
  console.log('Initializing faucet wallet...');
  
  wallet = await DirectSecp256k1HdWallet.fromMnemonic(config.mnemonic, {
    prefix: config.prefix,
  });
  
  const [account] = await wallet.getAccounts();
  faucetAddress = account.address;
  
  client = await SigningStargateClient.connectWithSigner(
    config.rpcEndpoint,
    wallet,
    { gasPrice: GasPrice.fromString(config.gasPrice) }
  );
  
  const balance = await client.getBalance(faucetAddress, config.denom);
  console.log(`Faucet address: ${faucetAddress}`);
  console.log(`Faucet balance: ${balance.amount} ${balance.denom}`);
  console.log(`Amount per request: ${config.amountPerRequest} ${config.denom}`);
}

// ── Express App ─────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check
app.get('/health', async (req, res) => {
  try {
    const balance = await client.getBalance(faucetAddress, config.denom);
    res.json({
      status: 'ok',
      faucetAddress,
      balance: balance.amount,
      denom: config.denom,
      amountPerRequest: config.amountPerRequest,
      chainId: config.chainId,
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Get faucet info
app.get('/', (req, res) => {
  res.json({
    name: 'Citizen Ledger Testnet Faucet',
    chainId: config.chainId,
    faucetAddress,
    denom: config.denom,
    amountPerRequest: `${parseInt(config.amountPerRequest) / 1_000_000} CITIZEN`,
    rateLimitWindow: `${config.rateLimitWindow / 3600} hours`,
    usage: 'POST /faucet with { "address": "citizen1..." }',
  });
});

// Request tokens
app.post('/faucet', async (req, res) => {
  const { address } = req.body;
  
  // Validate address
  if (!address) {
    return res.status(400).json({ error: 'Missing address in request body' });
  }
  
  if (!address.startsWith(config.prefix)) {
    return res.status(400).json({ 
      error: `Invalid address prefix. Expected ${config.prefix}...` 
    });
  }
  
  // Check rate limit
  try {
    await rateLimiter.consume(address);
  } catch (rateLimitRes) {
    const retryAfter = Math.ceil(rateLimitRes.msBeforeNext / 1000);
    const hours = Math.ceil(retryAfter / 3600);
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: `You can request tokens again in ${hours} hour(s)`,
      retryAfter,
    });
  }
  
  // Send tokens
  try {
    console.log(`Sending ${config.amountPerRequest} ${config.denom} to ${address}...`);
    
    const result = await client.sendTokens(
      faucetAddress,
      address,
      [{ denom: config.denom, amount: config.amountPerRequest }],
      'auto',
      'Citizen Ledger Testnet Faucet'
    );
    
    console.log(`TX sent: ${result.transactionHash}`);
    
    res.json({
      success: true,
      txHash: result.transactionHash,
      amount: config.amountPerRequest,
      denom: config.denom,
      recipient: address,
    });
  } catch (err) {
    console.error('Faucet error:', err.message);
    
    // Refund rate limit on failure
    try {
      await rateLimiter.reward(address, 1);
    } catch (e) {
      // Ignore reward errors
    }
    
    // Check for common errors
    if (err.message.includes('insufficient funds')) {
      return res.status(503).json({
        error: 'Faucet is empty',
        message: 'The faucet has run out of funds. Please try again later.',
      });
    }
    
    res.status(500).json({
      error: 'Transaction failed',
      message: err.message,
    });
  }
});

// ── Start Server ────────────────────────────────────────────────────────────

async function main() {
  await initWallet();
  
  app.listen(config.port, () => {
    console.log(`\n🚰 Citizen Ledger Faucet running on port ${config.port}`);
    console.log(`   Chain:    ${config.chainId}`);
    console.log(`   RPC:      ${config.rpcEndpoint}`);
    console.log(`   Address:  ${faucetAddress}`);
    console.log(`\nEndpoints:`);
    console.log(`   GET  /         - Faucet info`);
    console.log(`   GET  /health   - Health check`);
    console.log(`   POST /faucet   - Request tokens { "address": "citizen1..." }\n`);
  });
}

main().catch((err) => {
  console.error('Failed to start faucet:', err);
  process.exit(1);
});
