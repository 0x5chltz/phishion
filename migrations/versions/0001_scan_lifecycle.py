"""Create core schema and add scan lifecycle fields.

Revision ID: 0001_scan_lifecycle
Revises:
Create Date: 2026-08-21
"""

from alembic import op
import sqlalchemy as sa

revision = "0001_scan_lifecycle"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "users" not in tables:
        op.create_table(
            "users",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("username", sa.String(80), nullable=False, unique=True),
            sa.Column("email", sa.String(120), nullable=False, unique=True),
        )

    if "scans" not in tables:
        op.create_table(
            "scans",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("scanned_url", sa.Text(), nullable=False),
            sa.Column("scanned_at", sa.DateTime(), nullable=False),
            sa.Column("status", sa.String(20), nullable=False, server_default="queued"),
            sa.Column("vt_analysis_id", sa.String(255), unique=True),
            sa.Column("vt_url_id", sa.String(255)),
            sa.Column("verdict", sa.String(20)),
            sa.Column("malicious", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("suspicious", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("harmless", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("result", sa.JSON()),
            sa.Column("error", sa.Text()),
            sa.Column("completed_at", sa.DateTime()),
        )
    else:
        existing = {column["name"] for column in inspector.get_columns("scans")}
        columns = {
            "status": sa.Column("status", sa.String(20), nullable=False, server_default="queued"),
            "vt_analysis_id": sa.Column("vt_analysis_id", sa.String(255)),
            "vt_url_id": sa.Column("vt_url_id", sa.String(255)),
            "verdict": sa.Column("verdict", sa.String(20)),
            "malicious": sa.Column("malicious", sa.Integer(), nullable=False, server_default="0"),
            "suspicious": sa.Column("suspicious", sa.Integer(), nullable=False, server_default="0"),
            "harmless": sa.Column("harmless", sa.Integer(), nullable=False, server_default="0"),
            "result": sa.Column("result", sa.JSON()),
            "error": sa.Column("error", sa.Text()),
            "completed_at": sa.Column("completed_at", sa.DateTime()),
        }
        with op.batch_alter_table("scans") as batch:
            for name, column in columns.items():
                if name not in existing:
                    batch.add_column(column)

    inspector = sa.inspect(bind)
    indexes = {index["name"] for index in inspector.get_indexes("scans")}
    if "ix_scans_user_scanned_at" not in indexes:
        op.create_index("ix_scans_user_scanned_at", "scans", ["user_id", "scanned_at"])
    if "uq_scans_vt_analysis_id" not in indexes:
        op.create_index(
            "uq_scans_vt_analysis_id",
            "scans",
            ["vt_analysis_id"],
            unique=True,
        )


def downgrade():
    op.drop_index("uq_scans_vt_analysis_id", table_name="scans")
    op.drop_index("ix_scans_user_scanned_at", table_name="scans")
    with op.batch_alter_table("scans") as batch:
        for name in (
            "completed_at", "error", "result", "harmless", "suspicious",
            "malicious", "verdict", "vt_url_id", "vt_analysis_id", "status",
        ):
            batch.drop_column(name)
