"""
Automated Test Suite for Bhoonidhi Authentication and NISAR Scene Search API
NASA Space Apps Challenge 2026 — Brahmaputra FloodWatch

Tests all authentication flows, token caching, token refresh, rate limiting,
CQL2-JSON STAC search, response normalization, and security rules.
Uses mocked HTTP responses to avoid consuming live Bhoonidhi rate limits.
"""

import os
import sys
import time
import json
import unittest
from unittest.mock import patch, MagicMock

# Configure UTF-8 stdout on Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# pyrefly: ignore[missing-import]
from fastapi.testclient import TestClient
from app.main import app
from app.services.bhoonidhi_service import BhoonidhiService, bhoonidhi_service
from app.core.config import settings

client = TestClient(app)


class TestBhoonidhiAuthenticationAndSearch(unittest.TestCase):

    def setUp(self):
        # Reset singleton state before each test
        bhoonidhi_service._access_token = None
        bhoonidhi_service._refresh_token = None
        bhoonidhi_service._expires_at = 0.0
        bhoonidhi_service._auth_timestamps = []

    # -------------------------------------------------------------------------
    # 1. Status Endpoint & Missing Credentials
    # -------------------------------------------------------------------------

    def test_status_endpoint_unconfigured(self):
        """GET /api/nisar/status must return safe status without credentials."""
        with patch.dict(os.environ, {"BHOONIDHI_USER_ID": "", "BHOONIDHI_PASSWORD": ""}, clear=True):
            settings.BHOONIDHI_USER_ID = None
            settings.BHOONIDHI_PASSWORD = None

            res = client.get("/api/nisar/status")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertIn("configured", data)
            self.assertFalse(data["configured"])
            self.assertEqual(data["service"], "Bhoonidhi")
            self.assertEqual(data["collection"], "NISAR_SSAR_GCOV")
            # Ensure no credentials or tokens are present in response
            for sensitive in ["password", "token", "access_token", "secret"]:
                self.assertNotIn(sensitive, data)

    def test_auth_test_missing_credentials(self):
        """POST /api/nisar/auth/test must return 400 when credentials are not configured."""
        with patch.dict(os.environ, {"BHOONIDHI_USER_ID": "", "BHOONIDHI_PASSWORD": ""}, clear=True):
            settings.BHOONIDHI_USER_ID = None
            settings.BHOONIDHI_PASSWORD = None

            res = client.post("/api/nisar/auth/test")
            self.assertEqual(res.status_code, 400)
            data = res.json()
            self.assertIn("detail", data)
            self.assertIn("credentials", data["detail"].lower())

    # -------------------------------------------------------------------------
    # 2. Authentication with Valid Credentials (Mocked)
    # -------------------------------------------------------------------------

    @patch("requests.post")
    def test_auth_success_and_token_caching(self, mock_post):
        """Successful authentication should cache token and not re-request."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "access_token": "mock_access_token_12345",
            "token_type": "Bearer",
            "expires_in": 3600,
            "refresh_token": "mock_refresh_token_67890"
        }
        mock_post.return_value = mock_response

        with patch.dict(os.environ, {"BHOONIDHI_USER_ID": "test_user", "BHOONIDHI_PASSWORD": "test_password"}):
            settings.BHOONIDHI_USER_ID = "test_user"
            settings.BHOONIDHI_PASSWORD = "test_password"

            res = client.post("/api/nisar/auth/test")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertTrue(data["success"])
            self.assertTrue(data["configured"])
            self.assertIn("expires_in_seconds", data)
            self.assertGreater(data["expires_in_seconds"], 3500)

            # Security assertion: Token must NEVER be exposed in the response
            self.assertNotIn("access_token", data)
            self.assertNotIn("refresh_token", data)
            self.assertNotIn("mock_access_token_12345", json.dumps(data))

            # Verify that calling get_valid_access_token again reuses cache (0 additional HTTP calls)
            mock_post.reset_mock()
            token2 = bhoonidhi_service.get_valid_access_token()
            self.assertEqual(token2, "mock_access_token_12345")
            mock_post.assert_not_called()

    # -------------------------------------------------------------------------
    # 3. Token Refresh Flow
    # -------------------------------------------------------------------------

    @patch("requests.post")
    def test_token_refresh_when_expired(self, mock_post):
        """When access token is expired, service should use refresh_token grant."""
        # Initial login
        bhoonidhi_service._access_token = "old_expired_token"
        bhoonidhi_service._refresh_token = "valid_refresh_token"
        bhoonidhi_service._expires_at = time.time() - 100.0  # Expired

        mock_refresh_res = MagicMock()
        mock_refresh_res.status_code = 200
        mock_refresh_res.json.return_value = {
            "access_token": "new_refreshed_access_token",
            "token_type": "Bearer",
            "expires_in": 3600,
            "refresh_token": "new_refresh_token"
        }
        mock_post.return_value = mock_refresh_res

        with patch.dict(os.environ, {"BHOONIDHI_USER_ID": "test_user", "BHOONIDHI_PASSWORD": "test_password"}):
            token = bhoonidhi_service.get_valid_access_token()
            self.assertEqual(token, "new_refreshed_access_token")

            # Check that the request payload was a refresh_token grant
            call_args = mock_post.call_args
            payload = call_args.kwargs.get("json", {})
            self.assertEqual(payload.get("grant_type"), "refresh_token")
            self.assertEqual(payload.get("refresh_token"), "valid_refresh_token")

    # -------------------------------------------------------------------------
    # 4. Rate Limiting Protection (Max 20 Auth Requests / Hour)
    # -------------------------------------------------------------------------

    def test_auth_rate_limiting_enforcement(self):
        """Should raise rate limit error after 20 auth calls in 1 hour."""
        now = time.time()
        # Pre-fill 20 timestamps
        bhoonidhi_service._auth_timestamps = [now - (i * 60) for i in range(20)]

        with patch.dict(os.environ, {"BHOONIDHI_USER_ID": "test_user", "BHOONIDHI_PASSWORD": "test_password"}):
            settings.BHOONIDHI_USER_ID = "test_user"
            settings.BHOONIDHI_PASSWORD = "test_password"

            res = client.post("/api/nisar/auth/test")
            self.assertEqual(res.status_code, 401)  # Or handled with message
            self.assertIn("rate limit", res.text.lower())

    # -------------------------------------------------------------------------
    # 5. Invalid Credentials Error Handling
    # -------------------------------------------------------------------------

    @patch("requests.post")
    def test_invalid_credentials_401(self, mock_post):
        """HTTP 401 from Bhoonidhi should map to application 401 with clear message."""
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.json.return_value = {"error": "Unauthorized"}
        mock_post.return_value = mock_response

        with patch.dict(os.environ, {"BHOONIDHI_USER_ID": "bad_user", "BHOONIDHI_PASSWORD": "bad_password"}):
            settings.BHOONIDHI_USER_ID = "bad_user"
            settings.BHOONIDHI_PASSWORD = "bad_password"

            res = client.post("/api/nisar/auth/test")
            self.assertEqual(res.status_code, 401)
            self.assertIn("invalid", res.json()["detail"].lower())

    # -------------------------------------------------------------------------
    # 6. STAC NISAR Scene Search Request & Normalization
    # -------------------------------------------------------------------------

    @patch("requests.post")
    def test_search_scenes_with_cql2_payload(self, mock_post):
        """POST /api/nisar/scenes must send valid CQL2-JSON and return normalized response."""
        # Set active token
        bhoonidhi_service._access_token = "active_valid_token"
        bhoonidhi_service._expires_at = time.time() + 3600.0

        mock_search_res = MagicMock()
        mock_search_res.status_code = 200
        mock_search_res.json.return_value = {
            "type": "FeatureCollection",
            "numberMatched": 1,
            "numberReturned": 1,
            "features": [
                {
                    "type": "Feature",
                    "id": "NISAR_S2_PR_GCOV_025_019_D_075_2500_CRNA_A_20260709T124208_20260709T124245_P00500_M_F_I_001",
                    "collection": "NISAR_SSAR_GCOV",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[93.60, 26.50], [94.60, 26.50], [94.60, 27.30], [93.60, 27.30], [93.60, 26.50]]]
                    },
                    "bbox": [93.60, 26.50, 94.60, 27.30],
                    "properties": {
                        "datetime": "2026-07-09T12:42:08Z",
                        "product_type": "Level-2 GCOV",
                        "Online": "Y",
                        "polarization": ["HHHH", "HVHV"],
                        "orbit_direction": "Descending",
                        "track": 19,
                        "frame_number": 75,
                        "file_size": 1182390123
                    },
                    "assets": {
                        "data": {
                            "type": "application/x-hdf5",
                            "title": "HDF5 GCOV Product"
                        }
                    }
                }
            ]
        }
        mock_post.return_value = mock_search_res

        with patch.dict(os.environ, {"BHOONIDHI_USER_ID": "test_user", "BHOONIDHI_PASSWORD": "test_password"}):
            settings.BHOONIDHI_USER_ID = "test_user"
            settings.BHOONIDHI_PASSWORD = "test_password"

            res = client.post("/api/nisar/scenes", json={})
            self.assertEqual(res.status_code, 200)
            data = res.json()

            self.assertTrue(data["success"])
            self.assertEqual(data["collection"], "NISAR_SSAR_GCOV")
            self.assertEqual(data["total_scenes"], 1)
            self.assertEqual(len(data["scenes"]), 1)

            scene = data["scenes"][0]
            self.assertEqual(scene["id"], "NISAR_S2_PR_GCOV_025_019_D_075_2500_CRNA_A_20260709T124208_20260709T124245_P00500_M_F_I_001")
            self.assertEqual(scene["datetime"], "2026-07-09T12:42:08Z")
            self.assertEqual(scene["online"], "Y")
            self.assertEqual(scene["polarization"], ["HHHH", "HVHV"])
            self.assertEqual(scene["orbit_direction"], "Descending")
            self.assertEqual(scene["relative_orbit"], 19)
            self.assertEqual(scene["available_assets"], ["data"])

            # Verify upstream request parameters sent to Bhoonidhi
            call_args = mock_post.call_args
            headers = call_args.kwargs.get("headers", {})
            payload = call_args.kwargs.get("json", {})

            self.assertEqual(headers.get("Authorization"), "Bearer active_valid_token")
            self.assertEqual(payload.get("collections"), ["NISAR_SSAR_GCOV"])
            self.assertEqual(payload.get("bbox"), [93.60, 26.50, 94.60, 27.30])
            self.assertEqual(payload.get("filter-lang"), "cql2-json")
            self.assertEqual(payload.get("filter"), {
                "args": [{"property": "Online"}, "Y"],
                "op": "eq"
            })

    # -------------------------------------------------------------------------
    # 7. Empty Results Handling
    # -------------------------------------------------------------------------

    @patch("requests.post")
    def test_search_empty_results(self, mock_post):
        """Empty results should return normalized empty list without error."""
        bhoonidhi_service._access_token = "active_valid_token"
        bhoonidhi_service._expires_at = time.time() + 3600.0

        mock_search_res = MagicMock()
        mock_search_res.status_code = 200
        mock_search_res.json.return_value = {
            "type": "FeatureCollection",
            "numberMatched": 0,
            "numberReturned": 0,
            "features": []
        }
        mock_post.return_value = mock_search_res

        with patch.dict(os.environ, {"BHOONIDHI_USER_ID": "test_user", "BHOONIDHI_PASSWORD": "test_password"}):
            settings.BHOONIDHI_USER_ID = "test_user"
            settings.BHOONIDHI_PASSWORD = "test_password"

            res = client.post("/api/nisar/scenes", json={})
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertTrue(data["success"])
            self.assertEqual(data["total_scenes"], 0)
            self.assertEqual(len(data["scenes"]), 0)

    # -------------------------------------------------------------------------
    # 8. Input Validation
    # -------------------------------------------------------------------------

    def test_invalid_bbox_rejected(self):
        """Invalid bounding box (e.g. west >= east) must return HTTP 422."""
        res = client.post("/api/nisar/scenes", json={
            "bbox": [95.0, 26.5, 93.0, 27.3]  # west (95) > east (93)
        })
        self.assertEqual(res.status_code, 422)
        self.assertIn("west", res.json()["detail"].lower())

    def test_invalid_dates_rejected(self):
        """Start date later than end date must return HTTP 422."""
        res = client.post("/api/nisar/scenes", json={
            "start_date": "2026-09-30T00:00:00Z",
            "end_date": "2026-07-01T00:00:00Z"
        })
        self.assertEqual(res.status_code, 422)
        self.assertIn("start date", res.json()["detail"].lower())

    def test_invalid_collection_rejected(self):
        """Unsupported collection must return HTTP 422."""
        res = client.post("/api/nisar/scenes", json={
            "collection": "UNSUPPORTED_COLLECTION"
        })
        self.assertEqual(res.status_code, 422)
        self.assertIn("not supported", res.json()["detail"].lower())


    # -------------------------------------------------------------------------
    # 9. Scene Detail Inspection
    # -------------------------------------------------------------------------

    @patch("requests.get")
    def test_get_scene_details_success(self, mock_get):
        """GET /api/nisar/scenes/{item_id}/details must extract all metadata & correct bbox."""
        bhoonidhi_service._access_token = "active_valid_token"
        bhoonidhi_service._expires_at = time.time() + 3600.0

        mock_res = MagicMock()
        mock_res.status_code = 200
        mock_res.json.return_value = {
            "type": "Feature",
            "id": "NISAR_S2_PR_GCOV_031_040_A_015_3700_DHNA_A_20260920T230526_20260920T230602_P00500_M_F_I_001",
            "collection": "NISAR_SSAR_GCOV",
            "bbox": [92.330429, 28.114938, 95.406955, 25.350359],  # Inverted north/south as returned by Bhoonidhi
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[92.145, 28.246], [95.667, 28.223], [95.597, 25.209], [92.167, 25.230], [92.145, 28.246]]]
            },
            "properties": {
                "datetime": "2026-09-20T23:05:26Z",
                "Platform": "NISAR",
                "Instrument": "SSAR",
                "Polarization": "DH",
                "Node": "Ascending",
                "Look_dir": "Left",
                "Track": 40,
                "Frame": 15,
                "CycleNumber": 31,
                "IncidenceAngle": 41.237,
                "Producer": "ISRO",
                "SoftwareVersion": "1.4.00",
                "DEMSource": "Copernicus GLO-30",
                "Online": "Y"
            },
            "assets": {
                "metadata": {"type": "application/json", "title": "metadata"},
                "thumbnail": {"type": "image/jpeg", "title": "thumbnail"},
                "QAZIP": {"type": "application/octet-stream", "title": "QAZIP"},
                "QAPDF": {"type": "application/octet-stream", "title": "QAPDF"}
            }
        }
        mock_get.return_value = mock_res

        with patch.dict(os.environ, {"BHOONIDHI_USER_ID": "test_user", "BHOONIDHI_PASSWORD": "test_password"}):
            settings.BHOONIDHI_USER_ID = "test_user"
            settings.BHOONIDHI_PASSWORD = "test_password"

            item_id = "NISAR_S2_PR_GCOV_031_040_A_015_3700_DHNA_A_20260920T230526_20260920T230602_P00500_M_F_I_001"
            res = client.get(f"/api/nisar/scenes/{item_id}/details")
            self.assertEqual(res.status_code, 200)
            data = res.json()

            self.assertTrue(data["success"])
            self.assertEqual(data["id"], item_id)
            self.assertEqual(data["polarization"], "DH")
            self.assertEqual(data["orbit_direction"], "Ascending")
            self.assertEqual(data["relative_orbit"], 40)
            self.assertEqual(data["frame_number"], 15)
            self.assertEqual(data["cycle_number"], 31)

            # Asset verification
            self.assertFalse(data["has_measurement_hdf5"])
            self.assertTrue(data["has_qa_assets"])
            self.assertIn("QAZIP", data["assets"])
            self.assertIn("QAPDF", data["assets"])

            # Verify Bounding Box Ordering: must be [west, south, east, north]
            bbox = data["bbox"]
            self.assertEqual(len(bbox), 4)
            west, south, east, north = bbox
            self.assertLess(west, east, "West longitude must be strictly less than East longitude")
            self.assertLess(south, north, "South latitude must be strictly less than North latitude")
            self.assertEqual(data["bbox_order"], "west_south_east_north")

            # Security: No access tokens or signed download URLs exposed
            res_str = json.dumps(data)
            self.assertNotIn("active_valid_token", res_str)
            self.assertNotIn("Bearer", res_str)

    @patch("requests.get")
    def test_get_scene_details_404(self, mock_get):
        """GET /api/nisar/scenes/{item_id}/details should return 404 when item is missing."""
        bhoonidhi_service._access_token = "active_valid_token"
        bhoonidhi_service._expires_at = time.time() + 3600.0

        mock_res = MagicMock()
        mock_res.status_code = 404
        mock_res.text = "Item not found"
        mock_get.return_value = mock_res

        with patch.dict(os.environ, {"BHOONIDHI_USER_ID": "test_user", "BHOONIDHI_PASSWORD": "test_password"}):
            settings.BHOONIDHI_USER_ID = "test_user"
            settings.BHOONIDHI_PASSWORD = "test_password"

            res = client.get("/api/nisar/scenes/NON_EXISTENT_SCENE/details")
            self.assertEqual(res.status_code, 404)
            self.assertIn("not found", res.json()["detail"].lower())


    # -------------------------------------------------------------------------
    # 10. Safe Download Preflight Inspection Tests
    # -------------------------------------------------------------------------

    @patch("requests.get")
    def test_download_preflight_200_hdf5(self, mock_get):
        """Test HTTP 200 with an HDF5-like content type and large Content-Length."""
        bhoonidhi_service._access_token = "active_valid_token"
        bhoonidhi_service._expires_at = time.time() + 3600.0

        mock_res = MagicMock()
        mock_res.status_code = 200
        mock_res.headers = {
            "Content-Type": "application/octet-stream",
            "Content-Length": "12666974812",
            "Content-Disposition": 'attachment; filename="NISAR_S2_PR_GCOV_029_040_A_015_3700_DHNA_A_20260827T230526.h5"'
        }
        mock_get.return_value = mock_res

        with patch.dict(os.environ, {"BHOONIDHI_USER_ID": "test_user", "BHOONIDHI_PASSWORD": "test_password"}):
            settings.BHOONIDHI_USER_ID = "test_user"
            settings.BHOONIDHI_PASSWORD = "test_password"

            item_id = "NISAR_S2_PR_GCOV_029_040_A_015_3700_DHNA_A_20260827T230526_20260827T230602_P00500_M_F_I_001"
            res = client.post(f"/api/nisar/scenes/{item_id}/download-preflight")
            self.assertEqual(res.status_code, 200)
            data = res.json()

            self.assertTrue(data["success"])
            self.assertEqual(data["http_status_code"], 200)
            self.assertEqual(data["preflight_status"], "ready_for_download")
            self.assertTrue(data["appears_to_be_file"])
            self.assertTrue(data["appears_to_be_hdf5"])
            self.assertFalse(data["is_redirect"])
            self.assertFalse(data["download_confirmed"], "download_confirmed MUST remain False")
            self.assertEqual(data["content_length_bytes"], 12666974812)
            self.assertEqual(data["content_disposition_filename"], "NISAR_S2_PR_GCOV_029_040_A_015_3700_DHNA_A_20260827T230526.h5")

            # Verify request parameters (stream=True, allow_redirects=False)
            call_kwargs = mock_get.call_args.kwargs
            self.assertTrue(call_kwargs.get("stream"), "Must use stream=True")
            self.assertFalse(call_kwargs.get("allow_redirects"), "Must disable allow_redirects")

            # Verify response was closed immediately and body was not read
            mock_res.close.assert_called_once()
            mock_res.json.assert_not_called()
            mock_res.text.__str__.assert_not_called()

    @patch("requests.get")
    def test_download_preflight_200_json_error(self, mock_get):
        """Test HTTP 200 with JSON error content (not a file)."""
        bhoonidhi_service._access_token = "active_valid_token"
        bhoonidhi_service._expires_at = time.time() + 3600.0

        mock_res = MagicMock()
        mock_res.status_code = 200
        mock_res.headers = {
            "Content-Type": "application/json; charset=utf-8",
            "Content-Length": "128"
        }
        mock_get.return_value = mock_res

        with patch.dict(os.environ, {"BHOONIDHI_USER_ID": "test_user", "BHOONIDHI_PASSWORD": "test_password"}):
            settings.BHOONIDHI_USER_ID = "test_user"
            settings.BHOONIDHI_PASSWORD = "test_password"

            item_id = "NISAR_S2_PR_GCOV_029_040_A_015_3700_DHNA_A_20260827T230526_20260827T230602_P00500_M_F_I_001"
            res = client.post(f"/api/nisar/scenes/{item_id}/download-preflight")
            self.assertEqual(res.status_code, 200)
            data = res.json()

            self.assertFalse(data["success"])
            self.assertEqual(data["preflight_status"], "error_response")
            self.assertFalse(data["appears_to_be_file"])
            self.assertFalse(data["appears_to_be_hdf5"])
            self.assertFalse(data["download_confirmed"])
            mock_res.close.assert_called_once()

    @patch("requests.get")
    def test_download_preflight_redirect_302(self, mock_get):
        """Test redirect 302 response: must report redirect without following or exposing Location."""
        bhoonidhi_service._access_token = "active_valid_token"
        bhoonidhi_service._expires_at = time.time() + 3600.0

        mock_res = MagicMock()
        mock_res.status_code = 302
        mock_res.headers = {
            "Location": "https://s3.nrsc.gov.in/signed_storage/product.h5?AWSAccessKeyId=SECRET&Signature=TOKEN",
            "Content-Type": "text/html"
        }
        mock_get.return_value = mock_res

        with patch.dict(os.environ, {"BHOONIDHI_USER_ID": "test_user", "BHOONIDHI_PASSWORD": "test_password"}):
            settings.BHOONIDHI_USER_ID = "test_user"
            settings.BHOONIDHI_PASSWORD = "test_password"

            item_id = "NISAR_S2_PR_GCOV_029_040_A_015_3700_DHNA_A_20260827T230526_20260827T230602_P00500_M_F_I_001"
            res = client.post(f"/api/nisar/scenes/{item_id}/download-preflight")
            self.assertEqual(res.status_code, 200)
            data = res.json()

            self.assertTrue(data["is_redirect"])
            self.assertEqual(data["http_status_code"], 302)
            self.assertEqual(data["preflight_status"], "redirect_detected")
            self.assertFalse(data["download_confirmed"])

            # SECURITY CHECK: Signed URL and secret token must NEVER be exposed
            dumped = json.dumps(data)
            self.assertNotIn("SECRET", dumped)
            self.assertNotIn("Signature", dumped)
            self.assertNotIn("Location", data)
            mock_res.close.assert_called_once()

    @patch("requests.get")
    def test_download_preflight_status_codes(self, mock_get):
        """Test 401, 404, 412, 429, and 504 error statuses."""
        bhoonidhi_service._access_token = "active_valid_token"
        bhoonidhi_service._expires_at = time.time() + 3600.0

        status_expectations = [
            (401, "unauthorized"),
            (404, "not_found"),
            (412, "precondition_failed"),
            (429, "rate_limited"),
            (504, "gateway_timeout")
        ]

        with patch.dict(os.environ, {"BHOONIDHI_USER_ID": "test_user", "BHOONIDHI_PASSWORD": "test_password"}):
            settings.BHOONIDHI_USER_ID = "test_user"
            settings.BHOONIDHI_PASSWORD = "test_password"

            item_id = "NISAR_S2_PR_GCOV_029_040_A_015_3700_DHNA_A_20260827T230526_20260827T230602_P00500_M_F_I_001"

            for code, expected_status in status_expectations:
                mock_res = MagicMock()
                mock_res.status_code = code
                mock_res.headers = {"Content-Type": "application/json"}
                mock_get.return_value = mock_res

                res = client.post(f"/api/nisar/scenes/{item_id}/download-preflight")
                self.assertEqual(res.status_code, 200)
                data = res.json()
                self.assertFalse(data["success"])
                self.assertEqual(data["http_status_code"], code)
                self.assertEqual(data["preflight_status"], expected_status)
                self.assertFalse(data["download_confirmed"])
                mock_res.close.assert_called()


if __name__ == "__main__":
    unittest.main()



