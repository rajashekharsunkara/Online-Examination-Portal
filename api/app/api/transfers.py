"""
Transfer API Endpoints
Handles workstation transfer requests and approvals
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.api.dependencies import get_current_user, require_role
from app.api.ws_attempts import manager as connection_manager
from app.models.user import User
from app.models.transfer import Transfer, TransferStatus
from app.models.audit_log import AuditLog
from app.schemas.transfer import (
    TransferRequestCreate,
    TransferApproval,
    TransferResponse,
    TransferListResponse
)
from app.services.transfer import TransferService, TransferError

router = APIRouter(prefix="/transfers", tags=["transfers"])


@router.post("/request", response_model=TransferResponse, status_code=status.HTTP_201_CREATED)
async def request_transfer(
    request_data: TransferRequestCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Request a workstation transfer for an exam attempt
    
    **Permissions**: Student (own attempt) or technician/hall staff
    
    **Validations**:
    - Attempt must be in_progress
    - No pending/in-progress transfers for this attempt
    - Minimum 5 minutes remaining
    - Target workstation different from current
    
    **Returns**: Transfer record with pending status
    """
    try:
        # Get client info for audit
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        
        # Create transfer request
        transfer = await TransferService.create_transfer_request(
            db=db,
            attempt_id=request_data.attempt_id,
            to_workstation=request_data.to_workstation,
            reason=request_data.reason,
            user=current_user,
            connection_manager=connection_manager,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return transfer
        
    except TransferError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/{transfer_id}/approve", response_model=TransferResponse)
async def approve_transfer(
    transfer_id: int,
    approval_data: TransferApproval,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("hall_in_charge"))
):
    """
    Approve or reject a transfer request
    
    **Permissions**: Hall in-charge only
    
    **On Approval**:
    - Migrates attempt state to target workstation
    - Updates workstation_id and transfer_count
    - Generates migration checksum
    - Creates audit log entries
    
    **On Rejection**:
    - Marks transfer as rejected
    - Records reason in error_message
    
    **Returns**: Updated transfer record
    """
    try:
        # Get client info for audit
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        
        if approval_data.approved:
            # Approve and migrate state
            transfer = await TransferService.approve_transfer(
                db=db,
                transfer_id=transfer_id,
                approver=current_user,
                connection_manager=connection_manager,
                ip_address=ip_address,
                user_agent=user_agent
            )
        else:
            # Reject transfer
            transfer = await TransferService.reject_transfer(
                db=db,
                transfer_id=transfer_id,
                rejector=current_user,
                reason=approval_data.reason,
                connection_manager=connection_manager,
                ip_address=ip_address,
                user_agent=user_agent
            )
        
        return transfer
        
    except TransferError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("", response_model=TransferListResponse)
async def list_transfers(
    status_filter: Optional[TransferStatus] = None,
    exam_id: Optional[int] = None,
    attempt_id: Optional[int] = None,
    from_workstation: Optional[str] = None,
    to_workstation: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List transfers with optional filtering
    
    **Permissions**: All authenticated users
    - Students see only their own transfers
    - Staff see all transfers
    
    **Filters**:
    - status: Filter by transfer status (pending, approved, rejected, completed, failed)
    - exam_id: Filter by exam
    - attempt_id: Filter by attempt
    - from_workstation: Filter by source workstation
    - to_workstation: Filter by target workstation
    
    **Pagination**:
    - page: Page number (1-indexed)
    - page_size: Items per page (max 100)
    
    **Returns**: Paginated list of transfers
    """
    try:
        # Build query
        query = db.query(Transfer)
        
        # Filter by user role
        is_staff = any(role.name in ['technician', 'hall_in_charge', 'hall_auth', 'admin'] for role in current_user.roles)
        if not is_staff:
            # Students see only transfers for their attempts
            from app.models.attempt import StudentAttempt
            query = query.join(StudentAttempt).filter(StudentAttempt.student_id == current_user.id)
        
        # Apply filters
        if status_filter:
            query = query.filter(Transfer.status == status_filter)
        if exam_id:
            from app.models.attempt import StudentAttempt
            query = query.join(StudentAttempt).filter(StudentAttempt.exam_id == exam_id)
        if attempt_id:
            query = query.filter(Transfer.attempt_id == attempt_id)
        if from_workstation:
            query = query.filter(Transfer.from_workstation == from_workstation)
        if to_workstation:
            query = query.filter(Transfer.to_workstation == to_workstation)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        page_size = min(page_size, 100)  # Max 100 items per page
        offset = (page - 1) * page_size
        transfers = query.order_by(Transfer.created_at.desc()).offset(offset).limit(page_size).all()
        
        return TransferListResponse(
            transfers=transfers,
            total=total,
            page=page,
            page_size=page_size
        )
        
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{transfer_id}", response_model=TransferResponse)
async def get_transfer(
    transfer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get transfer details by ID
    
    **Permissions**: All authenticated users
    - Students can only view their own transfers
    - Staff can view all transfers
    
    **Returns**: Transfer record
    """
    try:
        transfer = db.query(Transfer).filter(Transfer.id == transfer_id).first()
        if not transfer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transfer not found")
        
        # Check permissions
        is_staff = any(role.name in ['technician', 'hall_in_charge', 'hall_auth', 'admin'] for role in current_user.roles)
        if not is_staff:
            # Verify student owns the attempt
            from app.models.attempt import StudentAttempt
            attempt = db.query(StudentAttempt).filter(StudentAttempt.id == transfer.attempt_id).first()
            if not attempt or attempt.student_id != current_user.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this transfer")
        
        return transfer
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/audit/{transfer_id}", response_model=list)
async def get_transfer_audit_log(
    transfer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("hall_in_charge"))
):
    """
    Get audit log for a transfer
    
    **Permissions**: Hall in-charge, admin
    
    **Returns**: List of audit log entries for the transfer
    """
    try:
        # Verify transfer exists
        transfer = db.query(Transfer).filter(Transfer.id == transfer_id).first()
        if not transfer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transfer not found")
        
        # Get audit logs
        logs = db.query(AuditLog).filter(AuditLog.transfer_id == transfer_id).order_by(AuditLog.created_at).all()
        
        return [log.to_dict() for log in logs]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
