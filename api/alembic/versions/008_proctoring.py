"""Add proctoring events and question timings

Revision ID: 008_proctoring
Revises: 007_ap_iti_system
Create Date: 2025-01-12

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '008_proctoring'
down_revision = '007_ap_iti_system'
branch_labels = None
depends_on = None


def upgrade():
    # Create proctoring_events table
    op.create_table(
        'proctoring_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('attempt_id', sa.Integer(), nullable=False),
        sa.Column('event_type', sa.String(50), nullable=False),
        sa.Column('event_timestamp', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('question_id', sa.Integer(), nullable=True),
        sa.Column('event_data', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('severity', sa.String(20), nullable=False, server_default='info'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['attempt_id'], ['student_attempts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for efficient querying
    op.create_index('ix_proctoring_events_attempt_id', 'proctoring_events', ['attempt_id'])
    op.create_index('ix_proctoring_events_event_type', 'proctoring_events', ['event_type'])
    op.create_index('ix_proctoring_events_severity', 'proctoring_events', ['severity'])
    op.create_index('ix_proctoring_events_timestamp', 'proctoring_events', ['event_timestamp'])
    
    # Create question_timings table
    op.create_table(
        'question_timings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('attempt_id', sa.Integer(), nullable=False),
        sa.Column('question_id', sa.Integer(), nullable=False),
        sa.Column('first_viewed_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('last_viewed_at', sa.DateTime(), nullable=True),
        sa.Column('total_time_seconds', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('answer_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('first_answered_at', sa.DateTime(), nullable=True),
        sa.Column('last_answered_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['attempt_id'], ['student_attempts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for question timings
    op.create_index('ix_question_timings_attempt_id', 'question_timings', ['attempt_id'])
    op.create_index('ix_question_timings_question_id', 'question_timings', ['question_id'])
    
    # Create unique constraint to prevent duplicate timings for same attempt-question pair
    op.create_index(
        'ix_question_timings_unique_attempt_question', 
        'question_timings', 
        ['attempt_id', 'question_id'], 
        unique=True
    )


def downgrade():
    # Drop indexes first
    op.drop_index('ix_question_timings_unique_attempt_question', table_name='question_timings')
    op.drop_index('ix_question_timings_question_id', table_name='question_timings')
    op.drop_index('ix_question_timings_attempt_id', table_name='question_timings')
    
    op.drop_index('ix_proctoring_events_timestamp', table_name='proctoring_events')
    op.drop_index('ix_proctoring_events_severity', table_name='proctoring_events')
    op.drop_index('ix_proctoring_events_event_type', table_name='proctoring_events')
    op.drop_index('ix_proctoring_events_attempt_id', table_name='proctoring_events')
    
    # Drop tables
    op.drop_table('question_timings')
    op.drop_table('proctoring_events')
