"""
Pydantic schemas for authentication and users
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


# Token schemas
class Token(BaseModel):
    """Token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Decoded token payload"""
    sub: Optional[str] = None  # subject (user_id)
    exp: Optional[int] = None  # expiration
    iat: Optional[int] = None  # issued at
    type: Optional[str] = None  # token type (access/refresh)


# Role schemas
class RoleBase(BaseModel):
    """Base role schema"""
    name: str
    description: Optional[str] = None


class RoleCreate(RoleBase):
    """Schema for creating a role"""
    pass


class Role(RoleBase):
    """Role response schema"""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Center schemas
class CenterBase(BaseModel):
    """Base center schema"""
    name: str
    code: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None


class CenterCreate(CenterBase):
    """Schema for creating a center"""
    pass


class Center(CenterBase):
    """Center response schema"""
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# User schemas
class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    username: str
    full_name: str


class UserCreate(UserBase):
    """Schema for creating a user"""
    password: str = Field(..., min_length=8)
    role_names: List[str] = ["student"]
    center_id: Optional[int] = None


class UserUpdate(BaseModel):
    """Schema for updating a user"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    center_id: Optional[int] = None


class User(UserBase):
    """User response schema"""
    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    roles: List[Role] = []
    center: Optional[Center] = None
    
    class Config:
        from_attributes = True


class UserInDB(User):
    """User schema with password hash (for internal use)"""
    hashed_password: str


# Login schemas
class LoginRequest(BaseModel):
    """Login request"""
    username: str
    password: str


class HallTicketLoginRequest(BaseModel):
    """Hall ticket login request (for center-based exams like JEE/NPTEL)"""
    hall_ticket_number: str = Field(..., min_length=5, max_length=50)
    date_of_birth: str = Field(..., description="Date of birth in DD/MM/YYYY format")
    security_answer: str = Field(..., min_length=1, description="Answer to security question")


class LoginResponse(BaseModel):
    """Login response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: User


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str
