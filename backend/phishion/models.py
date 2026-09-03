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
        }
        if include_result:
            payload["result"] = self.result
        return payload
