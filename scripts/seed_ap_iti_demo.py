#!/usr/bin/env python3
"""
Comprehensive seed data for Andhra Pradesh ITI Examination System
Creates: Districts, Trades, Centers, Exams, Students with Hall Tickets
"""

import sys
sys.path.insert(0, "/app")

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import engine, Base
from app.models.user import User, Role, Center
from app.models.exam import Trade, Exam, Question, QuestionBank, ExamQuestion
from app.models.attempt import StudentAttempt
from app.core.security import get_password_hash
from passlib.hash import bcrypt
import random

# Andhra Pradesh Districts (13 districts)
AP_DISTRICTS = [
    "Anantapur", "Chittoor", "East Godavari", "Guntur",
    "Krishna", "Kurnool", "Prakasam", "Nellore",
    "Srikakulam", "Visakhapatnam", "Vizianagaram",
    "West Godavari", "YSR Kadapa"
]

# ITI Trades (modern trades including IoT, Blockchain, etc.)
ITI_TRADES = [
    ("IoT", "IOT", "IoT Technician (Smart City)"),
    ("BCTECH", "BLOCKCHAIN", "Blockchain Technology"),
    ("COPA", "COPA", "Computer Operator & Programming Assistant"),
    ("ELEC", "ELECTRICIAN", "Electrician"),
    ("FITTER", "FITTER", "Fitter"),
    ("WELDER", "WELDER", "Welder (Gas & Electric)"),
    ("MECH", "MECHANIC", "Mechanic Motor Vehicle"),
    ("PLUMB", "PLUMBER", "Plumber"),
    ("CARP", "CARPENTER", "Carpenter"),
    ("ELECN", "ELECTRONICS", "Electronics Mechanic"),
    ("REFRIG", "REFRIGERATION", "Refrigeration & Air Conditioning"),
    ("DRFT", "DRAFTSMAN", "Draughtsman Civil"),
    ("MACH", "MACHINIST", "Machinist"),
    ("TOOL", "TOOLMAKER", "Tool & Die Maker"),
    ("PAINT", "PAINTER", "Painter General"),
]

