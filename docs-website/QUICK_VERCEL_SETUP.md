# ⚡ Quick Vercel Setup (5 minutes)

## Step 1: Create Vercel Account (if needed)
Go to https://vercel.com/signup and create an account (free tier is fine).

---

## Step 2: Import Project to Vercel

### Option A: Via GitHub Integration (Easiest - Recommended)

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Paste: `https://github.com/ikrigel/south-lebanon-map`
4. Click **"Import"**
5. Configure Project:
   - **Project Name:** `coreset-calibration` (or your choice)
   - **Framework:** Next.js (auto-detected ✓)
   - **Root Directory:** Change to `docs-website` ← IMPORTANT!
   - Click **"Environment Variables"** → Skip (not needed)
6. Click **"Deploy"**

✅ **Done!** Website will be live in 1-2 minutes.

**Your live URL:** `https://coreset-calibration.vercel.app/`

---

### Option B: Via CLI (Advanced)

```bash
# 1. Install Vercel CLI
npm install -g vercel@latest

# 2. Login (opens browser)
vercel login

# 3. Deploy
cd docs-website
vercel --prod
```

---

## Step 3: Set Up Auto-Deploy (Optional but Recommended)

This makes your site auto-update whenever you push to GitHub.

1. Go to your Vercel project: https://vercel.com/dashboard
2. Click on your project
3. Go to **Settings → Git Integration**
4. Verify **GitHub** is connected
5. Verify **Automatic Deployments** is enabled

✅ Now every push to `main` branch auto-deploys!

---

## Step 4: Custom Domain (Optional)

To use a custom domain instead of `vercel.app`:

1. In Vercel dashboard, go to **Domains**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `docs.yourdomain.com`)
4. Follow DNS instructions for your domain provider

---

## ✅ Verification

Once deployed, verify:

- [ ] Homepage loads at your Vercel URL
- [ ] Navigation bar works (click each page)
- [ ] Mobile responsive (test on phone)
- [ ] All 5 pages load correctly
- [ ] Links to GitHub work

---

## 📊 Monitor Your Deployment

**Vercel Dashboard shows:**
- ✅ Deploy status (success/failure)
- ✅ Build logs
- ✅ Page analytics (traffic, load times)
- ✅ Error tracking
- ✅ Performance metrics

---

## 🔄 Update Website

Every time you make changes:

```bash
# Push to GitHub
git add docs-website/
git commit -m "Update website content"
git push origin main

# → Vercel automatically redeploys! ✨
```

---

## 🚨 Troubleshooting

### "Root directory not found"
- Vercel dashboard → Project Settings
- Change **Root Directory** to `docs-website`
- Click **Save**
- Redeploy

### "Build failed"
- Check Vercel dashboard → Deployments → View Build Logs
- Look for error messages
- Common fixes:
  ```bash
  cd docs-website
  npm install
  npm run build
  ```

### "Blank white page"
- Check browser console (F12)
- Check Vercel logs for errors
- Make sure Root Directory is `docs-website`

---

## 📚 Useful Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Project Settings:** https://vercel.com/dashboard/your-project/settings
- **Docs:** https://vercel.com/docs
- **GitHub Integration:** https://vercel.com/docs/git-integrations/github

---

## ✨ Success!

Your Coreset Calibration website is now live! 🚀

Share your URL with your team:
```
https://coreset-calibration.vercel.app/
```

---

**Need help?** Check the full `DEPLOYMENT.md` guide in this folder.
