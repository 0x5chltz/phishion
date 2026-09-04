"""replace google oauth with password authentication

Adds the password_hash and created_at columns to users. password_hash is
nullable because accounts provisioned by the previous Google OAuth flow never
had one; those rows keep loading but cannot sign in until a password is set.

Revision ID: 0003_password_auth
Revises: 0002_advanced_features
Create Date: 2026-09-04 12:00:00.000000

"""
import sqlalchemy as sa
from alembic import op

revision = "0003_password_auth"
down_revision = "0002_advanced_features"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("password_hash", sa.String(length=255), nullable=True))
    op.add_column(
        "users",
        sa.Column("failed_login_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column("users", sa.Column("last_failed_login_at", sa.DateTime(), nullable=True))
    op.add_column(
        "users",
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )


def downgrade():
    op.drop_column("users", "last_failed_login_at")
    op.drop_column("users", "failed_login_count")
    op.drop_column("users", "created_at")
    op.drop_column("users", "password_hash")