def create_ap_iti_demo_data():
    """Create complete demo data for AP ITI examination system"""
    
    Base.metadata.create_all(bind=engine)
    db = Session(bind=engine)
    
    try:
        print("🚀 Starting Andhra Pradesh ITI Demo Data Creation...")
        print("="*70)
        
        # Get admin user
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            print("❌ Admin user not found. Run seed.py first!")
            return
        
        # Get student role
        student_role = db.query(Role).filter(Role.name == "student").first()
        if not student_role:
            print("❌ Student role not found!")
            return
        
        # 1. CREATE TRADES
        print("\n📚 Creating ITI Trades...")
        trades_dict = {}
        for code, short_code, name in ITI_TRADES:
            existing = db.query(Trade).filter(Trade.code == code).first()
            if not existing:
                trade = Trade(
                    code=code,
                    name=name,
                    description=f"ITI Trade: {name}",
                    is_active=True
                )
                db.add(trade)
                db.flush()
                trades_dict[code] = trade
                print(f"   ✓ Created trade: {name} ({code})")
            else:
                trades_dict[code] = existing
                print(f"   ℹ️  Trade exists: {name}")
        
        db.commit()
        print(f"✅ Total trades: {len(trades_dict)}")
        
        # 2. CREATE EXAM CENTERS (2 per district)
        print("\n🏢 Creating Exam Centers across AP Districts...")
        centers_list = []
        center_num = 1
        
        for district in AP_DISTRICTS:
            for i in range(1, 3):  # 2 centers per district
                code = f"AP{center_num:03d}"
                existing = db.query(Center).filter(Center.code == code).first()
                
                if not existing:
                    center = Center(
                        code=code,
                        name=f"Government ITI {district} - Center {i}",
                        address=f"ITI Campus, {district} District",
                        city=district,
                        state="Andhra Pradesh",
                        district=district,
                        pincode=f"5{center_num:05d}",
                        is_active=True
                    )
                    db.add(center)
                    db.flush()
                    centers_list.append(center)
                    print(f"   ✓ Created: {center.name}")
                else:
                    centers_list.append(existing)
                
                center_num += 1
        
        db.commit()
        print(f"✅ Total centers: {len(centers_list)}")
        
        # 3. CREATE QUESTION BANKS FOR EACH TRADE
        print("\n📖 Creating Question Banks...")
        question_banks = {}
        
        for code, trade in trades_dict.items():
            existing_qb = db.query(QuestionBank).filter(
                QuestionBank.trade_id == trade.id,
                QuestionBank.name == f"{trade.name} Question Bank"
            ).first()
            
            if not existing_qb:
                qb = QuestionBank(
                    trade_id=trade.id,
                    name=f"{trade.name} Question Bank",
                    description=f"Questions for {trade.name} trade",
                    is_active=True
                )
                db.add(qb)
                db.flush()
                question_banks[code] = qb
                print(f"   ✓ Created question bank for: {trade.name}")
            else:
                question_banks[code] = existing_qb
        
        db.commit()
        
        # 4. CREATE QUESTIONS FOR EACH TRADE (10 questions per trade)
        print("\n❓ Creating Questions...")
        questions_dict = {}
        
        for code, qb in question_banks.items():
            trade = trades_dict[code]
            questions_dict[code] = []
            
            for i in range(1, 11):  # 10 questions per trade
                question = Question(
                    question_bank_id=qb.id,
                    question_text=f"{trade.name} - Question {i}: Explain the key concepts and practical applications in this trade.",
                    question_type="multiple_choice",
                    options={
                        "A": f"Option A for {trade.name} Q{i}",
                        "B": f"Option B for {trade.name} Q{i} (Correct)",
                        "C": f"Option C for {trade.name} Q{i}",
                        "D": f"Option D for {trade.name} Q{i}"
                    },
                    correct_answer=["B"],
                    explanation=f"Correct answer is B for {trade.name} question {i}",
                    difficulty="medium",
                    marks=4.0,
                    negative_marks=1.0,
                    is_active=True
                )
                db.add(question)
                db.flush()
                questions_dict[code].append(question)
            
            print(f"   ✓ Created 10 questions for: {trade.name}")
        
        db.commit()
        print(f"✅ Total questions created: {len(ITI_TRADES) * 10}")
        
        # 5. CREATE EXAMS FOR EACH TRADE
        print("\n📝 Creating Trade-Specific Exams...")
        exams_dict = {}
        
        for code, trade in trades_dict.items():
            exam_title = f"AP ITI {trade.name} Annual Examination 2025"
            existing_exam = db.query(Exam).filter(Exam.title == exam_title).first()
            
            if not existing_exam:
                exam = Exam(
                    trade_id=trade.id,
                    title=exam_title,
                    description=f"Annual examination for {trade.name} trade students",
                    instructions=f"""
## {trade.name} Examination Instructions

1. **Duration:** 120 minutes (2 hours)
2. **Total Questions:** 10 (All mandatory)
3. **Marking Scheme:**
   - Correct Answer: +4 marks
   - Wrong Answer: -1 mark (Negative marking)
   - Unattempted: 0 marks

4. **Important Guidelines:**
   - Read each question carefully
   - Choose the best answer
   - You can review and change answers before submission
   - Auto-save happens every 15 seconds
   - Do not refresh the browser during exam

**Trade:** {trade.name}  
**Total Marks:** 40  
**Passing Marks:** 16 (40%)

**Best of luck!**
                    """,
                    duration_minutes=120,
                    total_marks=40,
                    total_questions=10,
                    passing_marks=16,
                    start_time=datetime.utcnow(),
                    end_time=datetime.utcnow() + timedelta(days=30),
                    status="published",
                    created_by=admin.id
                )
                db.add(exam)
                db.flush()
                
                # Link questions to exam
                for idx, question in enumerate(questions_dict[code], 1):
                    exam_question = ExamQuestion(
                        exam_id=exam.id,
                        question_id=question.id,
                        order_number=idx
                    )
                    db.add(exam_question)
                
                exams_dict[code] = exam
                print(f"   ✓ Created exam: {exam.title}")
            else:
                exams_dict[code] = existing_exam
        
        db.commit()
        print(f"✅ Total exams: {len(exams_dict)}")
        
        # 6. CREATE STUDENTS WITH HALL TICKETS
        print("\n👨‍🎓 Creating Students with Hall Tickets...")
        students_created = 0
        trade_codes = list(trades_dict.keys())
        
        for i in range(1, 51):  # Create 50 students
            hall_ticket = f"AP2025{i:04d}"
            
            existing = db.query(User).filter(User.hall_ticket_number == hall_ticket).first()
            if existing:
                print(f"   ℹ️  Student {hall_ticket} exists, updating...")
                # Update existing student
                student = existing
            else:
                # Create new student
                student = User(
                    username=f"apiti{i:04d}",
                    email=f"student{i:04d}@apiti.edu.in",
                    full_name=f"AP ITI Student {i:04d}",
                    hashed_password=get_password_hash("student123"),
                    is_active=True
                )
                db.add(student)
                db.flush()
                student.roles.append(student_role)
                students_created += 1
            
            # Assign trade (distribute evenly)
            trade_code = trade_codes[i % len(trade_codes)]
            student.trade_id = trades_dict[trade_code].id
            
            # Assign center (distribute across all centers)
            center = centers_list[i % len(centers_list)]
            student.center_id = center.id
            
            # Hall ticket details
            student.hall_ticket_number = hall_ticket
            student.date_of_birth = datetime(2000 + (i % 5), ((i % 12) + 1), ((i % 28) + 1))
            student.security_question = "What is your mother's maiden name?"
            student.security_answer_hash = bcrypt.hash("kumar")
            
            if i % 10 == 0:
                print(f"   ✓ Processed {i} students...")
        
        db.commit()
        print(f"✅ Total students: 50 (New: {students_created}, Updated: {50 - students_created})")
        
        # 7. CREATE EXAM ATTEMPTS FOR STUDENTS
        print("\n📋 Assigning Exams to Students...")
        attempts_created = 0
        
        for i in range(1, 51):
            hall_ticket = f"AP2025{i:04d}"
            student = db.query(User).filter(User.hall_ticket_number == hall_ticket).first()
            
            if student and student.trade_id:
                # Find the trade code for this student
                trade = db.query(Trade).filter(Trade.id == student.trade_id).first()
                if trade and trade.code in exams_dict:
                    exam = exams_dict[trade.code]
                    
                    # Check if attempt already exists
                    existing_attempt = db.query(StudentAttempt).filter(
                        StudentAttempt.student_id == student.id,
                        StudentAttempt.exam_id == exam.id
                    ).first()
                    
                    if not existing_attempt:
                        attempt = StudentAttempt(
                            student_id=student.id,
                            exam_id=exam.id,
                            status="not_started",
                            duration_minutes=exam.duration_minutes,
                            start_time=None,
                            end_time=None
                        )
                        db.add(attempt)
                        attempts_created += 1
        
        db.commit()
        print(f"✅ Exam attempts created: {attempts_created}")
        
        # PRINT SUMMARY
        print("\n" + "="*70)
        print("🎉 AP ITI DEMO DATA CREATION COMPLETE!")
        print("="*70)
        
        print(f"\n📊 Summary:")
        print(f"   • Districts: {len(AP_DISTRICTS)}")
        print(f"   • ITI Trades: {len(trades_dict)}")
        print(f"   • Exam Centers: {len(centers_list)}")
        print(f"   • Question Banks: {len(question_banks)}")
        print(f"   • Questions: {len(ITI_TRADES) * 10}")
        print(f"   • Exams: {len(exams_dict)}")
        print(f"   • Students: 50")
        print(f"   • Exam Attempts: {attempts_created}")
        
        print(f"\n👨‍🎓 Sample Student Credentials:")
        print("   " + "-"*66)
        print("   Hall Ticket  | DOB        | Trade              | District")
        print("   " + "-"*66)
        
        # Show first 10 students with their details
        sample_students = db.query(User).filter(
            User.hall_ticket_number.like('AP2025%')
        ).limit(10).all()
        
        for student in sample_students:
            trade_name = student.trade.name if student.trade else "N/A"
            district = student.center.district if student.center else "N/A"
            dob = student.date_of_birth.strftime("%d/%m/%Y") if student.date_of_birth else "N/A"
            print(f"   {student.hall_ticket_number} | {dob} | {trade_name[:18]:<18} | {district}")
        
        print("   " + "-"*66)
        print("   Security Answer for ALL: kumar")
        
        print(f"\n🌐 Access URLs:")
        print(f"   • Student Portal: http://localhost:5173")
        print(f"   • Admin Dashboard: http://localhost:5174")
        print(f"   • API Docs: http://localhost:8000/docs")
        
        print(f"\n✨ Trade Distribution:")
        for code, trade in list(trades_dict.items())[:5]:
            count = db.query(User).filter(User.trade_id == trade.id).count()
            print(f"   • {trade.name}: {count} students")
        print(f"   • ... and {len(trades_dict) - 5} more trades")
        
        print(f"\n🗺️  District Distribution:")
        for district in AP_DISTRICTS[:5]:
            count = db.query(User).join(Center).filter(Center.district == district).count()
            print(f"   • {district}: {count} students")
        print(f"   • ... and {len(AP_DISTRICTS) - 5} more districts")
        
        print("\n" + "="*70)
        print("✅ SYSTEM READY FOR TESTING!")
        print("="*70)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_ap_iti_demo_data()
