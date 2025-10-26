"""
User and Role models for authentication and authorization
"""
from datetime import datetime
from typing import List
from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.core.database import Base

# Association table for many-to-many relationship between users and roles
user_roles = Table(
    'user_roles',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('role_id', Integer, ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True),
)


class Role(Base):
    """
    Role model for RBAC
    
    Roles: student, hall_auth, technician, hall_in_charge, admin
    """
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    users = relationship("User", secondary=user_roles, back_populates="roles")
    
    def __repr__(self):
        return f"<Role {self.name}>"


class User(Base):
    """
    User model - base for all user types
    
    Supports multiple roles per user
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    
    # Hall Ticket Authentication (for center-based exams like JEE/NPTEL)
    hall_ticket_number = Column(String(50), unique=True, nullable=True, index=True)
    date_of_birth = Column(DateTime, nullable=True)
    security_question = Column(String(255), nullable=True)
    security_answer_hash = Column(String(255), nullable=True)  # Hashed for security
    
    # Trade/Course Selection (for ITI exams)
    trade_id = Column(Integer, ForeignKey('trades.id', ondelete='SET NULL'), nullable=True, index=True)
    
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    # Foreign key to center (nullable for admin users)
    center_id = Column(Integer, ForeignKey('centers.id', ondelete='SET NULL'), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login = Column(DateTime, nullable=True)
    
    # Relationships
    roles = relationship("Role", secondary=user_roles, back_populates="users")
    center = relationship("Center", back_populates="users")
    trade = relationship("Trade", back_populates="students")
    attempts = relationship("StudentAttempt", foreign_keys="StudentAttempt.student_id", back_populates="student")
    
    def has_role(self, role_name: str) -> bool:
        """Check if user has a specific role"""
        return any(role.name == role_name for role in self.roles)
    
    def get_role_names(self) -> List[str]:
        """Get list of role names for this user"""
        return [role.name for role in self.roles]
    
    def __repr__(self):
        return f"<User {self.username}>"


class Center(Base):
    """
    Examination center model
    """
    __tablename__ = "centers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    address = Column(String(500))
    city = Column(String(100))
    state = Column(String(100))
    district = Column(String(100), nullable=True, index=True)  # For Andhra Pradesh districts
    pincode = Column(String(20))
    
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    users = relationship("User", back_populates="center")
    
    def __repr__(self):
        return f"<Center {self.code}: {self.name}>"
