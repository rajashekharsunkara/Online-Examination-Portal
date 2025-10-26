"""Add exam management tables

Revision ID: 25c1e9f9ef32
Revises: e96833f0736b
Create Date: 2024-01-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON


# revision identifiers, used by Alembic.
revision = '25c1e9f9ef32'
down_revision = 'e96833f0736b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create trades table
    op.create_table(
        'trades',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    op.create_index('ix_trades_code', 'trades', ['code'])
    op.create_index('ix_trades_is_active', 'trades', ['is_active'])

    # Create question_banks table
    op.create_table(
        'question_banks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('trade_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['trade_id'], ['trades.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_question_banks_trade_id', 'question_banks', ['trade_id'])

    # Create questions table
    op.create_table(
        'questions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('question_bank_id', sa.Integer(), nullable=False),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('question_type', sa.String(length=50), nullable=False),
        sa.Column('options', JSON, nullable=True),
        sa.Column('correct_answer', JSON, nullable=False),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('difficulty', sa.String(length=20), nullable=False, server_default='medium'),
        sa.Column('marks', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('negative_marks', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('tags', JSON, nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['question_bank_id'], ['question_banks.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_questions_question_bank_id', 'questions', ['question_bank_id'])
    op.create_index('ix_questions_difficulty', 'questions', ['difficulty'])
    op.create_index('ix_questions_question_type', 'questions', ['question_type'])

    # Create exams table
    op.create_table(
        'exams',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('trade_id', sa.Integer(), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=False),
        sa.Column('total_marks', sa.Float(), nullable=False),
        sa.Column('passing_marks', sa.Float(), nullable=False),
        sa.Column('instructions', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='draft'),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['trade_id'], ['trades.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_exams_trade_id', 'exams', ['trade_id'])
    op.create_index('ix_exams_status', 'exams', ['status'])
    op.create_index('ix_exams_created_by', 'exams', ['created_by'])

    # Create exam_questions table (association table with ordering)
    op.create_table(
        'exam_questions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('exam_id', sa.Integer(), nullable=False),
        sa.Column('question_id', sa.Integer(), nullable=False),
        sa.Column('order_number', sa.Integer(), nullable=False),
        sa.Column('marks_override', sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(['exam_id'], ['exams.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('exam_id', 'question_id', name='uq_exam_question')
    )
    op.create_index('ix_exam_questions_exam_id', 'exam_questions', ['exam_id'])
    op.create_index('ix_exam_questions_order', 'exam_questions', ['exam_id', 'order_number'])


def downgrade() -> None:
    op.drop_table('exam_questions')
    op.drop_table('exams')
    op.drop_table('questions')
    op.drop_table('question_banks')
    op.drop_table('trades')
