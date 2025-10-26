"""
WebSocket Message Schemas
Defines message formats for WebSocket communication
"""
from typing import Optional, Dict, Any, List, Literal
from pydantic import BaseModel, Field
from datetime import datetime


# Message Types
MessageType = Literal[
    "ping", "pong",  # Heartbeat
    "checkpoint", "checkpoint_ack", "checkpoint_error",  # Answer checkpointing
    "time_sync", "time_update",  # Time synchronization
    "notification", "warning", "error",  # Notifications
    "exam_event", "system_event",  # Events
    "transfer_requested", "transfer_approved", "transfer_rejected", "transfer_completed"  # Transfer events
]


class WebSocketMessage(BaseModel):
    """Base WebSocket message"""
    type: MessageType
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    message_id: Optional[str] = None


# Heartbeat Messages

class PingMessage(WebSocketMessage):
    """Heartbeat ping from server"""
    type: Literal["ping"] = "ping"


class PongMessage(WebSocketMessage):
    """Heartbeat pong from client"""
    type: Literal["pong"] = "pong"


# Checkpoint Messages

class CheckpointRequest(WebSocketMessage):
    """Client request to save answer checkpoint"""
    type: Literal["checkpoint"] = "checkpoint"
    question_id: int
    answer: Any  # Can be string, list, dict
    is_flagged: bool = False
    time_spent_seconds: int = 0
    sequence: int = 1  # Answer version number


class CheckpointAck(WebSocketMessage):
    """Server acknowledgment of checkpoint save"""
    type: Literal["checkpoint_ack"] = "checkpoint_ack"
    question_id: int
    sequence: int
    saved_at: datetime
    time_remaining_seconds: int


class CheckpointError(WebSocketMessage):
    """Server error during checkpoint save"""
    type: Literal["checkpoint_error"] = "checkpoint_error"
    question_id: int
    error: str
    error_code: str


# Time Synchronization Messages

class TimeSyncRequest(WebSocketMessage):
    """Client request for time synchronization"""
    type: Literal["time_sync"] = "time_sync"
    client_timestamp: datetime


class TimeUpdateMessage(WebSocketMessage):
    """Server time update"""
    type: Literal["time_update"] = "time_update"
    server_time: datetime
    time_remaining_seconds: int
    elapsed_seconds: int
    is_expired: bool = False


# Notification Messages

class NotificationMessage(WebSocketMessage):
    """General notification to client"""
    type: Literal["notification"] = "notification"
    title: str
    message: str
    severity: Literal["info", "success", "warning", "error"] = "info"
    action: Optional[str] = None  # Optional action to take


class WarningMessage(WebSocketMessage):
    """Warning message to client"""
    type: Literal["warning"] = "warning"
    message: str
    warning_code: str


class ErrorMessage(WebSocketMessage):
    """Error message to client"""
    type: Literal["error"] = "error"
    message: str
    error_code: str
    details: Optional[Dict[str, Any]] = None


# Event Messages

class ExamEventMessage(WebSocketMessage):
    """Exam-related event"""
    type: Literal["exam_event"] = "exam_event"
    event: str  # e.g., "time_warning", "auto_submit", "proctor_message"
    data: Dict[str, Any] = Field(default_factory=dict)


class SystemEventMessage(WebSocketMessage):
    """System-level event"""
    type: Literal["system_event"] = "system_event"
    event: str  # e.g., "maintenance", "network_issue"
    data: Dict[str, Any] = Field(default_factory=dict)


# Transfer Event Messages

class TransferRequestedMessage(WebSocketMessage):
    """Transfer request created"""
    type: Literal["transfer_requested"] = "transfer_requested"
    transfer_id: int
    attempt_id: int
    from_workstation: str
    to_workstation: str
    reason: str
    requested_by: str


class TransferApprovedMessage(WebSocketMessage):
    """Transfer approved and migration in progress"""
    type: Literal["transfer_approved"] = "transfer_approved"
    transfer_id: int
    attempt_id: int
    from_workstation: str
    to_workstation: str
    approved_by: str
    message: str = "Your exam is being transferred to the new workstation. Please wait..."


class TransferRejectedMessage(WebSocketMessage):
    """Transfer rejected"""
    type: Literal["transfer_rejected"] = "transfer_rejected"
    transfer_id: int
    attempt_id: int
    reason: Optional[str] = None


class TransferCompletedMessage(WebSocketMessage):
    """Transfer completed successfully"""
    type: Literal["transfer_completed"] = "transfer_completed"
    transfer_id: int
    attempt_id: int
    to_workstation: str
    migration_checksum: str
    answers_transferred: int
    message: str = "Transfer complete. You can now resume your exam on the new workstation."


# Connection Messages

class ConnectionInfo(BaseModel):
    """Connection information response"""
    connection_id: str
    attempt_id: int
    server_time: datetime
    time_remaining_seconds: int
    heartbeat_interval: int = 30
    checkpoint_debounce: int = 2


