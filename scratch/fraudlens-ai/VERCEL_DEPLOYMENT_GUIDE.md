# 🚀 FraudLens AI — Vercel Deployment Guide

FraudLens AI is designed for seamless, full-stack serverless deployment on [Vercel](https://vercel.com). Both the React Vite frontend and the Python FastAPI prediction engine run from a single repository under a unified domain.

---

## 🏗️ Architecture on Vercel

```
                         ┌───────────────────────────────────────────┐
                         │       Incoming HTTPS Traffic              │
                         │    https://fraudlens-ai.vercel.app        │
                         └─────────────────────┬─────────────────────┘
                                               │
                       ┌───────────────────────┴──────────────────────┐
                       │                                              │
              Paths: /api/*, /docs, /openapi.json             All other paths (/*)
                       │                                              │
                       ▼                                              ▼
        ┌─────────────────────────────┐               ┌─────────────────────────────┐
        │   Vercel Serverless Function│               │      Vercel Edge CDN        │
        │       Python 3.12 Runtime   │               │     Static SPA Assets       │
        │        `api/index.py`       │               │      `frontend/dist/`       │
        │  (FastAPI Prediction Engine)│               │  (React + Tailwind + Vite)  │
        └──────────────┬──────────────┘               └─────────────────────────────┘
                       │
       ┌───────────────┴───────────────┐
       ▼                               ▼
┌──────────────┐              ┌────────────────┐
│ Model Store  │              │ Ephemeral DB   │
│ 170KB Model  │              │ /tmp/fraudlens.db│
│  (Read-only) │              │ (Self-healing  │
└──────────────┘              │  Auto-seeding) │
                              └────────────────┘
```

---

## ⚡ Deployment Methods

### Option A: Via GitHub (Recommended)

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: FraudLens AI initial release"
   git remote add origin https://github.com/<your-username>/fraudlens-ai.git
   git branch -M main
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com) and log in.
   - Click **Add New...** → **Project**.
   - Select your `fraudlens-ai` repository and click **Import**.
   - **Framework Preset**: Leave as *Other* (configured by `vercel.json`).
   - **Root Directory**: `./` (leave default).
   - Click **Deploy**.

---

### Option B: Via Vercel CLI

If you have Node.js and npm installed:

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy from the project root
vercel

# 4. Deploy to Production
vercel --prod
```

---

## 🛠️ Key Serverless Enhancements Made

| Feature | How It Works in Serverless |
|---------|----------------------------|
| **Unified Routing** | `vercel.json` routes `/api/(.*)` to `api/index.py` and static requests to `frontend/dist`. |
| **Model Ingestion** | The 170KB trained Scikit-learn champion model (`model_store/fraudlens_predictor.joblib`) is included in the serverless bundle via `includeFiles`. |
| **Serverless SQLite** | Vercel provides a read-only filesystem except for `/tmp`. `backend/app/db/repository.py` automatically clones the pre-seeded SQLite database into `/tmp/fraudlens.db` upon function execution, ensuring full read/write support for feedback, uploads, and simulation without crashes. |
| **Cold Start Auto-Seeding** | If a fresh serverless instance spins up with an empty `/tmp` database, `backend/app/api/endpoints.py` detects 0 transactions and automatically seeds the 2,480 benchmark transactions and demo cases from `data/synthetic_transactions.csv`. |
| **API Client Dynamic Base URL** | `frontend/src/services/api.ts` automatically defaults to `/api` (same-origin), avoiding CORS or hardcoded hostnames, while honoring optional `VITE_API_URL` overrides. |

---

## 🔍 Verification After Deployment

Once deployed, verify these endpoints:

1. **Frontend**: Open `https://<your-project>.vercel.app/`
2. **Swagger Docs**: Open `https://<your-project>.vercel.app/docs`
3. **Health Check**: Open `https://<your-project>.vercel.app/api/health`
   Expected response:
   ```json
   {
     "status": "healthy",
     "service": "FraudLens AI Prediction Engine",
     "model_version": "v1.2.0-champion",
     "database": "SQLite (Active)",
     "synthetic_demo_badge": true
   }
   ```
4. **Interactive Demo**:
   - Click **Case A** on the dashboard to view the legitimate luxury transaction.
   - Click **Case B** to inspect the account takeover replay and counterfactual simulator.
   - Click **Case C** to view the Cytoscape.js syndicate network radar.
