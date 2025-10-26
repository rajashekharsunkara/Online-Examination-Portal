"""
Audit Log Model
Records all critical actions for security and compliance
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class AuditLog(Base):
    """Audit log for tracking critical actions"""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    
    # Event identification
    event_type = Column(String(50), nullable=False, index=True)  # e.g., "transfer_requested", "login", "exam_submitted"
    event_category = Column(String(50), nullable=False, index=True)  # e.g., "transfer", "auth", "exam"
    
    # User and context
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    username = Column(String(255), nullable=True)  # Denormalized for records even if user deleted
    
    # Related entities
    attempt_id = Column(Integer, ForeignKey('student_attempts.id', ondelete='SET NULL'), nullable=True)
    exam_id = Column(Integer, ForeignKey("exams.id", ondelete="SET NULL"), nullable=True, index=True)
    transfer_id = Column(Integer, ForeignKey("transfers.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Event details
    description = Column(Text, nullable=False)
    details = Column(JSON, nullable=True)  # Additional structured data (e.g., {"from": "WS-101", "to": "WS-102"})
    
    # Network context
    ip_address = Column(String(45), nullable=True)  # IPv4 or IPv6
    user_agent = Column(String(500), nullable=True)
    
    # Result
    success = Column(Integer, nullable=False, default=1)  # 1 for success, 0 for failure
    error_message = Column(Text, nullable=True)
    
    # Timestamp
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    attempt = relationship("StudentAttempt", foreign_keys=[attempt_id])
    exam = relationship("Exam", foreign_keys=[exam_id])
    transfer = relationship("Transfer", foreign_keys=[transfer_id])

    def __repr__(self):
        return f"<AuditLog {self.id}: {self.event_type} by {self.username} at {self.created_at}>"

    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "event_type": self.event_type,
            "event_category": self.event_category,
            "user_id": self.user_id,
            "username": self.username,
            "attempt_id": self.attempt_id,
            "exam_id": self.exam_id,
            "transfer_id": self.transfer_id,
            "description": self.description,
            "details": self.details,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "success": bool(self.success),
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
