"""
Authentication endpoint tests
"""
import pytest
from fastapi import status


class TestLogin:
    """Test login endpoint"""
    
    def test_login_success(self, client, test_user):
        """Test successful login with valid credentials"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "student001",
                "password": "password123"
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Verify response structure
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        
        # Verify user data
        user_data = data["user"]
        assert user_data["email"] == "student001@example.com"
        assert user_data["username"] == "student001"
        assert "hashed_password" not in user_data  # Password should not be exposed
        assert len(user_data["roles"]) > 0
        assert user_data["roles"][0]["name"] == "student"
    
    def test_login_with_email(self, client, test_user):
        """Test login using email instead of username"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "student001@example.com",
                "password": "password123"
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_login_invalid_password(self, client, test_user):
        """Test login with wrong password"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "student001",
                "password": "wrongpassword"
            }
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "incorrect username or password" in response.json()["detail"].lower()
    
    def test_login_invalid_username(self, client, test_roles):
        """Test login with non-existent user"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "nonexistent",
                "password": "password123"
            }
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_login_inactive_user(self, client, db_session, test_user):
        """Test login with inactive user account"""
        # Deactivate user
        test_user.is_active = False
        db_session.commit()
        
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "student001",
                "password": "password123"
            }
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestRefreshToken:
    """Test token refresh endpoint"""
    
    def test_refresh_token_success(self, client, test_user):
        """Test successful token refresh"""
        # First login to get tokens
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "student001",
                "password": "password123"
            }
        )
        refresh_token = login_response.json()["refresh_token"]
        
        # Refresh tokens
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
    
    def test_refresh_with_invalid_token(self, client):
        """Test refresh with invalid token"""
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid.token.here"}
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_refresh_with_access_token(self, client, test_user):
        """Test that access token cannot be used to refresh"""
        # Login to get tokens
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "student001",
                "password": "password123"
            }
        )
        access_token = login_response.json()["access_token"]
        
        # Try to use access token to refresh
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": access_token}
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestGetMe:
    """Test get current user endpoint"""
    
    def test_get_me_success(self, client, test_user):
        """Test getting current user info with valid token"""
        # Login to get access token
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "student001",
                "password": "password123"
            }
        )
        access_token = login_response.json()["access_token"]
        
        # Get current user
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["username"] == "student001"
        assert data["email"] == "student001@example.com"
        assert len(data["roles"]) > 0
    
    def test_get_me_without_token(self, client):
        """Test get me without authentication"""
        response = client.get("/api/v1/auth/me")
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_get_me_with_invalid_token(self, client):
        """Test get me with invalid token"""
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid.token"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestRBAC:
    """Test role-based access control"""
    
    def test_user_has_role(self, test_user):
        """Test user.has_role() method"""
        assert test_user.has_role("student") is True
        assert test_user.has_role("admin") is False
    
    def test_user_get_role_names(self, test_user):
        """Test user.get_role_names() method"""
        role_names = test_user.get_role_names()
        assert "student" in role_names
        assert len(role_names) >= 1
    
    def test_admin_user_roles(self, test_admin):
        """Test admin user has admin role"""
        assert test_admin.has_role("admin") is True
        assert "admin" in test_admin.get_role_names()
