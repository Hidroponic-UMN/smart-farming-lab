from sqlmodel import Session, select
from pydantic import ValidationError

from app.db.session import engine
from app.models.telemetry import DataLog, Device, TelemetryMicroController, RegisterMicroController
from app.models.command import CommandLog, CmdMicroController
from app.utils.utils_seeding import get_global_var

def registering_handler(self, payload, topic: str):
    try:
        validated_data = RegisterMicroController.model_validate(payload)
    except ValidationError as e:
        print(e)
        return

    mac_addr = validated_data.mac_addr
    attr = validated_data.attr
    desc = validated_data.desc
    with Session(engine) as db:
        exist = db.exec(select(Device).where(Device.mac_addr==mac_addr)).first()
        _, _, var_device_type = get_global_var(db=db)

        tmp = validated_data.type_id
        devicetype_id = var_device_type[tmp]
        if exist is None:
            device = Device(
                attr=attr,
                desc=desc,
                mac_addr=mac_addr,
                devicetype_id=devicetype_id
            )
            db.add(device)
            db.commit()
        else:
            print("Your Device had been registered")

        self.publish(topic, {"status": 1})

def telemetry_handler(self, payload, topic):
    try:
        TelemetryMicroController.model_validate(payload)
    except ValidationError as e:
        print(e)

    mac_addr = payload["mac_addr"]
    data = payload["data"]
    with Session(engine) as db:

        exist = db.exec(select(Device.id).where(Device.mac_addr==mac_addr)).first()

        if exist:
            data_log = DataLog(
                device_id=exist,
                data_log=data,
            )
            db.add(data_log)
            db.commit()
        else:
            print(f"Device: {mac_addr}, does not exits, please try to register your device first")

def ack_command_handler(self, payload, topic):
    try:
        CmdMicroController.model_validate(payload)
    except ValidationError as e:
        print(e)

    mac_addr = payload["mac_addr"]
    command = payload["command"]
    status = payload["status"]
    cmd_log = payload["cmd_log"]
    with Session(engine) as db:
        cmd_status, cmd_type, _ = get_global_var(db=db)
        device_id = db.exec(select(Device.id).where(Device.mac_addr == mac_addr)).first()

        if command in cmd_type and status in cmd_status and device_id:
            command_id = cmd_type[command]
            status_id = cmd_status[status]

            cmd_log = CommandLog(
                command_id=command_id,
                status_id=status_id,
                device_id=device_id,
                cmd_log=cmd_log
            )
            db.add(cmd_log)
            db.commit()
        else:
            print(f"Device ID: {device_id}\nCommand ID: {command in cmd_type}\nStatus ID: {status in cmd_status}")