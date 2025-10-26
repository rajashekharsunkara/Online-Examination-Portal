"""
Transfer Pydantic Schemas
Request/response models for workstation transfers
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.transfer import TransferStatus


class TransferRequestCreate(BaseModel):
    """Request to create a transfer"""
    attempt_id: int = Field(..., description="ID of the attempt to transfer")
    to_workstation: str = Field(..., min_length=1, max_length=50, description="Target workstation identifier")
    reason: str = Field(..., min_length=10, max_length=1000, description="Reason for transfer request")
    
    class Config:
        json_schema_extra = {
            "example": {
                "attempt_id": 123,
                "to_workstation": "WS-205",
                "reason": "Hardware malfunction - keyboard not responding"
            }
        }


class TransferApproval(BaseModel):
    """Approve or reject a transfer"""
    approved: bool = Field(..., description="True to approve, False to reject")
    reason: Optional[str] = Field(None, max_length=1000, description="Reason for rejection (optional for approval)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "approved": True,
                "reason": None
            }
        }


class TransferResponse(BaseModel):
    """Transfer details response"""
    id: int
    attempt_id: int
    from_workstation: str
    to_workstation: str
    requested_by_id: int
    approved_by_id: Optional[int] = None
    status: str
    reason: str
    migration_checksum: Optional[str] = None
    answers_transferred: int = 0
    error_message: Optional[str] = None
    created_at: datetime
    approved_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "attempt_id": 123,
                "from_workstation": "WS-101",
                "to_workstation": "WS-205",
                "requested_by_id": 45,
                "approved_by_id": 3,
                "status": "completed",
                "reason": "Hardware malfunction - keyboard not responding",
                "migration_checksum": "a3b2c1d4e5f6...",
                "answers_transferred": 12,
                "error_message": None,
                "created_at": "2024-01-01T10:30:00Z",
                "approved_at": "2024-01-01T10:32:00Z",
                "rejected_at": None,
                "completed_at": "2024-01-01T10:33:00Z"
            }
        }


class TransferListResponse(BaseModel):
    """List of transfers with pagination"""
    transfers: list[TransferResponse]
    total: int
    page: int
    page_size: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "transfers": [],
                "total": 25,
                "page": 1,
                "page_size": 20
            }
        }


class AuditLogCreate(BaseModel):
    """Create an audit log entry"""
    event_type: str = Field(..., max_length=50)
    event_category: str = Field(..., max_length=50)
    description: str
    details: Optional[dict] = None
    attempt_id: Optional[int] = None
    exam_id: Optional[int] = None
    transfer_id: Optional[int] = None
    success: bool = True
    error_message: Optional[str] = None


class AuditLogResponse(BaseModel):
    """Audit log entry response"""
    id: int
    event_type: str
    event_category: str
    user_id: Optional[int]
    username: Optional[str]
    attempt_id: Optional[int]
    exam_id: Optional[int]
    transfer_id: Optional[int]
    description: str
    details: Optional[dict]
    ip_address: Optional[str]
    user_agent: Optional[str]
    success: bool
    error_message: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True
