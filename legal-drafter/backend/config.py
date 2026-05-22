"""Environment-backed settings, loaded via pydantic-settings."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


REPO_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(REPO_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    anthropic_api_key: str = ""
    voyage_api_key: str = ""
    openai_api_key: str = ""

    anthropic_model: str = "claude-opus-4-7"
    anthropic_temperature: float = 0.3
    voyage_model: str = "voyage-3"
    openai_embed_model: str = "text-embedding-3-large"

    style_bank_dir: str = "style_bank"
    output_dir: str = "output"
    db_path: str = "legal_drafter.db"

    @property
    def style_bank_path(self) -> Path:
        return REPO_ROOT / self.style_bank_dir

    @property
    def output_path(self) -> Path:
        return REPO_ROOT / self.output_dir

    @property
    def db_file(self) -> Path:
        return REPO_ROOT / self.db_path


settings = Settings()
