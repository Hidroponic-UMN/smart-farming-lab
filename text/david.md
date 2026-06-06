# Laporan Pekerjaan Magang: Smart Farming Lab UMN
**Nama:** David (Backend, Firmware & Infrastructure)

Berikut adalah laporan komprehensif mengenai tugas dan pencapaian selama program magang (16 minggu) pada proyek Smart Farming Lab UMN. Laporan ini disusun berdasarkan fungsi bidang kerja, dengan penekanan detail pada pengembangan sistem *backend*, infrastruktur *server*, pengolahan *database*, dan *firmware embedded system*.

---

## 1. Backend API (FastAPI)

Sebagai penanggung jawab utama sistem *server-side*, saya membangun seluruh backend RESTful API menggunakan **FastAPI** — sebuah framework web Python modern yang mendukung *type hinting* secara native dan *auto-documentation* via Swagger UI.

### 1.1. Setup Proyek & Struktur Modular

Penulis memulai pengembangan backend dengan membuat struktur proyek yang modular dan terorganisir di dalam folder `hydroponic_be/app/`. Struktur ini dipecah menjadi beberapa direktori berdasarkan tanggung jawab:
- `app/api/routes/` — berisi definisi endpoint HTTP (router).
- `app/crud/` — berisi fungsi-fungsi *Create, Read, Update, Delete* yang berinteraksi langsung dengan database.
- `app/models/` — berisi definisi model ORM (tabel database).
- `app/services/` — berisi logika bisnis dan layanan eksternal (MQTT worker).
- `app/core/` — berisi konfigurasi aplikasi (kredensial database, MQTT, dll).
- `app/db/` — berisi konfigurasi koneksi database (engine, session).
- `app/utils/` — berisi fungsi utilitas (seeding, waktu UTC).

File utama `main.py` menginisialisasi aplikasi FastAPI dengan judul "Smart-Hydroponic" versi `0.0.1`. Penulis mengimplementasikan **CORS middleware** dengan `allow_origins=["*"]` agar frontend dapat mengakses API dari domain mana pun selama tahap pengembangan. Seluruh router dikelompokkan di bawah prefix `/api/v1` melalui file `api/main.py`, dan endpoint `/health` dibuat untuk keperluan *health check* oleh Docker.

### 1.2. Lifespan Management — Database Seeding & MQTT Startup

Salah satu keputusan arsitektur penting adalah penggunaan **`asynccontextmanager` lifespan** pada FastAPI, yang memungkinkan eksekusi kode saat server mulai (*startup*) dan berhenti (*shutdown*) secara terkontrol.

**Proses Startup:**
1. Penulis membuat koneksi database menggunakan `Session(engine)` dan memanggil fungsi `seeding_to_db(db)`.
2. Fungsi seeding (`app/utils/utils_seeding.py`) memeriksa apakah tabel-tabel referensi sudah terisi. Jika kosong, fungsi ini secara otomatis menyuntikkan data *seed* esensial:
   - **`CommandType`**: 5 tipe perintah — `PUMP_ON`, `PUMP_OFF`, `KALIBRASI_TDS`, `KALIBRASI_PH`, `RESET_CALIBRATION`.
   - **`CommandStatus`**: 6 status — `START`, `PENDING`, `SUCCESS`, `FAILED`, `TIME_OUT`, `BROKER_DOWN`.
   - **`DeviceType`**: 2 tipe perangkat — `HYDROPONIC_RACKS`, `ROOM_MONITORING`.
3. Setelah seeding selesai, `mqtt_worker.connect()` dan `mqtt_worker.start()` dipanggil untuk menjalankan *thread* MQTT secara paralel dengan server web.

**Proses Shutdown:**
Saat server dihentikan (misalnya `Ctrl+C` atau `docker stop`), fungsi `mqtt_worker.stop()` dipanggil untuk memutus koneksi ke broker MQTT dan menghentikan *thread* listener secara aman, mencegah *zombie process*.

Penulis juga membuat fungsi `get_global_var()` yang meng-*cache* hasil query tabel referensi (`CommandStatus`, `CommandType`, `DeviceType`) ke dalam variabel global Python. Ini menghindari query berulang ke database setiap kali ada pesan MQTT masuk — karena data referensi ini bersifat statis dan tidak berubah selama runtime.

### 1.3. Desain Database dengan SQLModel & Kolom JSONB

