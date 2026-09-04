import json
import logging
import uuid

from flask import Flask, g, jsonify, request
from flask_cors import CORS

from .config import CONFIGS, Config
from .extensions import db, migrate


def _configure_logging(app):
    class JsonFormatter(logging.Formatter):
        def format(self, record):
            return json.dumps({
                "level": record.levelname,
                "message": record.getMessage(),
                "logger": record.name,
            })

    if not app.testing:
        handler = logging.StreamHandler()
        handler.setFormatter(JsonFormatter())
        app.logger.handlers = [handler]
        app.logger.setLevel(logging.INFO)


def create_app(config_name=None):
    app = Flask(__name__)
    app.config.from_object(CONFIGS.get(config_name, Config))

    required = ("SECRET_KEY", "SQLALCHEMY_DATABASE_URI")
    missing = [name for name in required if not app.config.get(name)]
    if missing:
        raise RuntimeError(f"Missing required configuration: {', '.join(missing)}")

    db.init_app(app)
    migrate.init_app(app, db)
    CORS(
        app,
        origins=app.config["CORS_ORIGINS"],
        supports_credentials=True,
        allow_headers=["Content-Type", "X-CSRF-Token", "X-Request-ID"],
    )
    _configure_logging(app)
    from .services.cache import configure_cache

    configure_cache(app.config["REDIS_URL"])

    from .routes.auth import bp as auth_bp
    from .routes.domains import bp as domains_bp
    from .routes.features import bp as features_bp
    from .routes.health import bp as health_bp
    from .routes.scans import bp as scans_bp

    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(scans_bp)
    app.register_blueprint(domains_bp)
    app.register_blueprint(features_bp)

    @app.before_request
    def request_context():
        g.request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))

    @app.after_request
    def response_headers(response):
        response.headers["X-Request-ID"] = g.request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "same-origin"
        response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
        if app.config.get("SESSION_COOKIE_SECURE"):
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
        return response

    @app.errorhandler(404)
    def not_found(error):
        del error
        return jsonify({"error": "Not found", "request_id": g.request_id}), 404

    @app.errorhandler(Exception)
    def internal_error(error):
        app.logger.exception("Unhandled request error")
        return jsonify({
            "error": "Internal server error",
            "request_id": g.request_id,
        }), 500

    return app
