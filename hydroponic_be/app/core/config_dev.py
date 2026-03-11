from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        case_sensitive=True
    )
    
    # --- Project Settings ---
    PROJECT_NAME: str = "Smart Hydroponic"
    API_V1_STR: str = "/api/v1"
    
    # --- PostgreSQL Settings ---
    POSTGRES_SERVER: str = "localhost:5432"
    POSTGRES_USER: str = "admin_lab"
    POSTGRES_PASSWORD: str = "admin123"
    POSTGRES_DB: str = "hydroponic_db"
    DATABASE_URL: str = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}/{POSTGRES_DB}"

    # --- MQTT Settings ---
    MQTT_BROKER: str = "localhost" # Nama di compose lu
    MQTT_PORT: int = 1883
    MQTT_TOPIC: str = "hydroponic/master"
    MQTT_USERNAME: str = "admin_lab"
    MQTT_PASSWORD: str = "admin123"

settings = Settings()