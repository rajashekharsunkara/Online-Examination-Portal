"""
Tests for Student Attempt endpoints
"""
import pytest
from fastapi import status
from datetime import datetime, timedelta
from app.models.attempt import StudentAttempt, StudentAnswer, AttemptStatus
from app.models.exam import Exam, Question, QuestionBank, Trade, ExamQuestion, QuestionType, DifficultyLevel, ExamStatus


# ==================== Attempt Start Tests ====================

def test_start_attempt_success(client, auth_headers_student, db_session):
    """Student can start an exam attempt"""
    # Create exam setup
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    exam = Exam(
        title="Test Exam",
        trade_id=trade.id,
        duration_minutes=60,
        total_marks=10.0,
        passing_marks=4.0,
        status=ExamStatus.PUBLISHED,
        created_by=1
    )
    db_session.add(exam)
    db_session.commit()
    db_session.refresh(exam)
    
    response = client.post(
        "/api/v1/attempts/start",
        json={
            "exam_id": exam.id,
            "workstation_id": "WS001"
        },
        headers=auth_headers_student
    )
    
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["exam_id"] == exam.id
    assert data["status"] == "in_progress"
    assert data["workstation_id"] == "WS001"
    assert data["initial_workstation_id"] == "WS001"
    assert data["duration_minutes"] == 60


