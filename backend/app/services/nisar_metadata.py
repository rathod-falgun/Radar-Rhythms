"""
NISAR Metadata and Orbital Repeat Service for Brahmaputra Basin
Track 019, Frame 075, Descending Pass (12-Day Exact Repeat Cycle)
"""

from typing import List, Dict, Any

# Pre-calculated 12-day NISAR Orbital Timeline for Track 019, Frame 075
NISAR_OBSERVATION_CATALOG: List[Dict[str, Any]] = [
    {
        "cycle": 22,
        "cycle_str": "022",
        "date": "2026-06-03",
        "start_time_utc": "2026-06-03T12:42:08Z",
        "end_time_utc": "2026-06-03T12:42:45Z",
        "granule_id": "NISAR_S2_PR_GCOV_022_019_D_075_2500_CRNA_A_20260603T124208_20260603T124245_P00500_M_F_I_001",
        "stage": "Pre-Monsoon Reference",
        "hydrological_status": "Base River Flow / Dry Floodplains",
        "flood_extent_level": "Minimal / Channel Confined",
        "is_candidate": False,
        "recommended_baseline": True,
        "sensor": "ISRO S-band SAR (Level 2 GCOV)",
        "polarizations": ["HHHH", "HVHV", "CRNA"],
        "mean_river_discharge_est": "14,500 m3/s",
    },
    {
        "cycle": 23,
        "cycle_str": "023",
        "date": "2026-06-15",
        "start_time_utc": "2026-06-15T12:42:08Z",
        "end_time_utc": "2026-06-15T12:42:45Z",
        "granule_id": "NISAR_S2_PR_GCOV_023_019_D_075_2500_CRNA_A_20260615T124208_20260615T124245_P00500_M_F_I_001",
        "stage": "Monsoon Onset",
        "hydrological_status": "Rising River Stage / Sandbar Submergence",
        "flood_extent_level": "Low (Channel Expansion)",
        "is_candidate": False,
        "recommended_baseline": False,
        "sensor": "ISRO S-band SAR (Level 2 GCOV)",
        "polarizations": ["HHHH", "HVHV", "CRNA"],
        "mean_river_discharge_est": "26,800 m3/s",
    },
    {
        "cycle": 24,
        "cycle_str": "024",
        "date": "2026-06-27",
        "start_time_utc": "2026-06-27T12:42:08Z",
        "end_time_utc": "2026-06-27T12:42:45Z",
        "granule_id": "NISAR_S2_PR_GCOV_024_019_D_075_2500_CRNA_A_20260627T124208_20260627T124245_P00500_M_F_I_001",
        "stage": "Pre-Flood High Flow (Primary Baseline)",
        "hydrological_status": "Bankfull Discharge / Low-Lying Wetlands Full",
        "flood_extent_level": "Moderate (Pre-Inundation)",
        "is_candidate": False,
        "recommended_baseline": True,
        "sensor": "ISRO S-band SAR (Level 2 GCOV)",
        "polarizations": ["HHHH", "HVHV", "CRNA"],
        "mean_river_discharge_est": "38,200 m3/s",
    },
    {
        "cycle": 25,
        "cycle_str": "025",
        "date": "2026-07-09",
        "start_time_utc": "2026-07-09T12:42:08Z",
        "end_time_utc": "2026-07-09T12:42:45Z",
        "granule_id": "NISAR_S2_PR_GCOV_025_019_D_075_2500_CRNA_A_20260709T124208_20260709T124245_P00500_M_F_I_001",
        "stage": "Candidate Peak Flood Event",
        "hydrological_status": "Severe Out-of-Bank Flood / Kaziranga 70% Inundation",
        "flood_extent_level": "Critical / Severe Regional Inundation",
        "is_candidate": True,
        "recommended_baseline": False,
        "sensor": "ISRO S-band SAR (Level 2 GCOV)",
        "polarizations": ["HHHH", "HVHV", "CRNA"],
        "mean_river_discharge_est": "56,400 m3/s",
    },
    {
        "cycle": 26,
        "cycle_str": "026",
        "date": "2026-07-21",
        "start_time_utc": "2026-07-21T12:42:08Z",
        "end_time_utc": "2026-07-21T12:42:45Z",
        "granule_id": "NISAR_S2_PR_GCOV_026_019_D_075_2500_CRNA_A_20260721T124208_20260721T124245_P00500_M_F_I_001",
        "stage": "Flood Recession Stage",
        "hydrological_status": "Partial Drainage into Main Stem / Residual Ponds",
        "flood_extent_level": "Substantial Residual Inundation",
        "is_candidate": False,
        "recommended_baseline": False,
        "sensor": "ISRO S-band SAR (Level 2 GCOV)",
        "polarizations": ["HHHH", "HVHV", "CRNA"],
        "mean_river_discharge_est": "42,100 m3/s",
    },
    {
        "cycle": 27,
        "cycle_str": "027",
        "date": "2026-08-02",
        "start_time_utc": "2026-08-02T12:42:08Z",
        "end_time_utc": "2026-08-02T12:42:45Z",
        "granule_id": "NISAR_S2_PR_GCOV_027_019_D_075_2500_CRNA_A_20260802T124208_20260802T124245_P00500_M_F_I_001",
        "stage": "Late Monsoon Drydown",
        "hydrological_status": "Receded Floodwaters / High Soil Moisture",
        "flood_extent_level": "Moderate (Beels & Oxbow Lakes Filled)",
        "is_candidate": False,
        "recommended_baseline": False,
        "sensor": "ISRO S-band SAR (Level 2 GCOV)",
        "polarizations": ["HHHH", "HVHV", "CRNA"],
        "mean_river_discharge_est": "31,800 m3/s",
    },
    {
        "cycle": 28,
        "cycle_str": "028",
        "date": "2026-08-14",
        "start_time_utc": "2026-08-14T12:42:08Z",
        "end_time_utc": "2026-08-14T12:42:45Z",
        "granule_id": "NISAR_S2_PR_GCOV_028_019_D_075_2500_CRNA_A_20260814T124208_20260814T124245_P00500_M_F_I_001",
        "stage": "Monsoon Secondary Surge",
        "hydrological_status": "Second Wave Minor Inundation",
        "flood_extent_level": "Moderate / Localized Overflow",
        "is_candidate": False,
        "recommended_baseline": False,
        "sensor": "ISRO S-band SAR (Level 2 GCOV)",
        "polarizations": ["HHHH", "HVHV", "CRNA"],
        "mean_river_discharge_est": "37,500 m3/s",
    },
]