# Batch Checkpoint

class BatchCheckpointRequest(WebSocketMessage):
    """Batch checkpoint request for multiple answers"""
    type: Literal["checkpoint"] = "checkpoint"
    answers: List[CheckpointRequest]


class BatchCheckpointAck(WebSocketMessage):
    """Batch checkpoint acknowledgment"""
    type: Literal["checkpoint_ack"] = "checkpoint_ack"
    results: List[Dict[str, Any]]  # List of {question_id, success, error}
    time_remaining_seconds: int


# Utility Functions

def create_ping() -> dict:
    """Create a ping message"""
    return PingMessage().model_dump(mode="json")


def create_pong() -> dict:
    """Create a pong message"""
    return PongMessage().model_dump(mode="json")


def create_checkpoint_ack(
    question_id: int,
    sequence: int,
    time_remaining_seconds: int
) -> dict:
    """Create a checkpoint acknowledgment"""
    return CheckpointAck(
        question_id=question_id,
        sequence=sequence,
        saved_at=datetime.utcnow(),
        time_remaining_seconds=time_remaining_seconds
    ).model_dump(mode="json")


def create_checkpoint_error(
    question_id: int,
    error: str,
    error_code: str = "CHECKPOINT_FAILED"
) -> dict:
    """Create a checkpoint error message"""
    return CheckpointError(
        question_id=question_id,
        error=error,
        error_code=error_code
    ).model_dump(mode="json")


def create_time_update(
    time_remaining_seconds: int,
    elapsed_seconds: int,
    is_expired: bool = False
) -> dict:
    """Create a time update message"""
    return TimeUpdateMessage(
        server_time=datetime.utcnow(),
        time_remaining_seconds=time_remaining_seconds,
        elapsed_seconds=elapsed_seconds,
        is_expired=is_expired
    ).model_dump(mode="json")


def create_notification(
    title: str,
    message: str,
    severity: Literal["info", "success", "warning", "error"] = "info",
    action: Optional[str] = None
) -> dict:
    """Create a notification message"""
    return NotificationMessage(
        title=title,
        message=message,
        severity=severity,
        action=action
    ).model_dump(mode="json")


def create_warning(message: str, warning_code: str) -> dict:
    """Create a warning message"""
    return WarningMessage(
        message=message,
        warning_code=warning_code
    ).model_dump(mode="json")


def create_error(
    message: str,
    error_code: str,
    details: Optional[Dict[str, Any]] = None
) -> dict:
    """Create an error message"""
    return ErrorMessage(
        message=message,
        error_code=error_code,
        details=details
    ).model_dump(mode="json")


def create_exam_event(event: str, data: Dict[str, Any] = None) -> dict:
    """Create an exam event message"""
    return ExamEventMessage(
        event=event,
        data=data or {}
    ).model_dump(mode="json")


def create_system_event(event: str, data: Dict[str, Any] = None) -> dict:
    """Create a system event message"""
    return SystemEventMessage(
        event=event,
        data=data or {}
    ).model_dump(mode="json")


def create_transfer_requested(
    transfer_id: int,
    attempt_id: int,
    from_workstation: str,
    to_workstation: str,
    reason: str,
    requested_by: str
) -> dict:
    """Create a transfer requested message"""
    return TransferRequestedMessage(
        transfer_id=transfer_id,
        attempt_id=attempt_id,
        from_workstation=from_workstation,
        to_workstation=to_workstation,
        reason=reason,
        requested_by=requested_by
    ).model_dump(mode="json")


def create_transfer_approved(
    transfer_id: int,
    attempt_id: int,
    from_workstation: str,
    to_workstation: str,
    approved_by: str
) -> dict:
    """Create a transfer approved message"""
    return TransferApprovedMessage(
        transfer_id=transfer_id,
        attempt_id=attempt_id,
        from_workstation=from_workstation,
        to_workstation=to_workstation,
        approved_by=approved_by
    ).model_dump(mode="json")


def create_transfer_rejected(
    transfer_id: int,
    attempt_id: int,
    reason: Optional[str] = None
) -> dict:
    """Create a transfer rejected message"""
    return TransferRejectedMessage(
        transfer_id=transfer_id,
        attempt_id=attempt_id,
        reason=reason
    ).model_dump(mode="json")


def create_transfer_completed(
    transfer_id: int,
    attempt_id: int,
    to_workstation: str,
    migration_checksum: str,
    answers_transferred: int
) -> dict:
    """Create a transfer completed message"""
    return TransferCompletedMessage(
        transfer_id=transfer_id,
        attempt_id=attempt_id,
        to_workstation=to_workstation,
        migration_checksum=migration_checksum,
        answers_transferred=answers_transferred
    ).model_dump(mode="json")
