# Center-Based Exam Platform

A comprehensive, secure examination platform designed for conducting exams in physical centers with offline resilience, real-time checkpointing, and encrypted submissions.

## 🎯 Overview

This platform enables organizations to conduct large-scale exams (3k-5k concurrent users) across multiple centers with features like:

- **Secure Exam Taking**: Uses Safe Exam Browser (SEB) to prevent tab/window switching
- **Real-time Checkpointing**: Auto-saves every 15 seconds via WebSocket
- **Offline Resilience**: Continues functioning during network outages using IndexedDB
- **Workstation Transfers**: Move candidates between workstations seamlessly
- **Encrypted Submissions**: Client-side AES-256-GCM encryption with PBKDF2 key derivation
- **Enhanced Auto-Grading**: Partial credit, fuzzy matching, numeric tolerance
- **Rubric-Based Manual Grading**: Analytical rubrics with criterion-level scoring
- **Performance Analytics**: Difficulty index, discrimination index, percentile rankings
- **Mobile Apps**: Hall Authenticator and Technician apps (PWA)
- **Admin Dashboard**: Comprehensive management interface

## ✨ Latest Features (Chunk 9)

- ✅ **Partial Credit Grading**: Jaccard similarity for MCQ multiple choice
- ✅ **Fuzzy Text Matching**: SequenceMatcher with 80% threshold for fill-in-blanks
- ✅ **Numeric Tolerance**: Absolute + percentage tolerance with linear degradation
- ✅ **Rubrics System**: 6 models supporting analytical/holistic/checklist rubrics
- ✅ **Manual Grading API**: 13 endpoints for rubric CRUD and grading workflow
- ✅ **Analytics Service**: Question difficulty, discrimination index, exam statistics
- ✅ **Enhanced Results Page**: Percentile rankings, performance comparisons, feedback display

**Progress:** 9/21 chunks complete (42.9%) | **Tests:** 1,100+ passing

## 🚀 Quick Start (Automated Setup)

### Option 1: One-Command Demo Setup ⭐ **NEW: Auto-Install Docker!**

**For complete automated setup with automatic dependency installation:**

```bash
# Clone repository
git clone <repository-url>
cd OEP

# Run automated setup script (it will auto-install Docker if missing!)
./setup-demo.sh
```

The script now **automatically detects your OS and installs Docker** if needed!

**Supported Systems:**
- ✅ **Arch Linux / Manjaro / EndeavourOS** (uses pacman)
- ✅ **Ubuntu / Debian** (uses apt)
- ✅ **RHEL / CentOS / Fedora** (uses dnf)
- ✅ **macOS** (manual Docker Desktop installation)

**What the script does:**
- ✅ Detects your operating system
- ✅ **Auto-installs Docker and Docker Compose** (with your permission)
- ✅ Configures Docker service and user permissions
- ✅ Builds all containers
- ✅ Runs database migrations
- ✅ Generates encryption keys
- ✅ Seeds demo data (57 users, 1 exam, 30 attempts)
- ✅ Starts all services
- ✅ Performs health checks

**Setup time:** ~10-15 minutes (first run)

> **Note:** See [INSTALLATION.md](INSTALLATION.md) for detailed OS-specific installation instructions and troubleshooting.

### Option 2: Quick Start (Docker Already Installed)

**If you already have Docker installed:**

```bash
# Clone and start
git clone <repository-url>
cd OEP
./quick-start.sh
```

**Setup time:** ~3-5 minutes

### Option 3: Manual Setup (Step-by-Step)

See [DEMO_SETUP.md](DEMO_SETUP.md) for detailed manual setup instructions.

## 📍 Access Points

After setup completes:

- **🎓 Student Exam App**: http://localhost:5173
- **👨‍💼 Admin Dashboard**: http://localhost:5174
- **📱 Hall Authenticator**: http://localhost:5175
- **🔧 Technician App**: http://localhost:5176
- **📚 API Documentation**: http://localhost:8000/docs
- **💾 MinIO Console**: http://localhost:9001

## 🔐 Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Instructor | `hic1` | `pass123` |
| Student | `student001` - `student050` | `pass123` |
| Hall Authenticator | `hallauth1`, `hallauth2` | `pass123` |
| Technician | `tech1`, `tech2` | `pass123` |

## 🛠️ Development

