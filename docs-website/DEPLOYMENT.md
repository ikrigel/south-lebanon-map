# Vercel Deployment Guide

## Quick Start (3 minutes)

### Option 1: Deploy via CLI (Recommended)

```bash
# 1. Install Vercel CLI (if not already installed)
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy from this directory
cd docs-website
vercel

# Follow prompts:
# - Project name: coreset-calibration (or any name)
# - Framework: Next.js
# - Build command: `next build && next export`
# - Output directory: `out`
```

**Live URL will be provided** (example: `https://coreset-calibration.vercel.app/`)

---

### Option 2: Deploy via GitHub (Automatic)

1. **Push to GitHub:**
   ```bash
   cd c:/south-lebanon-map
   git add docs-website/
   git commit -m "Add Coreset Calibration website"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to https://vercel.com
   - Click "New Project"
   - Select your GitHub repository (south-lebanon-map)
   - Choose "docs-website" as root directory
   - Click "Deploy"

**Benefits:** Auto-deploy on every push to main

---

### Option 3: Deploy via Vercel Web UI

1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Upload `docs-website` folder
4. Click "Deploy"

---

## Configuration

**vercel.json** is pre-configured with:
- Build command: `next build && next export`
- Output directory: `out`
- Cache headers (1 hour)
- Security headers (X-Frame-Options, X-Content-Type-Options)

---

## After Deployment

### Custom Domain (Optional)

In Vercel Dashboard:
1. Go to Project Settings
2. Domains → Add Domain
3. Point your custom domain (e.g., `calibration.yourdomain.com`)

### Environment Variables

Currently none needed (no API calls).

### Monitoring

**Vercel Dashboard shows:**
- Deploy logs
- Function runtime analytics
- Page load metrics
- Error tracking

---

## Project Structure

```
docs-website/
├── pages/           # Next.js pages
├── components/      # React components
├── styles/          # CSS
├── public/          # Static assets (add later if needed)
├── package.json     # Dependencies
├── next.config.js   # Next.js config
├── vercel.json      # Vercel deployment config
└── tsconfig.json    # TypeScript config
```

---

## Development vs. Production

**Development:**
```bash
npm run dev
# http://localhost:3000
```

**Production Build:**
```bash
npm run build
# Outputs to ./out (static export)
```

**Serve Production Build Locally:**
```bash
npm run build
npm start
# http://localhost:3000
```

---

## Troubleshooting

### Build fails with TypeScript errors
```bash
# Check types
npm run typecheck

# Fix any errors before deploying
```

### "No build output" error
- Ensure `output: 'export'` in next.config.js
- Vercel uses `npm run build` which exports static HTML

### Want to see build logs?
```bash
# Deploy with verbose output
vercel --prod --verbose
```

---

## Advanced: Custom Build Commands

Edit **vercel.json** to customize:

```json
{
  "buildCommand": "npm run build && next export",
  "outputDirectory": "out",
  "installCommand": "npm install",
  "env": {
    "CUSTOM_VAR": "value"
  }
}
```

---

## Rollback

In Vercel Dashboard:
1. Go to Deployments
2. Find previous deployment
3. Click three dots → Promote to Production

---

## Next Steps

1. **Deploy:** Run `vercel` from docs-website directory
2. **Share URL:** Send deployed link to team
3. **Monitor:** Check Vercel Dashboard for analytics
4. **Iterate:** Push changes to main branch (auto-deploys if GitHub connected)

---

## Support

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Deployment Help: https://vercel.com/support

---

**Status:** Website ready for deployment ✅  
**Build:** Passing ✅  
**Pages:** 5 (Home, Overview, Algorithms, Testing, Timeline) ✅  
**Components:** 2 (Header, Navigation) ✅  
**Styles:** Responsive CSS included ✅

Deploy with confidence! 🚀
