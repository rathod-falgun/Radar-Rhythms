from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import router
from .core.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description=(
        "NASA Space Apps Challenge 2026 — Dancing with the SARs. "
        "Interactive satellite-based flood and water-body change detection "
        "powered by NASA-ISRO Synthetic Aperture Radar (NISAR) observations "
        "along the Brahmaputra River Basin in Assam, India."
    ),
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for local Vite development and deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/")
def root():
    return {
        "project": "Brahmaputra FloodWatch",
        "challenge": "NASA Space Apps Challenge 2026 — Dancing with the SARs",
        "study_area": settings.STUDY_REGION,
        "primary_mission": settings.MISSION,
        "primary_orbit": f"Track {settings.PRIMARY_TRACK}, Frame {settings.PRIMARY_FRAME}",
        "docs": "/docs",
        "api_endpoints": [
            "/api/health",
            "/api/regions",
            "/api/observations",
            "/api/sar-grid",
            "/api/compare",
            "/api/timeline-stats"
        ]
    }

