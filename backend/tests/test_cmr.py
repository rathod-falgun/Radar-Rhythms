"""
Tests for NASA Earthdata CMR Integration and Multi-Provider Scene Search
NASA Space Apps Challenge 2026 — Brahmaputra FloodWatch
"""

import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.services.cmr_service import cmr_service

client = TestClient(app)


class TestCMREarthdataIntegration(unittest.TestCase):
    """Verifies NASA Earthdata CMR service methods, status reporting, and API endpoints."""

    def test_cmr_status(self):
        """get_status must report available and free public access without credentials."""
        status = cmr_service.get_status()
        self.assertEqual(status["service"], "NASA Earthdata CMR Search API")
        self.assertFalse(status["auth_required"])
        self.assertTrue(status["free_public_access"])
        self.assertEqual(status["status"], "available")

    @patch("requests.get")
    def test_cmr_search_granules_mock(self, mock_get):
        """search_granules must query CMR endpoint and return normalized FeatureCollection."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "feed": {
                "entry": [
                    {
                        "title": "NISAR_L2_PR_GCOV_004_004_A_018_4005_DHDH_A_20251029T111130_20251029T111153_P05023_N_P_J_001",
                        "time_start": "2025-10-29T11:11:30.000Z",
                        "time_end": "2025-10-29T11:11:53.000Z",
                        "granule_size": "4519.13",
                        "boxes": ["25.0 91.0 28.0 95.0"],
                        "links": [
                            {"href": "https://nisar.asf.earthdatacloud.nasa.gov/sample.h5"},
                            {"href": "s3://sds-n-cumulus-prod-nisar-products/sample.h5"}
                        ]
                    }
                ]
            }
        }
        mock_get.return_value = mock_resp

        res = cmr_service.search_granules(bbox=[91.0, 25.0, 95.0, 28.0], limit=5)
        self.assertEqual(res["type"], "FeatureCollection")
        self.assertEqual(res["provider"], "NASA Earthdata CMR")
        self.assertEqual(res["total_scenes"], 1)
        self.assertEqual(len(res["features"]), 1)
        self.assertEqual(len(res["scenes"]), 1)

        feat = res["features"][0]
        self.assertEqual(feat["properties"]["platform"], "NISAR")
        self.assertIn("LSAR", feat["properties"]["instrument"])
        self.assertFalse(feat["properties"]["auth_required"])
        self.assertIn("https://nisar.asf.earthdatacloud.nasa.gov", feat["properties"]["download_url"])
        self.assertIn("s3://", feat["properties"]["s3_uri"])

    @patch("requests.get")
    def test_cmr_search_granules_network_error(self, mock_get):
        """search_granules must handle network errors gracefully without crashing."""
        import requests
        mock_get.side_effect = requests.exceptions.ConnectionError("Network unavailable")

        res = cmr_service.search_granules(limit=5)
        self.assertEqual(res["type"], "FeatureCollection")
        self.assertEqual(res["total_scenes"], 0)
        self.assertIn("Network error", res["message"])

    @patch("requests.get")
    def test_scenes_route_with_cmr_collection(self, mock_get):
        """POST /api/nisar/scenes with NISAR_L2_GCOV_PROVISIONAL_V1 routes to NASA CMR."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "feed": {
                "entry": [
                    {
                        "title": "NISAR_L2_PR_GCOV_004_004_A_136_7700_SHNA_A_20251029T121824_20251029T121857_P05023_N_P_J_001",
                        "time_start": "2025-10-29T12:18:24.000Z",
                        "granule_size": "661.67",
                        "links": [{"href": "https://nisar.asf.earthdatacloud.nasa.gov/test.h5"}]
                    }
                ]
            }
        }
        mock_get.return_value = mock_resp

        res = client.post("/api/nisar/scenes", json={"collection": "NISAR_L2_GCOV_PROVISIONAL_V1"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["provider"], "NASA Earthdata CMR")
        self.assertEqual(data["total_scenes"], 1)

    def test_status_endpoint_reports_multi_provider(self):
        """GET /api/nisar/status must report both Bhoonidhi and NASA CMR status."""
        res = client.get("/api/nisar/status")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("providers", data)
        self.assertIn("isro_bhoonidhi", data["providers"])
        self.assertIn("nasa_cmr", data["providers"])
        self.assertEqual(data["providers"]["nasa_cmr"]["service"], "NASA Earthdata CMR Search API")
        self.assertFalse(data["providers"]["nasa_cmr"]["auth_required"])

    def test_inspect_endpoint_reports_provider_mode(self):
        """GET /api/nisar/inspect must return inspection_mode and provider tags."""
        res = client.get("/api/nisar/inspect?date_str=2026-07-09")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("inspection_mode", data)
        self.assertIn("provider", data)
        self.assertEqual(data["inspection_mode"], "local_reference_container")

    def test_observation_detail_reports_provenance(self):
        """GET /api/observations/{date_str} must report data provenance and online catalog info."""
        res = client.get("/api/observations/2026-07-09")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("data_origin", data)
        self.assertIn("online_catalog_provider", data)
        self.assertEqual(data["data_origin"], "local_validated")


if __name__ == "__main__":
    unittest.main()

