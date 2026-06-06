# 🌱 Smart Farming Lab — Project Context

> Dokumentasi lengkap member baru agar memahami project ini secara menyeluruh.
> Last updated: 2026-04-25

---

## 📌 Gambaran Umum

**Smart Farming Lab** adalah sistem monitoring & kontrol hidroponik berbasis IoT yang terdiri dari 3 lapisan utama:

| Layer         | Teknologi                        | Fungsi                                         |
|---------------|----------------------------------|------------------------------------------------|
| **IoT Layer** | ESP32 + Sensor                   | Baca sensor & kirim data via MQTT              |
| **Backend**   | Python (FastAPI)                 | Terima data MQTT, proses, simpan ke PostgreSQL |
| **Frontend**  | Next.js 16 (React 19)            | Dashboard monitoring & kontrol kalibrasi       |

```
ESP32 (Sensor) ──MQTT──▶ Mosquitto Broker ──▶ Backend (FastAPI) ──HTTP──▶ Frontend (Next.js)
                                                      │
                                                 PostgreSQL DB
```

---

## 🗂️ Struktur Monorepo

```
smart-farming-lab/
├── hydroponic_be/         # Backend Python FastAPI
├── hydroponic_fe/         # Frontend Next.js
├── mosquitto/             # Mosquitto MQTT Broker (Dockerized)
├── postgres/              # Konfigurasi PostgreSQL
├── compose.prod.yml       # Docker Compose (production)
├── .env                   # Environment variables (root)
├── start.sh               # Script start development
└── start.prod.sh          # Script start production
```

---

## ⚙️ Infrastruktur & Environment

### Services (Docker Compose)

| Service     | Port  | Image            | Keterangan                            |
|-------------|-------|------------------|---------------------------------------|
| `backend`   | 8000  | `backend:0.1`    | FastAPI app, wait for `db` & `broker` |
| `frontend`  | 3000  | `frontend:0.1`   | Next.js app                           |
| `db`        | 5432  | `postgres:18.3-alpine` | Database utama                  |
| `broker`    | 1883  | `broker:0.1`     | Mosquitto MQTT Broker                 |

### Environment Variables (`.env`)

```env
# PostgreSQL
POSTGRES_SERVER="db:5432"
POSTGRES_USER="admin_lab"
POSTGRES_PASSWORD="admin123"
POSTGRES_DB="hydroponic_db"

# MQTT
MQTT_BROKER="broker"
MQTT_PORT=1883
MQTT_USERNAME="admin_lab"
MQTT_PASSWORD="admin123"
```

> Variable `BACKEND_URL` di frontend diarahkan ke `http://backend:8000` (via Docker network) atau `http://localhost:8000` (lokal).

---

## 🔧 Cara Menjalankan

### Mode Development (Lokal)

```bash
# 1. Jalankan semua service Docker (broker, db)
docker compose -f compose.prod.yml up broker db -d

# 2. Jalankan backend
cd hydroponic_be
uv sync                         # Install dependencies
source .venv/bin/activate
alembic upgrade head            # Jalankan migrasi DB
uvicorn app.main:app --reload   # Start server di :8000

# 3. Jalankan frontend
cd hydroponic_fe
npm install
npm run dev                     # Start Next.js di :3000
```

### Mode Production (Docker)

```bash
./start.prod.sh
# atau
docker compose -f compose.prod.yml up --build -d
```

### Simulasi ESP32 (tanpa hardware)

```bash
cd hydroponic_fe
npm run simulate   # node scripts/simulate-esp32.mjs
```

---

---

# 🖥️ FRONTEND

**Path:** `hydroponic_fe/`  
**Stack:** Next.js 16, React 19, TypeScript, TailwindCSS v4, Recharts, Shadcn/UI, Radix UI

---

## 📁 Struktur Frontend

