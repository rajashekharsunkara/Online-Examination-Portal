#!/bin/bash

################################################################################
# OEP Exam Platform - Quick Start (Docker-based)
# 
# Prerequisites: Docker and Docker Compose installed
# Usage: ./quick-start.sh
################################################################################

set -e

echo "🚀 Starting OEP Exam Platform..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Start services
echo -e "${BLUE}[1/5]${NC} Starting Docker containers..."
docker-compose up -d --build

# 2. Wait for database
echo -e "${BLUE}[2/5]${NC} Waiting for database to be ready..."
sleep 30

# 3. Run migrations
echo -e "${BLUE}[3/5]${NC} Running database migrations..."
docker-compose exec -T api alembic upgrade head

# 4. Seed database
echo -e "${BLUE}[4/5]${NC} Seeding database with demo data..."
docker-compose exec -T api python scripts/seed.py

# 5. Health check
echo -e "${BLUE}[5/5]${NC} Performing health checks..."
sleep 10

echo ""
echo -e "${GREEN}✅ Platform is ready!${NC}"
echo ""
echo "📍 Access Points:"
echo "  • API Docs:     http://localhost:8000/docs"
echo "  • Student App:  http://localhost:5173"
echo "  • Admin Panel:  http://localhost:5174"
echo ""
echo "🔐 Login as:"
echo "  Admin:     admin / admin123"
echo "  Student:   student001 / pass123"
echo ""
echo "📊 View logs: docker-compose logs -f"
echo "🛑 Stop:      docker-compose down"
echo ""
