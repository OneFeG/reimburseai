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

    # Blockchain - Avalanche Network Configuration
    # Testnet (Fuji): chain_id=43113, use_mainnet=False
    # Mainnet (C-Chain): chain_id=43114, use_mainnet=True
    use_mainnet: bool = Field(
        default=False, description="Use Avalanche mainnet instead of Fuji testnet"
    )
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

    # Audit Signature Verification
    audit_signing_key: str = Field(
        default="",
        description="Secret key for signing audit results. Set in production!"
    )

    # Admin wallet for testing (bypasses some checks)
    admin_wallet_address: str = Field(
        default="0x74efBD5F7B3cc0787B28a0814fECe6bb7Bb3928f",
        description="Admin wallet address for real application testing"
    )

    # OpenAI
    openai_api_key: str = Field(default="")

    # Email (Resend) - for 2FA
    resend_api_key: str = Field(default="", description="Resend API key for sending emails")
    from_email: str = Field(default="noreply@reimburse.ai", description="From email address")

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
    def chain_name(self) -> str:
        """Get Thirdweb chain name based on network."""
        return "avalanche" if self.use_mainnet else "avalanche-fuji"

    @computed_field
    @property
    def actual_chain_id(self) -> int:
        """Get actual chain ID (mainnet: 43114, testnet: 43113)."""
        return 43114 if self.use_mainnet else 43113

    @computed_field
    @property
    def usdc_token_address(self) -> str:
        """Get USDC token address for current network."""
        # Mainnet USDC: 0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E
        # Testnet USDC: 0x5425890298aed601595a70AB815c96711a31Bc65
        return (
            "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E"
            if self.use_mainnet
            else "0x5425890298aed601595a70AB815c96711a31Bc65"
        )

    @computed_field
    @property
    def max_file_size_bytes(self) -> int:
        """Get max file size in bytes."""
        return self.max_file_size_mb * 1024 * 1024

    def is_admin_wallet(self, address: str) -> bool:
        """Check if address is the admin wallet."""
        if not address or not self.admin_wallet_address:
            return False
        return address.lower() == self.admin_wallet_address.lower()


@lru_cache
def get_settings() -> Settings:
    """
    Get cached application settings.
    Uses LRU cache to avoid re-reading environment on every call.
    """
    return Settings()


# Export a default settings instance
settings = get_settings()
