from sqlmodel import Session, select

from app.models.command import EnumCommandStatus, EnumCommandType, CommandType, CommandStatus
from app.models.telemetry import EnumDeviceType, DeviceType

var_cmd_status: dict[str, int] | None = None
var_cmd_type: dict[str, int] | None = None
var_device_type: dict[str, int] | None = None

def seeding_to_db(db: Session):
    statement = (
        select(CommandType)
    )
    res = db.exec(statement=statement).all()

    if len(res) == 0:
        print("Seeding CommandType...")
        for cmd in EnumCommandType:
            db.add(CommandType(desc=cmd.value))

    statement = (
        select(CommandStatus)
    )
    res = db.exec(statement=statement).all()

    if len(res) == 0:
        print("Seeding CommandStatus...")
        for stat in EnumCommandStatus:
            db.add(CommandStatus(desc=stat.value))

    statement = (
        select(DeviceType)
    )
    res = db.exec(statement=statement).all()

    if len(res) == 0:
        print("Seeding DeviceType...")
        for dev_type in EnumDeviceType:
            db.add(DeviceType(desc=dev_type.value))

    db.commit()

def get_global_var(db: Session):
    global var_cmd_status, var_cmd_type, var_device_type

    if var_cmd_status is None:
        res = db.exec(select(CommandStatus)).all()

        var_cmd_status = {
            stat.desc: stat.id
            for stat in res
            if stat.desc and stat.id
        }

    if var_cmd_type is None:
        res = db.exec(select(CommandType)).all()

        var_cmd_type = {
            cmd.desc: cmd.id
            for cmd in res
            if cmd.desc and cmd.id
        }
    
    if var_device_type is None:
        res = db.exec(select(DeviceType)).all()

        var_device_type = {
            dev_type.desc: dev_type.id
            for dev_type in res
            if dev_type.id and dev_type.desc
        }

    return var_cmd_status, var_cmd_type, var_device_type