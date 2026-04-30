from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "001_add_posts_table"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "posts",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("user_id", sa.String(length=64), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("images", sa.JSON(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("tags", sa.JSON(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("location", sa.String(length=100), nullable=False),
        sa.Column("is_travel_plan", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("trip_date", sa.String(length=32), nullable=True),
        sa.Column("trip_days", sa.Integer(), nullable=True),
        sa.Column("trip_budget", sa.String(length=20), nullable=True),
        sa.Column("likes_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("comments_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.BigInteger(), nullable=False),
    )
    op.create_table(
        "comments",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("post_id", sa.String(length=64), nullable=False),
        sa.Column("user_id", sa.String(length=64), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.BigInteger(), nullable=False),
    )
    op.create_table(
        "post_likes",
        sa.Column("post_id", sa.String(length=64), nullable=False),
        sa.Column("user_id", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.BigInteger(), nullable=False),
        sa.PrimaryKeyConstraint("post_id", "user_id"),
    )


def downgrade() -> None:
    op.drop_table("post_likes")
    op.drop_table("comments")
    op.drop_table("posts")
