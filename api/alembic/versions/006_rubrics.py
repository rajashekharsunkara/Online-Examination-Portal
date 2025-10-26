"""Add grading rubrics

Revision ID: 006
Revises: 005
Create Date: 2024

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade():
    # Create rubric_type enum
    rubric_type_enum = postgresql.ENUM(
        'analytical', 'holistic', 'checklist',
        name='rubrictype',
        create_type=True
    )
    rubric_type_enum.create(op.get_bind(), checkfirst=True)
    
    # Create scoring_method enum
    scoring_method_enum = postgresql.ENUM(
        'points', 'percentage', 'levels',
        name='scoringmethod',
        create_type=True
    )
    scoring_method_enum.create(op.get_bind(), checkfirst=True)
    
    # Create rubrics table
    op.create_table(
        'rubrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('rubric_type', rubric_type_enum, nullable=False),
        sa.Column('scoring_method', scoring_method_enum, nullable=False),
        sa.Column('max_score', sa.Float(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_rubrics_id'), 'rubrics', ['id'], unique=False)
    op.create_index(op.f('ix_rubrics_created_by'), 'rubrics', ['created_by'], unique=False)
    
    # Create rubric_criteria table
    op.create_table(
        'rubric_criteria',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('rubric_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('max_points', sa.Float(), nullable=False),
        sa.Column('weight', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['rubric_id'], ['rubrics.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_rubric_criteria_id'), 'rubric_criteria', ['id'], unique=False)
    op.create_index(op.f('ix_rubric_criteria_rubric_id'), 'rubric_criteria', ['rubric_id'], unique=False)
    
    # Create rubric_levels table
    op.create_table(
        'rubric_levels',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('criterion_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('points', sa.Float(), nullable=False),
        sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['criterion_id'], ['rubric_criteria.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_rubric_levels_id'), 'rubric_levels', ['id'], unique=False)
    op.create_index(op.f('ix_rubric_levels_criterion_id'), 'rubric_levels', ['criterion_id'], unique=False)
    
    # Create question_rubrics table (many-to-many)
    op.create_table(
        'question_rubrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('question_id', sa.Integer(), nullable=False),
        sa.Column('rubric_id', sa.Integer(), nullable=False),
        sa.Column('is_required', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['rubric_id'], ['rubrics.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('question_id', 'rubric_id', name='uq_question_rubric')
    )
    op.create_index(op.f('ix_question_rubrics_id'), 'question_rubrics', ['id'], unique=False)
    op.create_index(op.f('ix_question_rubrics_question_id'), 'question_rubrics', ['question_id'], unique=False)
    op.create_index(op.f('ix_question_rubrics_rubric_id'), 'question_rubrics', ['rubric_id'], unique=False)
    
    # Create grading_feedback table
    op.create_table(
        'grading_feedback',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('answer_id', sa.Integer(), nullable=False),
        sa.Column('rubric_id', sa.Integer(), nullable=False),
        sa.Column('graded_by', sa.Integer(), nullable=False),
        sa.Column('comments', sa.Text(), nullable=True),
        sa.Column('total_score', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['answer_id'], ['student_answers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['rubric_id'], ['rubrics.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['graded_by'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_grading_feedback_id'), 'grading_feedback', ['id'], unique=False)
    op.create_index(op.f('ix_grading_feedback_answer_id'), 'grading_feedback', ['answer_id'], unique=False)
    op.create_index(op.f('ix_grading_feedback_graded_by'), 'grading_feedback', ['graded_by'], unique=False)
    
    # Create criterion_scores table
    op.create_table(
        'criterion_scores',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('feedback_id', sa.Integer(), nullable=False),
        sa.Column('criterion_id', sa.Integer(), nullable=False),
        sa.Column('level_id', sa.Integer(), nullable=True),
        sa.Column('points_awarded', sa.Float(), nullable=False),
        sa.Column('comments', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['feedback_id'], ['grading_feedback.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['criterion_id'], ['rubric_criteria.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['level_id'], ['rubric_levels.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_criterion_scores_id'), 'criterion_scores', ['id'], unique=False)
    op.create_index(op.f('ix_criterion_scores_feedback_id'), 'criterion_scores', ['feedback_id'], unique=False)


def downgrade():
    # Drop tables in reverse order
    op.drop_index(op.f('ix_criterion_scores_feedback_id'), table_name='criterion_scores')
    op.drop_index(op.f('ix_criterion_scores_id'), table_name='criterion_scores')
    op.drop_table('criterion_scores')
    
    op.drop_index(op.f('ix_grading_feedback_graded_by'), table_name='grading_feedback')
    op.drop_index(op.f('ix_grading_feedback_answer_id'), table_name='grading_feedback')
    op.drop_index(op.f('ix_grading_feedback_id'), table_name='grading_feedback')
    op.drop_table('grading_feedback')
    
    op.drop_index(op.f('ix_question_rubrics_rubric_id'), table_name='question_rubrics')
    op.drop_index(op.f('ix_question_rubrics_question_id'), table_name='question_rubrics')
    op.drop_index(op.f('ix_question_rubrics_id'), table_name='question_rubrics')
    op.drop_table('question_rubrics')
    
    op.drop_index(op.f('ix_rubric_levels_criterion_id'), table_name='rubric_levels')
    op.drop_index(op.f('ix_rubric_levels_id'), table_name='rubric_levels')
    op.drop_table('rubric_levels')
    
    op.drop_index(op.f('ix_rubric_criteria_rubric_id'), table_name='rubric_criteria')
    op.drop_index(op.f('ix_rubric_criteria_id'), table_name='rubric_criteria')
    op.drop_table('rubric_criteria')
    
    op.drop_index(op.f('ix_rubrics_created_by'), table_name='rubrics')
    op.drop_index(op.f('ix_rubrics_id'), table_name='rubrics')
    op.drop_table('rubrics')
    
    # Drop enums
    sa.Enum(name='scoringmethod').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='rubrictype').drop(op.get_bind(), checkfirst=True)
