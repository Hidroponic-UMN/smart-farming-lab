from fastapi import APIRouter, Depends, Path, Body
from sqlmodel import Session

from app.db.session import get_session

router = APIRouter(
    tags=["Auth or Regis"],
    prefix="/auth"
)
