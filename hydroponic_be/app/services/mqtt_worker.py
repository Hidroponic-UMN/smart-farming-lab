import json
import threading
import paho.mqtt.client as mqtt
from typing import Callable, Dict

from app.core.config_dev import settings
from app.services.mqtt_handler import registering_handler, telemetry_handler, command_handler, ack_command_handler

class MQTTWorker:

    def __init__(self):
        self.client = mqtt.Client()
        self.handlers: Dict[str, Callable] = {}

        if settings.MQTT_USERNAME and settings.MQTT_PASSWORD:
            self.client.username_pw_set(
                settings.MQTT_USERNAME,
                settings.MQTT_PASSWORD
            )

        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message

        self.client.reconnect_delay_set(min_delay=1, max_delay=120)

        self._connected = False
        self._lock = threading.Lock()

    def connect(self):
        self.client.connect(
            settings.MQTT_BROKER,
            settings.MQTT_PORT,
            keepalive=60
        )

    def start(self):
        self.client.loop_start()

    def stop(self):
        self.client.loop_stop()
        self.client.disconnect()

    def subscribe(self, topic: str, handler: Callable):
        with self._lock:
            self.handlers[topic] = handler

        self.client.subscribe(topic)

    def publish(self, topic: str, payload: dict, qos: int = 1, retain: bool = False):
        message = json.dumps(payload)
        self.client.publish(
            topic,
            message,
            qos=qos,
            retain=retain
        )

    def on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            self._connected = True
            self.subscribe("device/register", registering_handler)
            self.subscribe("rack/+/data", telemetry_handler)
            self.subscribe("rack/+/cmd", command_handler)
            self.subscribe("rack/+/cmd/ack", ack_command_handler)
            print(f"Connected to MQTT Broker: {settings.MQTT_BROKER}")
        else:
            print(f"MQTT connection failed: {rc}")

    def on_message(self, client, userdata, msg):
        topic = msg.topic

        try:
            payload = json.loads(msg.payload.decode())
        except Exception:
            payload = msg.payload.decode()
        handler = self.handlers.get(topic)

        for sub, handler in self.handlers.items():
            if mqtt.topic_matches_sub(sub, topic):
                try:
                    handler(payload)
                except Exception as e:
                    print(f"MQTT handler error ({topic}): {e}")
    
    def is_connected(self) -> bool:
        return self._connected

mqtt_worker = MQTTWorker()