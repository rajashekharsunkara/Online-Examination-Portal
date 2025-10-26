# 🎓 Online Examination Portal

[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A **secure, offline-resilient examination platform** built for conducting center-based exams with **comprehensive proctoring**, **real-time checkpointing**, and **encrypted submissions**. Designed for government institutions like **Andhra Pradesh ITI** with support for 15+ trades, 26+ exam centers, and thousands of students.

---

## 🌟 Key Features

### 🔒 Security & Proctoring
- ✅ **Fullscreen Enforcement** - Auto-submit after 3 violations
- ✅ **Tab Switch Detection** - Logs all attempts to leave exam window
- ✅ **Copy/Paste Prevention** - Keyboard shortcuts blocked
- ✅ **Right-Click Disabled** - No context menu access
- ✅ **DevTools Blocked** - F12 and inspect element disabled
- ✅ **Encrypted Submissions** - RSA encryption for final answers
- ✅ **Hall Ticket Authentication** - Three-factor verification

### 💾 Reliability & Performance
- ✅ **Real-time Checkpointing** - Auto-saves every 15 seconds
- ✅ **Offline Resilience** - Works without internet using IndexedDB
- ✅ **Workstation Transfer** - Continue exam on different computer
- ✅ **WebSocket Sync** - Real-time answer synchronization
- ✅ **Auto-Submit on Timeout** - Ensures no data loss

### 📊 Management & Monitoring
- ✅ **Admin Dashboard** - Complete exam and student management
- ✅ **Proctoring Reports** - Detailed violation logs
- ✅ **Analytics** - Performance insights and statistics
- ✅ **Audit Logging** - All critical actions tracked
- ✅ **Grading System** - Automated and manual grading support

---

## 🚀 Quick Start

### Prerequisites
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)
- **Git** - [Download](https://git-scm.com/)

### Installation (5 Minutes)

```bash
# 1. Clone repository
git clone https://github.com/rajashekharsunkara/Online-Examination-Portal.git
cd Online-Examination-Portal

# 2. Generate security keys
bash scripts/gen-keys.sh

# 3. Start all services
docker-compose up -d --build

# 4. Seed demo data (wait 30 seconds after step 3)
docker-compose exec api python -m scripts.seed
docker-compose exec api python -m scripts.seed_ap_iti_demo
```

### Access Application

- **Student Portal**: http://localhost:5173
- **Admin Dashboard**: http://localhost:5174
- **API Docs**: http://localhost:8000/docs

### Demo Login

| Hall Ticket | DOB | Security Answer | Trade |
|-------------|-----|-----------------|-------|
| AP20250001 | 02/02/2001 | kumar | Blockchain Technology |
| AP20250002 | 03/03/2002 | kumar | Computer Operator |
| AP20250003 | 04/04/2003 | kumar | Electrician |

---

## 📚 Documentation

- **[Windows Setup Guide](WINDOWS_SETUP.md)** - Complete Windows installation
- **[Quick Reference](QUICK_REFERENCE.md)** - Commands and shortcuts
- **[Proctoring Guide](PROCTORING_HOOKS_GUIDE.md)** - Proctoring details
- **[Testing Guide](TESTING_GUIDE_FINAL.md)** - Running tests
- **[API Docs](http://localhost:8000/docs)** - Interactive API (when running)

---

## 🏗️ Architecture

```
Student Portal (React) → Vite Proxy → FastAPI Backend
                                      ↓
                            PostgreSQL + Redis + MinIO
```

---

## 🛠️ Tech Stack

**Backend**: FastAPI, PostgreSQL, Redis, Celery, WebSockets  
**Frontend**: React 18, TypeScript, Vite, Zustand  
**Infrastructure**: Docker, Kubernetes, MinIO

---

## 📦 Project Structure

```
api/          # FastAPI backend
web/          # Student portal (React)
admin/        # Admin dashboard
scripts/      # Seed scripts
secrets/      # RSA keys
```

---

## 🔐 Security

- Three-factor authentication (Hall Ticket + DOB + Security Question)
- Comprehensive proctoring (fullscreen, tab detection, keyboard blocking)
- RSA encrypted submissions
- Audit logging for all actions

---

## 🧪 Testing

```bash
# Backend tests
docker-compose exec api pytest --cov=app tests/

# Frontend tests
docker-compose exec web npm test
```

---

## 📊 Database Management

```bash
# Backup
docker-compose exec postgres pg_dump -U exam_user exam_db > backup.sql

# Reset
docker-compose down && docker volume rm oep_postgres_data
docker-compose up -d
```

---

## 🚢 Deployment

See `infra/` for Kubernetes manifests and production deployment guide.

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push and create PR

---

## 📝 License

MIT License - See [LICENSE](LICENSE)

---

## 👥 Author

**Rajashekhar Sunkara** - [@rajashekharsunkara](https://github.com/rajashekharsunkara)

---

<div align="center">

**⭐ Star this repo if you find it useful! ⭐**

Made with ❤️ for secure online examinations

</div>
