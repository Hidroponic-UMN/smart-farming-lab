from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
from typing import Optional

class Settings(BaseSettings):
    # --- Project Settings ---
    PROJECT_NAME: str = ""
    API_V1_STR: str = ""

    # --- PostgreSQL Settings ---
    POSTGRES_SERVER: str = ''
    APP_DB_USER: str = ""
    APP_DB_PASSWORD: str = ""
    POSTGRES_DB: str = ""
    DATABASE_URL: Optional[str] = None

    # --- MQTT Settings ---
    MQTT_BROKER: str = "" # Nama di compose lu
    MQTT_PORT: int = 0
    MQTT_USERNAME: str = ""
    MQTT_PASSWORD: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @model_validator(mode="after")
    def assemble_database_url(self) -> "Settings":
        """
        Ensures DATABASE_URL is populated. If Docker did not inject it natively,
        this validator automatically builds it using the individual database fields.
        """
        if not self.DATABASE_URL:
            # Fallback configuration for local testing outside of Docker
            self.DATABASE_URL = (
                f"postgresql://{self.APP_DB_USER}:{self.APP_DB_PASSWORD}"
                f"@{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"
            )
        return self

settings = Settings()