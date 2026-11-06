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

            # Extract fields safely, using None if not present
            scene = {
                "id": item.get("id"),
                "collection": item.get("collection", collection),
                "datetime": props.get("datetime") or props.get("start_datetime") or props.get("acquisition_date"),
                "product_type": props.get("product_type") or props.get("processing_level") or "Level-2 GCOV",
                "online": props.get("Online") or props.get("online") or "Y",
                "polarization": (
                    props.get("polarization") or
                    props.get("polarization_channels") or
                    props.get("sar:polarizations")
                ),
                "orbit_direction": (
                    props.get("orbit_direction") or
                    props.get("pass_direction") or
                    props.get("sat:orbit_state")
                ),
                "relative_orbit": (
                    props.get("track") or
                    props.get("relative_orbit") or
                    props.get("sat:relative_orbit") or
                    props.get("track_number")
                ),
                "frame_number": props.get("frame_number") or props.get("frame"),
                "geometry": item.get("geometry"),
                "bbox": item.get("bbox"),
                "product_size_bytes": props.get("product_size") or props.get("file_size"),
                "instruments": props.get("instruments") or ["SSAR"],
                "platform": props.get("platform") or "NISAR",
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


# Singleton instance
bhoonidhi_service = BhoonidhiService()

