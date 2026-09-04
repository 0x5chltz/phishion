import os
from datetime import timedelta
from urllib.parse import urlsplit, urlunsplit

# localhost and 127.0.0.1 are different origins to a browser, so an app served
# on one and configured to allow only the other fails CORS. During local
# development you may reach the frontend by either name, so accept both.
# Nothing is widened here for real hosts: only loopback names get an alias.
_LOOPBACK_ALIASES = {"localhost": "127.0.0.1", "127.0.0.1": "localhost"}


def _with_loopback_aliases(origins):
    result = []
    for origin in origins:
        if origin not in result:
            result.append(origin)
        parts = urlsplit(origin)
        alias_host = _LOOPBACK_ALIASES.get(parts.hostname or "")
        if not alias_host:
            continue
        netloc = f"{alias_host}:{parts.port}" if parts.port else alias_host
        alias = urlunsplit((parts.scheme, netloc, parts.path, "", ""))
        if alias not in result:
            result.append(alias)
    return result


class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv("SECRET_KEY")
    VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY")
    SECURITYTRAILS_API_KEY = os.getenv("SECURITYTRAILS_API_KEY")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
    CORS_ORIGINS = _with_loopback_aliases(
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", FRONTEND_URL).split(",")
        if origin.strip()
    )
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = os.getenv("SESSION_COOKIE_SAMESITE", "Lax")
    SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true"
    PERMANENT_SESSION_LIFETIME = timedelta(hours=8)
    EXTERNAL_HTTP_TIMEOUT = float(os.getenv("EXTERNAL_HTTP_TIMEOUT", "15"))
    DAILY_SCAN_LIMIT = int(os.getenv("DAILY_SCAN_LIMIT", "5"))
    MAX_BATCH_SIZE = int(os.getenv("MAX_BATCH_SIZE", "10"))
    CACHE_TTL_SECONDS = int(os.getenv("CACHE_TTL_SECONDS", "300"))
    REDIS_URL = os.getenv("REDIS_URL", "")
    JSON_SORT_KEYS = False


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SECRET_KEY = "test-secret"
    SESSION_COOKIE_SECURE = False
    WTF_CSRF_ENABLED = True


CONFIGS = {"testing": TestingConfig}
