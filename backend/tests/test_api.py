import os
import unittest
from unittest.mock import patch

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-client")
os.environ.setdefault("GOOGLE_CLIENT_SECRET", "test-secret")
os.environ.setdefault("VIRUSTOTAL_API_KEY", "test-vt")
os.environ.setdefault("SECURITYTRAILS_API_KEY", "test-st")

from datetime import UTC

from phishion import create_app
from phishion.extensions import db
from phishion.models import Scan, User
from phishion.routes.scans import utc_day_bounds


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app("testing")
        self.client = self.app.test_client()
        with self.app.app_context():
            db.create_all()
            user = User(username="alice", email="alice@example.com")
            db.session.add(user)
            db.session.commit()
            self.user_id = user.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()
            db.engine.dispose()

    def login(self):
        with self.client.session_transaction() as session:
            session["username"] = "alice"
            session["user_email"] = "alice@example.com"

    def csrf(self):
        response = self.client.get("/api/csrf")
        self.assertEqual(response.status_code, 200)
        return response.get_json()["csrf_token"]

    def test_daily_quota_uses_utc_day_boundaries(self):
        from datetime import datetime

        start, end = utc_day_bounds(datetime(2026, 8, 21, 23, 59, tzinfo=UTC))
        self.assertEqual(start.isoformat(), "2026-08-21T00:00:00")
        self.assertEqual(end.isoformat(), "2026-08-22T00:00:00")

    def test_health_reports_database_readiness(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["status"], "ok")
        self.assertTrue(response.headers.get("X-Request-ID"))

    @patch("phishion.routes.health.db.session.execute")
    def test_health_returns_503_when_database_is_unavailable(self, execute):
        execute.side_effect = RuntimeError("database unavailable")
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.get_json()["status"], "unavailable")

    def test_unknown_route_returns_generic_json_error(self):
        response = self.client.get("/api/does-not-exist")
        self.assertEqual(response.status_code, 404)
        body = response.get_json()
        self.assertEqual(body["error"], "Not found")
        self.assertTrue(body["request_id"])

    def test_cors_rejects_untrusted_origin(self):
        response = self.client.get(
            "/api/health", headers={"Origin": "https://attacker.example"}
        )
        self.assertNotIn("Access-Control-Allow-Origin", response.headers)

    def test_mutating_route_requires_csrf(self):
        self.login()
        response = self.client.post("/api/scan", json={"url": "https://example.com"})
        self.assertEqual(response.status_code, 403)

    @patch("phishion.routes.scans.virus_total.submit_url")
    def test_scan_submission_is_queued_and_owned(self, submit_url):
        submit_url.return_value = {
            "analysis_id": "analysis-1",
            "url_id": "url-1",
        }
        self.login()
        response = self.client.post(
            "/api/scan",
            json={"url": "https://example.com"},
            headers={"X-CSRF-Token": self.csrf()},
        )
        self.assertEqual(response.status_code, 202)
        body = response.get_json()
        self.assertEqual(body["scan"]["status"], "queued")
        self.assertEqual(body["remaining"], 4)

        with self.app.app_context():
            scan = db.session.get(Scan, body["scan"]["id"])
            self.assertEqual(scan.user_id, self.user_id)
            self.assertEqual(scan.vt_analysis_id, "analysis-1")

    @patch("phishion.services.threat_intel._request")
    def test_virus_total_submission_extracts_url_id(self, request_mock):
        from phishion.services.threat_intel import virus_total

        request_mock.return_value = {
            "data": {"id": "u-aHR0cHM6Ly9leGFtcGxlLmNvbQ-1700000000"}
        }
        with self.app.app_context():
            result = virus_total.submit_url("https://example.com")
        self.assertEqual(result["url_id"], "aHR0cHM6Ly9leGFtcGxlLmNvbQ")

    def test_scan_detail_rejects_other_users_scan(self):
        with self.app.app_context():
            scan = Scan(user_id=self.user_id, scanned_url="https://example.com")
            db.session.add(scan)
            db.session.commit()
            scan_id = scan.id
            db.session.add(User(username="bob", email="bob@example.com"))
            db.session.commit()

        with self.client.session_transaction() as session:
            session["username"] = "bob"
            session["user_email"] = "bob@example.com"

        response = self.client.get(f"/api/scans/{scan_id}")
        self.assertEqual(response.status_code, 404)

    @patch("phishion.routes.scans.virus_total.url_result")
    @patch("phishion.routes.scans.virus_total.analysis")
    def test_scan_detail_refreshes_completed_analysis(self, analysis, url_result):
        analysis.return_value = {
            "data": {"attributes": {"status": "completed", "stats": {}}}
        }
        url_result.return_value = {
            "data": {
                "attributes": {
                    "last_analysis_stats": {
                        "malicious": 2,
                        "suspicious": 1,
                        "harmless": 60,
                    }
                }
            }
        }
        with self.app.app_context():
            scan = Scan(
                user_id=self.user_id,
                scanned_url="https://example.com",
                status="queued",
                vt_analysis_id="analysis-1",
                vt_url_id="url-1",
            )
            db.session.add(scan)
            db.session.commit()
            scan_id = scan.id

        self.login()
        response = self.client.get(f"/api/scans/{scan_id}")
        self.assertEqual(response.status_code, 200)
        result = response.get_json()["scan"]
        self.assertEqual(result["status"], "completed")
        self.assertEqual(result["verdict"], "malicious")
        self.assertEqual(result["malicious"], 2)

    @patch("phishion.routes.features.virus_total.submit_url")
    def test_batch_scan_rejects_once_daily_quota_is_reached(self, submit_url):
        submit_url.return_value = {"analysis_id": "a", "url_id": "u"}
        with self.app.app_context():
            db.session.add_all([
                Scan(user_id=self.user_id, scanned_url=f"https://example.com/{i}")
                for i in range(5)
            ])
            db.session.commit()

        self.login()
        response = self.client.post(
            "/api/batch-scan",
            json={"urls": ["https://example.com/new"]},
            headers={"X-CSRF-Token": self.csrf()},
        )
        self.assertEqual(response.status_code, 429)
        submit_url.assert_not_called()

    @patch("phishion.routes.features.virus_total.submit_url")
    def test_batch_scan_is_capped_by_remaining_daily_quota(self, submit_url):
        submit_url.return_value = {"analysis_id": "a", "url_id": "u"}
        with self.app.app_context():
            db.session.add_all([
                Scan(user_id=self.user_id, scanned_url=f"https://example.com/{i}")
                for i in range(3)
            ])
            db.session.commit()

        self.login()
        response = self.client.post(
            "/api/batch-scan",
            json={"urls": ["https://a.example.com", "https://b.example.com", "https://c.example.com"]},
            headers={"X-CSRF-Token": self.csrf()},
        )
        self.assertEqual(response.status_code, 429)
        submit_url.assert_not_called()

    def test_history_only_returns_current_users_scans(self):
        with self.app.app_context():
            bob = User(username="bob", email="bob@example.com")
            db.session.add(bob)
            db.session.flush()
            db.session.add_all([
                Scan(user_id=self.user_id, scanned_url="https://mine.example.com"),
                Scan(user_id=bob.id, scanned_url="https://other.example.com"),
            ])
            db.session.commit()

        self.login()
        response = self.client.get("/api/scans")
        self.assertEqual(response.status_code, 200)
        scans = response.get_json()["scans"]
        self.assertEqual([scan["url"] for scan in scans], ["https://mine.example.com"])


if __name__ == "__main__":
    unittest.main()
