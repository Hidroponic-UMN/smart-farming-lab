import json
import paho.mqtt.client as mqtt
from sqlmodel import Session, select
from datetime import datetime, timezone

from app.core.config import settings
from app.db.session import engine
from app.models.telemetry import Log, Rack

class MQTTWorker:
    def __init__(self):
        self.client = mqtt.Client()
        
        if settings.MQTT_USERNAME and settings.MQTT_PASSWORD:
            self.client.username_pw_set(settings.MQTT_USERNAME, settings.MQTT_PASSWORD)
            
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message

    def on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            print(f"Connected to MQTT Broker: {settings.MQTT_BROKER}")
            client.subscribe(settings.MQTT_TOPIC)
        else:
            print(f"Failed to connect, return code {rc}")

    def on_message(self, client, userdata, msg):
        try:
            payload = json.loads(msg.payload.decode("utf-8"))
            
            if not isinstance(payload, list):
                print("Expected a list of logs, but got something else.")
                return

            with Session(engine) as session:
                existing_racks = session.exec(select(Rack.id)).all()
                existing_rack_ids = set(existing_racks)

                for item in payload:
                    r_id = item.get("rack_id")

                    if r_id not in existing_rack_ids:
                        new_rack = Rack(id=r_id, desc=f"Rack {r_id}")
                        session.add(new_rack)
                        existing_rack_ids.add(r_id)
                        session.flush()
                    
                    if r_id is not None:
                        new_log = Log(
                            rack_id=r_id,
                            data_log=item, # The whole dict goes into JSONB
                            timestamp=datetime.now(timezone.utc)
                        )
                        session.add(new_log)

                session.commit()

        except Exception as e:
            print(f"Error during bulk insert: {e}")

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