```
hydroponic_fe/src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Dashboard utama (/)
│   ├── layout.tsx          # Root layout
│   ├── globals.css         # CSS global + design tokens
│   ├── calibration/        # Hub kalibrasi sensor (/calibration)
│   │   ├── page.tsx        # Overview 5 rak kalibrasi
│   │   └── [rackId]/       # Detail kalibrasi per rak (/calibration/1..5)
│   ├── history/            # Hub riwayat data (/history)
│   │   └── page.tsx        # Overview 5 rak history
│   ├── rack/
│   │   └── [id]/           # Grafik detail per rak (/rack/1..5)
│   │       └── page.tsx    # Grafik area chart time-series
│   └── api/                # Next.js Route Handlers (proxy ke backend)
│       ├── racks/route.ts          # GET /api/racks
│       ├── rack/[id]/history/      # GET /api/rack/[id]/history
│       ├── room/                   # GET /api/room
│       └── calibration/[id]/      # POST/GET kalibrasi
├── components/              # Reusable UI components
│   ├── rack-card.tsx        # Kartu sensor per rak (dashboard)
│   ├── top-navbar.tsx       # Navigation bar (status + icons)
│   ├── room-monitor.tsx     # Widget suhu & kelembapan ruangan
│   ├── notification-center.tsx  # Bell notifikasi sistem
│   ├── summary-panel.tsx    # Panel ringkasan (disabled)
│   ├── mini-chart.tsx       # Sparkline chart kecil
│   ├── water-tank.tsx       # Animasi water tank
│   ├── header.tsx           # Header page
│   ├── theme-provider.tsx   # Dark/light mode provider
│   ├── calibration/         # Step-by-step calibration wizard
│   └── ui/                  # Shadcn UI components (button, card, badge, dll.)
├── lib/                     # Business logic & custom hooks
│   ├── simulation.ts        # Interface types + useRoomSensor hook
│   ├── use-racks.ts         # useRacks() — polling data rak setiap 3s
│   ├── useRackHistory.ts    # useRackHistory() — data grafik per rak
│   ├── calibration.ts       # Logika kalibrasi + sendCalibrationCommand
│   ├── notifications.ts     # useNotifications() — alert sistem
│   ├── thresholds.ts        # Batas normal/warning/critical per sensor
│   └── utils.ts             # Helper umum
└── assets/
    └── images/              # Background images (AVIF)
```

---

## 🗺️ Halaman-Halaman Frontend

### 1. Dashboard Utama — `/`

**File:** `src/app/page.tsx`

Halaman utama yang menampilkan:
- **Header** dengan judul "Lab Smart Farming" + status sistem
- **RoomMonitor** — suhu & kelembapan ruangan (dari ESP32 Room Monitor)
- **TopNavbar** — status ESP32, server online, last sync, notifikasi, link ke history & kalibrasi
- **Grid 5 RackCard** — kartu sensor masing-masing rak (polling 3 detik)

Hooks yang digunakan:
```ts
const { racks, system } = useRacks();        // Data 5 rak (polling 3s)
const { roomData, esp32Online } = useRoomSensor(); // Suhu/humidity ruangan
const notifications = useNotifications(...); // Notifikasi otomatis
```

---

### 2. History Hub — `/history`

**File:** `src/app/history/page.tsx`

Overview 5 rak dengan tombol "View Detailed Charts" yang mengarah ke `/rack/[id]`.  
Menampilkan status aktif/inaktif dan last sync per rak.

---

### 3. Detail Grafik Rak — `/rack/[id]`

**File:** `src/app/rack/[id]/page.tsx`

Grafik time-series (Area Chart via Recharts) untuk semua sensor di satu rak.  
Fitur:
- **Time range filter**: 1 Jam, 6 Jam, 24 Jam, 7 Hari
- Refresh otomatis setiap 15 detik
- Warna unik per sensor type
- Menampilkan nilai terbaru via Badge

Data diambil dari hook:
```ts
const { data, loading, error } = useRackHistory(rackId, timeRange);
// → fetch ke /api/rack/[id]/history?range=1h
```

