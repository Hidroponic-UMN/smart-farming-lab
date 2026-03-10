from enum import Enum

from sqlmodel import Field, SQLModel, Relationship, DateTime
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Column

from app.utils.utils_time import get_utc_now, datetime

if TYPE_CHECKING:
    from app.models.telemetry import Device

class CmdType(str, Enum):
    PUMP_ON = "PUMP_ON"
    PUMP_OFF = "PUMP_OFF"

class CmdStatus(str, Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    TIME_OUT = "TIME_OUT"
    BROKER_DOWN = "BROKER_DOWN"

class CmdMicroController(SQLModel):
    mac_addr: str 
    command: str
    status: str

class CmdInput(SQLModel):
    created_by: str 
    command_type: CmdType 

class CmdDef(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    desc: Optional[str] = Field(default=None)
    logs: List["CmdLog"] = Relationship(back_populates="cmd_def")

class CmdStat(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    desc: Optional[str] = Field(default=None)
    logs: List["CmdLog"] = Relationship(back_populates="cmd_stat")

class CmdLogBase(SQLModel):
    command_id: int = Field(foreign_key="cmddef.id")
    status_id: int = Field(foreign_key="cmdstat.id")
    device_id: int = Field(foreign_key="device.id", index=True)

    created_by: str = Field(default="system")
    timestamp: datetime = Field(sa_column=Column(DateTime(timezone=True), index=True), default_factory=get_utc_now)

class CmdLog(CmdLogBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    cmd_def: CmdDef = Relationship(back_populates="logs")
    cmd_stat: CmdStat = Relationship(back_populates="logs")
    device: Device = Relationship(back_populates="logs_cmd")