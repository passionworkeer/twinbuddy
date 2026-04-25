from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "004_add_messages_tables"
down_revision = "003_add_follows_table"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "conversations",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("user_a_id", sa.String(length=64), nullable=False),
        sa.Column("user_b_id", sa.String(length=64), nullable=False),
        sa.Column("last_message", sa.Text(), nullable=True),
        sa.Column("unread_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.BigInteger(), nullable=False),
    )
    op.create_table(
        "messages",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("conversation_id", sa.String(length=64), nullable=False),
        sa.Column("sender_id", sa.String(length=64), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("type", sa.String(length=20), nullable=False, server_default=sa.text("'text'")),
        sa.Column("created_at", sa.BigInteger(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("messages")
    op.drop_table("conversations")
