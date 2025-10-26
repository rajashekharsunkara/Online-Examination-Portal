"""Add AP ITI system: district to centers, trade_id to users

Revision ID: 007_ap_iti_system
Revises: 006_rubrics
Create Date: 2025-10-26 08:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '007_ap_iti_system'
down_revision = '006_rubrics'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add district column to centers table
    op.add_column('centers', sa.Column('district', sa.String(100), nullable=True))
    op.create_index('ix_centers_district', 'centers', ['district'])
    
    # Add trade_id column to users table
    op.add_column('users', sa.Column('trade_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_users_trade_id', 'users', 'trades', ['trade_id'], ['id'], ondelete='SET NULL')
    op.create_index('ix_users_trade_id', 'users', ['trade_id'])


def downgrade() -> None:
    # Remove trade_id from users
    op.drop_index('ix_users_trade_id', 'users')
    op.drop_constraint('fk_users_trade_id', 'users', type_='foreignkey')
    op.drop_column('users', 'trade_id')
    
    # Remove district from centers
    op.drop_index('ix_centers_district', 'centers')
    op.drop_column('centers', 'district')
