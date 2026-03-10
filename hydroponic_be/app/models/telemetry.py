from sqlmodel import Field, SQLModel, Relationship, DateTime
from typing import Optional, Dict, Any, List, TYPE_CHECKING
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB

from app.utils.utils_time import get_utc_now, datetime

if TYPE_CHECKING:
    from app.models.command import CmdLog


class RegisterMicroController(SQLModel):
    desc: Dict[str, Any] = Field(default_factory=dict, sa_type=JSONB)
    mac_addr: str

class TelemetryMicroController(SQLModel):
    mac_addr: str
    data: dict[str, Any]

class Device(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    desc: Dict[str, Any] = Field(default_factory=dict, sa_type=JSONB)
    mac_addr: str
    logs: List["DataLog"] = Relationship(back_populates="device")
    logs_cmd: List["CmdLog"] = Relationship(back_populates="device")

class DataLogBase(SQLModel):
    device_id: int = Field(foreign_key="device.id", index=True, primary_key=True)
    data_log: Dict[str, Any] = Field(default_factory=dict, sa_type=JSONB)
    timestamp: datetime = Field(sa_column=Column(DateTime(timezone=True), primary_key=True), default_factory=get_utc_now)

class DataLog(DataLogBase, table=True):
    device: Device = Relationship(back_populates="logs")