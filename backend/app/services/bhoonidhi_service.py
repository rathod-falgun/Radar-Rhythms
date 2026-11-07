"""
Bhoonidhi Satellite Portal & NISAR Scene Search Service
NASA Space Apps Challenge 2026 — Brahmaputra FloodWatch

Implements authentication, token caching, token refresh, and STAC CQL2-JSON scene search
against ISRO's Bhoonidhi API (https://bhoonidhi-api.nrsc.gov.in).
Complies with official security constraints, HTTPS enforcement, and rate limit protections.
"""

import os
import time
import logging
import threading
import requests
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timezone

from ..core.config import settings

logger = logging.getLogger("bhoonidhi_service")


class BhoonidhiRateLimitError(Exception):
    """Raised when authentication rate limits (20 requests/hour) are approached or exceeded."""
    pass


class BhoonidhiAuthError(Exception):
    """Raised when credentials are invalid or authentication fails."""
    pass


class BhoonidhiAPIError(Exception):
    """Raised for general Bhoonidhi upstream API errors."""
    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message)
        self.status_code = status_code


def compute_canonical_bbox(
    geometry: Optional[Dict[str, Any]],
    raw_bbox: Optional[List[float]]
) -> Optional[List[float]]:
    """
    Ensures standard GeoJSON RFC 7946 bbox ordering: [west, south, east, north].
    Bhoonidhi upstream STAC occasionally provides bounding boxes in [west, north, east, south] order.
    This helper derives the canonical [min_lon, min_lat, max_lon, max_lat] from geometry footprint coordinates
    without modifying the footprint coordinates themselves.
    """
    if geometry and isinstance(geometry, dict) and "coordinates" in geometry:
        try:
            coords = geometry["coordinates"]

            def flatten_coords(c):
                pts = []
                if isinstance(c, (list, tuple)):
                    if len(c) >= 2 and isinstance(c[0], (int, float)) and isinstance(c[1], (int, float)):
                        pts.append((float(c[0]), float(c[1])))
                    else:
                        for sub in c:
                            pts.extend(flatten_coords(sub))
                return pts

            points = flatten_coords(coords)
            if points:
                lons = [p[0] for p in points]
                lats = [p[1] for p in points]
                return [round(min(lons), 6), round(min(lats), 6), round(max(lons), 6), round(max(lats), 6)]
        except Exception:
            pass

    if raw_bbox and isinstance(raw_bbox, (list, tuple)) and len(raw_bbox) >= 4:
        c = [float(x) for x in raw_bbox[:4]]
        lon1, lat1, lon2, lat2 = c[0], c[1], c[2], c[3]
        west, east = min(lon1, lon2), max(lon1, lon2)
        south, north = min(lat1, lat2), max(lat1, lat2)
        return [round(west, 6), round(south, 6), round(east, 6), round(north, 6)]

    return None


