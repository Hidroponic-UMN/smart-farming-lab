from sqlmodel import Session, select, asc
from fastapi import HTTPException

from app.models.command import CommandType, CommandStatus
from app.models.telemetry import Device, DeviceType

def read_all_device(db: Session):
    statement = (
        select(Device)
        .join(DeviceType, DeviceType.id == Device.devicetype_id) # type: ignore
        .order_by(asc(Device.id))
    )
    res = db.exec(statement=statement).all()

    if len(res) == 0:
        raise HTTPException(
            status_code=404,
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
            status_code=404,
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
            status_code=404,
            detail="Empty"
        )
    return res

def update_device_attr(db: Session, device_id: int, new_attr: dict):
    device = db.get(Device, device_id)
    if not device:
        # Create a dummy device for this rack so we can store its attributes
        device = Device(
            id=device_id,
            desc=f"Hydroponic Rack {device_id}",
            mac_addr=f"dummy-mac-{device_id}",
            devicetype_id=1, # 1 corresponds to HYDROPONIC_RACKS
            attr={}
        )
        db.add(device)
        db.commit()
        db.refresh(device)
    
    # Merge existing attr with new_attr
    current_attr = dict(device.attr) if device.attr is not None else {}
    current_attr.update(new_attr)
    device.attr = current_attr
    
    # In some SQLAlchemy versions, mutating a JSON object requires flag_modified
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(device, "attr")
    
    db.add(device)
    db.commit()
    db.refresh(device)
    return device