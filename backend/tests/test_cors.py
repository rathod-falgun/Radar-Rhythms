"""
Unit and regression tests for CORS configuration and origin validation.
"""

import unittest
from fastapi.testclient import TestClient
from app.main import app, parse_cors_origins


class TestCORSConfiguration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app, raise_server_exceptions=False)
        cls.vercel_origin = "https://radar-rhythms.vercel.app"
        cls.disallowed_origin = "https://unauthorized-domain.com"
        cls.localhost_origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
        ]

    def test_allowed_vercel_origin_success_response(self):
        """Allowed Vercel origin receives the correct Access-Control-Allow-Origin header."""
        res = self.client.get("/api/health", headers={"Origin": self.vercel_origin})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers.get("access-control-allow-origin"), self.vercel_origin)
        self.assertEqual(res.headers.get("access-control-allow-credentials"), "true")

    def test_preflight_options_request(self):
        """Preflight OPTIONS request from Vercel origin returns 200 with required CORS headers."""
        res = self.client.options(
            "/api/observations",
            headers={
                "Origin": self.vercel_origin,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "content-type,authorization",
            },
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers.get("access-control-allow-origin"), self.vercel_origin)
        self.assertIn("GET", res.headers.get("access-control-allow-methods", ""))
        self.assertEqual(res.headers.get("access-control-allow-credentials"), "true")

    def test_disallowed_origin_not_granted_access(self):
        """Disallowed origins must not receive an Access-Control-Allow-Origin header."""
        res = self.client.get("/api/health", headers={"Origin": self.disallowed_origin})
        self.assertEqual(res.status_code, 200)
        self.assertIsNone(res.headers.get("access-control-allow-origin"))

    def test_existing_localhost_origins_continue_to_work(self):
        """Existing local development origins must receive appropriate CORS headers."""
        for local_origin in self.localhost_origins:
            res = self.client.get("/api/health", headers={"Origin": local_origin})
            self.assertEqual(res.status_code, 200)
            self.assertEqual(
                res.headers.get("access-control-allow-origin"),
                local_origin,
                f"Failed for local origin: {local_origin}",
            )

    def test_error_responses_404_receive_cors_headers(self):
        """404 Not Found error responses must include CORS headers for allowed origins."""
        res = self.client.get("/api/nonexistent-endpoint-route", headers={"Origin": self.vercel_origin})
        self.assertEqual(res.status_code, 404)
        self.assertEqual(res.headers.get("access-control-allow-origin"), self.vercel_origin)

    def test_error_responses_422_receive_cors_headers(self):
        """422 Validation error responses must include CORS headers for allowed origins."""
        res = self.client.get(
            "/api/compare?threshold_db=invalid-not-a-number",
            headers={"Origin": self.vercel_origin},
        )
        self.assertEqual(res.status_code, 422)
        self.assertEqual(res.headers.get("access-control-allow-origin"), self.vercel_origin)

    def test_unhandled_500_errors_receive_cors_headers(self):
        """Unhandled 500 server errors must also include CORS headers for allowed origins."""
        # Create a transient route that throws an unhandled exception
        @app.get("/api/test-simulated-500-error")
        def throw_unhandled():
            raise RuntimeError("Simulated crash for CORS verification")

        res = self.client.get("/api/test-simulated-500-error", headers={"Origin": self.vercel_origin})
        self.assertEqual(res.status_code, 500)
        self.assertEqual(res.headers.get("access-control-allow-origin"), self.vercel_origin)
        self.assertEqual(res.headers.get("access-control-allow-credentials"), "true")

        # Disallowed origin on 500 must not receive CORS header
        dis_res = self.client.get("/api/test-simulated-500-error", headers={"Origin": self.disallowed_origin})
        self.assertEqual(dis_res.status_code, 500)
        self.assertIsNone(dis_res.headers.get("access-control-allow-origin"))

    def test_parse_cors_origins_variations(self):
        """parse_cors_origins handles comma, semicolon, space, trailing slash, and quotes cleanly."""
        # Comma separated
        o1 = parse_cors_origins("https://a.com, https://b.com")
        self.assertEqual(o1, ["https://a.com", "https://b.com"])

        # Semicolon separated
        o2 = parse_cors_origins("https://a.com;https://b.com")
        self.assertEqual(o2, ["https://a.com", "https://b.com"])

        # Space separated
        o3 = parse_cors_origins("https://a.com https://b.com")
        self.assertEqual(o3, ["https://a.com", "https://b.com"])

        # Trailing slashes stripped
        o4 = parse_cors_origins("https://radar-rhythms.vercel.app/")
        self.assertEqual(o4, ["https://radar-rhythms.vercel.app"])

        # Surrounding quotes stripped
        o5 = parse_cors_origins('"https://radar-rhythms.vercel.app"')
        self.assertEqual(o5, ["https://radar-rhythms.vercel.app"])

        # Bracketed JSON array format
        o6 = parse_cors_origins('["https://radar-rhythms.vercel.app", "http://localhost:5173"]')
        self.assertEqual(o6, ["https://radar-rhythms.vercel.app", "http://localhost:5173"])

        # Empty/None returns empty list
        self.assertEqual(parse_cors_origins(""), [])
        self.assertEqual(parse_cors_origins(None), [])


if __name__ == "__main__":
    unittest.main()

