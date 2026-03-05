# Deploy Instructions

## Prerequisites
- GitHub account
- Railway account (railway.app) — free tier
- Vercel account (vercel.com) — free tier

## Step 1: Push to GitHub

```bash
git remote add origin https://github.com/YOUR-USERNAME/kpop-memotest.git
git push -u origin main
```

## Step 2: Deploy Backend (Railway)

1. Go to https://railway.app → New Project → Deploy from GitHub
2. Select `kpop-memotest` repo
3. Set **Root Directory** to `server`
4. Railway auto-detects Node.js
5. Copy the generated public URL (e.g. `https://kpop-memotest-server.up.railway.app`)

## Step 3: Configure Frontend

Edit `client/.env.production`:
```
VITE_SOCKET_URL=https://YOUR-RAILWAY-URL.up.railway.app
```

Commit and push:
```bash
git add client/.env.production
git commit -m "chore: add production backend URL"
git push
```

## Step 4: Deploy Frontend (Vercel)

1. Go to https://vercel.com → New Project → Import from GitHub
2. Select `kpop-memotest` repo
3. Set **Root Directory** to `client`
4. Add environment variable: `VITE_SOCKET_URL` = your Railway URL
5. Deploy — Vercel gives you a public URL

## Step 5: Test

1. Open Vercel URL on tablet → Create sala → note PIN + QR code
2. Open Vercel URL on a phone → Scan QR or enter PIN → enter name → join
3. Host presses "Iniciar Juego!"
4. Verify cards flip and score updates on both devices

## Step 6: Add Real Audio Files

Replace placeholders in `client/public/audio/` with real MP3 files:
- `bg-music.mp3` — K-Pop instrumental (~30s loop) — try pixabay.com/music
- `flip.mp3` — card flip sound (~0.3s) — try freesound.org
- `match.mp3` — fanfare (~1s) — try freesound.org  
- `victory.mp3` — victory jingle (~3-4s) — try freesound.org

After adding files, run locally to test:
```bash
cd client && npm run dev
```

Then push to trigger Vercel redeploy:
```bash
git add client/public/audio/
git commit -m "feat: add real audio files"
git push
```
