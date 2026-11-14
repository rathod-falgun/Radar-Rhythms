"""
Detailed metadata audit script for Barpeta NISAR Level-2 GCOV files.
"""
import glob
import json
import os
import h5py
import numpy as np

files = sorted(glob.glob("data/nisar_products/*.h5"))

audit_records = []

for fpath in files:
    fn = os.path.basename(fpath)
    record = {
        "filename": fn,
        "file_size_bytes": os.path.getsize(fpath),
        "file_readable": True
    }
    try:
        with h5py.File(fpath, "r") as h:
            record["root_attrs"] = {k: str(v) for k, v in h.attrs.items()}
            
            # Groups and datasets
            groups_dict = {}
            datasets_dict = {}
            
            def visitor(name, obj):
                if isinstance(obj, h5py.Dataset):
                    datasets_dict[name] = {
                        "shape": list(obj.shape),
                        "dtype": str(obj.dtype),
                        "attrs": {k: str(v) for k, v in obj.attrs.items()}
                    }
                elif isinstance(obj, h5py.Group):
                    groups_dict[name] = {
                        "attrs": {k: str(v) for k, v in obj.attrs.items()}
                    }
            h.visititems(visitor)
            
            record["groups"] = groups_dict
            record["datasets"] = datasets_dict
            
            # Check frequencyA specifically
            fa = h.get("science/SSAR/GCOV/grids/frequencyA")
            if fa:
                x = fa.get("xCoordinates")[:]
                y = fa.get("yCoordinates")[:]
                record["x_coords"] = {
                    "min": float(x[0]),
                    "max": float(x[-1]),
                    "step": float(x[1] - x[0]) if len(x) > 1 else None,
                    "length": len(x)
                }
                record["y_coords"] = {
                    "min": float(y[-1]),
                    "max": float(y[0]),
                    "step": float(y[1] - y[0]) if len(y) > 1 else None,
                    "length": len(y)
                }
                
                # Check mask values
                mask = fa.get("mask")[:]
                unique_mask, counts_mask = np.unique(mask, return_counts=True)
                record["mask_distribution"] = {
                    int(val): int(cnt) for val, cnt in zip(unique_mask, counts_mask)
                }
                record["mask_attrs"] = {k: str(v) for k, v in fa.get("mask").attrs.items()}
                
                # Check HHHH stats
                hh = fa.get("HHHH")[:]
                record["hh_raw_stats"] = {
                    "min": float(np.min(hh)),
                    "max": float(np.max(hh)),
                    "mean": float(np.mean(hh)),
                    "nan_count": int(np.isnan(hh).sum()),
                    "inf_count": int(np.isinf(hh).sum()),
                    "zero_count": int((hh == 0).sum()),
                    "negative_count": int((hh < 0).sum()),
                    "finite_count": int(np.isfinite(hh).sum()),
                    "total_elements": int(hh.size)
                }
                record["hh_attrs"] = {k: str(v) for k, v in fa.get("HHHH").attrs.items()}
                
                # Check HVHV stats
                if "HVHV" in fa:
                    hv = fa.get("HVHV")[:]
                    record["hv_raw_stats"] = {
                        "min": float(np.min(hv)),
                        "max": float(np.max(hv)),
                        "mean": float(np.mean(hv)),
                        "nan_count": int(np.isnan(hv).sum()),
                        "inf_count": int(np.isinf(hv).sum()),
                        "zero_count": int((hv == 0).sum()),
                        "negative_count": int((hv < 0).sum()),
                        "finite_count": int(np.isfinite(hv).sum())
                    }
                    record["hv_attrs"] = {k: str(v) for k, v in fa.get("HVHV").attrs.items()}
                
                # Projection
                if "projection" in fa:
                    record["projection_attrs"] = {k: str(v) for k, v in fa.get("projection").attrs.items()}
            
            # Identification group
            ident = h.get("science/SSAR/GCOV/identification")
            if ident:
                record["identification"] = {k: str(v) for k, v in ident.attrs.items()}
                
    except Exception as e:
        record["file_readable"] = False
        record["error"] = str(e)
        
    audit_records.append(record)

with open("data/experimental/multidate_nisar/barpeta/source_metadata/metadata_audit_raw.json", "w") as f:
    json.dump(audit_records, f, indent=2)

print(f"Audit completed for {len(audit_records)} files.")
for r in audit_records:
    ident = r.get("identification", {})
    hh = r.get("hh_raw_stats", {})
    m = r.get("mask_distribution", {})
    print(f"Cycle {ident.get('cycle_number')}: Date={ident.get('acquisition_date')} | Granule={ident.get('granule_id')[:35]}... | Mask={m} | HH min={hh.get('min'):.4f}, max={hh.get('max'):.4f}, NaN={hh.get('nan_count')}, Neg={hh.get('negative_count')}")