Untuk interaksi dengan database **PostgreSQL**, penulis memilih **SQLModel** — sebuah library yang menggabungkan fitur ORM dari SQLAlchemy dan validasi data dari Pydantic dalam satu definisi kelas.

**Model-model yang didefinisikan:**

1. **`DeviceType`** (tabel `devicetype`): Menyimpan jenis perangkat (`HYDROPONIC_RACKS` atau `ROOM_MONITORING`). Memiliki relasi one-to-many ke `Device`.

2. **`Device`** (tabel `device`): Merepresentasikan satu unit ESP32. Berisi `mac_addr` (UUID unik), `devicetype_id` (foreign key ke `DeviceType`), dan kolom `attr` bertipe **JSONB**.

3. **`DataLog`** (tabel `datalog`): Menyimpan setiap kiriman data sensor dari ESP32. Menggunakan **composite primary key** dari `device_id` dan `timestamp`, yang memastikan setiap entri unik berdasarkan kombinasi perangkat dan waktu.

4. **`CommandLog`** (tabel `commandlog`): Mencatat setiap perintah yang dikirim ke ESP32 beserta statusnya. Menggunakan composite primary key dari `command_id`, `status_id`, `device_id`, dan `timestamp`.

5. **`CommandType`** dan **`CommandStatus`**: Tabel referensi untuk jenis perintah dan status eksekusi.

**Keputusan Arsitektur JSONB:**

Tantangan utama dalam sistem IoT ini adalah tipe data sensor yang dapat bertambah tanpa perlu mengubah skema tabel. Penulis mengatasinya dengan menggunakan **kolom JSONB** pada model `Device`, `DeviceType`, `CommandType`, `CommandStatus`, dan `CommandLog`. Kolom `attr: Dict[str, Any] = Field(default_factory=dict, sa_type=JSONB)` memungkinkan penyimpanan atribut dinamis tanpa migrasi database.

Contoh penggunaan: kolom `attr` di tabel `Device` menyimpan `{"rack_id": 1, "about": "ini esp32 untuk rack 1"}`, dan kemudian ditambahkan `{"planted_at": "2026-05-01"}` oleh fitur Planted Date tanpa perlu ALTER TABLE.

Penulis juga menemukan dan memperbaiki **bug SQLAlchemy** terkait mutasi objek JSON. Ketika nilai di dalam kolom JSONB diubah secara *in-place* (misalnya `device.attr["planted_at"] = "2026-05-01"`), SQLAlchemy tidak mendeteksi perubahan tersebut karena referensi objek Python tidak berubah. Solusinya: penulis melakukan *cloning* dictionary (`current_attr = dict(device.attr)`) lalu memanggil `flag_modified(device, "attr")` untuk memaksa SQLAlchemy menandai kolom sebagai *dirty* dan menuliskannya ke database saat `COMMIT`.

### 1.4. Connection Pooling & Konfigurasi Database Engine

Penulis mengonfigurasi `SQLAlchemy Engine` di file `db/session.py` dengan parameter:
- `pool_size=10`: Menyediakan 10 koneksi persisten ke PostgreSQL yang siap digunakan.
- `max_overflow=20`: Mengizinkan hingga 20 koneksi tambahan di saat beban tinggi.
- `echo=False`: Menonaktifkan logging SQL untuk mengurangi overhead I/O di produksi.

Fungsi `get_session()` menggunakan *generator pattern* (`yield`) yang memastikan setiap request HTTP mendapat sesi database tersendiri dan sesi tersebut ditutup setelah request selesai — mencegah *connection leak*.

### 1.5. Endpoint Telemetri — Data Sensor

Router `/api/v1/datalogs` (`app/api/routes/telemetry.py`) menyediakan endpoint untuk mengakses data sensor:

1. **`GET /datalogs/`** — Mengambil semua log data sensor. Mendukung parameter query: `limit` (batas jumlah data), `start_date`, `end_date` (filter rentang waktu), dan `device_type` (filter jenis perangkat: `HYDROPONIC_RACKS` atau `ROOM_MONITORING`).

2. **`GET /datalogs/latest`** — Mengambil data terbaru dari setiap perangkat. Penulis menggunakan teknik SQL `DISTINCT ON (device_id)` yang dikombinasikan dengan `ORDER BY device_id, timestamp DESC` untuk mendapatkan satu baris terbaru per perangkat dalam satu query tunggal — jauh lebih efisien dibandingkan melakukan subquery atau loop per device.

