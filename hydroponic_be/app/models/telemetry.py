from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Column, Integer, ForeignKey

class Rack(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    desc: Optional[str] = None

    logs: List["Log"] = Relationship(back_populates="rack")

class LogBase(SQLModel):
    id: Optional[int] = Field(default=None, primary_key=True)

class Log(LogBase, table=True):
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)
    data_log: Dict[str, Any] = Field(default={}, sa_type=JSONB)

    rack_id: int = Field(sa_column=Column(Integer, ForeignKey("rack.id"), index=True))
    rack: Optional[Rack] = Relationship(back_populates="logs")