"""
Add encryption columns to sensitive tables

Revision ID: 5ba6d7fb7273
Revises: e7a307cdc854
Create Date: 2024

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '5ba6d7fb7273'
down_revision = 'e7a307cdc854'
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade():
    """Add encryption fields for end-to-end encrypted answer submissions"""
    
    # Add encryption_salt column (base64-encoded 16-byte salt)
    op.add_column(
        'student_attempts',
        sa.Column('encryption_salt', sa.String(length=64), nullable=True)
    )
    
    # Add encrypted_final_answers column (base64-encoded encrypted payload)
    op.add_column(
        'student_attempts',
        sa.Column('encrypted_final_answers', sa.Text(), nullable=True)
    )
    
    # Add encryption_timestamp for key derivation
    op.add_column(
        'student_attempts',
        sa.Column('encryption_timestamp', sa.DateTime(), nullable=True)
    )
    
    # Add encryption_checksum for verification (SHA-256 hex)
    op.add_column(
        'student_attempts',
        sa.Column('encryption_checksum', sa.String(length=64), nullable=True)
    )
    
    # Create index on encryption_salt for lookup
    op.create_index(
        'idx_student_attempts_encryption_salt',
        'student_attempts',
        ['encryption_salt']
    )


def downgrade():
    """Remove encryption fields"""
    
    # Drop index
    op.drop_index('idx_student_attempts_encryption_salt', table_name='student_attempts')
    
    # Drop columns
    op.drop_column('student_attempts', 'encryption_checksum')
    op.drop_column('student_attempts', 'encryption_timestamp')
    op.drop_column('student_attempts', 'encrypted_final_answers')
    op.drop_column('student_attempts', 'encryption_salt')