3. **`GET /datalogs/{device_id}`** — Mengambil histori data untuk satu perangkat spesifik.

4. **`GET /datalogs/exports/{file_type}`** — Mengekspor data ke format CSV. Penulis menggunakan `StreamingResponse` dari FastAPI yang dikombinasikan dengan `io.StringIO` dan modul `csv` bawaan Python. Data tidak disimpan sebagai file fisik di server, melainkan langsung di-*stream* ke browser — hemat memori dan instan.

Penulis juga mengimplementasikan konversi timezone otomatis pada seluruh query menggunakan `func.timezone('Asia/Jakarta', DataLog.timestamp)`, sehingga timestamp yang dikembalikan ke frontend sudah dalam format WIB.

### 1.6. Endpoint Command — Pengiriman Perintah ke ESP32

Router `/api/v1/commandlogs` (`app/api/routes/command.py`) menangani sistem perintah dua arah antara dashboard dan ESP32.

**Endpoint Kritis: `POST /commandlogs/{rack_id}`**

Ini adalah endpoint yang memungkinkan frontend mengirim perintah kalibrasi ke ESP32 secara remote. Penulis mengimplementasikan alur sebagai berikut:

1. Frontend mengirim POST request dengan body berisi `command` (bertipe `CmdInput` — misalnya `KALIBRASI_PH`) dan `input_json` (bertipe `JSONInput` — misalnya `{"known_value": 7.0}`).
2. Fungsi `send_cmd_to_rack_id()` di `crud/command.py` melakukan:
   a. Mengecek apakah `mqtt_worker` terhubung ke broker. Jika tidak, langsung mengembalikan HTTP 501.
   b. Memvalidasi bahwa `command_type` yang diminta ada di tabel `CommandType`.
   c. Mencari `device_id` berdasarkan `rack_id` yang disimpan di kolom JSONB `attr` — menggunakan `cast(Device.attr["rack_id"].as_string(), Integer) == rack_id`. Teknik ini memungkinkan *querying* langsung ke dalam objek JSON di PostgreSQL.
   d. Membuat objek `CmdMicroController` yang berisi `mac_addr`, `command`, `status: START`, dan `cmd_log`.
   e. Menyimpan `CommandLog` dengan status `PENDING` ke database sebagai catatan audit.
   f. Mempublikasikan perintah ke topik MQTT `rack/{rack_id}/cmd`.
3. ESP32 menerima perintah, mengeksekusi kalibrasi, lalu mengirim ACK ke `rack/{rack_id}/cmd/ack`.
4. Backend menerima ACK melalui `ack_command_handler` dan menyimpan status akhir (`SUCCESS` atau `FAILED`) ke tabel `CommandLog`.

### 1.7. Endpoint General — Device Management

Router `/api/v1/generals` (`app/api/routes/general.py`) menyediakan endpoint untuk manajemen perangkat:

1. **`GET /generals/devices`** — Mengembalikan daftar semua perangkat ESP32 yang terdaftar, termasuk atribut JSONB-nya.
2. **`GET /generals/commandtypes`** dan **`GET /generals/commandstatus`** — Mengembalikan tabel referensi untuk keperluan frontend.
3. **`PATCH /generals/devices/{device_id}/planted-date`** — Memperbarui atribut `planted_at` di kolom JSONB `attr` pada tabel `Device`. Penulis menggunakan model Pydantic `PlantedDateUpdate` untuk validasi input.

Pada fungsi `update_device_attr()` di `crud/general.py`, penulis menambahkan logika **upsert**: jika device belum ada di database (misalnya saat frontend mencoba set tanggal tanam untuk rak yang belum pernah mengirim data), fungsi ini membuat *dummy device* terlebih dahulu dengan `mac_addr` placeholder, lalu memperbarui atributnya. Ini mencegah error 404 pada skenario di mana pengguna ingin mengatur tanggal tanam sebelum ESP32 aktif.

---

## 2. MQTT Worker & Integrasi IoT

Data dari ESP32 dikirim bukan melalui HTTP, melainkan melalui protokol **MQTT** (*Message Queuing Telemetry Transport*) — protokol *publish-subscribe* yang ringan dan dirancang khusus untuk perangkat IoT dengan bandwidth terbatas.

