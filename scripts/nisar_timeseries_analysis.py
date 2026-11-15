"""
Task 3: Multi-Temporal Flood Hydrograph Time-Series Analysis
NASA Space Apps Challenge 2026 — Brahmaputra FloodWatch

Generates NISAR Level 2 GCOV products for all 7 orbital revisit cycles (022-028),
performs change detection against the pre-monsoon baseline (Cycle 022),
and produces the complete flood hydrograph evolution curve for June-August 2026.

Outputs:
  1. HDF5 products for all 7 cycles in data/nisar_products/
  2. Time-series inundation metrics CSV
  3. Flood hydrograph evolution curve (PNG)
  4. Multi-panel temporal progression mosaic (PNG)
  5. Animated temporal comparison strip (PNG)
  6. Comprehensive JSON metrics report
"""

import os
import sys
import json
import csv
import h5py
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap
import matplotlib.patches as mpatches
from matplotlib.ticker import MaxNLocator
from scipy.ndimage import uniform_filter, binary_opening
from datetime import datetime

# Configure UTF-8 stdout for Windows consoles
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

try:
    import rasterio
    from rasterio.transform import from_bounds
    HAS_RASTERIO = True
except ImportError:
    HAS_RASTERIO = False


# =============================================================================
# NISAR OBSERVATION CATALOG — 12-Day Orbital Repeat Timeline
# =============================================================================

OBSERVATION_CATALOG = [
    {
        "cycle": 22, "cycle_str": "022", "date": "2026-06-03",
        "stage": "Pre-Monsoon Reference",
        "discharge_m3s": 14500,
        "granule_id": "NISAR_S2_PR_GCOV_022_019_D_075_2500_CRNA_A_20260603T124208_20260603T124245_P00500_M_F_I_001"
    },
    {
        "cycle": 23, "cycle_str": "023", "date": "2026-06-15",
        "stage": "Monsoon Onset",
        "discharge_m3s": 26800,
        "granule_id": "NISAR_S2_PR_GCOV_023_019_D_075_2500_CRNA_A_20260615T124208_20260615T124245_P00500_M_F_I_001"
    },
    {
        "cycle": 24, "cycle_str": "024", "date": "2026-06-27",
        "stage": "Pre-Flood High Flow",
        "discharge_m3s": 38200,
        "granule_id": "NISAR_S2_PR_GCOV_024_019_D_075_2500_CRNA_A_20260627T124208_20260627T124245_P00500_M_F_I_001"
    },
    {
        "cycle": 25, "cycle_str": "025", "date": "2026-07-09",
        "stage": "Peak Flood Event",
        "discharge_m3s": 56400,
        "granule_id": "NISAR_S2_PR_GCOV_025_019_D_075_2500_CRNA_A_20260709T124208_20260709T124245_P00500_M_F_I_001"
    },
    {
        "cycle": 26, "cycle_str": "026", "date": "2026-07-21",
        "stage": "Flood Recession",
        "discharge_m3s": 42100,
        "granule_id": "NISAR_S2_PR_GCOV_026_019_D_075_2500_CRNA_A_20260721T124208_20260721T124245_P00500_M_F_I_001"
    },
    {
        "cycle": 27, "cycle_str": "027", "date": "2026-08-02",
        "stage": "Late Monsoon Drydown",
        "discharge_m3s": 31800,
        "granule_id": "NISAR_S2_PR_GCOV_027_019_D_075_2500_CRNA_A_20260802T124208_20260802T124245_P00500_M_F_I_001"
    },
    {
        "cycle": 28, "cycle_str": "028", "date": "2026-08-14",
        "stage": "Secondary Surge",
        "discharge_m3s": 37500,
        "granule_id": "NISAR_S2_PR_GCOV_028_019_D_075_2500_CRNA_A_20260814T124208_20260814T124245_P00500_M_F_I_001"
    },
]

GRID_DIM = 120  # 120x120 pixels at 25m = 3km x 3km
REGION_ID = "kaziranga"
PRODUCTS_DIR = os.path.join("data", "nisar_products")
OUTPUT_DIR = os.path.join("data", "output")


# =============================================================================
# SAR PHYSICS ENGINE — Calibrated Backscatter Grid Generation
# =============================================================================

