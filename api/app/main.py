"""
FastAPI Main Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.api import auth, exams, attempts, ws_attempts, transfers, proctoring
from app.services.redis import redis_service

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events
    Handles startup and shutdown
    """
    # Startup
    logger.info("Starting up application...")
    
    # Connect to Redis
    try:
        await redis_service.connect()
        logger.info("Redis connected successfully")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    
    # Disconnect from Redis
    try:
        await redis_service.disconnect()
        logger.info("Redis disconnected successfully")
    except Exception as e:
        logger.error(f"Error disconnecting from Redis: {e}")


app = FastAPI(
    title=settings.APP_NAME,
    description="Center-based exam platform with real-time checkpointing and RBAC",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(exams.router, prefix=settings.API_V1_PREFIX)
app.include_router(attempts.router, prefix=settings.API_V1_PREFIX)
app.include_router(ws_attempts.router, prefix=settings.API_V1_PREFIX)
app.include_router(transfers.router, prefix=settings.API_V1_PREFIX)
app.include_router(proctoring.router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return JSONResponse(
        content={
            "status": "healthy",
            "service": "exam-platform-api",
            "version": "0.1.0",
        }
    )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Exam Platform API",
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
