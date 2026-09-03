"""add advanced features models

Revision ID: 0002_advanced_features
Revises: 0001_scan_lifecycle
Create Date: 2026-09-03 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '0002_advanced_features'
down_revision = '0001_scan_lifecycle'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'scan_tags',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('color', sa.String(length=7), server_default='#808080', nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'name', name='uq_user_tag'),
    )
    op.create_index('ix_tags_user', 'scan_tags', ['user_id'])

    op.create_table(
        'scan_tags_assoc',
        sa.Column('scan_id', sa.Integer(), nullable=False),
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['scan_id'], ['scans.id'], ),
        sa.ForeignKeyConstraint(['tag_id'], ['scan_tags.id'], ),
        sa.PrimaryKeyConstraint('scan_id', 'tag_id'),
    )

    op.create_table(
        'url_whitelist',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('url_pattern', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'url_pattern', name='uq_user_whitelist_url'),
    )
    op.create_index('ix_whitelist_user', 'url_whitelist', ['user_id'])

    op.create_table(
        'url_blacklist',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('url_pattern', sa.Text(), nullable=False),
        sa.Column('reason', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'url_pattern', name='uq_user_blacklist_url'),
    )
    op.create_index('ix_blacklist_user', 'url_blacklist', ['user_id'])

    op.create_table(
        'scheduled_scans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('url', sa.Text(), nullable=False),
        sa.Column('frequency', sa.String(length=20), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='True', nullable=True),
        sa.Column('last_scanned_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_scheduled_user', 'scheduled_scans', ['user_id'])

    op.create_table(
        'user_preferences',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('theme', sa.String(length=20), server_default='light', nullable=True),
        sa.Column('timezone', sa.String(length=50), server_default='UTC', nullable=True),
        sa.Column('email_notifications', sa.Boolean(), server_default='True', nullable=True),
        sa.Column('scan_completion_notifications', sa.Boolean(), server_default='True', nullable=True),
        sa.Column('daily_digest', sa.Boolean(), server_default='False', nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
    )

    op.create_table(
        'api_usage',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('endpoint', sa.String(length=100), nullable=False),
        sa.Column('method', sa.String(length=10), nullable=False),
        sa.Column('status_code', sa.Integer(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_api_usage_timestamp', 'api_usage', ['timestamp'])
    op.create_index('ix_api_usage_user', 'api_usage', ['user_id'])


def downgrade():
    op.drop_index('ix_api_usage_user', table_name='api_usage')
    op.drop_index('ix_api_usage_timestamp', table_name='api_usage')
    op.drop_table('api_usage')
    op.drop_table('user_preferences')
    op.drop_index('ix_scheduled_user', table_name='scheduled_scans')
    op.drop_table('scheduled_scans')
    op.drop_index('ix_blacklist_user', table_name='url_blacklist')
    op.drop_table('url_blacklist')
    op.drop_index('ix_whitelist_user', table_name='url_whitelist')
    op.drop_table('url_whitelist')
    op.drop_table('scan_tags_assoc')
    op.drop_index('ix_tags_user', table_name='scan_tags')
    op.drop_table('scan_tags')