---

### 4. Calibration Hub — `/calibration`

**File:** `src/app/calibration/page.tsx`

Overview 5 rak kalibrasi. Menampilkan:
- Status pH Sensor & TDS Sensor (✅ Calibrated / ⚠️ Needs Attention)
- Tanggal terakhir kalibrasi
- Tombol "Start Calibration" / "Recalibrate"

Kalibrasi menggunakan data yang disimpan di `localStorage` (backup lokal dari data ESP32).

---

### 5. Detail Kalibrasi per Rak — `/calibration/[rackId]`

**File:** `src/app/calibration/[rackId]/page.tsx`

Wizard kalibrasi step-by-step:

**pH Calibration (2-point):**
1. Celup sensor ke larutan buffer **pH 7.00** → tekan confirm
2. Celup sensor ke larutan buffer **pH 4.00** → tekan confirm
3. Backend kirim command `KALIBRASI_PH` via MQTT ke ESP32

**TDS Calibration (1-point):**
1. Celup sensor ke larutan **1382 ppm** → tekan confirm
2. Backend kirim command `KALIBRASI_TDS` via MQTT ke ESP32

**Reset Calibration:**
- Mengirim command `RESET_CALIBRATION` ke ESP32

---

## 🔄 Data Flow Frontend

```
Browser → /api/racks (Next.js Route Handler)
             → fetch ke backend:8000/api/v1/datalogs/latest
             → Update in-memory store (25 data points history)
             → Return RackData[] ke browser
```

**Key mapping (ESP32 → Frontend):**

| ESP32 Key        | Frontend Key   | Threshold Type  |
|------------------|----------------|-----------------|
| `ph`             | `ph`           | `ph`            |
| `ec`             | `ec`           | `ec`            |
| `water_temp`     | `waterTemp`    | `waterTemp`     |
| `water_level`    | `waterLevel`   | `waterLevel`    |
| `water_flow`     | `waterFlow`    | `waterFlow`     |
| `light_intensity`| `lightIntensity`| `lightIntensity`|

---

## 📊 Sensor Thresholds

Definisi di `src/lib/thresholds.ts`:

| Sensor         | Unit    | Warning Low | Warning High | Critical Low | Critical High |
|----------------|---------|-------------|--------------|--------------|---------------|
| Room Temp      | °C      | 24          | 30           | 20           | 35            |
| Room Humidity  | %       | 50          | 70           | 40           | 80            |
| Water Temp     | °C      | 18          | 28           | 15           | 32            |
| Water Level    | %       | 30          | —            | 15           | —             |
| pH             | —       | 5.5         | 6.5          | 4.5          | 7.5           |
| EC (Nutrition) | mS/cm   | 1.0         | 2.5          | 0.5          | 3.0           |
| Water Flow     | L/min   | 1.0         | —            | 0.2          | —             |
| Light Intensity| lux     | 10,000      | 40,000       | 5,000        | 45,000        |

**Status levels:** `Normal` → `Low`/`High` (warning) → `Critical`

---

## 🔔 Sistem Notifikasi

Hook `useNotifications` di `src/lib/notifications.ts` secara otomatis membuat notifikasi berdasarkan status sensor:
- Threshold breach per sensor
- Status perubahan rak (Normal → Warning → Critical)
- Notifikasi dapat dibaca / dihapus semua

---

## 🎨 Design System

**Color palette utama:** `#34473d` (dark green)  
**Background:** `#f5f4f0` + dua background image AVIF (top garden, bottom field)  
**Style:** Glassmorphism (`bg-white/40 backdrop-blur-md border-white/20`)  
**Font:** Sans-serif default (system)  
**Component library:** Shadcn/UI + Radix UI

---

## 🔌 Frontend API Routes (Proxy)

Semua request ke backend melalui Next.js Route Handlers agar tidak ada CORS issue:

