from sqlmodel import Session, select, desc, col
from sqlalchemy import func, cast, Integer
from fastapi import HTTPException
from typing import Any, Sequence, Dict
from datetime import datetime, timezone

from app.models.telemetry import Device, EnumDeviceType, DeviceType
from app.models.command import CommandLog, CmdInput, EnumCommandStatus, CmdMicroController, JSONInput
from app.services.mqtt_worker import mqtt_worker
from app.utils.utils_seeding import get_global_var

def read_all_log(db: Session, limit: int | None, start_date: datetime | None, end_date: datetime | None, device_type: str | None) -> Sequence[Any]:
    device_type_id: int | None
    if device_type is None:
        device_type = "HYDROPONIC_RACKS"
        _, _, var_device_type = get_global_var(db=db)
        device_type_id = var_device_type[device_type]
    else:
        device_type = device_type if device_type in (m.value for m in EnumDeviceType) else "HYDROPONIC_RACKS"
        _, _, var_device_type = get_global_var(db=db)
        device_type_id = var_device_type[device_type]

    statement = (
        select(
            CommandLog.command_id,
            CommandLog.status_id,
            CommandLog.device_id,
            CommandLog.created_by,
            CommandLog.cmd_log,
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
            status_code=404,
            detail="Empty"
        )
    return res

def read_latest_cmd_log_data(db: Session, device_type: str | None, device_id: int | None):
    device_type_id: int | None
    if device_type is None:
        device_type = "HYDROPONIC_RACKS"
        _, _, var_device_type = get_global_var(db=db)
        device_type_id = var_device_type[device_type]
    else:
        device_type = device_type if device_type in (m.value for m in EnumDeviceType) else "HYDROPONIC_RACKS"
        _, _, var_device_type = get_global_var(db=db)
        device_type_id = var_device_type[device_type]

    statement = (
        select(
            CommandLog.command_id,
            CommandLog.status_id,
            CommandLog.device_id,
            CommandLog.cmd_log,
            func.timezone('Asia/Jakarta', CommandLog.timestamp).label("timestamp"),
            cast(Device.attr["rack_id"].as_string(), Integer).label("rack_id") # type: ignore
        )
        .distinct(CommandLog.device_id) # type: ignore
        .join(Device, Device.id == CommandLog.device_id) # type: ignore
        .join(DeviceType, DeviceType.id == Device.devicetype_id) # type: ignore
        .where(Device.devicetype_id == device_type_id) # type: ignore
        .order_by(CommandLog.device_id, desc(CommandLog.timestamp)) # type: ignore
    )

    if device_id:
        statement = statement.where(CommandLog.device_id == device_id)

    res = db.exec(statement=statement).all()

    if not res:
        raise HTTPException(
            status_code=404,
            detail="No data"
        )
    return res

def send_cmd_to_rack_id(db: Session, rack_id: int, command: CmdInput, input_json: JSONInput):
    if mqtt_worker.is_connected():
        cmd_status, cmd_type, _ = get_global_var(db=db)

        if command.command_type.value not in cmd_type:
            raise HTTPException(
                status_code=504,
                detail=f"Command {command.command_type.value} does not exist in Database"
            )

        command_id = cmd_type[command.command_type.value]
        status_id = cmd_status[EnumCommandStatus.PENDING.value]
        data = db.exec(select(Device).where(cast(Device.attr["rack_id"].as_string(), Integer) == rack_id)).first()

        if data:
            payload: dict[str, Any] = vars(
                CmdMicroController(
                    mac_addr=data.mac_addr,
                    command=command.command_type.value,
                    status=EnumCommandStatus.START.value,
                    cmd_log=input_json.model_dump()
                )
            )

            cmd_log = CommandLog(
                device_id=data.id, # type: ignore
                command_id=command_id,
                status_id=status_id,
                cmd_log=input_json.model_dump()
            )

            db.add(cmd_log)
            db.commit()
            db.refresh(cmd_log)

            mqtt_worker.publish(f"rack/{rack_id}/cmd", payload=payload)
            return cmd_log
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Device id {rack_id} has not exist yet in your Database"
            )
    raise HTTPException(
        status_code=501,
        detail="MQTT broker not connected"
    )

def read_log_by_device_id(db: Session, device_id: int, limit: int | None, start_date: datetime | None, end_date: datetime | None) -> Sequence[Any]:
    statement = (
        select(
            CommandLog.command_id,
            CommandLog.status_id,
            CommandLog.device_id,
            CommandLog.created_by,
            CommandLog.cmd_log,
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
            status_code=404,
            detail="Empty"
        )
    return res