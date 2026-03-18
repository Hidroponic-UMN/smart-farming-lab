from enum import Enum
from sqlmodel import Field, SQLModel, Relationship, DateTime
from typing import Optional, Dict, Any, List, TYPE_CHECKING
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB

from app.utils.utils_time import get_utc_now, datetime

if TYPE_CHECKING:
    from app.models.command import CommandLog


class EnumDeviceType(str, Enum):
    HYDROPONIC_RACKS = "HYDROPONIC_RACKS"
    ROOM_MONITORING = "ROOM_MONITORING"

class RegisterMicroController(SQLModel):
    attr: Dict[str, Any] = Field(default_factory=dict, sa_type=JSONB)
    mac_addr: str
    desc: str
    type_id: int

class TelemetryMicroController(SQLModel):
    mac_addr: str
    data: dict[str, Any]

class DataLogWithRack(SQLModel):
    device_id: int
    data_log: Dict[str, Any]
    timestamp: datetime
    rack_id: int



class DeviceType(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    desc: Optional[str]
    attr: Dict[str, Any] = Field(default_factory=dict, sa_type=JSONB)

    devices: List["Device"] = Relationship(back_populates="device_type")

class Device(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    desc: Optional[str]
    attr: Dict[str, Any] = Field(default_factory=dict, sa_type=JSONB)
    mac_addr: str
    devicetype_id: int = Field(foreign_key="devicetype.id")

    device_type: DeviceType = Relationship(back_populates="devices")
    logs: List["DataLog"] = Relationship(back_populates="device")
    logs_cmd: List["CommandLog"] = Relationship(back_populates="device")

class DataLogBase(SQLModel):
    device_id: int = Field(foreign_key="device.id", primary_key=True)
    data_log: Dict[str, Any] = Field(default_factory=dict, sa_type=JSONB)
    timestamp: datetime = Field(sa_column=Column(DateTime(timezone=True), primary_key=True), default_factory=get_utc_now)

class DataLog(DataLogBase, table=True):
    device: Device = Relationship(back_populates="logs")