| Route                           | Method | Backend yang Dipanggil                           |
|---------------------------------|--------|--------------------------------------------------|
| `/api/racks`                    | GET    | `backend:8000/api/v1/datalogs/latest`            |
| `/api/rack/[id]/history`        | GET    | `backend:8000/api/v1/datalogs/{device_id}`       |
| `/api/room`                     | GET    | `backend:8000/api/v1/datalogs/latest?device_type=ROOM_MONITORING` |
| `/api/calibration/[id]/command` | POST   | `backend:8000/api/v1/commandlogs/{rack_id}`      |
| `/api/calibration/[id]/status`  | GET    | `backend:8000/api/v1/commandlogs/latest`         |

---

---

# ⚙️ BACKEND

**Path:** `hydroponic_be/`  
**Stack:** Python 3.14, FastAPI, SQLModel (SQLAlchemy + Pydantic), PostgreSQL, Alembic, Paho-MQTT, Gunicorn

---

## 📁 Struktur Backend

```
hydroponic_be/app/
├── main.py              # Entry point FastAPI app
├── api/
│   ├── main.py          # Inisialisasi APIRouter
│   └── routes/
│       ├── telemetry.py  # Endpoint data sensor (datalogs)
│       ├── command.py    # Endpoint command ke ESP32 (commandlogs)
│       ├── general.py    # Endpoint umum (info, device list)
│       └── auth.py       # Endpoint autentikasi (placeholder)
├── models/
│   ├── telemetry.py      # ORM models: Device, DeviceType, DataLog
│   └── command.py        # ORM models: CommandLog, CommandType, CommandStatus
├── crud/
│   ├── telemetry.py      # DB queries untuk DataLog
│   └── command.py        # DB queries untuk CommandLog + send_cmd
├── services/
│   ├── mqtt_worker.py    # MQTTWorker class (paho-mqtt client)
│   └── mqtt_handler.py   # Handler untuk tiap topic MQTT
├── db/
│   └── session.py        # Engine & Session SQLModel
├── core/
│   ├── config.py         # Settings (dev)
│   └── configprod.py     # Settings (production via env vars)
├── utils/
│   ├── utils_seeding.py  # Seed data awal ke DB
│   └── utils_time.py     # Helper timezone (Asia/Jakarta)
└── alembic/              # Migrasi database
```

---

## 🚀 Lifecycle Aplikasi

Di `main.py`, lifecycle FastAPI:

```python
@asynccontextmanager
async def lifespan(app):
    # Startup:
    seeding_to_db(db)        # Seed device types, command types, dll.
    mqtt_worker.connect()    # Connect ke MQTT Broker
    mqtt_worker.start()      # Start background thread (loop_start)
    yield
    # Shutdown:
    mqtt_worker.stop()       # Disconnect MQTT
```

---

## 🗄️ Database Schema (SQLModel ORM)

### `DeviceType` table
| Column | Type    | Keterangan                                |
|--------|---------|-------------------------------------------|
| `id`   | int PK  | Auto-increment                            |
| `desc` | str     | `"HYDROPONIC_RACKS"` / `"ROOM_MONITORING"` |
| `attr` | JSONB   | Extra attributes                          |

### `Device` table
| Column          | Type    | Keterangan                                        |
|-----------------|---------|---------------------------------------------------|
| `id`            | int PK  | Auto-increment                                    |
| `mac_addr`      | str     | MAC address ESP32                                 |
| `desc`          | str     | Deskripsi device                                  |
| `attr`          | JSONB   | `{"rack_id": 1}` — mapping ke nomor rak fisik     |
| `devicetype_id` | FK      | → `DeviceType.id`                                 |

> ⚠️ **Penting:** `Device.attr["rack_id"]` adalah field kunci untuk mapping device ke rak. `device_id` (primary key) bisa berbeda dari `rack_id`.