### 2.1. Kelas `MQTTWorker` — Singleton Thread-Safe

Penulis membungkus library `paho-mqtt` di dalam kelas *custom* `MQTTWorker` (`app/services/mqtt_worker.py`). Kelas ini dirancang sebagai **Singleton** — hanya satu instance (`mqtt_worker`) yang dibuat dan digunakan di seluruh aplikasi.

Fitur-fitur kelas `MQTTWorker`:
- **Thread-safe subscription**: Menggunakan `threading.Lock()` untuk memastikan pendaftaran handler bersifat aman meskipun diakses dari multiple thread.
- **Auto-reconnect**: `reconnect_delay_set(min_delay=1, max_delay=120)` dikonfigurasi agar worker memulai dengan delay 1 detik dan secara eksponensial meningkat hingga 120 detik jika broker terus tidak merespons — mencegah *connection storm*.
- **QoS 1 Publishing**: Semua pesan dipublikasikan dengan `qos=1` (*at least once delivery*), memastikan setiap perintah kalibrasi terkirim minimal sekali ke ESP32.
- **Topic Wildcard Matching**: Pada metode `on_message`, penulis menggunakan `mqtt.topic_matches_sub(sub, topic)` untuk mencocokkan topik masuk dengan pola wildcard yang telah didaftarkan (misalnya `rack/+/data` mencocokkan `rack/1/data`, `rack/2/data`, dst).

### 2.2. Handler Topik MQTT (`mqtt_handler.py`)

Pada saat koneksi berhasil (`on_connect`), server secara otomatis men-*subscribe* ke tiga pola topik:

**1. `device/+/register` → `registering_handler`**

Ketika ESP32 pertama kali dinyalakan, ia mengirim pesan registrasi berisi `mac_addr`, `type_id` (misalnya `"HYDROPONIC_RACKS"`), `desc`, dan `attr` ke topik ini. Handler melakukan:
1. Validasi payload menggunakan model Pydantic `RegisterMicroController`.
2. Mengecek apakah `mac_addr` sudah ada di tabel `Device`.
3. Jika belum ada, membuat record baru di database dengan `devicetype_id` yang sesuai.
4. Mengirim ACK ke `device/{id}/register/ack` dengan `{"status": 1}` agar ESP32 tahu registrasi berhasil.
5. Jika sudah ada, tetap mengirim ACK tanpa duplikasi — memastikan ESP32 tidak terjebak di loop registrasi setelah reboot.

**2. `rack/+/data` → `telemetry_handler`**

Setiap 5 detik, ESP32 mengirim data sensor ke topik ini. Handler:
1. Memvalidasi payload dengan `TelemetryMicroController` (berisi `mac_addr` dan `data`).
2. Mencari `device_id` berdasarkan `mac_addr` di database.
3. Jika device ditemukan, membuat record `DataLog` baru dan meng-*commit* ke database.
4. Jika device tidak ditemukan, mencetak pesan error — bukan exception — agar MQTT worker tidak berhenti karena satu perangkat yang belum terdaftar.

**3. `rack/+/cmd/ack` → `ack_command_handler`**

Setelah ESP32 mengeksekusi perintah kalibrasi, ia mengirim status balik ke topik ini. Handler:
1. Memvalidasi payload dengan `CmdMicroController` (berisi `mac_addr`, `command`, `status`, `cmd_log`).
2. Mengonversi string command dan status ke ID integer menggunakan tabel referensi yang sudah di-cache (`get_global_var()`).
3. Membuat record `CommandLog` baru dengan status final (`SUCCESS`, `FAILED`, atau `TIMEOUT`).

---

## 3. Infrastruktur Docker & Deployment

Penulis merancang seluruh infrastruktur deployment menggunakan **Docker Compose**, memungkinkan semua komponen sistem berjalan sebagai *microservices* yang saling terhubung dalam satu jaringan virtual.

### 3.1. Arsitektur Microservices (`compose.prod.yml`)

File `compose.prod.yml` mendefinisikan empat layanan (*service*):

1. **`backend`** — Container FastAPI yang dibangun dari `hydroponic_be/Dockerfile`. Port 8000 di-*expose*. Volume `./hydroponic_be:/app:Z` di-*mount* untuk *hot-reload* selama pengembangan. Environment variable `DATABASE_URL` diinjeksi secara dinamis dari file `.env`, dan `MQTT_BROKER` diarahkan ke hostname internal Docker `broker`.

