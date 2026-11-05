import os
from pydantic import BaseModel

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

settings = AppConfig()