### `DataLog` table (TimeSeries)
| Column      | Type     | Keterangan                                     |
|-------------|----------|------------------------------------------------|
| `device_id` | FK/PK    | → `Device.id`                                  |
| `timestamp` | DateTime | UTC, timezone-aware (primary key komposit)     |
| `data_log`  | JSONB    | `{"ph": 6.2, "ec": 1.8, "water_temp": 24.5, ...}` |

### `CommandType` table
| Column | Type | Keterangan                                                 |
|--------|------|------------------------------------------------------------|
| `id`   | int PK |                                                          |
| `desc` | str  | `PUMP_ON`, `PUMP_OFF`, `KALIBRASI_TDS`, `KALIBRASI_PH`, `RESET_CALIBRATION` |

### `CommandStatus` table
| Column | Type | Keterangan                                          |
|--------|------|-----------------------------------------------------|
| `id`   | int PK |                                                   |
| `desc` | str  | `START`, `PENDING`, `SUCCESS`, `FAILED`, `TIME_OUT`, `BROKER_DOWN` |

### `CommandLog` table (TimeSeries)
| Column       | Type     | Keterangan                   |
|--------------|----------|------------------------------|
| `command_id` | FK/PK    | → `CommandType.id`           |
| `status_id`  | FK/PK    | → `CommandStatus.id`         |
| `device_id`  | FK/PK    | → `Device.id`                |
| `timestamp`  | DateTime | UTC (primary key komposit)   |
| `created_by` | str      | User yang trigger command    |
| `cmd_log`    | JSONB    | `{"known_value": 7.0}`       |

---

## 📡 MQTT Architecture

### Topics yang Di-subscribe Backend

| Topic               | Handler                 | Fungsi                                        |
|---------------------|-------------------------|-----------------------------------------------|
| `device/+/register` | `registering_handler`   | Register ESP32 baru ke database               |
| `rack/+/data`       | `telemetry_handler`     | Terima data sensor, simpan ke `DataLog`       |
| `rack/+/cmd/ack`    | `ack_command_handler`   | Terima ACK dari ESP32, update `CommandLog`    |

### Topics yang Di-publish Backend

| Topic          | Trigger                  | Payload                                          |
|----------------|--------------------------|--------------------------------------------------|
| `rack/{id}/cmd`| POST `/commandlogs/{id}` | `{mac_addr, command, status, cmd_log}`           |
| `device/+/register/ack` | Registrasi berhasil | `{"status": 1}`                             |

### Payload Format ESP32 → Backend

**Device Registration (`device/+/register`):**
```json
{
  "mac_addr": "AA:BB:CC:DD:EE:FF",
  "desc": "Rack 1 ESP32",
  "type_id": "HYDROPONIC_RACKS",
  "attr": {"rack_id": 1}
}
```

**Telemetry Data (`rack/+/data`):**
```json
{
  "mac_addr": "AA:BB:CC:DD:EE:FF",
  "data": {
    "ph": 6.2,
    "ec": 1.8,
    "water_temp": 24.5,
    "water_level": 75,
    "water_flow": 3.2,
    "light_intensity": 22000
  }
}
```

**Room Monitoring (`rack/+/data` dengan device type ROOM_MONITORING):**
```json
{
  "mac_addr": "...",
  "data": {
    "temperature": 27.5,
    "humidity": 65.0
  }
}
```

**Command ACK (`rack/+/cmd/ack`):**
```json
{
  "mac_addr": "AA:BB:CC:DD:EE:FF",
  "command": "KALIBRASI_PH",
  "status": "SUCCESS",
  "cmd_log": {"ph_slope": 1.02, "ph_offset": -0.1}
}
```

---

## 🌐 REST API Endpoints

**Base URL:** `http://localhost:8000/api/v1`  
**Docs:** `http://localhost:8000/docs` (Swagger UI)

### Telemetry (`/datalogs`)

