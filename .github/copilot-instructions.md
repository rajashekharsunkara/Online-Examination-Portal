# Exam Platform - Copilot Instructions

## Project Overview
This is a center-based exam platform for conducting secure, offline-resilient examinations with real-time checkpointing, workstation transfers, and encrypted submissions.

## Tech Stack
- **Frontend**: React + TypeScript (Vite)
- **Backend**: FastAPI (Python) with async endpoints
- **Real-time**: WebSockets with Redis pub/sub
- **Database**: PostgreSQL with SQLAlchemy + Alembic
- **Cache**: Redis
- **Workers**: Celery + Redis
- **Storage**: S3-compatible (MinIO for local dev)
- **Container**: Docker + Docker Compose
- **Orchestration**: Kubernetes (production)
- **Testing**: Pytest (backend), Jest + React Testing Library (frontend)

## Key Features
- Student exam-taking with SEB (Safe Exam Browser) lockdown
- Real-time checkpointing every 15 seconds
- Offline resilience with IndexedDB
- Workstation transfer capability
- Encrypted final submissions with Web Crypto
- Hall Authenticator & Technician PWA apps
- Admin dashboard for management

## Development Guidelines
1. Use absolute imports where possible
2. Follow TypeScript strict mode
3. Include comprehensive tests for all new features
4. Add audit logging for critical actions
5. Ensure RBAC on all protected endpoints
6. Use async/await patterns in FastAPI
7. Implement idempotent operations where applicable

## Security Requirements
- JWT authentication for API
- Short-lived tokens for WebSocket connections
- TLS everywhere (self-signed for dev)
- Client-side encryption for final submissions
- Audit logging for all critical operations
- RBAC enforcement

## Code Style
- Python: Follow PEP 8, use Black formatter
- TypeScript: Use ESLint + Prettier
- Max line length: 100 characters
- Use meaningful variable names
- Comment complex logic

## Testing Requirements
- Unit tests for all business logic
- Integration tests for API endpoints
- E2E tests for critical flows
- Load tests for WebSocket scalability
- Minimum 80% code coverage target
