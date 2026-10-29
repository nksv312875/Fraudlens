"""
FraudLens AI - Backend Application Entrypoint
FastAPI application with OpenAPI docs, CORS, and mounted routers.
"""

from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.api.endpoints import router as api_router

app = FastAPI(
    title="FraudLens AI - Explainable Financial Risk & Fraud Analytics",
    description=(
        "Production-grade financial fraud detection engine combining "
        "three-outcome triage, transparent feature contributions, "
        "NetworkX graph relationship analysis, and FraudLens Replay Lab."
    ),
    version="1.2.0"
)

# CORS Middleware for modern frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Core API Router
app.include_router(api_router, prefix="/api")

# Serve frontend build if dist directory exists
FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/")
    def index():
        return FileResponse(str(FRONTEND_DIST / "index.html"))

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(FRONTEND_DIST / "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "app": "FraudLens AI",
            "tagline": "Detect smarter. Explain every alert. Reduce false alarms.",
            "api_docs": "/docs",
            "openapi_spec": "/openapi.json",
            "status": "online"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