def generate_calibrated_sar_grid(region_id: str, date_str: str, grid_dim: int = 120):
    """
    Generates calibrated SAR backscatter for the given date.
    Models the Brahmaputra flood wave progression using empirical SAR physics.
    """
    seed = sum(ord(c) for c in (region_id + date_str))
    rng = np.random.RandomState(seed)

    y, x = np.mgrid[0:grid_dim, 0:grid_dim]
    norm_y = y / grid_dim
    norm_x = x / grid_dim

    # River centerline with braided curvature
    river_center = 0.45 + 0.12 * np.sin(norm_x * 4.5) + 0.04 * np.cos(norm_x * 8.0)
    dist_to_river = np.abs(norm_y - river_center)

    # Base terrain backscatter (dry floodplain: ~-11.5 dB)
    hh_db = -11.5 + rng.normal(0, 1.2, size=(grid_dim, grid_dim))

    # Permanent river channels
    permanent_water = dist_to_river < 0.08
    hh_db[permanent_water] = -23.0 + rng.normal(0, 0.8, size=np.sum(permanent_water))

    # Seasonal sandbars (chars)
    chars = (dist_to_river < 0.07) & (np.sin(norm_x * 14.0) > 0.4)
    hh_db[chars] = -14.0 + rng.normal(0, 1.0, size=np.sum(chars))

    # Date-specific flood evolution
    flood_params = {
        "2026-06-03": {"extent": 0.08, "depth_db": -23.0, "veg_width": 0.00},  # Pre-monsoon: channel only
        "2026-06-15": {"extent": 0.10, "depth_db": -22.8, "veg_width": 0.02},  # Onset: slight rise
        "2026-06-27": {"extent": 0.12, "depth_db": -22.5, "veg_width": 0.03},  # Pre-flood high flow
        "2026-07-09": {"extent": 0.28, "depth_db": -21.8, "veg_width": 0.06},  # PEAK FLOOD
        "2026-07-21": {"extent": 0.18, "depth_db": -20.5, "veg_width": 0.04},  # Recession
        "2026-08-02": {"extent": 0.14, "depth_db": -21.0, "veg_width": 0.03},  # Late monsoon drydown
        "2026-08-14": {"extent": 0.16, "depth_db": -21.2, "veg_width": 0.04},  # Secondary surge
    }

    params = flood_params.get(date_str, {"extent": 0.08, "depth_db": -23.0, "veg_width": 0.00})

    # Inundation extent beyond permanent channel
    if params["extent"] > 0.08:
        flood_area = (dist_to_river < params["extent"]) & (~permanent_water)
        hh_db[flood_area] = params["depth_db"] + rng.normal(0, 0.9, size=np.sum(flood_area))

    # Flooded vegetation double-bounce fringe
    if params["veg_width"] > 0:
        veg_fringe = (dist_to_river >= params["extent"] - 0.01) & (dist_to_river < params["extent"] + params["veg_width"])
        hh_db[veg_fringe] = -6.5 + rng.normal(0, 1.4, size=np.sum(veg_fringe))

    # Oxbow lakes and wetlands filling during monsoon
    if date_str not in ["2026-06-03"]:
        oxbow_x = [0.25, 0.55, 0.78]
        oxbow_y = [0.22, 0.72, 0.35]
        for ox, oy in zip(oxbow_x, oxbow_y):
            ox_mask = ((norm_x - ox)**2 + (norm_y - oy)**2) < 0.003
            hh_db[ox_mask] = params["depth_db"] - 1.0 + rng.normal(0, 0.5, size=np.sum(ox_mask))

    # Cross-pol HV
    hv_db = hh_db - 7.5 + rng.normal(0, 0.6, size=(grid_dim, grid_dim))
    hv_db[hh_db < -19.0] = -31.0 + rng.normal(0, 1.0, size=np.sum(hh_db < -19.0))

    return hh_db.astype(np.float32), hv_db.astype(np.float32)


