# Database Setup Guide

Complete guide for setting up and managing the PostgreSQL database for the Online Examination Portal.

---

## 🗄️ Quick Database Setup

### Option 1: Automatic Setup (Recommended)

```bash
# Start all services
docker-compose up -d --build

# Wait 30 seconds for PostgreSQL to initialize

# Create base data (admin user, roles)
docker-compose exec api python -m scripts.seed

# Create AP ITI demo data (15 trades, 50 students, 26 centers)
docker-compose exec api python -m scripts.seed_ap_iti_demo
```

### Option 2: Import Pre-seeded Database

If you have a database backup file:

```bash
# Import database backup
bash scripts/import-db.sh db_backup_20251027_002532.sql
```

---

## 📊 Database Contents

### After Full Seeding

| Table | Count | Description |
|-------|-------|-------------|
| **trades** | 15 | ITI trades (IoT, Blockchain, COPA, Electrician, etc.) |
| **centers** | 26 | Exam centers across 13 AP districts |
| **users** | 51 | 1 admin + 50 students |
| **exams** | 15 | One exam per trade |
| **questions** | 300 | 10 questions per trade (150) + general questions |
| **student_attempts** | 50 | Pre-created attempts for all students |

---

## 🎓 Student Accounts

All 50 demo students are pre-configured with:

- **Date of Birth Pattern**: Based on student number
  - Student 1: 02/02/2001
  - Student 2: 03/03/2002
  - Student N: (N+1)/(N+1)/200(N%5)

- **Security Answer**: `kumar` (for ALL students)

- **Hall Ticket Format**: `AP2025XXXX` (e.g., AP20250001)

### Sample Students

| Hall Ticket | DOB | Security Answer | Trade | District |
|-------------|-----|-----------------|-------|----------|
| AP20250001 | 02/02/2001 | kumar | Blockchain Technology | Anantapur |
| AP20250002 | 03/03/2002 | kumar | Computer Operator | Chittoor |
| AP20250003 | 04/04/2003 | kumar | Electrician | Chittoor |
| AP20250004 | 05/05/2004 | kumar | Fitter | East Godavari |
| AP20250005 | 06/06/2000 | kumar | Welder | East Godavari |
| AP20250006 | 07/07/2001 | kumar | Mechanic Motor Vehicle | Guntur |
| AP20250007 | 08/08/2002 | kumar | Plumber | Guntur |
| AP20250008 | 09/09/2003 | kumar | Carpenter | Krishna |
| AP20250009 | 10/10/2004 | kumar | Electronics Mechanic | Krishna |
| AP20250010 | 11/11/2000 | kumar | Refrigeration & AC | Kurnool |

---

## 📚 ITI Trades Configured

15 trades covering modern and traditional skills:

1. **IoT Technician (Smart City)** - Smart city technologies
2. **Blockchain Technology** - Distributed ledger systems
3. **Computer Operator & Programming Assistant (COPA)** - Basic programming
4. **Electrician** - Electrical installations
5. **Fitter** - Mechanical fitting
6. **Welder (Gas & Electric)** - Welding techniques
7. **Mechanic Motor Vehicle** - Automotive mechanics
8. **Plumber** - Plumbing systems
9. **Carpenter** - Woodwork
10. **Electronics Mechanic** - Electronic systems
11. **Refrigeration & Air Conditioning** - HVAC systems
12. **Draughtsman Civil** - Technical drawing
13. **Machinist** - Machine operations
14. **Tool & Die Maker** - Tool manufacturing
15. **Painter General** - Painting work

---

## 🗺️ Exam Centers by District

26 exam centers distributed across 13 districts (2 centers per district):

### Districts Covered

1. **Anantapur** - 2 centers
2. **Chittoor** - 2 centers
3. **East Godavari** - 2 centers
4. **Guntur** - 2 centers
5. **Krishna** - 2 centers
6. **Kurnool** - 2 centers
7. **Prakasam** - 2 centers
8. **Nellore (SPSR)** - 2 centers
9. **Srikakulam** - 2 centers
10. **Visakhapatnam** - 2 centers
11. **Vizianagaram** - 2 centers
12. **West Godavari** - 2 centers
13. **YSR Kadapa** - 2 centers

### Center Naming Pattern
- Format: `Government ITI <District> - Center <N>`
- Example: `Government ITI Visakhapatnam - Center 1`

---

## 🔧 Database Management Commands

### View Database Statistics

```bash
docker-compose exec postgres psql -U exam_user -d exam_db -c "
SELECT 
  (SELECT COUNT(*) FROM trades) as trades,
  (SELECT COUNT(*) FROM centers) as centers,
  (SELECT COUNT(*) FROM users WHERE hall_ticket_number IS NOT NULL) as students,
  (SELECT COUNT(*) FROM exams) as exams,
  (SELECT COUNT(*) FROM questions) as questions,
  (SELECT COUNT(*) FROM student_attempts) as attempts;
"
```

### List All Students

```bash
docker-compose exec postgres psql -U exam_user -d exam_db -c "
SELECT 
  hall_ticket_number, 
  full_name, 
  date_of_birth::date,
  t.name as trade,
  c.district
FROM users u
LEFT JOIN trades t ON u.trade_id = t.id
LEFT JOIN centers c ON u.center_id = c.id
WHERE hall_ticket_number IS NOT NULL
ORDER BY hall_ticket_number
LIMIT 20;
"
```

### List All Exams

