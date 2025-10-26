"""
WebSocket Tests
Tests for real-time exam attempt WebSocket functionality
"""
import pytest
import json
import asyncio
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.exam import Exam, Question, QuestionType, ExamQuestion
from app.models.attempt import StudentAttempt, AttemptStatus, StudentAnswer
from app.core.security import create_access_token


@pytest.fixture
def test_exam(db_session: Session):
    """Create a test exam with questions"""
    exam = Exam(
        title="WebSocket Test Exam",
        description="Test exam for WebSocket functionality",
        duration_minutes=60,
        total_marks=10.0,
        passing_marks=5.0,
        status="published"
    )
    db_session.add(exam)
    db_session.commit()
    db_session.refresh(exam)
    
    # Add questions
    questions = []
    for i in range(3):
        question = Question(
            question_text=f"Question {i+1}?",
            question_type=QuestionType.MCQ_SINGLE,
            marks=3.0,
            correct_answer=["A"],
            options=["A", "B", "C", "D"]
        )
        db_session.add(question)
        questions.append(question)
    
    db_session.commit()
    
    # Link questions to exam
    for i, question in enumerate(questions):
        exam_question = ExamQuestion(
            exam_id=exam.id,
            question_id=question.id,
            order_number=i + 1
        )
        db_session.add(exam_question)
    
    db_session.commit()
    db_session.refresh(exam)
    
    return exam


@pytest.fixture
def test_attempt(db_session: Session, test_user: User, test_exam: Exam):
    """Create a test attempt"""
    attempt = StudentAttempt(
        student_id=test_user.id,
        exam_id=test_exam.id,
        status=AttemptStatus.IN_PROGRESS,
        start_time=datetime.utcnow(),
        duration_minutes=test_exam.duration_minutes,
        total_marks=test_exam.total_marks,
        workstation_id="WS001"
    )
    db_session.add(attempt)
    db_session.commit()
    db_session.refresh(attempt)
    
    return attempt


def test_websocket_connection_success(client: TestClient, test_user: User, test_attempt: StudentAttempt):
    """Test successful WebSocket connection"""
    # Create access token
    token = create_access_token({"sub": str(test_user.id), "type": "access"})
    
    # Connect via WebSocket
    with client.websocket_connect(f"/api/v1/ws/attempts/{test_attempt.id}?token={token}") as websocket:
        # Should receive connection confirmation
        data = websocket.receive_json()
        
        assert data["type"] == "connected"
        assert data["attempt_id"] == test_attempt.id
        assert "connection_id" in data
        assert "time_remaining_seconds" in data
        assert data["heartbeat_interval"] == 30
        assert data["checkpoint_debounce"] == 2


def test_websocket_connection_unauthorized(client: TestClient, test_attempt: StudentAttempt):
    """Test WebSocket connection with invalid token"""
    # Try to connect with invalid token
    with pytest.raises(Exception):  # Will raise WebSocketDisconnect
        with client.websocket_connect(f"/api/v1/ws/attempts/{test_attempt.id}?token=invalid") as websocket:
            pass


def test_websocket_connection_wrong_user(client: TestClient, test_admin: User, test_attempt: StudentAttempt):
    """Test WebSocket connection from non-owner user"""
    # Create token for different user
    token = create_access_token({"sub": str(test_admin.id), "type": "access"})
    
    # Should be rejected
    with pytest.raises(Exception):
        with client.websocket_connect(f"/api/v1/ws/attempts/{test_attempt.id}?token={token}") as websocket:
            pass


def test_websocket_connection_invalid_attempt(client: TestClient, test_user: User):
    """Test WebSocket connection to non-existent attempt"""
    token = create_access_token({"sub": str(test_user.id), "type": "access"})
    
    with pytest.raises(Exception):
        with client.websocket_connect(f"/api/v1/ws/attempts/99999?token={token}") as websocket:
            pass


def test_websocket_heartbeat_ping_pong(client: TestClient, test_user: User, test_attempt: StudentAttempt):
    """Test heartbeat mechanism"""
    token = create_access_token({"sub": str(test_user.id), "type": "access"})
    
    with client.websocket_connect(f"/api/v1/ws/attempts/{test_attempt.id}?token={token}") as websocket:
        # Receive connection confirmation
        conn_data = websocket.receive_json()
        assert conn_data["type"] == "connected"
        
        # Wait for first ping (mocked with manual ping simulation)
        # In real test, server should send ping automatically
        
        # Send pong response
        websocket.send_json({"type": "pong", "timestamp": datetime.utcnow().isoformat()})
        
        # Connection should remain open
        # Send a checkpoint to verify connection is active
        checkpoint_data = {
            "type": "checkpoint",
            "question_id": 1,
            "answer": ["A"],
            "is_flagged": False,
            "time_spent_seconds": 30,
            "sequence": 1
        }
        
        websocket.send_json(checkpoint_data)
        
        # Should receive acknowledgment
        response = websocket.receive_json()
        assert response["type"] == "checkpoint_ack"


