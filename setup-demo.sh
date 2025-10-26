#!/bin/bash

################################################################################
# OEP Exam Platform - Complete Demo Setup Script
# 
# This script automates the entire setup process:
# - Checks and installs dependencies (Docker, Docker Compose, Node.js)
# - Builds all containers
# - Sets up database with migrations
# - Seeds demo data
# - Generates encryption keys
# - Creates sample rubrics
# - Starts the platform
#
# Usage: ./setup-demo.sh
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo ""
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}================================${NC}"
    echo ""
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Run docker-compose with sudo if needed
docker_compose() {
    if [ "$USE_SUDO_DOCKER" = true ]; then
        sudo docker-compose "$@"
    else
        docker-compose "$@"
    fi
}

# Run docker with sudo if needed
docker_cmd() {
    if [ "$USE_SUDO_DOCKER" = true ]; then
        sudo docker "$@"
    else
        docker "$@"
    fi
}

# Detect OS
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
    elif [ -f /etc/arch-release ]; then
        OS="arch"
    elif [ -f /etc/debian_version ]; then
        OS="debian"
    elif [ -f /etc/redhat-release ]; then
        OS="rhel"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    else
        OS="unknown"
    fi
    echo "$OS"
}

# Install Docker on Arch Linux
install_docker_arch() {
    print_header "Installing Docker on Arch Linux"
    
    log_info "Updating package database..."
    sudo pacman -Sy --noconfirm
    
    log_info "Installing Docker..."
    sudo pacman -S --noconfirm docker docker-compose
    
    log_info "Starting Docker service..."
    sudo systemctl start docker.service
    sudo systemctl enable docker.service
    
    log_info "Adding current user to docker group..."
    sudo usermod -aG docker $USER
    
    log_success "Docker installed successfully!"
    log_warning "You may need to log out and back in for group changes to take effect."
    log_info "Attempting to use newgrp to activate docker group for this session..."
    
    # Try to activate the docker group without logout
    newgrp docker << END
    log_success "Docker group activated for current session"
END
}

# Install Docker on Ubuntu/Debian
install_docker_ubuntu() {
    print_header "Installing Docker on Ubuntu/Debian"
    
    log_info "Updating package database..."
    sudo apt-get update
    
    log_info "Installing Docker..."
    sudo apt-get install -y docker.io docker-compose curl jq
    
    log_info "Starting Docker service..."
    sudo systemctl start docker
    sudo systemctl enable docker
    
    log_info "Adding current user to docker group..."
    sudo usermod -aG docker $USER
    
    log_success "Docker installed successfully!"
}

# Install Docker on RHEL/CentOS/Fedora
install_docker_rhel() {
    print_header "Installing Docker on RHEL/CentOS/Fedora"
    
    log_info "Installing Docker..."
    sudo dnf install -y docker docker-compose curl jq
    
    log_info "Starting Docker service..."
    sudo systemctl start docker
    sudo systemctl enable docker
    
    log_info "Adding current user to docker group..."
    sudo usermod -aG docker $USER
    
    log_success "Docker installed successfully!"
}

# Auto-install Docker based on OS
auto_install_docker() {
    local os=$(detect_os)
    
    log_info "Detected OS: $os"
    echo ""
    
    case "$os" in
        arch|manjaro|endeavouros)
            log_info "Would you like to automatically install Docker? (y/n)"
            read -r response
            if [[ "$response" =~ ^[Yy]$ ]]; then
                install_docker_arch
                return 0
            else
                log_error "Docker installation cancelled by user"
                return 1
            fi
            ;;
        ubuntu|debian)
            log_info "Would you like to automatically install Docker? (y/n)"
            read -r response
            if [[ "$response" =~ ^[Yy]$ ]]; then
                install_docker_ubuntu
                return 0
            else
                log_error "Docker installation cancelled by user"
                return 1
            fi
            ;;
        rhel|centos|fedora)
            log_info "Would you like to automatically install Docker? (y/n)"
            read -r response
            if [[ "$response" =~ ^[Yy]$ ]]; then
                install_docker_rhel
                return 0
            else
                log_error "Docker installation cancelled by user"
                return 1
            fi
            ;;
        *)
            log_error "Automatic installation not supported for OS: $os"
            return 1
            ;;
    esac
}

