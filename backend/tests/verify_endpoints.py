import requests, json, time, os, tempfile

BASE = "http://127.0.0.1:8000"

results = []

def test(method, path, params=None, json_body=None, label=None):
    url = BASE + path
    try:
        r = requests.request(method, url, params=params, json=json_body, timeout=30)
        ct = r.headers.get("content-type","?")
        size = len(r.content)
        snippet = r.text[:200] if ("json" in ct or "text" in ct or "csv" in ct) else f"<binary {size} bytes>"
        results.append({"label": label or path, "status": r.status_code, "ct": ct, "size": size, "ok": 200<=r.status_code<400, "snippet": snippet, "content": r.content})
    except Exception as e:
        results.append({"label": label or path, "status": "ERROR", "ct": "", "size": 0, "ok": False, "snippet": str(e), "content": b""})

test("GET", "/api/health")
test("GET", "/api/regions")
test("GET", "/api/observations", params={"region_id": "majuli"})
test("GET", "/api/sar-grid")
test("GET", "/api/compare", params={"region_id": "majuli", "baseline_date": "2026-08-27", "event_date": "2026-08-27"})
test("GET", "/api/compare", params={"region_id": "barpeta", "baseline_date": "2026-06-27", "event_date": "2026-07-09"})
test("GET", "/api/timeline-stats", params={"region_id": "majuli"})
test("GET", "/api/reaches/summary")
test("GET", "/api/nisar/status")
test("GET", "/api/nisar/inspect")
test("GET", "/api/water/majuli/summary")
test("GET", "/api/water/majuli/boundaries")  # may be large
test("GET", "/api/flood/barpeta/summary")
test("GET", "/api/flood/barpeta/boundaries")
test("GET", "/api/export/geojson", params={"region_id": "majuli"}, label="export-geojson-majuli")
test("GET", "/api/export/geojson", params={"region_id": "barpeta"}, label="export-geojson-barpeta")
test("GET", "/api/export/csv", params={"region_id": "majuli"}, label="export-csv-majuli")
test("GET", "/api/export/csv", params={"region_id": "barpeta"}, label="export-csv-barpeta")
test("GET", "/api/water/majuli/classification-raster", label="majuli-class-raster")
test("GET", "/api/water/majuli/source-raster", label="majuli-source-raster-HHHH")
test("GET", "/api/water/majuli/raster-stats", label="majuli-raster-stats")
test("GET", "/api/flood/barpeta/change-raster", label="barpeta-change-raster")
test("GET", "/api/flood/barpeta/baseline-raster", label="barpeta-baseline-raster")
test("GET", "/api/flood/barpeta/event-raster", label="barpeta-event-raster")
test("GET", "/api/flood/barpeta/raster-stats", label="barpeta-raster-stats")

# ---- Validate downloads ----
download_validations = []
tmpdir = tempfile.mkdtemp()

for r in results:
    ct = r["ct"]
    content = r["content"]
    label = r["label"]
    if not r["ok"] or not content:
        continue

    # GeoJSON
    if "geojson" in ct or "json" in ct:
        try:
            parsed = json.loads(content)
            if isinstance(parsed, dict) and "features" in parsed:
                count = len(parsed["features"])
                download_validations.append({"label": label, "type": "GeoJSON", "valid": True, "features": count})
            elif isinstance(parsed, (dict, list)):
                download_validations.append({"label": label, "type": "JSON", "valid": True, "keys": list(parsed.keys()) if isinstance(parsed, dict) else f"list[{len(parsed)}]"})
        except Exception as e:
            download_validations.append({"label": label, "type": "GeoJSON/JSON", "valid": False, "error": str(e)})
    # TIF/raster
    elif "tiff" in ct or "image" in ct or "octet" in ct or label.endswith("raster") or "raster" in label:
        magic_le = content[:4] == b"II*\x00"
        magic_be = content[:4] == b"MM\x00*"
        is_tif = magic_le or magic_be
        fp = os.path.join(tmpdir, label.replace("/","_") + ".tif")
        if content:
            with open(fp, "wb") as f:
                f.write(content)
        # Try rasterio
        rasterio_info = None
        try:
            import rasterio
            with rasterio.open(fp) as ds:
                rasterio_info = {"crs": str(ds.crs), "shape": ds.shape, "count": ds.count, "dtype": str(ds.dtypes[0])}
        except Exception as e:
            rasterio_info = f"rasterio unavailable or error: {e}"
        download_validations.append({"label": label, "type": "TIF", "valid_magic": is_tif, "size_bytes": len(content), "rasterio": rasterio_info})
    # CSV
    elif "csv" in ct or "text/plain" in ct:
        lines = content.decode(errors="replace").splitlines()
        has_header = len(lines) > 0 and "," in lines[0]
        download_validations.append({"label": label, "type": "CSV", "valid": has_header, "rows": len(lines), "header": lines[0][:120] if lines else ""})

# ---- Print results ----
printable = [{k: v for k, v in r.items() if k != "content"} for r in results]
print(json.dumps(printable, indent=2))
print(f"\nPassed: {sum(1 for r in results if r['ok'])} / {len(results)}")
print("\n--- Download Validations ---")
print(json.dumps(download_validations, indent=2))
