"""
Test configuration and fixtures
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models.user import User, Role, Center

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create test client with database override"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_roles(db_session):
    """Create test roles"""
    roles_data = [
        {"name": "admin", "description": "Administrator"},
        {"name": "student", "description": "Student"},
        {"name": "hall_auth", "description": "Hall Authenticator"},
        {"name": "technician", "description": "Technician"},
        {"name": "hall_in_charge", "description": "Hall In-charge"},
    ]
    
    roles = []
    for role_data in roles_data:
        role = Role(**role_data)
        db_session.add(role)
        roles.append(role)
    
    db_session.commit()
    return roles


@pytest.fixture
def test_center(db_session):
    """Create test center"""
    center = Center(
        name="Test Center 1",
        code="TC001",
        city="Mumbai",
        state="Maharashtra"
    )
    db_session.add(center)
    db_session.commit()
    db_session.refresh(center)
    return center


@pytest.fixture
def test_user(db_session, test_roles, test_center):
    """Create test user with student role"""
    student_role = next(r for r in test_roles if r.name == "student")
    
    user = User(
        email="student001@example.com",
        username="student001",
        hashed_password=get_password_hash("password123"),
        full_name="Test Student One",
        center_id=test_center.id,
        is_active=True,
        is_verified=True
    )
    user.roles.append(student_role)
    
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_admin(db_session, test_roles):
    """Create test admin user"""
    admin_role = next(r for r in test_roles if r.name == "admin")
    
    user = User(
        email="admin@example.com",
        username="admin",
        hashed_password=get_password_hash("admin123"),
        full_name="Admin User",
        is_active=True,
        is_verified=True
    )
    user.roles.append(admin_role)
    
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers_student(client, test_user):
    """Get authentication headers for student user"""
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "student001", "password": "password123"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_admin(client, test_admin):
    """Get authentication headers for admin user"""
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin123"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

