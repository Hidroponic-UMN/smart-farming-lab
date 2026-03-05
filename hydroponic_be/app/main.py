from fastapi import FastAPI
# from fastapi.routing import APIRoute
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.main import api_router
from app.db.session import engine, SQLModel
from app.services.mqtt_worker import mqtt_worker


@asynccontextmanager
async def lifespan(app: FastAPI):
    mqtt_worker.connect()
    mqtt_worker.loop_start()
    print("🚀 MQTT Worker started & Database tables verified.")
    
    yield

    mqtt_worker.loop_stop()
    mqtt_worker.disconnect()
    print("🛑 MQTT Worker disconnected.")

SQLModel.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart-Hydroponic",
    lifespan=lifespan,
    version="0.0.1"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "smart-hydro-backend"}