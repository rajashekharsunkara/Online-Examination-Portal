# OEP Demo Implementation Plan
## Center-Based Exam Flow (Like JEE Mains/NPTEL)

### Authentication Flow (CRITICAL - Implement First)

**Student Login Process:**
1. Student arrives at exam center
2. Opens portal (http://localhost:5173)
3. Enters credentials:
   - Hall Ticket Number (e.g., "HT2024001234")
   - Date of Birth (DD/MM/YYYY)
   - Security Question Answer (pre-registered)
4. System validates and starts exam
5. NO dashboard - directly into exam

**Database Schema Additions Needed:**
```sql
-- Add to users table
ALTER TABLE users ADD COLUMN hall_ticket_number VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN date_of_birth DATE;
ALTER TABLE users ADD COLUMN security_question VARCHAR(255);
ALTER TABLE users ADD COLUMN security_answer VARCHAR(255);
```

### Chunks Status & Priority

#### IMMEDIATE PRIORITY (For Demo):

**✅ COMPLETE:**
- Chunk 0: Docker setup
- Chunk 1: Database models
- Chunk 2: Auth API (needs modification for hall ticket)
- Chunk 3: Exam management API
- Chunk 4: Attempt tracking API
- Chunk 5: WebSocket checkpointing (exists but not working)
- Chunk 6: Encryption
- Chunk 7: Transfer requests
- Chunk 8: Audit logging
- Chunk 9: Grading service

**🔥 CRITICAL - IMPLEMENT NOW:**

1. **Hall Ticket Authentication System**
   - Modify auth API endpoint
   - Create hall ticket login page
   - Remove dashboard completely
   - Direct login → exam flow

2. **Working Exam Interface**
   - Fix ExamPage to work without attempt ID hardcoding
   - Test question display
   - Test answer submission
   - Fix WebSocket checkpointing

3. **Demo Data Seeding**
   - Create sample exam with questions
   - Create student records with hall tickets
   - Assign exam attempts to students

#### DEFER FOR LATER:

**Chunk 10-11: Hall Auth & Technician PWA**
- Not needed for basic demo
- Can be implemented after core works

**Chunk 12+: Admin Dashboard**
- Use API docs for now
- Implement UI later

### Demo Flow Requirements

**Pre-Exam Setup (Admin via API):**
1. Create an exam with questions
2. Register students with:
   - Name, Email
   - Hall ticket number
   - DOB
   - Security question/answer
3. Assign exam attempts to students

**Student Exam Flow:**
1. Student opens portal
2. Enters: Hall Ticket + DOB + Security Answer
3. System validates and loads their assigned exam
4. Student takes exam with:
   - Real-time checkpointing (every 15s)
   - Offline resilience
   - Timer countdown
5. Student submits exam
6. Encrypted final submission
7. Show completion message

**What Makes This Different from Current Implementation:**
- ❌ NO username/password login
- ❌ NO dashboard/exam list
- ❌ NO exam selection
- ✅ Hall ticket authentication
- ✅ Direct to assigned exam
- ✅ One exam per student
- ✅ Center-based flow

### Files to Modify

**Frontend:**
1. `web/src/pages/LoginPage.tsx` → Hall ticket login
2. `web/src/App.tsx` → Remove dashboard route
3. `web/src/pages/DashboardPage.tsx` → DELETE
4. `web/src/pages/ExamPage.tsx` → Fix to load assigned exam
5. `web/src/services/api.ts` → Add hall ticket auth endpoint

**Backend:**
1. `api/app/api/auth.py` → Add hall ticket authentication
2. `api/app/schemas/auth.py` → Add hall ticket request schema
3. `api/app/models/user.py` → Add hall ticket fields
4. `api/alembic/versions/new_migration.py` → Add columns
5. `scripts/seed_demo.py` → Create proper demo data

### Success Criteria for Demo

✅ Student can login with hall ticket
✅ Exam loads automatically (no selection)
✅ Questions display correctly
✅ Student can answer questions
✅ Checkpointing works (every 15s)
✅ Timer shows correct time
✅ Student can submit exam
✅ Encrypted submission works
✅ System shows completion
✅ Audit logs record everything

