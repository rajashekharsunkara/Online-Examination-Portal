# 🎬 OEP Exam Platform - Demo Setup Guide

Complete guide to set up and run the OEP Exam Platform demo.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Full Setup](#full-setup)
- [Manual Setup](#manual-setup)
- [Troubleshooting](#troubleshooting)
- [Demo Walkthrough](#demo-walkthrough)

---

## Prerequisites

### Required

- **Docker** (20.10+)
- **Docker Compose** (1.29+ or Docker Compose V2)
- **Git** (to clone the repository)
- **Bash** (Linux/macOS) or **WSL** (Windows)

### Optional

- **curl** (for API testing)
- **jq** (for JSON parsing)
- **Node.js 18+** and **npm** (for local frontend development)

---

## 🚀 Quick Start

**For users with Docker already installed:**

```bash
# 1. Clone the repository
git clone https://github.com/your-org/oep-exam-platform.git
cd oep-exam-platform

# 2. Run quick start script
./quick-start.sh

# That's it! The platform will be ready in ~3 minutes
```

**Access the platform:**
- Student App: http://localhost:5173
- Admin Panel: http://localhost:5174
- API Docs: http://localhost:8000/docs

**Demo Credentials:**
- Admin: `admin` / `admin123`
- Student: `student001` / `pass123`

---

## 🔧 Full Setup

**For first-time setup or fresh installation:**

```bash
# 1. Clone the repository
git clone https://github.com/your-org/oep-exam-platform.git
cd oep-exam-platform

# 2. Run full setup script (checks dependencies, builds everything)
./setup-demo.sh

# This will:
# - Check system requirements
# - Install dependencies (if needed)
# - Build Docker containers
# - Run database migrations
# - Seed demo data
# - Start all services
# - Perform health checks
```

**Setup time:** ~10-15 minutes (first run)

---

## 🛠️ Manual Setup

If you prefer manual control:

### Step 1: Environment Setup

```bash
# Create .env file
cp .env.example .env

# Or create manually:
cat > .env << EOF
POSTGRES_USER=exam_user
POSTGRES_PASSWORD=exam_pass_2024_secure
POSTGRES_DB=exam_db
DATABASE_URL=postgresql://exam_user:exam_pass_2024_secure@db:5432/exam_db
REDIS_URL=redis://redis:6379/0
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production-min-32-chars
EOF
```

### Step 2: Build Containers

```bash
# Build all containers
docker-compose build

# Or build specific services
docker-compose build api web admin
```

### Step 3: Start Services

```bash
# Start all services
docker-compose up -d

# Or start in specific order
docker-compose up -d db redis minio
sleep 30  # Wait for database
docker-compose up -d api worker
docker-compose up -d web admin
```

### Step 4: Database Setup

```bash
# Run migrations
docker-compose exec api alembic upgrade head

# Seed demo data
docker-compose exec api python scripts/seed.py
```

### Step 5: Verify

```bash
# Check all containers are running
docker-compose ps

# Check logs
docker-compose logs -f api

# Test API
curl http://localhost:8000/docs
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find what's using the port
sudo lsof -i :8000
sudo lsof -i :5173

# Kill the process or change port in docker-compose.yml
```

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Restart database
docker-compose restart db

# Wait 30 seconds, then retry migrations
docker-compose exec api alembic upgrade head
```

### Containers Won't Start

```bash
# Clean up and rebuild
docker-compose down -v
docker system prune -f
docker-compose build --no-cache
docker-compose up -d
```

### Migration Errors

```bash
# Check migration status
docker-compose exec api alembic current

# Downgrade and re-upgrade
docker-compose exec api alembic downgrade -1
docker-compose exec api alembic upgrade head

# Or reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d db
sleep 30
docker-compose exec api alembic upgrade head
```

### Frontend Not Loading

```bash
# Check frontend logs
docker-compose logs web
docker-compose logs admin

# Rebuild frontend
docker-compose build web admin
docker-compose up -d web admin

# Wait for Vite to compile
sleep 30
```

### Permission Denied on Scripts

```bash
# Make scripts executable
chmod +x setup-demo.sh
chmod +x quick-start.sh
chmod +x scripts/*.sh
```

---

## 🎬 Demo Walkthrough

### Scenario 1: Student Taking Exam (5 minutes)

**Objective:** Experience the exam-taking workflow with offline resilience and encryption.

1. **Login as Student**
   - Go to http://localhost:5173
   - Username: `student001`, Password: `pass123`

2. **Start Exam**
   - Click "Available Exams"
   - Select "Demo Exam - Programming Fundamentals"
   - Click "Start Exam"

3. **Take Exam**
   - Answer various question types:
     - MCQ Single Choice
     - MCQ Multiple Choice (partial credit)
     - True/False
     - Fill in Blank (fuzzy matching)
     - Numeric (tolerance-based)
     - Essay (manual grading)
   - Observe real-time checkpointing
   - Try going offline (disable network) - answers saved locally

4. **Submit Exam**
   - Click "Submit Exam"
   - Observe client-side encryption progress
   - See encryption checksum displayed
   - Confirm submission

5. **View Results**
   - Automatically redirected to results page
   - See overall score and pass/fail status
   - View performance analytics:
     - Percentile rank
     - Score vs average
     - Time per question
   - Explore question-by-question breakdown
   - Toggle "Show Correct Answers"

**Key Features Demonstrated:**
- ✅ Real-time checkpointing (every 15s)
- ✅ Offline resilience (IndexedDB)
- ✅ Client-side encryption (AES-256-GCM)
- ✅ Auto-grading with partial credit
- ✅ Performance analytics

---

### Scenario 2: Instructor Grading with Rubrics (5 minutes)

**Objective:** Manual grading of essay questions using analytical rubrics.

1. **Login as Instructor**
   - Go to http://localhost:5173
   - Username: `hic1`, Password: `pass123`

2. **View Submitted Attempts**
   - Navigate to "Grading" section
   - See list of submitted attempts
   - Filter by exam, student, grading status

3. **Grade Essay Answer**
   - Click on an attempt with pending essay grading
   - View student's essay answer
   - See assigned rubric: "Essay Grading Rubric"

4. **Apply Rubric**
   - **Criterion 1: Content Quality & Accuracy (15 pts)**
     - Select level: "Good" (12 pts)
     - Add comment: "Good explanation, missing some key points"
   - **Criterion 2: Organization & Clarity (10 pts)**
     - Select level: "Excellent" (10 pts)
     - Add comment: "Well structured and clear"
   - System calculates total: 22/25

5. **Submit Grading**
   - Add overall comment: "Solid understanding, good work!"
   - Click "Submit Grading"
   - Student answer updated with score
   - Attempt total score recalculated

6. **View Grading Progress**
   - Dashboard shows: "15/20 questions graded (75%)"
   - See breakdown: 12 auto-graded, 3 manual

**Key Features Demonstrated:**
- ✅ Rubric-based manual grading
- ✅ Criterion-level scoring
- ✅ Performance levels with descriptions
- ✅ Comments at criterion and overall level
- ✅ Automatic score calculation

---

### Scenario 3: Analytics Dashboard (3 minutes)

**Objective:** View comprehensive analytics for exam performance.

1. **Question-Level Analytics**
   - Navigate to "Analytics" → "Question Statistics"
   - Select question: "What is the time complexity of binary search?"
   - View metrics:
     - **Difficulty Index:** 0.70 (Moderate)
     - **Discrimination Index:** 0.42 (Good)
     - **Average Score:** 7.0/10
     - **Score Distribution:** 70% students in 75-100% range

2. **Exam-Level Statistics**
   - View "Exam Analytics" dashboard
   - See overall statistics:
     - **Total Attempts:** 30
     - **Average Score:** 72.5
     - **Median Score:** 75.0
     - **Pass Rate:** 80%
   - Explore percentile distribution:
     - 90th percentile: 90 points
     - 75th percentile: 82 points
     - 50th percentile: 75 points
     - 25th percentile: 65 points
     - 10th percentile: 52 points
   - View grade distribution chart:
     - A (90-100%): 25 students
     - B (80-89%): 40 students
     - C (70-79%): 35 students
     - D (60-69%): 20 students
     - F (<60%): 30 students

3. **Identify Problem Questions**
   - Sort by difficulty index (ascending)
   - Find questions with low discrimination (<0.1)
   - Flag for review or removal

**Key Features Demonstrated:**
- ✅ Difficulty index calculation
- ✅ Discrimination index (point-biserial correlation)
- ✅ Exam statistics with percentiles
- ✅ Visual distribution charts
- ✅ Data-driven question quality assessment

---

### Scenario 4: Workstation Transfer (2 minutes)

**Objective:** Transfer an in-progress exam to another workstation.

1. **Student on Workstation 1**
   - Login as `student002`
   - Start exam, answer 3 questions
   - Click "Request Workstation Transfer"
   - Provide reason: "Computer freezing"
   - System generates transfer code: `TRF-12345`

2. **Technician Approves**
   - Login as `tech1`
   - View pending transfer requests
   - Verify student identity
   - Click "Approve Transfer"
   - Select new workstation: "WS-Lab2-05"

3. **Student on Workstation 2**
   - Login as `student002` on new computer
   - System detects approved transfer
   - Click "Resume Exam"
   - All answers restored (verified with SHA-256 checksum)
   - Continue from question 4

**Key Features Demonstrated:**
- ✅ State migration with checksums
- ✅ Technician approval workflow
- ✅ Audit logging
- ✅ Seamless resume

---

## 📊 Demo Data Summary

**Created by Seed Script:**

- **Users:** 57 total
  - 1 Admin (`admin`)
  - 2 Hall In-charge (`hic1`, `hic2`)
  - 2 Hall Authenticators (`hallauth1`, `hallauth2`)
  - 2 Technicians (`tech1`, `tech2`)
  - 50 Students (`student001` - `student050`)

- **Exams:** 1
  - "Demo Exam - Programming Fundamentals"
  - 90 minutes duration
  - 100 points total
  - 60% passing score

- **Questions:** 7
  - 1 MCQ Single Choice (10 pts)
  - 1 MCQ Multiple Choice (15 pts, partial credit)
  - 1 True/False (5 pts)
  - 1 Fill in Blank (10 pts, fuzzy matching)
  - 1 Numeric (10 pts, tolerance)
  - 1 Essay (25 pts, manual grading)
  - 1 Code (25 pts, manual grading)

- **Rubrics:** 1
  - "Essay Grading Rubric" (analytical)
  - 2 criteria: Content (15 pts), Organization (10 pts)
  - 4 performance levels each

- **Attempts:** 30
  - Varying scores (45-95 points)
  - All submitted for analytics
  - Realistic distribution

---

## 🔐 Security Notes

**For Demo Only - DO NOT USE IN PRODUCTION:**

- Default passwords are weak (`pass123`, `admin123`)
- JWT secret is hardcoded
- Database credentials are simple
- CORS allows all origins
- No rate limiting
- No HTTPS (uses HTTP)

**For Production:**
- Use strong, unique passwords
- Generate secure JWT secret (64+ chars)
- Use environment-specific credentials
- Configure CORS properly
- Enable rate limiting
- Use HTTPS with valid certificates
- Enable audit logging
- Set up monitoring and alerting

---

## 📚 Additional Resources

- **Full Documentation:** See `CHUNK_9_COMPLETE.md` for grading system details
- **API Reference:** http://localhost:8000/docs (when running)
- **Quick Reference:** See `QUICK_REFERENCE.md`
- **Architecture:** See `README.md`

---

## 🛑 Stopping the Platform

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v

# Stop but keep containers
docker-compose stop
```

---

## 🔄 Restarting

```bash
# Quick restart (keeps data)
docker-compose restart

# Full restart
docker-compose down
docker-compose up -d

# Restart specific service
docker-compose restart api
```

---

## 📝 Logs

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f api
docker-compose logs -f web

# Last 100 lines
docker-compose logs --tail=100 api
```

---

## ✅ Demo Checklist

Before presenting:

- [ ] All containers running (`docker-compose ps`)
- [ ] Database migrations applied
- [ ] Demo data seeded
- [ ] API accessible (http://localhost:8000/docs)
- [ ] Student app loading (http://localhost:5173)
- [ ] Admin panel loading (http://localhost:5174)
- [ ] Can login as admin
- [ ] Can login as student
- [ ] Exam available in student dashboard
- [ ] At least 30 attempts in database (for analytics)

---

## 🎯 Success Criteria

Platform is demo-ready when:

✅ Student can take exam end-to-end  
✅ Real-time checkpointing works  
✅ Offline mode saves answers locally  
✅ Encryption checksum displays on submit  
✅ Auto-grading applies partial credit  
✅ Results page shows analytics  
✅ Instructor can grade with rubrics  
✅ Analytics show difficulty/discrimination  
✅ No errors in logs  

---

**🎉 You're ready to demo! Good luck!**