def test_websocket_checkpoint_save(
    client: TestClient,
    test_user: User,
    test_attempt: StudentAttempt,
    test_exam: Exam,
    db_session: Session
):
    """Test answer checkpoint via WebSocket"""
    token = create_access_token({"sub": str(test_user.id), "type": "access"})
    
    with client.websocket_connect(f"/api/v1/ws/attempts/{test_attempt.id}?token={token}") as websocket:
        # Receive connection confirmation
        conn_data = websocket.receive_json()
        
        # Get first question ID
        question_id = test_exam.exam_questions[0].question_id
        
        # Send checkpoint
        checkpoint = {
            "type": "checkpoint",
            "question_id": question_id,
            "answer": ["B"],
            "is_flagged": False,
            "time_spent_seconds": 45,
            "sequence": 1
        }
        
        websocket.send_json(checkpoint)
        
        # Should receive acknowledgment
        ack = websocket.receive_json()
        
        assert ack["type"] == "checkpoint_ack"
        assert ack["question_id"] == question_id
        assert ack["sequence"] == 1
        assert "time_remaining_seconds" in ack
        
        # Verify answer was saved to database
        answer = db_session.query(StudentAnswer).filter_by(
            attempt_id=test_attempt.id,
            question_id=question_id
        ).first()
        
        assert answer is not None
        assert answer.answer == ["B"]
        assert answer.time_spent_seconds == 45
        assert answer.answer_sequence == 1


def test_websocket_checkpoint_update(
    client: TestClient,
    test_user: User,
    test_attempt: StudentAttempt,
    test_exam: Exam,
    db_session: Session
):
    """Test updating answer via WebSocket"""
    token = create_access_token({"sub": str(test_user.id), "type": "access"})
    
    with client.websocket_connect(f"/api/v1/ws/attempts/{test_attempt.id}?token={token}") as websocket:
        # Connection
        conn_data = websocket.receive_json()
        
        question_id = test_exam.exam_questions[0].question_id
        
        # Send first checkpoint
        checkpoint1 = {
            "type": "checkpoint",
            "question_id": question_id,
            "answer": ["A"],
            "is_flagged": False,
            "time_spent_seconds": 30,
            "sequence": 1
        }
        websocket.send_json(checkpoint1)
        ack1 = websocket.receive_json()
        assert ack1["type"] == "checkpoint_ack"
        
        # Update answer
        checkpoint2 = {
            "type": "checkpoint",
            "question_id": question_id,
            "answer": ["C"],
            "is_flagged": True,
            "time_spent_seconds": 20,  # Additional time
            "sequence": 2
        }
        websocket.send_json(checkpoint2)
        ack2 = websocket.receive_json()
        
        assert ack2["type"] == "checkpoint_ack"
        assert ack2["sequence"] == 2
        
        # Verify updated answer
        db_session.expire_all()
        answer = db_session.query(StudentAnswer).filter_by(
            attempt_id=test_attempt.id,
            question_id=question_id
        ).first()
        
        assert answer.answer == ["C"]
        assert answer.is_flagged == True
        assert answer.time_spent_seconds == 50  # Cumulative: 30 + 20
        assert answer.answer_sequence == 2


def test_websocket_checkpoint_invalid_question(
    client: TestClient,
    test_user: User,
    test_attempt: StudentAttempt
):
    """Test checkpoint with question not in exam"""
    token = create_access_token({"sub": str(test_user.id), "type": "access"})
    
    with client.websocket_connect(f"/api/v1/ws/attempts/{test_attempt.id}?token={token}") as websocket:
        conn_data = websocket.receive_json()
        
        # Send checkpoint with invalid question ID
        checkpoint = {
            "type": "checkpoint",
            "question_id": 99999,
            "answer": ["A"],
            "is_flagged": False,
            "time_spent_seconds": 10,
            "sequence": 1
        }
        
        websocket.send_json(checkpoint)
        
        # Should receive error
        response = websocket.receive_json()
        assert response["type"] == "checkpoint_error"
        assert response["question_id"] == 99999
        assert response["error_code"] == "INVALID_QUESTION"


def test_websocket_time_sync(
    client: TestClient,
    test_user: User,
    test_attempt: StudentAttempt
):
    """Test time synchronization"""
    token = create_access_token({"sub": str(test_user.id), "type": "access"})
    
    with client.websocket_connect(f"/api/v1/ws/attempts/{test_attempt.id}?token={token}") as websocket:
        conn_data = websocket.receive_json()
        
        # Request time sync
        websocket.send_json({
            "type": "time_sync",
            "client_timestamp": datetime.utcnow().isoformat()
        })
        
        # Should receive time update
        response = websocket.receive_json()
        
        assert response["type"] == "time_update"
        assert "server_time" in response
        assert "time_remaining_seconds" in response
        assert "elapsed_seconds" in response
        assert response["is_expired"] == False


