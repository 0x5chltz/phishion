from functools import wraps

from flask import jsonify, session

from .models import User


def current_user():
    email = session.get("user_email")
    return User.query.filter_by(email=email).first() if email else None


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        user = current_user()
        if user is None:
            return jsonify({"error": "Unauthorized"}), 401
        return view(user, *args, **kwargs)

    return wrapped