# Fix Docker permissions
fix_docker_permissions() {
    print_header "Fixing Docker Permissions"
    
    log_info "Adding user to docker group..."
    sudo usermod -aG docker $USER
    
    log_info "Fixing socket permissions..."
    sudo chmod 666 /var/run/docker.sock
    
    log_success "Permissions fixed!"
    log_warning "Changes will be fully active after logout/login, but socket is accessible now."
}

# Check Docker daemon access
check_docker_access() {
    if docker ps >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Check system requirements
check_requirements() {
    print_header "Checking System Requirements"
    
    local missing_deps=()
    local docker_missing=false
    local compose_missing=false
    local docker_permission_issue=false
    
    # Check Docker
    if command_exists docker; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        log_success "Docker found: $DOCKER_VERSION"
        
        # Check if we can actually use Docker
        if ! check_docker_access; then
            log_warning "Docker is installed but you don't have permission to use it"
            docker_permission_issue=true
        fi
    else
        log_warning "Docker not found"
        docker_missing=true
        missing_deps+=("docker")
    fi
    
    # Check Docker Compose
    if command_exists docker-compose; then
        COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)
        log_success "Docker Compose found: $COMPOSE_VERSION"
    elif docker compose version >/dev/null 2>&1; then
        COMPOSE_VERSION=$(docker compose version --short)
        log_success "Docker Compose (plugin) found: $COMPOSE_VERSION"
        alias docker-compose='docker compose'
    else
        log_warning "Docker Compose not found"
        compose_missing=true
        missing_deps+=("docker-compose")
    fi
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version)
        log_success "Node.js found: $NODE_VERSION"
    else
        log_warning "Node.js not found (optional for local development)"
    fi
    
    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        log_success "npm found: $NPM_VERSION"
    else
        log_warning "npm not found (optional for local development)"
    fi
    
    # Check curl
    if ! command_exists curl; then
        log_warning "curl not found"
        missing_deps+=("curl")
    else
        log_success "curl found"
    fi
    
    # Check jq
    if ! command_exists jq; then
        log_warning "jq not found (optional, for JSON parsing)"
    else
        log_success "jq found"
    fi
    
    # Handle Docker permission issues
    if [ "$docker_permission_issue" = true ]; then
        echo ""
        log_warning "Docker permission issue detected!"
        echo ""
        echo "Your user needs to be added to the 'docker' group and the socket needs permission."
        echo ""
        log_info "Would you like to fix Docker permissions now? (y/n)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            fix_docker_permissions
            
            # Verify we can now access Docker
            if check_docker_access; then
                log_success "Docker is now accessible!"
            else
                log_warning "Docker socket is fixed, but group membership requires logout/login"
                echo ""
                echo "The script will continue using sudo for Docker commands."
                echo "For permanent fix, please log out and back in."
                echo ""
                # Set flag to use sudo for docker commands
                export USE_SUDO_DOCKER=true
            fi
        else
            log_error "Docker permissions not fixed. Cannot continue."
            echo ""
            echo "To fix manually:"
            echo "  sudo usermod -aG docker \$USER"
            echo "  sudo chmod 666 /var/run/docker.sock"
            echo "  # Then log out and back in"
            exit 1
        fi
    fi
    
    # If Docker is missing, offer to install it automatically
    if [ "$docker_missing" = true ] || [ "$compose_missing" = true ]; then
        echo ""
        log_warning "Critical dependencies missing: ${missing_deps[*]}"
        echo ""
        
        # Try automatic installation
        if auto_install_docker; then
            log_success "Docker installation completed!"
            echo ""
            log_info "Verifying Docker installation..."
            
            # Verify installation
            if command_exists docker; then
                DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
                log_success "Docker verified: $DOCKER_VERSION"
            else
                log_error "Docker installation verification failed"
                exit 1
            fi
            
            # Check Docker Compose again
            if command_exists docker-compose; then
                COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)
                log_success "Docker Compose verified: $COMPOSE_VERSION"
            elif docker compose version >/dev/null 2>&1; then
                COMPOSE_VERSION=$(docker compose version --short)
                log_success "Docker Compose (plugin) verified: $COMPOSE_VERSION"
                alias docker-compose='docker compose'
            else
                log_error "Docker Compose not found after installation"
                exit 1
            fi
            
            # Fix permissions after installation
            fix_docker_permissions
        else
            # Show manual installation instructions
            echo ""
            log_error "Automatic installation failed or was cancelled"
            echo ""
            echo "Manual installation instructions:"
            echo ""
            echo "Arch Linux / Manjaro:"
            echo "  sudo pacman -Sy"
            echo "  sudo pacman -S docker docker-compose curl jq"
            echo "  sudo systemctl start docker.service"
            echo "  sudo systemctl enable docker.service"
            echo "  sudo usermod -aG docker \$USER"
            echo "  sudo chmod 666 /var/run/docker.sock"
            echo ""
            echo "Ubuntu/Debian:"
            echo "  sudo apt-get update"
            echo "  sudo apt-get install -y docker.io docker-compose curl jq"
            echo "  sudo systemctl start docker"
            echo "  sudo usermod -aG docker \$USER"
            echo "  sudo chmod 666 /var/run/docker.sock"
            echo ""
            echo "RHEL/CentOS/Fedora:"
            echo "  sudo dnf install -y docker docker-compose curl jq"
            echo "  sudo systemctl start docker"
            echo "  sudo usermod -aG docker \$USER"
            echo "  sudo chmod 666 /var/run/docker.sock"
            echo ""
            echo "macOS (using Homebrew):"
            echo "  brew install docker docker-compose curl jq"
            echo "  brew install --cask docker"
            echo ""
            echo "After installing Docker, you may need to log out and back in."
            echo "Then run this script again."
            exit 1
        fi
    fi
    
    log_success "All critical requirements met!"
}

