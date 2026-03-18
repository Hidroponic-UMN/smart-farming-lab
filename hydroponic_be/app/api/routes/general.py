from typing import Annotated, List, Sequence
from datetime import datetime
from fastapi import APIRouter, Depends, Path, Query
from sqlmodel import Session

from app.db.session import get_session
from app.crud import general as crud_logs
from app.models.telemetry import Device

router = APIRouter(
    tags=["general info"],
    prefix="/generals"
)

@router.get("/devices", response_model=List[Device])
def read_all_device(
    db: Annotated[Session, Depends(get_session)]
):
    return crud_logs.read_all_device(db=db)

@router.get("/commandtypes")
def read_all_command_type(
    db: Annotated[Session, Depends(get_session)]
):
    return crud_logs.read_all_command_type(db=db)

@router.get("/commandstatus")
def read_all_command_status(
    db: Annotated[Session, Depends(get_session)]
):
    return crud_logs.read_all_command_status(db=db)