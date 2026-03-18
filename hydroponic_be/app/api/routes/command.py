from typing import Annotated, List, Sequence
from datetime import datetime
from fastapi import APIRouter, Depends, Path, Body, Query
from sqlmodel import Session
from fastapi.responses import StreamingResponse
import csv
import io

from app.db.session import get_session
from app.crud import command as crud_logs
from app.models.command import CommandLogBase, CmdInput

router = APIRouter(
    tags=["command logs"],
    prefix="/commandlogs"
)

file_export_name: str = 'Command_Log'



@router.get("/", response_model=List[CommandLogBase])
def read_all_command_log(
    db: Annotated[Session, Depends(get_session)],
    limit: Annotated[int | None, Query(title="Limit to retrieve the data", ge=1)] = None,
    start_date: Annotated[datetime | None, Query(title="Start Date")] = None,
    end_date: Annotated[datetime | None, Query(title="End Date")] = None,
    device_type_id: Annotated[int | None, Query()] = None
):
    return crud_logs.read_all_log(db=db, limit=limit, start_date=start_date, end_date=end_date, device_type_id=device_type_id)



@router.get("/{device_id}", response_model=List[CommandLogBase])
def read_command_logs_by_device_id(
    device_id: Annotated[int, Path(title="Device Id", ge=1, le=5)],
    db: Annotated[Session, Depends(get_session)],
    limit: Annotated[int | None, Query(title="Limit to retrieve the data",ge=1)] = None,
    start_date: Annotated[datetime | None, Query(title="Start Date")] = None,
    end_date: Annotated[datetime | None, Query(title="End Date")] = None
):
    return crud_logs.read_log_by_device_id(db=db, device_id=device_id, limit=limit, start_date=start_date, end_date=end_date)



@router.get("/exports/{file_type}")
def download_all_log_data(
    file_type: Annotated[str, Path(title="Export File type")],
    db: Annotated[Session, Depends(get_session)],
    limit: Annotated[int | None, Query(title="Limit to retrieve the data", ge=1)] = None,
    start_date: Annotated[datetime | None, Query(title="Start Date")] = None,
    end_date: Annotated[datetime | None, Query(title="End Date")] = None,
    device_type_id: Annotated[int | None, Query()] = None
):
    file_type = 'csv'
    rows: Sequence[CommandLogBase] = crud_logs.read_all_log(db=db, limit=limit, start_date=start_date, end_date=end_date, device_type_id=device_type_id)
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
            "Content-Disposition": f"attachment; filename=all_{file_export_name}.{file_type}"
        }
    )



@router.get("/export/{file_type}/{device_id}")
def download_all_log_data_by_device_id(
    file_type: Annotated[str, Path(title="Export File type")],
    device_id: Annotated[int, Path(title="Device Id", ge=1, le=5)],
    db: Annotated[Session, Depends(get_session)],
    limit: Annotated[int | None, Query(title="Limit to retrieve the data", ge=1)] = None,
    start_date: Annotated[datetime | None, Query(title="Start Date")] = None,
    end_date: Annotated[datetime | None, Query(title="End Date")] = None
):
    file_type = 'csv'
    rows: Sequence[CommandLogBase] = crud_logs.read_log_by_device_id(db=db, device_id=device_id, limit=limit, start_date=start_date, end_date=end_date)
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
            "Content-Disposition": f"attachment; filename=id_{device_id}_{file_export_name}.{file_type}"
        }
    )



@router.post("/{device_id}", response_model=CommandLogBase)
def send_command_by_device_id(
    device_id: Annotated[int, Path(title="Device Id", ge=1, le=5)],
    db: Annotated[Session, Depends(get_session)],
    command: Annotated[CmdInput, Body(title="Type of Command for Device")]
):
    return crud_logs.send_cmd_to_rack_id(db=db, device_id=device_id, command=command)