| Method | Endpoint               | Deskripsi                                              |
|--------|------------------------|--------------------------------------------------------|
| GET    | `/datalogs/`           | Semua data log (filter: limit, start_date, end_date, device_type) |
| GET    | `/datalogs/latest`     | Data terbaru per device (digunakan dashboard real-time) |
| GET    | `/datalogs/{device_id}`| Data log per device ID (dengan filter waktu)           |
| GET    | `/datalogs/exports/csv`| Download CSV semua data                                |
| GET    | `/datalogs/export/csv/{device_id}` | Download CSV per device                  |

**Query params umum:**
- `limit` — jumlah data
- `start_date` / `end_date` — filter waktu (ISO format)
- `device_type` — `HYDROPONIC_RACKS` (default) atau `ROOM_MONITORING`

### Commands (`/commandlogs`)

| Method | Endpoint                   | Deskripsi                                                 |
|--------|----------------------------|-----------------------------------------------------------|
| GET    | `/commandlogs/`            | Semua command log                                         |
| GET    | `/commandlogs/latest`      | Command terbaru per device                                |
| GET    | `/commandlogs/{device_id}` | Command log per device ID                                 |
| POST   | `/commandlogs/{rack_id}`   | Kirim command ke ESP32 via MQTT                           |
| GET    | `/commandlogs/exports/csv` | Download CSV command log                                  |

**POST `/commandlogs/{rack_id}` — Body:**
```json
{
  "created_by": "Lab Admin",
  "command_type": "KALIBRASI_PH"
}
```
+ query body `input_json`:
```json
{
  "known_value": 7.0
}
```

### Command Types yang Tersedia

| Command             | Keterangan                             |
|---------------------|----------------------------------------|
| `PUMP_ON`           | Nyalakan pompa rak                     |
| `PUMP_OFF`          | Matikan pompa rak                      |
| `KALIBRASI_PH`      | Kalibrasi sensor pH (known_value = pH buffer) |
| `KALIBRASI_TDS`     | Kalibrasi sensor TDS (known_value = ppm reference) |
| `RESET_CALIBRATION` | Reset kalibrasi ke factory default     |

### Health Check

| Method | Endpoint  | Response                                           |
|--------|-----------|----------------------------------------------------|
| GET    | `/health` | `{"status": "healthy", "service": "smart-hydro-backend"}` |

---

## 🧠 Business Logic Backend

### `DataLog` — Cara Data Tersimpan

1. ESP32 publish ke `rack/{rack_id}/data`
2. `telemetry_handler` menerima payload
3. Lookup `device_id` berdasarkan `mac_addr`
4. Simpan `DataLog(device_id=..., data_log={...})` ke PostgreSQL

### Response Model `DataLogWithRack`

Saat query `/datalogs/latest`, backend mengembalikan:
```json
{
  "device_id": 2,
  "data_log": {"ph": 6.1, "ec": 1.9, ...},
  "timestamp": "2026-04-25T19:00:00+07:00",
  "rack_id": 1
}
```

> `rack_id` di-extract dari `Device.attr["rack_id"]` menggunakan JSONB cast di SQL query.

### `send_cmd_to_rack_id` — Alur Command

1. Frontend POST ke `/api/calibration/[id]/command`
2. Next.js proxy → backend POST `/commandlogs/{rack_id}`
3. Backend cari device berdasarkan `rack_id` dari `Device.attr`
4. Simpan `CommandLog` dengan status `PENDING`
5. Publish ke `rack/{rack_id}/cmd` via MQTT
6. ESP32 eksekusi → publish ACK ke `rack/{rack_id}/cmd/ack`
7. `ack_command_handler` tangkap ACK → simpan `CommandLog` baru dengan status `SUCCESS`/`FAILED`
8. Frontend polling `/calibration/[id]/status` setiap 2 detik sampai dapat status akhir

---

## 🔑 Kalibrasi Sensor — Detail Teknis

### pH Calibration (2-point)

- Buffer: pH 7.00 (neutral) → pH 4.00 (acid)
- ESP32 menghitung **slope** dan **offset**:
  - `pH = (slope × raw_ADC) + offset`
