# 🛒 Grocery Coin Protocol

**The first memecoin designed to actually help people pay their bills.**

Automated random payout system for Grocery Coin that processes Pump.fun creator fees and distributes 100% to one lucky holder every 5 minutes.

## 🎯 What It Does

This tool automatically:
1. **Monitors** your Pump.fun creator fee wallet every 5 minutes
2. **Collects** 100% of creator fees into a prize pool
3. **Randomly selects** one qualified token holder
4. **Distributes** the entire pool to that single winner
5. **Logs** all transactions for complete transparency

Win the pool. Buy your groceries. Touch grass. Repeat.

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
YMN_TOKEN_MINT=your_grocery_coin_token_mint_address_here

# Optional - defaults shown
CHECK_INTERVAL_MINUTES=5
MIN_BALANCE_TO_PROCESS=0.01
BUYBACK_PERCENTAGE=0
AIRDROP_PERCENTAGE=100
NUMBER_OF_WINNERS_PER_ROUND=1
MIN_HOLDER_BALANCE=100
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

### 5. Get Your Token Mint Address

After creating your token on Pump.fun:
1. Find your token on Solscan
2. Copy the mint address
3. Paste into `YMN_TOKEN_MINT`

### 6. Enable GitHub Auto-Push (Optional)

To automatically publish stats to your landing page:

```env
GITHUB_AUTO_PUSH=true
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_REPO=username/repo-name
GITHUB_BRANCH=main
```

Get a GitHub token at: Settings → Developer settings → Personal access tokens → Generate new token (classic)
- Select scope: `repo` (Full control of private repositories)

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
nohup npm start > grocery-coin.log 2>&1 &
```

### Stop Background Process

```bash
pkill -f "node index.js"
```

## 📊 How It Works

### The Mechanism

1. **Fee Pool**
   - All creator fees skip the creator wallet
   - Fees are redirected instantly to the live prize pool
   - Transparent and non-negotiable

2. **Random Trigger**
   - Every 300 seconds (5 minutes), the on-chain randomizer fires
   - No influence. No funny business. Just pure chance.

3. **Payout**
   - The single winning wallet receives the entire pool value
   - Direct. Immediate. No intermediary.

### Fee Collection
- Checks creator fee wallet every 5 minutes
- Only processes if balance ≥ `MIN_BALANCE_TO_PROCESS` SOL
- Reserves 0.01 SOL for transaction fees

### Winner Selection
- Fetches all token holders via Helius
- Filters by minimum balance (`MIN_HOLDER_BALANCE`)
- Excludes creator wallet
- Randomly selects 1 winner per round
- Distributes 100% of pool to winner
- Logs all transactions with Solscan links

### Stats Tracking
- Updates `stats.json` after each cycle
- Tracks total draws, winners, total distributed, and average win
- Auto-pushes to GitHub if configured
- Landing page fetches and displays stats in real-time

## 📁 Project Structure

```
├── index.html            # Grocery Coin landing page (Neo-brutalist design)
├── index.js              # Main protocol logic
├── stats.json            # Live stats (auto-updated)
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
- **Files**: `logs/grocery-coin-YYYY-MM-DD.log` (if `LOG_TO_FILE=true`)

Each log includes:
- Timestamp
- Action type
- Transaction signatures
- Solscan links for verification

## 🔧 Configuration Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `CHECK_INTERVAL_MINUTES` | 5 | How often to check for fees |
| `MIN_BALANCE_TO_PROCESS` | 0.01 | Minimum SOL to trigger processing |
| `BUYBACK_PERCENTAGE` | 0 | % of fees for buybacks (unused) |
| `AIRDROP_PERCENTAGE` | 100 | % of fees for distribution |
| `MIN_HOLDERS_FOR_AIRDROP` | 10 | Minimum holders required |
| `NUMBER_OF_WINNERS_PER_ROUND` | 1 | Winners per cycle (always 1) |
| `MIN_HOLDER_BALANCE` | 100 | Minimum tokens to qualify |

## 🌐 Landing Page

The `index.html` file is a static landing page that:
- Displays live stats from `stats.json`
- Shows countdown timer to next payout
- Displays current pool value and last winner
- Links to Solscan for transaction history
- Features neo-brutalist design with Chivo Mono and Oswald fonts
- Responsive layout with Tailwind CSS

### Design Features
- **Neo-brutalist aesthetic**: Heavy borders, harsh shadows, high contrast
- **Color scheme**: Off-white background, hot pink/red accents, neon yellow highlights, black borders
- **Typography**: Chivo Mono (monospace) for body, Oswald (aggressive sans-serif) for headings
- **Animations**: Janky, non-smooth scroll reveals and hover effects

### Deploying the Landing Page

1. **GitHub Pages** (Free):
   - Push to GitHub
   - Settings → Pages → Source: main branch
   - Your site will be at: `https://username.github.io/repo-name`

2. **Vercel** (Free):
   ```bash
   npm install -g vercel
   vercel
   ```

3. **Netlify** (Free):
   - Drag and drop the repo folder to [netlify.com/drop](https://netlify.com/drop)

The landing page automatically refreshes stats every 30 seconds and updates the countdown timer every second.

## ⚠️ Important Notes

### 100% Payout Model
- NO buybacks - 100% of fees go to winners
- One winner takes all each cycle
- Creates maximum excitement and volatility
- Holder participation incentivizes buying and holding

### Security
- **Never** commit `.env` to version control
- Keep your private key secure
- Run on a trusted server
- Monitor logs regularly

### Transparency
- All transactions are logged with signatures
- Check logs in `logs/` folder
- Share Solscan links with community
- Stats are public on your landing page
- Consider posting winner announcements

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

### Stats not updating on landing page
- Ensure `stats.json` exists and is being updated
- Check GitHub auto-push is working (if enabled)
- Verify landing page is fetching from correct URL

## 📜 License

MIT

## 🛒 Grocery Coin

100% Creator Fees Paid to 1 Holder Every 5 Minutes.

Win the pool. Buy your groceries. Touch grass. Repeat.

Built on Solana. No warranties.

---

*This tool is for the Grocery Coin community. Use responsibly and transparently.*