def test_start_attempt_draft_exam_fails(client, auth_headers_student, db_session):
    """Cannot start attempt for draft exam"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    exam = Exam(
        title="Draft Exam",
        trade_id=trade.id,
        duration_minutes=60,
        total_marks=10.0,
        passing_marks=4.0,
        status=ExamStatus.DRAFT,
        created_by=1
    )
    db_session.add(exam)
    db_session.commit()
    
    response = client.post(
        "/api/v1/attempts/start",
        json={"exam_id": exam.id},
        headers=auth_headers_student
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "not available" in response.json()["detail"].lower()


def test_start_attempt_duplicate_prevention(client, auth_headers_student, db_session, test_user):
    """Cannot start duplicate active attempt"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    exam = Exam(
        title="Test Exam",
        trade_id=trade.id,
        duration_minutes=60,
        total_marks=10.0,
        passing_marks=4.0,
        status=ExamStatus.PUBLISHED,
        created_by=1
    )
    db_session.add(exam)
    db_session.commit()
    
    # Create existing active attempt
    existing_attempt = StudentAttempt(
        student_id=test_user.id,
        exam_id=exam.id,
        status=AttemptStatus.IN_PROGRESS,
        start_time=datetime.utcnow(),
        duration_minutes=60,
        total_marks=10.0
    )
    db_session.add(existing_attempt)
    db_session.commit()
    
    # Try to start another
    response = client.post(
        "/api/v1/attempts/start",
        json={"exam_id": exam.id},
        headers=auth_headers_student
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "already have an active attempt" in response.json()["detail"].lower()


def test_start_attempt_nonexistent_exam(client, auth_headers_student):
    """Cannot start attempt for nonexistent exam"""
    response = client.post(
        "/api/v1/attempts/start",
        json={"exam_id": 99999},
        headers=auth_headers_student
    )
    
    assert response.status_code == status.HTTP_404_NOT_FOUND


# ==================== List My Attempts Tests ====================

def test_list_my_attempts(client, auth_headers_student, db_session, test_user):
    """Student can list their own attempts"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    exam = Exam(
        title="Test Exam",
        trade_id=trade.id,
        duration_minutes=60,
        total_marks=10.0,
        passing_marks=4.0,
        status=ExamStatus.PUBLISHED,
        created_by=1
    )
    db_session.add(exam)
    db_session.commit()
    
    # Create attempts
    attempt1 = StudentAttempt(
        student_id=test_user.id,
        exam_id=exam.id,
        status=AttemptStatus.IN_PROGRESS,
        start_time=datetime.utcnow(),
        duration_minutes=60,
        total_marks=10.0
    )
    attempt2 = StudentAttempt(
        student_id=test_user.id,
        exam_id=exam.id,
        status=AttemptStatus.SUBMITTED,
        start_time=datetime.utcnow() - timedelta(hours=1),
        submit_time=datetime.utcnow(),
        duration_minutes=60,
        total_marks=10.0
    )
    db_session.add_all([attempt1, attempt2])
    db_session.commit()
    
    response = client.get(
        "/api/v1/attempts/me",
        headers=auth_headers_student
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 2


def test_list_my_attempts_filtered_by_status(client, auth_headers_student, db_session, test_user):
    """Filter my attempts by status"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    exam = Exam(
        title="Test Exam",
        trade_id=trade.id,
        duration_minutes=60,
        total_marks=10.0,
        passing_marks=4.0,
        status=ExamStatus.PUBLISHED,
        created_by=1
    )
    db_session.add(exam)
    db_session.commit()
    
    attempt1 = StudentAttempt(
        student_id=test_user.id,
        exam_id=exam.id,
        status=AttemptStatus.IN_PROGRESS,
        start_time=datetime.utcnow(),
        duration_minutes=60,
        total_marks=10.0
    )
    attempt2 = StudentAttempt(
        student_id=test_user.id,
        exam_id=exam.id,
        status=AttemptStatus.GRADED,
        start_time=datetime.utcnow(),
        duration_minutes=60,
        total_marks=10.0,
        marks_obtained=8.0
    )
    db_session.add_all([attempt1, attempt2])
    db_session.commit()
    
    response = client.get(
        "/api/v1/attempts/me?status_filter=in_progress",
        headers=auth_headers_student
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 1
    assert data[0]["status"] == "in_progress"


# ==================== Get Attempt Tests ====================

def test_get_attempt_with_progress(client, auth_headers_student, db_session, test_user):
    """Get attempt details with progress"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    qbank = QuestionBank(name="Theory", trade_id=trade.id)
    db_session.add(qbank)
    db_session.commit()
    
    # Create questions
    questions = []
    for i in range(5):
        q = Question(
            question_bank_id=qbank.id,
            question_text=f"Question {i+1}",
            question_type=QuestionType.MULTIPLE_CHOICE,
            options={"A": "Opt1", "B": "Opt2"},
            correct_answer=["A"],
            marks=2.0
        )
        questions.append(q)
        db_session.add(q)
    db_session.commit()
    
    exam = Exam(
        title="Test Exam",
        trade_id=trade.id,
        duration_minutes=60,
        total_marks=10.0,
        passing_marks=4.0,
        status=ExamStatus.PUBLISHED,
        created_by=1
    )
    db_session.add(exam)
    db_session.commit()
    
    # Link questions to exam
    for idx, q in enumerate(questions, 1):
        eq = ExamQuestion(exam_id=exam.id, question_id=q.id, order_number=idx)
        db_session.add(eq)
    db_session.commit()
    
    attempt = StudentAttempt(
        student_id=test_user.id,
        exam_id=exam.id,
        status=AttemptStatus.IN_PROGRESS,
        start_time=datetime.utcnow(),
        duration_minutes=60,
        total_marks=10.0,
        questions_answered=2
    )
    db_session.add(attempt)
    db_session.commit()
    db_session.refresh(attempt)
    
    response = client.get(
        f"/api/v1/attempts/{attempt.id}",
        headers=auth_headers_student
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == attempt.id
    assert "progress" in data
    assert data["progress"]["total_questions"] == 5
    assert data["progress"]["answered"] == 2
    assert data["progress"]["unanswered"] == 3


def test_get_attempt_forbidden_for_other_student(client, auth_headers_student, db_session):
    """Students cannot view other students' attempts"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    exam = Exam(
        title="Test Exam",
        trade_id=trade.id,
        duration_minutes=60,
        total_marks=10.0,
        passing_marks=4.0,
        status=ExamStatus.PUBLISHED,
        created_by=1
    )
    db_session.add(exam)
    db_session.commit()
    
    # Create attempt for different student
    attempt = StudentAttempt(
        student_id=9999,  # Different student
        exam_id=exam.id,
        status=AttemptStatus.IN_PROGRESS,
        start_time=datetime.utcnow(),
        duration_minutes=60,
        total_marks=10.0
    )
    db_session.add(attempt)
    db_session.commit()
    
    response = client.get(
        f"/api/v1/attempts/{attempt.id}",
        headers=auth_headers_student
    )
    
    assert response.status_code == status.HTTP_403_FORBIDDEN


# ==================== Resume Attempt Tests ====================

