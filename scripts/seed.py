"""
Database Seeding Script - Demo Data
Creates sample users, centers, halls, and exams for development/testing
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.core.security import get_password_hash
from app.models.user import User, Role, Center, Base
from app.models.exam import (
    Trade, QuestionBank, Question, Exam, ExamQuestion,
    QuestionType, DifficultyLevel, ExamStatus
)
from app.models.attempt import StudentAttempt, StudentAnswer, AttemptStatus
from datetime import datetime, timedelta

def seed_database():
    """Seed database with demo data"""
    print("🌱 Database seeding script")
    print("=" * 50)
    
    # Create tables
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if roles already exist
        existing_roles = db.query(Role).count()
        if existing_roles > 0:
            print("⚠️  Data already exists. Skipping seed.")
            return
        
        # Create roles
        print("Creating roles...")
        roles_data = [
            {"name": "admin", "description": "System administrator with full access"},
            {"name": "hall_in_charge", "description": "Hall in-charge managing exam hall"},
            {"name": "hall_auth", "description": "Hall authenticator verifying candidates"},
            {"name": "technician", "description": "Technical support staff"},
            {"name": "student", "description": "Exam candidate/student"},
        ]
        
        roles = {}
        for role_data in roles_data:
            role = Role(**role_data)
            db.add(role)
            db.flush()
            roles[role.name] = role
        
        db.commit()
        print(f"✅ Created {len(roles)} roles")
        
        # Create centers
        print("Creating centers...")
        centers_data = [
            {
                "name": "Mumbai Central ITI",
                "code": "MUM01",
                "city": "Mumbai",
                "state": "Maharashtra",
                "address": "123 Main Street",
                "pincode": "400001"
            },
            {
                "name": "Delhi Technical Center",
                "code": "DEL01",
                "city": "New Delhi",
                "state": "Delhi",
                "address": "456 Tech Park",
                "pincode": "110001"
            },
        ]
        
        centers = []
        for center_data in centers_data:
            center = Center(**center_data)
            db.add(center)
            db.flush()
            centers.append(center)
        
        db.commit()
        print(f"✅ Created {len(centers)} centers")
        
        # Create users
        print("Creating users...")
        
        # Admin user
        admin = User(
            email="admin@example.com",
            username="admin",
            hashed_password=get_password_hash("admin123"),
            full_name="System Administrator",
            is_active=True,
            is_verified=True
        )
        admin.roles.append(roles["admin"])
        db.add(admin)
        
        # Hall in-charge users
        for i, center in enumerate(centers, 1):
            hic = User(
                email=f"hic{i}@example.com",
                username=f"hic{i}",
                hashed_password=get_password_hash("pass123"),
                full_name=f"Hall In-charge {i}",
                center_id=center.id,
                is_active=True,
                is_verified=True
            )
            hic.roles.append(roles["hall_in_charge"])
            db.add(hic)
        
        # Hall authenticators
        for i, center in enumerate(centers, 1):
            auth = User(
                email=f"hallauth{i}@example.com",
                username=f"hallauth{i}",
                hashed_password=get_password_hash("pass123"),
                full_name=f"Hall Authenticator {i}",
                center_id=center.id,
                is_active=True,
                is_verified=True
            )
            auth.roles.append(roles["hall_auth"])
            db.add(auth)
        
        # Technicians
        for i, center in enumerate(centers, 1):
            tech = User(
                email=f"tech{i}@example.com",
                username=f"tech{i}",
                hashed_password=get_password_hash("pass123"),
                full_name=f"Technician {i}",
                center_id=center.id,
                is_active=True,
                is_verified=True
            )
            tech.roles.append(roles["technician"])
            db.add(tech)
        
        # Students (50 total, distributed across centers)
        student_count = 0
        for center_idx, center in enumerate(centers):
            for i in range(1, 26):  # 25 students per center
                student_num = center_idx * 25 + i
                student = User(
                    email=f"student{student_num:03d}@example.com",
                    username=f"student{student_num:03d}",
                    hashed_password=get_password_hash("pass123"),
                    full_name=f"Student {student_num:03d}",
                    center_id=center.id,
                    is_active=True,
                    is_verified=True
                )
                student.roles.append(roles["student"])
                db.add(student)
                student_count += 1
        
        db.commit()
        print(f"✅ Created {student_count + 7} users")
        
        # Create trades
        print("Creating trades...")
        trades_data = [
            {
                "name": "Electrician",
                "code": "ELEC",
                "description": "Electrical trade covering wiring, circuits, and safety"
            },
            {
                "name": "Plumber",
                "code": "PLUM",
                "description": "Plumbing trade covering pipes, fittings, and installations"
            },
            {
                "name": "Welder",
                "code": "WELD",
                "description": "Welding trade covering various welding techniques"
            },
        ]
        
        trades = {}
        for trade_data in trades_data:
            trade = Trade(**trade_data)
            db.add(trade)
            db.flush()
            trades[trade.code] = trade
        
        db.commit()
        print(f"✅ Created {len(trades)} trades")
        
        # Create question banks
        print("Creating question banks...")
        qbanks_data = [
            {
                "name": "Basic Electrical Theory",
                "description": "Fundamental electrical concepts",
                "trade_id": trades["ELEC"].id
            },
            {
                "name": "Advanced Electrical Circuits",
                "description": "Complex circuit design and analysis",
                "trade_id": trades["ELEC"].id
            },
            {
                "name": "Plumbing Basics",
                "description": "Introduction to plumbing systems",
                "trade_id": trades["PLUM"].id
            },
        ]
        
        qbanks = []
        for qbank_data in qbanks_data:
            qbank = QuestionBank(**qbank_data)
            db.add(qbank)
            db.flush()
            qbanks.append(qbank)
        
        db.commit()
        print(f"✅ Created {len(qbanks)} question banks")
        
        # Create sample questions
        print("Creating questions...")
        questions_data = [
            # Electrician questions
            {
                "question_bank_id": qbanks[0].id,
                "question_text": "What is the unit of electrical voltage?",
                "question_type": QuestionType.MULTIPLE_CHOICE,
                "options": {"A": "Ampere", "B": "Volt", "C": "Watt", "D": "Ohm"},
                "correct_answer": ["B"],
                "explanation": "The unit of voltage is Volt (V), named after Alessandro Volta",
                "difficulty": DifficultyLevel.EASY,
                "marks": 1.0,
                "negative_marks": 0.25,
                "tags": ["basics", "units"]
            },
            {
                "question_bank_id": qbanks[0].id,
                "question_text": "According to Ohm's Law, V = I × R. True or False?",
                "question_type": QuestionType.TRUE_FALSE,
                "correct_answer": ["True"],
                "explanation": "Ohm's Law states that voltage (V) equals current (I) multiplied by resistance (R)",
                "difficulty": DifficultyLevel.EASY,
                "marks": 1.0,
                "tags": ["ohms-law", "basics"]
            },
            {
                "question_bank_id": qbanks[0].id,
                "question_text": "What color wire is typically used for the neutral in household wiring?",
                "question_type": QuestionType.MULTIPLE_CHOICE,
                "options": {"A": "Red", "B": "Black", "C": "White", "D": "Green"},
                "correct_answer": ["C"],
                "explanation": "White wire is used for neutral in standard household wiring",
                "difficulty": DifficultyLevel.MEDIUM,
                "marks": 2.0,
                "negative_marks": 0.5,
                "tags": ["wiring", "safety"]
            },
            {
                "question_bank_id": qbanks[1].id,
                "question_text": "Calculate the total resistance in a series circuit with resistors of 10Ω, 20Ω, and 30Ω",
                "question_type": QuestionType.SHORT_ANSWER,
                "correct_answer": ["60"],
                "explanation": "In series: Total R = R1 + R2 + R3 = 10 + 20 + 30 = 60Ω",
                "difficulty": DifficultyLevel.HARD,
                "marks": 5.0,
                "tags": ["circuits", "calculations"]
            },
            # Plumber questions
            {
                "question_bank_id": qbanks[2].id,
                "question_text": "What is the standard size of a kitchen sink drain pipe?",
                "question_type": QuestionType.MULTIPLE_CHOICE,
                "options": {"A": "1 inch", "B": "1.5 inches", "C": "2 inches", "D": "3 inches"},
                "correct_answer": ["B"],
                "explanation": "Kitchen sink drains typically use 1.5-inch pipes",
                "difficulty": DifficultyLevel.MEDIUM,
                "marks": 2.0,
                "tags": ["pipes", "standards"]
            },
        ]
        
        questions = []
        for q_data in questions_data:
            question = Question(**q_data)
            db.add(question)
            db.flush()
            questions.append(question)
        
        db.commit()
        print(f"✅ Created {len(questions)} questions")
        
        # Create sample exams
        print("Creating exams...")
        
        # Electrical exam
        elec_exam = Exam(
            title="Basic Electrician Certification Exam",
            description="Covers fundamental electrical concepts and safety",
            trade_id=trades["ELEC"].id,
            duration_minutes=90,
            total_marks=9.0,
            passing_marks=5.0,
            instructions="Answer all questions. MCQs have negative marking.",
            status=ExamStatus.PUBLISHED,
            created_by=admin.id
        )
        db.add(elec_exam)
        db.flush()
        
        # Attach first 3 questions to electrical exam
        for idx, question in enumerate(questions[:3], start=1):
            eq = ExamQuestion(
                exam_id=elec_exam.id,
                question_id=question.id,
                order_number=idx
            )
            db.add(eq)
        
        # Plumbing exam
        plumb_exam = Exam(
            title="Plumbing Basics Assessment",
            description="Introduction to plumbing systems and standards",
            trade_id=trades["PLUM"].id,
            duration_minutes=60,
            total_marks=2.0,
            passing_marks=1.0,
            instructions="Read questions carefully before answering",
            status=ExamStatus.DRAFT,
            created_by=admin.id
        )
        db.add(plumb_exam)
        db.flush()
        
        # Attach plumber question
        eq = ExamQuestion(
            exam_id=plumb_exam.id,
            question_id=questions[4].id,
            order_number=1
        )
        db.add(eq)
        
        db.commit()
        print(f"✅ Created 2 exams")
        
        # Create sample student attempts
        print("Creating student attempts...")
        
        # Get some students
        students = db.query(User).join(User.roles).filter(Role.name == "student").limit(5).all()
        
        if students and len(students) >= 3:
            # Attempt 1: In progress attempt
            attempt1 = StudentAttempt(
                student_id=students[0].id,
                exam_id=elec_exam.id,
                status=AttemptStatus.IN_PROGRESS,
                start_time=datetime.utcnow() - timedelta(minutes=15),
                duration_minutes=90,
                total_marks=9.0,
                workstation_id="WS001",
                initial_workstation_id="WS001",
                questions_answered=1,
                last_activity_time=datetime.utcnow()
            )
            db.add(attempt1)
            db.flush()
            
            # Add answer for attempt 1
            answer1 = StudentAnswer(
                attempt_id=attempt1.id,
                question_id=questions[0].id,
                answer=["B"],  # Correct answer
                is_flagged=False,
                time_spent_seconds=120,
                first_answered_at=datetime.utcnow() - timedelta(minutes=5)
            )
            db.add(answer1)
            
            # Attempt 2: Submitted and graded - passed
            attempt2 = StudentAttempt(
                student_id=students[1].id,
                exam_id=elec_exam.id,
                status=AttemptStatus.GRADED,
                start_time=datetime.utcnow() - timedelta(hours=2),
                submit_time=datetime.utcnow() - timedelta(hours=1),
                end_time=datetime.utcnow() - timedelta(hours=1),
                duration_minutes=90,
                total_marks=9.0,
                marks_obtained=8.0,
                percentage=88.89,
                is_passed=True,
                auto_graded=True,
                workstation_id="WS002",
                initial_workstation_id="WS002",
                questions_answered=3
            )
            db.add(attempt2)
            db.flush()
            
            # Add answers for attempt 2
            answer2_1 = StudentAnswer(
                attempt_id=attempt2.id,
                question_id=questions[0].id,
                answer=["B"],
                is_correct=True,
                marks_awarded=1.0,
                auto_graded=True,
                time_spent_seconds=90
            )
            answer2_2 = StudentAnswer(
                attempt_id=attempt2.id,
                question_id=questions[1].id,
                answer=["True"],
                is_correct=True,
                marks_awarded=1.0,
                auto_graded=True,
                time_spent_seconds=60
            )
            answer2_3 = StudentAnswer(
                attempt_id=attempt2.id,
                question_id=questions[2].id,
                answer=["C"],
                is_correct=True,
                marks_awarded=2.0,
                auto_graded=True,
                time_spent_seconds=150
            )
            db.add_all([answer2_1, answer2_2, answer2_3])
            
            # Attempt 3: Submitted and graded - failed
            attempt3 = StudentAttempt(
                student_id=students[2].id,
                exam_id=elec_exam.id,
                status=AttemptStatus.GRADED,
                start_time=datetime.utcnow() - timedelta(hours=3),
                submit_time=datetime.utcnow() - timedelta(hours=2, minutes=30),
                end_time=datetime.utcnow() - timedelta(hours=2, minutes=30),
                duration_minutes=90,
                total_marks=9.0,
                marks_obtained=2.75,  # Below passing marks
                percentage=30.56,
                is_passed=False,
                auto_graded=True,
                workstation_id="WS003",
                initial_workstation_id="WS003",
                questions_answered=3
            )
            db.add(attempt3)
            db.flush()
            
            # Add answers for attempt 3 (some wrong)
            answer3_1 = StudentAnswer(
                attempt_id=attempt3.id,
                question_id=questions[0].id,
                answer=["A"],  # Wrong
                is_correct=False,
                marks_awarded=-0.25,  # Negative marking
                auto_graded=True,
                time_spent_seconds=120
            )
            answer3_2 = StudentAnswer(
                attempt_id=attempt3.id,
                question_id=questions[1].id,
                answer=["True"],  # Correct
                is_correct=True,
                marks_awarded=1.0,
                auto_graded=True,
                time_spent_seconds=45
            )
            answer3_3 = StudentAnswer(
                attempt_id=attempt3.id,
                question_id=questions[2].id,
                answer=["C"],  # Correct
                is_correct=True,
                marks_awarded=2.0,
                auto_graded=True,
                time_spent_seconds=200
            )
            db.add_all([answer3_1, answer3_2, answer3_3])
            
            db.commit()
            print(f"✅ Created 3 student attempts")
        
        print("")
        print("=" * 50)
        print("✅ Seeding complete!")
        print("")
        print("📊 Summary:")
        print(f"  - {len(roles)} roles")
        print(f"  - {len(centers)} centers")
        print(f"  - {student_count + 7} users")
        print(f"  - {len(trades)} trades")
        print(f"  - {len(qbanks)} question banks")
        print(f"  - {len(questions)} questions")
        print(f"  - 2 exams")
        print(f"  - 3 student attempts (1 in-progress, 2 graded)")
        print("")
        print("📝 Sample credentials:")
        print("  Admin:")
        print("    username: admin")
        print("    password: admin123")
        print("")
        print("  Student:")
        print("    username: student001")
        print("    password: pass123")
        print("")
        print("  Hall In-charge:")
        print("    username: hic1")
        print("    password: pass123")
        print("")
        
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
