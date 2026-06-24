# Coreset Camera Calibration Website

Professional documentation website for Phase 3 implementation plan.

## Overview

- 🎥 **Project:** Coreset-based camera intrinsics calibration
- 📚 **Pages:** Home, Overview, Algorithms, Testing, Timeline
- 🧪 **Content:** 84 tests, 6-week roadmap, mathematical algorithms
- 🚀 **Deployment:** Vercel (static export)

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Building

```bash
npm run build
```

Outputs static files to `out/` directory.

## Deployment to Vercel

```bash
npm install -g vercel
vercel
```

Or connect GitHub repository directly to Vercel for auto-deploy.

## Structure

```
pages/
  ├── index.tsx          # Home page
  ├── overview.tsx       # Project overview
  ├── algorithms.tsx     # Mathematical algorithms
  ├── testing.tsx        # Test plan (84 tests)
  ├── timeline.tsx       # 6-week implementation
  └── _app.tsx           # App wrapper

components/
  ├── Header.tsx         # Page header
  └── Navigation.tsx     # Nav bar

styles/
  └── globals.css        # All styling
```

## Features

✅ Responsive design (mobile-first)  
✅ Dark/light-friendly color scheme  
✅ Syntax-highlighted code blocks  
✅ Interactive navigation  
✅ Performance optimized (static export)  
✅ SEO ready (Next.js meta tags)  

## License

2026 Coreset Camera Calibration Project

