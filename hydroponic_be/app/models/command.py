from enum import Enum
from sqlmodel import Field, SQLModel, Relationship, DateTime
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING, Dict, Any
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB

from app.utils.utils_time import get_utc_now, datetime

if TYPE_CHECKING:
    from app.models.telemetry import Device


class EnumCommandType(str, Enum):
    PUMP_ON = "PUMP_ON"
    PUMP_OFF = "PUMP_OFF"
    KALIBRASI_TDS = "KALIBRASI_TDS"
    KALIBRASI_PH = "KALIBRASI_PH"

class EnumCommandStatus(str, Enum):
    START = "START"
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    TIME_OUT = "TIME_OUT"
    BROKER_DOWN = "BROKER_DOWN"

class CmdMicroController(SQLModel):
    mac_addr: str
    command: str
    status: str
    cmd_log: Dict[str, Any]

class CmdInput(SQLModel):
    created_by: str
    command_type: EnumCommandType

class CommandLogWithRack(SQLModel):
    command_id: int
    status_id: int
    device_id: int
    cmd_log: Dict[str, Any]
    timestamp: datetime
    rack_id: int

class JSONInput(SQLModel):
    known_value: int | float = Field(default=0.0)



class CommandType(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    desc: Optional[str] = Field(default=None)
    attr: Dict[str, Any] = Field(default_factory=dict, sa_type=JSONB)

    logs: List["CommandLog"] = Relationship(back_populates="cmd_def")

class CommandStatus(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    desc: Optional[str] = Field(default=None)
    attr: Dict[str, Any] = Field(default_factory=dict, sa_type=JSONB)

    logs: List["CommandLog"] = Relationship(back_populates="cmd_stat")

class CommandLogBase(SQLModel):
    command_id: int = Field(foreign_key="commandtype.id", index=True, primary_key=True)
    status_id: int = Field(foreign_key="commandstatus.id", index=True, primary_key=True)
    device_id: int = Field(foreign_key="device.id", index=True, primary_key=True)
    created_by: str = Field(default="system")
    cmd_log: Dict[str, Any] = Field(default_factory=dict, sa_type=JSONB)
    timestamp: datetime = Field(sa_column=Column(DateTime(timezone=True), index=True, primary_key=True), default_factory=get_utc_now)

class CommandLog(CommandLogBase, table=True):
    cmd_def: CommandType = Relationship(back_populates="logs")
    cmd_stat: CommandStatus = Relationship(back_populates="logs")
    device: Device = Relationship(back_populates="logs_cmd")