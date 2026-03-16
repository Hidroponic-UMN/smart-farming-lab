from sqlmodel import Session, select, desc, col
from sqlalchemy import func
from fastapi import HTTPException
from typing import Any, Sequence
from datetime import datetime, timezone

from app.models.telemetry import Device

def read_all_device(db: Session):
    statement = (select(Device).order_by(desc(Device.id)))
    res = db.exec(statement=statement).all()
    
    if len(res) == 0:
        raise HTTPException(
            status_code=504,
            detail="Empty"
        )
    return res