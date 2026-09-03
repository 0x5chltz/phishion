from datetime import UTC, datetime

from .extensions import db


def utcnow():
    return datetime.now(UTC).replace(tzinfo=None)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    scans = db.relationship(
        "Scan", back_populates="user", cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {"id": self.id, "username": self.username, "email": self.email}


class Scan(db.Model):
    __tablename__ = "scans"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    scanned_url = db.Column(db.Text, nullable=False)
    scanned_at = db.Column(db.DateTime, default=utcnow, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="queued")
    vt_analysis_id = db.Column(db.String(255), unique=True)
    vt_url_id = db.Column(db.String(255))
    verdict = db.Column(db.String(20))
    malicious = db.Column(db.Integer, nullable=False, default=0)
    suspicious = db.Column(db.Integer, nullable=False, default=0)
    harmless = db.Column(db.Integer, nullable=False, default=0)
    result = db.Column(db.JSON)
    error = db.Column(db.Text)
    completed_at = db.Column(db.DateTime)

    user = db.relationship("User", back_populates="scans")
    tags = db.relationship("ScanTag", secondary="scan_tags_assoc", back_populates="scans")

    __table_args__ = (
        db.Index("ix_scans_user_scanned_at", "user_id", "scanned_at"),
    )

    def to_dict(self, include_result=False):
        payload = {
            "id": self.id,
            "url": self.scanned_url,
            "status": self.status,
            "verdict": self.verdict,
            "malicious": self.malicious,
            "suspicious": self.suspicious,
            "harmless": self.harmless,
            "error": self.error,
            "scanned_at": self.scanned_at.isoformat() + "Z",
            "completed_at": (
                self.completed_at.isoformat() + "Z" if self.completed_at else None
            ),
            "tags": [tag.to_dict() for tag in self.tags],
        }
        if include_result:
            payload["result"] = self.result
        return payload


scan_tags_assoc = db.Table(
    "scan_tags_assoc",
    db.Column("scan_id", db.Integer, db.ForeignKey("scans.id"), primary_key=True),
    db.Column("tag_id", db.Integer, db.ForeignKey("scan_tags.id"), primary_key=True),
)


class ScanTag(db.Model):
    __tablename__ = "scan_tags"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    color = db.Column(db.String(7), default="#808080")
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False)

    scans = db.relationship("Scan", secondary="scan_tags_assoc", back_populates="tags")
    user = db.relationship("User")

    __table_args__ = (
        db.UniqueConstraint("user_id", "name", name="uq_user_tag"),
        db.Index("ix_tags_user", "user_id"),
    )

    def to_dict(self):
        return {"id": self.id, "name": self.name, "color": self.color}


class URLWhitelist(db.Model):
    __tablename__ = "url_whitelist"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    url_pattern = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False)

    user = db.relationship("User")

    __table_args__ = (
        db.UniqueConstraint("user_id", "url_pattern", name="uq_user_whitelist_url"),
        db.Index("ix_whitelist_user", "user_id"),
    )


class URLBlacklist(db.Model):
    __tablename__ = "url_blacklist"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    url_pattern = db.Column(db.Text, nullable=False)
    reason = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False)

    user = db.relationship("User")

    __table_args__ = (
        db.UniqueConstraint("user_id", "url_pattern", name="uq_user_blacklist_url"),
        db.Index("ix_blacklist_user", "user_id"),
    )


class ScheduledScan(db.Model):
    __tablename__ = "scheduled_scans"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    url = db.Column(db.Text, nullable=False)
    frequency = db.Column(db.String(20), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    last_scanned_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False)

    user = db.relationship("User")

    __table_args__ = (
        db.Index("ix_scheduled_user", "user_id"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "url": self.url,
            "frequency": self.frequency,
            "is_active": self.is_active,
            "last_scanned_at": self.last_scanned_at.isoformat() + "Z" if self.last_scanned_at else None,
            "created_at": self.created_at.isoformat() + "Z",
        }


class UserPreferences(db.Model):
    __tablename__ = "user_preferences"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    theme = db.Column(db.String(20), default="light")
    timezone = db.Column(db.String(50), default="UTC")
    email_notifications = db.Column(db.Boolean, default=True)
    scan_completion_notifications = db.Column(db.Boolean, default=True)
    daily_digest = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

    user = db.relationship("User")

    def to_dict(self):
        return {
            "theme": self.theme,
            "timezone": self.timezone,
            "email_notifications": self.email_notifications,
            "scan_completion_notifications": self.scan_completion_notifications,
            "daily_digest": self.daily_digest,
        }


class APIUsage(db.Model):
    __tablename__ = "api_usage"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    endpoint = db.Column(db.String(100), nullable=False)
    method = db.Column(db.String(10), nullable=False)
    status_code = db.Column(db.Integer)
    timestamp = db.Column(db.DateTime, default=utcnow, nullable=False)

    user = db.relationship("User")

    __table_args__ = (
        db.Index("ix_api_usage_user", "user_id"),
        db.Index("ix_api_usage_timestamp", "timestamp"),
    )
