#!/bin/bash
# Database Import Script
# Imports a SQL file into the database

set -e

if [ -z "$1" ]; then
    echo "❌ Error: No backup file specified"
    echo ""
    echo "Usage: bash scripts/import-db.sh <backup_file.sql>"
    echo ""
    echo "Example:"
    echo "  bash scripts/import-db.sh db_backup_20251027_000000.sql"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

echo "🗄️  Database Import Script"
echo "========================================"
echo "📂 Source: ${BACKUP_FILE}"
echo ""

# Confirm before proceeding
read -p "⚠️  This will OVERWRITE the current database. Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Import cancelled."
    exit 0
fi

echo ""
echo "📥 Importing database..."

# Import database
cat "${BACKUP_FILE}" | docker-compose exec -T postgres psql -U exam_user exam_db

echo ""
echo "✅ Database imported successfully!"
echo ""
echo "📊 Verify data:"
docker-compose exec postgres psql -U exam_user -d exam_db -c "
SELECT 
  (SELECT COUNT(*) FROM trades) as trades,
  (SELECT COUNT(*) FROM centers) as centers,
  (SELECT COUNT(*) FROM users WHERE hall_ticket_number IS NOT NULL) as students,
  (SELECT COUNT(*) FROM exams) as exams,
  (SELECT COUNT(*) FROM questions) as questions,
  (SELECT COUNT(*) FROM student_attempts) as attempts;
"
