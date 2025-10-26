"""Add student attempts and answers tables

Revision ID: 3a0b46eb5c1e
Revises: 25c1e9f9ef32
Create Date: 2024-01-15 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON


# revision identifiers, used by Alembic.
revision = '3a0b46eb5c1e'
down_revision = '25c1e9f9ef32'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create student_attempts table
    op.create_table(
        'student_attempts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('exam_id', sa.Integer(), nullable=False),
        
        # Status and timing
        sa.Column('status', sa.String(length=20), nullable=False, server_default='not_started'),
        sa.Column('start_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('submit_time', sa.DateTime(timezone=True), nullable=True),
        
        # Time management
        sa.Column('duration_minutes', sa.Integer(), nullable=False),
        sa.Column('time_remaining_seconds', sa.Integer(), nullable=True),
        sa.Column('last_activity_time', sa.DateTime(timezone=True), nullable=True),
        
        # Workstation tracking
        sa.Column('workstation_id', sa.String(length=100), nullable=True),
        sa.Column('initial_workstation_id', sa.String(length=100), nullable=True),
        sa.Column('transfer_count', sa.Integer(), nullable=False, server_default='0'),
        
        # Progress tracking
        sa.Column('current_question_id', sa.Integer(), nullable=True),
        sa.Column('questions_answered', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('questions_flagged', JSON, nullable=True),
        
        # Scoring
        sa.Column('total_marks', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('marks_obtained', sa.Float(), nullable=True),
        sa.Column('percentage', sa.Float(), nullable=True),
        sa.Column('is_passed', sa.Boolean(), nullable=True),
        
        # Grading
        sa.Column('auto_graded', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('graded_by', sa.Integer(), nullable=True),
        sa.Column('graded_at', sa.DateTime(timezone=True), nullable=True),
        
        # Metadata
        sa.Column('browser_info', JSON, nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        
        sa.ForeignKeyConstraint(['student_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['exam_id'], ['exams.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['current_question_id'], ['questions.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['graded_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Indexes for student_attempts
    op.create_index('ix_student_attempts_student_id', 'student_attempts', ['student_id'])
    op.create_index('ix_student_attempts_exam_id', 'student_attempts', ['exam_id'])
    op.create_index('ix_student_attempts_status', 'student_attempts', ['status'])
    op.create_index('ix_student_attempts_created_at', 'student_attempts', ['created_at'])
    op.create_index('ix_student_attempts_student_exam', 'student_attempts', ['student_id', 'exam_id'])
    
    # Create student_answers table
    op.create_table(
        'student_answers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('attempt_id', sa.Integer(), nullable=False),
        sa.Column('question_id', sa.Integer(), nullable=False),
        
        # Answer content
        sa.Column('answer', JSON, nullable=True),
        
        # Metadata
        sa.Column('is_flagged', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('time_spent_seconds', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('answer_sequence', sa.Integer(), nullable=False, server_default='1'),
        
        # Scoring
        sa.Column('is_correct', sa.Boolean(), nullable=True),
        sa.Column('marks_awarded', sa.Float(), nullable=True),
        sa.Column('auto_graded', sa.Boolean(), nullable=False, server_default='false'),
        
        # Timestamps
        sa.Column('first_answered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        
        sa.ForeignKeyConstraint(['attempt_id'], ['student_attempts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('attempt_id', 'question_id', name='uq_attempt_question')
    )
    
    # Indexes for student_answers
    op.create_index('ix_student_answers_attempt_id', 'student_answers', ['attempt_id'])
    op.create_index('ix_student_answers_question_id', 'student_answers', ['question_id'])
    op.create_index('ix_student_answers_is_correct', 'student_answers', ['is_correct'])


def downgrade() -> None:
    op.drop_table('student_answers')
    op.drop_table('student_attempts')