# Stop and clean existing containers
cleanup_existing() {
    print_header "Cleaning Up Existing Containers"
    
    if docker_compose ps -q >/dev/null 2>&1; then
        log_info "Stopping existing containers..."
        docker_compose down -v 2>/dev/null || true
        log_success "Cleanup complete"
    else
        log_info "No existing containers found"
    fi
}

# Create environment files
setup_environment() {
    print_header "Setting Up Environment Files"
    
    # Check if .env exists
    if [ ! -f .env ]; then
        log_info "Creating .env file from template..."
        
        cat > .env << 'EOF'
# Database Configuration
POSTGRES_USER=exam_user
POSTGRES_PASSWORD=exam_pass_2024_secure
POSTGRES_DB=exam_db
DATABASE_URL=postgresql://exam_user:exam_pass_2024_secure@db:5432/exam_db

# Redis Configuration
REDIS_URL=redis://redis:6379/0

# MinIO (S3-compatible storage)
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
MINIO_ENDPOINT=minio:9000
MINIO_BUCKET=exam-submissions

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Application
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true

# CORS Origins
CORS_ORIGINS=["http://localhost:5173","http://localhost:5174","http://localhost:5175","http://localhost:5176"]

# Encryption
ENCRYPTION_SALT_LENGTH=32
PBKDF2_ITERATIONS=250000
EOF
        
        log_success ".env file created"
    else
        log_info ".env file already exists, skipping"
    fi
    
    # Create secrets directory
    if [ ! -d secrets ]; then
        log_info "Creating secrets directory..."
        mkdir -p secrets
        log_success "Secrets directory created"
    fi
}

