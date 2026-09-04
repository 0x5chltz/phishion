import csv
import io
from datetime import datetime

from flask import Blueprint, current_app, jsonify, request

from ..auth import login_required
from ..extensions import db
from ..models import (
    APIUsage,
    Scan,
    ScanTag,
    ScheduledScan,
    URLBlacklist,
    URLWhitelist,
    UserPreferences,
)
from ..security import csrf_protect
from ..services.threat_intel import UpstreamError, virus_total
from ..validators import is_valid_scan_url
from .scans import daily_scan_count

bp = Blueprint("features", __name__, url_prefix="/api")


@bp.post("/batch-scan")
@login_required
@csrf_protect
def batch_scan(user):
    data = request.get_json(silent=True)
    if not isinstance(data, dict) or not isinstance(data.get("urls"), list):
        return jsonify({"error": "URLs array is required"}), 400

    urls = [url.strip() for url in data.get("urls", []) if isinstance(url, str)]
    max_batch_size = current_app.config.get("MAX_BATCH_SIZE", 10)

    if len(urls) == 0:
        return jsonify({"error": "At least one URL is required"}), 400
    if len(urls) > max_batch_size:
        return jsonify({"error": f"Maximum {max_batch_size} URLs per batch"}), 400

    invalid = [u for u in urls if not is_valid_scan_url(u)]
    if invalid:
        return jsonify({"error": f"Invalid URLs: {', '.join(invalid[:3])}"}), 400

    db.session.refresh(user, with_for_update=True)
    count = daily_scan_count(user.id)
    limit = current_app.config["DAILY_SCAN_LIMIT"]
    remaining_quota = limit - count
    if remaining_quota <= 0:
        return jsonify({"error": f"Daily scan limit reached ({limit} per day)"}), 429
    if len(urls) > remaining_quota:
        return jsonify({
            "error": f"Cannot scan {len(urls)} URLs. Only {remaining_quota} scans remaining today"
        }), 429

    scans, errors = [], []
    for url in urls:
        try:
            submission = virus_total.submit_url(url)
            scan = Scan(
                user_id=user.id,
                scanned_url=url,
                vt_analysis_id=submission["analysis_id"],
                vt_url_id=submission.get("url_id"),
                status="queued",
            )
            db.session.add(scan)
            db.session.flush()
            scans.append(scan.to_dict())
        except UpstreamError as exc:
            errors.append({"url": url, "error": str(exc)})

    db.session.commit()
    return jsonify({
        "scans": scans,
        "errors": errors,
        "total": len(scans),
    }), 202


@bp.post("/tags")
@login_required
@csrf_protect
def create_tag(user):
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    color = data.get("color", "#808080")

    if not name or len(name) > 50:
        return jsonify({"error": "Tag name required (max 50 chars)"}), 400

    existing = ScanTag.query.filter_by(user_id=user.id, name=name).first()
    if existing:
        return jsonify({"error": "Tag already exists"}), 400

    tag = ScanTag(user_id=user.id, name=name, color=color)
    db.session.add(tag)
    db.session.commit()
    return jsonify({"tag": tag.to_dict()}), 201


@bp.get("/tags")
@login_required
def list_tags(user):
    tags = ScanTag.query.filter_by(user_id=user.id).all()
    return jsonify({"tags": [tag.to_dict() for tag in tags]})


@bp.post("/scans/<int:scan_id>/tags/<int:tag_id>")
@login_required
@csrf_protect
def add_tag_to_scan(user, scan_id, tag_id):
    scan = Scan.query.filter_by(id=scan_id, user_id=user.id).first()
    tag = ScanTag.query.filter_by(id=tag_id, user_id=user.id).first()

    if not scan or not tag:
        return jsonify({"error": "Scan or tag not found"}), 404

    if tag not in scan.tags:
        scan.tags.append(tag)
        db.session.commit()

    return jsonify({"scan": scan.to_dict()})


@bp.post("/whitelist")
@login_required
@csrf_protect
def add_whitelist(user):
    data = request.get_json(silent=True) or {}
    url_pattern = data.get("url_pattern", "").strip()

    if not url_pattern:
        return jsonify({"error": "URL pattern required"}), 400

    existing = URLWhitelist.query.filter_by(user_id=user.id, url_pattern=url_pattern).first()
    if existing:
        return jsonify({"error": "Already whitelisted"}), 400

    whitelist = URLWhitelist(user_id=user.id, url_pattern=url_pattern)
    db.session.add(whitelist)
    db.session.commit()
    return jsonify({"id": whitelist.id, "url": url_pattern}), 201


@bp.get("/whitelist")
@login_required
def get_whitelist(user):
    whitelist = URLWhitelist.query.filter_by(user_id=user.id).all()
    return jsonify({"whitelist": [{"id": w.id, "url": w.url_pattern} for w in whitelist]})


