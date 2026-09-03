import os
from datetime import timedelta


class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv("SECRET_KEY")
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
    VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY")
    SECURITYTRAILS_API_KEY = os.getenv("SECURITYTRAILS_API_KEY")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
    CORS_ORIGINS = [origin.strip() for origin in os.getenv(
        "CORS_ORIGINS", FRONTEND_URL
    ).split(",") if origin.strip()]
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