- Hasil disimpan di flash ESP32
- Frontend menyimpan koefisien di `localStorage` sebagai backup:
  - `ph_slope`, `ph_offset`, `ph_calibrated_at`

### TDS Calibration (1-point)

- Reference solution: **1382 ppm**
- ESP32 baca suhu air sendiri untuk temperature compensation
- Koefisien: `tds_k_factor`, `tds_offset`
- Formula: `TDS = (value × k_factor + offset) / (1 + 0.019 × (temp - 25))`

### Polling ACK

Frontend melakukan polling setiap 2 detik, timeout 30 detik:
```
POST /api/calibration/{id}/command
  → Poll GET /api/calibration/{id}/status?command_type=KALIBRASI_PH
  → Status: PENDING | SUCCESS | FAILED | TIMEOUT_ASSUMED_OK
```

---

## 🌱 Database Seeding

Saat startup, `seeding_to_db()` memastikan data awal ada di DB:

- **DeviceType**: `HYDROPONIC_RACKS`, `ROOM_MONITORING`
- **CommandType**: `PUMP_ON`, `PUMP_OFF`, `KALIBRASI_TDS`, `KALIBRASI_PH`, `RESET_CALIBRATION`
- **CommandStatus**: `START`, `PENDING`, `SUCCESS`, `FAILED`, `TIME_OUT`, `BROKER_DOWN`

---

## 🗃️ Migrasi Database (Alembic)

```bash
# Generate migrasi baru
alembic revision --autogenerate -m "nama_migrasi"

# Terapkan migrasi
alembic upgrade head

# Rollback satu langkah
alembic downgrade -1
```

File migrasi ada di `hydroponic_be/alembic/versions/`.

---

---

## 🔁 Alur Data End-to-End (Summary)

```
1. ESP32 mengumpulkan data sensor
   ↓
2. Publish ke Mosquitto: rack/1/data → {mac_addr, data: {ph, ec, ...}}
   ↓
3. Backend (MQTT Worker) menerima → telemetry_handler
   → Simpan ke PostgreSQL: DataLog(device_id, data_log, timestamp)
   ↓
4. Frontend polling /api/racks setiap 3 detik
   → Next.js Route Handler fetch GET /api/v1/datalogs/latest
   → Map ESPkey → feKey, accumulate 25-point history
   → Kirim RackData[] ke browser
   ↓
5. Browser render RackCard per rak dengan:
   - Nilai sensor realtime
   - Status (Normal/Warning/Critical)
   - Mini sparkline chart
   - Trend indicator (% change)
   - Progress bar terhadap threshold

6. Kalibrasi:
   Frontend → POST /api/calibration/[id]/command
   → Backend → MQTT publish rack/1/cmd
   → ESP32 eksekusi → ACK via rack/1/cmd/ack
   → Frontend polling status tiap 2s (max 30s)
```

---

## 📝 Konvensi Kode Penting

- **timezone**: Semua timestamp disimpan UTC di DB, dikembalikan dalam timezone `Asia/Jakarta`
- **rack_id vs device_id**: `rack_id` adalah nomor rak fisik (1–5) yang disimpan di `Device.attr["rack_id"]`. `device_id` adalah PK internal DB. **Selalu gunakan `rack_id` untuk identifikasi rak di frontend.**
- **SENSOR_MAP**: Mapping `snake_case` (ESP32) → `camelCase` (frontend) ada di `hydroponic_fe/src/app/api/racks/route.ts`
- **Calibration backend**: Kalibrasi didelegasikan ke ESP32. Backend hanya meneruskan command. Koefisien disimpan di flash ESP32 + localStorage browser (backup).
- **In-memory sensor store**: `/api/racks` Next.js route mempertahankan history 25 data point secara in-memory. Data hilang jika Next.js server restart.
- **Offline fallback**: Jika backend tidak bisa dijangkau, dashboard tetap menampilkan data terakhir dari in-memory store.
