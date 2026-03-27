from sqlmodel import Session, select, desc, asc
from sqlalchemy import func, cast, Integer
from fastapi import HTTPException
# from typing import Any, Sequence
# from datetime import datetime, timezone

from app.models.command import CommandType, CommandStatus
from app.models.telemetry import DataLog, Device, DeviceType
from app.utils.utils_seeding import get_global_var

def read_all_device(db: Session):
    statement = (
        select(Device)
        .join(DeviceType, DeviceType.id == Device.devicetype_id) # type: ignore
        .order_by(asc(Device.id))
    )
    res = db.exec(statement=statement).all()

    if len(res) == 0:
        raise HTTPException(
            status_code=504,
            detail="Empty"
        )
    return res

def read_all_command_type(db: Session):
    statement = (
        select(CommandType).order_by(asc(CommandType.id))
    )
    res = db.exec(statement=statement).all()

    if len(res) == 0:
        raise HTTPException(
            status_code=504,
            detail="Empty"
        )
    return res

def read_all_command_status(db: Session):
    statement = (
        select(CommandStatus).order_by(asc(CommandStatus.id))
    )
    res = db.exec(statement=statement).all()

    if len(res) == 0:
        raise HTTPException(
            status_code=504,
            detail="Empty"
        )
    return res

def read_latest_device_log_data(db: Session, device_id: int | None):
    if device_id is None:
        _, _, var_device_type = get_global_var(db=db)
        device_type_id = var_device_type["ROOM_MONITORING"]

    statement = (
        select(
            DataLog.device_id,
            DataLog.data_log,
            func.timezone('Asia/Jakarta', DataLog.timestamp).label("timestamp"),
            cast(Device.attr["rack_id"].as_string(), Integer).label("rack_id")
        )
        .distinct(DataLog.device_id) # type: ignore
        .join(Device, Device.id == DataLog.device_id) # type: ignore
        .join(DeviceType, DeviceType.id == Device.devicetype_id) # type: ignore
        .where(Device.devicetype_id == device_type_id) # type: ignore
        .where(cast(Device.attr["rack_id"].as_string(), Integer) == device_id)
        .order_by(DataLog.device_id, desc(DataLog.timestamp)) # type: ignore
    )

    res = db.exec(statement=statement).all()

    if not res:
        raise HTTPException(
            status_code=504,
            detail="No data"
        )
    return res