2. **`frontend`** — Container Next.js yang dibangun dari `hydroponic_fe/Dockerfile`. Port 3000 di-*expose*. Menggunakan *named volume* `node_modules` agar dependency `npm install` tersimpan secara persisten dan tidak perlu diunduh ulang setiap kali container di-*rebuild*.

3. **`db`** — Container PostgreSQL versi `18.3-alpine` (image ringan). Data disimpan di *named volume* `pgdata` agar bertahan antar restart. Penulis menambahkan konfigurasi kustom melalui file `postgres/postgres.conf` yang di-*mount* read-only.

4. **`broker`** — Container **Mosquitto** (MQTT broker) yang dibangun dari `mosquitto/Dockerfile`. Port 1883 di-*expose*. Menggunakan autentikasi username/password yang dikonfigurasi melalui environment variable.

**Dependency Chain & Health Checks:**

Penulis mengimplementasikan *health check* untuk memastikan urutan startup yang benar:
- PostgreSQL: `pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}` setiap 5 detik, timeout 5 detik, 5 kali percobaan.
- Mosquitto: `mosquitto_pub -h localhost -t health -m ok -u ${MQTT_USERNAME} -P ${MQTT_PASSWORD}` setiap 10 detik.
- Backend `depends_on` kedua service di atas dengan `condition: service_healthy`, memastikan backend tidak mulai sebelum database dan broker benar-benar siap menerima koneksi.

### 3.2. Script Operasional

Penulis membuat script shell untuk mempermudah operasi sehari-hari:
- `start.sh` / `start.prod.sh` — Menjalankan `docker compose up` dengan file yang sesuai.
- `stop.prod.sh` — Menghentikan semua container.

### 3.3. Migrasi Database dengan Alembic

*(Draft — membutuhkan detail lebih lanjut dari David.)*

Penulis menggunakan **Alembic** untuk manajemen migrasi skema database. Pada file `main.py`, baris `BaseModel.metadata.create_all(bind=engine)` sengaja di-*comment* dengan catatan "*Alembic will autogenerate it*", menunjukkan bahwa pembuatan tabel sepenuhnya dikontrol oleh Alembic, bukan oleh SQLModel.

**[BUTUH DETAIL DARI DAVID - SILAKAN JAWAB PERTANYAAN BERIKUT UNTUK MELENGKAPI BAGIAN INI]**
1. Bagaimana proses setup awal Alembic di dalam project ini? Apakah Anda menggunakan `alembic init` dan mengonfigurasi `env.py` untuk membaca model SQLModel?
2. Di *Magang Note*, tercatat ada **bug line-ending** (Windows `\r\n` ke Linux `\n`) pada file `entrypoint.sh` yang menyebabkan *crash* Alembic di dalam container Docker. Tolong ceritakan proses penemuan dan perbaikan bug tersebut secara detail — bagaimana gejalanya, bagaimana Anda mendiagnosanya, dan solusi apa yang diterapkan?
3. Berapa banyak migrasi Alembic yang telah di-generate selama proyek berjalan? Apakah ada migrasi yang kompleks (misalnya menambahkan composite primary key atau mengubah tipe kolom)?

---

## 4. Firmware ESP32 — Embedded System (C++ / Arduino Framework)

Penulis mengembangkan firmware untuk dua jenis ESP32 menggunakan **PlatformIO** dengan *Arduino Framework*: satu untuk **Rack Sensor** (monitoring nutrisi & lingkungan per rak hidroponik) dan satu untuk **Room Sensor** (monitoring suhu & kelembapan ruangan).

### 4.1. Arsitektur Direct Connection

Pada awal proyek, arsitektur yang direncanakan menggunakan skema **Master-Slave** di mana beberapa ESP32 slave berkomunikasi ke satu ESP32 master melalui protokol ESP-NOW, lalu master meneruskan data ke server melalui WiFi. Namun pada minggu ke-3, keputusan diubah menjadi **Direct Connection** — setiap ESP32 langsung terhubung ke WiFi lab dan mempublikasikan data langsung ke MQTT broker.

