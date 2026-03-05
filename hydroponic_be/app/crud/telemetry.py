from sqlmodel import Session, select, desc

from app.models.telemetry import Log

def read_latest_racks_log_data(db: Session):
    statement = select(Log).distinct(Log.rack_id).order_by(Log.rack_id, desc(Log.timestamp))
    res = db.exec(statement=statement).all()
    return res

def read_log_by_rack_id(db: Session, rack_id: int):
    statement = select(Log).where(Log.rack_id==rack_id).order_by(Log.rack_id, desc(Log.timestamp))
    res = db.exec(statement=statement).all()
    return res