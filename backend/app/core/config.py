from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "SmartSched AI"
    PROJECT_VERSION: str = "1.0.0"
    SECRET_KEY: str = "smartsched-secret-key-2026-production-scheduling-platform"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    DATABASE_URL: str = "sqlite:///./smartsched.db"
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]
    
    class Config:
        env_file = ".env"

settings = Settings()