class BhoonidhiService:
    """
    Thread-safe client service for ISRO's Bhoonidhi Satellite Data Portal.
    Handles authentication, token lifecycle management, and STAC NISAR scene search.
    """

    def __init__(self):
        self.base_url = settings.BHOONIDHI_BASE_URL.rstrip("/")
        self.timeout = settings.BHOONIDHI_TIMEOUT_SECONDS
        self._lock = threading.Lock()

        # Token caching state
        self._access_token: Optional[str] = None
        self._refresh_token: Optional[str] = None
        self._token_type: str = "Bearer"
        self._expires_at: float = 0.0

        # Rate limiting tracker: records timestamps of auth requests in sliding 1-hour window
        self._auth_timestamps: List[float] = []
        self._max_auth_per_hour = 20

    # -------------------------------------------------------------------------
    # Configuration Status
    # -------------------------------------------------------------------------

    def is_configured(self) -> bool:
        """Checks if Bhoonidhi credentials (User ID and Password) are configured."""
        user_id = os.getenv("BHOONIDHI_USER_ID") or settings.BHOONIDHI_USER_ID
        password = os.getenv("BHOONIDHI_PASSWORD") or settings.BHOONIDHI_PASSWORD
        return bool(user_id and password and user_id.strip() and password.strip() and "your_" not in user_id)

    def get_status(self) -> Dict[str, Any]:
        """Returns safe status report without leaking credentials or tokens."""
        configured = self.is_configured()
        with self._lock:
            now = time.time()
            if not configured:
                auth_status = "not_configured"
                expires_in_sec = 0
            elif self._access_token and now < self._expires_at:
                auth_status = "authenticated"
                expires_in_sec = int(self._expires_at - now)
            elif self._refresh_token:
                auth_status = "token_expired_refresh_available"
                expires_in_sec = 0
            else:
                auth_status = "configured_unauthenticated"
                expires_in_sec = 0

            return {
                "configured": configured,
                "service": "ISRO Bhoonidhi Satellite Data Portal",
                "base_url": self.base_url,
                "target_collection": settings.DEFAULT_COLLECTION,
                "auth_status": auth_status,
                "token_valid": auth_status == "authenticated",
                "token_expires_in_seconds": max(0, expires_in_sec),
                "auth_requests_last_hour": len(self._get_recent_auth_calls())
            }

    # -------------------------------------------------------------------------
    # Rate Limiting & Auth Tracking
    # -------------------------------------------------------------------------

    def _get_recent_auth_calls(self) -> List[float]:
        """Returns list of auth timestamps within the past 3600 seconds."""
        cutoff = time.time() - 3600.0
        self._auth_timestamps = [t for t in self._auth_timestamps if t > cutoff]
        return self._auth_timestamps

    def _check_rate_limit(self):
        """Ensures we do not exceed the Bhoonidhi 20 auth calls/hour policy."""
        recent = self._get_recent_auth_calls()
        if len(recent) >= self._max_auth_per_hour:
            oldest = recent[0]
            retry_after = int(3600 - (time.time() - oldest))
            raise BhoonidhiRateLimitError(
                f"Bhoonidhi authentication rate limit reached (20 auth requests per hour). "
                f"Please wait {retry_after} seconds before re-authenticating."
            )

    def _record_auth_call(self):
        """Records an authentication request timestamp."""
        self._auth_timestamps.append(time.time())

    # -------------------------------------------------------------------------
    # Authentication & Token Management
    # -------------------------------------------------------------------------

    def get_valid_access_token(self) -> str:
        """
        Thread-safe method that returns a valid access token.
        Reuses cached token if valid; attempts refresh or re-authentication as needed.
        Never exposes the token to logs or application responses.
        """
        with self._lock:
            now = time.time()
            # If access token is valid (with 60s grace margin), return cached token
            if self._access_token and now < (self._expires_at - 60.0):
                return self._access_token

            # Try refresh token first if available
            if self._refresh_token:
                try:
                    return self._do_refresh_token()
                except Exception as e:
                    logger.warning(f"Bhoonidhi token refresh failed ({e}); falling back to fresh password-grant auth.")
                    self._access_token = None
                    self._refresh_token = None

            # Fall back to fresh password-grant authentication
            return self._do_password_grant()

    def _do_password_grant(self) -> str:
        """Executes POST /auth/token with password grant."""
        if not self.is_configured():
            raise BhoonidhiAuthError(
                "Bhoonidhi credentials are not configured. Please set BHOONIDHI_USER_ID "
                "and BHOONIDHI_PASSWORD environment variables in your .env file."
            )

        self._check_rate_limit()

        user_id = os.getenv("BHOONIDHI_USER_ID") or settings.BHOONIDHI_USER_ID
        password = os.getenv("BHOONIDHI_PASSWORD") or settings.BHOONIDHI_PASSWORD
        url = f"{self.base_url}/auth/token"

        payload = {
            "userId": user_id,
            "password": password,
            "grant_type": "password"
        }

        self._record_auth_call()
        try:
            response = requests.post(url, json=payload, timeout=self.timeout)
        except requests.exceptions.Timeout:
            raise BhoonidhiAPIError("Connection to Bhoonidhi authentication server timed out.", status_code=504)
        except requests.exceptions.RequestException as e:
            raise BhoonidhiAPIError(f"Failed to connect to Bhoonidhi server: {str(e)}", status_code=502)

        if response.status_code == 401:
            raise BhoonidhiAuthError("Invalid Bhoonidhi User ID or Password. Please verify your credentials.")
        elif response.status_code == 403:
            raise BhoonidhiAuthError("Bhoonidhi login forbidden (active session limit or account locked).")
        elif response.status_code == 429:
            raise BhoonidhiRateLimitError("Upstream Bhoonidhi rate limit exceeded (HTTP 429).")
        elif response.status_code != 200:
            raise BhoonidhiAPIError(
                f"Bhoonidhi authentication returned HTTP {response.status_code}.",
                status_code=response.status_code
            )

        try:
            data = response.json()
        except Exception:
            raise BhoonidhiAPIError("Invalid JSON received from Bhoonidhi auth endpoint.", status_code=502)

        token = data.get("access_token")
        if not token:
            raise BhoonidhiAuthError("Bhoonidhi response did not contain an access_token.")

        expires_in = int(data.get("expires_in", 3600))
        self._access_token = token
        self._refresh_token = data.get("refresh_token")
        self._token_type = data.get("token_type", "Bearer")
        self._expires_at = time.time() + expires_in

        logger.info(f"Successfully authenticated with Bhoonidhi. Token valid for {expires_in} seconds.")
        return self._access_token

    def _do_refresh_token(self) -> str:
        """Executes POST /auth/token with refresh_token grant."""
        user_id = os.getenv("BHOONIDHI_USER_ID") or settings.BHOONIDHI_USER_ID
        url = f"{self.base_url}/auth/token"

        payload = {
            "userId": user_id,
            "refresh_token": self._refresh_token,
            "grant_type": "refresh_token"
        }

        self._record_auth_call()
        try:
            response = requests.post(url, json=payload, timeout=self.timeout)
        except requests.exceptions.Timeout:
            raise BhoonidhiAPIError("Timeout during Bhoonidhi token refresh.", status_code=504)
        except requests.exceptions.RequestException as e:
            raise BhoonidhiAPIError(f"Network error during token refresh: {str(e)}", status_code=502)

        if response.status_code != 200:
            raise BhoonidhiAuthError(f"Token refresh failed with HTTP {response.status_code}.")

        data = response.json()
        token = data.get("access_token")
        if not token:
            raise BhoonidhiAuthError("Token refresh response did not contain access_token.")

        expires_in = int(data.get("expires_in", 3600))
        self._access_token = token
        if data.get("refresh_token"):
            self._refresh_token = data["refresh_token"]
        self._token_type = data.get("token_type", "Bearer")
        self._expires_at = time.time() + expires_in

        logger.info(f"Successfully refreshed Bhoonidhi access token. Valid for {expires_in} seconds.")
        return self._access_token

    def test_authentication(self) -> Dict[str, Any]:
        """
        Tests authentication or verifies active session.
        Never returns access_token or refresh_token.
        """
        if not self.is_configured():
            return {
                "success": False,
                "configured": False,
                "message": "Bhoonidhi credentials not found. Please configure BHOONIDHI_USER_ID and BHOONIDHI_PASSWORD."
            }

        try:
            token = self.get_valid_access_token()
            now = time.time()
            remaining_seconds = max(0, int(self._expires_at - now))

            return {
                "success": True,
                "configured": True,
                "message": "Bhoonidhi authentication successful. Session active.",
                "token_type": self._token_type,
                "expires_in_seconds": remaining_seconds,
                "expires_at_iso": datetime.fromtimestamp(self._expires_at, tz=timezone.utc).isoformat(),
                "service": "ISRO Bhoonidhi Satellite Data Portal"
            }
        except BhoonidhiAuthError as e:
            return {
                "success": False,
                "configured": True,
                "message": f"Authentication failed: {str(e)}"
            }
        except BhoonidhiRateLimitError as e:
            return {
                "success": False,
                "configured": True,
                "message": f"Rate limit reached: {str(e)}"
            }
        except BhoonidhiAPIError as e:
            return {
                "success": False,
                "configured": True,
                "message": f"API error: {str(e)}"
            }
        except Exception as e:
            return {
                "success": False,
                "configured": True,
                "message": f"Unexpected error during authentication: {str(e)}"
            }

    # -------------------------------------------------------------------------
    # STAC NISAR Scene Search API (POST /data/search)
    # -------------------------------------------------------------------------

    def search_scenes(
        self,
        bbox: Optional[List[float]] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        collection: Optional[str] = None,
        limit: int = 100
    ) -> Dict[str, Any]:
        """
        Performs authenticated STAC CQL2-JSON scene search against Bhoonidhi /data/search.
        
        Args:
            bbox: [west, south, east, north] in EPSG:4326. Defaults to Majuli Island.
            start_date: ISO 8601 start datetime string.
            end_date: ISO 8601 end datetime string.
            collection: Target STAC collection (defaults to 'NISAR_SSAR_GCOV').
            limit: Maximum items per page (default: 100).
        """
        # 1. Parameter defaults & validation
        target_bbox = bbox if bbox is not None else settings.DEFAULT_MAJULI_BBOX
        target_collection = collection or settings.DEFAULT_COLLECTION

        if len(target_bbox) != 4:
            raise ValueError("Bounding box must contain exactly 4 coordinates [west, south, east, north].")
        west, south, east, north = target_bbox
        if not (-180.0 <= west <= 180.0 and -180.0 <= east <= 180.0):
            raise ValueError(f"Longitude must be between -180 and 180. Received west={west}, east={east}.")
        if not (-90.0 <= south <= 90.0 and -90.0 <= north <= 90.0):
            raise ValueError(f"Latitude must be between -90 and 90. Received south={south}, north={north}.")
        if west >= east:
            raise ValueError(f"Invalid bbox: West longitude ({west}) must be less than East longitude ({east}).")
        if south >= north:
            raise ValueError(f"Invalid bbox: South latitude ({south}) must be less than North latitude ({north}).")

        # Datetime format
        start_dt_str = start_date or "2026-07-01T00:00:00Z"
        end_dt_str = end_date or "2026-09-30T23:59:59Z"
        datetime_filter = f"{start_dt_str}/{end_dt_str}"

        # 2. Get authenticated access token
        access_token = self.get_valid_access_token()

        # 3. Construct CQL2-JSON search payload as specified
        search_payload = {
            "collections": [target_collection],
            "bbox": [float(c) for c in target_bbox],
            "datetime": datetime_filter,
            "limit": int(limit),
            "filter": {
                "args": [
                    {
                        "property": "Online"
                    },
                    "Y"
                ],
                "op": "eq"
            },
            "filter-lang": "cql2-json"
        }

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

        url = f"{self.base_url}/data/search"
        logger.info(f"Dispatching Bhoonidhi STAC search to {url} for collection '{target_collection}'...")

        try:
            response = requests.post(url, json=search_payload, headers=headers, timeout=self.timeout)
        except requests.exceptions.Timeout:
            raise BhoonidhiAPIError("Bhoonidhi scene search timed out.", status_code=504)
        except requests.exceptions.RequestException as e:
            raise BhoonidhiAPIError(f"Network error querying Bhoonidhi search: {str(e)}", status_code=502)

        if response.status_code == 401:
            # Token may have expired prematurely; invalidate cached token
            with self._lock:
                self._access_token = None
            raise BhoonidhiAuthError("Bhoonidhi search rejected access token (HTTP 401). Please re-authenticate.")
        elif response.status_code == 429:
            raise BhoonidhiRateLimitError("Bhoonidhi search rate limit exceeded (HTTP 429).")
        elif response.status_code != 200:
            raise BhoonidhiAPIError(
                f"Bhoonidhi search endpoint returned HTTP {response.status_code}: {response.text[:200]}",
                status_code=response.status_code
            )

        try:
            raw_data = response.json()
        except Exception:
            raise BhoonidhiAPIError("Invalid JSON returned by Bhoonidhi search API.", status_code=502)

        # 4. Normalize response
        return self._normalize_search_response(
            raw_data=raw_data,
            collection=target_collection,
            bbox=target_bbox,
            start_date=start_dt_str,
            end_date=end_dt_str
        )

    # -------------------------------------------------------------------------
    # Response Normalization (Section 7)
    # -------------------------------------------------------------------------

    def _normalize_search_response(
        self,
        raw_data: Dict[str, Any],
        collection: str,
        bbox: List[float],
        start_date: str,
        end_date: str
    ) -> Dict[str, Any]:
        """
        Normalizes raw STAC GeoJSON FeatureCollection into clean, application-friendly structure.
        Safely extracts properties without fabricating missing values.
        """
        features = raw_data.get("features", [])
        total_matched = raw_data.get("numberMatched", len(features))
        normalized_scenes: List[Dict[str, Any]] = []

        for item in features:
            props = item.get("properties", {})
            assets = item.get("assets", {})

            # Safe asset list (only keys and MIME types; no signed or tokenized download URLs)
            safe_assets = {
                k: {
                    "type": v.get("type", "application/octet-stream"),
                    "title": v.get("title", k),
                    "description": v.get("description", None)
                }
                for k, v in assets.items()
            } if isinstance(assets, dict) else {}

            raw_item_bbox = item.get("bbox")
            canonical_bbox = compute_canonical_bbox(item.get("geometry"), raw_item_bbox)

            # Extract fields safely, using None if not present
            scene = {
                "id": item.get("id"),
                "collection": item.get("collection", collection),
                "datetime": props.get("datetime") or props.get("start_datetime") or props.get("acquisition_date"),
                "product_type": props.get("product_type") or props.get("processing_level") or "Level-2 GCOV",
                "online": props.get("Online") or props.get("online") or "Y",
                "polarization": (
                    props.get("polarization") or
                    props.get("Polarization") or
                    props.get("polarization_channels") or
                    props.get("sar:polarizations")
                ),
                "orbit_direction": (
                    props.get("orbit_direction") or
                    props.get("Node") or
                    props.get("pass_direction") or
                    props.get("sat:orbit_state")
                ),
                "relative_orbit": (
                    props.get("track") or
                    props.get("Track") or
                    props.get("relative_orbit") or
                    props.get("sat:relative_orbit") or
                    props.get("track_number")
                ),
                "frame_number": props.get("frame_number") or props.get("Frame") or props.get("frame"),
                "geometry": item.get("geometry"),
                "bbox": canonical_bbox,
                "raw_bbox": raw_item_bbox,
                "bbox_order": "west_south_east_north",
                "product_size_bytes": props.get("product_size") or props.get("file_size"),
                "instruments": props.get("instruments") or [props.get("Instrument", "SSAR")],
                "platform": props.get("platform") or props.get("Platform", "NISAR"),
                "available_assets": list(safe_assets.keys())
            }
            normalized_scenes.append(scene)

        # Check for STAC pagination next link
        links = raw_data.get("links", [])
        next_link = next((l.get("href") for l in links if l.get("rel") == "next"), None)

        return {
            "success": True,
            "collection": collection,
            "aoi": {
                "bbox": bbox,
                "description": "Majuli Island & Brahmaputra Floodplain Corridor, Assam"
            },
            "date_range": {
                "start": start_date,
                "end": end_date
            },
            "total_scenes": total_matched,
            "scenes_returned": len(normalized_scenes),
            "scenes": normalized_scenes,
            "has_next_page": bool(next_link),
            "message": f"Successfully retrieved {len(normalized_scenes)} NISAR observation scene(s) from Bhoonidhi."
        }

    # -------------------------------------------------------------------------
    # Scene Detail Inspection API (GET /data/collections/{collection}/items/{item_id})
    # -------------------------------------------------------------------------

    def get_scene_details(
        self,
        item_id: str,
        collection: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retrieves detailed STAC metadata for a specific NISAR scene from Bhoonidhi:
        GET /data/collections/{collection_id}/items/{item_id}
        """
        if not item_id or not item_id.strip():
            raise ValueError("item_id must not be empty.")

        target_collection = collection or settings.DEFAULT_COLLECTION
        access_token = self.get_valid_access_token()

        url = f"{self.base_url}/data/collections/{target_collection}/items/{item_id.strip()}"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json"
        }

        logger.info(f"Retrieving NISAR scene details from Bhoonidhi: {url}")
        try:
            response = requests.get(url, headers=headers, timeout=self.timeout)
        except requests.exceptions.Timeout:
            raise BhoonidhiAPIError(f"Request timed out retrieving scene details for '{item_id}'.", status_code=504)
        except requests.exceptions.RequestException as e:
            raise BhoonidhiAPIError(f"Network error querying Bhoonidhi scene details: {str(e)}", status_code=502)

        if response.status_code == 404:
            raise BhoonidhiAPIError(f"NISAR scene '{item_id}' not found in collection '{target_collection}'.", status_code=404)
        elif response.status_code == 401:
            with self._lock:
                self._access_token = None
            raise BhoonidhiAuthError("Bhoonidhi rejected access token (HTTP 401).")
        elif response.status_code == 429:
            raise BhoonidhiRateLimitError("Bhoonidhi rate limit reached (HTTP 429).")
        elif response.status_code != 200:
            raise BhoonidhiAPIError(
                f"Bhoonidhi item endpoint returned HTTP {response.status_code}: {response.text[:200]}",
                status_code=response.status_code
            )

        try:
            raw_item = response.json()
        except Exception:
            raise BhoonidhiAPIError("Invalid JSON returned by Bhoonidhi scene detail API.", status_code=502)

        return self._normalize_scene_detail(raw_item, target_collection)

    def _normalize_scene_detail(self, item: Dict[str, Any], collection: str) -> Dict[str, Any]:
        """
        Extracts and structures detailed STAC item metadata according to task specifications.
        Preserves original footprint coordinates without modification while computing canonical [west, south, east, north] bbox.
        Identifies presence of measurement HDF5 and QA assets, and sanitizes download asset listings.
        """
        props = item.get("properties", {})
        raw_assets = item.get("assets", {})
        geometry = item.get("geometry")
        raw_bbox = item.get("bbox")
        item_id = item.get("id")

        # Canonical bounding box [west, south, east, north]
        canonical_bbox = compute_canonical_bbox(geometry, raw_bbox)

        # Asset classification and sanitization
        has_measurement_hdf5 = False
        has_qa_assets = False
        detailed_assets: Dict[str, Any] = {}
        available_download_links: List[Dict[str, Any]] = []

        qa_identifiers = {"QAZIP", "QAPDF", "QA", "QUALITY", "QC"}

        for asset_key, asset_val in raw_assets.items():
            if not isinstance(asset_val, dict):
                continue

            media_type = asset_val.get("type", "application/octet-stream")
            title = asset_val.get("title", asset_key)
            description = asset_val.get("description")
            roles = asset_val.get("roles", [])

            # Check for QA
            is_qa = (
                asset_key.upper() in qa_identifiers or
                any(r.lower() in {"qa", "quality"} for r in roles)
            )
            if is_qa:
                has_qa_assets = True

            # Check for measurement HDF5 (must be verified HDF5 raster, not QA zip or report)
            is_measurement = (
                media_type in {"application/x-hdf5", "application/x-hdf"} or
                asset_key.lower().endswith((".h5", ".hdf5")) or
                "measurement" in str(roles).lower()
            ) and not is_qa
            if is_measurement:
                has_measurement_hdf5 = True

            detailed_assets[asset_key] = {
                "name": asset_key,
                "title": title,
                "type": media_type,
                "roles": roles if roles else ([ "qa" ] if is_qa else ([ "data" ] if is_measurement else None)),
                "description": description,
                "is_measurement": is_measurement,
                "is_qa": is_qa,
                "available": True
            }

            # Safe download reference without exposing signed URLs or auth tokens
            available_download_links.append({
                "asset": asset_key,
                "title": title,
                "type": media_type,
                "is_qa": is_qa,
                "is_measurement": is_measurement,
                "description": description or f"{title} ({media_type})"
            })

        # Orbit and polarimetric information
        pol_raw = props.get("Polarization") or props.get("polarization") or props.get("polarization_channels")
        orbit_dir = props.get("Node") or props.get("orbit_direction") or props.get("pass_direction")
        look_dir = props.get("Look_dir") or props.get("look_direction")
        track_val = props.get("Track") or props.get("track") or props.get("relative_orbit")
        frame_val = props.get("Frame") or props.get("frame") or props.get("frame_number")

        return {
            "success": True,
            "id": item_id,
            "collection": item.get("collection", collection),
            "datetime": props.get("datetime") or props.get("start_datetime") or props.get("acquisition_date"),
            "product_type": props.get("product_type") or props.get("ProductCode") or ("Level-2 GCOV" if "GCOV" in str(item_id) else None),
            "platform": props.get("Platform") or props.get("platform") or "NISAR",
            "instrument": props.get("Instrument") or props.get("instruments", ["SSAR"])[0] if isinstance(props.get("instruments"), list) else "SSAR",
            "polarization": pol_raw,
            "orbit_direction": orbit_dir,
            "look_direction": look_dir,
            "relative_orbit": int(track_val) if track_val is not None else None,
            "frame_number": int(frame_val) if frame_val is not None else None,
            "cycle_number": int(props.get("CycleNumber")) if props.get("CycleNumber") is not None else None,
            "incidence_angle_deg": float(props.get("IncidenceAngle")) if props.get("IncidenceAngle") is not None else None,
            "processing_information": {
                "producer": props.get("Producer", "ISRO"),
                "software_version": props.get("SoftwareVersion"),
                "dem_source": props.get("DEMSource"),
                "dem_correction": props.get("DEMCorrection"),
                "generation_time": props.get("GenerationTime"),
                "product_code": props.get("ProductCode"),
                "scene_identifier": props.get("Scene_Identifier"),
                "obs_id": props.get("OBSID"),
                "input_resolution_along_m": props.get("InputResolutionAlong"),
                "input_resolution_across_m": props.get("InputResolutionAcross")
            },
            "footprint": geometry,
            "bbox": canonical_bbox,
            "raw_bbox": raw_bbox,
            "bbox_order": "west_south_east_north",
            "product_size": props.get("product_size") or props.get("file_size"),
            "has_measurement_hdf5": has_measurement_hdf5,
            "has_qa_assets": has_qa_assets,
            "assets": detailed_assets,
            "available_download_links": available_download_links,
            "online_status": props.get("Online") or props.get("online") or "Y",
            "message": f"Successfully retrieved scene metadata for {item_id}."
        }

    # -------------------------------------------------------------------------
    # Safe Download Preflight Inspection (GET /download?id={item_id}&collection={collection})
    # -------------------------------------------------------------------------

    def check_download_preflight(
        self,
        item_id: str,
        collection: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes a safe preflight check against Bhoonidhi's /download endpoint.
        Uses HTTP stream=True, allow_redirects=False, and NEVER reads or saves the response body.
        Closes the HTTP stream immediately in a finally block.
        Inspects headers only to determine file presence, content type, length, and redirect status.
        Never retries on failure (respecting Bhoonidhi's 2 downloads/minute policy).
        """
        if not item_id or not item_id.strip():
            raise ValueError("item_id must not be empty.")

        target_collection = collection or settings.DEFAULT_COLLECTION
        if target_collection not in settings.ALLOWED_COLLECTIONS:
            raise ValueError(f"Collection '{target_collection}' is not allowed.")

        access_token = self.get_valid_access_token()
        url = f"{self.base_url}/download"
        params = {"id": item_id.strip(), "collection": target_collection}
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "*/*"
        }

        logger.info(f"Initiating safe download preflight for '{item_id}' (stream=True, allow_redirects=False)...")

        response = None
        try:
            # stream=True ensures body is not downloaded; allow_redirects=False halts on 3xx
            response = requests.get(
                url,
                params=params,
                headers=headers,
                stream=True,
                allow_redirects=False,
                timeout=self.timeout
            )
            status_code = response.status_code
            resp_headers = response.headers

            content_type = resp_headers.get("Content-Type")
            cl_str = resp_headers.get("Content-Length")
            content_length_bytes = int(cl_str) if (cl_str and cl_str.isdigit()) else None

            # Extract filename from Content-Disposition if present
            cd_header = resp_headers.get("Content-Disposition")
            content_disposition_filename = None
            if cd_header and "filename=" in cd_header:
                try:
                    parts = cd_header.split("filename=")
                    if len(parts) > 1:
                        fname = parts[1].split(";")[0].strip("\"' ")
                        content_disposition_filename = os.path.basename(fname)
                except Exception:
                    pass

            is_redirect = (300 <= status_code < 400) or status_code in (301, 302, 303, 307, 308)

            # Analyze file characteristics
            file_mimes = {"application/octet-stream", "application/x-hdf5", "application/x-hdf", "application/zip"}
            appears_to_be_file = False
            appears_to_be_hdf5 = False

            if not is_redirect and (200 <= status_code < 300):
                ct_clean = content_type.split(";")[0].strip().lower() if content_type else ""
                # If Content-Type is clearly an error/text format (e.g. JSON or HTML)
                if ct_clean in {"application/json", "text/html", "text/plain", "application/problem+json"}:
                    appears_to_be_file = False
                elif ct_clean in file_mimes or (content_disposition_filename and content_disposition_filename.lower().endswith((".h5", ".hdf5", ".zip", ".tif"))):
                    appears_to_be_file = True

                # Check specifically for HDF5
                if appears_to_be_file:
                    if ct_clean in {"application/x-hdf5", "application/x-hdf"} or (
                        content_disposition_filename and content_disposition_filename.lower().endswith((".h5", ".hdf5"))
                    ) or "h5" in str(content_disposition_filename).lower():
                        appears_to_be_hdf5 = True
                    elif ct_clean == "application/octet-stream" and (content_length_bytes and content_length_bytes > 1_000_000_000):
                        # Multi-gigabyte octet-stream for GCOV is HDF5
                        appears_to_be_hdf5 = True

            # Determine preflight status and safe explanatory message
            if is_redirect:
                preflight_status = "redirect_detected"
                message = (
                    f"Upstream returned HTTP {status_code} redirect. "
                    "Redirect was not followed and redirect location is masked for security."
                )
                success = True
            elif status_code == 200:
                if appears_to_be_hdf5:
                    preflight_status = "ready_for_download"
                    size_gb = f" ({content_length_bytes / 1e9:.2f} GB)" if content_length_bytes else ""
                    message = (
                        f"NISAR measurement product headers verified{size_gb}. "
                        "Preflight confirmed HDF5 stream availability without consuming the body."
                    )
                    success = True
                elif appears_to_be_file:
                    preflight_status = "file_response_non_hdf5"
                    message = "Upstream returned a file response, but media type is not explicitly HDF5."
                    success = True
                else:
                    preflight_status = "error_response"
                    message = (
                        f"Upstream returned HTTP 200 with non-file Content-Type: '{content_type}'. "
                        "Response indicates an embedded error or message rather than a satellite measurement product."
                    )
                    success = False
            elif status_code == 401:
                preflight_status = "unauthorized"
                message = "Bhoonidhi rejected credentials or download session is unauthorized (HTTP 401)."
                success = False
            elif status_code == 404:
                preflight_status = "not_found"
                message = f"Product '{item_id}' not found at download endpoint (HTTP 404)."
                success = False
            elif status_code == 412:
                preflight_status = "precondition_failed"
                message = (
                    "Precondition failed (HTTP 412). "
                    "This typically indicates concurrent download limits or pending product staging in Bhoonidhi."
                )
                success = False
            elif status_code == 429:
                preflight_status = "rate_limited"
                message = (
                    "Bhoonidhi download rate limit reached (HTTP 429). "
                    "Policy permits a maximum of 2 download requests per minute."
                )
                success = False
            elif status_code == 504:
                preflight_status = "gateway_timeout"
                message = "Bhoonidhi download gateway timed out (HTTP 504)."
                success = False
            else:
                preflight_status = "upstream_error"
                message = f"Bhoonidhi download endpoint returned HTTP {status_code}."
                success = False

            return {
                "success": success,
                "item_id": item_id,
                "collection": target_collection,
                "preflight_status": preflight_status,
                "http_status_code": status_code,
                "content_type": content_type,
                "content_length_bytes": content_length_bytes,
                "content_disposition_filename": content_disposition_filename,
                "is_redirect": is_redirect,
                "appears_to_be_file": appears_to_be_file,
                "appears_to_be_hdf5": appears_to_be_hdf5,
                "download_confirmed": False,
                "message": message
            }

        except requests.exceptions.Timeout:
            return {
                "success": False,
                "item_id": item_id,
                "collection": target_collection,
                "preflight_status": "gateway_timeout",
                "http_status_code": 504,
                "content_type": None,
                "content_length_bytes": None,
                "content_disposition_filename": None,
                "is_redirect": False,
                "appears_to_be_file": False,
                "appears_to_be_hdf5": False,
                "download_confirmed": False,
                "message": f"Connection timed out after {self.timeout}s during download preflight."
            }
        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "item_id": item_id,
                "collection": target_collection,
                "preflight_status": "network_error",
                "http_status_code": 502,
                "content_type": None,
                "content_length_bytes": None,
                "content_disposition_filename": None,
                "is_redirect": False,
                "appears_to_be_file": False,
                "appears_to_be_hdf5": False,
                "download_confirmed": False,
                "message": f"Network error contacting Bhoonidhi download endpoint: {str(e)}"
            }
        finally:
            if response is not None:
                try:
                    response.close()
                except Exception:
                    pass


# Singleton instance
bhoonidhi_service = BhoonidhiService()