def generate_h5_product(obs: dict, output_dir: str = PRODUCTS_DIR, grid_dim: int = GRID_DIM):
    """Generate a NISAR-format HDF5 product for one observation cycle."""
    filepath = os.path.join(output_dir, f"{obs['granule_id']}.h5")

    if os.path.exists(filepath):
        print(f"  [EXISTS] Cycle {obs['cycle_str']} ({obs['date']}): {os.path.basename(filepath)}")
        return filepath

    os.makedirs(output_dir, exist_ok=True)

    hh_db, hv_db = generate_calibrated_sar_grid(REGION_ID, obs["date"], grid_dim)

    # Convert dB to linear power for HDF5 storage
    hh_linear = 10.0 ** (hh_db / 10.0)
    hv_linear = 10.0 ** (hv_db / 10.0)

    # UTM Zone 46N coordinates
    x_coords = np.linspace(310000.0, 310000.0 + (grid_dim * 25.0), grid_dim, dtype=np.float64)
    y_coords = np.linspace(2950000.0, 2950000.0 - (grid_dim * 25.0), grid_dim, dtype=np.float64)
    mask = np.zeros((grid_dim, grid_dim), dtype=np.uint8)

    with h5py.File(filepath, "w") as h5:
        h5.attrs["Conventions"] = "CF-1.8"
        h5.attrs["title"] = "NISAR Level 2 Geocoded Polarimetric Covariance (GCOV)"
        h5.attrs["institution"] = "NASA JPL / ISRO SAC"
        h5.attrs["mission_name"] = "NISAR"

        gcov_grp = h5.create_group("science/SSAR/GCOV")

        ident = gcov_grp.create_group("identification")
        ident.attrs["granule_id"] = obs["granule_id"]
        ident.attrs["track_number"] = 19
        ident.attrs["frame_number"] = 75
        ident.attrs["cycle_number"] = obs["cycle"]
        ident.attrs["look_direction"] = "Right"
        ident.attrs["pass_direction"] = "Descending"
        ident.attrs["acquisition_date"] = obs["date"]

        freq_a = gcov_grp.create_group("grids/frequencyA")

        ds_hh = freq_a.create_dataset("HHHH", data=hh_linear, compression="gzip", compression_opts=4)
        ds_hh.attrs["units"] = "1"
        ds_hh.attrs["long_name"] = "Co-polarized HH gamma-0 backscatter power"

        ds_hv = freq_a.create_dataset("HVHV", data=hv_linear, compression="gzip", compression_opts=4)
        ds_hv.attrs["units"] = "1"
        ds_hv.attrs["long_name"] = "Cross-polarized HV gamma-0 backscatter power"

        ds_mask = freq_a.create_dataset("mask", data=mask, compression="gzip")
        ds_mask.attrs["long_name"] = "Data validity / shadow mask"

        freq_a.create_dataset("xCoordinates", data=x_coords)
        freq_a.create_dataset("yCoordinates", data=y_coords)

        proj = freq_a.create_dataset("projection", data=np.array([32646], dtype=np.int32))
        proj.attrs["epsg_code"] = 32646
        proj.attrs["spatial_ref"] = "WGS 84 / UTM zone 46N"

    print(f"  [CREATED] Cycle {obs['cycle_str']} ({obs['date']}): {os.path.basename(filepath)}")
    return filepath


# =============================================================================
# CHANGE DETECTION ENGINE
# =============================================================================

def apply_lee_filter(image: np.ndarray, window: int = 5, noise_var: float = 0.25):
    """Adaptive Lee speckle filter."""
    img = np.asarray(image, dtype=np.float64)
    local_mean = uniform_filter(img, size=window)
    local_sq_mean = uniform_filter(img ** 2, size=window)
    local_var = np.maximum(0, local_sq_mean - local_mean ** 2)
    weight = np.clip(1.0 - (noise_var / (local_var + 1e-6)), 0.0, 1.0)
    return local_mean + weight * (img - local_mean)


def compute_otsu_threshold(diff_array: np.ndarray, num_bins: int = 256):
    """Otsu bimodal thresholding."""
    valid = diff_array[np.isfinite(diff_array)]
    hist, bin_edges = np.histogram(valid, bins=num_bins)
    bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2.0
    total = len(valid)
    current_max, threshold = 0.0, -4.5
    sum_total = np.dot(hist, bin_centers)
    weight_bg, sum_bg = 0.0, 0.0
    for i in range(num_bins):
        weight_bg += hist[i]
        if weight_bg == 0: continue
        weight_fg = total - weight_bg
        if weight_fg == 0: break
        sum_bg += hist[i] * bin_centers[i]
        mean_bg = sum_bg / weight_bg
        mean_fg = (sum_total - sum_bg) / weight_fg
        var_between = weight_bg * weight_fg * ((mean_bg - mean_fg) ** 2)
        if var_between > current_max:
            current_max = var_between
            threshold = bin_centers[i]
    return float(np.clip(threshold, -8.0, -3.0))


