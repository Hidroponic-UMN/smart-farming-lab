from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- Project Settings ---
    PROJECT_NAME: str = ""
    API_V1_STR: str = ""
    
    # --- PostgreSQL Settings ---
    POSTGRES_SERVER: str = ''
    POSTGRES_USER: str = ""
    POSTGRES_PASSWORD: str = ""
    POSTGRES_DB: str = ""
    DATABASE_URL: str = ''

    # --- MQTT Settings ---
    MQTT_BROKER: str = "" # Nama di compose lu
    MQTT_PORT: int = 0
    MQTT_USERNAME: str = ""
    MQTT_PASSWORD: str = ""

    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        case_sensitive=True
    )

settings = Settings()