def test_websocket_flag_question(
    client: TestClient,
    test_user: User,
    test_attempt: StudentAttempt,
    test_exam: Exam,
    db_session: Session
):
    """Test flagging question for review"""
    token = create_access_token({"sub": str(test_user.id), "type": "access"})
    
    with client.websocket_connect(f"/api/v1/ws/attempts/{test_attempt.id}?token={token}") as websocket:
        conn_data = websocket.receive_json()
        
        question_id = test_exam.exam_questions[0].question_id
        
        # Flag question
        websocket.send_json({
            "type": "flag",
            "question_id": question_id,
            "is_flagged": True
        })
        
        # Should receive confirmation
        response = websocket.receive_json()
        assert response["type"] == "notification"
        assert "Question Flagged" in response["title"]
        
        # Verify in database
        db_session.expire_all()
        attempt = db_session.query(StudentAttempt).get(test_attempt.id)
        assert question_id in attempt.questions_flagged


def test_websocket_unflag_question(
    client: TestClient,
    test_user: User,
    test_attempt: StudentAttempt,
    test_exam: Exam,
    db_session: Session
):
    """Test unflagging a question"""
    token = create_access_token({"sub": str(test_user.id), "type": "access"})
    
    # Pre-flag a question
    question_id = test_exam.exam_questions[0].question_id
    test_attempt.questions_flagged = [question_id]
    db_session.commit()
    
    with client.websocket_connect(f"/api/v1/ws/attempts/{test_attempt.id}?token={token}") as websocket:
        conn_data = websocket.receive_json()
        
        # Unflag question
        websocket.send_json({
            "type": "flag",
            "question_id": question_id,
            "is_flagged": False
        })
        
        # Should receive confirmation
        response = websocket.receive_json()
        assert response["type"] == "notification"
        assert "Flag Removed" in response["title"]
        
        # Verify in database
        db_session.expire_all()
        attempt = db_session.query(StudentAttempt).get(test_attempt.id)
        assert question_id not in (attempt.questions_flagged or [])


def test_websocket_multiple_connections(
    client: TestClient,
    test_user: User,
    test_attempt: StudentAttempt
):
    """Test multiple simultaneous connections for same attempt"""
    token = create_access_token({"sub": str(test_user.id), "type": "access"})
    
    # Open first connection
    with client.websocket_connect(f"/api/v1/ws/attempts/{test_attempt.id}?token={token}") as ws1:
        conn1_data = ws1.receive_json()
        assert conn1_data["type"] == "connected"
        conn1_id = conn1_data["connection_id"]
        
        # Open second connection (simulating different tab/device)
        with client.websocket_connect(f"/api/v1/ws/attempts/{test_attempt.id}?token={token}") as ws2:
            conn2_data = ws2.receive_json()
            assert conn2_data["type"] == "connected"
            conn2_id = conn2_data["connection_id"]
            
            # Connection IDs should be different
            assert conn1_id != conn2_id


def test_websocket_unknown_message_type(
    client: TestClient,
    test_user: User,
    test_attempt: StudentAttempt
):
    """Test handling of unknown message type"""
    token = create_access_token({"sub": str(test_user.id), "type": "access"})
    
    with client.websocket_connect(f"/api/v1/ws/attempts/{test_attempt.id}?token={token}") as websocket:
        conn_data = websocket.receive_json()
        
        # Send unknown message type
        websocket.send_json({
            "type": "unknown_type",
            "data": "some data"
        })
        
        # Should receive error
        response = websocket.receive_json()
        assert response["type"] == "error"
        assert response["error_code"] == "UNKNOWN_MESSAGE_TYPE"


def test_websocket_connection_to_submitted_attempt(
    client: TestClient,
    test_user: User,
    test_attempt: StudentAttempt,
    db_session: Session
):
    """Test connection to already submitted attempt"""
    token = create_access_token({"sub": str(test_user.id), "type": "access"})
    
    # Mark attempt as submitted
    test_attempt.status = AttemptStatus.SUBMITTED
    test_attempt.submit_time = datetime.utcnow()
    db_session.commit()
    
    # Should be rejected
    with pytest.raises(Exception):
        with client.websocket_connect(f"/api/v1/ws/attempts/{test_attempt.id}?token={token}") as websocket:
            pass


def test_websocket_checkpoint_after_expiry(
    client: TestClient,
    test_user: User,
    test_attempt: StudentAttempt,
    test_exam: Exam,
    db_session: Session
):
    """Test checkpoint save after time expiry"""
    token = create_access_token({"sub": str(test_user.id), "type": "access"})
    
    # Set attempt start time to past (expired)
    test_attempt.start_time = datetime.utcnow() - timedelta(hours=2)
    test_attempt.duration_minutes = 60
    db_session.commit()
    
    with client.websocket_connect(f"/api/v1/ws/attempts/{test_attempt.id}?token={token}") as websocket:
        conn_data = websocket.receive_json()
        
        question_id = test_exam.exam_questions[0].question_id
        
        # Try to save checkpoint
        checkpoint = {
            "type": "checkpoint",
            "question_id": question_id,
            "answer": ["A"],
            "is_flagged": False,
            "time_spent_seconds": 10,
            "sequence": 1
        }
        
        websocket.send_json(checkpoint)
        
        # Should receive error
        response = websocket.receive_json()
        assert response["type"] == "checkpoint_error"
        assert response["error_code"] == "TIME_EXPIRED"