**[BUTUH DETAIL DARI DAVID]**
1. Apa pertimbangan teknis utama (dari sisi stabilitas, *delay*, atau kompleksitas *coding*) yang mendasari perubahan arsitektur fundamental ini?
2. Apakah ada limitasi ESP-NOW (misalnya jumlah peer maksimal atau konflik dengan WiFi) yang menjadi faktor penentu?
3. Bagaimana dampak perubahan ini terhadap konsumsi daya dan jangkauan sinyal WiFi di dalam lab?

### 4.2. Firmware Rack Sensor (`main-code-rack.cpp`)

Firmware rack sensor merupakan kode terbesar dalam proyek (~1100 baris, 36KB) yang menangani pembacaan 6 jenis sensor, kalibrasi remote, dan komunikasi MQTT. Penulis menggunakan board **NodeMCU-32S** dengan konfigurasi pin sebagai berikut:

| Pin | Fungsi | Sensor |
|-----|--------|--------|
| GPIO 33 | Analog Input | Sensor pH |
| GPIO 35 | Analog Input | Sensor TDS |
| GPIO 4 | OneWire Digital | Sensor Suhu Air (Dallas DS18B20) |
| GPIO 21/22 | I2C (SDA/SCL) | Sensor Cahaya (BH1750) |
| GPIO 12/14 | Digital Trigger/Echo | Sensor Ultrasonik (Water Level) |
| GPIO 27 | Digital Interrupt | Sensor Flow Rate |

**Library yang digunakan:**
- **PubSubClient** — klien MQTT untuk Arduino.
- **ArduinoJson** — serialisasi/deserialisasi JSON.
- **BH1750** — driver sensor cahaya digital.
- **DallasTemperature** + **OneWire** — driver sensor suhu air DS18B20.
- **Preferences** — penyimpanan non-volatile (NVS) di flash memory ESP32.

### 4.3. Mekanisme Pembacaan Sensor & Filtering

Penulis mengimplementasikan pipeline filtering multi-tahap untuk mengatasi *noise* pada pembacaan ADC sensor analog (pH dan TDS):

**Fungsi `readVoltage()` — 7 Tahap Filtering:**

1. **Pengambilan 20 sampel** (`NUM_SAMPLES = 20`) dengan delay 20ms antar pembacaan untuk memberi waktu ADC ESP32 *settling*.
2. **Sorting** sampel menggunakan bubble sort — persiapan untuk pemangkasan outlier.
3. **Pemangkasan outlier** — 4 sampel terendah dan 4 sampel tertinggi dibuang (`DISCARD_SAMPLES = 4`), menyisakan 12 sampel tengah.
4. **Rata-rata 12 sampel tengah** — menghasilkan nilai ADC yang stabil.
5. **Konversi ke tegangan (mV)**: `voltage = avgValue × (3300.0 / 4095.0)` — menggunakan referensi tegangan 3.3V dan resolusi ADC 12-bit.
6. **Exponential Moving Average (EMA)**: `ema = (0.30 × voltage) + (0.70 × ema_prev)` — filter low-pass digital dengan koefisien α=0.30 yang menghaluskan fluktuasi cepat namun tetap responsif terhadap perubahan nyata.
7. **Median Filter** pada 5 sampel histori terakhir — perlindungan tambahan terhadap *spike* sesekali yang lolos dari EMA.

Pipeline ini dirancang agar nilai yang dikirim ke server sudah bersih dari noise, tanpa mengorbankan responsivitas terhadap perubahan aktual pada larutan nutrisi.

**Pembacaan sensor lainnya:**
- **TDS**: `readADCAverage(TDS_PIN, 50)` — rata-rata dari 50 sampel langsung, kemudian dikonversi menggunakan formula polinomial kubik dengan kompensasi suhu: `TDS = (133.42V³ - 255.86V² + 857.39V) × 0.5`, di mana V sudah dikompensasi dengan koefisien `1.0 + 0.02 × (temp - 25.0)`.
- **Ultrasonik**: `readUltraSonicSensorAverage()` — mengambil 10 pembacaan, membuang yang gagal (0.0), dan merata-ratakan sisanya. Pembacaan dilakukan dengan mengirim pulsa 10µs pada pin trigger dan mengukur durasi pulsa echo menggunakan `pulseIn()` dengan timeout 300ms.
- **Flow Rate**: Menggunakan **hardware interrupt** (`attachInterrupt(FLOW_SENSOR_PIN, flowSensorISR, RISING)`) — setiap pulsa dari sensor flow menambah counter `pulseCount` secara atomik via ISR (Interrupt Service Routine) yang ditandai `IRAM_ATTR`. Flow rate dihitung sebagai `volume / elapsed_time` dengan `FLOW_CALIBRATION_FACTOR = 450` pulsa/liter.
- **Cahaya (BH1750)**: Dibaca via I2C menggunakan mode `CONTINUOUS_HIGH_RES_MODE` yang memberikan resolusi 1 lux. Nilai error (65535 atau negatif) dideteksi dan dikembalikan sebagai -1.
- **Suhu Air (DS18B20)**: Dibaca via protokol OneWire menggunakan library DallasTemperature.

