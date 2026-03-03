from fastapi import FastAPI
from fastapi.routing import APIRoute
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.main import api_router
from app.db.session import engine, BaseSQLModel
from app.services.mqtt_worker import mqtt_worker


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- STARTUP ---
    # Buat tabel jika belum ada (Opsional jika pakai Alembic)
    BaseSQLModel.metadata.create_all(bind=engine)
    
    # Jalankan MQTT Subscriber untuk 5 rak
    mqtt_worker.connect()
    mqtt_worker.loop_start()
    print("🚀 MQTT Worker started & Database tables verified.")
    
    yield
    
    # --- SHUTDOWN ---
    mqtt_worker.loop_stop()
    mqtt_worker.disconnect()
    print("🛑 MQTT Worker disconnected.")

# 2. Inisialisasi App
app = FastAPI(
    title="Smart-Hydroponic",
    lifespan=lifespan
)

#Nanti diganti ini masih buat dev aja
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app = FastAPI(
    title="Smart-Farming-Hydroponic"
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "smart-hydro-backend"}