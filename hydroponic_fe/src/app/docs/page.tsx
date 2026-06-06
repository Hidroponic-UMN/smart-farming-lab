"use client";

import { CodeBlock } from "@/components/docs/code-block";

export default function DocsPage() {
  const mqttRegistrationPayload = `{
  "mac_addr": "f4c1e01b-46e7-42c5-9f69-05d67a5a6a5b",
  "type_id": "HYDROPONIC_RACKS",
  "desc": "Buat Rack Hydroponic",
  "attr": {
    "about": "ini esp32 untuk rack 1",
    "rack_id": "1"
  }
}`;

  const mqttTelemetryPayload = `{
  "mac_addr": "f4c1e01b-46e7-42c5-9f69-05d67a5a6a5b",
  "data": {
    "ph": 6.52,
    "ec": 1245.00,
    "water_temp": 25.3,
    "water_level": 42.5,
    "flow_rate": 2.15,
    "light_intensity": 18500
  }
}`;

  const mqttRoomPayload = `{
  "mac_addr": "c7b7fae9-34f6-4cc9-8f48-03c295629ed3",
  "data": {
    "temperature": 26.5,
    "humidity": 62.0
  }
}`;

  const mqttCommandPayload = `{
  "mac_addr": "f4c1e01b-...",
  "command": "KALIBRASI_PH",
  "status": "START",
  "cmd_log": {"known_value": 7.0}
}`;

  const mqttAckPayload = `{
  "mac_addr": "f4c1e01b-...",
  "command": "KALIBRASI_PH",
  "status": "SUCCESS",
  "cmd_log": {"known_value": 7.0, "ph": 6.98}
}`;

  const mermaidArchitecture = `graph TD
    subgraph Edge Layer [Hardware & IoT Layer]
        ESP_1[ESP32 - Rack 1]
        ESP_2[ESP32 - Rack 2]
        ESP_N[ESP32 - Rack N]
        ESP_Room[Wemos D1 - Room Monitor]
    end

    subgraph Data & Logic Layer [Backend & DB Layer]
        MQTT[Mosquitto MQTT Broker]
        BE[FastAPI Backend\\nMQTT Worker Thread]
        DB[(PostgreSQL)]
    end

    subgraph Presentation Layer [Frontend Layer]
        FE_API[Next.js API Routes\\nIn-memory cache]
        FE_UI[Next.js Client Components]
    end

    ESP_1 -- MQTT --> MQTT
    ESP_2 -- MQTT --> MQTT
    ESP_N -- MQTT --> MQTT
    ESP_Room -- MQTT --> MQTT

    MQTT -- Subscribe / Publish --> BE
    BE -- Read / Write --> DB

    FE_API -- HTTP REST --> BE
    FE_UI -- HTTP / Polling 3s --> FE_API`;

  const mermaidBootFlow = `sequenceDiagram
    participant ESP32
    participant Broker as MQTT Broker
    participant Backend as FastAPI

    ESP32->>ESP32: setup() Init sensors, load NVS
    ESP32->>Broker: Connect (username/password)
    ESP32->>Broker: Subscribe rack/{id}/cmd
    ESP32->>Broker: Publish device/{id}/register
    Broker->>Backend: Forward registration
    Backend->>Backend: Validate, create Device
    Backend->>Broker: Publish register/ack
    Broker->>ESP32: ACK → isRegistered = true

    loop Every 5 seconds
        ESP32->>ESP32: Read sensors + filtering
        ESP32->>Broker: Publish rack/{id}/data
        Broker->>Backend: Forward telemetry
        Backend->>Backend: Insert DataLog
    end`;

  const mermaidDB = `erDiagram
    DeviceType ||--o{ Device : "has"
    DeviceType {
        int id PK
        string desc
        jsonb attr
    }

    Device ||--o{ DataLog : "generates"
    Device ||--o{ CommandLog : "receives"
    Device {
        int id PK
        string mac_addr
        string desc
        jsonb attr
        int devicetype_id FK
    }

    DataLog {
        int device_id PK_FK
        datetime timestamp PK
        jsonb data_log
    }

    CommandType ||--o{ CommandLog : "defines"
    CommandType {
        int id PK
        string desc
        jsonb attr
    }

    CommandStatus ||--o{ CommandLog : "tracks"
    CommandStatus {
        int id PK
        string desc
        jsonb attr
    }

    CommandLog {
        int command_id PK_FK
        int status_id PK_FK
        int device_id PK_FK
        datetime timestamp PK
        string created_by
        jsonb cmd_log
    }`;

  const calibrationStruct = `struct PHCalibration {
  float slope;          // Default: 0.07
  float offset;         // Default: -161.0
  bool is_calibrated;
  int num_points;       // 0, 1, or 2
  float point1_voltage, point1_ph;   // pH 4.0 ref
  float point2_voltage, point2_ph;   // pH 7.0 ref
};

struct TDSCalibration {
  float slope;          // Default: 1.0
  float offset;         // Default: 0.0
  bool is_calibrated;
  int num_points;
  float point1_voltage, point1_tds;
  float point2_voltage, point2_tds;  // 1330 ppm ref
};`;

  const bashDev = `# Start Broker & DB
docker compose -f compose.prod.yml up broker db -d

# Start Backend
cd hydroponic_be
uv sync
source .venv/bin/activate
alembic upgrade head
uvicorn app.main:app --reload

# Start Frontend
cd hydroponic_fe
npm install
npm run dev`;

  const bashProd = `./start.prod.sh`;

  // Helper for chapter pills
  const ChapterPill = ({ text }: { text: string }) => (
    <span className="font-label-caps text-label-caps text-doc-primary bg-primary-fixed px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-4">
      {text}
    </span>
  );

  // Helper for info cards
  const InfoCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white/40 backdrop-blur-sm rounded-xl border border-glass-border p-6">
      <h4 className="font-bold text-doc-primary text-lg mb-3">{title}</h4>
      {children}
    </div>
  );

  return (
    <>
      {/* 1. Project Overview */}
      <section className="mb-section-gap" id="project-overview">
        <div className="mb-12">
          <ChapterPill text="Chapter 1" />
          <h2 className="font-headline-lg text-headline-lg text-doc-primary mb-6">Project Overview</h2>
          
          <h3 className="font-headline-md text-headline-md text-doc-primary mt-8 mb-4">1.1 Introduction</h3>
          <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed mb-6">
            The <strong className="text-doc-primary font-bold">Smart Farming Lab</strong> is an end-to-end IoT platform designed to monitor and control hydroponic racks in Lab Smart Farming C502, Universitas Multimedia Nusantara. The platform captures real-time telemetry (pH, EC, water temperature, water levels, water flow, and light intensity) from ESP32 controllers, stores the data for analytics, and provides a modern web interface for users to oversee the farm&apos;s status, track planting cycles, and perform sensor adjustments.
          </p>

          <h3 className="font-headline-md text-headline-md text-doc-primary mt-12 mb-6">1.2 Key Features</h3>
          
          <div className="space-y-8">
            <div>
              <h4 className="font-bold text-doc-primary text-xl mb-2">1.2.1 Real-time Telemetry Monitoring</h4>
              <p className="text-on-surface-variant leading-relaxed">
                The core dashboard provides a live, auto-refreshing view of the entire hydroponic farm. It polls data from the API every 3 seconds to ensure users always see the latest telemetry. Each sensor is displayed in a dedicated card with sparkline charts, trend percentage indicators, and threshold-based color coding.
              </p>
            </div>

            {/* Simplified Rack Card Preview */}
            <div className="w-full max-w-2xl bg-glass-surface backdrop-blur-xl border border-glass-border rounded-xl shadow-sm overflow-hidden transform hover:scale-[1.01] transition-transform duration-300 my-8">
              <div className="bg-gradient-to-br from-[#50705f] to-[#86a293] p-6 flex justify-between items-center text-white">
                <div>
                  <h4 className="font-headline-md text-headline-md">Hydroponic Rack #01</h4>
                  <p className="opacity-90 font-body-md">Lettuce - Growth Day 14</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs uppercase font-bold tracking-widest opacity-70">Status</span>
                  <span className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm font-bold">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    OPTIMAL
                  </span>
                </div>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/40">
                {[
                  { label: "PH", unit: "pH", value: "6.52", color: "bg-doc-secondary", width: "65%" },
                  { label: "WTR", unit: "LEVEL", value: "42.5", color: "bg-leaf-gradient-end", width: "42%" },
                  { label: "TMP", unit: "°C", value: "25.3", color: "bg-warning-amber", width: "45%" },
                ].map((s, i) => (
                  <div key={i} className="p-4 bg-white/60 backdrop-blur-md rounded-xl border border-glass-border shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className={`p-2 ${s.color}/10 rounded-lg ${s.color.replace('bg-', 'text-')} font-bold text-xs`}>{s.label}</div>
                      <span className="text-xs font-bold text-on-surface-variant/60">{s.unit}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold tabular-nums text-doc-primary">{s.value}</span>
                    </div>
                    <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                      <div className={`${s.color} h-full rounded-full`} style={{ width: s.width }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-doc-primary text-xl mb-2">1.2.2 Historical Data Visualization</h4>
              <p className="text-on-surface-variant leading-relaxed">
                Time-series area charts built with Recharts. Users can filter by time ranges (1 Hour, 6 Hours, 24 Hours, 7 Days). Each sensor has a unique color and gradient fill. Contextual time formatting adjusts axis labels based on selected range.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-doc-primary text-xl mb-2">1.2.3 Sensor Adjustment Wizard</h4>
              <p className="text-on-surface-variant leading-relaxed">
                A guided, step-by-step UI to calibrate pH (2-point with buffer pH 4.0 &amp; 7.0) and TDS (1-point with 1330 ppm reference). Commands are sent to ESP32 via MQTT. The wizard polls for acknowledgment with a 30-second timeout. Calibration coefficients are saved to ESP32 flash memory (NVS).
              </p>
            </div>

            <div>
              <h4 className="font-bold text-doc-primary text-xl mb-2">1.2.4 Hydroponic Planting Tracker</h4>
              <p className="text-on-surface-variant leading-relaxed">
                Record planting dates per rack. The system calculates &quot;Day X&quot; automatically. Uses the JSONB <code>attr</code> field (<code>planted_at</code>) in PostgreSQL — no schema migration needed. Includes &quot;Harvest/Reset&quot; functionality.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-doc-primary text-xl mb-2">1.2.5 Threshold Alerts &amp; Notifications</h4>
              <p className="text-on-surface-variant leading-relaxed">
                A reactive notification engine (<code>useNotifications()</code>) that monitors sensor values against configurable bounds. Alerts trigger only on <strong>state transitions</strong> (not repeated), with smart remediation messages per sensor and deviation direction. Suppresses alerts on first load to prevent flooding.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-doc-primary text-xl mb-2">1.2.6 Data Simulation System</h4>
              <p className="text-on-surface-variant leading-relaxed">
                Built-in simulation via React Context API (<code>SimulationProvider</code>). Three modes: <strong>Stable</strong> (gentle drift), <strong>Trending Up</strong> (rise to 85% of max → triggers warnings), <strong>Trending Down</strong> (descent to 15% of min). Data ticks every 2.5s and bypasses API calls entirely.
              </p>
            </div>
          </div>

          <h3 className="font-headline-md text-headline-md text-doc-primary mt-12 mb-6" id="tech-stack">1.3 Tech Stack</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "IoT & Hardware", value: "ESP32 NodeMCU-32S (Rack), Wemos D1 Mini (Room)." },
              { label: "Message Broker", value: "Eclipse Mosquitto (MQTT) with auth." },
              { label: "Backend", value: "Python 3.14, FastAPI, SQLModel, Paho-MQTT, Gunicorn." },
              { label: "Database", value: "PostgreSQL 18, Alembic (Migrations)." },
              { label: "Frontend", value: "React 19, Next.js 16, Tailwind CSS v4, Recharts, Shadcn/UI." },
              { label: "Firmware", value: "PlatformIO, Arduino, ArduinoJson, PubSubClient, Preferences." },
              { label: "Deployment", value: "Docker & Docker Compose." },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-white/40 rounded-xl border border-glass-border">
                <p className="font-bold text-doc-primary mb-1">{item.label}</p>
                <p className="text-on-surface-variant text-sm">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. System Architecture */}
      <section className="border-t border-outline-variant/30 pt-section-gap mb-section-gap" id="architecture-preview">
        <ChapterPill text="Chapter 2" />
        <h2 className="font-headline-lg text-headline-lg text-doc-primary mb-6">System Architecture</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed mb-8">
          The system follows a three-layer architecture: Device/Edge Layer, Data &amp; Logic Layer, and Presentation Layer. High-frequency sensor data flows from the edge to a centralized PostgreSQL database through an optimized MQTT bridge.
        </p>

        <div className="space-y-4 mb-12">
          {[
            { step: "01", title: "IoT Collection", desc: "ESP32 reads all sensors, applies 7-stage filtering, builds JSON payload every 5 seconds." },
            { step: "02", title: "MQTT Transport", desc: "Data published to Mosquitto broker under rack/{id}/data with QoS 1." },
            { step: "03", title: "Backend Ingestion", desc: "FastAPI MQTT worker validates via Pydantic, looks up device by mac_addr, inserts DataLog." },
            { step: "04", title: "Frontend Proxy", desc: "Next.js caches 25-point history per sensor, maps snake_case → camelCase keys." },
            { step: "05", title: "UI Rendering", desc: "React polls every 3s, updates cards, calculates trends, triggers threshold notifications." },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 bg-white/40 p-4 rounded-xl border border-glass-border">
              <span className="w-10 h-10 rounded-full bg-doc-primary text-white flex items-center justify-center font-bold shrink-0">{item.step}</span>
              <div>
                <p className="font-bold text-doc-primary">{item.title}</p>
                <p className="text-sm text-on-surface-variant">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <h3 className="font-headline-md text-headline-md text-doc-primary mt-12 mb-6">2.1 High-Level Diagram</h3>
        <CodeBlock code={mermaidArchitecture} language="mermaid" headerTitle="Architecture Diagram" />

        <h3 className="font-headline-md text-headline-md text-doc-primary mt-12 mb-6">2.2 ESP32 Boot &amp; Registration Flow</h3>
        <CodeBlock code={mermaidBootFlow} language="mermaid" headerTitle="Boot Sequence Diagram" />
      </section>

      {/* 3. Hardware, IoT, and Wiring */}
      <section className="border-t border-outline-variant/30 pt-section-gap mb-section-gap" id="hardware-iot">
        <ChapterPill text="Chapter 3" />
        <h2 className="font-headline-lg text-headline-lg text-doc-primary mb-6">Hardware, IoT, and Firmware</h2>

        <h3 className="font-headline-md text-headline-md text-doc-primary mt-8 mb-4">3.1 Hardware Components</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <InfoCard title="Rack Sensor Unit (per rack)">
            <ul className="list-disc pl-5 space-y-1.5 text-on-surface-variant text-sm">
              <li><strong>MCU:</strong> ESP32 NodeMCU-32S</li>
              <li><strong>pH Sensor:</strong> Analog (ADC)</li>
              <li><strong>TDS/EC Sensor:</strong> Analog (ADC)</li>
              <li><strong>Water Temp:</strong> DS18B20 Waterproof (OneWire)</li>
              <li><strong>Water Level:</strong> HC-SR04 Waterproof Ultrasonic</li>
              <li><strong>Water Flow:</strong> YF-S201 Pulse Sensor (ISR)</li>
              <li><strong>Light:</strong> BH1750 Digital (I2C)</li>
            </ul>
          </InfoCard>
          <InfoCard title="Room Sensor Unit">
            <ul className="list-disc pl-5 space-y-1.5 text-on-surface-variant text-sm">
              <li><strong>MCU:</strong> Wemos D1 Mini (ESP8266)</li>
              <li><strong>Sensor:</strong> DHT22 (Temperature &amp; Humidity)</li>
              <li><strong>Firmware:</strong> ~220 lines, auto-restart on WiFi failure</li>
            </ul>
          </InfoCard>
        </div>

        <h3 className="font-headline-md text-headline-md text-doc-primary mt-8 mb-4">3.2 Wiring &amp; Pinout Guide (Rack)</h3>
        <div className="overflow-x-auto rounded-xl border border-glass-border bg-white/40 backdrop-blur-sm mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary-fixed/50">
                <th className="p-4 font-label-caps text-doc-primary uppercase">Component</th>
                <th className="p-4 font-label-caps text-doc-primary uppercase">ESP32 Pin</th>
                <th className="p-4 font-label-caps text-doc-primary uppercase">Protocol</th>
                <th className="p-4 font-label-caps text-doc-primary uppercase">Function</th>
              </tr>
            </thead>
            <tbody className="text-sm text-on-surface-variant">
              <tr className="border-t border-glass-border"><td className="p-4">pH Sensor</td><td className="p-4 font-data-mono">GPIO 33 (ADC1_CH5)</td><td className="p-4">Analog</td><td className="p-4">7-stage filtered pH reading</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4">TDS Sensor</td><td className="p-4 font-data-mono">GPIO 35 (ADC1_CH7)</td><td className="p-4">Analog</td><td className="p-4">Polynomial TDS conversion</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4">DS18B20</td><td className="p-4 font-data-mono">GPIO 4</td><td className="p-4">OneWire</td><td className="p-4">Water temperature</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4">BH1750</td><td className="p-4 font-data-mono">GPIO 21 (SDA) / 22 (SCL)</td><td className="p-4">I2C</td><td className="p-4">Light intensity (lux)</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4">Ultrasonic</td><td className="p-4 font-data-mono">GPIO 12 (Trig) / 14 (Echo)</td><td className="p-4">Digital</td><td className="p-4">Water level (distance)</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4">Flow Sensor</td><td className="p-4 font-data-mono">GPIO 27</td><td className="p-4">Interrupt (ISR)</td><td className="p-4">Pulse counting (RISING edge)</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="font-headline-md text-headline-md text-doc-primary mt-8 mb-4">3.3 Sensor Filtering Pipeline</h3>
        <p className="text-on-surface-variant leading-relaxed mb-4">
          Raw ADC readings from analog sensors (pH, TDS) are noisy. The firmware implements a <strong>7-stage filtering pipeline</strong> in <code>readVoltage()</code>:
        </p>
        <div className="overflow-x-auto rounded-xl border border-glass-border bg-white/40 backdrop-blur-sm mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary-fixed/50">
                <th className="p-4 font-label-caps text-doc-primary uppercase w-12">Stage</th>
                <th className="p-4 font-label-caps text-doc-primary uppercase">Technique</th>
                <th className="p-4 font-label-caps text-doc-primary uppercase">Detail</th>
              </tr>
            </thead>
            <tbody className="text-sm text-on-surface-variant">
              <tr className="border-t border-glass-border"><td className="p-4 font-bold text-doc-primary text-center">1</td><td className="p-4 font-bold">Multi-sampling</td><td className="p-4">20 ADC samples with 20ms settling delay</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4 font-bold text-doc-primary text-center">2</td><td className="p-4 font-bold">Sorting</td><td className="p-4">Bubble sort ascending</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4 font-bold text-doc-primary text-center">3</td><td className="p-4 font-bold">Outlier trimming</td><td className="p-4">Discard 4 lowest + 4 highest (keep 12)</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4 font-bold text-doc-primary text-center">4</td><td className="p-4 font-bold">Averaging</td><td className="p-4">Mean of 12 middle samples</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4 font-bold text-doc-primary text-center">5</td><td className="p-4 font-bold">Voltage conversion</td><td className="p-4"><code>avg × (3300 / 4095)</code> — 12-bit, 3.3V ref</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4 font-bold text-doc-primary text-center">6</td><td className="p-4 font-bold">EMA filter</td><td className="p-4"><code>ema = 0.30×V + 0.70×prev</code></td></tr>
              <tr className="border-t border-glass-border"><td className="p-4 font-bold text-doc-primary text-center">7</td><td className="p-4 font-bold">Median filter</td><td className="p-4">5-sample history buffer, return median</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="font-headline-md text-headline-md text-doc-primary mt-8 mb-4">3.4 Calibration System (NVS Persistent)</h3>
        <p className="text-on-surface-variant leading-relaxed mb-4">
          Calibration coefficients are stored in ESP32 <strong>flash memory (NVS)</strong> using the <code>Preferences</code> library, surviving power cycles and reboots. Supports two-point calibration for pH and one/two-point for TDS.
        </p>
        <CodeBlock code={calibrationStruct} language="C++" headerTitle="Calibration Data Structures" />
      </section>

      {/* 4. Communication Protocol */}
      <section className="border-t border-outline-variant/30 pt-section-gap mb-section-gap" id="mqtt-payload">
        <ChapterPill text="Chapter 4" />
        <h2 className="font-headline-lg text-headline-lg text-doc-primary mb-6">Communication Protocol (MQTT)</h2>

        <h3 className="font-headline-md text-headline-md text-doc-primary mt-8 mb-4">4.1 MQTT Topics</h3>
        <div className="overflow-x-auto rounded-xl border border-glass-border bg-white/40 backdrop-blur-sm mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary-fixed/50">
                <th className="p-4 font-label-caps text-doc-primary uppercase">Topic</th>
                <th className="p-4 font-label-caps text-doc-primary uppercase">Direction</th>
                <th className="p-4 font-label-caps text-doc-primary uppercase">Purpose</th>
              </tr>
            </thead>
            <tbody className="text-sm text-on-surface-variant">
              <tr className="border-t border-glass-border"><td className="p-4 font-data-mono">device/+/register</td><td className="p-4">Upbound</td><td className="p-4">Initial registration of ESP32 node.</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4 font-data-mono">rack/+/data</td><td className="p-4">Upbound</td><td className="p-4">Periodic sensor telemetry (every 5s).</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4 font-data-mono">rack/+/cmd/ack</td><td className="p-4">Upbound</td><td className="p-4">Acknowledgment after command (SUCCESS/FAILED/TIMEOUT).</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4 font-data-mono">rack/&#123;id&#125;/cmd</td><td className="p-4">Downbound</td><td className="p-4">Commands to ESP32 (KALIBRASI_PH, KALIBRASI_TDS, RESET_CALIBRATION).</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4 font-data-mono">device/+/register/ack</td><td className="p-4">Downbound</td><td className="p-4">Registration confirmation.</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="font-headline-md text-headline-md text-doc-primary mt-8 mb-4">4.2 Payload Examples</h3>
        <div className="space-y-6">
          <CodeBlock code={mqttRegistrationPayload} language="JSON" headerTitle="device/+/register" />
          <CodeBlock code={mqttTelemetryPayload} language="JSON" headerTitle="rack/+/data (Rack)" />
          <CodeBlock code={mqttRoomPayload} language="JSON" headerTitle="rack/0/data (Room)" />
          <CodeBlock code={mqttCommandPayload} language="JSON" headerTitle="rack/{id}/cmd" />
          <CodeBlock code={mqttAckPayload} language="JSON" headerTitle="rack/+/cmd/ack" />
        </div>
      </section>

      {/* 5. Backend Infrastructure */}
      <section className="border-t border-outline-variant/30 pt-section-gap mb-section-gap" id="backend">
        <ChapterPill text="Chapter 5" />
        <h2 className="font-headline-lg text-headline-lg text-doc-primary mb-6">Backend Infrastructure</h2>
        <p className="text-on-surface-variant font-bold mb-6">Path: <code>hydroponic_be/</code> | Stack: Python 3.14, FastAPI, SQLModel, Paho-MQTT, Gunicorn.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-headline-md text-headline-md text-doc-primary mt-4 mb-4">5.1 Directory Structure</h3>
            <ul className="list-disc pl-6 space-y-2 text-on-surface-variant text-sm">
              <li><code>app/api/routes/</code> — REST API Routers (telemetry, command, general).</li>
              <li><code>app/models/</code> — Database ORM models (Device, DataLog, CommandLog).</li>
              <li><code>app/crud/</code> — Database queries and transactions.</li>
              <li><code>app/services/</code> — MQTT worker + topic handlers.</li>
              <li><code>app/core/</code> — Configuration and settings.</li>
              <li><code>app/db/</code> — Engine (pool_size=10, max_overflow=20) &amp; session.</li>
              <li><code>app/utils/</code> — Seeding utility &amp; time helpers.</li>
            </ul>
          </div>
          <div>
            <h3 className="font-headline-md text-headline-md text-doc-primary mt-4 mb-4">5.2 MQTT Handlers</h3>
            <ul className="list-disc pl-6 space-y-2 text-on-surface-variant text-sm">
              <li><code>registering_handler</code> — Validate → create Device → send ACK.</li>
              <li><code>telemetry_handler</code> — Validate → lookup by mac_addr → insert DataLog.</li>
              <li><code>ack_command_handler</code> — Validate → resolve IDs → insert CommandLog.</li>
            </ul>
          </div>
        </div>

        <h3 className="font-headline-md text-headline-md text-doc-primary mt-4 mb-4">5.3 REST API Endpoints</h3>
        <div className="overflow-x-auto rounded-xl border border-glass-border bg-white/40 backdrop-blur-sm mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary-fixed/50">
                <th className="p-4 font-label-caps text-doc-primary uppercase">Method</th>
                <th className="p-4 font-label-caps text-doc-primary uppercase">Endpoint</th>
                <th className="p-4 font-label-caps text-doc-primary uppercase">Purpose</th>
              </tr>
            </thead>
            <tbody className="text-sm text-on-surface-variant">
              <tr className="border-t border-glass-border"><td className="p-4 font-bold text-doc-secondary">GET</td><td className="p-4 font-data-mono">/api/v1/datalogs/latest</td><td className="p-4">Latest data per device (DISTINCT ON)</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4 font-bold text-doc-secondary">GET</td><td className="p-4 font-data-mono">/api/v1/datalogs/&#123;device_id&#125;</td><td className="p-4">Historical data for one device</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4 font-bold text-doc-secondary">GET</td><td className="p-4 font-data-mono">/api/v1/datalogs/exports/csv</td><td className="p-4">Stream CSV export (in-memory)</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4 font-bold text-warning-amber">POST</td><td className="p-4 font-data-mono">/api/v1/commandlogs/&#123;rack_id&#125;</td><td className="p-4">Dispatch command to ESP32 via MQTT</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4 font-bold text-doc-secondary">GET</td><td className="p-4 font-data-mono">/api/v1/generals/devices</td><td className="p-4">List all registered devices</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4 font-bold text-leaf-gradient-end">PATCH</td><td className="p-4 font-data-mono">/api/v1/generals/devices/&#123;id&#125;/planted-date</td><td className="p-4">Update planted_at in JSONB</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. Database Architecture */}
      <section className="border-t border-outline-variant/30 pt-section-gap mb-section-gap" id="database">
        <ChapterPill text="Chapter 6" />
        <h2 className="font-headline-lg text-headline-lg text-doc-primary mb-6">Database Architecture</h2>
        <p className="text-on-surface-variant font-bold mb-6">Stack: PostgreSQL 18, SQLModel (ORM), Alembic (Migrations).</p>

        <h3 className="font-headline-md text-headline-md text-doc-primary mt-8 mb-4">6.1 Entity-Relationship Diagram</h3>
        <CodeBlock code={mermaidDB} language="mermaid" headerTitle="Database ERD" />

        <h3 className="font-headline-md text-headline-md text-doc-primary mt-8 mb-4">6.2 Seeded Reference Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <InfoCard title="DeviceType">
            <p className="text-on-surface-variant text-sm font-data-mono">HYDROPONIC_RACKS, ROOM_MONITORING</p>
          </InfoCard>
          <InfoCard title="CommandType">
            <p className="text-on-surface-variant text-sm font-data-mono">PUMP_ON, PUMP_OFF, KALIBRASI_TDS, KALIBRASI_PH, RESET_CALIBRATION</p>
          </InfoCard>
          <InfoCard title="CommandStatus">
            <p className="text-on-surface-variant text-sm font-data-mono">START, PENDING, SUCCESS, FAILED, TIME_OUT, BROKER_DOWN</p>
          </InfoCard>
        </div>

        <h3 className="font-headline-md text-headline-md text-doc-primary mt-8 mb-4">6.3 Device Attributes (JSONB)</h3>
        <ul className="list-disc pl-6 space-y-2 text-on-surface-variant mb-4">
          <li><code>rack_id</code> (string) — Maps physical rack number (1-5) to database device. Queried via <code>cast(attr[&quot;rack_id&quot;], Integer)</code>.</li>
          <li><code>planted_at</code> (string, ISO date) — Planting date for the Planting Tracker. No schema migration needed.</li>
          <li><code>about</code> (string) — Human-readable device description.</li>
        </ul>
      </section>

      {/* 7. Frontend Architecture */}
      <section className="border-t border-outline-variant/30 pt-section-gap mb-section-gap" id="frontend">
        <ChapterPill text="Chapter 7" />
        <h2 className="font-headline-lg text-headline-lg text-doc-primary mb-6">Frontend Architecture</h2>
        <p className="text-on-surface-variant font-bold mb-6">Path: <code>hydroponic_fe/</code> | Stack: Next.js 16 (App Router), React 19, TailwindCSS v4, Shadcn/UI.</p>

        <h3 className="font-headline-md text-headline-md text-doc-primary mt-8 mb-4">7.1 Pages &amp; Routes</h3>
        <div className="overflow-x-auto rounded-xl border border-glass-border bg-white/40 backdrop-blur-sm mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary-fixed/50">
                <th className="p-4 font-label-caps text-doc-primary uppercase">Route</th>
                <th className="p-4 font-label-caps text-doc-primary uppercase">Description</th>
              </tr>
            </thead>
            <tbody className="text-sm text-on-surface-variant">
              <tr className="border-t border-glass-border"><td className="p-4 font-data-mono">/</td><td className="p-4">Main dashboard — room monitor, rack cards, navbar</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4 font-data-mono">/history</td><td className="p-4">History hub — navigation to per-rack charts</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4 font-data-mono">/rack/[id]</td><td className="p-4">Time-series area charts (Recharts) with time range filters</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4 font-data-mono">/planted-date</td><td className="p-4">Planting management — set/reset planting dates</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4 font-data-mono">/calibration/[rackId]</td><td className="p-4">Step-by-step calibration wizard (pH &amp; TDS)</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4 font-data-mono">/docs</td><td className="p-4">This documentation page</td></tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-headline-md text-headline-md text-doc-primary mt-4 mb-4">7.2 Data Flow</h3>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              Client polls <code>/api/racks</code> every 3s → Next.js Route Handler fetches from FastAPI → maintains <code>Map&lt;rackId, RackStore&gt;</code> with 25-point sliding window per sensor → maps ESP32 keys (<code>snake_case</code>) to frontend keys (<code>camelCase</code>).
            </p>
          </div>
          <div>
            <h3 className="font-headline-md text-headline-md text-doc-primary mt-4 mb-4">7.3 Threshold Engine</h3>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              Defined in <code>thresholds.ts</code>. Evaluates: Critical → Warning → Normal. Colors: <span className="inline-block w-3 h-3 rounded-full bg-[#34473d] align-middle"></span> Normal (<code>#34473d</code>), <span className="inline-block w-3 h-3 rounded-full bg-[#f8650c] align-middle"></span> Warning (<code>#f8650c</code>), <span className="inline-block w-3 h-3 rounded-full bg-[#8c0000] align-middle"></span> Critical (<code>#8c0000</code>).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          <div>
            <h3 className="font-headline-md text-headline-md text-doc-primary mt-4 mb-4">7.4 Notification Engine</h3>
            <p className="text-on-surface-variant leading-relaxed text-sm">
              <code>useNotifications()</code> — triggers on state transitions only. Suppresses first-load flood. Smart remediation per sensor &amp; direction. Max 50 notifications.
            </p>
          </div>
          <div>
            <h3 className="font-headline-md text-headline-md text-doc-primary mt-4 mb-4">7.5 UI Design System</h3>
            <p className="text-on-surface-variant leading-relaxed text-sm">
              Glassmorphism theme. Primary: <code>#34473d</code>. Gradient: <code>#50705f → #86a293</code>. AVIF backgrounds. Responsive: Grid (mobile), List/TV (widescreen), Drawer (mobile nav).
            </p>
          </div>
        </div>
      </section>

      {/* 8. Deployment & Environment */}
      <section className="border-t border-outline-variant/30 pt-section-gap mb-section-gap" id="deployment">
        <ChapterPill text="Chapter 8" />
        <h2 className="font-headline-lg text-headline-lg text-doc-primary mb-6">Deployment &amp; Environment</h2>
        <p className="text-on-surface-variant leading-relaxed mb-8">The project is fully dockerized with health-check-based dependency chain.</p>

        <h3 className="font-headline-md text-headline-md text-doc-primary mt-8 mb-4">8.1 Docker Compose Services</h3>
        <div className="overflow-x-auto rounded-xl border border-glass-border bg-white/40 backdrop-blur-sm mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary-fixed/50">
                <th className="p-4 font-label-caps text-doc-primary uppercase">Service</th>
                <th className="p-4 font-label-caps text-doc-primary uppercase">Image</th>
                <th className="p-4 font-label-caps text-doc-primary uppercase">Port</th>
                <th className="p-4 font-label-caps text-doc-primary uppercase">Healthcheck</th>
                <th className="p-4 font-label-caps text-doc-primary uppercase">Description</th>
              </tr>
            </thead>
            <tbody className="text-sm text-on-surface-variant">
              <tr className="border-t border-glass-border"><td className="p-4 font-data-mono">db</td><td className="p-4">postgres:18.3-alpine</td><td className="p-4 font-data-mono">5432</td><td className="p-4 font-data-mono">pg_isready (5s)</td><td className="p-4">Primary Database</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4 font-data-mono">broker</td><td className="p-4">Custom Mosquitto</td><td className="p-4 font-data-mono">1883</td><td className="p-4 font-data-mono">mosquitto_pub (10s)</td><td className="p-4">MQTT Broker (auth)</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4 font-data-mono">backend</td><td className="p-4">Custom FastAPI</td><td className="p-4 font-data-mono">8000</td><td className="p-4">depends_on: healthy</td><td className="p-4">API + MQTT Worker</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4 font-data-mono">frontend</td><td className="p-4">Custom Next.js</td><td className="p-4 font-data-mono">3000</td><td className="p-4">depends_on: backend</td><td className="p-4">Dashboard UI</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="font-headline-md text-headline-md text-doc-primary mt-8 mb-4">8.2 Execution Commands</h3>
        <div className="space-y-6">
          <CodeBlock code={bashDev} language="bash" headerTitle="Development Mode (Local)" />
          <CodeBlock code={bashProd} language="bash" headerTitle="Production Mode" />
        </div>
      </section>

      {/* 9. Code Conventions */}
      <section className="border-t border-outline-variant/30 pt-section-gap mb-section-gap" id="conventions">
        <ChapterPill text="Chapter 9" />
        <h2 className="font-headline-lg text-headline-lg text-doc-primary mb-6">Code Conventions &amp; Best Practices</h2>
        <ul className="list-disc pl-6 space-y-4 text-on-surface-variant">
          <li><strong>Timezone Management:</strong> All database timestamps are UTC. Converted to <code>Asia/Jakarta</code> at the API query level via <code>func.timezone()</code>.</li>
          <li><strong>Identifiers:</strong> <code>rack_id</code> (Physical, 1-5) vs <code>device_id</code> (Database PK). Frontend uses <code>rack_id</code> for routing.</li>
          <li><strong>Edge Computing:</strong> Calibration math (slope/offset, NVS storage) happens on ESP32. Backend relays commands and logs results.</li>
          <li><strong>JSONB for Extensibility:</strong> Dynamic attributes (<code>rack_id</code>, <code>planted_at</code>) stored in JSONB <code>attr</code> columns, avoiding schema migrations.</li>
          <li><strong>Sensor Key Mapping:</strong> ESP32 uses <code>snake_case</code>; frontend uses <code>camelCase</code>. Next.js proxy performs mapping via <code>SENSOR_MAP</code> constant.</li>
          <li><strong>Hydration Safety:</strong> Time-sensitive UI elements use <code>ClientTime</code> component (client-only render) to prevent SSR hydration mismatches.</li>
        </ul>
      </section>

      <footer className="mt-section-gap pt-8 border-t border-outline-variant/30 flex justify-between items-center text-on-surface-variant font-label-caps">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-leaf-gradient-end rounded-full"></span>
          <span>Smart Farming Lab Documentation — v2.0</span>
        </div>
        <div className="flex gap-6">
          <a className="hover:text-doc-primary transition-colors" href="https://github.com/Hidroponic-UMN/smart-farming-lab" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </footer>
    </>
  );
}
