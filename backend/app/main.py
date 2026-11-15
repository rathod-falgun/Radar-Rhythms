# pyrefly: ignore[missing-import]
from fastapi import FastAPI
# pyrefly: ignore[missing-import]
from fastapi.middleware.cors import CORSMiddleware
import logging
from .api.routes import router
from .core.config import settings

logger = logging.getLogger(__name__)

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

# Enable CORS for local Vite development and production deployment
origins = [origin.strip() for origin in settings.CORS_ALLOWED_ORIGINS.split(",") if origin.strip()]
allow_credentials = "*" not in origins
if not origins:
    origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
    allow_credentials = True

# Startup safety check: warn if running in production with only localhost origins
if settings.ENVIRONMENT == "production":
    _local_prefixes = ("http://localhost", "http://127.0.0.1", "https://localhost", "https://127.0.0.1")
    if all(o.startswith(_local_prefixes) for o in origins):
        logger.warning(
            "PRODUCTION environment detected but CORS_ALLOWED_ORIGINS contains only "
            "localhost origins (%s). Set CORS_ALLOWED_ORIGINS to your deployed frontend "
            "domain before going live.",
            ", ".join(origins),
        )

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=allow_credentials,
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
            "/api/timeline-stats",
            "/api/nisar/status",
            "/api/nisar/auth/test",
            "/api/nisar/scenes",
            "/api/nisar/scenes/{item_id}/details",
            "/api/nisar/scenes/{item_id}/download-preflight",
            "/api/nisar/scenes/{item_id}/remote-inspect"
        ]
    }

