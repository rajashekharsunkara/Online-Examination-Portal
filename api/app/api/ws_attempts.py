"""
WebSocket API for Real-time Exam Attempts
Handles WebSocket connections, checkpointing, and real-time updates
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import Optional
import uuid
import json
import logging

from app.api.dependencies import get_current_user_ws, get_db
from app.models.user import User
from app.models.attempt import StudentAttempt, AttemptStatus
from app.core.websocket import ConnectionManager
from app.core.config import settings
from app.services.checkpoint import checkpoint_service
from app.services.redis import redis_service, get_attempt_channel
from app.schemas.websocket import (
    CheckpointRequest,
    PongMessage,
    create_checkpoint_ack,
    create_checkpoint_error,
    create_time_update,
    create_notification,
    create_error,
    create_exam_event
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["websocket"])

# Global connection manager
manager = ConnectionManager(
    heartbeat_interval=settings.WS_HEARTBEAT_INTERVAL,
    heartbeat_timeout=settings.WS_HEARTBEAT_TIMEOUT,
    max_connections_per_user=settings.WS_MAX_CONNECTIONS_PER_USER
)


@router.websocket("/attempts/{attempt_id}")
async def websocket_attempt_endpoint(
    websocket: WebSocket,
    attempt_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for real-time exam attempt
    
    Supports:
    - Real-time answer checkpointing
    - Time synchronization
    - Heartbeat monitoring
    - Event notifications
    
    Authentication: JWT token via query parameter
    """
    connection_id = str(uuid.uuid4())
    current_user: Optional[User] = None
    
    try:
        # Authenticate user (custom dependency for WebSocket)
        current_user = get_current_user_ws(token, db)
        
        if not current_user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Authentication failed")
            return
        
        # Validate attempt ownership
        attempt = db.query(StudentAttempt).filter(StudentAttempt.id == attempt_id).first()
        
        if not attempt:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Attempt not found")
            return
        
        if attempt.student_id != current_user.id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Unauthorized")
            return
        
        # Check attempt status
        if attempt.status not in [AttemptStatus.NOT_STARTED, AttemptStatus.IN_PROGRESS]:
            await websocket.close(
                code=status.WS_1008_POLICY_VIOLATION,
                reason=f"Attempt is {attempt.status}"
            )
            return
        
        # Connect WebSocket
        connected = await manager.connect(
            websocket=websocket,
            attempt_id=attempt_id,
            user_id=current_user.id,
            connection_id=connection_id
        )
        
        if not connected:
            return
        
        # Send connection confirmation
        await websocket.send_json({
            "type": "connected",
            "connection_id": connection_id,
            "attempt_id": attempt_id,
            "server_time": attempt.start_time.isoformat() if attempt.start_time else None,
            "time_remaining_seconds": attempt.get_time_remaining_seconds(),
            "heartbeat_interval": settings.WS_HEARTBEAT_INTERVAL,
            "checkpoint_debounce": settings.WS_CHECKPOINT_DEBOUNCE_SECONDS
        })
        
        logger.info(
            f"WebSocket connection established: user={current_user.id}, "
            f"attempt={attempt_id}, connection={connection_id}"
        )
        
        # Subscribe to Redis channel for this attempt
        channel = get_attempt_channel(attempt_id)
        await redis_service.subscribe(
            channel,
            lambda ch, msg: _handle_redis_message(ch, msg, connection_id)
        )
        
        # Message loop
        try:
            while True:
                # Receive message from client
                data = await websocket.receive_json()
                message_type = data.get("type")
                
                if message_type == "pong":
                    # Heartbeat response from client
                    logger.debug(f"Received pong from {connection_id}")
                    continue
                
                elif message_type == "checkpoint":
                    # Answer checkpoint
                    await _handle_checkpoint(
                        data, attempt_id, connection_id, db, websocket
                    )
                
                elif message_type == "time_sync":
                    # Time synchronization request
                    await _handle_time_sync(attempt_id, db, websocket)
                
                elif message_type == "flag":
                    # Flag question for review
                    await _handle_flag_question(
                        data, attempt_id, db, websocket
                    )
                
                else:
                    logger.warning(f"Unknown message type: {message_type}")
                    await websocket.send_json(
                        create_error(
                            f"Unknown message type: {message_type}",
                            "UNKNOWN_MESSAGE_TYPE"
                        )
                    )
        
        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected normally: {connection_id}")
        
        except Exception as e:
            logger.error(f"WebSocket error for {connection_id}: {e}", exc_info=True)
            await websocket.send_json(
                create_error(str(e), "WEBSOCKET_ERROR")
            )
    
    finally:
        # Clean up connection
        await manager.disconnect(connection_id)
        
        # Unsubscribe from Redis
        if attempt_id:
            channel = get_attempt_channel(attempt_id)
            await redis_service.unsubscribe(channel)
        
        logger.info(f"WebSocket cleanup complete: {connection_id}")


