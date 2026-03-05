from typing import Annotated

from fastapi import APIRouter, Depends, Path
from sqlmodel import Session
from app.db.session import get_session
from app.crud import telemetry as crud_logs
from app.models.telemetry import Log

router = APIRouter(
    tags=["logs"],
    prefix="/logs"
)

@router.get("/", response_model=Log)
def read_latest_logs(db: Annotated[Session, Depends(get_session)]):
    return crud_logs.read_latest_racks_log_data(db=db)

@router.get("/{rack_id}", response_model=Log)
def read_log_by_rackid(
    rack_id: Annotated[int, Path(title="ID's of the rack", ge=1, le=5)],
    db: Annotated[Session, Depends(get_session)]
):
    return crud_logs.read_log_by_rack_id(db=db, rack_id=rack_id)
