from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "005_add_style_vector"
down_revision = "004_add_messages_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "user_profiles" not in inspector.get_table_names():
        op.create_table(
            "user_profiles",
            sa.Column("id", sa.String(length=64), primary_key=True),
            sa.Column("nickname", sa.String(length=80), nullable=True),
            sa.Column("style_vector", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
            sa.Column("created_at", sa.BigInteger(), nullable=False, server_default=sa.text("0")),
        )
        return

    columns = {column["name"] for column in inspector.get_columns("user_profiles")}
    if "style_vector" not in columns:
        op.add_column("user_profiles", sa.Column("style_vector", sa.JSON(), nullable=False, server_default=sa.text("'{}'")))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "user_profiles" not in inspector.get_table_names():
        return
    columns = {column["name"] for column in inspector.get_columns("user_profiles")}
    if "style_vector" in columns:
        op.drop_column("user_profiles", "style_vector")
