# 🔥 YMN Brotherhood Protocol

**Half for the fire, half for the family.**

Automated buyback and airdrop system for $YMN token that processes Pump.fun creator fees.

## 🎯 What It Does

This tool automatically:
1. **Monitors** your Pump.fun creator fee wallet every X minutes
2. **Splits** collected fees 50/50:
   - 🔥 **50% for Buybacks** - Market buys $YMN to support price floor
   - 👥 **50% for Airdrops** - Rewards random qualified token holders
3. **Logs** all transactions for complete transparency

## 🚀 Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Required
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY
CREATOR_WALLET_PRIVATE_KEY=your_base58_private_key_here
YMN_TOKEN_MINT=your_ymn_token_mint_address_here

# Optional - defaults shown
CHECK_INTERVAL_MINUTES=10
MIN_BALANCE_TO_PROCESS=0.1
BUYBACK_PERCENTAGE=50
AIRDROP_PERCENTAGE=50
```

### 3. Get Your Private Key

From Phantom or Solflare:
1. Settings → Export Private Key
2. Copy the Base58 string
3. Paste into `CREATOR_WALLET_PRIVATE_KEY`

**⚠️ SECURITY WARNING**: Never share your `.env` file or commit it to git!

### 4. Get Helius API Key

1. Sign up at [helius.dev](https://helius.dev)
2. Create a new project
3. Copy your mainnet RPC URL
4. Paste into `HELIUS_RPC_URL`

You already have: `https://mainnet.helius-rpc.com/?api-key=YOUR_KEY`

### 5. Get Your Token Mint Address

After creating your token on Pump.fun:
1. Find your token on Solscan
2. Copy the mint address
3. Paste into `YMN_TOKEN_MINT`

## ▶️ Running

### Development Mode (with auto-restart)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

### Run in Background (Linux/Mac)

```bash
nohup npm start > brotherhood.log 2>&1 &
```

### Stop Background Process

```bash
pkill -f "node index.js"
```

## 📊 How It Works

### Fee Collection
- Checks creator fee wallet every `CHECK_INTERVAL_MINUTES`
- Only processes if balance ≥ `MIN_BALANCE_TO_PROCESS` SOL
- Reserves 0.01 SOL for transaction fees

### Buybacks (50%)
- **Reserves** 50% of fees in your creator wallet
- You manually use this SOL to buyback $YMN tokens
- SOL stays in wallet - script just logs the amount reserved
- Provides transparency on how much is available for buybacks

### Airdrops (50%)
- Fetches all token holders via Helius
- Filters by minimum balance (`MIN_HOLDER_BALANCE`)
- Excludes creator wallet
- Randomly selects `NUMBER_OF_WINNERS_PER_ROUND` winners
- Distributes SOL equally to winners
- Logs all transactions with Solscan links

## 📁 Project Structure

```
├── index.js              # Main protocol logic
├── utils/
│   ├── logger.js         # Logging system
│   └── holders.js        # Holder snapshot & selection
├── logs/                 # Transaction logs (auto-created)
├── .env                  # Your configuration (DO NOT COMMIT)
├── .env.example          # Example configuration
└── package.json          # Dependencies
```

## 📝 Logs

Logs are written to:
- **Console**: Colorized real-time output
- **Files**: `logs/brotherhood-YYYY-MM-DD.log` (if `LOG_TO_FILE=true`)

Each log includes:
- Timestamp
- Action type
- Transaction signatures
- Solscan links for verification

## 🔧 Configuration Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `CHECK_INTERVAL_MINUTES` | 10 | How often to check for fees |
| `MIN_BALANCE_TO_PROCESS` | 0.1 | Minimum SOL to trigger processing |
| `BUYBACK_PERCENTAGE` | 50 | % of fees for buybacks |
| `AIRDROP_PERCENTAGE` | 50 | % of fees for airdrops |
| `MIN_HOLDERS_FOR_AIRDROP` | 10 | Minimum holders required |
| `NUMBER_OF_WINNERS_PER_ROUND` | 1 | Winners per airdrop cycle |
| `MIN_HOLDER_BALANCE` | 100 | Minimum tokens to qualify |
| `SLIPPAGE_BPS` | 300 | Slippage tolerance (3%) |

## ⚠️ Important Notes

### Manual Buybacks
The buyback portion (50%) stays in your creator wallet:
- Script logs how much SOL is reserved for buybacks
- You manually use this SOL to buyback $YMN tokens on pump.fun or DEX
- Provides flexibility and control over timing/price
- Keeps process transparent for community

### Security
- **Never** commit `.env` to version control
- Keep your private key secure
- Run on a trusted server
- Monitor logs regularly

### Transparency
- All transactions are logged with signatures
- Check logs in `logs/` folder
- Share Solscan links with community
- Consider posting weekly reports

## 🛠️ Troubleshooting

### "Missing required environment variables"
- Check your `.env` file exists
- Verify all required variables are set

### "Failed to load creator wallet"
- Ensure private key is in Base58 format
- Try exporting again from your wallet

### "Failed to fetch token holders"
- Verify `YMN_TOKEN_MINT` address is correct
- Check Helius API key is valid
- Ensure token has been created

### "Not enough qualified holders"
- Lower `MIN_HOLDERS_FOR_AIRDROP`
- Lower `MIN_HOLDER_BALANCE`
- Wait for more holders to accumulate

## 📜 License

MIT

## 🤝 Brotherhood

YOO YOO MY NIGGA

For the broken, the bagholders, the forgotten dreamers.  
Half for the fire, half for the family.

---

*This tool is for the $YMN community. Use responsibly and transparently.*
