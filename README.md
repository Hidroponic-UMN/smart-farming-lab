# Smart Farming Lab

Smart Farming Lab is an IoT platform for hydroponic farm management. It monitors environmental metrics (pH, Electrical Conductivity, water temperature, water levels, water flow, and light intensity) and provides MQTT-driven sensor calibration through a web dashboard.

---

## Key Features

* Real-time Telemetry: Live data streaming from ESP32 edge devices to the dashboard.
* Remote Calibration: pH and TDS (EC) sensor calibrations via asynchronous MQTT commands.
* Thresholds & Alerts: Alerting system based on configurable normal, warning, and critical thresholds.
* Historical Data: Visualization of metric history over 1H, 6H, 24H, and 7D periods.
* System Architecture: Python backend (FastAPI, PostgreSQL), Eclipse Mosquitto broker, and Next.js frontend.

---

## Technology Stack

* Frontend: Next.js 16 (App Router), React 19, TypeScript, TailwindCSS v4, Recharts, Shadcn/UI
* Backend: Python 3.14, FastAPI, SQLModel (SQLAlchemy 2.0), asyncpg, Alembic
* IoT & Messaging: ESP32 Microcontrollers, Eclipse Mosquitto (MQTT), Paho-MQTT
* Database: PostgreSQL 18
* Infrastructure: Docker & Docker Compose

---

## Documentation

* [Context & Developer Guide](context.md) - Overview of the monorepo, API routes, and data flow.
* [Technical Documentation](technical_documentation.md) - System Architecture, ERD Diagrams, and MQTT sequence flows.

---

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js & npm
- Python & uv

### Development Setup (Local)

1. Start Infrastructure Services (Database & MQTT Broker)
```bash
docker compose -f compose.prod.yml up broker db -d
```

2. Run Backend Service (FastAPI)
```bash
cd hydroponic_be
uv sync
source .venv/bin/activate
alembic upgrade head
uvicorn app.main:app --reload
```

3. Run Frontend Application (Next.js)
```bash
cd hydroponic_fe
npm install
npm run dev
```

### Running with Docker

```bash
sudo bash start.prod.sh

# Or using docker compose directly
docker compose -f compose.prod.yml up --build -d
```

To stop the Docker stack:
```bash
sudo bash stop.prod.sh
```

---

## Project Structure

```text
smart-farming-lab/
├── hydroponic_be/         # Python FastAPI Backend
├── hydroponic_fe/         # Next.js Frontend
├── mosquitto/             # MQTT Broker Configuration
├── postgres/              # Database Configuration
├── context.md             # Developer contextual knowledge
├── technical_documentation.md # Architecture & system specifications
├── compose.prod.yml       # Production docker-compose definitions
└── .env                   # Environment variable definitions
```
