#!/usr/bin/env python3
"""Simplified demo data script for hall ticket authentication"""

import sys
sys.path.insert(0, "/app")

from datetime import datetime
from sqlalchemy.orm import Session
from app.core.database import engine, Base
from app.models.user import User, Role, Center
from app.core.security import get_password_hash
from passlib.hash import bcrypt

def create_students():
    Base.metadata.create_all(bind=engine)
    db = Session(bind=engine)
    
    try:
        student_role = db.query(Role).filter(Role.name == "student").first()
        if not student_role:
            print("❌ Student role not found!")
            return
        
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
        
        students_created = 0
        for i in range(1, 11):
            hall_ticket = f"HT2024{i:03d}"
            
            existing = db.query(User).filter(User.hall_ticket_number == hall_ticket).first()
            if existing:
                print(f"ℹ️  {hall_ticket} exists")
                continue
            
            student = User(
                username=f"student{i:03d}",
                email=f"student{i:03d}@demo.com",
                full_name=f"Student {i:03d}",
                hashed_password=get_password_hash("pass123"),
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
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_students()
