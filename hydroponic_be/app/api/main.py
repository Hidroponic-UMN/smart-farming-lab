from fastapi import APIRouter

from app.api.routes import logs

api_router = APIRouter()
api_router.include_router(logs.router)