### Available Make Commands

## 🎬 Demo Walkthrough

**See [DEMO_SETUP.md](DEMO_SETUP.md) for complete demo instructions.**

### Quick Demo (13 minutes)

1. **Student Taking Exam** (5 min)
   - Login as `student001`
   - Take "Demo Exam - Programming Fundamentals"
   - Observe: real-time checkpointing, offline mode, encryption
   - View results with analytics

2. **Instructor Grading** (5 min)
   - Login as `hic1`
   - Grade essay using analytical rubric
   - Apply criterion-level scores with comments
   - View updated attempt scores

3. **Analytics Dashboard** (3 min)
   - View question difficulty & discrimination indices
   - Explore exam statistics with percentile distribution
   - Identify problematic questions

## 📊 Demo Data

After running `setup-demo.sh` or `quick-start.sh`:

- **57 Users**: 1 admin, 2 instructors, 50 students, 4 staff
- **1 Demo Exam**: "Programming Fundamentals" with 7 questions
- **7 Question Types**: MCQ, True/False, Fill-blank, Numeric, Essay, Code
- **1 Rubric**: Analytical rubric with 2 criteria, 4 performance levels
- **30 Submitted Attempts**: For analytics demonstration

## 🛠️ Development

### Available Make Commands

```bash
make dev-up          # Start all services in development mode
make dev-down        # Stop all services
make build           # Build all Docker images
make test            # Run all tests (backend + frontend)
make test-api        # Run backend tests only
make test-web        # Run frontend tests only
make lint            # Run linters
make migrate         # Run database migrations
make seed            # Seed database with demo data
make logs            # View all service logs
make clean           # Clean up containers and volumes
make gen-keys        # Generate development encryption keys
```

### Running Individual Services

#### Backend (FastAPI)

```bash
cd api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Frontend (React)

```bash
cd web
npm install
npm run dev
```

#### Admin UI

```bash
cd admin
npm install
npm run dev
```

### Database Migrations

```bash
# Create new migration
docker-compose exec api alembic revision --autogenerate -m "description"

# Apply migrations
docker-compose exec api alembic upgrade head

# Rollback
docker-compose exec api alembic downgrade -1
```

## 🧪 Testing

### Run All Tests

```bash
make test
```

### Backend Tests

```bash
cd api
pytest -v
pytest --cov=app tests/  # With coverage
```

### Frontend Tests

```bash
cd web
npm test
npm run test:coverage
```

### Load Testing

```bash
cd tests/load
npm install
npm run load-test  # Simulates 3k concurrent WebSocket connections
```

## 📦 Project Structure

```
OEP/
├── .github/
│   ├── workflows/           # GitHub Actions CI/CD
│   └── copilot-instructions.md
├── api/                     # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Config, security, DB
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── main.py
│   ├── alembic/            # DB migrations
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
├── web/                     # Student exam SPA
│   ├── src/
│   │   ├── components/
│   │   ├── services/       # API, WebSocket, IndexedDB
│   │   ├── hooks/
│   │   └── App.tsx
│   ├── public/
│   └── package.json
├── admin/                   # Admin dashboard
├── hall-auth/              # Hall Authenticator PWA
├── technician/             # Technician PWA
├── infra/
│   ├── k8s/                # Kubernetes manifests
│   ├── helm/               # Helm charts
│   └── monitoring/         # Prometheus, Grafana configs
├── scripts/
│   ├── seed.py             # Database seeding
│   └── gen-keys.sh         # Key generation
├── tests/
│   ├── load/               # k6 load tests
│   └── e2e/                # End-to-end tests
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── deployment.md
│   └── runbooks/
├── secrets.sample/         # Sample secrets (copy to ./secrets)
├── docker-compose.yml
├── Makefile
└── README.md
```

## 🔐 Security

### Development

- Uses self-signed certificates (auto-generated)
- Dev RSA keypair stored in `./secrets/` (gitignored)
- Demo data with weak passwords for testing only

### Production Checklist

- [ ] Replace dev keys with cloud KMS (AWS KMS / GCP KMS)
- [ ] Use proper TLS certificates (Let's Encrypt / commercial CA)
- [ ] Rotate all secrets and passwords
- [ ] Enable audit logging to external SIEM
- [ ] Configure Redis with authentication
- [ ] Enable PostgreSQL SSL connections
- [ ] Review and harden CORS policies
- [ ] Set up rate limiting and DDoS protection
- [ ] Enable database encryption at rest
- [ ] Configure network policies in Kubernetes

## 📊 Monitoring

Access Grafana dashboard at http://localhost:3000 (after running monitoring stack):

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

**Key Metrics:**
- WebSocket connection count
- Checkpoint rate (checkpoints/second)
- Redis stream backlog
- Database write throughput
- Worker queue length
- API response times

**Alerts Configured:**
- High checkpoint backlog (>10k)
- Worker failures
- Low WebSocket ACK rate (<95%)
- Database connection pool exhaustion

## 🚢 Deployment

### Docker Compose (Staging)

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes (Production)

```bash
# Apply manifests
kubectl apply -f infra/k8s/

