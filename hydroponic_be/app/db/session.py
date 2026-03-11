from sqlmodel import Session, create_engine, SQLModel

from app.core.config_dev import settings
from app.models.telemetry import *

engine = create_engine(
    settings.DATABASE_URL, 
    echo=True,
    pool_size=10, 
    max_overflow=20
)

def get_session():
    with Session(engine) as session:
        yield session