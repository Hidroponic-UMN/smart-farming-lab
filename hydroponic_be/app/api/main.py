from fastapi import APIRouter

from app.api.routes import telemetry
from app.api.routes import command

api_router = APIRouter()
api_router.include_router(telemetry.router)
api_router.include_router(command.router)