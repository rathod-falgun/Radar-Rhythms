"""
NASA Earthdata Common Metadata Repository (CMR) Search Service
NASA Space Apps Challenge 2026 — Brahmaputra FloodWatch

Provides open, unauthenticated scene discovery and metadata retrieval for official
NISAR Level-2 GCOV (Geocoded Polarimetric Covariance) data products via NASA CMR.
API Documentation: https://cmr.earthdata.nasa.gov/search/site/docs/search/api.html
"""

import logging
import requests
from typing import Dict, Any, Optional, List

logger = logging.getLogger("cmr_service")

CMR_SEARCH_URL = "https://cmr.earthdata.nasa.gov/search/granules.json"
DEFAULT_NISAR_COLLECTION = "NISAR_L2_GCOV_PROVISIONAL_V1"


class CMREarthdataService:
    """
    Client for NASA's open Earthdata CMR Granule Search API.
    Does not require user credentials or API tokens for public granule discovery.
    """

    def __init__(self, timeout: int = 15):
        self.base_url = CMR_SEARCH_URL
        self.timeout = timeout

    def get_status(self) -> Dict[str, Any]:
        """Returns safe status report for NASA CMR integration."""
        return {
            "service": "NASA Earthdata CMR Search API",
            "provider": "NASA EOSDIS / Alaska Satellite Facility (ASF)",
            "base_url": "https://cmr.earthdata.nasa.gov",
            "auth_required": False,
            "free_public_access": True,
            "target_collection": DEFAULT_NISAR_COLLECTION,
            "status": "available",
        }

    def search_granules(
        self,
        bbox: Optional[List[float]] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        short_name: Optional[str] = None,
        limit: int = 50,
    ) -> Dict[str, Any]:
        """
        Queries NASA CMR for NISAR GCOV granules matching the specified criteria.
        Returns normalized GeoJSON FeatureCollection compatible with the frontend STAC viewer.
        """
        collection = short_name or DEFAULT_NISAR_COLLECTION
        params: Dict[str, Any] = {
            "short_name": collection,
            "page_size": min(max(1, limit), 200),
            "sort_key[]": "-start_date",
        }

        # Spatial filter: [west, south, east, north] -> lower-left lon, lower-left lat, upper-right lon, upper-right lat
        if bbox and len(bbox) >= 4:
            west, south, east, north = bbox[0], bbox[1], bbox[2], bbox[3]
            params["bounding_box"] = f"{west},{south},{east},{north}"

        # Temporal filter: start_date,end_date (ISO 8601)
        if start_date and end_date:
            params["temporal"] = f"{start_date},{end_date}"
        elif start_date:
            params["temporal"] = f"{start_date},"
        elif end_date:
            params["temporal"] = f",{end_date}"

        try:
            resp = requests.get(
                self.base_url,
                params=params,
                timeout=self.timeout,
                headers={"Accept": "application/json", "User-Agent": "BrahmaputraFloodWatch/1.0.0"}
            )
            if resp.status_code != 200:
                logger.warning(f"CMR search returned HTTP {resp.status_code}: {resp.text[:200]}")
                return {
                    "type": "FeatureCollection",
                    "provider": "NASA Earthdata CMR",
                    "total_scenes": 0,
                    "message": f"NASA CMR returned HTTP {resp.status_code}.",
                    "features": [],
                    "scenes": [],
                }

            data = resp.json()
            entries = data.get("feed", {}).get("entry", [])

            features = []
            scenes = []
            for entry in entries:
                title = entry.get("title", "")
                size_mb = round(float(entry.get("granule_size", 0.0)), 2)
                t_start = entry.get("time_start", "")
                t_end = entry.get("time_end", "")

                # Extract download links and S3 bucket URIs
                download_url = None
                s3_uri = None
                links = entry.get("links", [])
                for link in links:
                    href = link.get("href", "")
                    if href.startswith("s3://"):
                        s3_uri = href
                    elif href.endswith(".h5") or "download" in href.lower() or "earthdatacloud" in href.lower():
                        if not download_url:
                            download_url = href

                # Parse spatial bounds if available
                feature_bbox = bbox or [90.0, 25.0, 96.0, 28.5]
                boxes = entry.get("boxes", [])
                if boxes and isinstance(boxes, list) and len(boxes) > 0:
                    try:
                        # CMR box format: "south west north east"
                        parts = [float(x) for x in boxes[0].split()]
                        if len(parts) == 4:
                            feature_bbox = [parts[1], parts[0], parts[3], parts[2]]
                    except Exception:
                        pass

                feat = {
                    "type": "Feature",
                    "id": title,
                    "collection": collection,
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[
                            [feature_bbox[0], feature_bbox[1]],
                            [feature_bbox[2], feature_bbox[1]],
                            [feature_bbox[2], feature_bbox[3]],
                            [feature_bbox[0], feature_bbox[3]],
                            [feature_bbox[0], feature_bbox[1]],
                        ]]
                    },
                    "bbox": feature_bbox,
                    "properties": {
                        "datetime": t_start,
                        "end_datetime": t_end,
                        "platform": "NISAR",
                        "instrument": "LSAR (NASA L-band)",
                        "sensor": "NASA L-band SAR",
                        "product_type": "Level-2 GCOV (NASA Provisional)",
                        "Online": "Y",
                        "polarization": ["HHHH", "HVHV"],
                        "file_size_mb": size_mb,
                        "download_url": download_url,
                        "s3_uri": s3_uri,
                        "provider": "NASA Earthdata CMR (L-band)",
                        "auth_required": False,
                        "access": "Open Public Access (Free)"
                    }
                }
                features.append(feat)
                scenes.append({
                    "id": title,
                    "datetime": t_start,
                    "platform": "NISAR",
                    "sensor": "NASA L-band SAR",
                    "polarization": ["HHHH", "HVHV"],
                    "file_size_mb": size_mb,
                    "download_url": download_url,
                    "s3_uri": s3_uri,
                    "provider": "NASA Earthdata CMR (L-band)"
                })

            return {
                "type": "FeatureCollection",
                "provider": "NASA Earthdata CMR",
                "total_scenes": len(features),
                "message": f"Retrieved {len(features)} live NISAR scenes from official NASA Earthdata CMR API (Open Access).",
                "features": features,
                "scenes": scenes,
            }

        except requests.exceptions.RequestException as e:
            logger.error(f"CMR search network error: {e}")
            return {
                "type": "FeatureCollection",
                "provider": "NASA Earthdata CMR",
                "total_scenes": 0,
                "message": f"Network error contacting NASA Earthdata CMR API: {str(e)}",
                "features": [],
                "scenes": [],
            }


# Singleton instance
cmr_service = CMREarthdataService()

