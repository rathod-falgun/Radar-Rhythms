"""
NISAR Data Viewer Utility
NASA Space Apps Challenge 2026 — Brahmaputra FloodWatch

Converts HDF5 (.h5) and GeoTIFF (.tif) files into viewable PNG images
and generates an HTML report for HDF5 structure inspection.

Usage:
    python view_nisar_data.py                 # View all data files
    python view_nisar_data.py path/to/file.h5 # View specific file
    python view_nisar_data.py path/to/file.tif
"""

import os
import sys
import json
import h5py
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap
import matplotlib.patches as mpatches
from datetime import datetime

# Configure UTF-8 stdout for Windows consoles
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

try:
    import rasterio
    HAS_RASTERIO = True
except ImportError:
    HAS_RASTERIO = False

OUTPUT_DIR = os.path.join("data", "output", "viewers")


# =============================================================================
# HDF5 VIEWER — Generates PNG + HTML report
# =============================================================================

def view_h5_file(h5_path: str, output_dir: str = OUTPUT_DIR):
    """Generate a comprehensive visual report from a NISAR HDF5 GCOV product."""
    os.makedirs(output_dir, exist_ok=True)
    basename = os.path.splitext(os.path.basename(h5_path))[0]

    print(f"\n{'='*70}")
    print(f"  HDF5 VIEWER: {os.path.basename(h5_path)}")
    print(f"{'='*70}")

    with h5py.File(h5_path, "r") as h5:
        # --- Collect tree structure ---
        tree_lines = []
        datasets_info = []

        def visitor(name, obj):
            indent = "  " * name.count("/")
            if isinstance(obj, h5py.Dataset):
                tree_lines.append(f"{indent}[Dataset] {name}  shape={obj.shape}  dtype={obj.dtype}")
                datasets_info.append({
                    "path": name,
                    "shape": list(obj.shape),
                    "dtype": str(obj.dtype),
                    "attrs": {k: str(v) for k, v in obj.attrs.items()}
                })
            else:
                tree_lines.append(f"{indent}[Group]   {name}")

        h5.visititems(visitor)

        # --- Root attributes ---
        root_attrs = {k: str(v) for k, v in h5.attrs.items()}

        # --- Identify instrument ---
        science_grp = h5.get("science")
        instrument = "SSAR" if "SSAR" in science_grp else "LSAR"
        gcov_grp = science_grp[instrument]["GCOV"]

        # --- Identification metadata ---
        ident_grp = gcov_grp.get("identification", {})
        ident_attrs = {k: str(v) for k, v in ident_grp.attrs.items()} if hasattr(ident_grp, 'attrs') else {}

        # --- Read frequency grid ---
        freq_a = gcov_grp["grids/frequencyA"]
        x_coords = freq_a["xCoordinates"][:]
        y_coords = freq_a["yCoordinates"][:]
        epsg = int(freq_a["projection"].attrs.get("epsg_code", 32646))

        # --- Read backscatter layers ---
        hh_linear = freq_a["HHHH"][:]
        hv_linear = freq_a["HVHV"][:] if "HVHV" in freq_a else None
        mask = freq_a["mask"][:] if "mask" in freq_a else np.zeros_like(hh_linear, dtype=np.uint8)

        # Apply validity mask
        valid_hh = np.where(mask == 0, hh_linear, np.nan)
        valid_hh = np.where(valid_hh > 1e-7, valid_hh, 1e-7)
        hh_db = 10.0 * np.log10(valid_hh)

        if hv_linear is not None:
            valid_hv = np.where(mask == 0, hv_linear, np.nan)
            valid_hv = np.where(valid_hv > 1e-7, valid_hv, 1e-7)
            hv_db = 10.0 * np.log10(valid_hv)
        else:
            hv_db = None

    # --- Generate Multi-Panel Visualization PNG ---
    print("  Generating visualization panels...")

    ext_km = [
        np.min(x_coords) / 1000.0, np.max(x_coords) / 1000.0,
        np.min(y_coords) / 1000.0, np.max(y_coords) / 1000.0
    ]

    n_panels = 3 if hv_db is not None else 2
    fig, axes = plt.subplots(1, n_panels, figsize=(6 * n_panels, 6), dpi=150)
    if n_panels == 2:
        axes = list(axes)

    # Panel 1: HH Backscatter (grayscale)
    p1, p99 = np.nanpercentile(hh_db, 1), np.nanpercentile(hh_db, 99)
    im0 = axes[0].imshow(hh_db, cmap="gray", vmin=p1, vmax=p99, extent=ext_km)
    axes[0].set_title(f"Co-Pol HH Backscatter (dB)\n{ident_attrs.get('acquisition_date', 'Unknown Date')}", fontsize=10, fontweight="bold")
    axes[0].set_xlabel("UTM Easting (km)")
    axes[0].set_ylabel("UTM Northing (km)")
    fig.colorbar(im0, ax=axes[0], fraction=0.046, pad=0.04).set_label("Gamma-0 (dB)")

    # Panel 2: HH with water classification overlay
    water_mask = hh_db < -18.0
    classification = np.zeros_like(hh_db, dtype=np.uint8)
    classification[water_mask] = 1
    classification[(hh_db >= -18.0) & (hh_db < -13.0)] = 2
    classification[(hh_db >= -13.0)] = 3

    cmap_class = ListedColormap(["#0284c7", "#f59e0b", "#10b981"])
    im1 = axes[1].imshow(classification, cmap=cmap_class, vmin=1, vmax=3, extent=ext_km)
    axes[1].set_title("Surface Classification\n(Water / Wet Soil / Dry Land)", fontsize=10, fontweight="bold")
    axes[1].set_xlabel("UTM Easting (km)")
    legend_patches = [
        mpatches.Patch(color="#0284c7", label="Water (< -18 dB)"),
        mpatches.Patch(color="#f59e0b", label="Wet Soil (-18 to -13 dB)"),
        mpatches.Patch(color="#10b981", label="Dry Land (> -13 dB)")
    ]
    axes[1].legend(handles=legend_patches, loc="lower right", fontsize=7)

    # Panel 3: Cross-Pol HV (if available)
    if hv_db is not None:
        pv1, pv99 = np.nanpercentile(hv_db, 1), np.nanpercentile(hv_db, 99)
        im2 = axes[2].imshow(hv_db, cmap="inferno", vmin=pv1, vmax=pv99, extent=ext_km)
        axes[2].set_title("Cross-Pol HV Backscatter (dB)\n(Vegetation Volume Scattering)", fontsize=10, fontweight="bold")
        axes[2].set_xlabel("UTM Easting (km)")
        fig.colorbar(im2, ax=axes[2], fraction=0.046, pad=0.04).set_label("Gamma-0 HV (dB)")

    plt.suptitle(
        f"NISAR S-band Level 2 GCOV | {instrument} | Track 019 / Frame 075\n"
        f"File: {os.path.basename(h5_path)}",
        fontsize=12, fontweight="bold", y=1.02
    )
    plt.tight_layout()

    png_path = os.path.join(output_dir, f"{basename}_preview.png")
    fig.savefig(png_path, bbox_inches="tight")
    plt.close(fig)
    print(f"  Saved PNG preview: {png_path}")

    # --- Generate Histogram ---
    fig_hist, (ax_hh, ax_hv) = plt.subplots(1, 2, figsize=(12, 4), dpi=150)
    valid_hh_vals = hh_db[np.isfinite(hh_db)]
    ax_hh.hist(valid_hh_vals, bins=80, color="#64748b", edgecolor="#334155", alpha=0.8)
    ax_hh.axvline(-18.0, color="red", linestyle="--", label="Water threshold (-18 dB)")
    ax_hh.set_title("HH Backscatter Distribution", fontweight="bold")
    ax_hh.set_xlabel("Gamma-0 (dB)")
    ax_hh.set_ylabel("Pixel Count")
    ax_hh.legend(fontsize=8)

    if hv_db is not None:
        valid_hv_vals = hv_db[np.isfinite(hv_db)]
        ax_hv.hist(valid_hv_vals, bins=80, color="#f97316", edgecolor="#c2410c", alpha=0.8)
        ax_hv.set_title("HV Backscatter Distribution", fontweight="bold")
        ax_hv.set_xlabel("Gamma-0 (dB)")
        ax_hv.set_ylabel("Pixel Count")
    else:
        ax_hv.text(0.5, 0.5, "HV not available", ha="center", va="center", transform=ax_hv.transAxes)

    plt.tight_layout()
    hist_path = os.path.join(output_dir, f"{basename}_histogram.png")
    fig_hist.savefig(hist_path, bbox_inches="tight")
    plt.close(fig_hist)
    print(f"  Saved histogram: {hist_path}")

    # --- Generate HTML Report ---
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>NISAR HDF5 Viewer — {os.path.basename(h5_path)}</title>
<style>
  body {{ font-family: 'Segoe UI', Tahoma, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 20px; }}
  .container {{ max-width: 1200px; margin: 0 auto; }}
  h1 {{ color: #38bdf8; border-bottom: 2px solid #1e3a5f; padding-bottom: 10px; }}
  h2 {{ color: #7dd3fc; margin-top: 30px; }}
  .card {{ background: #1e293b; border-radius: 12px; padding: 20px; margin: 15px 0; border: 1px solid #334155; }}
  .card h3 {{ color: #38bdf8; margin-top: 0; }}
  table {{ width: 100%; border-collapse: collapse; }}
  th, td {{ padding: 8px 12px; text-align: left; border-bottom: 1px solid #334155; }}
  th {{ color: #7dd3fc; font-weight: 600; }}
  td {{ color: #cbd5e1; font-family: 'Cascadia Code', monospace; font-size: 13px; }}
  .tree {{ background: #0f172a; padding: 15px; border-radius: 8px; font-family: 'Cascadia Code', monospace; font-size: 12px; line-height: 1.6; overflow-x: auto; }}
  .tree .group {{ color: #fbbf24; }}
  .tree .dataset {{ color: #34d399; }}
  img {{ max-width: 100%; border-radius: 8px; margin: 10px 0; }}
  .stat {{ display: inline-block; background: #334155; padding: 8px 16px; border-radius: 8px; margin: 5px; }}
  .stat .value {{ color: #38bdf8; font-size: 18px; font-weight: bold; }}
  .stat .label {{ color: #94a3b8; font-size: 12px; }}
  .badge {{ display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }}
  .badge-blue {{ background: #1e40af; color: #93c5fd; }}
  .badge-green {{ background: #065f46; color: #6ee7b7; }}
</style>
</head>
<body>
<div class="container">
  <h1>NISAR HDF5 Data Viewer</h1>
  <p style="color:#94a3b8">Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | File: <code>{os.path.basename(h5_path)}</code> ({os.path.getsize(h5_path)/1024:.1f} KB)</p>

  <div class="card">
    <h3>Product Identification</h3>
    <div>
      <div class="stat"><div class="label">Instrument</div><div class="value">{instrument}</div></div>
      <div class="stat"><div class="label">Acquisition Date</div><div class="value">{ident_attrs.get('acquisition_date', 'N/A')}</div></div>
      <div class="stat"><div class="label">Cycle</div><div class="value">{ident_attrs.get('cycle_number', 'N/A')}</div></div>
      <div class="stat"><div class="label">Track / Frame</div><div class="value">{ident_attrs.get('track_number', '019')} / {ident_attrs.get('frame_number', '075')}</div></div>
      <div class="stat"><div class="label">Pass Direction</div><div class="value">{ident_attrs.get('pass_direction', 'Descending')}</div></div>
      <div class="stat"><div class="label">CRS</div><div class="value">EPSG:{epsg}</div></div>
    </div>
  </div>

  <div class="card">
    <h3>Backscatter Statistics</h3>
    <div>
      <div class="stat"><div class="label">HH Min (dB)</div><div class="value">{np.nanmin(hh_db):.2f}</div></div>
      <div class="stat"><div class="label">HH Max (dB)</div><div class="value">{np.nanmax(hh_db):.2f}</div></div>
      <div class="stat"><div class="label">HH Mean (dB)</div><div class="value">{np.nanmean(hh_db):.2f}</div></div>
      <div class="stat"><div class="label">HH Std Dev</div><div class="value">{np.nanstd(hh_db):.2f}</div></div>
      <div class="stat"><div class="label">Dimensions</div><div class="value">{hh_db.shape[0]} x {hh_db.shape[1]}</div></div>
      <div class="stat"><div class="label">Water Pixels</div><div class="value">{int(np.sum(hh_db < -18.0))}</div></div>
    </div>
  </div>

  <h2>Radar Backscatter Visualization</h2>
  <img src="{os.path.basename(png_path)}" alt="NISAR Radar Preview">

  <h2>Backscatter Histograms</h2>
  <img src="{os.path.basename(hist_path)}" alt="Backscatter Histogram">

  <div class="card">
    <h3>HDF5 File Tree Structure</h3>
    <div class="tree">
      <div class="group">/ (Root)</div>
"""

    for line in tree_lines:
        css_class = "dataset" if "[Dataset]" in line else "group"
        html_content += f'      <div class="{css_class}">{line}</div>\n'

    html_content += """    </div>
  </div>

  <div class="card">
    <h3>Root Attributes</h3>
    <table>
      <tr><th>Attribute</th><th>Value</th></tr>
"""
    for k, v in root_attrs.items():
        html_content += f"      <tr><td>{k}</td><td>{v}</td></tr>\n"

    html_content += """    </table>
  </div>

  <div class="card">
    <h3>Dataset Details</h3>
    <table>
      <tr><th>Path</th><th>Shape</th><th>Dtype</th><th>Attributes</th></tr>
"""
    for ds in datasets_info:
        attrs_str = ", ".join(f"{k}={v}" for k, v in ds["attrs"].items()) if ds["attrs"] else "-"
        html_content += f'      <tr><td>{ds["path"]}</td><td>{ds["shape"]}</td><td>{ds["dtype"]}</td><td>{attrs_str}</td></tr>\n'

    html_content += """    </table>
  </div>

  <div class="card" style="border-color: #f59e0b;">
    <h3 style="color: #fbbf24;">Important: Data Provenance Notice</h3>
    <p>This HDF5 file is a <strong>locally generated reference product</strong> following the correct NISAR Level 2 GCOV CF-1.8 schema.
    It contains <strong>calibrated simulated backscatter</strong> based on empirical SAR physics models for the Brahmaputra Basin,
    not raw downloaded NISAR observations from ISRO Bhoonidhi or NASA Earthdata.</p>
    <p>Real NISAR data requires authentication with ISRO Bhoonidhi or NASA Earthdata Login.</p>
  </div>
</div>
</body>
</html>"""

    html_path = os.path.join(output_dir, f"{basename}_report.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"  Saved HTML report: {html_path}")

    return png_path, hist_path, html_path


# =============================================================================
# GeoTIFF VIEWER — Converts .tif to viewable PNG
# =============================================================================

def view_tif_file(tif_path: str, output_dir: str = OUTPUT_DIR):
    """Convert a GeoTIFF to a viewable PNG with metadata overlay."""
    os.makedirs(output_dir, exist_ok=True)
    basename = os.path.splitext(os.path.basename(tif_path))[0]

    print(f"\n{'='*70}")
    print(f"  GeoTIFF VIEWER: {os.path.basename(tif_path)}")
    print(f"{'='*70}")

    if HAS_RASTERIO:
        with rasterio.open(tif_path) as src:
            data = src.read(1)
            nodata = src.nodata
            crs = str(src.crs)
            transform = src.transform
            bounds = src.bounds
            width = src.width
            height = src.height
            dtype = str(src.dtypes[0])
            band_desc = src.descriptions[0] if src.descriptions[0] else "Band 1"

        # Mask nodata values
        if nodata is not None:
            data = np.where(data == nodata, np.nan, data)

        print(f"  CRS: {crs}")
        print(f"  Bounds: ({bounds.left:.1f}, {bounds.bottom:.1f}) to ({bounds.right:.1f}, {bounds.top:.1f})")
        print(f"  Size: {width} x {height}")
        print(f"  Dtype: {dtype}")
        print(f"  NoData: {nodata}")
    else:
        print("  WARNING: rasterio not available, trying raw numpy load...")
        # Fallback: try to read with h5py or numpy (won't work well for GeoTIFF)
        print("  Cannot read GeoTIFF without rasterio. Please install: pip install rasterio")
        return None

    # Determine if this is a classification (uint8) or continuous (float) raster
    is_classification = dtype in ["uint8", "int8", "uint16", "int16"] and np.nanmax(data) <= 10

    fig, ax = plt.subplots(figsize=(10, 8), dpi=150)

    ext = [bounds.left / 1000.0, bounds.right / 1000.0, bounds.bottom / 1000.0, bounds.top / 1000.0]

    if is_classification:
        # Discrete classification map
        unique_vals = np.unique(data[np.isfinite(data)]).astype(int)
        class_labels = {
            0: ("Stable Dry Land", "#262626"),
            1: ("Permanent Water", "#0284c7"),
            2: ("Newly Inundated", "#f43f5e"),
            3: ("Marginal/Saturated", "#f59e0b"),
            4: ("Flooded Vegetation", "#10b981"),
            5: ("Receded Water", "#8b5cf6")
        }
        colors = [class_labels.get(v, (f"Class {v}", "#666666"))[1] for v in range(max(unique_vals) + 1)]
        cmap = ListedColormap(colors)
        im = ax.imshow(data, cmap=cmap, vmin=0, vmax=max(unique_vals), extent=ext)
        legend_patches = [
            mpatches.Patch(color=class_labels.get(v, (f"Class {v}", "#666"))[1],
                          label=class_labels.get(v, (f"Class {v}", "#666"))[0])
            for v in unique_vals
        ]
        ax.legend(handles=legend_patches, loc="lower right", fontsize=8)
        ax.set_title(f"Flood Classification Map\n{band_desc}", fontsize=12, fontweight="bold")
    else:
        # Continuous raster (backscatter dB)
        p1, p99 = np.nanpercentile(data, 1), np.nanpercentile(data, 99)
        im = ax.imshow(data, cmap="gray", vmin=p1, vmax=p99, extent=ext)
        cbar = fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
        cbar.set_label("Value (dB)" if "dB" in band_desc or "Gamma" in band_desc else "Value", fontsize=10)
        ax.set_title(f"GeoTIFF Visualization\n{band_desc}", fontsize=12, fontweight="bold")

    ax.set_xlabel("UTM Easting (km)")
    ax.set_ylabel("UTM Northing (km)")

    # Add metadata text box
    meta_text = (
        f"CRS: {crs}\n"
        f"Size: {width} x {height} px\n"
        f"Bounds: [{bounds.left:.0f}, {bounds.bottom:.0f}] to [{bounds.right:.0f}, {bounds.top:.0f}]\n"
        f"Value range: [{np.nanmin(data):.2f}, {np.nanmax(data):.2f}]"
    )
    ax.text(0.02, 0.98, meta_text, transform=ax.transAxes, fontsize=7,
            va="top", color="white",
            bbox=dict(boxstyle="round,pad=0.4", facecolor="black", alpha=0.7, edgecolor="gray"))

    plt.tight_layout()
    png_path = os.path.join(output_dir, f"{basename}_preview.png")
    fig.savefig(png_path, bbox_inches="tight")
    plt.close(fig)
    print(f"  Saved PNG preview: {png_path}")

    return png_path


# =============================================================================
# MAIN: Auto-detect and view all data files
# =============================================================================

def main():
    """Main entry point: view all or specific data files."""

    if len(sys.argv) > 1:
        # View specific file
        filepath = sys.argv[1]
        if filepath.endswith(".h5"):
            view_h5_file(filepath)
        elif filepath.endswith((".tif", ".tiff")):
            view_tif_file(filepath)
        else:
            print(f"Unsupported file type: {filepath}")
        return

    # Auto-discover and view all files
    print("\n" + "=" * 70)
    print("  NISAR DATA VIEWER — Brahmaputra FloodWatch")
    print("  Converting all .h5 and .tif files to viewable PNGs")
    print("=" * 70)

    # Find all HDF5 files
    h5_dir = os.path.join("data", "nisar_products")
    if os.path.isdir(h5_dir):
        h5_files = [os.path.join(h5_dir, f) for f in os.listdir(h5_dir) if f.endswith(".h5")]
        for h5f in sorted(h5_files):
            try:
                view_h5_file(h5f)
            except Exception as e:
                print(f"  ERROR viewing {h5f}: {e}")

    # Find all GeoTIFF files
    tif_dir = os.path.join("data", "output")
    if os.path.isdir(tif_dir):
        tif_files = [os.path.join(tif_dir, f) for f in os.listdir(tif_dir) if f.endswith((".tif", ".tiff"))]
        for tif_f in sorted(tif_files):
            try:
                view_tif_file(tif_f)
            except Exception as e:
                print(f"  ERROR viewing {tif_f}: {e}")

    # Summary
    viewer_dir = os.path.abspath(OUTPUT_DIR)
    if os.path.isdir(viewer_dir):
        viewer_files = os.listdir(viewer_dir)
        png_count = sum(1 for f in viewer_files if f.endswith(".png"))
        html_count = sum(1 for f in viewer_files if f.endswith(".html"))
        print(f"\n{'='*70}")
        print(f"  VIEWER COMPLETE!")
        print(f"  Generated {png_count} PNG previews and {html_count} HTML reports")
        print(f"  Output directory: {viewer_dir}")
        print(f"{'='*70}")


if __name__ == "__main__":
    main()