def run_change_detection(baseline_path: str, event_path: str):
    """Run change detection between baseline and event acquisitions."""
    with h5py.File(baseline_path, "r") as h5:
        base_hh = h5["science/SSAR/GCOV/grids/frequencyA/HHHH"][:]
        base_hv = h5["science/SSAR/GCOV/grids/frequencyA/HVHV"][:]
        base_mask = h5["science/SSAR/GCOV/grids/frequencyA/mask"][:]
        x_coords = h5["science/SSAR/GCOV/grids/frequencyA/xCoordinates"][:]
        y_coords = h5["science/SSAR/GCOV/grids/frequencyA/yCoordinates"][:]

    with h5py.File(event_path, "r") as h5:
        event_hh = h5["science/SSAR/GCOV/grids/frequencyA/HHHH"][:]
        event_hv = h5["science/SSAR/GCOV/grids/frequencyA/HVHV"][:]
        event_mask = h5["science/SSAR/GCOV/grids/frequencyA/mask"][:]

    # Speckle filter + dB conversion
    base_hh_f = apply_lee_filter(base_hh)
    event_hh_f = apply_lee_filter(event_hh)
    event_hv_f = apply_lee_filter(event_hv)

    base_db = 10.0 * np.log10(np.maximum(1e-7, base_hh_f))
    event_db = 10.0 * np.log10(np.maximum(1e-7, event_hh_f))

    combined_mask = (base_mask == 0) & (event_mask == 0)
    base_db[~combined_mask] = np.nan
    event_db[~combined_mask] = np.nan

    delta_db = event_db - base_db
    otsu_thresh = compute_otsu_threshold(delta_db)

    # RVI for vegetation
    rvi = (4.0 * event_hv_f) / (event_hh_f + event_hv_f + 1e-6)
    rvi = np.clip(rvi, 0.0, 1.0)

    # 6-class taxonomy
    dim_y, dim_x = base_db.shape
    pixel_area_m2 = abs((x_coords[1] - x_coords[0]) * (y_coords[1] - y_coords[0]))
    pixel_area_km2 = pixel_area_m2 / 1_000_000.0

    classification = np.zeros((dim_y, dim_x), dtype=np.uint8)
    perm_water = (base_db <= -16.0) & (event_db <= -16.0)
    classification[perm_water] = 1

    new_flood = (delta_db <= otsu_thresh) & (event_db <= -14.5) & ~perm_water
    classification[new_flood] = 2

    flooded_veg = (delta_db >= +2.5) & (event_db >= -11.0) & (rvi >= 0.35)
    classification[flooded_veg] = 4

    marginal = (delta_db < -2.0) & (delta_db > otsu_thresh) & (event_db < -13.0) & (classification == 0)
    classification[marginal] = 3

    receded = (base_db <= -16.0) & (event_db > -13.0) & (classification == 0)
    classification[receded] = 5

    # Morphological cleanup
    flood_bin = classification == 2
    cleaned = binary_opening(flood_bin, structure=np.ones((2, 2)))
    classification[(classification == 2) & ~cleaned] = 0

    # Area calculations
    counts = {i: int(np.sum(classification == i)) for i in range(6)}
    areas = {i: counts[i] * pixel_area_km2 for i in range(6)}
    total_reach = dim_y * dim_x * pixel_area_km2
    total_water = (counts[1] + counts[2] + counts[4]) * pixel_area_km2

    return {
        "classification": classification,
        "event_db": event_db,
        "delta_db": delta_db,
        "otsu_threshold": otsu_thresh,
        "counts": counts,
        "areas_km2": areas,
        "total_reach_km2": total_reach,
        "total_water_km2": total_water,
        "inundation_pct": (total_water / total_reach) * 100.0,
        "x_coords": x_coords,
        "y_coords": y_coords,
        "pixel_area_km2": pixel_area_km2
    }


# =============================================================================
# MAIN: TASK 3 EXECUTION
# =============================================================================

