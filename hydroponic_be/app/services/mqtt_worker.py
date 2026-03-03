import json
import paho.mqtt.client as mqtt
from sqlmodel import Session
from app.core.config import settings
from app.db.session import engine
from app.models.telemetry import Telemetry # Kita asumsikan model sudah dibuat

class MQTTWorker:
    def __init__(self):
        self.client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
        
        # Setup Authentication jika ada
        if settings.MQTT_USERNAME and settings.MQTT_PASSWORD:
            self.client.username_pw_set(settings.MQTT_USERNAME, settings.MQTT_PASSWORD)
            
        # Assign callback functions
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message

    def on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            print(f"✅ Connected to MQTT Broker: {settings.MQTT_BROKER}")
            # Subscribe ke topic untuk semua rak
            client.subscribe(settings.MQTT_TOPIC)
        else:
            print(f"❌ Failed to connect, return code {rc}")

    def on_message(self, client, userdata, msg):
        try:
            # 1. Decode payload (Asumsi JSON dari ESP Master)
            # Contoh: {"rack_id": 1, "ph": 6.2, "tds": 850.0, "water_temp": 26.5}
            payload = json.loads(msg.payload.decode())
            print(f"📩 Received data from Rack {payload.get('rack_id')}")

            # 2. Simpan ke Database menggunakan SQLModel Session
            with Session(engine) as session:
                new_telemetry = Telemetry(
                    rack_id=payload["rack_id"],
                    ph=payload["ph"],
                    tds=payload["tds"],
                    water_temp=payload["water_temp"]
                )
                session.add(new_telemetry)
                session.commit()
                # session.refresh(new_telemetry) # Opsional jika butuh ID-nya balik
                
        except Exception as e:
            print(f"⚠️ Error processing MQTT message: {e}")

    def connect(self):
        self.client.connect(settings.MQTT_BROKER, settings.MQTT_PORT, 60)

    def loop_start(self):
        self.client.loop_start()

    def loop_stop(self):
        self.client.loop_stop()

    def disconnect(self):
        self.client.disconnect()

# Singleton instance
mqtt_worker = MQTTWorker()