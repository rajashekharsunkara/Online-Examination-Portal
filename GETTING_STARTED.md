# 🚀 Getting Started - Complete Guide

Welcome to the Online Examination Portal! This guide will get you up and running in **5 minutes**.

---

## 📋 What You'll Need

- **Computer**: Windows 10/11, macOS, or Linux
- **RAM**: 8GB minimum (16GB recommended)
- **Disk Space**: 20GB free
- **Internet**: For initial download only (works offline after setup)

---

## 🎯 Installation Steps

### Step 1: Install Docker Desktop (3 minutes)

<details>
<summary><b>Windows Installation</b></summary>

1. Download Docker Desktop: https://www.docker.com/products/docker-desktop
2. Run installer
3. **Important**: Enable WSL 2 backend when prompted
4. Restart computer
5. Launch Docker Desktop from Start Menu
6. Wait for green "Docker Desktop is running" icon in system tray

**Verify Installation:**
```bash
docker --version
docker-compose --version
```

</details>

<details>
<summary><b>macOS Installation</b></summary>

1. Download Docker Desktop for Mac: https://www.docker.com/products/docker-desktop
2. Drag Docker.app to Applications folder
3. Launch Docker from Applications
4. Grant permissions when prompted
5. Wait for whale icon in menu bar

**Verify Installation:**
```bash
docker --version
docker-compose --version
```

</details>

<details>
<summary><b>Linux Installation</b></summary>

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Logout and login again

# Verify
docker --version
docker-compose --version
```

</details>

---

### Step 2: Clone Repository (30 seconds)

Open **Terminal** (Linux/Mac) or **Git Bash** (Windows):

```bash
# Clone the repository
git clone https://github.com/rajashekharsunkara/Online-Examination-Portal.git

# Navigate to project directory
cd Online-Examination-Portal
```

**Don't have Git?** Download as ZIP: https://github.com/rajashekharsunkara/Online-Examination-Portal/archive/refs/heads/main.zip

---

### Step 3: Generate Security Keys (10 seconds)

```bash
bash scripts/gen-keys.sh
```

**If bash command fails (Windows):**
```bash
# Create secrets directory
mkdir -p secrets

# Generate keys using OpenSSL
openssl genrsa -out secrets/private_key.pem 2048
openssl rsa -in secrets/private_key.pem -pubout -out secrets/public_key.pem
```

---

### Step 4: Start All Services (1 minute)

```bash
# Build and start all containers
docker-compose up -d --build
```

**What this does:**
- Builds Docker images for API, Web, Admin
- Starts PostgreSQL database
- Starts Redis cache
- Starts MinIO storage
- Starts all application services

**Wait 30-60 seconds** for all services to initialize.

**Check status:**
```bash
docker-compose ps
```

All containers should show `Up` or `healthy` status.

---

### Step 5: Seed Demo Data (1 minute)

```bash
# Create admin user and base data
docker-compose exec api python -m scripts.seed

# Create AP ITI demo data (50 students, 15 trades, 26 centers)
docker-compose exec api python -m scripts.seed_ap_iti_demo
```

**Expected output:**
```
✅ Total trades: 15
✅ Total centers: 26
✅ Total questions created: 150
✅ Students: 50
✅ SYSTEM READY FOR TESTING!
```

---

## 🎉 You're Ready!

### Access the Application

Open your browser:

| Application | URL | Description |
|-------------|-----|-------------|
| **Student Portal** | http://localhost:5173 | Take exams as student |
| **Admin Dashboard** | http://localhost:5174 | Manage exams (coming soon) |
| **API Documentation** | http://localhost:8000/docs | Interactive API docs |

---

## 🎓 Take Your First Exam

### Step 1: Login

Go to: http://localhost:5173

**Use these credentials:**
```
Hall Ticket Number: AP20250001
Date of Birth: 02/02/2001
Security Answer: kumar
```

### Step 2: Pre-Exam Instructions

- Read the instructions carefully
- Check "I have verified my details"
- Check "I have read and accept the rules"
- Click "Start Exam"

**Note**: There's a 15-minute countdown (you can close and reopen browser, timer persists)

### Step 3: Take Exam

- Exam automatically enters **fullscreen mode**
- Timer shows at top (120 minutes)
- Answer questions (A, B, C, D options)
- Use "Previous" / "Next" to navigate
- Click "Submit Exam" when done

### Step 4: Proctoring in Action

**Try these to see proctoring:**
- Press **ESC** → Warning alert (3 strikes = auto-submit)
- Switch tabs → Logged as violation
- Try Ctrl+C → Copy blocked
- Try F12 → DevTools blocked
- Right-click → Disabled

### Step 5: Submit

- Click "Submit Exam"
- Confirm submission
- Exits fullscreen automatically
- View results page

---

## 👥 More Student Accounts

All students use **Security Answer: kumar**

| Hall Ticket | DOB | Trade |
|-------------|-----|-------|
| AP20250001 | 02/02/2001 | Blockchain Technology |
| AP20250002 | 03/03/2002 | Computer Operator |
| AP20250003 | 04/04/2003 | Electrician |
| AP20250004 | 05/05/2004 | Fitter |
| AP20250005 | 06/06/2000 | Welder |
| AP20250006 | 07/07/2001 | Mechanic Motor Vehicle |
| AP20250007 | 08/08/2002 | Plumber |
| AP20250008 | 09/09/2003 | Carpenter |
| AP20250009 | 10/10/2004 | Electronics Mechanic |
| AP20250010 | 11/11/2000 | Refrigeration & AC |

**Total**: 50 students available (AP20250001 to AP20250050)

---

## 🔧 Common Issues

### Issue: Docker Desktop not starting

**Solution:**
1. Enable Virtualization in BIOS
2. Enable Hyper-V (Windows Features)
3. Restart computer
4. Run Docker Desktop as Administrator

### Issue: Port already in use

**Error:** `Bind for 0.0.0.0:5173 failed`

**Solution:**
```bash
# Stop all containers
docker-compose down

