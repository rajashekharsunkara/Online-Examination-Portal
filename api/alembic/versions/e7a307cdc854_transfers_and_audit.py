"""004_transfers_and_audit

Revision ID: e7a307cdc854
Revises: 3a0b46eb5c1e
Create Date: 2024-01-01 12:00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'e7a307cdc854'
down_revision = '3a0b46eb5c1e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create transfers table
    op.create_table(
        'transfers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('attempt_id', sa.Integer(), nullable=False),
        sa.Column('from_workstation', sa.String(length=50), nullable=False),
        sa.Column('to_workstation', sa.String(length=50), nullable=False),
        sa.Column('requested_by_id', sa.Integer(), nullable=False),
        sa.Column('approved_by_id', sa.Integer(), nullable=True),
        sa.Column(
            'status',
            sa.Enum('pending', 'approved', 'rejected', 'completed', 'failed', name='transferstatus'),
            nullable=False
        ),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('migration_checksum', sa.String(length=64), nullable=True),
        sa.Column('answers_transferred', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('approved_at', sa.DateTime(), nullable=True),
        sa.Column('rejected_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['attempt_id'], ['student_attempts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['requested_by_id'], ['users.id']),
        sa.ForeignKeyConstraint(['approved_by_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for transfers
    op.create_index('ix_transfers_id', 'transfers', ['id'])
    op.create_index('ix_transfers_attempt_id', 'transfers', ['attempt_id'])
    op.create_index('ix_transfers_from_workstation', 'transfers', ['from_workstation'])
    op.create_index('ix_transfers_to_workstation', 'transfers', ['to_workstation'])
    op.create_index('ix_transfers_status', 'transfers', ['status'])
    
    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('event_type', sa.String(length=50), nullable=False),
        sa.Column('event_category', sa.String(length=50), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('username', sa.String(length=255), nullable=True),
        sa.Column('attempt_id', sa.Integer(), nullable=True),
        sa.Column('exam_id', sa.Integer(), nullable=True),
        sa.Column('transfer_id', sa.Integer(), nullable=True),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=500), nullable=True),
        sa.Column('success', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['attempt_id'], ['student_attempts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['exam_id'], ['exams.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['transfer_id'], ['transfers.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for audit_logs
    op.create_index('ix_audit_logs_id', 'audit_logs', ['id'])
    op.create_index('ix_audit_logs_event_type', 'audit_logs', ['event_type'])
    op.create_index('ix_audit_logs_event_category', 'audit_logs', ['event_category'])
    op.create_index('ix_audit_logs_user_id', 'audit_logs', ['user_id'])
    op.create_index('ix_audit_logs_attempt_id', 'audit_logs', ['attempt_id'])
    op.create_index('ix_audit_logs_exam_id', 'audit_logs', ['exam_id'])
    op.create_index('ix_audit_logs_transfer_id', 'audit_logs', ['transfer_id'])
    op.create_index('ix_audit_logs_created_at', 'audit_logs', ['created_at'])


def downgrade() -> None:
    # Drop audit_logs
    op.drop_index('ix_audit_logs_created_at', table_name='audit_logs')
    op.drop_index('ix_audit_logs_transfer_id', table_name='audit_logs')
    op.drop_index('ix_audit_logs_exam_id', table_name='audit_logs')
    op.drop_index('ix_audit_logs_attempt_id', table_name='audit_logs')
    op.drop_index('ix_audit_logs_user_id', table_name='audit_logs')
    op.drop_index('ix_audit_logs_event_category', table_name='audit_logs')
    op.drop_index('ix_audit_logs_event_type', table_name='audit_logs')
    op.drop_index('ix_audit_logs_id', table_name='audit_logs')
    op.drop_table('audit_logs')
    
    # Drop transfers
    op.drop_index('ix_transfers_status', table_name='transfers')
    op.drop_index('ix_transfers_to_workstation', table_name='transfers')
    op.drop_index('ix_transfers_from_workstation', table_name='transfers')
    op.drop_index('ix_transfers_attempt_id', table_name='transfers')
    op.drop_index('ix_transfers_id', table_name='transfers')
    op.drop_table('transfers')
    
    # Drop enum types
    op.execute('DROP TYPE transferstatus')
