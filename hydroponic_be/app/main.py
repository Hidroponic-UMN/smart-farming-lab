from fastapi import FastAPI
import logging
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

from app.api.main import api_router
from app.db.session import engine, Session
from app.services.mqtt_worker import mqtt_worker
from app.utils.utils_seeding import seeding_to_db
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # BaseModel.metadata.create_all(bind=engine) #Comment this, Alembic will autogenerate it
    with Session(engine) as db:
        seeding_to_db(db)

    mqtt_worker.connect()
    mqtt_worker.start()

    print("MQTT Worker started & Database tables verified.")

    yield

    mqtt_worker.stop()
    print("MQTT Worker disconnected.")


app = FastAPI(title="Smart-Hydroponic", lifespan=lifespan, version="0.0.1")

@app.on_event("startup")
async def startup_event():
    # Mask the password so it doesn't leak into production text logs
    masked_url = settings.DATABASE_URL.split("@")[-1]
    logger.info(f"🚀 Hydroponics Backend successfully booted!")
    logger.info(f"🔐 Connecting to Database via user: '{settings.APP_DB_USER}'")
    logger.info(f"📍 Database Target Host/DB: {masked_url}")

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
