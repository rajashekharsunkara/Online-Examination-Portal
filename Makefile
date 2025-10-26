# Makefile for Exam Platform Development

.PHONY: help dev-up dev-down build test test-api test-web lint migrate seed logs clean gen-keys

# Default target
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "Exam Platform - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

# Development
dev-up: ## Start all services in development mode
	@echo "🚀 Starting all services..."
	docker-compose up -d
	@echo "✅ Services started!"
	@echo ""
	@echo "Access points:"
	@echo "  - API: http://localhost:8000"
	@echo "  - API Docs: http://localhost:8000/docs"
	@echo "  - Web App: http://localhost:5173"
	@echo "  - Admin: http://localhost:5174"
	@echo "  - MinIO: http://localhost:9001"

dev-down: ## Stop all services
	@echo "🛑 Stopping all services..."
	docker-compose down

build: ## Build all Docker images
	@echo "🔨 Building Docker images..."
	docker-compose build

rebuild: ## Rebuild all Docker images without cache
	@echo "🔨 Rebuilding Docker images (no cache)..."
	docker-compose build --no-cache

# Testing
test: test-api test-web ## Run all tests

test-api: ## Run backend tests
	@echo "🧪 Running API tests..."
	docker-compose exec -T api pytest -v --cov=app tests/

test-web: ## Run frontend tests
	@echo "🧪 Running web tests..."
	cd web && npm test -- --run

test-admin: ## Run admin UI tests
	@echo "🧪 Running admin tests..."
	cd admin && npm test -- --run

test-coverage: ## Run tests with coverage report
	@echo "📊 Generating coverage report..."
	docker-compose exec -T api pytest --cov=app --cov-report=html tests/
	@echo "Coverage report generated at api/htmlcov/index.html"

# Linting
lint: lint-api lint-web ## Run all linters

lint-api: ## Lint backend code
	@echo "🔍 Linting API..."
	docker-compose exec -T api black --check app tests
	docker-compose exec -T api flake8 app tests
	docker-compose exec -T api mypy app

lint-web: ## Lint frontend code
	@echo "🔍 Linting web..."
	cd web && npm run lint
	cd admin && npm run lint

format: ## Format all code
	@echo "✨ Formatting code..."
	docker-compose exec -T api black app tests
	cd web && npm run format
	cd admin && npm run format

# Database
migrate: ## Run database migrations
	@echo "📦 Running migrations..."
	docker-compose exec api alembic upgrade head

migrate-create: ## Create new migration (use MSG="description")
	@echo "📝 Creating new migration..."
	docker-compose exec api alembic revision --autogenerate -m "$(MSG)"

migrate-down: ## Rollback last migration
	@echo "⏪ Rolling back migration..."
	docker-compose exec api alembic downgrade -1

migrate-history: ## Show migration history
	docker-compose exec api alembic history

seed: ## Seed database with demo data
	@echo "🌱 Seeding database..."
	docker-compose exec api python scripts/seed.py

db-reset: ## Reset database (WARNING: destroys all data)
	@echo "⚠️  Resetting database..."
	docker-compose down -v
	docker-compose up -d postgres redis
	@sleep 3
	@$(MAKE) migrate
	@$(MAKE) seed

# Logs
logs: ## View logs from all services
	docker-compose logs -f

logs-api: ## View API logs
	docker-compose logs -f api

logs-web: ## View web logs
	docker-compose logs -f web

logs-worker: ## View worker logs
	docker-compose logs -f worker

# Security
gen-keys: ## Generate development encryption keys
	@echo "🔐 Generating development keys..."
	@mkdir -p secrets
	@if [ ! -f secrets/private_key.pem ]; then \
		openssl genrsa -out secrets/private_key.pem 4096; \
		openssl rsa -in secrets/private_key.pem -pubout -out secrets/public_key.pem; \
		echo "✅ Keys generated in ./secrets/"; \
	else \
		echo "⚠️  Keys already exist. Delete ./secrets/*.pem to regenerate."; \
	fi

# Utilities
shell-api: ## Open shell in API container
	docker-compose exec api bash

shell-db: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U exam_user -d exam_db

shell-redis: ## Open Redis CLI
	docker-compose exec redis redis-cli

clean: ## Clean up containers, volumes, and build artifacts
	@echo "🧹 Cleaning up..."
	docker-compose down -v
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@echo "✅ Cleanup complete"

ps: ## Show running containers
	docker-compose ps

restart: ## Restart all services
	@echo "🔄 Restarting services..."
	docker-compose restart

# Installation
install-deps: ## Install all dependencies
	@echo "📦 Installing dependencies..."
	cd web && npm install
	cd admin && npm install
	cd hall-auth && npm install
	cd technician && npm install

# Production
prod-build: ## Build production images
	@echo "🏗️  Building production images..."
	docker-compose -f docker-compose.prod.yml build

prod-up: ## Start production stack
	@echo "🚀 Starting production stack..."
	docker-compose -f docker-compose.prod.yml up -d

# Monitoring
monitoring-up: ## Start monitoring stack (Prometheus, Grafana)
	@echo "📊 Starting monitoring stack..."
	docker-compose -f docker-compose.monitoring.yml up -d
	@echo "Access Grafana at http://localhost:3000"

monitoring-down: ## Stop monitoring stack
	docker-compose -f docker-compose.monitoring.yml down

# Load Testing
load-test: ## Run load tests
	@echo "⚡ Running load tests..."
	cd tests/load && npm install && npm run load-test

# Documentation
docs-serve: ## Serve documentation locally
	@echo "📚 Serving documentation..."
	@command -v mkdocs >/dev/null 2>&1 || { echo "mkdocs not installed. Install with: pip install mkdocs"; exit 1; }
	mkdocs serve

# Health Check
health: ## Check health of all services
	@echo "🏥 Checking service health..."
	@curl -s http://localhost:8000/health | jq . || echo "API not responding"
	@docker-compose exec -T postgres pg_isready || echo "PostgreSQL not ready"
	@docker-compose exec -T redis redis-cli ping || echo "Redis not responding"

# Quick commands
up: dev-up ## Alias for dev-up
down: dev-down ## Alias for dev-down