# Study Regions along the Brahmaputra River Basin within Track 019, Frame 075
STUDY_REGIONS: List[Dict[str, Any]] = [
    {
        "id": "kaziranga",
        "name": "Kaziranga National Park & Floodplain Corridor",
        "district": "Golaghat & Nagaon, Assam",
        "center": {"lat": 26.65, "lon": 93.35},
        "zoom": 11,
        "bounds": [[26.50, 93.10], [26.85, 93.65]],
        "area_km2": 858.0,
        "description": "Crucial UNESCO World Heritage wetland habitat. Annually submerged by Brahmaputra floodwaves, driving wildlife to Karbi Anglong highlands.",
        "vulnerability": "Extreme Ecological Vulnerability",
        "key_features": ["Kaziranga National Park", "Diphlu River Confluence", "Mora Dhansiri River", "Brahmaputra Southern Embankment"],
    },
    {
        "id": "tezpur",
        "name": "Tezpur & Middle Brahmaputra Reach",
        "district": "Sonitpur, Assam",
        "center": {"lat": 26.62, "lon": 92.80},
        "zoom": 11,
        "bounds": [[26.50, 92.60], [26.78, 93.00]],
        "area_km2": 620.0,
        "description": "Key urban, agricultural and military transport corridor with acute braided riverbank erosion along Kaliabhomora bridge corridor.",
        "vulnerability": "High Urban / Embankment Erosion Risk",
        "key_features": ["Kolia Bhomora Setu", "Bhairabi Temple Bluff", "Brahmaputra Braided Chars", "Jiabharali River Confluence"],
    },
    {
        "id": "majuli",
        "name": "Majuli River Island Reach",
        "district": "Majuli / Jorhat, Assam",
        "center": {"lat": 26.95, "lon": 94.20},
        "zoom": 10,
        "bounds": [[26.75, 93.90], [27.15, 94.50]],
        "area_km2": 1250.0,
        "description": "The world's largest populated river island, facing rapid erosion and seasonal severance of ferry links during high flood stages.",
        "vulnerability": "Severe Land Loss & Cultural Heritage Risk",
        "key_features": ["Kherkatia Suti", "Subansiri River Confluence", "Garambur Embankment", "Kamalabari Ghat"],
    },
    {
        "id": "guwahati",
        "name": "Guwahati & Lower Kamrup Flood Corridor",
        "district": "Kamrup Metropolitan, Assam",
        "center": {"lat": 26.19, "lon": 91.75},
        "zoom": 11,
        "bounds": [[26.05, 91.50], [26.35, 91.95]],
        "area_km2": 780.0,
        "description": "Major economic hub where the Brahmaputra narrows through granite hills; acute flash flood and backflow risk in tributary channels.",
        "vulnerability": "High Urban & Industrial Infrastructure Exposure",
        "key_features": ["Saraighat Bridges", "Deepor Beel Ramsar Wetland", "Bharalu River Outfall", "North Guwahati Floodplains"],
    },
    {
        "id": "full_swath",
        "name": "Entire Track 019 Frame 075 Swath",
        "district": "Central Assam Valley (Multi-District)",
        "center": {"lat": 26.60, "lon": 92.80},
        "zoom": 9,
        "bounds": [[26.00, 91.50], [27.20, 93.80]],
        "area_km2": 14200.0,
        "description": "Full spatial swath of the NISAR descending acquisition, covering approximately 240 km wide radar imaging corridor across Assam.",
        "vulnerability": "Regional Valley-Scale Hazard",
        "key_features": ["240 km NISAR Swath", "Brahmaputra Main Stem", "Tributary Junctions", "Himalayan Foothills Buffer"],
    },
]

def get_observation_by_date(date_str: str) -> Dict[str, Any]:
    for obs in NISAR_OBSERVATION_CATALOG:
        if obs["date"] == date_str:
            return obs
    return NISAR_OBSERVATION_CATALOG[3]  # Default to candidate scene 2026-07-09

def get_region_by_id(region_id: str) -> Dict[str, Any]:
    for reg in STUDY_REGIONS:
        if reg["id"] == region_id:
            return reg
    return STUDY_REGIONS[0]  # Default to Kaziranga

