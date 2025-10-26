# Windows Setup Guide - Online Examination Portal

Complete guide for setting up the Online Examination Portal on Windows.

## 📋 Prerequisites

### Required Software
1. **Docker Desktop for Windows** (includes Docker Compose)
   - Download: https://www.docker.com/products/docker-desktop
   - Version: 4.0 or higher
   - Enable WSL 2 backend during installation

2. **Git for Windows**
   - Download: https://git-scm.com/download/win
   - Use Git Bash for commands

3. **Node.js** (Optional - only for local development without Docker)
   - Download: https://nodejs.org/ (LTS version)
   - Version: 18.x or higher

4. **Visual Studio Code** (Recommended)
   - Download: https://code.microsoft.com/

### System Requirements
- Windows 10/11 (64-bit)
- 8GB RAM minimum (16GB recommended)
- 20GB free disk space
- Internet connection for initial setup

---

## 🚀 Quick Start (First Time Setup)

### Step 1: Clone the Repository

Open **Git Bash** (or Command Prompt) and run:

```bash
# Clone the repository
git clone https://github.com/rajashekharsunkara/Online-Examination-Portal.git

# Navigate to project directory
cd Online-Examination-Portal
```

### Step 2: Start Docker Desktop

1. Launch **Docker Desktop** from Start Menu
2. Wait for Docker to start (green icon in system tray)
3. Verify Docker is running:

```bash
docker --version
docker-compose --version
```

### Step 3: Generate Security Keys

Run this command in Git Bash:

```bash
# Generate RSA key pair for encryption
bash scripts/gen-keys.sh
```

**OR** manually create keys (if bash script fails):

```bash
# Create secrets directory
mkdir -p secrets

# Generate private key
openssl genrsa -out secrets/private_key.pem 2048

# Generate public key from private key
openssl rsa -in secrets/private_key.pem -pubout -out secrets/public_key.pem
```

### Step 4: Build and Start Services

```bash
# Build and start all containers
docker-compose up -d --build

# Wait 30-60 seconds for all services to start
# Check status
docker-compose ps
```

Expected output - all containers should be "Up" or "healthy":
```
NAME              STATUS
exam_postgres     Up (healthy)
exam_api          Up (healthy)
exam_web          Up
exam_admin        Up
```

### Step 5: Seed Demo Data

```bash
# Create admin user and base data
docker-compose exec api python -m scripts.seed

# Create AP ITI demo data (50 students, 15 trades, 26 centers)
docker-compose exec api python -m scripts.seed_ap_iti_demo
```

### Step 6: Access the Application

Open your browser:

- **Student Portal**: http://localhost:5173
- **Admin Dashboard**: http://localhost:5174  
- **API Documentation**: http://localhost:8000/docs

---

## 👨‍🎓 Demo Student Credentials

Use any of these credentials to login:

| Hall Ticket | Date of Birth | Security Answer | Trade |
|-------------|---------------|-----------------|-------|
| AP20250001 | 02/02/2001 | kumar | Blockchain Technology |
| AP20250002 | 03/03/2002 | kumar | Computer Operator |
| AP20250003 | 04/04/2003 | kumar | Electrician |
| AP20250004 | 05/05/2004 | kumar | Fitter |
| AP20250005 | 06/06/2000 | kumar | Welder |

**Security Answer for ALL students**: `kumar`

---

## 🎯 Taking Your First Exam

1. **Login** at http://localhost:5173
   - Enter Hall Ticket Number (e.g., `AP20250001`)
   - Enter Date of Birth (e.g., `02/02/2001`)
   - Enter Security Answer: `kumar`

2. **Pre-Exam Instructions**
   - Read instructions carefully
   - Check confirmation boxes
   - Wait for 15-minute countdown (or skip for testing)
   - Click "Start Exam"

3. **During Exam**
   - Enters fullscreen automatically
   - Timer displays at top (120 minutes)
   - Answer questions using radio buttons
   - Use "Previous" / "Next" to navigate
   - Click "Submit Exam" when done

