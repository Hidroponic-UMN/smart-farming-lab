from typing import Annotated, List

from fastapi import APIRouter, Depends, Path, Body
from sqlmodel import Session
from app.db.session import get_session
from app.crud import command as crud_logs
from app.models.command import CmdLogBase, CmdInput

router = APIRouter(
    tags=["command logs"],
    prefix="/cmdlogs"
)

@router.post("/{device_id}", response_model=CmdLogBase)
def send_command_by_device_id(
    device_id: Annotated[int, Path(title="Rack Id", ge=1, le=5)],
    db: Annotated[Session, Depends(get_session)],
    command: Annotated[CmdInput, Body()]
):
    return crud_logs.send_cmd_to_rack_id(db=db, device_id=device_id, command=command)