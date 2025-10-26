"""
Authentication and authorization dependencies
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.schemas.auth import TokenPayload

# HTTP Bearer token scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user from JWT token
    
    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials
    
    # Decode token
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify token type
    token_type = payload.get("type")
    if token_type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user ID from token
    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Fetch user from database
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to ensure user is active
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


class RoleChecker:
    """
    Dependency class to check if user has required role(s)
    
    Usage:
        @app.get("/admin-only", dependencies=[Depends(RoleChecker(["admin"]))])
    """
    def __init__(self, required_roles: list[str]):
        self.required_roles = required_roles
    
    async def __call__(self, user: User = Depends(get_current_active_user)):
        """Check if user has any of the required roles"""
        user_roles = user.get_role_names()
        
        # Check if user has any of the required roles
        if not any(role in user_roles for role in self.required_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User does not have required role. Required: {self.required_roles}"
            )
        
        return user


def require_role(role_name: str):
    """
    Convenience function to create a role checker for a single role
    
    Usage:
        @app.get("/admin", dependencies=[Depends(require_role("admin"))])
    """
    return RoleChecker([role_name])


def require_any_role(*role_names: str):
    """
    Require user to have at least one of the specified roles
    
    Usage:
        @app.get("/staff", dependencies=[Depends(require_any_role("admin", "hall_in_charge"))])
    """
    return RoleChecker(list(role_names))


def get_current_user_ws(
    token: str,
    db: Session
) -> Optional[User]:
    """
    Get current user from JWT token for WebSocket connections
    
    Args:
        token: JWT token from query parameter
        db: Database session
        
    Returns:
        User if valid, None otherwise
    """
    try:
        # Decode token
        payload = decode_token(token)
        if payload is None:
            return None
        
        # Verify token type
        token_type = payload.get("type")
        if token_type != "access":
            return None
        
        # Get user ID from token
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            return None
        
        # Fetch user from database (synchronous)
        user = db.query(User).filter(User.id == int(user_id)).first()
        
        if user is None:
            return None
        
        # Check if user is active
        if not user.is_active:
            return None
        
        return user
        
    except Exception:
        return None
