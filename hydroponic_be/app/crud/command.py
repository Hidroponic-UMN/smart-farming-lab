from sqlmodel import Session, select, desc, col
from sqlalchemy import func
from fastapi import HTTPException
from typing import Any, Sequence
from datetime import datetime, timezone

from app.models.telemetry import Device
from app.models.command import CmdLog, CmdInput, CmdStatus, CmdMicroController
from app.services.mqtt_worker import mqtt_worker
from app.utils.utils_seeding import get_var_cmd

def read_all_log(db: Session, limit: int | None, start_date: datetime | None, end_date: datetime | None) -> Sequence[Any]:
    statement = (
        select(
            CmdLog.command_id,
            CmdLog.status_id,
            CmdLog.device_id,
            CmdLog.created_by,
            func.timezone('Asia/Jakarta', CmdLog.timestamp).label("timestamp"),
        ).order_by(desc(CmdLog.timestamp), CmdLog.device_id) # type: ignore
    )

    if limit:
        statement = statement.limit(limit=limit)
    if start_date:
        start_date = start_date.astimezone(timezone.utc)
        statement = statement.where(CmdLog.timestamp >= start_date)
    if end_date:
        end_date = end_date.astimezone(timezone.utc)
        statement = statement.where(CmdLog.timestamp <= end_date)

    res = db.exec(statement=statement).all()
    if len(res) == 0:
        raise HTTPException(
            status_code=504,
            detail="Empty"
        )
    return res

def send_cmd_to_rack_id(db: Session, device_id: int, command: CmdInput):
    if mqtt_worker.is_connected():
        cmd_status, cmd_type = get_var_cmd(db=db)

        if command.command_type.value not in cmd_type:
            raise HTTPException(
                status_code=504,
                detail=f"Command {command.command_type.value} does not exist in Database"
            )

        command_id = cmd_type[command.command_type.value] 
        status_id = cmd_status[CmdStatus.PENDING.value]
        mac_addr = db.exec(select(Device.mac_addr).where(Device.id == device_id)).first()
        
        if mac_addr:
            payload: dict[str, Any] = vars(
                CmdMicroController(mac_addr=mac_addr, command=command.command_type.value, status=CmdStatus.PENDING.value)
            )

            cmd_log = CmdLog(
                device_id=device_id,
                command_id=command_id,
                status_id=status_id,
                created_by=command.created_by
            )

            db.add(cmd_log)
            db.commit()
            db.refresh(cmd_log)

            mqtt_worker.publish(f"rack/{device_id}/cmd", payload=payload)
            return cmd_log
        else:
            raise HTTPException(
                status_code=504,
                detail=f"Device id {device_id} does not exist in Database"
            )
    raise HTTPException(
        status_code=504,
        detail="MQTT broker not connected"
    )

def read_log_by_device_id(db: Session, device_id: int, limit: int | None, start_date: datetime | None, end_date: datetime | None) -> Sequence[Any]:
    statement = (
        select(
            CmdLog.command_id,
            CmdLog.status_id,
            CmdLog.device_id,
            CmdLog.created_by,
            func.timezone('Asia/Jakarta', col(CmdLog.timestamp)).label("timestamp"),
        ).where(col(CmdLog.device_id == device_id)).order_by(desc(col(CmdLog.timestamp))) # type: ignore
    )

    if limit:
        statement = statement.limit(limit=limit)
    if start_date:
        start_date = start_date.astimezone(timezone.utc)
        statement = statement.where(CmdLog.timestamp >= start_date)
    if end_date:
        end_date = end_date.astimezone(timezone.utc)
        statement = statement.where(CmdLog.timestamp <= end_date)

    res = db.exec(statement=statement).all()
    if len(res) == 0:
        raise HTTPException(
            status_code=504,
            detail="Empty"
        )
    return res