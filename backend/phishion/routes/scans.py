from datetime import UTC, datetime, time, timedelta

from flask import Blueprint, current_app, jsonify, request

from ..auth import login_required
from ..extensions import db
from ..models import Scan
from ..security import csrf_protect
from ..services.threat_intel import UpstreamError, virus_total
from ..validators import is_valid_scan_url

bp = Blueprint("scans", __name__, url_prefix="/api")


def utc_day_bounds(now=None):
    current = now or datetime.now(UTC)
    start = datetime.combine(current.date(), time.min)
    end = start + timedelta(days=1)
    return start, end


def daily_scan_count(user_id):
    start, end = utc_day_bounds()
    return Scan.query.filter(
        Scan.user_id == user_id,
        Scan.scanned_at >= start,
        Scan.scanned_at < end,
    ).count()


def _refresh(scan):
    if scan.status not in {"queued", "running"} or not scan.vt_analysis_id:
        return
    payload = virus_total.analysis(scan.vt_analysis_id)
    attributes = payload.get("data", {}).get("attributes", {})
    status = attributes.get("status", "queued")
    if status != "completed":
        scan.status = "running" if status == "in-progress" else "queued"
        db.session.commit()
        return
    if scan.vt_url_id:
        result = virus_total.url_result(scan.vt_url_id)
    else:
        result = payload
    stats = result.get("data", {}).get("attributes", {}).get(
        "last_analysis_stats", attributes.get("stats", {})
    )
    scan.status = "completed"
    scan.malicious = int(stats.get("malicious", 0))
    scan.suspicious = int(stats.get("suspicious", 0))
    scan.harmless = int(stats.get("harmless", 0))
    scan.verdict = (
        "malicious" if scan.malicious else "suspicious" if scan.suspicious else "clean"
    )
    scan.result = result
    scan.completed_at = datetime.now(UTC).replace(tzinfo=None)
    db.session.commit()


@bp.post("/scan")
@login_required
@csrf_protect
def submit_scan(user):
    data = request.get_json(silent=True)
    if not isinstance(data, dict) or not is_valid_scan_url(data.get("url")):
        return jsonify({"error": "A valid HTTP(S) URL is required"}), 400
    url = data["url"].strip()
    db.session.refresh(user, with_for_update=True)
    count = daily_scan_count(user.id)
    limit = current_app.config["DAILY_SCAN_LIMIT"]
    if count >= limit:
        return jsonify({"error": f"Daily scan limit reached ({limit} per day)"}), 429
    try:
        submission = virus_total.submit_url(url)
    except UpstreamError as exc:
        return jsonify({"error": str(exc)}), exc.status
    scan = Scan(
        user_id=user.id,
        scanned_url=url,
        vt_analysis_id=submission["analysis_id"],
        vt_url_id=submission.get("url_id"),
        status="queued",
    )
    db.session.add(scan)
    db.session.commit()
    return jsonify({"scan": scan.to_dict(), "remaining": limit - count - 1}), 202


@bp.get("/scans")
@login_required
def history(user):
    scans = Scan.query.filter_by(user_id=user.id).order_by(Scan.scanned_at.desc()).all()
    return jsonify({"scans": [scan.to_dict() for scan in scans]})


@bp.get("/scans/<int:scan_id>")
@login_required
def detail(user, scan_id):
    scan = Scan.query.filter_by(id=scan_id, user_id=user.id).first()
    if scan is None:
        return jsonify({"error": "Scan not found"}), 404
    try:
        _refresh(scan)
    except UpstreamError as exc:
        current_app.logger.warning("scan refresh failed", extra={"scan_id": scan.id})
        if scan.status == "queued":
            return jsonify({"scan": scan.to_dict(), "warning": str(exc)}), 200
    return jsonify({"scan": scan.to_dict(include_result=True)})