```bash
docker-compose exec postgres psql -U exam_user -d exam_db -c "
SELECT 
  e.id,
  e.title,
  e.duration_minutes,
  e.total_marks,
  t.name as trade,
  COUNT(eq.question_id) as question_count
FROM exams e
LEFT JOIN trades t ON e.trade_id = t.id
LEFT JOIN exam_questions eq ON e.id = eq.exam_id
GROUP BY e.id, e.title, e.duration_minutes, e.total_marks, t.name
ORDER BY e.id;
"
```

### Check Proctoring Events

```bash
docker-compose exec postgres psql -U exam_user -d exam_db -c "
SELECT 
  event_type,
  severity,
  COUNT(*) as count
FROM proctoring_events
GROUP BY event_type, severity
ORDER BY count DESC;
"
```

---

## 💾 Backup & Restore

### Create Backup

```bash
# Automatic backup with timestamp
bash scripts/export-db.sh

# Manual backup
docker-compose exec postgres pg_dump -U exam_user exam_db > my_backup.sql
```

### Restore from Backup

```bash
# Using import script
bash scripts/import-db.sh my_backup.sql

# Manual restore
cat my_backup.sql | docker-compose exec -T postgres psql -U exam_user exam_db
```

### Schedule Daily Backups (Linux/Mac)

Add to crontab:
```bash
# Backup database daily at 2 AM
0 2 * * * cd /path/to/Online-Examination-Portal && bash scripts/export-db.sh
```

---

## 🔄 Reset Database

### Complete Reset (Deletes All Data)

```bash
# Stop containers
docker-compose down

# Remove database volume
docker volume rm oep_postgres_data

# Restart containers
docker-compose up -d

# Wait 30 seconds for PostgreSQL to initialize

# Re-seed data
docker-compose exec api python -m scripts.seed
docker-compose exec api python -m scripts.seed_ap_iti_demo
```

### Soft Reset (Keep Schema, Clear Data)

```bash
docker-compose exec postgres psql -U exam_user -d exam_db -c "
TRUNCATE 
  trades, centers, users, exams, questions, 
  student_attempts, student_answers, proctoring_events, 
  question_timings, exam_questions, transfers, audit_logs
RESTART IDENTITY CASCADE;
"

# Re-seed
docker-compose exec api python -m scripts.seed
docker-compose exec api python -m scripts.seed_ap_iti_demo
```

---

## 🔍 Troubleshooting

### Issue: "Database does not exist"

```bash
# Create database manually
docker-compose exec postgres createdb -U exam_user exam_db

# Run migrations
docker-compose exec api alembic upgrade head
```

### Issue: "Connection refused"

```bash
# Check PostgreSQL status
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres --tail=50

# Restart PostgreSQL
docker-compose restart postgres
```

### Issue: "Role does not exist"

```bash
# Create user manually
docker-compose exec postgres psql -U postgres -c "
CREATE USER exam_user WITH PASSWORD 'exam_password';
GRANT ALL PRIVILEGES ON DATABASE exam_db TO exam_user;
"
```

### Issue: "Seed script fails"

```bash
# Clear existing data first
docker-compose exec postgres psql -U exam_user -d exam_db -c "
TRUNCATE trades, centers, users CASCADE;
"

# Run seed again
docker-compose exec api python -m scripts.seed_ap_iti_demo
```

---

## 📈 Database Migrations

### View Migration Status

```bash
docker-compose exec api alembic current
```

### View Migration History

```bash
docker-compose exec api alembic history
```

### Run Migrations

```bash
# Upgrade to latest
docker-compose exec api alembic upgrade head

# Upgrade to specific version
docker-compose exec api alembic upgrade <revision>

# Downgrade one version
docker-compose exec api alembic downgrade -1
```

### Create New Migration

```bash
docker-compose exec api alembic revision -m "description of changes"
```

---

## 🔐 Database Security

### Change Database Password

1. Update `docker-compose.yml`:
```yaml
environment:
  - POSTGRES_PASSWORD=new_password
  - DATABASE_URL=postgresql://exam_user:new_password@postgres/exam_db
```

2. Restart containers:
```bash
docker-compose down
docker volume rm oep_postgres_data
docker-compose up -d
```

### Enable SSL (Production)

Add to `docker-compose.yml`:
```yaml
postgres:
  command: >
    postgres
    -c ssl=on
    -c ssl_cert_file=/path/to/cert.pem
    -c ssl_key_file=/path/to/key.pem
```

---

## 📊 Performance Tuning

### Optimize PostgreSQL Settings

Create `postgresql.conf`:
```conf
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
```

### Create Indexes for Performance

```sql
-- Index on hall ticket lookups
CREATE INDEX idx_users_hall_ticket ON users(hall_ticket_number);

-- Index on exam attempts by student
CREATE INDEX idx_attempts_student ON student_attempts(student_id);

-- Index on proctoring events by attempt
CREATE INDEX idx_proctoring_attempt ON proctoring_events(attempt_id);

-- Index on answers by attempt
CREATE INDEX idx_answers_attempt ON student_answers(attempt_id);
```

---

## 📞 Support

For database-related issues:

1. Check logs: `docker-compose logs postgres`
2. Verify connection: `docker-compose exec postgres psql -U exam_user -d exam_db -c "SELECT 1;"`
3. Check disk space: `df -h`
4. Review migrations: `docker-compose exec api alembic current`

---

## ✅ Database Checklist

After setup, verify:

- [ ] PostgreSQL container running (`docker-compose ps`)
- [ ] Database created and accessible
- [ ] Migrations applied (`alembic current`)
- [ ] Base data seeded (admin user exists)
- [ ] Demo data seeded (50 students, 15 trades)
- [ ] Can connect via psql
- [ ] Backup scripts work
- [ ] Import scripts work

---

**Database is the heart of the system. Keep it backed up and secure! 🔐**