4. **Proctoring Features Active**
   - ❌ Cannot exit fullscreen (3 warnings, then auto-submit)
   - ❌ Cannot switch tabs (logged as violation)
   - ❌ Cannot copy/paste (blocked)
   - ❌ Cannot right-click (disabled)
   - ❌ Cannot open DevTools (F12 blocked)

---

## 🔧 Common Issues & Solutions

### Issue 1: Docker Desktop Not Starting

**Solution:**
1. Enable **Virtualization** in BIOS
2. Enable **Hyper-V** in Windows Features
3. Restart computer
4. Run Docker Desktop as Administrator

### Issue 2: Port Already in Use

**Error:** `Bind for 0.0.0.0:5173 failed: port is already allocated`

**Solution:**
```bash
# Stop all Docker containers
docker-compose down

# Find process using port (PowerShell)
netstat -ano | findstr :5173

# Kill process by PID (replace 1234 with actual PID)
taskkill /PID 1234 /F

# Restart containers
docker-compose up -d
```

### Issue 3: Database Connection Failed

**Solution:**
```bash
# Restart PostgreSQL container
docker-compose restart postgres

# Check PostgreSQL logs
docker-compose logs postgres --tail=50

# Wait 30 seconds and try again
```

### Issue 4: Browser Shows Old Cached Code

**Solution:**
1. **Hard Refresh**: Press `Ctrl+Shift+R`
2. **Clear Cache**:
   - Open DevTools (F12)
   - Right-click Refresh button
   - Select "Empty Cache and Hard Reload"
3. **OR**: Use Incognito/Private window (`Ctrl+Shift+N`)

### Issue 5: "Cannot connect to Docker daemon"

**Solution:**
```bash
# Start Docker Desktop
# Wait for green icon in system tray
# Verify with:
docker ps
```

---

## 📦 Database Management

### Backup Database

```bash
# Backup all data
docker-compose exec postgres pg_dump -U exam_user exam_db > backup.sql

# Backup with timestamp
docker-compose exec postgres pg_dump -U exam_user exam_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database

```bash
# Restore from backup
cat backup.sql | docker-compose exec -T postgres psql -U exam_user exam_db
```

### Reset Database (Fresh Start)

```bash
# Complete reset
docker-compose down
docker volume rm oep_postgres_data
docker-compose up -d

# Wait for PostgreSQL to start (30 seconds)
# Re-seed data
docker-compose exec api python -m scripts.seed
docker-compose exec api python -m scripts.seed_ap_iti_demo
```

### View Database Tables

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U exam_user -d exam_db

# List tables
\dt

# View students
SELECT hall_ticket_number, full_name, email FROM users WHERE hall_ticket_number IS NOT NULL LIMIT 10;

# View exams
SELECT id, title, duration_minutes, total_marks FROM exams;

# Exit
\q
```

---

## 🛠️ Development Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f postgres

# Last 50 lines
docker-compose logs --tail=50 api
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart api
docker-compose restart web
```

### Stop Services

```bash
# Stop all containers
docker-compose down

# Stop and remove volumes (complete cleanup)
docker-compose down -v
```

### Rebuild After Code Changes

```bash
# Rebuild specific service
docker-compose build api
docker-compose build web

