from flask import Blueprint, jsonify

from ..auth import login_required
from ..services.threat_intel import UpstreamError, security_trails
from ..validators import is_valid_hostname, normalize_hostname

bp = Blueprint("domains", __name__, url_prefix="/api")


@bp.get("/domain/<hostname>")
@login_required
def subdomains(user, hostname):
    del user
    if not is_valid_hostname(hostname):
        return jsonify({"error": "Invalid hostname"}), 400
    try:
        return jsonify(security_trails.subdomains(normalize_hostname(hostname)))
    except UpstreamError as exc:
        return jsonify({"error": str(exc)}), exc.status