@bp.delete("/whitelist/<int:wl_id>")
@login_required
@csrf_protect
def remove_whitelist(user, wl_id):
    whitelist = URLWhitelist.query.filter_by(id=wl_id, user_id=user.id).first()
    if not whitelist:
        return jsonify({"error": "Not found"}), 404
    db.session.delete(whitelist)
    db.session.commit()
    return jsonify({"success": True})


@bp.post("/blacklist")
@login_required
@csrf_protect
def add_blacklist(user):
    data = request.get_json(silent=True) or {}
    url_pattern = data.get("url_pattern", "").strip()
    reason = data.get("reason", "").strip()

    if not url_pattern:
        return jsonify({"error": "URL pattern required"}), 400

    existing = URLBlacklist.query.filter_by(user_id=user.id, url_pattern=url_pattern).first()
    if existing:
        return jsonify({"error": "Already blacklisted"}), 400

    blacklist = URLBlacklist(user_id=user.id, url_pattern=url_pattern, reason=reason)
    db.session.add(blacklist)
    db.session.commit()
    return jsonify({"id": blacklist.id, "url": url_pattern, "reason": reason}), 201


@bp.get("/blacklist")
@login_required
def get_blacklist(user):
    blacklist = URLBlacklist.query.filter_by(user_id=user.id).all()
    return jsonify({"blacklist": [{"id": b.id, "url": b.url_pattern, "reason": b.reason} for b in blacklist]})


@bp.post("/scheduled-scans")
@login_required
@csrf_protect
def create_scheduled_scan(user):
    data = request.get_json(silent=True) or {}
    url = data.get("url", "").strip()
    frequency = data.get("frequency", "daily")

    if not url or not is_valid_scan_url(url):
        return jsonify({"error": "Valid URL required"}), 400

    if frequency not in ["daily", "weekly", "monthly"]:
        return jsonify({"error": "Invalid frequency"}), 400

    scan = ScheduledScan(user_id=user.id, url=url, frequency=frequency)
    db.session.add(scan)
    db.session.commit()
    return jsonify({"scan": scan.to_dict()}), 201


@bp.get("/scheduled-scans")
@login_required
def list_scheduled_scans(user):
    scans = ScheduledScan.query.filter_by(user_id=user.id).all()
    return jsonify({"scans": [scan.to_dict() for scan in scans]})


@bp.put("/scheduled-scans/<int:scan_id>")
@login_required
@csrf_protect
def update_scheduled_scan(user, scan_id):
    data = request.get_json(silent=True) or {}
    scan = ScheduledScan.query.filter_by(id=scan_id, user_id=user.id).first()

    if not scan:
        return jsonify({"error": "Not found"}), 404

    if "is_active" in data:
        scan.is_active = data.get("is_active", True)
    if "frequency" in data:
        scan.frequency = data.get("frequency", "daily")

    db.session.commit()
    return jsonify({"scan": scan.to_dict()})


@bp.delete("/scheduled-scans/<int:scan_id>")
@login_required
@csrf_protect
def delete_scheduled_scan(user, scan_id):
    scan = ScheduledScan.query.filter_by(id=scan_id, user_id=user.id).first()
    if not scan:
        return jsonify({"error": "Not found"}), 404
    db.session.delete(scan)
    db.session.commit()
    return jsonify({"success": True})


@bp.get("/preferences")
@login_required
def get_preferences(user):
    prefs = UserPreferences.query.filter_by(user_id=user.id).first()
    if not prefs:
        prefs = UserPreferences(user_id=user.id)
        db.session.add(prefs)
        db.session.commit()
    return jsonify({"preferences": prefs.to_dict()})


@bp.put("/preferences")
@login_required
@csrf_protect
def update_preferences(user):
    data = request.get_json(silent=True) or {}
    prefs = UserPreferences.query.filter_by(user_id=user.id).first()

    if not prefs:
        prefs = UserPreferences(user_id=user.id)
        db.session.add(prefs)

    for key in ["theme", "timezone", "email_notifications", "scan_completion_notifications", "daily_digest"]:
        if key in data:
            setattr(prefs, key, data[key])

    db.session.commit()
    return jsonify({"preferences": prefs.to_dict()})


@bp.get("/analytics")
@login_required
def get_analytics(user):
    scans = Scan.query.filter_by(user_id=user.id).all()
    total = len(scans)
    completed = len([s for s in scans if s.status == "completed"])
    malicious_count = sum(s.malicious for s in scans if s.malicious)
    suspicious_count = sum(s.suspicious for s in scans if s.suspicious)

    verdicts = {"malicious": 0, "suspicious": 0, "clean": 0}
    for scan in scans:
        if scan.verdict:
            verdicts[scan.verdict] = verdicts.get(scan.verdict, 0) + 1

    return jsonify({
        "analytics": {
            "total_scans": total,
            "completed_scans": completed,
            "malicious_count": malicious_count,
            "suspicious_count": suspicious_count,
            "verdicts": verdicts,
        }
    })


