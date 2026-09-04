from datetime import UTC, datetime, timedelta

from flask import Blueprint, current_app, jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash

from ..auth import current_user, login_required
from ..extensions import db
from ..models import User
from ..security import csrf_protect, csrf_token
from ..validators import (
    is_valid_email,
    is_valid_username,
    normalize_email,
    password_problem,
)

bp = Blueprint("auth", __name__)

# Generic on purpose. Saying "no such account" would turn the login form into
# an account enumeration oracle.
INVALID_CREDENTIALS = "Invalid email or password"

MAX_FAILED_LOGINS = 5
LOCKOUT_SECONDS = 900

# Comparing against a real hash of a throwaway value keeps the unknown-email
# path roughly as expensive as the known-email path, so response time does not
# reveal whether an account exists.
_DUMMY_HASH = generate_password_hash("phishion-timing-equaliser")


def _now():
    return datetime.now(UTC).replace(tzinfo=None)


def _is_locked(user):
    if user.failed_login_count < MAX_FAILED_LOGINS or not user.last_failed_login_at:
        return False
    unlocks_at = user.last_failed_login_at + timedelta(seconds=LOCKOUT_SECONDS)
    if _now() >= unlocks_at:
        # Window elapsed, start the count over.
        user.failed_login_count = 0
        user.last_failed_login_at = None
        db.session.commit()
        return False
    return True


def _record_failure(user):
    user.failed_login_count = (user.failed_login_count or 0) + 1
    user.last_failed_login_at = _now()
    db.session.commit()


def _clear_failures(user):
    if user.failed_login_count or user.last_failed_login_at:
        user.failed_login_count = 0
        user.last_failed_login_at = None
        db.session.commit()


def _start_session(user):
    # Clear before writing so a pre-existing session id cannot be fixated onto
    # the freshly authenticated user.
    session.clear()
    session.update(username=user.username, user_email=user.email)
    csrf_token()


@bp.get("/api/csrf")
def get_csrf():
    return jsonify({"csrf_token": csrf_token()})


@bp.post("/api/register")
@csrf_protect
def register():
    data = request.get_json(silent=True) or {}
    email = normalize_email(data.get("email"))
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not is_valid_email(email):
        return jsonify({"error": "A valid email address is required"}), 400
    if not is_valid_username(username):
        return jsonify({
            "error": "Username must be 3 to 80 characters, letters, digits, dot, underscore or hyphen"
        }), 400
    problem = password_problem(password)
    if problem:
        return jsonify({"error": problem}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "That email is already registered"}), 409
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "That username is already taken"}), 409

    user = User(username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    _start_session(user)
    return jsonify({"user": user.to_dict()}), 201


@bp.post("/api/login")
@csrf_protect
def login():
    data = request.get_json(silent=True) or {}
    email = normalize_email(data.get("email"))
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": INVALID_CREDENTIALS}), 401

    user = User.query.filter_by(email=email).first()
    if user is None:
        # Burn a comparable amount of CPU so an unknown address is not
        # distinguishable from a wrong password by response time.
        check_password_hash(_DUMMY_HASH, password)
        return jsonify({"error": INVALID_CREDENTIALS}), 401

    if _is_locked(user):
        return jsonify({
            "error": "Too many failed sign-in attempts. Try again later."
        }), 429

    if not user.check_password(password):
        _record_failure(user)
        current_app.logger.info("failed login attempt")
        return jsonify({"error": INVALID_CREDENTIALS}), 401

    _clear_failures(user)
    _start_session(user)
    return jsonify({"user": user.to_dict()})


@bp.get("/api/userinfo")
def userinfo():
    user = current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    return jsonify(user.to_dict())


@bp.post("/api/logout")
@csrf_protect
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})


@bp.post("/api/delete")
@login_required
@csrf_protect
def delete_account(user):
    db.session.delete(user)
    db.session.commit()
    session.clear()
    return jsonify({"message": "Account deleted"})
