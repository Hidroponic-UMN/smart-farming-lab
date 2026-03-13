from sqlmodel import Session, select
from datetime import datetime, timezone
from pydantic import ValidationError

from app.db.session import engine
from app.models.telemetry import DataLog, Device, TelemetryMicroController, RegisterMicroController
from app.models.command import CmdLog, CmdMicroController
from app.utils.utils_seeding import get_var_cmd

def registering_handler(payload):
    try:
        RegisterMicroController.model_validate(payload)
    except ValidationError as e:
        print(e)

    mac_addr = payload["mac_addr"]
    desc = payload["desc"]
    with Session(engine) as db:
        exist = db.exec(select(Device).where(Device.mac_addr==mac_addr)).first()
        
        if exist is None:
            device = Device(
                desc=desc,
                mac_addr=mac_addr
            )
            db.add(device)
            db.commit()
        else:
            print("Your Device had been registered")

def telemetry_handler(payload):
    try:
        TelemetryMicroController.model_validate(payload)
    except ValidationError as e:
        print(e)

    mac_addr = payload["mac_addr"]
    data = payload["data"]
    print(payload)
    print(data)
    with Session(engine) as db:

        exist = db.exec(select(Device.id).where(Device.mac_addr==mac_addr)).first()

        if exist:
            data_log = DataLog(
                device_id=exist,
                data_log=data,
            )
            db.add(data_log)
            db.commit()
            db.refresh(data_log)
            print(data_log)
        else:
            print(f"Device: {mac_addr}, does not exits, please try to register your device first")

def command_handler(payload):
    pass

def ack_command_handler(payload):
    try:
        CmdMicroController.model_validate(payload)
    except ValidationError as e:
        print(e)
    
    mac_addr = payload["mac_addr"]
    command = payload["command"]
    status = payload["status"]
    with Session(engine) as db:
        cmd_status, cmd_type = get_var_cmd(db=db)
        device_id = db.exec(select(Device.id).where(Device.mac_addr == mac_addr)).first()

        if command in cmd_type and status in cmd_status and device_id:
            command_id = cmd_type[command]
            status_id = cmd_status[status]

            cmd_log = CmdLog(
                command_id=command_id,
                status_id=status_id,
                device_id=device_id
            )
            db.add(cmd_log)
            db.commit()
        else:
            print(f"Device ID: {device_id}\nCommand ID: {command in cmd_type}\nStatus ID: {status in cmd_status}")