"use client";

import { RackCard } from "@/components/rack-card";
import { CodeBlock } from "@/components/docs/code-block";
import type { RackData } from "@/lib/sensor-data";

export default function DocsPage() {
  const dummyRack: RackData = {
    id: 1,
    label: "Rack 1 (Documentation Preview)",
    plantedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    overallStatus: "Normal",
    waterLevel: { value: 85, status: "Normal", history: [80, 82, 85, 84, 85] },
    waterTemp: { value: 24.5, status: "Normal", history: [24, 24.2, 24.5, 24.4, 24.5] },
    waterFlow: { value: 3.2, status: "Normal", history: [3.0, 3.1, 3.2, 3.2, 3.2] },
    ph: { value: 6.2, status: "Normal", history: [6.1, 6.2, 6.2, 6.3, 6.2] },
    ec: { value: 1.8, status: "Normal", history: [1.7, 1.8, 1.8, 1.9, 1.8] },
    lightIntensity: { value: 22000, status: "Normal", history: [20000, 21000, 22000, 21500, 22000] },
  };

  const mqttTelemetryPayload = `{
  "mac_addr": "AA:BB:CC:DD:EE:FF",
  "data": {
    "ph": 6.2,
    "ec": 1.8,
    "water_temp": 24.5,
    "water_level": 75,
    "water_flow": 3.2,
    "light_intensity": 22000
  }
}`;

  const mqttCommandPayload = `{
  "mac_addr": "AA:BB:CC:DD:EE:FF",
  "command": "KALIBRASI_PH",
  "status": "SUCCESS",
  "cmd_log": {"ph_slope": 1.02, "ph_offset": -0.1}
}`;

  const mermaidArchitecture = `graph TD
    %% Define Layers
    subgraph Edge Layer [Hardware & IoT Layer]
        ESP_1[ESP32 - Rack 1]
        ESP_2[ESP32 - Rack 2]
        ESP_N[ESP32 - Rack N]
        ESP_Room[ESP32 - Room Monitor]
    end

    subgraph Data & Logic Layer [Backend & DB Layer]
        MQTT[Mosquitto MQTT Broker]
        BE[FastAPI Backend\\nBackground Worker]
        DB[(PostgreSQL)]
    end

    subgraph Presentation Layer [Frontend Layer]
        FE_API[Next.js API Routes\\nIn-memory cache]
        FE_UI[Next.js Client Components]
    end

    %% Connections
    ESP_1 -- MQTT --> MQTT
    ESP_2 -- MQTT --> MQTT
    ESP_N -- MQTT --> MQTT
    ESP_Room -- MQTT --> MQTT

    MQTT -- Subscribe / Publish --> BE
    BE -- Read / Write --> DB

    FE_API -- HTTP REST --> BE
    FE_UI -- HTTP / Polling --> FE_API`;

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
        int device_id PK, FK
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
        int command_id PK, FK
        int status_id PK, FK
        int device_id PK, FK
        datetime timestamp PK
        string created_by
        jsonb cmd_log
    }`;

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

  return (
    <>
      {/* 1. Project Overview */}
      <section className="mb-section-gap" id="project-overview">
        <div className="mb-12">
          <ChapterPill text="Chapter 1" />
          <h2 className="font-headline-lg text-headline-lg text-doc-primary mb-6">Project Overview</h2>
          
          <h3 className="font-headline-md text-headline-md text-doc-primary mt-8 mb-4">1.1 Introduction</h3>
          <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed mb-6">
            The <strong className="text-doc-primary font-bold">Smart Farming Lab</strong> is an end-to-end IoT platform designed to monitor and control hydroponic racks. The platform captures real-time telemetry (pH, EC, water temperature, water levels, water flow, and light intensity) from ESP32 controllers, stores the data for analytics, and provides a modern web interface for users to oversee the farm's status, track planting cycles, and perform sensor adjustments.
          </p>

          <h3 className="font-headline-md text-headline-md text-doc-primary mt-12 mb-6">1.2 Key Features</h3>
          
          <div className="space-y-8">
            <div>
              <h4 className="font-bold text-doc-primary text-xl mb-2">1.2.1 Real-time Telemetry Monitoring</h4>
              <p className="text-on-surface-variant leading-relaxed">
                The core dashboard provides a live, auto-refreshing view of the entire hydroponic farm. It polls data from the API every 3 seconds to ensure users always see the latest telemetry. Each sensor is displayed in a dedicated card with sparkline charts showing recent trends and indicators for threshold deviations.
              </p>
            </div>
            
            {/* Rack Card Preview */}
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
                {/* Simulated Sensor Cards inside RackCard */}
                <div className="p-4 bg-white/60 backdrop-blur-md rounded-xl border border-glass-border shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="p-2 bg-secondary-container rounded-lg text-doc-secondary font-bold text-xs">PH</div>
                    <span className="text-xs font-bold text-on-surface-variant/60">pH</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tabular-nums text-doc-primary">6.2</span>
                    <span className="text-sm opacity-60">pH</span>
                  </div>
                  <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                    <div className="bg-doc-secondary h-full rounded-full" style={{ width: "62%" }}></div>
                  </div>
                </div>
                <div className="p-4 bg-white/60 backdrop-blur-md rounded-xl border border-glass-border shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="p-2 bg-leaf-gradient-end/10 rounded-lg text-leaf-gradient-end font-bold text-xs">WTR</div>
                    <span className="text-xs font-bold text-on-surface-variant/60">WATER</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tabular-nums text-doc-primary">75</span>
                    <span className="text-sm opacity-60">%</span>
                  </div>
                  <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                    <div className="bg-leaf-gradient-end h-full rounded-full" style={{ width: "75%" }}></div>
                  </div>
                </div>
                <div className="p-4 bg-white/60 backdrop-blur-md rounded-xl border border-glass-border shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="p-2 bg-warning-amber/10 rounded-lg text-warning-amber font-bold text-xs">TMP</div>
                    <span className="text-xs font-bold text-on-surface-variant/60">TEMP</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tabular-nums text-doc-primary">24.5</span>
                    <span className="text-sm opacity-60">°C</span>
                  </div>
                  <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                    <div className="bg-warning-amber h-full rounded-full" style={{ width: "45%" }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-doc-primary text-xl mb-2">1.2.2 Historical Data Visualization</h4>
              <p className="text-on-surface-variant leading-relaxed">
                To facilitate deeper analysis, the system offers time-series area charts for historical data. Users can filter data by time ranges (1 Hour, 6 Hours, 24 Hours, 7 Days) to observe patterns, detect anomalies, or optimize their farming strategies. Data points are aggregated dynamically on the backend to maintain performance over long time horizons.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-doc-primary text-xl mb-2">1.2.3 Sensor Adjustment Wizard (Calibration)</h4>
              <p className="text-on-surface-variant leading-relaxed">
                A guided, step-by-step user interface to accurately adjust and calibrate critical sensors like pH (2-point calibration with buffer solutions) and TDS (1-point calibration). The wizard communicates directly with the ESP32 microcontrollers via MQTT commands, ensuring that adjustments are processed directly at the edge layer and saved to the device's non-volatile memory.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-doc-primary text-xl mb-2">1.2.4 Hydroponic Planting Tracker</h4>
              <p className="text-on-surface-variant leading-relaxed">
                An integrated calendar and tracking module that allows users to record planting dates for each hydroponic rack. The system automatically calculates and displays the current growth stage ("Day X") based on the registered date. This feature leverages the flexible JSONB <code>attr</code> field in the PostgreSQL database to persist state seamlessly without requiring additional relational tables.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-doc-primary text-xl mb-2">1.2.5 Threshold Alerts & Notifications</h4>
              <p className="text-on-surface-variant leading-relaxed">
                A robust notification engine that continuously monitors sensor values against predefined, configurable bounds (Warning Low/High, Critical Low/High). If a sensor breaches a threshold, the system immediately dispatches real-time alerts to the user interface, ensuring prompt intervention to prevent crop damage.
              </p>
            </div>
          </div>

          <h3 className="font-headline-md text-headline-md text-doc-primary mt-12 mb-6" id="tech-stack">1.3 Tech Stack</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "IoT & Hardware", value: "ESP32 Microcontrollers, Environmental & Water Sensors." },
              { label: "Message Broker", value: "Eclipse Mosquitto (MQTT)." },
              { label: "Backend", value: "Python 3.14, FastAPI, SQLModel (SQLAlchemy 2.0), asyncpg, Paho-MQTT." },
              { label: "Database", value: "PostgreSQL 18." },
              { label: "Frontend", value: "React 19, Next.js 16, Tailwind CSS v4, Recharts, Shadcn/UI." },
              { label: "Deployment", value: "Docker & Docker Compose." }
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-doc-primary mb-6">System Architecture</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed mb-8">
              The system follows a three-layer architecture: Device/Edge Layer, Data & Logic Layer, and Presentation Layer. High-frequency sensor data flows from the edge to a centralized PostgreSQL database through an optimized MQTT bridge.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-white/40 p-4 rounded-xl border border-glass-border">
                <span className="w-10 h-10 rounded-full bg-doc-primary text-white flex items-center justify-center font-bold shrink-0">01</span>
                <div>
                  <p className="font-bold text-doc-primary">IoT Collection</p>
                  <p className="text-sm text-on-surface-variant">ESP32 collects sensor data every few seconds.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/40 p-4 rounded-xl border border-glass-border">
                <span className="w-10 h-10 rounded-full bg-doc-primary text-white flex items-center justify-center font-bold shrink-0">02</span>
                <div>
                  <p className="font-bold text-doc-primary">MQTT Transport</p>
                  <p className="text-sm text-on-surface-variant">Data is published to the Mosquitto broker under <code>rack/&#123;id&#125;/data</code>.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/40 p-4 rounded-xl border border-glass-border">
                <span className="w-10 h-10 rounded-full bg-doc-primary text-white flex items-center justify-center font-bold shrink-0">03</span>
                <div>
                  <p className="font-bold text-doc-primary">Backend Ingestion</p>
                  <p className="text-sm text-on-surface-variant">FastAPI worker persists data to PostgreSQL (<code>DataLog</code>).</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/40 p-4 rounded-xl border border-glass-border">
                <span className="w-10 h-10 rounded-full bg-doc-primary text-white flex items-center justify-center font-bold shrink-0">04</span>
                <div>
                  <p className="font-bold text-doc-primary">Frontend Proxy & UI</p>
                  <p className="text-sm text-on-surface-variant">Next.js API caches records. React UI polls Next.js API.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-leaf-gradient-start/20 blur-3xl rounded-full"></div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Hardware Engineering" className="relative rounded-2xl shadow-2xl border-4 border-white object-cover w-full h-[500px]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBY7siW20R38y5gPNG71FFdyx4TSirMYG7wBA12QgGNOlu-id4xAbbkPMu2nKT9S_0u4O6KWSKPsmldxVp0E44Lg2QTeqw0JbD5FCq4w5SpV6J7Io9W-e-c1AxreGNZ_05Hu_v_rbZ0WqVx1PvHed1RLkEfr3uKhyW8upI1MYaNdNfWCTRd3A_beZ1PL6i9jlv0xF8h5db_MkG-mVSTCV-yLtOKIeYPxySlsVhvr1PjN-vpDPctJEr5GiOwAcsRJ_JTTcLvkWmmoCc" />
            <div className="absolute bottom-4 left-4 right-4 bg-glass-surface backdrop-blur-md p-4 rounded-xl border border-glass-border">
              <p className="text-xs font-label-caps text-doc-primary uppercase mb-1">Hardware Highlight</p>
              <p className="text-sm font-bold text-on-surface">ESP32 Core Controller with dedicated analog isolation.</p>
            </div>
          </div>
        </div>
        
        <h3 className="font-headline-md text-headline-md text-doc-primary mt-12 mb-6">2.1 High-Level Diagram</h3>
        <CodeBlock code={mermaidArchitecture} language="mermaid" headerTitle="Architecture Diagram" />
      </section>

      {/* 3. Hardware, IoT, and Wiring */}
      <section className="border-t border-outline-variant/30 pt-section-gap mb-section-gap" id="hardware-iot">
        <ChapterPill text="Chapter 3" />
        <h2 className="font-headline-lg text-headline-lg text-doc-primary mb-6">Hardware, IoT, and Wiring</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed mb-8">
          This layer handles physical interaction with the hydroponic environment.
        </p>

        <h3 className="font-headline-md text-headline-md text-doc-primary mt-8 mb-4">3.1 Hardware Components</h3>
        <ul className="list-disc pl-6 space-y-2 text-on-surface-variant mb-8">
          <li><strong>Microcontroller:</strong> ESP32 Development Board.</li>
          <li><strong>Water Sensors:</strong> Analog pH Sensor, TDS/EC Sensor, DS18B20 (Water Temperature), Ultrasonic/Float Switch (Water Level), Water Flow Sensor.</li>
          <li><strong>Environmental Sensors:</strong> DHT22 (Room Temperature & Humidity), LDR / BH1750 (Light Intensity).</li>
          <li><strong>Actuators:</strong> Relay modules for water pumps.</li>
        </ul>

        <h3 className="font-headline-md text-headline-md text-doc-primary mt-8 mb-4">3.4 Wiring & Pinout Guide</h3>
        <div className="overflow-x-auto rounded-xl border border-glass-border bg-white/40 backdrop-blur-sm mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary-fixed/50">
                <th className="p-4 font-label-caps text-doc-primary uppercase">Component</th>
                <th className="p-4 font-label-caps text-doc-primary uppercase">ESP32 Pin</th>
                <th className="p-4 font-label-caps text-doc-primary uppercase">Function</th>
              </tr>
            </thead>
            <tbody className="text-sm text-on-surface-variant">
              <tr className="border-t border-glass-border"><td className="p-4">pH Sensor</td><td className="p-4 font-data-mono">GPIO 34 (ADC)</td><td className="p-4">Analog reading for pH</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4">TDS Sensor</td><td className="p-4 font-data-mono">GPIO 35 (ADC)</td><td className="p-4">Analog reading for EC</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4">DS18B20</td><td className="p-4 font-data-mono">GPIO 4</td><td className="p-4">One-Wire temp reading</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4">Flow Sensor</td><td className="p-4 font-data-mono">GPIO 2</td><td className="p-4">Interrupt pulse counting</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4">Relay (Pump)</td><td className="p-4 font-data-mono">GPIO 14</td><td className="p-4">Digital Output (Active High/Low)</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="font-headline-md text-headline-md text-doc-primary mt-8 mb-4">3.5 Firmware Logic (ESP32)</h3>
        <ul className="list-disc pl-6 space-y-3 text-on-surface-variant">
          <li><strong>Data Gathering:</strong> Reads ADC values, applies mathematical formulas to convert raw data to actual units (e.g., pH value, TDS ppm).</li>
          <li><strong>Sensor Adjustment Calculation:</strong> The ESP32 handles the math for sensor adjustment. For pH, it receives known buffer values (7.0 & 4.0), calculates slope and offset, and saves to non-volatile flash memory.</li>
          <li><strong>MQTT Communication:</strong> Connects to Mosquitto, subscribes to command topics (<code>rack/+/cmd</code>), and publishes telemetry to data topics.</li>
        </ul>
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
              <tr className="border-t border-glass-border"><td className="p-4 font-data-mono">rack/+/data</td><td className="p-4">Upbound</td><td className="p-4">Periodic sensor telemetry payload.</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4 font-data-mono">rack/+/cmd/ack</td><td className="p-4">Upbound</td><td className="p-4">Acknowledgment returned by ESP32 after command execution.</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4 font-data-mono">rack/&#123;rack_id&#125;/cmd</td><td className="p-4">Downbound</td><td className="p-4">Commands sent to ESP32 (e.g., Sensor Adjustment).</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4 font-data-mono">device/+/register/ack</td><td className="p-4">Downbound</td><td className="p-4">Registration success confirmation.</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="font-headline-md text-headline-md text-doc-primary mt-8 mb-4">4.2 Payload Examples</h3>
        <div className="space-y-6">
          <CodeBlock code={mqttTelemetryPayload} language="JSON" headerTitle="rack/+/data" />
          <CodeBlock code={mqttCommandPayload} language="JSON" headerTitle="rack/+/cmd/ack" />
        </div>
      </section>

      {/* 5. Backend Infrastructure */}
      <section className="border-t border-outline-variant/30 pt-section-gap mb-section-gap" id="backend">
        <ChapterPill text="Chapter 5" />
        <h2 className="font-headline-lg text-headline-lg text-doc-primary mb-6">Backend Infrastructure</h2>
        <p className="text-on-surface-variant font-bold mb-4">Path: <code>hydroponic_be/</code> | Stack: Python 3.14, FastAPI, SQLModel, Paho-MQTT.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-headline-md text-headline-md text-doc-primary mt-4 mb-4">5.1 Directory Structure</h3>
            <ul className="list-disc pl-6 space-y-2 text-on-surface-variant">
              <li><code>app/api/</code>: REST API Routers.</li>
              <li><code>app/models/</code>: Database ORM models.</li>
              <li><code>app/crud/</code>: Database queries and transactions.</li>
              <li><code>app/services/</code>: MQTT background worker.</li>
              <li><code>app/core/</code>: Configuration and settings.</li>
            </ul>
          </div>
          <div>
            <h3 className="font-headline-md text-headline-md text-doc-primary mt-4 mb-4">5.3 REST API Endpoints</h3>
            <ul className="list-disc pl-6 space-y-2 text-on-surface-variant">
              <li><code>GET /api/v1/datalogs/latest</code>: Real-time dashboard data.</li>
              <li><code>GET /api/v1/datalogs/&#123;device_id&#125;</code>: Historical charts data.</li>
              <li><code>POST /api/v1/commandlogs/&#123;rack_id&#125;</code>: Dispatches commands via MQTT.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 6. Database Architecture */}
      <section className="border-t border-outline-variant/30 pt-section-gap mb-section-gap" id="database">
        <ChapterPill text="Chapter 6" />
        <h2 className="font-headline-lg text-headline-lg text-doc-primary mb-6">Database Architecture</h2>
        <p className="text-on-surface-variant font-bold mb-6">Stack: PostgreSQL 18, SQLModel (ORM), Alembic (Migrations).</p>

        <h3 className="font-headline-md text-headline-md text-doc-primary mt-8 mb-4">6.1 Entity-Relationship Diagram</h3>
        <CodeBlock code={mermaidDB} language="mermaid" headerTitle="Database ERD" />

        <h3 className="font-headline-md text-headline-md text-doc-primary mt-8 mb-4">6.2 Device Attributes (attr JSONB)</h3>
        <p className="text-on-surface-variant leading-relaxed mb-4">The <code>attr</code> column in the <code>Device</code> table is heavily used:</p>
        <ul className="list-disc pl-6 space-y-2 text-on-surface-variant">
          <li>Stores <code>rack_id</code> (1-5) to map physical hardware to database devices.</li>
          <li>Stores <code>planting_date</code> for the <strong>Hydroponic Planting Tracker</strong>. This allows the frontend to calculate "Day X" since planting without needing a separate relational table.</li>
        </ul>
      </section>

      {/* 7. Frontend Architecture */}
      <section className="border-t border-outline-variant/30 pt-section-gap mb-section-gap" id="frontend">
        <ChapterPill text="Chapter 7" />
        <h2 className="font-headline-lg text-headline-lg text-doc-primary mb-6">Frontend Architecture</h2>
        <p className="text-on-surface-variant font-bold mb-6">Path: <code>hydroponic_fe/</code> | Stack: Next.js 16 (App Router), React 19, TailwindCSS v4.</p>

        <h3 className="font-headline-md text-headline-md text-doc-primary mt-8 mb-4">7.1 Core Modules & Features</h3>
        <ul className="list-disc pl-6 space-y-2 text-on-surface-variant mb-8">
          <li><strong>Dashboard (<code>/</code>)</strong>: Shows overall farm health, room monitor widget, and individual <code>RackCard</code> components. Real-time data is polled every 3s.</li>
          <li><strong>Planting Tracker</strong>: Integrated into the UI to show crop growth days. Contains a "Harvest/Reset" button that updates the database JSONB field.</li>
          <li><strong>History Hub (<code>/history</code> & <code>/rack/[id]</code>)</strong>: Time-series charts built with Recharts, with time range filters.</li>
          <li><strong>Sensor Adjustment Wizard (<code>/calibration/[rackId]</code>)</strong>: A step-by-step UI to adjust pH (2-point) and TDS (1-point). Commands are sent to backend and UI polls for acknowledgment.</li>
        </ul>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-headline-md text-headline-md text-doc-primary mt-4 mb-4">7.2 Data Flow & Virtualization</h3>
            <p className="text-on-surface-variant leading-relaxed mb-4">To avoid overwhelming the database with high-frequency queries, the Client polls Next.js Route Handler (<code>/api/racks</code>). Next.js fetches from the backend and maintains a rolling in-memory array (<code>HISTORY_LENGTH=25</code>) for sparkline charts.</p>
          </div>
          <div>
            <h3 className="font-headline-md text-headline-md text-doc-primary mt-4 mb-4">7.3 Sensor Thresholds Engine</h3>
            <p className="text-on-surface-variant leading-relaxed mb-4">Defined in <code>src/lib/thresholds.ts</code>, it dictates the visual status (Normal, Warning, Critical) for every sensor type based on configured limits (e.g., pH warning at &lt; 5.5 or &gt; 6.5).</p>
          </div>
        </div>
      </section>

      {/* 8. Deployment & Environment */}
      <section className="border-t border-outline-variant/30 pt-section-gap mb-section-gap" id="deployment">
        <ChapterPill text="Chapter 8" />
        <h2 className="font-headline-lg text-headline-lg text-doc-primary mb-6">Deployment & Environment</h2>
        <p className="text-on-surface-variant leading-relaxed mb-8">The project is fully dockerized.</p>

        <h3 className="font-headline-md text-headline-md text-doc-primary mt-8 mb-4">8.1 Docker Compose Services</h3>
        <div className="overflow-x-auto rounded-xl border border-glass-border bg-white/40 backdrop-blur-sm mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary-fixed/50">
                <th className="p-4 font-label-caps text-doc-primary uppercase">Service</th>
                <th className="p-4 font-label-caps text-doc-primary uppercase">Image</th>
                <th className="p-4 font-label-caps text-doc-primary uppercase">Ports</th>
                <th className="p-4 font-label-caps text-doc-primary uppercase">Description</th>
              </tr>
            </thead>
            <tbody className="text-sm text-on-surface-variant">
              <tr className="border-t border-glass-border"><td className="p-4 font-data-mono">db</td><td className="p-4">postgres:18.3-alpine</td><td className="p-4 font-data-mono">5432</td><td className="p-4">Primary Database</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4 font-data-mono">broker</td><td className="p-4">broker:0.1</td><td className="p-4 font-data-mono">1883</td><td className="p-4">MQTT Broker</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4 font-data-mono">backend</td><td className="p-4">backend:0.1</td><td className="p-4 font-data-mono">8000</td><td className="p-4">FastAPI (Waits for DB & Broker)</td></tr>
              <tr className="border-t border-glass-border"><td className="p-4 font-data-mono">frontend</td><td className="p-4">frontend:0.1</td><td className="p-4 font-data-mono">3000</td><td className="p-4">Next.js Frontend</td></tr>
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
        <h2 className="font-headline-lg text-headline-lg text-doc-primary mb-6">Code Conventions & Best Practices</h2>
        <ul className="list-disc pl-6 space-y-4 text-on-surface-variant">
          <li><strong>Timezone Management:</strong> All database timestamps are UTC. They are converted to <code>Asia/Jakarta</code> at the API edge.</li>
          <li><strong>Identifiers:</strong> <code>rack_id</code> (Physical, 1-5) vs <code>device_id</code> (Database PK). The frontend universally uses <code>rack_id</code> for routing and component mapping.</li>
          <li><strong>Edge Computing Strategy:</strong> Complex computations for sensor adjustments happen on the ESP32 to reduce latency and maintain sensor independence. The backend simply relays commands and logs the results.</li>
        </ul>
      </section>

      <footer className="mt-section-gap pt-8 border-t border-outline-variant/30 flex justify-between items-center text-on-surface-variant font-label-caps">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-leaf-gradient-end rounded-full"></span>
          <span>Smart Farming Lab Documentation</span>
        </div>
        <div className="flex gap-6">
          <a className="hover:text-doc-primary transition-colors" href="#">Support</a>
          <a className="hover:text-doc-primary transition-colors" href="#">Changelog</a>
          <a className="hover:text-doc-primary transition-colors" href="#">GitHub</a>
        </div>
      </footer>
    </>
  );
}
