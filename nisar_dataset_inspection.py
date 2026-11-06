"""
Task 1: NISAR Dataset Exploration & Inspection Workflow
NASA Space Apps Challenge 2026 — Brahmaputra FloodWatch

This standalone script performs:
1. Open and inspect HDF5 hierarchy (CF-1.8 compliant NISAR Level 2 GCOV).
2. Extract spatial metadata, coordinate systems, projection, and bounding footprint.
3. Read calibrated radar backscatter layers (co-pol HHHH, cross-pol HVHV).
4. Apply data validity masking and logarithmic decibel (dB) transformation.
5. Generate rigorous grayscale SAR imagery (no artificial RGB pseudo-coloring).
6. Generate geographic footprint map over Brahmaputra Basin, Assam.
7. Export radar backscatter layer to GeoTIFF with UTM Zone 46N (EPSG:32646) georeferencing.
"""

import os
import sys
import json
import h5py
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

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

def run_nisar_inspection(
    h5_path: str,
    output_dir: str = "data/output"
):
    os.makedirs(output_dir, exist_ok=True)
    print("=" * 80)
    print("TASK 1: NISAR S-BAND LEVEL-2 GCOV DATASET EXPLORATION WORKFLOW")
    print(f"Inspecting file: {h5_path}")
    print("=" * 80)

    if not os.path.exists(h5_path):
        raise FileNotFoundError(f"File not found: {h5_path}")

    # 1. Open HDF5 & Traverse Hierarchy
    metadata_summary = {
        "file_path": os.path.abspath(h5_path),
        "file_size_bytes": os.path.getsize(h5_path),
        "groups": [],
        "datasets": []
    }

    with h5py.File(h5_path, "r") as h5:
        # Root attributes
        print("\n[STEP 1] Root File Attributes (CF Conventions):")
        for k, v in h5.attrs.items():
            print(f"  - {k}: {v}")
            metadata_summary[f"root_{k}"] = str(v)

        def visitor(name, obj):
            if isinstance(obj, h5py.Dataset):
                metadata_summary["datasets"].append({
                    "name": name,
                    "shape": list(obj.shape),
                    "dtype": str(obj.dtype),
                    "attrs": {ak: str(av) for ak, av in obj.attrs.items()}
                })
            else:
                metadata_summary["groups"].append(name)

        h5.visititems(visitor)

        print(f"\nDiscovered {len(metadata_summary['groups'])} Groups and {len(metadata_summary['datasets'])} Datasets.")

        # Identify instrument and GCOV grid
        science_grp = h5.get("science")
        instrument = "SSAR" if "SSAR" in science_grp else "LSAR"
        gcov_grp = science_grp[instrument]["GCOV"]
        ident_grp = gcov_grp.get("identification", {})
        ident_attrs = {k: str(v) for k, v in ident_grp.attrs.items()}

        print(f"\n[STEP 2] Product Identification & Mission Orbit:")
        print(f"  - Instrument: {instrument} ({'ISRO S-band 3.2 GHz' if instrument == 'SSAR' else 'NASA L-band 1.25 GHz'})")
        print(f"  - Granule ID: {ident_attrs.get('granule_id', 'N/A')}")
        print(f"  - Relative Track: {ident_attrs.get('track_number', '019')}")
        print(f"  - Frame Number: {ident_attrs.get('frame_number', '075')}")
        print(f"  - Cycle Number: {ident_attrs.get('cycle_number', '025')}")
        print(f"  - Orbit Pass Direction: {ident_attrs.get('pass_direction', 'Descending')}")
        print(f"  - Acquisition Date: {ident_attrs.get('acquisition_date', '2026-07-09')}")

        # Grids & Projections
        freq_a = gcov_grp["grids/frequencyA"]
        available_layers = list(freq_a.keys())
        print(f"\n[STEP 3] Available Measurement Layers under 'grids/frequencyA':")
        for layer in available_layers:
            ds = freq_a[layer]
            print(f"  - {layer:<15} shape: {str(ds.shape):<15} dtype: {str(ds.dtype):<10}")

        # Read Coordinates
        x_coords = freq_a["xCoordinates"][:]
        y_coords = freq_a["yCoordinates"][:]
        proj_ds = freq_a["projection"]
        epsg_code = int(proj_ds.attrs.get("epsg_code", 32646))
        spatial_ref = str(proj_ds.attrs.get("spatial_ref", "WGS 84 / UTM zone 46N"))

        x_min, x_max = float(np.min(x_coords)), float(np.max(x_coords))
        y_min, y_max = float(np.min(y_coords)), float(np.max(y_coords))
        dx = float(abs(x_coords[1] - x_coords[0])) if len(x_coords) > 1 else 25.0
        dy = float(abs(y_coords[1] - y_coords[0])) if len(y_coords) > 1 else 25.0

        print(f"\n[STEP 4] Geospatial Extent & Reference System:")
        print(f"  - Projection: {spatial_ref} (EPSG:{epsg_code})")
        print(f"  - X Extent (Easting):  [{x_min:.1f} m, {x_max:.1f} m] (Pixel spacing: {dx:.1f} m)")
        print(f"  - Y Extent (Northing): [{y_min:.1f} m, {y_max:.1f} m] (Pixel spacing: {dy:.1f} m)")

        # Read Calibrated Backscatter (HHHH and HVHV)
        hh_linear = freq_a["HHHH"][:]
        hv_linear = freq_a["HVHV"][:] if "HVHV" in freq_a else None
        mask = freq_a["mask"][:] if "mask" in freq_a else np.zeros_like(hh_linear, dtype=np.uint8)

        # Handle Missing / Masked Values (mask != 0 is invalid/shadow/fill)
        valid_hh_linear = np.where(mask == 0, hh_linear, np.nan)
        # Avoid log(0) or negative values in power
        valid_hh_linear = np.where(valid_hh_linear > 1e-7, valid_hh_linear, 1e-7)
        # Convert to decibels: gamma_0_dB = 10 * log10(gamma_0_linear)
        hh_db = 10.0 * np.log10(valid_hh_linear)

        print(f"\n[STEP 5] Co-polarized HH Layer Statistical Analysis:")
        print(f"  - Array Dimensions: {hh_db.shape[0]} rows x {hh_db.shape[1]} columns ({hh_db.size:,} pixels)")
        print(f"  - Linear Gamma-0 range: [{np.nanmin(valid_hh_linear):.6f}, {np.nanmax(valid_hh_linear):.6f}]")
        print(f"  - Decibel (dB) range:   [{np.nanmin(hh_db):.2f} dB, {np.nanmax(hh_db):.2f} dB]")
        print(f"  - Mean Backscatter:     {np.nanmean(hh_db):.2f} dB (Std Dev: {np.nanstd(hh_db):.2f} dB)")

    # 2. Save Metadata Summary JSON
    metadata_summary["identification"] = ident_attrs
    metadata_summary["projection"] = {
        "epsg_code": epsg_code,
        "spatial_ref": spatial_ref,
        "x_min": x_min,
        "x_max": x_max,
        "y_min": y_min,
        "y_max": y_max,
        "pixel_spacing_x_m": dx,
        "pixel_spacing_y_m": dy
    }
    metadata_summary["statistics"] = {
        "hh_min_db": float(np.nanmin(hh_db)),
        "hh_max_db": float(np.nanmax(hh_db)),
        "hh_mean_db": float(np.nanmean(hh_db)),
        "hh_std_db": float(np.nanstd(hh_db))
    }
    json_path = os.path.join(output_dir, "nisar_metadata_summary.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(metadata_summary, f, indent=2)
    print(f"\nSaved metadata JSON summary: {json_path}")

    # 3. Step 4 — Generate Grayscale Radar Image (Strictly Grayscale, no pseudo-color photograph deception)
    print("\n[STEP 6] Rendering Scientific Grayscale Radar Image...")
    fig, ax = plt.subplots(figsize=(9, 8), dpi=150)
    # Clip percentiles to prevent speckle outliers from washing out the dynamic range
    p1, p99 = np.nanpercentile(hh_db, 1), np.nanpercentile(hh_db, 99)
    im = ax.imshow(
        hh_db,
        cmap="gray",
        vmin=p1,
        vmax=p99,
        extent=[x_min / 1000.0, x_max / 1000.0, y_min / 1000.0, y_max / 1000.0]
    )
    cbar = plt.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
    cbar.set_label("Terrain-Corrected Gamma-0 Backscatter: $\\gamma^0$ (dB)", fontsize=10)

    ax.set_title(
        f"NISAR S-band Level 2 GCOV (Co-Pol HH)\n"
        f"Acquisition: {ident_attrs.get('acquisition_date', '2026-07-09')} UTC | Track 019 / Frame 075 (Descending)\n"
        f"Brahmaputra River Corridor, Assam [UTM Zone 46N]",
        fontsize=11, fontweight="bold", pad=12
    )
    ax.set_xlabel("UTM Easting (km) [EPSG:32646]", fontsize=10)
    ax.set_ylabel("UTM Northing (km) [EPSG:32646]", fontsize=10)
    ax.grid(True, linestyle="--", alpha=0.3, color="white")

    # Add explanatory annotations on image
    ax.text(
        0.02, 0.03,
        "Dark pixels (<-18 dB): Specular reflection (Water)\n"
        "Bright pixels (> -8 dB): High roughness / Double-bounce (Flooded Vegetation)",
        transform=ax.transAxes,
        fontsize=8,
        color="black",
        bbox=dict(boxstyle="round,pad=0.4", facecolor="white", alpha=0.85, edgecolor="gray")
    )

    plt.tight_layout()
    gray_png_path = os.path.join(output_dir, "radar_backscatter_hh_grayscale.png")
    fig.savefig(gray_png_path)
    plt.close(fig)
    print(f"Saved grayscale radar image: {gray_png_path}")

    # 4. Generate Footprint Context Map showing Brahmaputra Basin Coverage
    print("\n[STEP 7] Rendering Footprint Context Map (Brahmaputra Basin, Assam)...")
    fig2, ax2 = plt.subplots(figsize=(10, 6), dpi=150)
    
    # Regional context coordinates for Assam (approx 25.5N - 28.0N, 90.0E - 96.0E)
    # Swath footprint covers: 26.2N - 27.2N, 92.5E - 94.0E
    ax2.set_xlim(91.0, 95.5)
    ax2.set_ylim(25.8, 27.8)
    ax2.set_facecolor("#f8fafc")

    # Simplified schematic of Brahmaputra River Course
    river_x = [95.2, 94.6, 94.0, 93.4, 92.8, 92.2, 91.5]
    river_y = [27.5, 27.2, 26.9, 26.7, 26.5, 26.3, 26.1]
    ax2.plot(river_x, river_y, color="#0284c7", linewidth=4.5, label="Brahmaputra River Main Channel", alpha=0.8)

    # Key landmark settlements
    landmarks = [
        ("Guwahati (Kamrup)", 91.75, 26.18, "#0f172a"),
        ("Tezpur (Sonitpur)", 92.80, 26.63, "#0f172a"),
        ("Kaziranga National Park", 93.35, 26.60, "#15803d"),
        ("Majuli River Island", 94.20, 26.95, "#0f172a")
    ]
    for name, lon, lat, col in landmarks:
        ax2.plot(lon, lat, marker="o", markersize=6, color=col)
        ax2.text(lon + 0.08, lat - 0.04, name, fontsize=8.5, fontweight="semibold", color=col)

    # NISAR Track 019 / Frame 075 Footprint (Descending Swath Polygon)
    swath_poly = plt.Polygon(
        [[92.65, 26.95], [93.75, 27.05], [93.55, 26.25], [92.45, 26.15]],
        closed=True,
        facecolor="#06b6d4",
        edgecolor="#0891b2",
        alpha=0.35,
        linewidth=2,
        linestyle="--",
        label="NISAR Track 019 / Frame 075 Footprint"
    )
    ax2.add_patch(swath_poly)

    ax2.set_title(
        "NISAR Track 019 / Frame 075 Geographic Coverage Map\n"
        "Brahmaputra River Basin, Assam, India",
        fontsize=11, fontweight="bold", pad=10
    )
    ax2.set_xlabel("Longitude (°E)", fontsize=9)
    ax2.set_ylabel("Latitude (°N)", fontsize=9)
    ax2.grid(True, linestyle=":", alpha=0.6)
    ax2.legend(loc="lower right", fontsize=8)

    plt.tight_layout()
    map_png_path = os.path.join(output_dir, "footprint_map_brahmaputra.png")
    fig2.savefig(map_png_path)
    plt.close(fig2)
    print(f"Saved footprint coverage map: {map_png_path}")

    # 5. Export to GeoTIFF using Rasterio
    if HAS_RASTERIO:
        print("\n[STEP 8] Exporting Georeferenced GeoTIFF via Rasterio...")
        tif_path = os.path.join(output_dir, "NISAR_S2_GCOV_025_019_D_075_HH.tif")
        transform = from_bounds(x_min, y_min, x_max, y_max, hh_db.shape[1], hh_db.shape[0])
        
        # Replace NaNs with standard NoData value (-9999.0)
        hh_export = np.where(np.isnan(hh_db), -9999.0, hh_db).astype(np.float32)

        with rasterio.open(
            tif_path,
            "w",
            driver="GTiff",
            height=hh_db.shape[0],
            width=hh_db.shape[1],
            count=1,
            dtype="float32",
            crs=f"EPSG:{epsg_code}",
            transform=transform,
            nodata=-9999.0,
            compress="deflate"
        ) as dst:
            dst.write(hh_export, 1)
            dst.set_band_description(1, "NISAR S-band L2 GCOV HHHH Gamma-0 (dB)")
        print(f"Saved georeferenced GeoTIFF: {tif_path}")
    else:
        print("\n[STEP 8] Rasterio not installed; skipping GeoTIFF export.")

    print("\n" + "=" * 80)
    print("TASK 1 INSPECTION COMPLETED SUCCESSFULLY!")
    print(f"All outputs generated in: {os.path.abspath(output_dir)}")
    print("=" * 80)

if __name__ == "__main__":
    target_h5 = "data/nisar_products/NISAR_S2_PR_GCOV_025_019_D_075_2500_CRNA_A_20260709T124208_20260709T124245_P00500_M_F_I_001.h5"
    run_nisar_inspection(target_h5)

