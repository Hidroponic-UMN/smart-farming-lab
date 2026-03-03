from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import Any

class Settings(BaseSettings):
    # --- Project Settings ---
    PROJECT_NAME: str = "Smart Hydroponic"
    API_V1_STR: str = "/api/v1"
    
    # --- PostgreSQL Settings ---
    POSTGRES_SERVER: str = "@db:5432"
    POSTGRES_USER: str = "admin_lab"
    POSTGRES_PASSWORD: str = "admin123"
    POSTGRES_DB: str = "hydroponic_db"
    DATABASE_URL: str | None = None

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str | None, values: Any) -> Any:
        if isinstance(v, str):
            return v
        # Menyusun URL: postgresql://user:pass@server/db
        return f"postgresql://{values.data.get('POSTGRES_USER')}:{values.data.get('POSTGRES_PASSWORD')}@{values.data.get('POSTGRES_SERVER')}/{values.data.get('POSTGRES_DB')}"

    # --- MQTT Settings ---
    MQTT_BROKER: str = ""
    MQTT_PORT: int = 1883
    MQTT_TOPIC: str = "hydroponic/racks/+" # Menggunakan wildcard + untuk semua rak
    MQTT_USERNAME: str | None = None
    MQTT_PASSWORD: str | None = None

    # Mengambil value dari file .env
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        case_sensitive=True
    )

settings = Settings()