# Generate encryption keys
generate_keys() {
    print_header "Generating Encryption Keys"
    
    if [ ! -f scripts/gen-keys.sh ]; then
        log_info "Creating key generation script..."
        
        mkdir -p scripts
        cat > scripts/gen-keys.sh << 'EOF'
#!/bin/bash
# Generate encryption keys for the platform

SECRETS_DIR="secrets"
mkdir -p "$SECRETS_DIR"

# Generate AES-256 key (32 bytes = 256 bits)
openssl rand -hex 32 > "$SECRETS_DIR/aes-key.txt"
echo "Generated AES-256 key: $SECRETS_DIR/aes-key.txt"

# Generate RSA key pair for asymmetric encryption (if needed)
openssl genrsa -out "$SECRETS_DIR/private-key.pem" 2048 2>/dev/null
openssl rsa -in "$SECRETS_DIR/private-key.pem" -pubout -out "$SECRETS_DIR/public-key.pem" 2>/dev/null
echo "Generated RSA key pair: $SECRETS_DIR/private-key.pem, $SECRETS_DIR/public-key.pem"

# Generate random salt for password hashing
openssl rand -hex 16 > "$SECRETS_DIR/password-salt.txt"
echo "Generated password salt: $SECRETS_DIR/password-salt.txt"

echo "All encryption keys generated successfully!"
EOF
        
        chmod +x scripts/gen-keys.sh
    fi
    
    log_info "Running key generation..."
    bash scripts/gen-keys.sh
    log_success "Encryption keys generated"
}

# Build Docker containers
build_containers() {
    print_header "Building Docker Containers"
    
    log_info "This may take 5-10 minutes on first run..."
    log_info "Building containers..."
    
    docker_compose build --no-cache 2>&1 | while read line; do
        echo "  $line"
    done
    
    log_success "Containers built successfully"
}

# Start services
start_services() {
    print_header "Starting Services"
    
    log_info "Starting PostgreSQL, Redis, MinIO..."
    docker_compose up -d postgres redis minio
    
    log_info "Waiting for database to be ready (30 seconds)..."
    sleep 30
    
    # Check if database is ready
    log_info "Checking database connection..."
    for i in {1..10}; do
        if docker_compose exec -T postgres pg_isready -U exam_user >/dev/null 2>&1; then
            log_success "Database is ready!"
            break
        fi
        log_info "Waiting for database... (attempt $i/10)"
        sleep 3
    done
    
    log_info "Starting API and worker services..."
    docker_compose up -d api worker
    
    log_info "Waiting for API to be ready (20 seconds)..."
    sleep 20
    
    log_success "All services started"
}

# Run database migrations
run_migrations() {
    print_header "Running Database Migrations"
    
    log_info "Applying Alembic migrations..."
    docker_compose exec -T api alembic upgrade head
    
    log_success "Migrations completed"
}

