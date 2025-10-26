"""
Transfer Model
Represents a workstation transfer request for an exam attempt
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class TransferStatus(str, enum.Enum):
    """Transfer request status"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"
    FAILED = "failed"


class Transfer(Base):
    """Workstation transfer request"""
    __tablename__ = "transfers"

    id = Column(Integer, primary_key=True, index=True)
    
    # Attempt being transferred
    attempt_id = Column(Integer, ForeignKey("student_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Source and target workstations (identifier strings, e.g., "WS-101", "WS-205")
    from_workstation = Column(String(50), nullable=False, index=True)
    to_workstation = Column(String(50), nullable=False, index=True)
    
    # Users involved in transfer
    requested_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Student or technician
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)    # Hall in-charge
    
    # Transfer metadata
    status = Column(
        SQLEnum(TransferStatus),
        nullable=False,
        default=TransferStatus.PENDING,
        index=True
    )
    reason = Column(Text, nullable=False)  # Reason for transfer (hardware issue, comfort, etc.)
    
    # State migration tracking
    migration_checksum = Column(String(64), nullable=True)  # SHA-256 of transferred state
    answers_transferred = Column(Integer, default=0)        # Number of answers migrated
    error_message = Column(Text, nullable=True)             # Error if migration fails
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)
    rejected_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    attempt = relationship("StudentAttempt", back_populates="transfers")
    requested_by = relationship("User", foreign_keys=[requested_by_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])

    def __repr__(self):
        return f"<Transfer {self.id}: Attempt {self.attempt_id} ({self.from_workstation} → {self.to_workstation}) - {self.status}>"

    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "attempt_id": self.attempt_id,
            "from_workstation": self.from_workstation,
            "to_workstation": self.to_workstation,
            "requested_by_id": self.requested_by_id,
            "approved_by_id": self.approved_by_id,
            "status": self.status.value,
            "reason": self.reason,
            "migration_checksum": self.migration_checksum,
            "answers_transferred": self.answers_transferred,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "approved_at": self.approved_at.isoformat() if self.approved_at else None,
            "rejected_at": self.rejected_at.isoformat() if self.rejected_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }
