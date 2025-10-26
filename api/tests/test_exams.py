"""
Tests for Exam Management endpoints
"""
import pytest
from fastapi import status
from datetime import datetime
import io
import csv

from app.models.exam import (
    Trade, QuestionBank, Question, Exam,
    QuestionType, DifficultyLevel, ExamStatus
)


# ==================== Trade Tests ====================

def test_create_trade_as_admin(client, auth_headers_admin):
    """Admin can create trades"""
    response = client.post(
        "/api/v1/exams/trades",
        json={
            "name": "Electrician",
            "code": "ELEC",
            "description": "Electrician Trade"
        },
        headers=auth_headers_admin
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["code"] == "ELEC"
    assert data["name"] == "Electrician"
    assert data["is_active"] is True


def test_create_trade_duplicate_code(client, auth_headers_admin, db_session):
    """Cannot create trade with duplicate code"""
    # Create first trade
    trade = Trade(name="Test Trade", code="TEST", description="Test")
    db_session.add(trade)
    db_session.commit()
    
    # Try to create duplicate
    response = client.post(
        "/api/v1/exams/trades",
        json={
            "name": "Another Trade",
            "code": "TEST",
            "description": "Duplicate code"
        },
        headers=auth_headers_admin
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "already exists" in response.json()["detail"].lower()


def test_create_trade_requires_permission(client, auth_headers_student):
    """Students cannot create trades"""
    response = client.post(
        "/api/v1/exams/trades",
        json={
            "name": "Electrician",
            "code": "ELEC"
        },
        headers=auth_headers_student
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_list_trades(client, auth_headers_student, db_session):
    """Any authenticated user can list trades"""
    # Create test trades
    trade1 = Trade(name="Electrician", code="ELEC", is_active=True)
    trade2 = Trade(name="Plumber", code="PLUM", is_active=True)
    trade3 = Trade(name="Carpenter", code="CARP", is_active=False)
    db_session.add_all([trade1, trade2, trade3])
    db_session.commit()
    
    # List active only
    response = client.get(
        "/api/v1/exams/trades",
        headers=auth_headers_student
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 2
    
    # List all
    response = client.get(
        "/api/v1/exams/trades?active_only=false",
        headers=auth_headers_student
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 3


def test_get_trade_by_id(client, auth_headers_student, db_session):
    """Get a specific trade"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    db_session.refresh(trade)
    
    response = client.get(
        f"/api/v1/exams/trades/{trade.id}",
        headers=auth_headers_student
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["code"] == "ELEC"


def test_update_trade(client, auth_headers_admin, db_session):
    """Admin can update trades"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    db_session.refresh(trade)
    
    response = client.put(
        f"/api/v1/exams/trades/{trade.id}",
        json={"is_active": False},
        headers=auth_headers_admin
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["is_active"] is False


def test_delete_trade(client, auth_headers_admin, db_session):
    """Admin can delete trades"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    trade_id = trade.id
    
    response = client.delete(
        f"/api/v1/exams/trades/{trade_id}",
        headers=auth_headers_admin
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # Verify deleted
    assert db_session.query(Trade).filter(Trade.id == trade_id).first() is None


# ==================== Question Bank Tests ====================

def test_create_question_bank(client, auth_headers_admin, db_session):
    """Admin can create question banks"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    db_session.refresh(trade)
    
    response = client.post(
        "/api/v1/exams/question-banks",
        json={
            "name": "Basic Electrical Theory",
            "description": "Fundamental electrical concepts",
            "trade_id": trade.id
        },
        headers=auth_headers_admin
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == "Basic Electrical Theory"
    assert data["trade_id"] == trade.id


def test_create_question_bank_invalid_trade(client, auth_headers_admin):
    """Cannot create question bank with invalid trade"""
    response = client.post(
        "/api/v1/exams/question-banks",
        json={
            "name": "Test Bank",
            "trade_id": 99999
        },
        headers=auth_headers_admin
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_list_question_banks_by_trade(client, auth_headers_student, db_session):
    """Filter question banks by trade"""
    trade1 = Trade(name="Electrician", code="ELEC")
    trade2 = Trade(name="Plumber", code="PLUM")
    db_session.add_all([trade1, trade2])
    db_session.commit()
    
    qbank1 = QuestionBank(name="Electrical Theory", trade_id=trade1.id)
    qbank2 = QuestionBank(name="Plumbing Basics", trade_id=trade2.id)
    db_session.add_all([qbank1, qbank2])
    db_session.commit()
    
    response = client.get(
        f"/api/v1/exams/question-banks?trade_id={trade1.id}",
        headers=auth_headers_student
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Electrical Theory"


# ==================== Question Tests ====================

def test_create_mcq_question(client, auth_headers_admin, db_session):
    """Create a multiple choice question"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    qbank = QuestionBank(name="Theory", trade_id=trade.id)
    db_session.add(qbank)
    db_session.commit()
    db_session.refresh(qbank)
    
    response = client.post(
        "/api/v1/exams/questions",
        json={
            "question_bank_id": qbank.id,
            "question_text": "What is the unit of voltage?",
            "question_type": "multiple_choice",
            "options": {
                "A": "Ampere",
                "B": "Volt",
                "C": "Watt",
                "D": "Ohm"
            },
            "correct_answer": ["B"],
            "explanation": "Volt is the unit of voltage",
            "difficulty": "easy",
            "marks": 1.0,
            "negative_marks": 0.25
        },
        headers=auth_headers_admin
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["question_text"] == "What is the unit of voltage?"
    assert data["correct_answer"] == ["B"]
    assert data["difficulty"] == "easy"


def test_create_question_mcq_requires_options(client, auth_headers_admin, db_session):
    """MCQ questions must have options"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    qbank = QuestionBank(name="Theory", trade_id=trade.id)
    db_session.add(qbank)
    db_session.commit()
    db_session.refresh(qbank)
    
    response = client.post(
        "/api/v1/exams/questions",
        json={
            "question_bank_id": qbank.id,
            "question_text": "What is voltage?",
            "question_type": "multiple_choice",
            "correct_answer": ["B"],
            "marks": 1.0
        },
        headers=auth_headers_admin
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_create_true_false_question(client, auth_headers_admin, db_session):
    """Create a true/false question"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    qbank = QuestionBank(name="Theory", trade_id=trade.id)
    db_session.add(qbank)
    db_session.commit()
    db_session.refresh(qbank)
    
    response = client.post(
        "/api/v1/exams/questions",
        json={
            "question_bank_id": qbank.id,
            "question_text": "Water is a good conductor of electricity",
            "question_type": "true_false",
            "correct_answer": ["True"],
            "marks": 1.0
        },
        headers=auth_headers_admin
    )
    assert response.status_code == status.HTTP_201_CREATED


def test_list_questions_with_filters(client, auth_headers_student, db_session):
    """Filter questions by type and difficulty"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    qbank = QuestionBank(name="Theory", trade_id=trade.id)
    db_session.add(qbank)
    db_session.commit()
    
    q1 = Question(
        question_bank_id=qbank.id,
        question_text="Easy MCQ",
        question_type=QuestionType.MULTIPLE_CHOICE,
        options={"A": "Opt1", "B": "Opt2"},
        correct_answer=["A"],
        difficulty=DifficultyLevel.EASY,
        marks=1.0
    )
    q2 = Question(
        question_bank_id=qbank.id,
        question_text="Hard MCQ",
        question_type=QuestionType.MULTIPLE_CHOICE,
        options={"A": "Opt1", "B": "Opt2"},
        correct_answer=["A"],
        difficulty=DifficultyLevel.HARD,
        marks=2.0
    )
    q3 = Question(
        question_bank_id=qbank.id,
        question_text="True/False",
        question_type=QuestionType.TRUE_FALSE,
        correct_answer=["True"],
        difficulty=DifficultyLevel.EASY,
        marks=1.0
    )
    db_session.add_all([q1, q2, q3])
    db_session.commit()
    
    # Filter by difficulty
    response = client.get(
        f"/api/v1/exams/questions?question_bank_id={qbank.id}&difficulty=easy",
        headers=auth_headers_student
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 2
    
    # Filter by type
    response = client.get(
        f"/api/v1/exams/questions?question_bank_id={qbank.id}&question_type=multiple_choice",
        headers=auth_headers_student
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 2


def test_update_question(client, auth_headers_admin, db_session):
    """Update a question"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    qbank = QuestionBank(name="Theory", trade_id=trade.id)
    db_session.add(qbank)
    db_session.commit()
    
    question = Question(
        question_bank_id=qbank.id,
        question_text="Old text",
        question_type=QuestionType.MULTIPLE_CHOICE,
        options={"A": "Opt1", "B": "Opt2"},
        correct_answer=["A"],
        marks=1.0
    )
    db_session.add(question)
    db_session.commit()
    db_session.refresh(question)
    
    response = client.put(
        f"/api/v1/exams/questions/{question.id}",
        json={"question_text": "New text"},
        headers=auth_headers_admin
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["question_text"] == "New text"


def test_delete_question(client, auth_headers_admin, db_session):
    """Delete a question"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    qbank = QuestionBank(name="Theory", trade_id=trade.id)
    db_session.add(qbank)
    db_session.commit()
    
    question = Question(
        question_bank_id=qbank.id,
        question_text="Test",
        question_type=QuestionType.MULTIPLE_CHOICE,
        options={"A": "Opt1", "B": "Opt2"},
        correct_answer=["A"],
        marks=1.0
    )
    db_session.add(question)
    db_session.commit()
    question_id = question.id
    
    response = client.delete(
        f"/api/v1/exams/questions/{question_id}",
        headers=auth_headers_admin
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    assert db_session.query(Question).filter(Question.id == question_id).first() is None


# ==================== CSV Import Tests ====================

def test_import_questions_csv(client, auth_headers_admin, db_session):
    """Import questions from CSV"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    qbank = QuestionBank(name="Theory", trade_id=trade.id)
    db_session.add(qbank)
    db_session.commit()
    db_session.refresh(qbank)
    
    # Create CSV content
    csv_content = """question_text,question_type,option_a,option_b,option_c,option_d,correct_answer,explanation,difficulty,marks,negative_marks,tags
What is voltage?,multiple_choice,Current,Voltage,Resistance,Power,B,Volt is the unit,easy,1.0,0.25,"electricity,basics"
Water conducts electricity,true_false,,,,True,,Pure water doesn't,medium,1.0,0.0,safety"""
    
    # Create file-like object
    csv_file = io.BytesIO(csv_content.encode('utf-8'))
    
    response = client.post(
        f"/api/v1/exams/question-banks/{qbank.id}/import-csv",
        files={"file": ("questions.csv", csv_file, "text/csv")},
        headers=auth_headers_admin
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["imported"] == 2
    assert len(data["errors"]) == 0
    
    # Verify questions were created
    questions = db_session.query(Question).filter(Question.question_bank_id == qbank.id).all()
    assert len(questions) == 2


# ==================== Exam Tests ====================

def test_create_exam(client, auth_headers_admin, db_session):
    """Create an exam"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    db_session.refresh(trade)
    
    response = client.post(
        "/api/v1/exams/",
        json={
            "title": "Basic Electrical Theory Exam",
            "description": "Covers fundamentals",
            "trade_id": trade.id,
            "duration_minutes": 90,
            "total_marks": 100.0,
            "passing_marks": 40.0,
            "instructions": "Answer all questions"
        },
        headers=auth_headers_admin
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["title"] == "Basic Electrical Theory Exam"
    assert data["status"] == "draft"
    assert data["total_marks"] == 100.0


def test_create_exam_with_questions(client, auth_headers_admin, db_session):
    """Create exam with attached questions"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    qbank = QuestionBank(name="Theory", trade_id=trade.id)
    db_session.add(qbank)
    db_session.commit()
    
    q1 = Question(
        question_bank_id=qbank.id,
        question_text="Q1",
        question_type=QuestionType.MULTIPLE_CHOICE,
        options={"A": "Opt1", "B": "Opt2"},
        correct_answer=["A"],
        marks=1.0
    )
    q2 = Question(
        question_bank_id=qbank.id,
        question_text="Q2",
        question_type=QuestionType.TRUE_FALSE,
        correct_answer=["True"],
        marks=1.0
    )
    db_session.add_all([q1, q2])
    db_session.commit()
    
    response = client.post(
        "/api/v1/exams/",
        json={
            "title": "Test Exam",
            "trade_id": trade.id,
            "duration_minutes": 60,
            "total_marks": 2.0,
            "passing_marks": 1.0,
            "question_ids": [q1.id, q2.id]
        },
        headers=auth_headers_admin
    )
    assert response.status_code == status.HTTP_201_CREATED
    
    # Verify questions attached
    exam_id = response.json()["id"]
    from app.models.exam import ExamQuestion
    exam_questions = db_session.query(ExamQuestion).filter(
        ExamQuestion.exam_id == exam_id
    ).order_by(ExamQuestion.order_number).all()
    assert len(exam_questions) == 2
    assert exam_questions[0].order_number == 1
    assert exam_questions[1].order_number == 2


def test_create_exam_passing_marks_validation(client, auth_headers_admin, db_session):
    """Passing marks cannot exceed total marks"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    response = client.post(
        "/api/v1/exams/",
        json={
            "title": "Test Exam",
            "trade_id": trade.id,
            "duration_minutes": 60,
            "total_marks": 100.0,
            "passing_marks": 110.0  # Invalid
        },
        headers=auth_headers_admin
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_list_exams(client, auth_headers_student, db_session):
    """List exams with filters"""
    trade1 = Trade(name="Electrician", code="ELEC")
    trade2 = Trade(name="Plumber", code="PLUM")
    db_session.add_all([trade1, trade2])
    db_session.commit()
    
    exam1 = Exam(
        title="Electrical Exam",
        trade_id=trade1.id,
        duration_minutes=90,
        total_marks=100,
        passing_marks=40,
        status=ExamStatus.PUBLISHED,
        created_by=1
    )
    exam2 = Exam(
        title="Plumbing Exam",
        trade_id=trade2.id,
        duration_minutes=60,
        total_marks=50,
        passing_marks=20,
        status=ExamStatus.DRAFT,
        created_by=1
    )
    db_session.add_all([exam1, exam2])
    db_session.commit()
    
    # Filter by trade
    response = client.get(
        f"/api/v1/exams/?trade_id={trade1.id}",
        headers=auth_headers_student
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 1
    
    # Filter by status
    response = client.get(
        "/api/v1/exams/?status_filter=published",
        headers=auth_headers_student
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 1


def test_update_exam(client, auth_headers_admin, db_session):
    """Update exam details"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    exam = Exam(
        title="Old Title",
        trade_id=trade.id,
        duration_minutes=60,
        total_marks=100,
        passing_marks=40,
        status=ExamStatus.DRAFT,
        created_by=1
    )
    db_session.add(exam)
    db_session.commit()
    db_session.refresh(exam)
    
    response = client.put(
        f"/api/v1/exams/{exam.id}",
        json={"status": "published"},
        headers=auth_headers_admin
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "published"


def test_export_exam_qti(client, auth_headers_admin, db_session):
    """Export exam in QTI format"""
    trade = Trade(name="Electrician", code="ELEC")
    db_session.add(trade)
    db_session.commit()
    
    qbank = QuestionBank(name="Theory", trade_id=trade.id)
    db_session.add(qbank)
    db_session.commit()
    
    q1 = Question(
        question_bank_id=qbank.id,
        question_text="What is voltage?",
        question_type=QuestionType.MULTIPLE_CHOICE,
        options={"A": "Current", "B": "Voltage"},
        correct_answer=["B"],
        difficulty=DifficultyLevel.EASY,
        marks=1.0
    )
    db_session.add(q1)
    db_session.commit()
    
    exam = Exam(
        title="Test Exam",
        description="Test description",
        trade_id=trade.id,
        duration_minutes=60,
        total_marks=1.0,
        passing_marks=0.5,
        created_by=1
    )
    db_session.add(exam)
    db_session.commit()
    db_session.refresh(exam)
    
    from app.models.exam import ExamQuestion
    eq = ExamQuestion(exam_id=exam.id, question_id=q1.id, order_number=1)
    db_session.add(eq)
    db_session.commit()
    
    response = client.get(
        f"/api/v1/exams/{exam.id}/export-qti",
        headers=auth_headers_admin
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == "Test Exam"
    assert len(data["questions"]) == 1
    assert data["questions"][0]["question_text"] == "What is voltage?"
