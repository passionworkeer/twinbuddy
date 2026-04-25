from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "003_add_follows_table"
down_revision = "002_add_blind_games_table"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "follows",
        sa.Column("follower_id", sa.String(length=64), nullable=False),
        sa.Column("following_id", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.BigInteger(), nullable=False),
        sa.PrimaryKeyConstraint("follower_id", "following_id"),
    )


def downgrade() -> None:
    op.drop_table("follows")
