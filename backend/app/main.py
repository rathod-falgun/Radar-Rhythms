# pyrefly: ignore[missing-import]
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
# pyrefly: ignore[missing-import]
from fastapi.middleware.cors import CORSMiddleware
import logging
from typing import List, Union
from .api.routes import router
from .core.config import settings

logger = logging.getLogger(__name__)

def parse_cors_origins(raw: Union[str, List[str], None]) -> List[str]:
    """
    Parses CORS allowed origins from comma, semicolon, space, or newline-delimited strings.
    Strips surrounding quotes, whitespace, and trailing slashes.
    Ensures exact normalized origins (e.g., 'https://radar-rhythms.vercel.app').
    """
    if not raw:
        return []
    if isinstance(raw, (list, tuple, set)):
        items = list(raw)
    else:
        text = str(raw).strip()
        if text.startswith("[") and text.endswith("]"):
            text = text[1:-1]
        for delimiter in (";", "\n", "\r", "\t", " "):
            text = text.replace(delimiter, ",")
        items = text.split(",")

    parsed: List[str] = []
    seen: set = set()
    for item in items:
        cleaned = item.strip().strip("'\"").strip()
        cleaned = cleaned.rstrip("/")
        if cleaned and cleaned not in seen:
            seen.add(cleaned)
            parsed.append(cleaned)
    return parsed

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

# Parse and normalize allowed origins
origins = parse_cors_origins(settings.CORS_ALLOWED_ORIGINS)

# Always ensure the official Vercel production origin is accepted as an exact origin
PRODUCTION_VERCEL_ORIGIN = "https://radar-rhythms.vercel.app"
if PRODUCTION_VERCEL_ORIGIN not in origins:
    origins.append(PRODUCTION_VERCEL_ORIGIN)

# Ensure development origins are present
for dev_origin in ("http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"):
    if dev_origin not in origins:
        origins.append(dev_origin)

allow_credentials = "*" not in origins

# Safe diagnostic logging of parsed origins at startup (no secrets or credentials exposed)
logger.info(
    "CORS middleware initialized: allowed_origins=%s, allow_credentials=%s, environment=%s",
    origins,
    allow_credentials,
    settings.ENVIRONMENT,
)

# Exception handler ensuring unhandled 500 errors also carry CORS headers for allowed origins
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled server exception on %s: %s", request.url.path, exc)
    origin = request.headers.get("origin")
    headers = {}
    if origin and (origin in origins or "*" in origins):
        headers["Access-Control-Allow-Origin"] = origin
        if allow_credentials:
            headers["Access-Control-Allow-Credentials"] = "true"
        headers["Vary"] = "Origin"
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
        headers=headers,
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