# Rebuild and restart
docker-compose up -d --build
```

---

## 🏗️ Project Structure

```
Online-Examination-Portal/
├── api/                    # FastAPI backend
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   ├── models/        # Database models
│   │   ├── schemas/       # Pydantic schemas
│   │   └── services/      # Business logic
│   ├── scripts/           # Seed scripts
│   └── tests/             # Backend tests
├── web/                   # Student portal (React + Vite)
│   └── src/
│       ├── components/    # React components
│       ├── hooks/         # Custom hooks (proctoring)
│       ├── pages/         # Page components
│       └── services/      # API clients
├── admin/                 # Admin dashboard (React + Vite)
├── secrets/               # RSA keys (gitignored)
├── scripts/               # Helper scripts
└── docker-compose.yml     # Docker orchestration
```

---

## 🔐 Security Features

1. **Authentication**
   - Hall ticket + DOB + security question
   - JWT tokens with short expiry
   - Session management

2. **Proctoring**
   - Fullscreen enforcement (auto-submit after 3 violations)
   - Tab switch detection
   - Copy/paste prevention
   - Right-click disabled
   - DevTools blocked
   - Keyboard shortcuts disabled

3. **Encryption**
   - Final submissions encrypted with RSA
   - TLS for all connections (production)
   - Secure password hashing (bcrypt)

4. **Monitoring**
   - All proctoring events logged
   - Timestamp tracking per question
   - Audit logs for critical actions

---

## 📊 System Architecture

```
┌─────────────────┐
│  Student (Web)  │ ──────► http://localhost:5173
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Vite Dev Proxy │ ──────► Proxies /api and /ws
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  FastAPI Backend│ ──────► http://api:8000
└────────┬────────┘
         │
    ┌────┴────┬─────────┬──────────┐
    ▼         ▼         ▼          ▼
┌────────┐ ┌────────┐ ┌─────┐ ┌────────┐
│Postgres│ │ Redis  │ │MinIO│ │ Celery │
└────────┘ └────────┘ └─────┘ └────────┘
```

---

## 🎓 Features Overview

### Student Portal
- ✅ Hall ticket authentication
- ✅ Pre-exam instructions (15-minute countdown)
- ✅ Timed exams with auto-submit
- ✅ Multiple question types (MCQ, True/False, Descriptive)
- ✅ Real-time answer checkpointing (every 15 seconds)
- ✅ Offline resilience (IndexedDB)
- ✅ Workstation transfer capability
- ✅ Comprehensive proctoring
- ✅ Encrypted final submission

### Admin Dashboard
- ✅ Exam creation & management
- ✅ Student management
- ✅ Results viewing & grading
- ✅ Proctoring reports
- ✅ Analytics dashboard

### Technician App
- ✅ Workstation transfer approval
- ✅ Technical issue handling
- ✅ Student verification

---

## 🧪 Testing

### Run Backend Tests

```bash
# All tests
docker-compose exec api pytest

# Specific test file
docker-compose exec api pytest tests/test_auth.py

# With coverage
docker-compose exec api pytest --cov=app tests/
```

### Run Frontend Tests

```bash
# Student portal tests
docker-compose exec web npm test

# Admin dashboard tests
docker-compose exec admin npm test
```

---

## 📝 Environment Variables

All environment variables are set in `docker-compose.yml`. Key variables:

```yaml
# Database
POSTGRES_USER=exam_user
POSTGRES_PASSWORD=exam_password
POSTGRES_DB=exam_db

# API
DATABASE_URL=postgresql://exam_user:exam_password@postgres/exam_db
REDIS_URL=redis://redis:6379/0
SECRET_KEY=your-secret-key-here
```

**Note**: Change these in production!

---

## 🚢 Production Deployment

For production deployment:

1. Use Kubernetes (see `infra/` directory)
2. Set up proper TLS certificates
3. Use managed PostgreSQL (AWS RDS, Google Cloud SQL)
4. Use managed Redis (AWS ElastiCache, Redis Cloud)
5. Configure proper secrets management
6. Set up monitoring (Prometheus, Grafana)
7. Configure backups and disaster recovery

---

## 📞 Support

- **Documentation**: See `docs/` directory
- **Issues**: https://github.com/rajashekharsunkara/Online-Examination-Portal/issues
- **Demo Setup**: See `DEMO_SETUP.md`
- **API Docs**: http://localhost:8000/docs (when running)

---

## 📄 License

See LICENSE file for details.

---

## ✅ Quick Checklist

- [ ] Docker Desktop installed and running
- [ ] Repository cloned
- [ ] Security keys generated (`bash scripts/gen-keys.sh`)
- [ ] Containers built and running (`docker-compose up -d --build`)
- [ ] Database seeded (`docker-compose exec api python -m scripts.seed_ap_iti_demo`)
- [ ] Can access http://localhost:5173
- [ ] Can login with demo credentials
- [ ] Can take exam successfully

**If all checked, you're ready to go! 🎉**
