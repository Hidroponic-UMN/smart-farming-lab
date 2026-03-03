from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class Telemetry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    rack_id: int = Field(index=True)
    ph: float
    tds: float
    water_temp: float
    timestamp: datetime = Field(default_factory=datetime.now)