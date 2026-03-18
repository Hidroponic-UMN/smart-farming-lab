from typing import Annotated, List, Sequence
from datetime import datetime
from fastapi import APIRouter, Depends, Path, Query
from sqlmodel import Session
from fastapi.responses import StreamingResponse
import csv
import io

from app.db.session import get_session
from app.crud import telemetry as crud_logs
from app.models.telemetry import DataLogBase

router = APIRouter(
    tags=["data logs"],
    prefix="/datalogs"
)

file_export_name: str = 'Telemetry_Log'



@router.get("/", response_model=List[DataLogBase])
def read_all_data_log(
    db: Annotated[Session, Depends(get_session)],
    limit: Annotated[int | None, Query(title="Limit to retrieve the data", ge=1)] = None,
    start_date: Annotated[datetime | None, Query(title="Start Date")] = None,
    end_date: Annotated[datetime | None, Query(title="End Date")] = None,
    device_type_id: Annotated[int | None, Query()] = None
):
    return crud_logs.read_all_log(db=db, limit=limit, start_date=start_date, end_date=end_date, device_type_id=device_type_id)



@router.get("/latest", response_model=List[DataLogBase])
def read_latest_log_all_devices(db: Annotated[Session, Depends(get_session)]):
    return crud_logs.read_latest_device_log_data(db=db)



@router.get("/{device_id}", response_model=List[DataLogBase])
def read_data_logs_by_device_id(
    device_id: Annotated[int, Path(title="ID's of the device", ge=1, le=5)],
    db: Annotated[Session, Depends(get_session)],
    limit: Annotated[int | None, Query(title="Limit to retrieve the data", ge=1)] = None,
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
    rows: Sequence[DataLogBase] = crud_logs.read_all_log(db=db, limit=limit, start_date=start_date, end_date=end_date, device_type_id=device_type_id)
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["device_id", "data_log", "timestamp"])

    for r in rows:
        writer.writerow([r.device_id, r.data_log, r.timestamp])
    
    output.seek(0)
    return StreamingResponse(
        output,
        media_type=f"text/{file_type}",
        headers={
            "Content-Disposition": f"attachment; filename=all_{file_export_name}.{file_type}"
        }
    )



@router.get("/export/{device_id}/{file_type}")
def download_all_log_data_by_device_id(
    file_type: Annotated[str, Path(title="Export File type")],
    device_id: Annotated[int, Path(title="Device Id", ge=1, le=5)],
    db: Annotated[Session, Depends(get_session)],
    limit: Annotated[int | None, Query(title="Limit to retrieve the data", ge=1)] = None,
    start_date: Annotated[datetime | None, Query(title="Start Date")] = None,
    end_date: Annotated[datetime | None, Query(title="End Date")] = None
):
    file_type = 'csv'
    rows: Sequence[DataLogBase] = crud_logs.read_log_by_device_id(db=db, device_id=device_id, limit=limit, start_date=start_date, end_date=end_date)
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["device_id", "data_log", "timestamp"])

    for r in rows:
        writer.writerow([r.device_id, r.data_log, r.timestamp])
    
    output.seek(0)
    return StreamingResponse(
        output,
        media_type=f"text/{file_type}",
        headers={
            "Content-Disposition": f"attachment; filename=id_{device_id}_{file_export_name}.{file_type}"
        }
    )