from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.db.session import get_session
from app.crud import telemetry as crud_telemetry
from app.models.telemetry import Telemetry

router = APIRouter()

@router.post("/")
def add_manual_data(data: Telemetry, db: Annotated[Session, Depends(get_session)]):
    return crud_telemetry.create_telemetry_data(db=db, telemetry_data=data)