async def _handle_checkpoint(
    data: dict,
    attempt_id: int,
    connection_id: str,
    db: AsyncSession,
    websocket: WebSocket
) -> None:
    """Handle answer checkpoint from client"""
    try:
        # Parse checkpoint request
        checkpoint = CheckpointRequest(**data)
        
        # Process checkpoint with debouncing
        result = await checkpoint_service.process_checkpoint(
            db=db,
            attempt_id=attempt_id,
            checkpoint=checkpoint
        )
        
        if result["success"]:
            # Send acknowledgment
            response = create_checkpoint_ack(
                question_id=checkpoint.question_id,
                sequence=result.get("sequence", checkpoint.sequence),
                time_remaining_seconds=result["time_remaining_seconds"]
            )
            await websocket.send_json(response)
            
            # Broadcast to other connections for same attempt (multi-device sync)
            await manager.broadcast_to_attempt(
                message=create_notification(
                    "Answer Saved",
                    f"Question {checkpoint.question_id} saved",
                    severity="success"
                ),
                attempt_id=attempt_id,
                exclude_connection=connection_id
            )
            
            logger.debug(
                f"Checkpoint saved: attempt={attempt_id}, "
                f"question={checkpoint.question_id}, "
                f"debounced={result.get('debounced', False)}"
            )
        else:
            # Send error
            error_response = create_checkpoint_error(
                question_id=checkpoint.question_id,
                error=result.get("error", "Unknown error"),
                error_code=result.get("error_code", "CHECKPOINT_FAILED")
            )
            await websocket.send_json(error_response)
            
            logger.warning(
                f"Checkpoint failed: attempt={attempt_id}, "
                f"question={checkpoint.question_id}, "
                f"error={result.get('error')}"
            )
    
    except Exception as e:
        logger.error(f"Error handling checkpoint: {e}", exc_info=True)
        await websocket.send_json(
            create_checkpoint_error(
                question_id=data.get("question_id", 0),
                error=str(e),
                error_code="CHECKPOINT_PROCESSING_ERROR"
            )
        )


async def _handle_time_sync(
    attempt_id: int,
    db: AsyncSession,
    websocket: WebSocket
) -> None:
    """Handle time synchronization request"""
    try:
        # Get latest attempt data
        result = await db.execute(
            select(StudentAttempt).where(StudentAttempt.id == attempt_id)
        )
        attempt = result.scalar_one_or_none()
        
        if not attempt:
            await websocket.send_json(
                create_error("Attempt not found", "ATTEMPT_NOT_FOUND")
            )
            return
        
        # Calculate time info
        time_remaining = attempt.get_time_remaining_seconds()
        elapsed = (attempt.duration_minutes * 60) - time_remaining
        is_expired = attempt.is_expired()
        
        # Send time update
        response = create_time_update(
            time_remaining_seconds=time_remaining,
            elapsed_seconds=elapsed,
            is_expired=is_expired
        )
        await websocket.send_json(response)
        
        # If expired, send expiry event
        if is_expired:
            await websocket.send_json(
                create_exam_event(
                    "time_expired",
                    {"message": "Exam time has expired. Please submit your exam."}
                )
            )
    
    except Exception as e:
        logger.error(f"Error handling time sync: {e}", exc_info=True)
        await websocket.send_json(
            create_error(str(e), "TIME_SYNC_ERROR")
        )


async def _handle_flag_question(
    data: dict,
    attempt_id: int,
    db: AsyncSession,
    websocket: WebSocket
) -> None:
    """Handle question flag/unflag"""
    try:
        question_id = data.get("question_id")
        is_flagged = data.get("is_flagged", True)
        
        if not question_id:
            await websocket.send_json(
                create_error("question_id required", "INVALID_REQUEST")
            )
            return
        
        # Update attempt's flagged questions
        result = await db.execute(
            select(StudentAttempt).where(StudentAttempt.id == attempt_id)
        )
        attempt = result.scalar_one_or_none()
        
        if not attempt:
            await websocket.send_json(
                create_error("Attempt not found", "ATTEMPT_NOT_FOUND")
            )
            return
        
        flagged = attempt.questions_flagged or []
        
        if is_flagged:
            if question_id not in flagged:
                flagged.append(question_id)
        else:
            if question_id in flagged:
                flagged.remove(question_id)
        
        attempt.questions_flagged = flagged
        await db.commit()
        
        # Send confirmation
        await websocket.send_json(
            create_notification(
                "Question Flagged" if is_flagged else "Flag Removed",
                f"Question {question_id} {'flagged for review' if is_flagged else 'unflagged'}",
                severity="info"
            )
        )
    
    except Exception as e:
        logger.error(f"Error handling flag question: {e}", exc_info=True)
        await websocket.send_json(
            create_error(str(e), "FLAG_ERROR")
        )


async def _handle_redis_message(
    channel: str,
    message: dict,
    connection_id: str
) -> None:
    """Handle message from Redis pub/sub"""
    try:
        # Forward message to WebSocket client
        await manager.send_personal_message(message, connection_id)
        logger.debug(f"Forwarded Redis message to {connection_id}: {message.get('type')}")
    except Exception as e:
        logger.error(f"Error handling Redis message: {e}")


# Admin endpoint to broadcast to specific attempt
@router.websocket("/admin/broadcast/{attempt_id}")
async def websocket_admin_broadcast(
    websocket: WebSocket,
    attempt_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Admin WebSocket for broadcasting messages to students
    
    Requires: Admin/Staff role
    """
    try:
        # Authenticate admin
        current_user = get_current_user_ws(token, db)
        
        if not current_user or current_user.role not in ["admin", "staff"]:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Unauthorized")
            return
        
        await websocket.accept()
        
        logger.info(f"Admin broadcast connection: user={current_user.id}, attempt={attempt_id}")
        
        # Message loop
        while True:
            data = await websocket.receive_json()
            
            # Broadcast to all attempt connections
            count = await manager.broadcast_to_attempt(data, attempt_id)
            
            # Send confirmation
            await websocket.send_json({
                "type": "broadcast_ack",
                "recipients": count,
                "timestamp": str(uuid.uuid4())
            })
            
            logger.info(
                f"Admin broadcast: attempt={attempt_id}, "
                f"recipients={count}, message_type={data.get('type')}"
            )
    
    except WebSocketDisconnect:
        logger.info("Admin broadcast disconnected")
    except Exception as e:
        logger.error(f"Admin broadcast error: {e}", exc_info=True)
