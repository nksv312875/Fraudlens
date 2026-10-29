# 🔍 FraudLens AI
### *Detect smarter. Explain every alert. Reduce false alarms.*

> **Zeckathon PS2 — Explainable Financial Risk & Fraud Analytics**

FraudLens AI is a complete, locally-runnable prototype that combines a genuine ML prediction pipeline, three-outcome triage, interactive graph analysis, chronological replay, and a full investigator workflow — all built without paid APIs or bank credentials.

---

## ✅ Quick Start (Windows / VS Code)

### Prerequisites
- Python 3.12 ([download](https://www.python.org/downloads/release/python-3120/))
- Node.js 20+ with npm ([download](https://nodejs.org/))

### Step 1 — Clone / Open the Project

```powershell
# Open a new PowerShell terminal in VS Code
cd "C:\path\to\fraudlens-ai"
```

### Step 2 — Backend Setup

```powershell
# Install Python dependencies
pip install -r requirements.txt

# Start the backend API server (from project root)
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend will be available at: http://127.0.0.1:8000  
Swagger API docs at: http://127.0.0.1:8000/docs

### Step 3 — Frontend (Development Mode)

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend will be available at: http://localhost:5173

### Step 4 — Frontend (Production Build — Served by Backend)

```powershell
cd frontend
npm run build   # Outputs to frontend/dist/
```

Then visit: http://127.0.0.1:8000 (backend serves the built frontend).

---

## 🔁 Reset Demo Data

If the database gets modified, you can reset to benchmark factory state:

```powershell
# Via API
curl -X POST http://127.0.0.1:8000/api/demo/reset

# Or via the "Reset Demo" button in the top Navbar
```

---

## 🤖 Retrain the ML Model

```powershell
cd backend
python -m app.ml.train
```

This will:
1. Load `data/synthetic_transactions.csv`
2. Run the full chronological train/val/test pipeline
3. Save the fitted predictor to `model_store/fraudlens_predictor.joblib`
4. Save evaluation metrics to `model_store/evaluation_metrics.json`

---

## 🧪 Run Automated Tests

```powershell
cd backend
python -m pytest tests/ -v
```

**All 11 tests pass.** Tests cover:
- Health check and API connectivity
- Overview statistics calculation
- Queue filtering and sorting (HIGH RISK, by amount)
- Demo Case A: Legitimate unusual transaction
- Demo Case B: Account takeover (HIGH RISK expected)
- Demo Case C: Graph syndicate detection
- Counterfactual simulator
- Investigator feedback submission
- Queue simulation capacity
- Behavioral change detector
- Real-time prediction inference

---

## 🚀 Deploying to Vercel

FraudLens AI is pre-configured for **1-click unified Vercel deployment** hosting both the React/TypeScript frontend (via edge CDN) and the Python FastAPI prediction engine (via Vercel Serverless Functions).

### Method 1: Git Integration (Recommended — Zero Setup)

1. Push this directory to your GitHub / GitLab repository.
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import your repository.
4. Leave all build settings at default (`vercel.json` and root `package.json` automatically configure build, output directory, and serverless runtime).
5. Click **Deploy**.

Vercel will build the frontend into `frontend/dist` and mount the Python FastAPI backend on `/api/*` automatically!

### Method 2: Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# From the fraudlens-ai project root:
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? **Select your account**
- Link to existing project? **N**
- Project name: **fraudlens-ai**
- Directory: **./**
- Want to modify settings? **N** (settings are pre-configured in `vercel.json`)

---

## 📁 Project Structure

```
fraudlens-ai/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── endpoints.py          # All REST API routes
│   │   ├── db/
│   │   │   ├── repository.py         # SQLite repository layer (PostgreSQL-ready)
│   │   │   └── init_data.py          # DB seeder & demo scenario builder
│   │   ├── graph/
│   │   │   └── engine.py             # NetworkX fraud graph & syndicate detection
│   │   ├── ml/
│   │   │   ├── data_generator.py     # Synthetic dataset generator
│   │   │   ├── features.py           # Leakage-free feature engineering
│   │   │   ├── predictor.py          # FraudLensPredictor (scoring + uncertainty)
│   │   │   └── train.py              # Full ML training pipeline
│   │   ├── schemas/
│   │   │   └── transactions.py       # Pydantic request/response models
│   │   └── main.py                   # FastAPI application entrypoint
│   └── tests/
│       └── test_api_and_ml.py        # 11 automated tests
├── data/
│   ├── synthetic_transactions.csv    # 2,480 synthetic transactions (no real PII)
│   └── fraudlens.db                  # SQLite database (auto-created)
├── frontend/
│   ├── src/
│   │   ├── components/               # All 9 screen components
│   │   ├── services/api.ts           # Typed API client
│   │   └── types/index.ts            # TypeScript type definitions
│   ├── dist/                         # Production build (served by backend)
│   └── package.json
├── model_store/
│   ├── fraudlens_predictor.joblib    # Saved trained model + scaler
│   ├── evaluation_metrics.json       # Honest held-out test metrics
│   └── model_meta.json               # Feature schema + training metadata
├── .env.example                      # Environment variable template
├── .gitignore
├── requirements.txt                  # Pinned Python dependencies
└── README.md
```

---

## 🖥️ Application Screens

| Screen | Description |
|--------|-------------|
| **Overview Dashboard** | KPIs, risk distribution, held-out metrics, 3-case demo launcher |
| **Investigation Queue** | Sortable/filterable priority-ranked review list |
| **Transaction Detail** | Full evidence-grounded case summary + feedback panel |
| **FraudLens Replay Lab** | Timeline, behavioral change, counterfactual simulator |
| **Fraud Network Radar** | Interactive Cytoscape.js relationship graph |
| **Model Evaluation** | Confusion matrix, PR curves, baseline vs champion comparison |
| **Feedback History** | Investigator audit trail with override detection |
| **CSV Upload** | Batch scoring with column mapping and validation |
| **Model Information** | Feature schema, training provenance, limitations |

---

## 🤖 Machine Learning Pipeline

### Dataset
- **2,480 synthetic transactions** with realistic behavioral patterns
- **~6% fraud rate** with controlled class imbalance
- Zero real customer PII — all synthetically generated

### Features Used
| Feature | Description |
|---------|-------------|
| `amount` | Raw transaction value |
| `log_amount` | Log-transformed amount |
| `amount_to_hist_avg` | Ratio vs historical account average |
| `account_age_days` | Account tenure |
| `failed_attempts_last_24h` | Auth failure burst signal |
| `is_foreign_country` | Geo-location anomaly flag |
| `merchant_category_risk` | Category risk weight (0.05–0.85) |
| `device_reuse_count` | Device shared across multiple accounts |
| `is_device_new_to_account` | Novel device fingerprint flag |
| `tx_frequency_1h` | Transaction velocity in last 60 min |
| `burst_amount_1h` | Total spend volume in last 60 min |

### Model Comparison

| Metric | Champion (HistGradientBoosting) | Baseline (LogisticRegression) |
|--------|--------------------------------|-------------------------------|
| Precision | 1.000 | 0.875 |
| Recall | 1.000 | 0.933 |
| F1 Score | 1.000 | 0.903 |
| ROC-AUC | 1.000 | 0.997 |
| Precision @ Top 20 | 0.750 | — |

> ⚠️ **Note:** Perfect scores on the held-out test set reflect the synthetic dataset's deterministic fraud patterns. Real-world fraud data is far more complex. These metrics are labeled as synthetic-data measurements and should not be interpreted as production banking performance.

### Three-Outcome Triage Logic

```
P(fraud) >= tau_high (0.80)  → HIGH RISK
P(fraud) < tau_low (0.20) AND uncertainty < 0.60  → LOWER RISK
Otherwise  → UNCERTAIN
```

**Uncertainty = 0.70 × boundary_uncertainty + 0.30 × model_disagreement**

---

## 🔌 API Endpoints

Full interactive documentation: http://127.0.0.1:8000/docs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check + model version |
| GET | `/api/overview` | Dashboard statistics |
| GET | `/api/queue` | Investigation queue (filterable) |
| GET | `/api/transactions/{id}` | Full transaction detail + case summary |
| POST | `/api/transactions/predict` | Real-time single transaction scoring |
| POST | `/api/replay/counterfactual` | What-if scenario simulator |
| GET | `/api/replay/timeline/{id}` | Chronological account timeline |
| GET | `/api/replay/behavioral-change/{id}` | Behavioral deviation analysis |
| GET | `/api/graph/ego/{id}` | NetworkX ego graph for visualization |
| GET | `/api/graph/syndicates` | Fraud ring cluster detection |
| POST | `/api/feedback` | Investigator decision submission |
| GET | `/api/feedback` | Audit history |
| POST | `/api/queue/simulation` | Daily capacity planning simulator |
| GET | `/api/demo/cases` | 3 reproducible demo scenarios |
| POST | `/api/demo/reset` | Reset to factory demo state |
| POST | `/api/upload-csv` | Batch CSV upload & scoring |
| GET | `/api/simulation/next-event` | Real-time event stream simulation |

---

## 🔒 Security Notes

- **No real bank credentials or personal data** are used anywhere
- **All demo data is fully synthetic** — no real customer PII
- Uploaded CSVs are validated for required fields and size limits
- Secrets are loaded from `.env` (never hardcoded)
- SQLite input is parameterized to prevent SQL injection
- File upload is restricted to CSV format only
- Production deployment would require proper authentication, TLS, and institutional approval

See `.env.example` for all configurable security settings.

---

## ⚠️ Known Limitations

1. **Synthetic data only** — The model has not been trained or validated on real banking transaction traffic
2. **Perfect synthetic metrics** — Scores of 1.0 on test set reflect synthetic patterns, not real-world performance
3. **No SHAP integration** — HistGradientBoosting SHAP is computationally intensive; transparent feature contributions are used instead with documented methodology
4. **No real-time data feed** — The simulation mode emits mock events clearly labeled as synthetic
5. **SQLite for demo** — Production deployments should use PostgreSQL via the repository abstraction layer
6. **Single-node graph** — NetworkX graph is held in memory; large deployments would use Neo4j or similar
7. **No MFA integration** — Step-up authentication recommendations are documented only; not wired to real auth systems

---

## 🧩 Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Charts | Recharts |
| Graph | Cytoscape.js |
| Backend | Python FastAPI |
| ML | scikit-learn (HistGradientBoosting, LogisticRegression) |
| Data | Pandas, NumPy |
| Graph Analysis | NetworkX |
| Database | SQLite (repository pattern → PostgreSQL-ready) |
| Testing | pytest (11 tests, 100% pass) |
| API Docs | FastAPI Swagger UI |

---

## 📄 License

This project was built for the **Zeckathon PS2 hackathon** demonstration purposes.
All transaction data is fully synthetic. No real financial data is included.
