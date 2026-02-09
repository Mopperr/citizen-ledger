# Citizen Ledger Testnet Faucet

A simple HTTP faucet service for distributing testnet tokens.

## Features

- 🚰 Dispenses test CITIZEN tokens via HTTP POST
- ⏱️ Rate limiting (1 request per address every 24 hours)
- 🔒 CORS enabled for frontend integration
- 💚 Health check endpoint

## Quick Start

1. **Install dependencies:**
   ```bash
   cd faucet
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your faucet mnemonic
   ```

3. **Start the faucet:**
   ```bash
   npm start
   ```

## API Endpoints

### GET /
Returns faucet info and usage instructions.

### GET /health
Health check with balance info.

**Response:**
```json
{
  "status": "ok",
  "faucetAddress": "citizen1...",
  "balance": "500000000000",
  "denom": "ucitizen",
  "chainId": "citizen-testnet-1"
}
```

### POST /faucet
Request test tokens.

**Request:**
```json
{
  "address": "citizen1abc123..."
}
```

**Success Response:**
```json
{
  "success": true,
  "txHash": "ABC123...",
  "amount": "10000000000",
  "denom": "ucitizen",
  "recipient": "citizen1abc123..."
}
```

**Rate Limited Response (429):**
```json
{
  "error": "Rate limit exceeded",
  "message": "You can request tokens again in 24 hour(s)",
  "retryAfter": 86400
}
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `RPC_ENDPOINT` | `http://localhost:26657` | Chain RPC endpoint |
| `CHAIN_ID` | `citizen-testnet-1` | Chain ID |
| `DENOM` | `ucitizen` | Token denomination |
| `BECH32_PREFIX` | `citizen` | Address prefix |
| `FAUCET_MNEMONIC` | (required) | Faucet wallet mnemonic |
| `AMOUNT_PER_REQUEST` | `10000000000` | Amount per request (10K CITIZEN) |
| `PORT` | `3001` | HTTP server port |
| `RATE_LIMIT_WINDOW` | `86400` | Rate limit window in seconds |
| `RATE_LIMIT_MAX` | `1` | Max requests per window |

## Deployment

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### systemd Service
```ini
[Unit]
Description=Citizen Ledger Faucet
After=network.target

[Service]
Type=simple
User=citizen
WorkingDirectory=/opt/citizen-faucet
EnvironmentFile=/opt/citizen-faucet/.env
ExecStart=/usr/bin/node src/index.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

## Frontend Integration

```typescript
async function requestTokens(address: string) {
  const response = await fetch('https://faucet.citizenledger.io/faucet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  });
  return response.json();
}
```
