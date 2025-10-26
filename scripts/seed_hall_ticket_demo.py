#!/usr/bin/env python3
"""Simplified demo data script for hall ticket authentication"""

import sys
sys.path.insert(0, "/app")

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import engine, Base
from app.models.user import User, Role, Center
from app.core.security import get_password_hash
from passlib.hash import bcrypt

def create_hall_ticket_students():
    """Create demo students with hall tickets"""
    
    Base.metadata.create_all(bind=engine)
    db = Session(bind=engine)
    
    try:
        # Get student role
        student_role = db.query(Role).filter(Role.name == "student").first()
        if not student_role:
            print("❌ Student role not found!")
            return
        
        # Get or create center
        center = db.query(Center).first()
        if not center:
            center = Center(
                code="CTR001",
                name="Demo Exam Center",
                location="Bangalore",
                max_capacity=100,
                is_active=True
            )
            db.add(center)
            db.commit()
            db.refresh(center)
        
        # Create 10 students with hall tickets
        students_created = 0
        for i in range(1, 11):
            hall_ticket = f"HT2024{i:03d}"
            
            # Check if exists
            existing = db.query(User).filter(User.hall_ticket_number == hall_ticket).first()
            if existing:
                print(f"ℹ️  {hall_ticket} exists")
                continue
            
            # Create student
            student = User(
                username=f"student{i:03d}",
                email=f"student{i:03d}@demo.com",
                full_name=f"Student {i:03d}",
                password_hash=get_password_hash("pass123"),
                hall_ticket_number=hall_ticket,
                date_of_birth=datetime(2000, 1, 1),
                security_question="What is your mother's maiden name?",
                security_answer_hash=bcrypt.hash("kumar"),
                center_id=center.id,
                is_active=True
            )
            db.add(student)
            db.flush()
            student.roles.append(student_role)
            students_created += 1
        
        db.commit()
        print(f"✅ Created {students_created} students")
        print("\n" + "="*60)
        print("🎉 HALL TICKET DEMO DATA READY")
        print("="*60)
        print("\n👨‍🎓 Login Credentials:")
        print("-" * 60)
        print("Hall Ticket: HT2024001 to HT2024010")
        print("DOB: 01/01/2000")
        print("Security Answer: kumar")
        print("\n🌐 Open: http://localhost:5173")
        print("="*60)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_hall_ticket_students()

    
    try:
        # Check if admin exists
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            print("❌ Admin user not found. Run seed.py first!")
            return
        
        # Get or create student role
        student_role = db.query(Role).filter(Role.name == "student").first()
        if not student_role:
            print("❌ Student role not found. Run seed.py first!")
            return
        
        # Get or create exam center
        center = db.query(Center).filter(Center.code == "CTR001").first()
        if not center:
            center = Center(
                code="CTR001",
                name="Demo Exam Center",
                location="Bangalore, Karnataka",
                max_capacity=100,
                is_active=True
            )
            db.add(center)
            db.commit()
            db.refresh(center)
            print(f"✅ Created exam center: {center.name}")
        
        # Create demo exam
        exam = db.query(Exam).filter(Exam.title == "JEE Advanced Mock Test 2024").first()
        if not exam:
            exam = Exam(
                title="JEE Advanced Mock Test 2024",
                description="Full-length mock test for JEE Advanced preparation",
                instructions="""
## Important Instructions

1. This is a timed examination. Total duration: 180 minutes
2. All questions are mandatory
3. Each question carries 4 marks for correct answer
4. -1 mark for incorrect answer (negative marking)
5. No marks deducted for unattempted questions
6. You can review and change answers before final submission
7. Auto-save happens every 15 seconds
8. Do not refresh the page during exam
9. Click 'Submit Exam' when finished

**Good Luck!**
                """,
                duration_minutes=180,
                total_marks=100,
                passing_marks=40,
                start_time=datetime.utcnow(),
                end_time=datetime.utcnow() + timedelta(days=30),
                is_published=True,
                created_by_id=admin.id
            )
            db.add(exam)
            db.commit()
            db.refresh(exam)
            print(f"✅ Created exam: {exam.title}")
            
            # Create 25 questions
            subjects = [
                ("Physics", ["Mechanics", "Thermodynamics", "Electromagnetism", "Optics", "Modern Physics"]),
                ("Chemistry", ["Physical", "Inorganic", "Organic"]),
                ("Mathematics", ["Algebra", "Calculus", "Geometry", "Probability", "Trigonometry"])
            ]
            
            question_num = 1
            for subject, topics in subjects:
                questions_per_topic = 25 // len(topics)
                for topic in topics:
                    for i in range(questions_per_topic):
                        question = Question(
                            exam_id=exam.id,
                            question_number=question_num,
                            question_text=f"{subject} - {topic}: Sample question {i+1}. Solve the following problem using concepts from {topic}.",
                            question_type="single_choice",
                            marks=4,
                            negative_marks=1,
                            created_by_id=admin.id
                        )
                        db.add(question)
                        db.flush()
                        
                        # Add 4 options
                        options_data = [
                            ("Option A - Incorrect", False),
                            ("Option B - Correct Answer", True),
                            ("Option C - Incorrect", False),
                            ("Option D - Incorrect", False),
                        ]
                        for opt_text, is_correct in options_data:
                            option = QuestionOption(
                                question_id=question.id,
                                option_text=opt_text,
                                is_correct=is_correct
                            )
                            db.add(option)
                        
                        question_num += 1
                        if question_num > 25:
                            break
                    if question_num > 25:
                        break
                if question_num > 25:
                    break
            
            db.commit()
            print(f"✅ Created 25 questions for exam")
        else:
            print(f"ℹ️  Exam already exists: {exam.title}")
        
        # Create 10 students with hall tickets
        students_created = 0
        for i in range(1, 11):
            hall_ticket = f"HT2024{i:03d}"
            
            # Check if student already exists
            existing_student = db.query(User).filter(User.hall_ticket_number == hall_ticket).first()
            if existing_student:
                print(f"ℹ️  Student {hall_ticket} already exists")
                continue
            
            # Security answer hash (all students use "kumar" as answer)
            security_answer_hash = bcrypt.hash("kumar")
            
            student = User(
                username=f"student{i:03d}",
                email=f"student{i:03d}@demo.com",
                full_name=f"Student {i:03d}",
                password_hash=get_password_hash("pass123"),
                hall_ticket_number=hall_ticket,
                date_of_birth=datetime(2000, 1, 1),  # All students have DOB: 01/01/2000
                security_question="What is your mother's maiden name?",
                security_answer_hash=security_answer_hash,
                center_id=center.id,
                is_active=True
            )
            db.add(student)
            db.flush()
            
            # Assign student role
            student.roles.append(student_role)
            
            # Create exam attempt for this student
            attempt = StudentAttempt(
                student_id=student.id,
                exam_id=exam.id,
                center_id=center.id,
                status="not_started",
                start_time=None,
                end_time=None
            )
            db.add(attempt)
            
            students_created += 1
        
        db.commit()
        print(f"✅ Created {students_created} new students with hall tickets")
        
        # Print summary
        print("\n" + "="*60)
        print("🎉 DEMO DATA CREATED SUCCESSFULLY")
        print("="*60)
        print(f"\n📝 Exam: {exam.title}")
        print(f"⏱️  Duration: {exam.duration_minutes} minutes")
        print(f"📊 Total Questions: 25")
        print(f"🏢 Exam Center: {center.name}")
        
        print("\n👨‍🎓 Demo Student Credentials:")
        print("-" * 60)
        print("Hall Ticket    | DOB        | Security Answer")
        print("-" * 60)
        for i in range(1, 11):
            print(f"HT2024{i:03d}      | 01/01/2000 | kumar")
        
        print("\n🔐 Login Instructions:")
        print("1. Open http://localhost:5173")
        print("2. Enter Hall Ticket Number: HT2024001")
        print("3. Enter Date of Birth: 01/01/2000")
        print("4. Enter Security Answer: kumar")
        print("5. Click 'Start Exam'")
        
        print("\n✨ Features Enabled:")
        print("✓ Hall ticket authentication")
        print("✓ Direct exam access (no dashboard)")
        print("✓ Real-time auto-save (15 sec)")
        print("✓ WebSocket live updates")
        print("✓ Audit logging")
        print("✓ Secure exam environment")
        
        print("\n" + "="*60)
        
    except Exception as e:
        print(f"❌ Error creating demo data: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Creating hall ticket demo data...\n")
    create_hall_ticket_demo_data()
