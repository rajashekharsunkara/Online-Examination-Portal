"""
Core configuration and settings
"""
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "Exam Platform API"
    APP_VERSION: str = "0.1.0"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    
    # Security
    SECRET_KEY: str = Field(
        default="dev-secret-key-change-in-production-use-openssl-rand-hex-32",
        env="SECRET_KEY"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database
    DATABASE_URL: str = Field(
        default="postgresql://exam_user:exam_pass@postgres:5432/exam_db",
        env="DATABASE_URL"
    )
    
    # Redis
    REDIS_URL: str = Field(default="redis://redis:6379/0", env="REDIS_URL")
    
    # WebSocket
    WS_HEARTBEAT_INTERVAL: int = 30  # seconds
    WS_HEARTBEAT_TIMEOUT: int = 60  # seconds
    WS_MAX_CONNECTIONS_PER_USER: int = 3  # Allow multiple tabs/devices
    WS_CHECKPOINT_DEBOUNCE_SECONDS: int = 2  # Debounce rapid saves
    
    # MinIO / S3
    MINIO_ENDPOINT: str = Field(default="minio:9000", env="MINIO_ENDPOINT")
    MINIO_ACCESS_KEY: str = Field(default="minioadmin", env="MINIO_ACCESS_KEY")
    MINIO_SECRET_KEY: str = Field(default="minioadmin123", env="MINIO_SECRET_KEY")
    MINIO_BUCKET_NAME: str = "exam-submissions"
    MINIO_SECURE: bool = False  # Use TLS
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
    ]
    
    # Password hashing
    PWD_CONTEXT_SCHEMES: List[str] = ["bcrypt"]
    PWD_CONTEXT_DEPRECATED: str = "auto"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
