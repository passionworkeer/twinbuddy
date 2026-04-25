from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "002_add_blind_games_table"
down_revision = "001_add_posts_table"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "blind_games",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("negotiation_id", sa.String(length=64), nullable=False),
        sa.Column("user_a_choices", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("user_b_choices", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("user_a_decision", sa.String(length=20), nullable=True),
        sa.Column("user_b_decision", sa.String(length=20), nullable=True),
        sa.Column("match_score", sa.Float(), nullable=True),
        sa.Column("created_at", sa.BigInteger(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("blind_games")
