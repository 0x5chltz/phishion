from flask import Blueprint, jsonify
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from ..extensions import db

bp = Blueprint("health", __name__, url_prefix="/api")


@bp.get("")
def index():
    return jsonify({"message": "Welcome to the Phishion API"})


@bp.get("/health")
def health():
    try:
        db.session.execute(text("SELECT 1"))
    except (SQLAlchemyError, RuntimeError):
        db.session.rollback()
        return jsonify({"status": "unavailable"}), 503
    return jsonify({"status": "ok"})
