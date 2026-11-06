"""
Create and Visualize Custom NISAR Observation Timeline Products
NASA Space Apps Challenge 2026 — Brahmaputra FloodWatch

Allows generating and visualizing a NISAR Level 2 GCOV product for ANY custom date,
orbital cycle, or region along the Brahmaputra corridor.

Usage:
    # 1. Generate a new observation product for any date:
    python new_timeline_product.py --date 2026-08-26 --cycle 029 --region kaziranga

    # 2. Automatically generate + visualize immediately:
    python new_timeline_product.py --date 2026-08-26 --view
"""

import os
import sys
import argparse
from datetime import datetime

# Configure UTF-8 stdout
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from backend.app.services.nisar_reader import NISARGCOVReader
from view_nisar_data import view_h5_file

def create_and_view(date_str: str, cycle_num: int = 29, region_id: str = "kaziranga", auto_view: bool = True):
    cycle_str = f"{cycle_num:03d}"
    date_clean = date_str.replace("-", "")
    granule_id = f"NISAR_S2_PR_GCOV_{cycle_str}_019_D_075_2500_CRNA_A_{date_clean}T124208_{date_clean}T124245_P00500_M_F_I_001"
    
    output_path = os.path.join("data", "nisar_products", f"{granule_id}.h5")
    
    print("=" * 75)
    print(f"GENERATING CUSTOM NISAR TIMELINE PRODUCT")
    print(f"Date:   {date_str} (Cycle {cycle_str})")
    print(f"Region: {region_id}")
    print(f"Output: {output_path}")
    print("=" * 75)

    NISARGCOVReader.generate_reference_h5_product(
        filepath=output_path,
        granule_id=granule_id,
        region_id=region_id,
        date_str=date_str,
        dim=120
    )
    print(f"\nSuccessfully generated HDF5 product: {output_path}")

    if auto_view:
        print("\nGenerating visualization previews & HTML report...")
        png_p, hist_p, html_p = view_h5_file(output_path)
        print("\n" + "=" * 75)
        print("VIEW YOUR NEW TIMELINE PRODUCT:")
        print(f"  - Radar PNG Preview: {png_p}")
        print(f"  - Histogram PNG:     {hist_p}")
        print(f"  - HTML Report:       {html_p}")
        print("=" * 75)

    return output_path

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate and inspect custom NISAR products.")
    parser.add_argument("--date", type=str, default="2026-08-26", help="Acquisition date (YYYY-MM-DD)")
    parser.add_argument("--cycle", type=int, default=29, help="NISAR orbital cycle number (e.g. 29)")
    parser.add_argument("--region", type=str, default="kaziranga", choices=["kaziranga", "tezpur", "majuli", "guwahati"], help="Brahmaputra study region")
    parser.add_argument("--view", action="store_true", default=True, help="Automatically render visual previews and HTML report")

    args = parser.parse_args()
    create_and_view(date_str=args.date, cycle_num=args.cycle, region_id=args.region, auto_view=args.view)
