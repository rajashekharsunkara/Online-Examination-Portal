"""
Authentication endpoints: login, refresh, me, hall_ticket_login
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    HallTicketLoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    Token,
    User as UserSchema
)
from app.api.dependencies import get_current_active_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return access + refresh tokens
    
    - **username**: Username or email
    - **password**: User password
    
    Returns JWT tokens and user information
    """
    # Find user by username or email
    user = db.query(User).filter(
        (User.username == login_data.username) | (User.email == login_data.username)
    ).first()
    
    # Verify user exists
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Update last login timestamp
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserSchema.from_orm(user)
    )


@router.post("/hall-ticket-login", response_model=LoginResponse)
async def hall_ticket_login(
    login_data: HallTicketLoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate student using hall ticket (center-based exam flow like JEE/NPTEL)
    
    - **hall_ticket_number**: Unique hall ticket/application number
    - **date_of_birth**: Date of birth in DD/MM/YYYY format
    - **security_answer**: Answer to pre-registered security question
    
    Returns JWT tokens and user information
    """
    # Find user by hall ticket number
    user = db.query(User).filter(
        User.hall_ticket_number == login_data.hall_ticket_number
    ).first()
    
    # Verify user exists
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid hall ticket number",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify date of birth
    try:
        from datetime import datetime as dt
        dob = dt.strptime(login_data.date_of_birth, "%d/%m/%Y").date()
        if user.date_of_birth and user.date_of_birth != dob:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid date of birth",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use DD/MM/YYYY"
        )
    
    # Verify security answer (case-insensitive comparison)
    if user.security_answer_hash:
        if not verify_password(
            login_data.security_answer.strip().lower(),
            user.security_answer_hash
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect security answer",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student account is inactive. Please contact administrator."
        )
    
    # Verify user has student role
    if not user.has_role("student"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hall ticket login is only for students"
        )
    
    # Update last login timestamp
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserSchema.from_orm(user)
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(
    token_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token
    
    - **refresh_token**: Valid refresh token
    
    Returns new access and refresh tokens
    """
    # Decode refresh token
    payload = decode_token(token_data.refresh_token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify token type
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type. Expected refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user ID
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify user exists and is active
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create new tokens
    new_access_token = create_access_token(data={"sub": str(user.id)})
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return Token(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer"
    )


@router.get("/me", response_model=UserSchema)
async def get_me(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current authenticated user's information
    
    Requires valid access token in Authorization header
    """
    return UserSchema.from_orm(current_user)
