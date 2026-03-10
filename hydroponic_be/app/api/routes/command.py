from typing import Annotated, List, Sequence
from datetime import datetime
from fastapi import APIRouter, Depends, Path, Body, Query
from sqlmodel import Session
from fastapi.responses import StreamingResponse
import csv
import io

from app.db.session import get_session
from app.crud import command as crud_logs
from app.models.command import CmdLogBase, CmdInput

router = APIRouter(
    tags=["command logs"],
    prefix="/cmdlogs"
)



@router.get("/", response_model=List[CmdLogBase])
def read_all_log_data(
    db: Annotated[Session, Depends(get_session)],
    limit: Annotated[int | None, Query(title="Limit to retrieve the data", ge=1)] = None,
    start_date: Annotated[datetime | None, Query(title="Start Date")] = None,
    end_date: Annotated[datetime | None, Query(title="End Date")] = None
):
    return crud_logs.read_all_log(db=db, limit=limit, start_date=start_date, end_date=end_date)



@router.get("/export/{file_type}")
def download_all_log_data(
    file_type: Annotated[str, Path(title="Export File type", default='csv')],
    db: Annotated[Session, Depends(get_session)],
    limit: Annotated[int | None, Query(title="Limit to retrieve the data", ge=1)] = None,
    start_date: Annotated[datetime | None, Query(title="Start Date")] = None,
    end_date: Annotated[datetime | None, Query(title="End Date")] = None
):
    file_type = 'csv'
    rows: Sequence[CmdLogBase] = crud_logs.read_all_log(db=db, limit=limit, start_date=start_date, end_date=end_date)
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["command_id", "status_id", "device_id", "created_by", "timestamp"])

    for r in rows:
        writer.writerow([r.command_id, r.status_id, r.device_id, r.created_by, r.timestamp])

    output.seek(0)
    return StreamingResponse(
        output,
        media_type=f"text/{file_type}",
        headers={
            "Content-Disposition": f"attachment; filename=datalog.{file_type}"
        }
    )



@router.post("/{device_id}", response_model=CmdLogBase)
def send_command_by_device_id(
    device_id: Annotated[int, Path(title="Device Id", ge=1, le=5)],
    db: Annotated[Session, Depends(get_session)],
    command: Annotated[CmdInput, Body(title="Type of Command for Device")]
):
    return crud_logs.send_cmd_to_rack_id(db=db, device_id=device_id, command=command)



@router.get("/{device_id}", response_model=List[CmdLogBase])
def read_command_logs_by_device_id(
    device_id: Annotated[int, Path(title="Device Id", ge=1, le=5)],
    db: Annotated[Session, Depends(get_session)],
    limit: Annotated[int | None, Query(title="Limit to retrieve the data",ge=1)] = None,
    start_date: Annotated[datetime | None, Query(title="Start Date")] = None,
    end_date: Annotated[datetime | None, Query(title="End Date")] = None
):
    return crud_logs.read_log_by_device_id(db=db, device_id=device_id, limit=limit, start_date=start_date, end_date=end_date)