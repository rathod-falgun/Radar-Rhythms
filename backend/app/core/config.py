import os
from typing import Optional, List
from pydantic import BaseModel

def _load_env_file():
    """Lightweight .env loader if .env file exists in root or backend."""
    for candidate in [".env", os.path.join("..", ".env"), os.path.join(os.path.dirname(__file__), "..", "..", ".env")]:
        if os.path.exists(candidate):
            try:
                with open(candidate, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip("'\"")
                            if k not in os.environ:
                                os.environ[k] = v
            except Exception:
                pass
            break

_load_env_file()

class AppConfig(BaseModel):
    APP_NAME: str = "Brahmaputra FloodWatch API"
    VERSION: str = "1.0.0"
    MISSION: str = "NASA-ISRO Synthetic Aperture Radar (NISAR)"
    PRIMARY_TRACK: str = "019"
    PRIMARY_FRAME: str = "075"
    STUDY_REGION: str = "Brahmaputra River, Assam, India"
    DEFAULT_CRS: str = "EPSG:32646"  # WGS 84 / UTM zone 46N
    CANDIDATE_SCENE_ID: str = (
        "NISAR_S2_PR_GCOV_025_019_D_075_2500_CRNA_A_20260709T124208_20260709T124245_P00500_M_F_I_001"
    )

    # Bhoonidhi API Settings
    BHOONIDHI_BASE_URL: str = os.getenv("BHOONIDHI_BASE_URL", "https://bhoonidhi-api.nrsc.gov.in")
    BHOONIDHI_USER_ID: Optional[str] = os.getenv("BHOONIDHI_USER_ID")
    BHOONIDHI_PASSWORD: Optional[str] = os.getenv("BHOONIDHI_PASSWORD")
    BHOONIDHI_TIMEOUT_SECONDS: int = int(os.getenv("BHOONIDHI_TIMEOUT_SECONDS", "20"))
    
    # Target NISAR Collections & AOI
    DEFAULT_COLLECTION: str = "NISAR_SSAR_GCOV"
    ALLOWED_COLLECTIONS: List[str] = ["NISAR_SSAR_GCOV", "NISAR_LSAR_GCOV", "NISAR_S2_PR_GCOV"]
    DEFAULT_MAJULI_BBOX: List[float] = [93.60, 26.50, 94.60, 27.30]  # [west, south, east, north]
    DEFAULT_DATE_RANGE: str = "2026-07-01T00:00:00Z/2026-09-30T23:59:59Z"

settings = AppConfig()


