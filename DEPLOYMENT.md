# Deployment Guide: YMN Sacrifice Protocol

## Overview
- **Frontend**: Vercel (static hosting)
- **Backend**: VPS/Railway/Render or local machine
- **Data Flow**: Node.js → GitHub → Vercel

## Step 1: Setup GitHub

1. **Create GitHub Personal Access Token**
   - Go to https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scopes: `repo` (full control)
   - Copy the token (you won't see it again!)

2. **Update .env file**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add:
   ```
   GITHUB_AUTO_PUSH=true
   GITHUB_TOKEN=ghp_your_token_here
   GITHUB_REPO=klingon-droid/yomyninja
   GITHUB_BRANCH=main
   ```

## Step 2: Update HTML Configuration

Edit `index.html` at line ~973:
```javascript
const GITHUB_REPO = 'klingon-droid/yomyninja'; // Your repo
const GITHUB_BRANCH = 'main'; // Your branch
```

## Step 3: Deploy Frontend to Vercel

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Setup sacrifice protocol"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Go to https://vercel.com
   - Import your GitHub repo
   - Root directory: `.` (project root)
   - Build command: (leave empty - it's static HTML)
   - Output directory: (leave empty)
   - Click "Deploy"

## Step 4: Run Node.js Script

### Option A: Local Machine
```bash
npm install
npm start
```

### Option B: VPS (Ubuntu/Debian)
```bash
# SSH into your VPS
ssh user@your-vps-ip

# Clone repo
git clone https://github.com/klingon-droid/yomyninja.git
cd yomyninja

# Install Node.js (if needed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install dependencies
npm install

# Setup .env file
nano .env
# (paste your config)

# Run with PM2 (keeps running after logout)
npm install -g pm2
pm2 start index.js --name ymn-protocol
pm2 save
pm2 startup
```

### Option C: Railway
1. Go to https://railway.app
2. Create new project → Deploy from GitHub
3. Select your repo
4. Add environment variables from `.env`
5. Deploy

### Option D: Render
1. Go to https://render.com
2. New → Background Worker
3. Connect GitHub repo
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add environment variables
7. Create service

## Step 5: Verify Everything Works

1. **Check Node.js logs**
   - You should see: "Stats pushed to GitHub"

2. **Check GitHub**
   - `stats.json` should appear in your repo

3. **Check Vercel website**
   - Stats should update from "Coming Soon" to real values
   - Auto-refreshes every 30 seconds

## Troubleshooting

**Stats not updating?**
- Check Node.js logs for GitHub push errors
- Verify GitHub token has `repo` permissions
- Check `stats.json` exists in GitHub repo

**Website shows "Coming Soon"?**
- Check browser console for fetch errors
- Verify GITHUB_REPO and GITHUB_BRANCH in HTML are correct
- Check GitHub raw URL: `https://raw.githubusercontent.com/YOUR_REPO/main/stats.json`

**Node.js can't push to GitHub?**
- Initialize git: `git init && git remote add origin https://github.com/YOUR_REPO.git`
- Set git config: `git config user.name "Bot" && git config user.email "bot@example.com"`

## How It Works

```
┌─────────────────┐
│   Node.js Bot   │  Runs every 10 min
│  (VPS/Local)    │  Checks wallet → Splits fees
└────────┬────────┘  Buyback + Airdrops
         │
         ├─ Writes stats.json
         ├─ git add stats.json
         ├─ git commit
         └─ git push
                │
                ▼
        ┌───────────────┐
        │  GitHub Repo  │  Stores stats.json
        └───────┬───────┘
                │
                ▼ (fetched via raw.githubusercontent.com)
        ┌───────────────┐
        │ Vercel Website│  Auto-updates every 30s
        └───────────────┘
```

## Security Notes

- ✅ `.env` is gitignored (never commit it!)
- ✅ `stats.json` is gitignored in .gitignore but committed separately by script
- ✅ GitHub token stored securely in .env
- ⚠️ Never share your `.env` file or private keys
