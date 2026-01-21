"""
Application configuration
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings"""

    # Database
    database_url: str = "postgresql://landuser:landpass123@localhost:5432/land_data"

    # API
    api_title: str = "Taiwan Land Data API"
    api_version: str = "1.0.0"
    api_description: str = "API for Taiwan national land data visualization"

    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # Pagination
    default_page_size: int = 100
    max_page_size: int = 1000

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )


settings = Settings()
