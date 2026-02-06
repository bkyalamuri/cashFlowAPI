"""Application configuration from environment."""
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve .env relative to this file so it always points to backend/.env
# regardless of which directory uvicorn is started from.
_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    api_host: str = "0.0.0.0"
    api_port: int = 8000

    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-4o-mini"

    datasource: str = "sample"  # "sample" | "stripe" | "stripe_seed"
    stripe_mock_url: str = "http://localhost:12111"

    @property
    def copilot_available(self) -> bool:
        return bool(self.openai_api_key)


settings = Settings()
