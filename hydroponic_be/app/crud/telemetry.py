from sqlmodel import Session, select, desc, col
from sqlalchemy import func
from fastapi import HTTPException

from app.models.telemetry import DataLog, Device

def read_latest_device_logs_data(db: Session):
    statement = (
        select(
            col(DataLog.device_id),
            col(DataLog.data_log),
            func.timezone('Asia/Jakarta', col(DataLog.timestamp)).label("timestamp")
        ).distinct(col(DataLog.device_id)).order_by(col(DataLog.device_id), desc(col(DataLog.timestamp))) # type: ignore
    )
    res = db.exec(statement=statement).all()

    if not res:
        raise HTTPException(
            status_code=501,
            detail="No data"
        )
    return res

def read_log_by_device_id(db: Session, device_id: int, limit: int):
    statement = (
        select(
            col(DataLog.device_id),
            col(DataLog.data_log),
            func.timezone('Asia/Jakarta', col(DataLog.timestamp)).label("timestamp")
        ).where(col(DataLog.device_id) == device_id).order_by(desc(col(DataLog.timestamp))).limit(limit=limit) # type: ignore
    )
    res = db.exec(statement=statement).all()
    if not res:
        raise HTTPException(
            status_code=501,
            detail="No data"
        )
    return res