@bp.get("/scans/search")
@login_required
def search_scans(user):
    query = request.args.get("q", "").strip()
    verdict = request.args.get("verdict", "").strip()
    date_from = request.args.get("date_from", "").strip()
    date_to = request.args.get("date_to", "").strip()

    q = Scan.query.filter_by(user_id=user.id)

    if query:
        q = q.filter(Scan.scanned_url.ilike(f"%{query}%"))
    if verdict:
        q = q.filter_by(verdict=verdict)
    if date_from:
        try:
            q = q.filter(Scan.scanned_at >= datetime.fromisoformat(date_from))
        except ValueError:
            return jsonify({"error": "Invalid date_from"}), 400
    if date_to:
        try:
            q = q.filter(Scan.scanned_at <= datetime.fromisoformat(date_to))
        except ValueError:
            return jsonify({"error": "Invalid date_to"}), 400

    scans = q.order_by(Scan.scanned_at.desc()).all()
    return jsonify({"scans": [scan.to_dict() for scan in scans]})


@bp.get("/scans/<int:scan_id>/compare/<int:scan_id2>")
@login_required
def compare_scans(user, scan_id, scan_id2):
    scan1 = Scan.query.filter_by(id=scan_id, user_id=user.id).first()
    scan2 = Scan.query.filter_by(id=scan_id2, user_id=user.id).first()

    if not scan1 or not scan2:
        return jsonify({"error": "Scans not found"}), 404

    return jsonify({
        "scan1": scan1.to_dict(include_result=True),
        "scan2": scan2.to_dict(include_result=True),
        "comparison": {
            "verdict_match": scan1.verdict == scan2.verdict,
            "malicious_diff": abs(scan1.malicious - scan2.malicious),
            "suspicious_diff": abs(scan1.suspicious - scan2.suspicious),
        }
    })


@bp.get("/scans/export/csv")
@login_required
def export_csv(user):
    scans = Scan.query.filter_by(user_id=user.id).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "URL", "Status", "Verdict", "Malicious", "Suspicious", "Harmless", "Scanned At"])

    for scan in scans:
        writer.writerow([
            scan.id, scan.scanned_url, scan.status, scan.verdict or "N/A",
            scan.malicious, scan.suspicious, scan.harmless, scan.scanned_at
        ])

    return output.getvalue(), 200, {"Content-Type": "text/csv", "Content-Disposition": "attachment; filename=scans.csv"}


@bp.get("/scans/export/json")
@login_required
def export_json(user):
    scans = Scan.query.filter_by(user_id=user.id).all()
    data = [scan.to_dict(include_result=True) for scan in scans]
    return jsonify({"scans": data})


@bp.post("/scans/import")
@login_required
@csrf_protect
def import_urls(user):
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if not file:
        return jsonify({"error": "Empty file"}), 400

    urls = []
    try:
        if file.filename.endswith(".csv"):
            stream = io.StringIO(file.stream.read().decode("utf-8"))
            reader = csv.reader(stream)
            next(reader)
            urls = [row[0] for row in reader if row and is_valid_scan_url(row[0])]
        elif file.filename.endswith(".txt"):
            urls = [line.strip() for line in file.stream.read().decode("utf-8").split("\n") if is_valid_scan_url(line.strip())]
    except Exception as e:
        return jsonify({"error": f"File parse error: {str(e)}"}), 400

    db.session.refresh(user, with_for_update=True)
    count = daily_scan_count(user.id)
    limit = current_app.config["DAILY_SCAN_LIMIT"]
    remaining_quota = max(0, limit - count)
    if remaining_quota <= 0:
        return jsonify({"error": f"Daily scan limit reached ({limit} per day)"}), 429

    importable = urls[:min(10, remaining_quota)]
    scans, errors = [], []
    for url in importable:
        try:
            submission = virus_total.submit_url(url)
            scan = Scan(user_id=user.id, scanned_url=url, vt_analysis_id=submission["analysis_id"], vt_url_id=submission.get("url_id"), status="queued")
            db.session.add(scan)
            db.session.flush()
            scans.append(scan.to_dict())
        except UpstreamError as exc:
            errors.append({"url": url, "error": str(exc)})

    db.session.commit()
    return jsonify({"scans": scans, "errors": errors, "total": len(scans), "skipped": len(urls) - len(scans) - len(errors)}), 202


@bp.get("/api-usage")
@login_required
def get_api_usage(user):
    usage = APIUsage.query.filter_by(user_id=user.id).order_by(APIUsage.timestamp.desc()).limit(100).all()
    return jsonify({"usage": [{"endpoint": u.endpoint, "method": u.method, "status": u.status_code, "timestamp": u.timestamp.isoformat()} for u in usage]})