def test_resume_attempt_success(client, auth_headers_student, db_session, test_user):
    """Student can resume an in-progress attempt"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    exam = Exam(
        title="Test Exam",
        trade_id=trade.id,
        duration_minutes=60,
        total_marks=10.0,
        passing_marks=4.0,
        status=ExamStatus.PUBLISHED,
        created_by=1
    )
    db_session.add(exam)
    db_session.commit()
    
    attempt = StudentAttempt(
        student_id=test_user.id,
        exam_id=exam.id,
        status=AttemptStatus.IN_PROGRESS,
        start_time=datetime.utcnow(),
        duration_minutes=60,
        total_marks=10.0,
        workstation_id="WS001"
    )
    db_session.add(attempt)
    db_session.commit()
    db_session.refresh(attempt)
    
    response = client.post(
        f"/api/v1/attempts/{attempt.id}/resume",
        json={"workstation_id": "WS002"},
        headers=auth_headers_student
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["workstation_id"] == "WS002"
    assert data["transfer_count"] == 1


def test_resume_attempt_already_submitted(client, auth_headers_student, db_session, test_user):
    """Cannot resume submitted attempt"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    exam = Exam(
        title="Test Exam",
        trade_id=trade.id,
        duration_minutes=60,
        total_marks=10.0,
        passing_marks=4.0,
        status=ExamStatus.PUBLISHED,
        created_by=1
    )
    db_session.add(exam)
    db_session.commit()
    
    attempt = StudentAttempt(
        student_id=test_user.id,
        exam_id=exam.id,
        status=AttemptStatus.SUBMITTED,
        start_time=datetime.utcnow(),
        submit_time=datetime.utcnow(),
        duration_minutes=60,
        total_marks=10.0
    )
    db_session.add(attempt)
    db_session.commit()
    
    response = client.post(
        f"/api/v1/attempts/{attempt.id}/resume",
        json={},
        headers=auth_headers_student
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST


# ==================== Time Status Tests ====================

def test_get_time_status(client, auth_headers_student, db_session, test_user):
    """Get time remaining for attempt"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    exam = Exam(
        title="Test Exam",
        trade_id=trade.id,
        duration_minutes=60,
        total_marks=10.0,
        passing_marks=4.0,
        status=ExamStatus.PUBLISHED,
        created_by=1
    )
    db_session.add(exam)
    db_session.commit()
    
    attempt = StudentAttempt(
        student_id=test_user.id,
        exam_id=exam.id,
        status=AttemptStatus.IN_PROGRESS,
        start_time=datetime.utcnow() - timedelta(minutes=10),
        duration_minutes=60,
        total_marks=10.0
    )
    db_session.add(attempt)
    db_session.commit()
    db_session.refresh(attempt)
    
    response = client.get(
        f"/api/v1/attempts/{attempt.id}/time-status",
        headers=auth_headers_student
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "time_remaining_seconds" in data
    assert data["duration_minutes"] == 60
    assert data["time_remaining_seconds"] <= 3000  # Less than 50 minutes remaining


# ==================== Answer Recording Tests ====================

def test_save_answer_success(client, auth_headers_student, db_session, test_user):
    """Save an answer successfully"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    qbank = QuestionBank(name="Theory", trade_id=trade.id)
    db_session.add(qbank)
    db_session.commit()
    
    question = Question(
        question_bank_id=qbank.id,
        question_text="Test question",
        question_type=QuestionType.MULTIPLE_CHOICE,
        options={"A": "Opt1", "B": "Opt2"},
        correct_answer=["A"],
        marks=2.0
    )
    db_session.add(question)
    db_session.commit()
    
    exam = Exam(
        title="Test Exam",
        trade_id=trade.id,
        duration_minutes=60,
        total_marks=10.0,
        passing_marks=4.0,
        status=ExamStatus.PUBLISHED,
        created_by=1
    )
    db_session.add(exam)
    db_session.commit()
    
    eq = ExamQuestion(exam_id=exam.id, question_id=question.id, order_number=1)
    db_session.add(eq)
    db_session.commit()
    
    attempt = StudentAttempt(
        student_id=test_user.id,
        exam_id=exam.id,
        status=AttemptStatus.IN_PROGRESS,
        start_time=datetime.utcnow(),
        duration_minutes=60,
        total_marks=10.0
    )
    db_session.add(attempt)
    db_session.commit()
    db_session.refresh(attempt)
    
    response = client.post(
        f"/api/v1/attempts/{attempt.id}/answers",
        json={
            "question_id": question.id,
            "answer": ["B"],
            "time_spent_seconds": 30
        },
        headers=auth_headers_student
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["question_id"] == question.id
    assert data["answer"] == ["B"]


def test_update_existing_answer(client, auth_headers_student, db_session, test_user):
    """Update an existing answer (idempotent)"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    qbank = QuestionBank(name="Theory", trade_id=trade.id)
    db_session.add(qbank)
    db_session.commit()
    
    question = Question(
        question_bank_id=qbank.id,
        question_text="Test question",
        question_type=QuestionType.MULTIPLE_CHOICE,
        options={"A": "Opt1", "B": "Opt2"},
        correct_answer=["A"],
        marks=2.0
    )
    db_session.add(question)
    db_session.commit()
    
    exam = Exam(
        title="Test Exam",
        trade_id=trade.id,
        duration_minutes=60,
        total_marks=10.0,
        passing_marks=4.0,
        status=ExamStatus.PUBLISHED,
        created_by=1
    )
    db_session.add(exam)
    db_session.commit()
    
    eq = ExamQuestion(exam_id=exam.id, question_id=question.id, order_number=1)
    db_session.add(eq)
    db_session.commit()
    
    attempt = StudentAttempt(
        student_id=test_user.id,
        exam_id=exam.id,
        status=AttemptStatus.IN_PROGRESS,
        start_time=datetime.utcnow(),
        duration_minutes=60,
        total_marks=10.0
    )
    db_session.add(attempt)
    db_session.commit()
    
    # First answer
    existing_answer = StudentAnswer(
        attempt_id=attempt.id,
        question_id=question.id,
        answer=["A"],
        time_spent_seconds=20
    )
    db_session.add(existing_answer)
    db_session.commit()
    
    # Update answer
    response = client.post(
        f"/api/v1/attempts/{attempt.id}/answers",
        json={
            "question_id": question.id,
            "answer": ["B"],
            "time_spent_seconds": 10
        },
        headers=auth_headers_student
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["answer"] == ["B"]
    assert data["time_spent_seconds"] == 30  # Cumulative


def test_save_answer_for_wrong_exam_question(client, auth_headers_student, db_session, test_user):
    """Cannot save answer for question not in exam"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    qbank = QuestionBank(name="Theory", trade_id=trade.id)
    db_session.add(qbank)
    db_session.commit()
    
    question = Question(
        question_bank_id=qbank.id,
        question_text="Test question",
        question_type=QuestionType.MULTIPLE_CHOICE,
        options={"A": "Opt1", "B": "Opt2"},
        correct_answer=["A"],
        marks=2.0
    )
    db_session.add(question)
    db_session.commit()
    
    exam = Exam(
        title="Test Exam",
        trade_id=trade.id,
        duration_minutes=60,
        total_marks=10.0,
        passing_marks=4.0,
        status=ExamStatus.PUBLISHED,
        created_by=1
    )
    db_session.add(exam)
    db_session.commit()
    
    # Note: NOT adding ExamQuestion link
    
    attempt = StudentAttempt(
        student_id=test_user.id,
        exam_id=exam.id,
        status=AttemptStatus.IN_PROGRESS,
        start_time=datetime.utcnow(),
        duration_minutes=60,
        total_marks=10.0
    )
    db_session.add(attempt)
    db_session.commit()
    
    response = client.post(
        f"/api/v1/attempts/{attempt.id}/answers",
        json={
            "question_id": question.id,
            "answer": ["B"]
        },
        headers=auth_headers_student
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST


# ==================== Submit Attempt Tests ====================

def test_submit_attempt_success(client, auth_headers_student, db_session, test_user):
    """Submit attempt successfully and trigger auto-grading"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    qbank = QuestionBank(name="Theory", trade_id=trade.id)
    db_session.add(qbank)
    db_session.commit()
    
    question = Question(
        question_bank_id=qbank.id,
        question_text="Test question",
        question_type=QuestionType.MULTIPLE_CHOICE,
        options={"A": "Correct", "B": "Wrong"},
        correct_answer=["A"],
        marks=10.0
    )
    db_session.add(question)
    db_session.commit()
    
    exam = Exam(
        title="Test Exam",
        trade_id=trade.id,
        duration_minutes=60,
        total_marks=10.0,
        passing_marks=5.0,
        status=ExamStatus.PUBLISHED,
        created_by=1
    )
    db_session.add(exam)
    db_session.commit()
    
    eq = ExamQuestion(exam_id=exam.id, question_id=question.id, order_number=1)
    db_session.add(eq)
    db_session.commit()
    
    attempt = StudentAttempt(
        student_id=test_user.id,
        exam_id=exam.id,
        status=AttemptStatus.IN_PROGRESS,
        start_time=datetime.utcnow(),
        duration_minutes=60,
        total_marks=10.0
    )
    db_session.add(attempt)
    db_session.commit()
    
    # Add correct answer
    answer = StudentAnswer(
        attempt_id=attempt.id,
        question_id=question.id,
        answer=["A"]
    )
    db_session.add(answer)
    db_session.commit()
    
    response = client.post(
        f"/api/v1/attempts/{attempt.id}/submit",
        json={"confirm": True},
        headers=auth_headers_student
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "graded"
    assert data["marks_obtained"] == 10.0
    assert data["is_passed"] is True
    assert data["correct_answers"] == 1


def test_submit_attempt_requires_confirmation(client, auth_headers_student, db_session, test_user):
    """Submit requires confirm=true"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    exam = Exam(
        title="Test Exam",
        trade_id=trade.id,
        duration_minutes=60,
        total_marks=10.0,
        passing_marks=5.0,
        status=ExamStatus.PUBLISHED,
        created_by=1
    )
    db_session.add(exam)
    db_session.commit()
    
    attempt = StudentAttempt(
        student_id=test_user.id,
        exam_id=exam.id,
        status=AttemptStatus.IN_PROGRESS,
        start_time=datetime.utcnow(),
        duration_minutes=60,
        total_marks=10.0
    )
    db_session.add(attempt)
    db_session.commit()
    
    response = client.post(
        f"/api/v1/attempts/{attempt.id}/submit",
        json={"confirm": False},
        headers=auth_headers_student
    )
    
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


# ==================== Grading Tests ====================

def test_auto_grading_mcq_correct(client, auth_headers_student, db_session, test_user):
    """Auto-grade MCQ with correct answer"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    qbank = QuestionBank(name="Theory", trade_id=trade.id)
    db_session.add(qbank)
    db_session.commit()
    
    question = Question(
        question_bank_id=qbank.id,
        question_text="What is 2+2?",
        question_type=QuestionType.MULTIPLE_CHOICE,
        options={"A": "3", "B": "4", "C": "5"},
        correct_answer=["B"],
        marks=5.0,
        negative_marks=1.0
    )
    db_session.add(question)
    db_session.commit()
    
    exam = Exam(
        title="Math Test",
        trade_id=trade.id,
        duration_minutes=30,
        total_marks=5.0,
        passing_marks=3.0,
        status=ExamStatus.PUBLISHED,
        created_by=1
    )
    db_session.add(exam)
    db_session.commit()
    
    eq = ExamQuestion(exam_id=exam.id, question_id=question.id, order_number=1)
    db_session.add(eq)
    db_session.commit()
    
    attempt = StudentAttempt(
        student_id=test_user.id,
        exam_id=exam.id,
        status=AttemptStatus.IN_PROGRESS,
        start_time=datetime.utcnow(),
        duration_minutes=30,
        total_marks=5.0
    )
    db_session.add(attempt)
    db_session.commit()
    
    # Correct answer
    answer = StudentAnswer(
        attempt_id=attempt.id,
        question_id=question.id,
        answer=["B"]
    )
    db_session.add(answer)
    db_session.commit()
    
    response = client.post(
        f"/api/v1/attempts/{attempt.id}/submit",
        json={"confirm": True},
        headers=auth_headers_student
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["marks_obtained"] == 5.0
    assert data["is_passed"] is True


def test_auto_grading_mcq_incorrect_with_negative_marks(client, auth_headers_student, db_session, test_user):
    """Auto-grade MCQ with incorrect answer and negative marking"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    qbank = QuestionBank(name="Theory", trade_id=trade.id)
    db_session.add(qbank)
    db_session.commit()
    
    question = Question(
        question_bank_id=qbank.id,
        question_text="What is 2+2?",
        question_type=QuestionType.MULTIPLE_CHOICE,
        options={"A": "3", "B": "4", "C": "5"},
        correct_answer=["B"],
        marks=5.0,
        negative_marks=1.0
    )
    db_session.add(question)
    db_session.commit()
    
    exam = Exam(
        title="Math Test",
        trade_id=trade.id,
        duration_minutes=30,
        total_marks=5.0,
        passing_marks=3.0,
        status=ExamStatus.PUBLISHED,
        created_by=1
    )
    db_session.add(exam)
    db_session.commit()
    
    eq = ExamQuestion(exam_id=exam.id, question_id=question.id, order_number=1)
    db_session.add(eq)
    db_session.commit()
    
    attempt = StudentAttempt(
        student_id=test_user.id,
        exam_id=exam.id,
        status=AttemptStatus.IN_PROGRESS,
        start_time=datetime.utcnow(),
        duration_minutes=30,
        total_marks=5.0
    )
    db_session.add(attempt)
    db_session.commit()
    
    # Wrong answer
    answer = StudentAnswer(
        attempt_id=attempt.id,
        question_id=question.id,
        answer=["A"]
    )
    db_session.add(answer)
    db_session.commit()
    
    response = client.post(
        f"/api/v1/attempts/{attempt.id}/submit",
        json={"confirm": True},
        headers=auth_headers_student
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["marks_obtained"] == -1.0  # Negative marking
    assert data["is_passed"] is False


# ==================== Get Result Tests ====================

def test_get_attempt_result(client, auth_headers_student, db_session, test_user):
    """Get detailed result for graded attempt"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    exam = Exam(
        title="Test Exam",
        trade_id=trade.id,
        duration_minutes=60,
        total_marks=10.0,
        passing_marks=5.0,
        status=ExamStatus.PUBLISHED,
        created_by=1
    )
    db_session.add(exam)
    db_session.commit()
    
    attempt = StudentAttempt(
        student_id=test_user.id,
        exam_id=exam.id,
        status=AttemptStatus.GRADED,
        start_time=datetime.utcnow(),
        submit_time=datetime.utcnow(),
        duration_minutes=60,
        total_marks=10.0,
        marks_obtained=7.5,
        percentage=75.0,
        is_passed=True
    )
    db_session.add(attempt)
    db_session.commit()
    db_session.refresh(attempt)
    
    response = client.get(
        f"/api/v1/attempts/{attempt.id}/result",
        headers=auth_headers_student
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["marks_obtained"] == 7.5
    assert data["is_passed"] is True
    assert "exam_title" in data


# ==================== Admin Endpoints Tests ====================

def test_admin_list_all_attempts(client, auth_headers_admin, db_session):
    """Admin can list all attempts"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    exam = Exam(
        title="Test Exam",
        trade_id=trade.id,
        duration_minutes=60,
        total_marks=10.0,
        passing_marks=5.0,
        status=ExamStatus.PUBLISHED,
        created_by=1
    )
    db_session.add(exam)
    db_session.commit()
    
    # Create multiple attempts by different students
    for student_id in [1, 2, 3]:
        attempt = StudentAttempt(
            student_id=student_id,
            exam_id=exam.id,
            status=AttemptStatus.IN_PROGRESS,
            start_time=datetime.utcnow(),
            duration_minutes=60,
            total_marks=10.0
        )
        db_session.add(attempt)
    db_session.commit()
    
    response = client.get(
        "/api/v1/attempts/",
        headers=auth_headers_admin
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) >= 3


def test_get_exam_statistics(client, auth_headers_admin, db_session):
    """Admin can get exam statistics"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    exam = Exam(
        title="Test Exam",
        trade_id=trade.id,
        duration_minutes=60,
        total_marks=10.0,
        passing_marks=5.0,
        status=ExamStatus.PUBLISHED,
        created_by=1
    )
    db_session.add(exam)
    db_session.commit()
    db_session.refresh(exam)
    
    # Create graded attempts
    for i in range(5):
        attempt = StudentAttempt(
            student_id=i + 1,
            exam_id=exam.id,
            status=AttemptStatus.GRADED,
            start_time=datetime.utcnow() - timedelta(hours=1),
            submit_time=datetime.utcnow(),
            duration_minutes=60,
            total_marks=10.0,
            marks_obtained=float(i + 5),  # 5, 6, 7, 8, 9
            is_passed=True
        )
        db_session.add(attempt)
    db_session.commit()
    
    response = client.get(
        f"/api/v1/attempts/statistics/{exam.id}",
        headers=auth_headers_admin
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["total_attempts"] == 5
    assert data["completed_attempts"] == 5
    assert data["average_score"] == 7.0
    assert data["pass_rate"] == 100.0
