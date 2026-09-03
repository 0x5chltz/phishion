from flask import Blueprint, current_app, jsonify, redirect, session, url_for

from ..auth import current_user, login_required
from ..extensions import db, oauth
from ..models import User
from ..security import csrf_protect, csrf_token

bp = Blueprint("auth", __name__)


@bp.get("/api/csrf")
def get_csrf():
    return jsonify({"csrf_token": csrf_token()})


@bp.get("/login/google")
def login_google():
    return oauth.google.authorize_redirect(url_for("auth.callback_google", _external=True))


@bp.get("/callback/google")
def callback_google():
    oauth.google.authorize_access_token()
    response = oauth.google.get(oauth.google.server_metadata["userinfo_endpoint"])
    info = response.json()
    email = info["email"]
    username = email.split("@", 1)[0]
    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(username=username, email=email)
        db.session.add(user)
        db.session.commit()
    session.clear()
    session.update(username=user.username, user_email=user.email)
    csrf_token()
    return redirect(f"{current_app.config['FRONTEND_URL']}/app")


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
