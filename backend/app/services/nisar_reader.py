"""
NISAR Level-2 GCOV (Geocoded Polarimetric Covariance) Data Ingestion & Reader Module.
Implements NASA JPL / ISRO SAC HDF5 specifications for S-band and L-band SAR products.
"""

import os
import h5py
import numpy as np
from typing import Dict, Any, Tuple, Optional, List
from ..core.config import settings
from .sar_processing import linear_to_db, generate_calibrated_sar_grid

class NISARGCOVReader:
    """
    Standard reader for NISAR Level 2 GCOV (Geocoded Polarimetric Covariance) HDF5 files.
    Navigates CF-compliant HDF5 groups:
    /science/SSAR/GCOV/grids/frequencyA/ (or LSAR)
    """

    @staticmethod
    def inspect_hdf5_structure(filepath: str) -> Dict[str, Any]:
        """
        Inspects an actual NISAR HDF5 file, reporting available frequencies,
        polarization datasets, dimensions, projection, and metadata.
        """
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"NISAR product not found at path: {filepath}")

        with h5py.File(filepath, "r") as h5:
            # Determine instrument group: SSAR (ISRO S-band) or LSAR (NASA L-band)
            science_grp = h5.get("science")
            if science_grp is None:
                raise ValueError("Invalid NISAR format: Root '/science' group missing.")

            instrument = "SSAR" if "SSAR" in science_grp else "LSAR"
            gcov_grp = science_grp[instrument].get("GCOV")
            if gcov_grp is None:
                raise ValueError(f"Invalid NISAR product: '/science/{instrument}/GCOV' missing.")

            grids_grp = gcov_grp.get("grids")
            freq_names = list(grids_grp.keys()) if grids_grp else []

            bands_info = {}
            for freq in freq_names:
                freq_grp = grids_grp[freq]
                bands_info[freq] = []
                for key in freq_grp.keys():
                    item = freq_grp[key]
                    if isinstance(item, h5py.Dataset):
                        bands_info[freq].append({
                            "name": key,
                            "shape": list(item.shape),
                            "dtype": str(item.dtype),
                            "units": item.attrs.get("units", "linear power (gamma-0)")
                        })

            # Check projection metadata
            epsg_code = 32646  # Default UTM 46N for Assam
            if "frequencyA" in grids_grp and "projection" in grids_grp["frequencyA"]:
                proj_ds = grids_grp["frequencyA"]["projection"]
                epsg_code = int(proj_ds.attrs.get("epsg_code", 32646))

            # Read granule identification if present
            ident_grp = gcov_grp.get("identification", {})
            granule_id = ident_grp.attrs.get("granule_id", os.path.basename(filepath))

            return {
                "filepath": filepath,
                "file_size_mb": round(os.path.getsize(filepath) / (1024 * 1024), 2),
                "instrument": instrument,
                "product_type": "L2_GCOV (Geocoded Polarimetric Covariance)",
                "granule_id": str(granule_id),
                "frequencies": freq_names,
                "bands": bands_info,
                "epsg_code": epsg_code,
                "projection": f"EPSG:{epsg_code} (WGS84 / UTM Zone 46N)"
            }

    @staticmethod
    def read_calibrated_backscatter(
        filepath: str,
        frequency: str = "frequencyA",
        polarization: str = "HHHH",
        convert_to_db: bool = True
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Reads linear backscatter (gamma-0) array from the HDF5 container,
        verifies quality flags via the mask dataset, and converts to decibels (dB).
        """
        with h5py.File(filepath, "r") as h5:
            science_grp = h5["science"]
            instrument = "SSAR" if "SSAR" in science_grp else "LSAR"
            grid_grp = science_grp[instrument]["GCOV"]["grids"][frequency]

            if polarization not in grid_grp:
                available = list(grid_grp.keys())
                raise KeyError(f"Polarization '{polarization}' not found in {frequency}. Available: {available}")

            # Read linear radar backscatter
            linear_data = grid_grp[polarization][:]

            # Read spatial coordinates
            x_coords = grid_grp["xCoordinates"][:] if "xCoordinates" in grid_grp else None
            y_coords = grid_grp["yCoordinates"][:] if "yCoordinates" in grid_grp else None
            mask = grid_grp["mask"][:] if "mask" in grid_grp else None

            # Apply validity mask if present (0 = valid pixel)
            if mask is not None:
                linear_data = np.where(mask == 0, linear_data, np.nan)

            output_data = linear_to_db(linear_data) if convert_to_db else linear_data

            metadata = {
                "instrument": instrument,
                "frequency": frequency,
                "polarization": polarization,
                "shape": list(output_data.shape),
                "units": "decibels (dB)" if convert_to_db else "linear gamma-0",
                "x_min": float(np.min(x_coords)) if x_coords is not None else None,
                "x_max": float(np.max(x_coords)) if x_coords is not None else None,
                "y_min": float(np.min(y_coords)) if y_coords is not None else None,
                "y_max": float(np.max(y_coords)) if y_coords is not None else None,
            }

            return output_data, metadata

    @staticmethod
    def generate_reference_h5_product(
        filepath: str,
        granule_id: str,
        region_id: str,
        date_str: str,
        dim: int = 120
    ) -> str:
        """
        Creates a compliant reference NISAR Level 2 GCOV HDF5 product file on disk.
        Conforms strictly to the CF-compliant schema:
        /science/SSAR/GCOV/grids/frequencyA/{HHHH, HVHV, mask, projection, xCoordinates, yCoordinates}
        Used for local processing, validation, and offline development.
        """
        os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
        
        # Generate empirical SAR calibrated grids
        grid_dict = generate_calibrated_sar_grid(region_id, date_str, grid_dim=dim)
        hh_db = np.array(grid_dict["hh_db"], dtype=np.float32)
        hv_db = np.array(grid_dict["hv_db"], dtype=np.float32)
        
        # Convert dB back to linear power for standard HDF5 storage
        hh_linear = 10.0 ** (hh_db / 10.0)
        hv_linear = 10.0 ** (hv_db / 10.0)
        
        # Create standard spatial coordinates (UTM Zone 46N, 25m posting)
        # Centered roughly on Central Assam (easting 320,000m, northing 2,940,000m)
        x_coords = np.linspace(310000.0, 310000.0 + (dim * 25.0), dim, dtype=np.float64)
        y_coords = np.linspace(2950000.0, 2950000.0 - (dim * 25.0), dim, dtype=np.float64)
        validity_mask = np.zeros((dim, dim), dtype=np.uint8)  # 0 = Valid observation

        with h5py.File(filepath, "w") as h5:
            # CF Conventions metadata
            h5.attrs["Conventions"] = "CF-1.8"
            h5.attrs["title"] = "NISAR Level 2 Geocoded Polarimetric Covariance (GCOV)"
            h5.attrs["institution"] = "NASA JPL / ISRO SAC"
            h5.attrs["mission_name"] = "NISAR"

            # Create group hierarchy
            gcov_grp = h5.create_group("science/SSAR/GCOV")
            
            # Identification group
            ident = gcov_grp.create_group("identification")
            ident.attrs["granule_id"] = granule_id
            ident.attrs["track_number"] = 19
            ident.attrs["frame_number"] = 75
            ident.attrs["cycle_number"] = int(granule_id.split("_")[4]) if len(granule_id.split("_")) > 4 else 25
            ident.attrs["look_direction"] = "Right"
            ident.attrs["pass_direction"] = "Descending"
            ident.attrs["acquisition_date"] = date_str

            # Grids / frequencyA
            freq_a = gcov_grp.create_group("grids/frequencyA")
            
            # Datasets
            ds_hh = freq_a.create_dataset("HHHH", data=hh_linear, compression="gzip", compression_opts=4)
            ds_hh.attrs["units"] = "1"
            ds_hh.attrs["long_name"] = "Co-polarized HH gamma-0 backscatter power"

            ds_hv = freq_a.create_dataset("HVHV", data=hv_linear, compression="gzip", compression_opts=4)
            ds_hv.attrs["units"] = "1"
            ds_hv.attrs["long_name"] = "Cross-polarized HV gamma-0 backscatter power"

            ds_mask = freq_a.create_dataset("mask", data=validity_mask, compression="gzip")
            ds_mask.attrs["long_name"] = "Data validity / shadow mask"

            freq_a.create_dataset("xCoordinates", data=x_coords)
            freq_a.create_dataset("yCoordinates", data=y_coords)

            # Spatial Reference
            proj = freq_a.create_dataset("projection", data=np.array([32646], dtype=np.int32))
            proj.attrs["epsg_code"] = 32646
            proj.attrs["spatial_ref"] = "WGS 84 / UTM zone 46N"

        return filepath

