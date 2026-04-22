"""Central configuration loaded from environment variables."""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App
    app_name: str = "StenoForge AI"
    env: str = "development"
    debug: bool = True

    # Security
    secret_key: str = "CHANGE_ME_IN_PROD_32_CHARS_LONG_SECRET"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Database
    database_url: str = "sqlite:///./stenoforge.db"

    # CORS
    cors_origins: str = "*"

    # Razorpay
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    razorpay_webhook_secret: str = ""
    plan_pro_monthly_id: str = ""
    plan_pro_yearly_id: str = ""
    plan_institute_monthly_id: str = ""

    # AI provider: "anthropic" | "openai" | "mock"
    ai_provider: str = "mock"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-5"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # Limits
    free_daily_ai_generations: int = 3
    free_daily_sessions: int = 3

    # Admin access. Comma-separated emails that auto-get is_admin=True on
    # signup and can access /admin/stats.
    # Example: ADMIN_EMAILS="you@example.com,other@x.com"
    admin_emails: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
