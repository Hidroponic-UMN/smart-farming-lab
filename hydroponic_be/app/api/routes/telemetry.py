from typing import Annotated, List

from fastapi import APIRouter, Depends, Path, Query
from sqlmodel import Session
from app.db.session import get_session
from app.crud import telemetry as crud_logs
from app.models.telemetry import DataLogBase

router = APIRouter(
    tags=["data logs"],
    prefix="/datalogs"
)

@router.get("/", response_model=List[DataLogBase])
def read_latest_logs(db: Annotated[Session, Depends(get_session)]):
    return crud_logs.read_latest_device_logs_data(db=db)

@router.get("/{device_id}/", response_model=List[DataLogBase])
def read_latest_logs_by_device_id(
    device_id: Annotated[int, Path(title="ID's of the device", ge=1, le=5)],
    db: Annotated[Session, Depends(get_session)],
    limit: Annotated[int, Query(title="Limit to retrieve the data", ge=1)] = 1
):
    return crud_logs.read_log_by_device_id(db=db, device_id=device_id, limit=limit)