def main():
    print("=" * 80)
    print("  TASK 3: MULTI-TEMPORAL FLOOD HYDROGRAPH TIME-SERIES ANALYSIS")
    print("  Brahmaputra FloodWatch | NISAR S-band L2 GCOV | Track 019 / Frame 075")
    print("  7 Orbital Revisit Cycles | June 03 - August 14, 2026")
    print("=" * 80)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # =========================================================================
    # STEP 1: Generate all 7 HDF5 products
    # =========================================================================
    print("\n[STEP 1] Generating NISAR Level 2 GCOV products for all 7 cycles...")

    h5_paths = {}
    for obs in OBSERVATION_CATALOG:
        path = generate_h5_product(obs)
        h5_paths[obs["cycle"]] = path

    # =========================================================================
    # STEP 2: Run change detection for each cycle against baseline (Cycle 022)
    # =========================================================================
    baseline_path = h5_paths[22]
    baseline_cycle = OBSERVATION_CATALOG[0]

    print(f"\n[STEP 2] Running change detection against pre-monsoon baseline (Cycle 022: {baseline_cycle['date']})...")

    time_series = []
    classifications = {}

    for obs in OBSERVATION_CATALOG:
        cycle = obs["cycle"]
        if cycle == 22:
            # Baseline self-comparison: only permanent water
            with h5py.File(h5_paths[22], "r") as h5:
                hh = h5["science/SSAR/GCOV/grids/frequencyA/HHHH"][:]
                x_c = h5["science/SSAR/GCOV/grids/frequencyA/xCoordinates"][:]
                y_c = h5["science/SSAR/GCOV/grids/frequencyA/yCoordinates"][:]
            hh_f = apply_lee_filter(hh)
            hh_db_vals = 10.0 * np.log10(np.maximum(1e-7, hh_f))
            pix_area = abs((x_c[1] - x_c[0]) * (y_c[1] - y_c[0])) / 1e6
            perm_count = int(np.sum(hh_db_vals < -16.0))
            perm_area = perm_count * pix_area

            entry = {
                "cycle": cycle,
                "date": obs["date"],
                "stage": obs["stage"],
                "discharge_m3s": obs["discharge_m3s"],
                "permanent_water_km2": round(perm_area, 3),
                "newly_inundated_km2": 0.0,
                "flooded_vegetation_km2": 0.0,
                "marginal_saturated_km2": 0.0,
                "total_water_km2": round(perm_area, 3),
                "inundation_pct": round((perm_area / (GRID_DIM * GRID_DIM * pix_area)) * 100.0, 2),
                "otsu_threshold_db": 0.0
            }
            time_series.append(entry)

            # Create a classification for baseline (only permanent water)
            cls = np.zeros((GRID_DIM, GRID_DIM), dtype=np.uint8)
            cls[hh_db_vals < -16.0] = 1
            classifications[cycle] = cls

            print(f"    Cycle {obs['cycle_str']} ({obs['date']}): Baseline reference | Perm Water = {perm_area:.3f} km2")
        else:
            result = run_change_detection(baseline_path, h5_paths[cycle])
            classifications[cycle] = result["classification"]

            entry = {
                "cycle": cycle,
                "date": obs["date"],
                "stage": obs["stage"],
                "discharge_m3s": obs["discharge_m3s"],
                "permanent_water_km2": round(result["areas_km2"][1], 3),
                "newly_inundated_km2": round(result["areas_km2"][2], 3),
                "flooded_vegetation_km2": round(result["areas_km2"][4], 3),
                "marginal_saturated_km2": round(result["areas_km2"][3], 3),
                "total_water_km2": round(result["total_water_km2"], 3),
                "inundation_pct": round(result["inundation_pct"], 2),
                "otsu_threshold_db": round(result["otsu_threshold"], 2)
            }
            time_series.append(entry)

            print(f"    Cycle {obs['cycle_str']} ({obs['date']}): {obs['stage']} | "
                  f"Total Water = {result['total_water_km2']:.3f} km2 ({result['inundation_pct']:.1f}%)")

    # =========================================================================
    # STEP 3: Export time-series CSV
    # =========================================================================
    print(f"\n[STEP 3] Exporting time-series data...")

    csv_path = os.path.join(OUTPUT_DIR, "nisar_flood_timeseries.csv")
    fieldnames = list(time_series[0].keys())
    with open(csv_path, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(time_series)
    print(f"  Saved CSV: {csv_path}")

    # JSON report
    json_report = {
        "task": "Task 3: Multi-Temporal Flood Hydrograph Time-Series",
        "project": "Brahmaputra FloodWatch",
        "challenge": "NASA Space Apps Challenge 2026 - Dancing with the SARs",
        "sensor": "NISAR ISRO S-band SAR (3.2 GHz, 9.3 cm wavelength)",
        "product_level": "Level 2 GCOV (Geocoded Polarimetric Covariance)",
        "track": 19,
        "frame": 75,
        "orbit_repeat_days": 12,
        "baseline_date": "2026-06-03",
        "study_region": "Kaziranga National Park & Brahmaputra Floodplain Corridor, Assam",
        "grid_dimensions": f"{GRID_DIM}x{GRID_DIM}",
        "pixel_spacing_m": 25.0,
        "crs": "EPSG:32646 (WGS 84 / UTM Zone 46N)",
        "generated_at": datetime.now().isoformat(),
        "provenance": "Locally generated reference products using calibrated empirical SAR physics models",
        "time_series": time_series,
        "peak_flood": {
            "date": "2026-07-09",
            "cycle": 25,
            "total_water_km2": next(e["total_water_km2"] for e in time_series if e["cycle"] == 25),
            "inundation_pct": next(e["inundation_pct"] for e in time_series if e["cycle"] == 25),
        }
    }
    json_path = os.path.join(OUTPUT_DIR, "nisar_flood_timeseries_report.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_report, f, indent=2)
    print(f"  Saved JSON report: {json_path}")

    # =========================================================================
    # STEP 4: Generate Flood Hydrograph Evolution Curve
    # =========================================================================
    print(f"\n[STEP 4] Generating flood hydrograph evolution curve...")

    dates = [e["date"] for e in time_series]
    date_labels = [datetime.strptime(d, "%Y-%m-%d").strftime("%d %b") for d in dates]
    total_water = [e["total_water_km2"] for e in time_series]
    perm_water = [e["permanent_water_km2"] for e in time_series]
    new_flood = [e["newly_inundated_km2"] for e in time_series]
    flood_veg = [e["flooded_vegetation_km2"] for e in time_series]
    discharge = [e["discharge_m3s"] for e in time_series]
    stages = [e["stage"] for e in time_series]

    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(14, 10), dpi=150, gridspec_kw={"height_ratios": [3, 2]})

    # --- Top panel: Stacked area + total water curve ---
    x_pos = np.arange(len(dates))

    ax1.fill_between(x_pos, 0, perm_water, alpha=0.7, color="#0284c7", label="Permanent Channel")
    ax1.fill_between(x_pos, perm_water,
                     [p + n for p, n in zip(perm_water, new_flood)],
                     alpha=0.7, color="#f43f5e", label="Newly Inundated Open Water")
    ax1.fill_between(x_pos,
                     [p + n for p, n in zip(perm_water, new_flood)],
                     [p + n + v for p, n, v in zip(perm_water, new_flood, flood_veg)],
                     alpha=0.7, color="#10b981", label="Flooded Vegetation (Double-Bounce)")
    ax1.plot(x_pos, total_water, "ko-", markersize=8, linewidth=2.5, label="Total Water-Affected Area", zorder=5)

    # Mark peak flood
    peak_idx = total_water.index(max(total_water))
    ax1.annotate(
        f"PEAK FLOOD\n{total_water[peak_idx]:.2f} km$^2$\n({time_series[peak_idx]['inundation_pct']:.1f}%)",
        xy=(peak_idx, total_water[peak_idx]),
        xytext=(peak_idx + 0.5, total_water[peak_idx] + 0.4),
        fontsize=9, fontweight="bold", color="#dc2626",
        arrowprops=dict(arrowstyle="->", color="#dc2626", lw=2),
        bbox=dict(boxstyle="round,pad=0.3", facecolor="#fef2f2", edgecolor="#dc2626", alpha=0.9)
    )

    ax1.set_xticks(x_pos)
    ax1.set_xticklabels(date_labels, fontsize=9)
    ax1.set_ylabel("Inundation Area (km$^2$)", fontsize=11, fontweight="bold")
    ax1.set_title(
        "Brahmaputra FloodWatch — NISAR S-band Multi-Temporal Flood Hydrograph\n"
        "Track 019 / Frame 075 | Kaziranga National Park Corridor | June-August 2026",
        fontsize=13, fontweight="bold", pad=12
    )
    ax1.legend(loc="upper left", fontsize=9, framealpha=0.9)
    ax1.grid(True, linestyle=":", alpha=0.5)
    ax1.set_xlim(-0.3, len(dates) - 0.7)

    # Add stage labels
    for i, stage in enumerate(stages):
        ax1.text(i, -0.15, stage, ha="center", va="top", fontsize=7, rotation=20,
                 transform=ax1.get_xaxis_transform(), color="#64748b")

    # --- Bottom panel: River discharge hydrograph ---
    ax2.fill_between(x_pos, 0, [d/1000 for d in discharge], alpha=0.3, color="#3b82f6")
    ax2.plot(x_pos, [d/1000 for d in discharge], "s-", color="#1d4ed8", markersize=7, linewidth=2.5, label="Estimated Discharge")

    # Add danger level
    ax2.axhline(y=45.0, color="#dc2626", linestyle="--", linewidth=1.5, alpha=0.7, label="Danger Level (~45,000 m$^3$/s)")
    ax2.axhline(y=25.0, color="#f59e0b", linestyle="--", linewidth=1, alpha=0.6, label="Warning Level (~25,000 m$^3$/s)")

    ax2.set_xticks(x_pos)
    ax2.set_xticklabels(date_labels, fontsize=9)
    ax2.set_ylabel("River Discharge ($\\times$1000 m$^3$/s)", fontsize=11, fontweight="bold")
    ax2.set_xlabel("Acquisition Date (12-Day NISAR Orbital Repeat Cycle)", fontsize=10)
    ax2.legend(loc="upper left", fontsize=8.5, framealpha=0.9)
    ax2.grid(True, linestyle=":", alpha=0.5)
    ax2.set_xlim(-0.3, len(dates) - 0.7)

    plt.tight_layout()
    hydro_path = os.path.join(OUTPUT_DIR, "nisar_flood_hydrograph.png")
    fig.savefig(hydro_path, bbox_inches="tight")
    plt.close(fig)
    print(f"  Saved flood hydrograph: {hydro_path}")

    # =========================================================================
    # STEP 5: Generate 7-Panel Temporal Progression Mosaic
    # =========================================================================
    print(f"\n[STEP 5] Generating 7-panel temporal progression mosaic...")

    fig_mosaic, axes_m = plt.subplots(2, 4, figsize=(20, 10), dpi=150)
    axes_flat = axes_m.flatten()

    class_labels = {
        0: ("Stable Land", "#262626"),
        1: ("Permanent Water", "#0284c7"),
        2: ("Newly Inundated", "#f43f5e"),
        3: ("Marginal Saturated", "#f59e0b"),
        4: ("Flooded Vegetation", "#10b981"),
        5: ("Receded Water", "#8b5cf6"),
    }
    cmap_tax = ListedColormap([class_labels[i][1] for i in range(6)])

    for idx, obs in enumerate(OBSERVATION_CATALOG):
        ax = axes_flat[idx]
        cls = classifications[obs["cycle"]]
        entry = time_series[idx]

        # Get coordinates for extent
        with h5py.File(h5_paths[obs["cycle"]], "r") as h5:
            xc = h5["science/SSAR/GCOV/grids/frequencyA/xCoordinates"][:]
            yc = h5["science/SSAR/GCOV/grids/frequencyA/yCoordinates"][:]
        ext = [np.min(xc)/1000, np.max(xc)/1000, np.min(yc)/1000, np.max(yc)/1000]

        ax.imshow(cls, cmap=cmap_tax, vmin=0, vmax=5, extent=ext)

        # Title with date and metrics
        title_color = "#dc2626" if obs["cycle"] == 25 else "black"
        ax.set_title(
            f"Cycle {obs['cycle_str']}: {obs['date']}\n"
            f"{entry['stage']}\n"
            f"Water: {entry['total_water_km2']:.2f} km$^2$ ({entry['inundation_pct']:.1f}%)",
            fontsize=9, fontweight="bold", color=title_color, pad=6
        )
        ax.set_xlabel("Easting (km)", fontsize=7)
        ax.set_ylabel("Northing (km)", fontsize=7) if idx % 4 == 0 else None
        ax.tick_params(labelsize=7)

    # Remove the 8th unused subplot
    axes_flat[7].axis("off")

    # Add legend in the empty panel
    legend_patches = [mpatches.Patch(color=class_labels[i][1], label=class_labels[i][0]) for i in range(6)]
    axes_flat[7].legend(handles=legend_patches, loc="center", fontsize=10, framealpha=0.9, title="Classification Legend")
    axes_flat[7].set_title("", fontsize=1)

    fig_mosaic.suptitle(
        "NISAR Multi-Temporal Flood Inundation Progression\n"
        "Brahmaputra River — Kaziranga Corridor | Track 019 / Frame 075 | S-band GCOV",
        fontsize=14, fontweight="bold", y=1.02
    )
    plt.tight_layout()
    mosaic_path = os.path.join(OUTPUT_DIR, "nisar_temporal_mosaic.png")
    fig_mosaic.savefig(mosaic_path, bbox_inches="tight")
    plt.close(fig_mosaic)
    print(f"  Saved temporal mosaic: {mosaic_path}")

    # =========================================================================
    # STEP 6: Generate SAR Backscatter Temporal Strip
    # =========================================================================
    print(f"\n[STEP 6] Generating SAR backscatter temporal strip...")

    fig_strip, axes_s = plt.subplots(1, 7, figsize=(24, 4), dpi=150)
    for idx, obs in enumerate(OBSERVATION_CATALOG):
        ax = axes_s[idx]
        with h5py.File(h5_paths[obs["cycle"]], "r") as h5:
            hh = h5["science/SSAR/GCOV/grids/frequencyA/HHHH"][:]
            hh = apply_lee_filter(hh)
        hh_db_vals = 10.0 * np.log10(np.maximum(1e-7, hh))
        ax.imshow(hh_db_vals, cmap="gray", vmin=-24, vmax=-5)
        ax.set_title(f"{obs['date']}\n{obs['stage']}", fontsize=7, fontweight="bold")
        ax.axis("off")

    fig_strip.suptitle(
        "NISAR S-band HH Backscatter Evolution (Grayscale SAR Imagery Strip)",
        fontsize=12, fontweight="bold"
    )
    plt.tight_layout()
    strip_path = os.path.join(OUTPUT_DIR, "nisar_sar_temporal_strip.png")
    fig_strip.savefig(strip_path, bbox_inches="tight")
    plt.close(fig_strip)
    print(f"  Saved SAR temporal strip: {strip_path}")

    # =========================================================================
    # STEP 7: Export classification GeoTIFFs for all cycles
    # =========================================================================
    if HAS_RASTERIO:
        print(f"\n[STEP 7] Exporting classification GeoTIFFs for all cycles...")
        for obs in OBSERVATION_CATALOG:
            cycle = obs["cycle"]
            cls = classifications[cycle]
            date_compact = obs["date"].replace("-", "")
            tif_out = os.path.join(OUTPUT_DIR, f"NISAR_Flood_Classification_{date_compact}.tif")

            with h5py.File(h5_paths[cycle], "r") as h5:
                xc = h5["science/SSAR/GCOV/grids/frequencyA/xCoordinates"][:]
                yc = h5["science/SSAR/GCOV/grids/frequencyA/yCoordinates"][:]

            transform = from_bounds(np.min(xc), np.min(yc), np.max(xc), np.max(yc), cls.shape[1], cls.shape[0])
            with rasterio.open(
                tif_out, "w", driver="GTiff",
                height=cls.shape[0], width=cls.shape[1],
                count=1, dtype="uint8",
                crs="EPSG:32646", transform=transform,
                nodata=255, compress="deflate"
            ) as dst:
                dst.write(cls, 1)
                dst.set_band_description(1, f"Flood Classification {obs['date']}")
            print(f"    Saved: {os.path.basename(tif_out)}")
    else:
        print(f"\n[STEP 7] Rasterio not installed; skipping GeoTIFF exports.")

    # =========================================================================
    # SUMMARY
    # =========================================================================
    print(f"\n{'='*80}")
    print(f"  TASK 3 COMPLETE: MULTI-TEMPORAL FLOOD HYDROGRAPH ANALYSIS")
    print(f"{'='*80}")
    print(f"\n  Time-Series Summary:")
    print(f"  {'Date':<12} {'Stage':<28} {'Total Water (km2)':>18} {'Inund. %':>10} {'Discharge':>12}")
    print(f"  {'-'*12} {'-'*28} {'-'*18} {'-'*10} {'-'*12}")
    for e in time_series:
        marker = " <<< PEAK" if e["cycle"] == 25 else ""
        print(f"  {e['date']:<12} {e['stage']:<28} {e['total_water_km2']:>18.3f} {e['inundation_pct']:>9.1f}% {e['discharge_m3s']:>10,} m3/s{marker}")

    print(f"\n  Output Files:")
    print(f"    Hydrograph:      {hydro_path}")
    print(f"    Temporal Mosaic: {mosaic_path}")
    print(f"    SAR Strip:       {strip_path}")
    print(f"    CSV Data:        {csv_path}")
    print(f"    JSON Report:     {json_path}")
    print(f"    HDF5 Products:   {PRODUCTS_DIR} ({len(h5_paths)} files)")
    if HAS_RASTERIO:
        print(f"    GeoTIFFs:        {OUTPUT_DIR} (7 classification maps)")
    print(f"\n{'='*80}")


if __name__ == "__main__":
    main()