### 4.4. Sistem Kalibrasi Sensor — Persistent Storage

Penulis membangun sistem kalibrasi yang mendukung **two-point calibration** untuk pH dan TDS, dengan koefisien tersimpan secara persisten di **flash memory ESP32** menggunakan library `Preferences` (NVS — Non-Volatile Storage).

**Struktur Data Kalibrasi:**

Penulis mendefinisikan dua struct C++:
- `PHCalibration` — menyimpan `slope`, `offset`, `num_points` (0/1/2), `is_calibrated`, dan data dua titik kalibrasi (`point1_voltage`, `point1_ph`, `point2_voltage`, `point2_ph`). Nilai default: slope = 0.07, offset = -161.0.
- `TDSCalibration` — menyimpan `slope`, `offset`, `num_points`, `is_calibrated`, dan data dua titik. Nilai default: slope = 1.0, offset = 0.0.

**Proses Kalibrasi pH (Two-Point):**

1. Perintah `KALIBRASI_PH` diterima via MQTT dengan `known_value` (misalnya 4.0 atau 7.0).
2. Fungsi `calibratePH(known_value)` membaca tegangan sensor menggunakan pipeline `readVoltage()`.
3. Jika ini titik pertama (atau `known_value == 4.0`), data disimpan sebagai `point1` — kalibrasi satu titik.
4. Jika ini titik kedua (atau `known_value == 7.0`), data disimpan sebagai `point2` — kalibrasi dua titik diaktifkan.
5. Fungsi `calculateTwoPointCalibration()` menghitung slope dan offset baru: `slope = (pH1 - pH2) / (V1 - V2)`, `offset = pH1 - (slope × V1)`.
6. Koefisien disimpan ke flash memory via `saveCalibrationData()` — total 16 parameter tersimpan dengan key seperti `"ph_slope"`, `"ph_offset"`, `"ph_p1_v"`, dll.
7. Setelah disimpan, fungsi melakukan test dengan `convertToPH()` dan mencetak error margin ke Serial Monitor.

**Proses Kalibrasi TDS (One/Two-Point):**

Serupa dengan pH, namun melibatkan **kompensasi suhu** — pembacaan TDS sangat dipengaruhi oleh suhu air. Penulis membaca suhu air dari sensor DS18B20 terlebih dahulu, lalu menghitung `compensationCoefficient = 1.0 + 0.02 × (temp - 25.0)`.

**Persistensi Data:**

Fungsi `loadCalibrationData()` dipanggil sekali di `setup()`. Data di-*load* dari NVS ke struct C++ dengan nilai default jika belum ada kalibrasi. Ini memastikan **kalibrasi tidak hilang saat ESP32 restart atau listrik padam** — inti dari keandalan sistem di lingkungan lab.

### 4.5. Komunikasi MQTT dari ESP32

**Proses Boot & Registrasi:**

1. `setup()`: Inisialisasi Serial (115200 baud), build topik MQTT dinamis (`rack/{RACK_ID}/data`, `rack/{RACK_ID}/cmd`, dll), inisialisasi semua sensor, load kalibrasi, setup interrupt flow sensor, koneksi WiFi, koneksi MQTT.
2. Setelah MQTT terhubung, ESP32 men-*subscribe* ke `rack/{id}/cmd` (untuk menerima perintah) dan `device/{id}/register/ack` (untuk konfirmasi registrasi).
3. `loop()` pertama: Mengirim pesan registrasi ke `device/{id}/register` berisi `mac_addr`, `type_id`, `desc`, dan `attr` (termasuk `rack_id`).
4. Backend menerima registrasi, menyimpan device baru jika belum ada, dan mengirim ACK.
5. ESP32 menerima ACK → `isRegistered = true` → mulai mengirim data sensor.

