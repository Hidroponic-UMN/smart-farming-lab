from sqlmodel import Session, select, desc, col, asc
from sqlalchemy import func
from fastapi import HTTPException
from typing import Any, Sequence
from datetime import datetime, timezone

from app.models.telemetry import Device, DeviceType
from app.models.command import CommandType, CommandStatus

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