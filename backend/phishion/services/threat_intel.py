import time

import requests
from flask import current_app

from . import cache as cache_module


class UpstreamError(Exception):
    def __init__(self, message, status=502):
        super().__init__(message)
        self.status = status


def _request(method, url, **kwargs):
    timeout = current_app.config["EXTERNAL_HTTP_TIMEOUT"]
    for attempt in range(3):
        try:
            response = requests.request(method, url, timeout=timeout, **kwargs)
        except requests.RequestException as exc:
            if attempt == 2:
                raise UpstreamError("Threat intelligence service unavailable") from exc
            time.sleep(0.1 * (2 ** attempt))
            continue
        if response.status_code == 429:
            if attempt == 2:
                raise UpstreamError("Threat intelligence rate limit reached", 429)
            retry_after = min(float(response.headers.get("Retry-After", "0.1")), 2)
            time.sleep(retry_after)
            continue
        if response.status_code >= 500 and attempt < 2:
            time.sleep(0.1 * (2 ** attempt))
            continue
        if not response.ok:
            raise UpstreamError("Threat intelligence request failed", 502)
        try:
            return response.json()
        except ValueError as exc:
            raise UpstreamError("Invalid threat intelligence response") from exc
    raise UpstreamError("Threat intelligence service unavailable")


class VirusTotalService:
    base_url = "https://www.virustotal.com/api/v3"

    def _headers(self):
        return {"x-apikey": current_app.config["VIRUSTOTAL_API_KEY"]}

    def submit_url(self, url):
        payload = _request(
            "POST", f"{self.base_url}/urls", headers=self._headers(), data={"url": url}
        )
        analysis_id = payload.get("data", {}).get("id")
        if not analysis_id:
            raise UpstreamError("Invalid VirusTotal submission response")
        parts = analysis_id.split("-")
        url_id = parts[1] if len(parts) >= 2 else None
        return {"analysis_id": analysis_id, "url_id": url_id}

    def analysis(self, analysis_id):
        return _request(
            "GET", f"{self.base_url}/analyses/{analysis_id}", headers=self._headers()
        )

    def url_result(self, url_id):
        return _request(
            "GET", f"{self.base_url}/urls/{url_id}", headers=self._headers()
        )


class SecurityTrailsService:
    base_url = "https://api.securitytrails.com/v1"

    def subdomains(self, hostname):
        key = f"subdomains:{hostname}"
        cached = cache_module.cache.get(key)
        if cached is not None:
            return cached
        result = _request(
            "GET",
            f"{self.base_url}/domain/{hostname}/subdomains",
            headers={
                "accept": "application/json",
                "apikey": current_app.config["SECURITYTRAILS_API_KEY"],
            },
        )
        cache_module.cache.set(key, result, current_app.config["CACHE_TTL_SECONDS"])
        return result


virus_total = VirusTotalService()
security_trails = SecurityTrailsService()
