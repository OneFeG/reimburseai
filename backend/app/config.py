"""
Application Configuration
=========================
Centralized settings management using Pydantic Settings.
All environment variables are validated and typed.
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = Field(default="reimburseai-backend")
    app_env: Literal["development", "staging", "production"] = Field(default="development")
    debug: bool = Field(default=False)
    api_version: str = Field(default="v1")
    secret_key: str = Field(default="change-me-in-production")

    # Server
    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8000)
    allowed_origins: str = Field(default="http://localhost:3000")

    # Supabase
    supabase_url: str = Field(default="")
    supabase_anon_key: str = Field(default="")
    supabase_service_role_key: str = Field(default="")

    # Storage
    storage_bucket: str = Field(default="receipts")
    max_file_size_mb: int = Field(default=10)

    # Blockchain
    avalanche_rpc_url: str = Field(default="https://api.avax-test.network/ext/bc/C/rpc")
    chain_id: int = Field(default=43113)

    # x402 Protocol
    auditor_endpoint: str = Field(default="http://localhost:8001/api/auditor")
    audit_fee_usdc: float = Field(default=0.05)
    x402_facilitator_url: str = Field(default="https://x402.org/facilitator")

    # Thirdweb
    thirdweb_engine_url: str = Field(default="https://engine.thirdweb.com")
    thirdweb_secret_key: str = Field(default="")
    thirdweb_company_wallet_address: str = Field(default="")
    thirdweb_agent_a_wallet_address: str = Field(default="")

    # Treasury
    treasury_secret_key: str = Field(default="change-me-treasury-secret")

    # OpenAI
    openai_api_key: str = Field(default="")

    # Rate Limiting
    rate_limit_requests: int = Field(default=100)
    rate_limit_window_seconds: int = Field(default=60)

    @computed_field
    @property
    def allowed_origins_list(self) -> list[str]:
        """Parse comma-separated origins into a list."""
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    @computed_field
    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.app_env == "production"

    @computed_field
    @property
    def max_file_size_bytes(self) -> int:
        """Get max file size in bytes."""
        return self.max_file_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    """
    Get cached application settings.
    Uses LRU cache to avoid re-reading environment on every call.
    """
    return Settings()


# Export a default settings instance
settings = get_settings()
