"""
FraudLens AI - Universal Application Runner
Starts the production FastAPI backend and automatically serves the React SPA at http://127.0.0.1:8000
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
BACKEND_DIR = PROJECT_ROOT / "backend"

# Ensure backend directory is in python module search path
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import uvicorn

if __name__ == "__main__":
    print("=" * 70)
    print(" FRAUDLENS AI — EXPLAINABLE FINANCIAL RISK & FRAUD ANALYTICS")
    print(" Tagline: Detect smarter. Explain every alert. Reduce false alarms.")
    print("=" * 70)
    print(" Serving React Intelligence Interface & API at: http://127.0.0.1:8000")
    print(" Interactive Swagger API Docs at:              http://127.0.0.1:8000/docs")
    print(" ReDoc API Documentation at:                   http://127.0.0.1:8000/redoc")
    print("=" * 70)
    print(" Press Ctrl+C to terminate.")
    print("=" * 70)
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False, log_level="info")
