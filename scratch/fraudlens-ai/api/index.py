"""
Vercel Serverless Function Entrypoint for FraudLens AI
Exposes the FastAPI application to Vercel's Python runtime.
"""

import sys
import os
from pathlib import Path

# Add project root and backend to sys.path
CURRENT_DIR = Path(__file__).resolve().parent
ROOT_DIR = CURRENT_DIR.parent
BACKEND_DIR = ROOT_DIR / "backend"

for path in [str(BACKEND_DIR), str(ROOT_DIR)]:
    if path not in sys.path:
        sys.path.insert(0, path)

# Import the FastAPI instance
from app.main import app

# Export for Vercel
# Vercel's Python runtime looks for `app` in `api/index.py`