**Pengiriman Data Berkala:**

Setiap `SEND_INTERVAL` (5000ms / 5 detik), fungsi `generateData()` dipanggil yang membaca semua 6 sensor dan menghasilkan JSON payload:
```json
{
  "mac_addr": "f4c1e01b-...",
  "data": {
    "ph": 6.52,
    "ec": 1245.00,
    "water_temp": 25.3,
    "light_intensity": 18500,
    "water_level": 42.5,
    "flow_rate": 2.15
  }
}
```

**Penerimaan & Eksekusi Perintah:**

Fungsi `callBack()` menangani pesan masuk di topik `rack/{id}/cmd`. Alur:
1. Deserialisasi JSON perintah.
2. Memanggil `runCommand(cmdType, cmdLog, root)` di dalam *while loop* dengan timeout `TIME_OUT_INTERVAL` (60 detik).
3. `runCommand()` mengeksekusi perintah sesuai tipe:
   - `KALIBRASI_PH` → `calibratePH(known_value)`
   - `KALIBRASI_TDS` → `calibrateTDS(known_value)`
   - `RESET_CALIBRATION` → `resetCalibration("PH")` + `resetCalibration("TDS")`
4. Setelah eksekusi selesai (atau timeout), status (`SUCCESS`, `FAILED`, atau `TIMEOUT`) ditambahkan ke JSON dan dipublikasikan ke `rack/{id}/cmd/ack`.

### 4.6. Firmware Room Sensor (`main-code-room.cpp`)

Firmware room sensor jauh lebih sederhana (~220 baris) karena hanya membaca satu sensor **DHT22** untuk suhu dan kelembapan ruangan.

Penulis menggunakan board **LOLIN (Wemos) D1** yang lebih kecil dan hemat daya. Firmware mendukung platform ESP8266 dan ESP32 melalui *conditional compilation* (`#if defined(ESP8266)`).

Alur kerja:
1. `setup()`: Inisialisasi DHT22 pada GPIO 4, koneksi WiFi, koneksi MQTT.
2. `loop()`: Setiap 5 detik, baca suhu dan kelembapan, validasi data (`isnan()` check), build JSON, publish ke `rack/0/data`.
3. Registrasi device dengan `TYPE_ID = "ROOM_MONITORING"`.
4. Jika WiFi gagal setelah 30 percobaan → `ESP.restart()` — hard restart otomatis.

Payload JSON yang dikirim:
```json
{
  "mac_addr": "c7b7fae9-...",
  "data": {
    "temperature": 26.5,
    "humidity": 62.0
  }
}
```

### 4.7. Pertanyaan Tambahan untuk Firmware

**[BUTUH DETAIL DARI DAVID - SILAKAN JAWAB PERTANYAAN BERIKUT UNTUK MELENGKAPI BAGIAN INI]**
1. Pada `main-code-rack.cpp`, terdapat struct `PHCalibration` dengan nilai default slope = 0.07 dan offset = -161.0. Bagaimana Anda menentukan nilai default ini? Apakah dari eksperimen fisik awal dengan sensor pH di lab?
2. Untuk sensor ultrasonik, terdapat fungsi `calibrateUltrasonicSensor()` yang masih menggunakan *dummy data* (`raw_d1 = 10.0`, `actual_d1 = 10.5`). Apakah fungsi ini sudah diimplementasikan dengan data pengukuran nyata? Bagaimana proses pengukuran jarak fisik yang sebenarnya dilakukan?
3. Apa pertimbangan dalam memilih `FLOW_CALIBRATION_FACTOR = 450.0` pulsa/liter? Apakah nilai ini berasal dari datasheet sensor atau dari eksperimen kalibrasi manual?
4. Mengapa firmware room menggunakan `ESP.restart()` saat WiFi gagal, sementara firmware rack menggunakan `delay(5000)` dan retry? Apakah ada perbedaan prioritas keandalan antara kedua sensor?
5. Pada commit terakhir (21 Mei 2026: "update ultrasonic adjustment"), perubahan apa yang dilakukan pada kalibrasi ultrasonik? Apakah ada permasalahan akurasi jarak sebelumnya?

---
*Laporan ini merupakan rangkuman akhir pertanggungjawaban tugas magang.*
