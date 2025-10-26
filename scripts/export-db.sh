#!/bin/bash
# Database Export Script
# Exports the current database to a SQL file

set -e

echo "🗄️  Database Export Script"
echo "========================================"

# Get timestamp for filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="db_backup_${TIMESTAMP}.sql"

echo "📦 Exporting database to: ${BACKUP_FILE}"

# Export database using pg_dump
docker-compose exec -T postgres pg_dump -U exam_user exam_db > "${BACKUP_FILE}"

echo "✅ Database exported successfully!"
echo ""
echo "📊 Backup Statistics:"
wc -l "${BACKUP_FILE}"
du -h "${BACKUP_FILE}"
echo ""
echo "📍 Location: $(pwd)/${BACKUP_FILE}"
echo ""
echo "To restore this backup:"
echo "  cat ${BACKUP_FILE} | docker-compose exec -T postgres psql -U exam_user exam_db"
