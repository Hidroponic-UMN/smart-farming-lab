from sqlmodel import Session, select, desc, col
from sqlalchemy import func
from fastapi import HTTPException
from typing import Any, Sequence
from datetime import datetime, timezone

from app.models.telemetry import Device
from app.models.command import CommandLog, CmdInput, EnumCommandStatus, CmdMicroController
from app.services.mqtt_worker import mqtt_worker
from app.utils.utils_seeding import get_global_var

def read_all_log(db: Session, limit: int | None, start_date: datetime | None, end_date: datetime | None, device_type_id: int | None) -> Sequence[Any]:
    statement = (
        select(
            CommandLog.command_id,
            CommandLog.status_id,
            CommandLog.device_id,
            CommandLog.created_by,
            func.timezone('Asia/Jakarta', CommandLog.timestamp).label("timestamp"),
        ) # type: ignore
        .join(Device, Device.id == CommandLog.device_id)
        .order_by(desc(CommandLog.timestamp), CommandLog.device_id) # type: ignore
    )

    if device_type_id:
        statement = statement.where(Device.devicetype_id == device_type_id)
    if limit:
        statement = statement.limit(limit=limit)
    if start_date:
        start_date = start_date.astimezone(timezone.utc)
        statement = statement.where(CommandLog.timestamp >= start_date)
    if end_date:
        end_date = end_date.astimezone(timezone.utc)
        statement = statement.where(CommandLog.timestamp <= end_date)

    res = db.exec(statement=statement).all()
    if len(res) == 0:
        raise HTTPException(
            status_code=504,
            detail="Empty"
        )
    return res

def send_cmd_to_rack_id(db: Session, device_id: int, command: CmdInput):
    if mqtt_worker.is_connected():
        cmd_status, cmd_type, _ = get_global_var(db=db)

        if command.command_type.value not in cmd_type:
            raise HTTPException(
                status_code=504,
                detail=f"Command {command.command_type.value} does not exist in Database"
            )

        command_id = cmd_type[command.command_type.value] 
        status_id = cmd_status[EnumCommandStatus.PENDING.value]
        data = db.exec(select(Device.mac_addr, Device.attr).where(Device.id == device_id)).first()
        
        if data:
            mac_addr = data[0]
            attr = data[1]

            payload: dict[str, Any] = vars(
                CmdMicroController(mac_addr=mac_addr, command=command.command_type.value, status=EnumCommandStatus.PENDING.value)
            )

            cmd_log = CommandLog(
                device_id=device_id,
                command_id=command_id,
                status_id=status_id,
                created_by=command.created_by
            )

            db.add(cmd_log)
            db.commit()
            db.refresh(cmd_log)

            rack_id = attr["rack_id"]
            mqtt_worker.publish(f"rack/{rack_id}/cmd", payload=payload)
            return cmd_log
        else:
            raise HTTPException(
                status_code=504,
                detail=f"Device id {device_id} has not exist yet in your Database"
            )
    raise HTTPException(
        status_code=504,
        detail="MQTT broker not connected"
    )

def read_log_by_device_id(db: Session, device_id: int, limit: int | None, start_date: datetime | None, end_date: datetime | None) -> Sequence[Any]:
    statement = (
        select(
            CommandLog.command_id,
            CommandLog.status_id,
            CommandLog.device_id,
            CommandLog.created_by,
            func.timezone('Asia/Jakarta', col(CommandLog.timestamp)).label("timestamp"),
        ).where(col(CommandLog.device_id == device_id)).order_by(desc(col(CommandLog.timestamp))) # type: ignore
    )

    if limit:
        statement = statement.limit(limit=limit)
    if start_date:
        start_date = start_date.astimezone(timezone.utc)
        statement = statement.where(CommandLog.timestamp >= start_date)
    if end_date:
        end_date = end_date.astimezone(timezone.utc)
        statement = statement.where(CommandLog.timestamp <= end_date)

    res = db.exec(statement=statement).all()
    if len(res) == 0:
        raise HTTPException(
            status_code=504,
            detail="Empty"
        )
    return res