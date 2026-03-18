from sqlmodel import Session, select, desc, col
from sqlalchemy import func, cast, Integer
from fastapi import HTTPException
from datetime import datetime, timezone
from typing import Sequence, Any

from app.models.telemetry import DataLog, Device, DeviceType
from app.utils.utils_seeding import get_global_var

def read_all_log(db: Session, limit: int | None, start_date: datetime | None, end_date: datetime | None, device_type_id: int | None) -> Sequence[Any]:
    if device_type_id is None:
        _, _, var_device_type = get_global_var(db=db)
        device_type_id = var_device_type["HYDROPONIC_RACKS"]

    statement = (
        select(
            col(DataLog.device_id),
            col(DataLog.data_log),
            func.timezone('Asia/Jakarta', DataLog.timestamp).label("timestamp"),
            cast(Device.attr["rack_id"].astext, Integer).label("rack_id")
        )
        .join(Device, Device.id == DataLog.device_id) # type: ignore
        .order_by(desc(DataLog.timestamp), col(DataLog.device_id))
    )

    if device_type_id:
        statement = statement.where(Device.devicetype_id == device_type_id)
    if limit:
        statement = statement.limit(limit=limit)
    if start_date:
        start_date = start_date.astimezone(timezone.utc)
        statement = statement.where(DataLog.timestamp >= start_date)
    if end_date:
        end_date = end_date.astimezone(timezone.utc)
        statement = statement.where(DataLog.timestamp <= end_date)

    res = db.exec(statement=statement).all()
    if len(res) == 0:
        raise HTTPException(
            status_code=504,
            detail="No data"
        )
    return res

def read_latest_device_log_data(db: Session):
    _, _, var_device_type = get_global_var(db=db)
    device_type_id = var_device_type["HYDROPONIC_RACKS"]
    
    statement = (
        select(
            DataLog.device_id,
            DataLog.data_log,
            func.timezone('Asia/Jakarta', DataLog.timestamp).label("timestamp"),
            cast(Device.attr["rack_id"].astext, Integer).label("rack_id")
        )
        .distinct(DataLog.device_id) # type: ignore
        .join(Device, Device.id == DataLog.device_id) # type: ignore
        .join(DeviceType, DeviceType.id == Device.devicetype_id) # type: ignore
        .where(Device.devicetype_id == device_type_id) # type: ignore
        .order_by(DataLog.device_id, desc(DataLog.timestamp)) # type: ignore
    )
    
    res = db.exec(statement=statement).all()

    if not res:
        raise HTTPException(
            status_code=504,
            detail="No data"
        )
    return res

def read_log_by_device_id(db: Session, device_id: int, limit: int | None, start_date: datetime | None, end_date: datetime | None) -> Sequence[Any]:
    statement = (
        select(
            col(DataLog.device_id),
            col(DataLog.data_log),
            func.timezone('Asia/Jakarta', col(DataLog.timestamp)).label("timestamp")
        ).where(col(DataLog.device_id) == device_id).order_by(desc(col(DataLog.timestamp))) # type: ignore
    )

    if limit:
        statement = statement.limit(limit=limit)
    if start_date:
        start_date = start_date.astimezone(timezone.utc)
        statement = statement.where(DataLog.timestamp >= start_date)
    if end_date:
        end_date = end_date.astimezone(timezone.utc)
        statement = statement.where(DataLog.timestamp <= end_date)

    res = db.exec(statement=statement).all()
    if not res:
        raise HTTPException(
            status_code=504,
            detail="No data"
        )
    return res