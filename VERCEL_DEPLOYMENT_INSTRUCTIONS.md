# 🚀 Deploy Coreset Calibration Website to Vercel

## ⚡ Quick Deploy (2 minutes)

### Step 1: Go to Vercel Dashboard
Visit: https://vercel.com/dashboard

### Step 2: Create New Project
- Click **"New Project"** button
- Select **south-lebanon-map** repository
- Click **"Import"**

### Step 3: Configure Settings
- **Framework:** Next.js (auto-detected)
- **Root Directory:** `docs-website` ← IMPORTANT!
- **Build Command:** `npm run build`
- **Output Directory:** `.next` (or `out` for static)
- **Install Command:** `npm install`

### Step 4: Deploy
Click **"Deploy"** button and wait ~1-2 minutes.

**✅ Your website will be live at:** `https://your-project-name.vercel.app/`

---

## 📋 What Gets Deployed

```
Website Features:
✅ Home page - Hero, features, architecture, timeline
✅ Overview page - Problem, solution, components, results
✅ Algorithms page - SVD, Coreset, ICP, Zhang, Corner Detection
✅ Testing page - 61 unit + 23 E2E tests breakdown
✅ Timeline page - 6-week sprint schedule, milestones

Styling:
✅ Responsive design (mobile-first)
✅ Professional color scheme
✅ Fast page loads (85.4 KB total JS)
✅ Dark/light friendly
✅ Accessibility built-in

Performance:
✅ Static export (no server needed)
✅ CDN optimized
✅ Cache headers configured
✅ Security headers included
```

---

## 🔧 Advanced: CLI Deployment

### If you prefer command line:

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy from docs-website directory
cd docs-website
vercel

# 4. Answer prompts:
# Which scope? → Your Vercel account
# Link to existing project? → No
# Project name? → coreset-calibration (or your choice)
# Build command? → npm run build
# Output directory? → out (for static) or .next
```

**Result:** Same as dashboard deployment

---

## 📊 Project Structure (What's Deployed)

```
docs-website/
├── pages/
│   ├── index.tsx          (Home)
│   ├── overview.tsx       (Overview)
│   ├── algorithms.tsx     (Algorithms)
│   ├── testing.tsx        (Testing)
│   ├── timeline.tsx       (Timeline)
│   └── _app.tsx           (Layout)
├── components/
│   ├── Header.tsx         (Top header)
│   └── Navigation.tsx     (Nav bar)
├── styles/
│   └── globals.css        (All styling)
├── package.json           (Dependencies)
├── next.config.js         (Next.js config)
├── vercel.json            (Vercel config)
└── tsconfig.json          (TypeScript config)
```

---

## 🌐 Custom Domain (Optional)

After deployment:

1. In Vercel dashboard, go to your project
2. **Settings** → **Domains**
3. Add custom domain (e.g., `docs.yourdomain.com`)
4. Follow DNS configuration instructions

---

## 📈 Monitor After Deployment

**Vercel Dashboard shows:**
- ✅ Deploy status (success/failure)
- ✅ Build logs (if something fails)
- ✅ Page analytics (visits, load times)
- ✅ Function runtime (if using serverless)
- ✅ Error tracking

---

## 🔄 Auto-Deploy on Push (If using GitHub)

Once connected to GitHub:

1. Push any changes to `main` branch
2. Vercel automatically redeploys
3. No manual steps needed!

Example:
```bash
git add docs-website/
git commit -m "Update content"
git push origin main
# → Vercel auto-redeploys website ✨
```

---

## ✨ What You Get

- **Free:** Yes (Hobby tier included)
- **Speed:** Sub-second page loads
- **Uptime:** 99.99% SLA
- **HTTPS:** Automatic (Let's Encrypt)
- **Analytics:** Built-in
- **Logs:** Full access
- **Rollback:** One-click to previous version

---

## 🚨 Troubleshooting

### Build fails with "Module not found"
```bash
cd docs-website
npm install
npm run build
# Check for errors locally first
```

### Blank page after deploy
- Check Vercel build logs (click "Visit" → "Deployments")
- Verify `Root Directory` is set to `docs-website`
- Check browser console (F12) for errors

### Want to see build log?
In Vercel dashboard:
1. Click on deployment
2. Scroll to "Build Logs"
3. See full output

---

## 📝 Configuration Files

### next.config.js
- Enables static export
- Minifies JS/CSS
- Optimizes images

### vercel.json
- Cache headers (1 hour)
- Security headers (X-Frame, X-Content-Type)
- Redirects (GitHub link)

### package.json
- Dependencies: Next.js, React
- Build scripts: `npm run build`, `npm run dev`

---

## 🎯 Success Checklist

- [ ] GitHub repository connected to Vercel
- [ ] `docs-website` selected as root directory
- [ ] Build status: ✅ PASSED
- [ ] Website URL copied
- [ ] All 5 pages load correctly
- [ ] Navigation works
- [ ] Mobile responsive (test on phone)
- [ ] Links to GitHub work

---

## 📚 Additional Resources

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **GitHub Integration:** https://vercel.com/docs/git-integrations/github

---

## ✅ Status

**Website:** Ready for production ✅  
**Build:** Passing ✅  
**Pages:** 5 (all complete) ✅  
**Performance:** Optimized ✅  
**Responsive:** Yes ✅  

**Time to deploy:** ~5 minutes ⏱️

---

**Questions?**
- Check Vercel dashboard logs
- Review DEPLOYMENT.md in docs-website folder
- See README.md for dev setup

🚀 **Deploy now and share the link!**