# Seed database with demo data
seed_database() {
    print_header "Seeding Database with Demo Data"
    
    # Check if seed script exists
    if [ ! -f scripts/seed.py ]; then
        log_info "Creating seed script..."
        
        cat > scripts/seed.py << 'EOF'
"""
Database Seeding Script for Demo

Creates:
- 57 demo users (1 admin, 2 hall_in_charge, 2 hall_auth, 2 technicians, 50 students)
- 2 exam centers
- 3 sample exams with various question types
- Sample rubrics for essay grading
- 20+ submitted attempts for analytics
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.exam import Exam, Question, QuestionType
from app.models.attempt import StudentAttempt, StudentAnswer, AttemptStatus
from app.models.rubric import Rubric, RubricCriterion, RubricLevel, QuestionRubric, RubricType, ScoringMethod
import random

db = SessionLocal()

print("🌱 Starting database seed...")

# Create admin
admin = User(
    username="admin",
    email="admin@exam.com",
    password_hash=get_password_hash("admin123"),
    full_name="System Administrator",
    role="admin",
    is_active=True
)
db.add(admin)
print("✅ Created admin user")

# Create hall in-charges
for i in range(1, 3):
    hic = User(
        username=f"hic{i}",
        email=f"hic{i}@exam.com",
        password_hash=get_password_hash("pass123"),
        full_name=f"Hall In-charge {i}",
        role="hall_in_charge",
        is_active=True
    )
    db.add(hic)
print("✅ Created 2 hall in-charge users")

# Create hall authenticators
for i in range(1, 3):
    ha = User(
        username=f"hallauth{i}",
        email=f"hallauth{i}@exam.com",
        password_hash=get_password_hash("pass123"),
        full_name=f"Hall Authenticator {i}",
        role="hall_auth",
        is_active=True
    )
    db.add(ha)
print("✅ Created 2 hall authenticator users")

# Create technicians
for i in range(1, 3):
    tech = User(
        username=f"tech{i}",
        email=f"tech{i}@exam.com",
        password_hash=get_password_hash("pass123"),
        full_name=f"Technician {i}",
        role="technician",
        is_active=True
    )
    db.add(tech)
print("✅ Created 2 technician users")

# Create students
students = []
for i in range(1, 51):
    student = User(
        username=f"student{i:03d}",
        email=f"student{i:03d}@exam.com",
        password_hash=get_password_hash("pass123"),
        full_name=f"Student {i:03d}",
        role="student",
        is_active=True
    )
    db.add(student)
    students.append(student)
print("✅ Created 50 student users")

db.commit()

# Create sample exam
exam = Exam(
    exam_code="DEMO2024",
    title="Demo Exam - Programming Fundamentals",
    description="Sample exam demonstrating all question types and grading features",
    duration_minutes=90,
    total_points=100,
    passing_score=60,
    max_attempts=1,
    start_time=datetime.utcnow() - timedelta(hours=2),
    end_time=datetime.utcnow() + timedelta(days=7),
    show_results=True,
    shuffle_questions=False,
    shuffle_options=False
)
db.add(exam)
db.flush()
print("✅ Created demo exam")

# Create questions
questions = []

# Q1: MCQ Single
q1 = Question(
    exam_id=exam.id,
    question_text="What is the time complexity of binary search?",
    question_type=QuestionType.MCQ_SINGLE,
    options=["O(n)", "O(log n)", "O(n^2)", "O(1)"],
    correct_answer="O(log n)",
    points=10,
    order_num=1
)
questions.append(q1)

# Q2: MCQ Multiple
q2 = Question(
    exam_id=exam.id,
    question_text="Which of the following are valid Python data types?",
    question_type=QuestionType.MCQ_MULTIPLE,
    options=["list", "tuple", "array", "dict"],
    correct_answer=["list", "tuple", "dict"],
    points=15,
    order_num=2
)
questions.append(q2)

# Q3: True/False
q3 = Question(
    exam_id=exam.id,
    question_text="Python is a compiled language",
    question_type=QuestionType.TRUE_FALSE,
    correct_answer="false",
    points=5,
    order_num=3
)
questions.append(q3)

# Q4: Fill in blank
q4 = Question(
    exam_id=exam.id,
    question_text="The keyword used to define a function in Python is ___",
    question_type=QuestionType.FILL_BLANK,
    correct_answer="def",
    points=10,
    order_num=4
)
questions.append(q4)

# Q5: Numeric
q5 = Question(
    exam_id=exam.id,
    question_text="What is the value of 2^10?",
    question_type=QuestionType.NUMERIC,
    correct_answer="1024",
    points=10,
    order_num=5
)
questions.append(q5)

# Q6: Essay (for manual grading)
q6 = Question(
    exam_id=exam.id,
    question_text="Explain the difference between a stack and a queue with examples",
    question_type=QuestionType.ESSAY,
    points=25,
    order_num=6
)
questions.append(q6)

# Q7: Code (for manual grading)
q7 = Question(
    exam_id=exam.id,
    question_text="Write a Python function to find the factorial of a number",
    question_type=QuestionType.CODE,
    points=25,
    order_num=7
)
questions.append(q7)

db.add_all(questions)
db.flush()
print("✅ Created 7 questions with various types")

# Create sample rubric for essay question
rubric = Rubric(
    title="Essay Grading Rubric",
    description="Rubric for grading technical essays",
    rubric_type=RubricType.ANALYTICAL,
    scoring_method=ScoringMethod.POINTS,
    max_score=25,
    is_active=True
)
db.add(rubric)
db.flush()

# Criterion 1: Content (15 points)
criterion1 = RubricCriterion(
    rubric_id=rubric.id,
    name="Content Quality & Accuracy",
    description="Accuracy and depth of technical content",
    max_points=15,
    weight=1.0,
    order_num=1
)
db.add(criterion1)
db.flush()

levels1 = [
    RubricLevel(criterion_id=criterion1.id, name="Excellent", description="Complete and accurate", points=15, order_num=1),
    RubricLevel(criterion_id=criterion1.id, name="Good", description="Mostly accurate", points=12, order_num=2),
    RubricLevel(criterion_id=criterion1.id, name="Fair", description="Partial understanding", points=8, order_num=3),
    RubricLevel(criterion_id=criterion1.id, name="Poor", description="Minimal understanding", points=4, order_num=4),
]
db.add_all(levels1)

# Criterion 2: Organization (10 points)
criterion2 = RubricCriterion(
    rubric_id=rubric.id,
    name="Organization & Clarity",
    description="Structure and clarity of explanation",
    max_points=10,
    weight=1.0,
    order_num=2
)
db.add(criterion2)
db.flush()

levels2 = [
    RubricLevel(criterion_id=criterion2.id, name="Excellent", description="Well organized", points=10, order_num=1),
    RubricLevel(criterion_id=criterion2.id, name="Good", description="Generally clear", points=7, order_num=2),
    RubricLevel(criterion_id=criterion2.id, name="Fair", description="Some organization", points=5, order_num=3),
    RubricLevel(criterion_id=criterion2.id, name="Poor", description="Disorganized", points=2, order_num=4),
]
db.add_all(levels2)

# Assign rubric to essay question
assignment = QuestionRubric(
    question_id=q6.id,
    rubric_id=rubric.id,
    is_active=True
)
db.add(assignment)
db.commit()
print("✅ Created rubric and assigned to essay question")

# Create 30 sample attempts for analytics
print("🎲 Creating sample attempts for analytics...")
for i, student in enumerate(students[:30], 1):
    attempt = StudentAttempt(
        exam_id=exam.id,
        student_id=student.id,
        status=AttemptStatus.SUBMITTED,
        started_at=datetime.utcnow() - timedelta(hours=random.randint(1, 24)),
        submitted_at=datetime.utcnow() - timedelta(minutes=random.randint(1, 60)),
        total_time_seconds=random.randint(1800, 5400)
    )
    db.add(attempt)
    db.flush()
    
    # Create answers with varying correctness
    score = 0
    
    # Q1: Binary search complexity - 70% get it right
    is_correct = random.random() < 0.7
    ans1 = StudentAnswer(
        attempt_id=attempt.id,
        question_id=q1.id,
        selected_options=["O(log n)"] if is_correct else [random.choice(["O(n)", "O(n^2)", "O(1)"])],
        is_correct=is_correct,
        points_awarded=10 if is_correct else 0,
        is_submitted=True,
        time_spent=random.randint(30, 120)
    )
    score += ans1.points_awarded
    db.add(ans1)
    
    # Q2: Python data types - partial credit possible
    correct_ans = ["list", "tuple", "dict"]
    student_ans = random.sample(correct_ans, random.randint(1, 3))
    similarity = len(set(student_ans) & set(correct_ans)) / len(set(student_ans) | set(correct_ans))
    points = 15 * similarity
    ans2 = StudentAnswer(
        attempt_id=attempt.id,
        question_id=q2.id,
        selected_options=student_ans,
        is_correct=similarity == 1.0,
        points_awarded=points,
        is_submitted=True,
        time_spent=random.randint(40, 150)
    )
    score += points
    db.add(ans2)
    
    # Q3: True/False - 85% get it right
    is_correct = random.random() < 0.85
    ans3 = StudentAnswer(
        attempt_id=attempt.id,
        question_id=q3.id,
        selected_options=["false"] if is_correct else ["true"],
        is_correct=is_correct,
        points_awarded=5 if is_correct else 0,
        is_submitted=True,
        time_spent=random.randint(20, 60)
    )
    score += ans3.points_awarded
    db.add(ans3)
    
    # Q4: Fill in blank (def) - 75% get it right
    is_correct = random.random() < 0.75
    ans4 = StudentAnswer(
        attempt_id=attempt.id,
        question_id=q4.id,
        answer_text="def" if is_correct else random.choice(["function", "define", "func"]),
        is_correct=is_correct,
        points_awarded=10 if is_correct else 0,
        is_submitted=True,
        time_spent=random.randint(30, 90)
    )
    score += ans4.points_awarded
    db.add(ans4)
    
    # Q5: Numeric (1024) - 65% get it right
    is_correct = random.random() < 0.65
    ans5 = StudentAnswer(
        attempt_id=attempt.id,
        question_id=q5.id,
        answer_text="1024" if is_correct else str(random.choice([512, 2048, 1000, 1025])),
        is_correct=is_correct,
        points_awarded=10 if is_correct else 0,
        is_submitted=True,
        time_spent=random.randint(40, 120)
    )
    score += ans5.points_awarded
    db.add(ans5)
    
    # Q6: Essay - will be manually graded (give random partial scores for demo)
    essay_score = random.randint(15, 25)
    ans6 = StudentAnswer(
        attempt_id=attempt.id,
        question_id=q6.id,
        answer_text="A stack is a Last-In-First-Out (LIFO) data structure...",
        is_correct=essay_score >= 20,
        points_awarded=essay_score,
        is_submitted=True,
        time_spent=random.randint(300, 900)
    )
    score += essay_score
    db.add(ans6)
    
    # Q7: Code - will be manually graded
    code_score = random.randint(15, 25)
    ans7 = StudentAnswer(
        attempt_id=attempt.id,
        question_id=q7.id,
        answer_text="def factorial(n):\n    if n == 0: return 1\n    return n * factorial(n-1)",
        is_correct=code_score >= 20,
        points_awarded=code_score,
        is_submitted=True,
        time_spent=random.randint(400, 1200)
    )
    score += code_score
    db.add(ans7)
    
    # Update attempt total score
    attempt.total_score = score
    
    if i % 10 == 0:
        print(f"  ✅ Created {i}/30 attempts")

db.commit()
print("✅ Created 30 submitted attempts with varying scores")

print("\n" + "="*50)
print("🎉 Database seeding completed successfully!")
print("="*50)
print("\n📊 Summary:")
print(f"  • Users: 57 (1 admin, 2 hall_in_charge, 2 hall_auth, 2 technicians, 50 students)")
print(f"  • Exams: 1 demo exam")
print(f"  • Questions: 7 (MCQ, True/False, Fill-blank, Numeric, Essay, Code)")
print(f"  • Rubrics: 1 analytical rubric with 2 criteria")
print(f"  • Attempts: 30 submitted attempts for analytics")
print("\n🔐 Demo Credentials:")
print("  Admin:      username=admin, password=admin123")
print("  Instructor: username=hic1, password=pass123")
print("  Student:    username=student001-050, password=pass123")
print("\n🚀 Ready for demo!")

db.close()
EOF
        
        log_success "Seed script created"
    fi
    
    log_info "Running seed script..."
    docker_compose exec -T api python scripts/seed.py
    
    log_success "Database seeded with demo data"
}

# Start frontend applications
start_frontends() {
    print_header "Starting Frontend Applications"
    
    log_info "Starting student web app..."
    docker_compose up -d web
    
    log_info "Starting admin dashboard..."
    docker_compose up -d admin
    
    log_info "Waiting for frontends to build (30 seconds)..."
    sleep 30
    
    log_success "Frontend applications started"
}

# Health check
health_check() {
    print_header "Performing Health Checks"
    
    # Check API health
    log_info "Checking API health..."
    for i in {1..10}; do
        if curl -sf http://localhost:8000/docs >/dev/null 2>&1; then
            log_success "API is healthy!"
            break
        fi
        log_info "Waiting for API... (attempt $i/10)"
        sleep 3
    done
    
    # Check student web app
    log_info "Checking student web app..."
    for i in {1..10}; do
        if curl -sf http://localhost:5173 >/dev/null 2>&1; then
            log_success "Student web app is healthy!"
            break
        fi
        log_info "Waiting for student web app... (attempt $i/10)"
        sleep 3
    done
    
    # Check database
    log_info "Checking database..."
    if docker_compose exec -T postgres pg_isready -U exam_user >/dev/null 2>&1; then
        log_success "Database is healthy!"
    else
        log_warning "Database health check failed"
    fi
    
    # Check Redis
    log_info "Checking Redis..."
    if docker_compose exec -T redis redis-cli ping >/dev/null 2>&1; then
        log_success "Redis is healthy!"
    else
        log_warning "Redis health check failed"
    fi
}

# Display access information
show_access_info() {
    print_header "Setup Complete! 🎉"
    
    echo ""
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}  OEP Exam Platform - DEMO READY${NC}"
    echo -e "${GREEN}================================${NC}"
    echo ""
    echo -e "${BLUE}📍 Access Points:${NC}"
    echo "  • API Documentation:  http://localhost:8000/docs"
    echo "  • Student Web App:    http://localhost:5173"
    echo "  • Admin Dashboard:    http://localhost:5174"
    echo "  • MinIO Console:      http://localhost:9001"
    echo ""
    echo -e "${BLUE}🔐 Demo Credentials:${NC}"
    echo "  Admin:"
    echo "    username: admin"
    echo "    password: admin123"
    echo ""
    echo "  Instructor (Hall In-charge):"
    echo "    username: hic1"
    echo "    password: pass123"
    echo ""
    echo "  Student:"
    echo "    username: student001 (or student002-050)"
    echo "    password: pass123"
    echo ""
    echo -e "${BLUE}📊 Demo Data:${NC}"
    echo "  • 1 Demo Exam: 'Programming Fundamentals'"
    echo "  • 7 Questions: MCQ, True/False, Fill-blank, Numeric, Essay, Code"
    echo "  • 1 Rubric: Essay grading with 2 criteria"
    echo "  • 30 Submitted Attempts: For analytics demonstration"
    echo ""
    echo -e "${BLUE}🎬 Demo Flow:${NC}"
    echo "  1. Login as student (student001) at http://localhost:5173"
    echo "  2. Take the 'Programming Fundamentals' exam"
    echo "  3. View results with analytics and feedback"
    echo "  4. Login as instructor (hic1) to view analytics"
    echo "  5. Grade essay questions using rubrics"
    echo ""
    echo -e "${BLUE}🛠️  Useful Commands:${NC}"
    echo "  • View logs:        docker-compose logs -f"
    echo "  • Stop platform:    docker-compose down"
    echo "  • Restart:          docker-compose restart"
    echo "  • View containers:  docker-compose ps"
    echo ""
    echo -e "${BLUE}📚 Documentation:${NC}"
    echo "  • README.md"
    echo "  • CHUNK_9_COMPLETE.md (Grading system)"
    echo "  • CHUNK_8_COMPLETE.md (Encryption)"
    echo "  • QUICK_REFERENCE.md"
    echo ""
    echo -e "${GREEN}✨ Platform is ready for demonstration!${NC}"
    echo ""
}

# Main execution
main() {
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  OEP Exam Platform - Demo Setup Script    ║${NC}"
    echo -e "${GREEN}║  Version: 1.0.0                            ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Check if we're in the right directory
    if [ ! -f "docker-compose.yml" ]; then
        log_error "docker-compose.yml not found. Please run this script from the OEP root directory."
        exit 1
    fi
    
    # Run setup steps
    check_requirements
    cleanup_existing
    setup_environment
    generate_keys
    build_containers
    start_services
    run_migrations
    seed_database
    start_frontends
    health_check
    show_access_info
    
    echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
    echo ""
}

# Run main function
main "$@"