# Or use Helm
helm install exam-platform infra/helm/exam-platform/

# Check status
kubectl get pods -n exam-platform
```

See [deployment guide](docs/deployment.md) for detailed instructions.

## 📚 Documentation

### Setup & Installation
- **[INSTALLATION.md](INSTALLATION.md)** - Complete installation guide for all OS
- **[SCRIPTS_GUIDE.md](SCRIPTS_GUIDE.md)** - Detailed guide to all setup scripts
- **[DEMO_SETUP.md](DEMO_SETUP.md)** - Demo walkthrough with 4 scenarios
- **[DEMO_READY.md](DEMO_READY.md)** - Quick demo checklist
- **[UPGRADE_NOTES.md](UPGRADE_NOTES.md)** - Latest improvements and features

### Platform Documentation
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - API endpoints and features overview
- **[CHUNK_9_COMPLETE.md](CHUNK_9_COMPLETE.md)** - Enhanced grading system
- **[CHUNK_8_COMPLETE.md](CHUNK_8_COMPLETE.md)** - Encryption implementation
- [Architecture Overview](docs/architecture.md)
- [API Documentation](docs/api.md) or http://localhost:8000/docs

### Operations
- [Deployment Guide](docs/deployment.md)
- [Runbooks](docs/runbooks/)
  - [Workstation Transfer](docs/runbooks/workstation-transfer.md)
  - [Network Outage Handling](docs/runbooks/network-outage.md)
  - [Exam Day Operations](docs/runbooks/exam-day.md)
  - [Key Compromise Response](docs/runbooks/key-compromise.md)
  - [Decryption Process](docs/runbooks/decryption.md)

### Quick Commands
```bash
./check-system.sh   # Check your system before setup
./commands.sh       # View all available commands
```

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and add tests
3. Run linters: `make lint`
4. Run tests: `make test`
5. Commit: `git commit -m "feat(component): description"`
6. Push and create Pull Request

## 📄 License

[Your License Here]

## 🆘 Support

- **Issues**: GitHub Issues
- **Docs**: `/docs` directory
- **API Docs**: http://localhost:8000/docs (when running)

## 🎯 Roadmap

- [x] Chunk 0: Repo scaffold & developer onboarding
- [ ] Chunk 1: Authentication & RBAC
- [ ] Chunk 2: Basic Exam & Question CRUD
- [ ] Chunk 3: Student attempt lifecycle
- [ ] Chunk 4: WebSocket checkpoint pipeline
- [ ] Chunk 5: Frontend exam SPA with SEB
- [ ] Chunk 6: IndexedDB reconciliation & offline UX
- [ ] Chunk 7: Workstation model & registration
- [ ] Chunk 8: Hall Authenticator app
- [ ] Chunk 9: Hall Technician app & transfer flow
- [ ] Chunk 10: Encrypted blob generation
- [ ] Chunk 11: Technician upload & offline submission
- [ ] Chunk 12: Admin Dashboard
- [ ] Chunk 13: Checkpoint persistence optimization
- [ ] Chunk 14: Audit logging
- [ ] Chunk 15: CI/CD pipeline
- [ ] Chunk 16: Local infra & seed data
- [ ] Chunk 17: Kubernetes manifests
- [ ] Chunk 18: Load testing
- [ ] Chunk 19: Monitoring & alerting
- [ ] Chunk 20: Runbooks & pilot checklist
- [ ] Chunk 21: Final documentation

---

**Built with ❤️ for secure, scalable examination delivery**