# Find and kill process using port
# Windows PowerShell:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:5173 | xargs kill

# Restart
docker-compose up -d
```

### Issue: Browser shows old cached version

**Solution:**
1. **Hard Refresh**: Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. **OR**: Open Incognito/Private window (`Ctrl+Shift+N`)
3. **OR**: Clear browser cache in DevTools (F12 → Network → Disable cache)

### Issue: Database connection failed

**Solution:**
```bash
# Restart PostgreSQL
docker-compose restart postgres

# Wait 30 seconds, then try again

# If still fails, check logs
docker-compose logs postgres --tail=50
```

### Issue: Seed script fails

**Solution:**
```bash
# Reset database
docker-compose down
docker volume rm oep_postgres_data
docker-compose up -d

# Wait 30 seconds

# Re-seed
docker-compose exec api python -m scripts.seed
docker-compose exec api python -m scripts.seed_ap_iti_demo
```

---

## 📚 Next Steps

### Explore Documentation

- **[Windows Setup Guide](WINDOWS_SETUP.md)** - Detailed Windows installation
- **[Database Setup](DATABASE_SETUP.md)** - Database management guide
- **[Proctoring Guide](PROCTORING_HOOKS_GUIDE.md)** - How proctoring works
- **[Testing Guide](TESTING_GUIDE_FINAL.md)** - Run automated tests
- **[Quick Reference](QUICK_REFERENCE.md)** - Cheat sheet of commands

### Customize Your Setup

1. **Change Student Data**: Edit `api/scripts/seed_ap_iti_demo.py`
2. **Add Questions**: Modify question creation in seed script
3. **Adjust Exam Duration**: Update `duration_minutes` in exams
4. **Change Proctoring Rules**: Edit hooks in `web/src/hooks/`

### Database Management

```bash
# Backup database
bash scripts/export-db.sh

# Restore database
bash scripts/import-db.sh <backup_file.sql>

# View database stats
docker-compose exec postgres psql -U exam_user -d exam_db -c "
SELECT 
  (SELECT COUNT(*) FROM users WHERE hall_ticket_number IS NOT NULL) as students,
  (SELECT COUNT(*) FROM exams) as exams,
  (SELECT COUNT(*) FROM questions) as questions;
"
```

### Development

```bash
# View live logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api
docker-compose logs -f web

# Restart after code changes
docker-compose restart api
docker-compose restart web

# Rebuild after major changes
docker-compose up -d --build
```

---

## 🎯 Quick Command Reference

```bash
# Start system
docker-compose up -d

# Stop system
docker-compose down

# View logs
docker-compose logs -f

# Restart service
docker-compose restart <service>

# Rebuild
docker-compose up -d --build

# Database backup
bash scripts/export-db.sh

# Database restore
bash scripts/import-db.sh <file.sql>

# Reset everything
docker-compose down -v
docker-compose up -d --build
docker-compose exec api python -m scripts.seed
docker-compose exec api python -m scripts.seed_ap_iti_demo
```

---

## ✅ System Health Check

Run these commands to verify everything is working:

```bash
# 1. Check all containers running
docker-compose ps

# 2. Check database
docker-compose exec postgres psql -U exam_user -d exam_db -c "SELECT COUNT(*) FROM users;"

# 3. Check API health
curl http://localhost:8000/health

# 4. Check web server
curl http://localhost:5173

# 5. View recent logs
docker-compose logs --tail=20
```

All should return success responses!

---

## 🆘 Get Help

- **Issues**: https://github.com/rajashekharsunkara/Online-Examination-Portal/issues
- **Documentation**: See `docs/` folder
- **API Docs**: http://localhost:8000/docs (when running)

---

## 🎉 Congratulations!

You've successfully set up the Online Examination Portal!

**What you can do now:**
- ✅ Login as any of 50 students
- ✅ Take exams in fullscreen mode
- ✅ Experience comprehensive proctoring
- ✅ See real-time answer saving
- ✅ Submit exams and view results
- ✅ Manage database backups
- ✅ Customize for your needs

**Ready for demo?** See [DEMO_SETUP.md](DEMO_SETUP.md)

**Need Windows-specific help?** See [WINDOWS_SETUP.md](WINDOWS_SETUP.md)

**Want to understand the database?** See [DATABASE_SETUP.md](DATABASE_SETUP.md)

---

<div align="center">

**⭐ Don't forget to star the repository! ⭐**

Happy Examining! 🎓

</div>
