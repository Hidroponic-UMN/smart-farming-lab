# Laporan Pekerjaan Magang: Smart Farming Lab UMN
**Nama:** David (Backend, Firmware & Infrastructure)

Berikut adalah laporan komprehensif mengenai tugas dan pencapaian selama program magang (16 minggu) pada proyek Smart Farming Lab UMN. Laporan ini disusun berdasarkan fungsi bidang kerja, dengan penekanan detail pada pengembangan sistem *backend*, infrastruktur *server*, pengolahan *database*, dan *firmware embedded system*.

---

## 1. Backend API & Arsitektur Server (FastAPI)

Sebagai penanggung jawab utama sistem *server-side*, saya membangun backend menggunakan **FastAPI** — sebuah *framework web* modern untuk Python yang sangat cepat dan mendukung pemrograman asinkron. Backend ini berfungsi sebagai jembatan utama antara frontend dashboard dan database, serta menangani logika bisnis pengolahan data sensor.

### 1.1. Setup Proyek & Lifespan Management

Pengembangan backend diawali dengan inisialisasi *environment* Python dan pengaturan struktur proyek yang modular (`app/api`, `app/core`, `app/crud`, `app/models`, `app/services`). Saya memilih FastAPI karena dukungannya terhadap *type hinting* Python secara *native* dan kemampuan integrasinya yang mulus dengan **Pydantic** untuk validasi data.

Saya mengimplementasikan fungsi `lifespan` pada `main.py` yang berjalan saat server mulai dan berhenti secara *asynchronous*:
1. **Start-up**: Menjalankan fungsi `seeding_to_db(db)` untuk secara otomatis menyuntikkan data *seed* esensial ke database (seperti `CommandType`, `CommandStatus`, dan `DeviceType`) jika tabel masih kosong. Setelah itu, sistem memanggil `mqtt_worker.connect()` dan `mqtt_worker.start()` untuk menjalankan *thread* MQTT di belakang layar bersamaan dengan server web.
2. **Shut-down**: Saat server dihentikan, fungsi `mqtt_worker.stop()` dipanggil untuk memastikan koneksi ke MQTT broker diputus dengan aman tanpa meninggalkan *zombie process*.

### 1.2. Desain Database dengan SQLModel & JSONB

Untuk interaksi dengan database **PostgreSQL**, saya tidak menggunakan SQLAlchemy standar, melainkan **SQLModel** yang menggabungkan fitur *Object-Relational Mapping* (ORM) dari SQLAlchemy dan validasi data dari Pydantic dalam satu kelas tunggal.

Tantangan utama dalam sistem IoT hidroponik ini adalah tipe data sensor yang terus bertambah atau berubah. Untuk mengatasinya tanpa perlu melakukan migrasi skema tabel (ALTER TABLE) terus-menerus, saya menerapkan **Kolom JSONB**:
1. Pada model `Device`, `DeviceType`, dan lain-lain, saya membuat kolom `attr: Dict[str, Any] = Field(default_factory=dict, sa_type=JSONB)`.
2. Penggunaan JSONB (dibandingkan JSON biasa) di PostgreSQL memungkinkan *query indexing* yang jauh lebih cepat.
3. Saat frontend membutuhkan atribut baru, misalnya `planted_at` atau `rack_id`, atribut ini langsung disimpan di dalam kamus (*dictionary*) `attr` menggunakan fungsi `update_device_attr()` di `crud/general.py`. Saya memastikan fungsi ini juga memanggil `flag_modified` agar SQLAlchemy mendeteksi mutasi objek JSON dan melakukan `COMMIT` dengan benar.

### 1.3. Struktur Route & Ekspor Data

API dipecah menjadi beberapa *router* spesifik: `/commandlogs`, `/telemetry`, `/generals`. Salah satu fitur penting yang saya bangun adalah **Export to CSV** untuk keperluan analisis data lanjutan oleh pihak lab.
- Saya menggunakan kelas `StreamingResponse` dari FastAPI dipadukan dengan `io.StringIO` dan modul `csv` bawaan Python.
- Data yang di-*query* dari PostgreSQL tidak disimpan sebagai file fisik sementara di server, melainkan langsung di-*stream* ke *memory buffer* dan diunduh oleh *client*. Ini membuat penggunaan *memory server* jauh lebih hemat dan operasi berjalan seketika.

---

## 2. MQTT Worker & Integrasi IoT

Data dari ESP32 dikirim bukan melalui HTTP, melainkan melalui protokol MQTT yang lebih ringan dan cocok untuk perangkat IoT. Saya membangun sistem asinkron agar server FastAPI dapat menangani HTTP dan MQTT secara paralel.

### 2.1. Kelas Singleton `MQTTWorker`

Saya membungkus library `paho.mqtt.client` di dalam kelas *custom* `MQTTWorker` (`app/services/mqtt_worker.py`). Kelas ini didesain sebagai *Singleton* yang diinstansiasi satu kali sebagai `mqtt_worker`.
- Sistem menggunakan mekanisme **threading.Lock()** untuk memastikan pendaftaran (*registration*) dari fungsi-fungsi *handler* bersifat *thread-safe*.
- Fitur `reconnect_delay_set(min_delay=1, max_delay=120)` dikonfigurasi agar *worker* tidak membanjiri jaringan dengan upaya rekoneksi yang agresif apabila *broker* utama (*Mosquitto*) sedang mengalami gangguan sementara.

### 2.2. Handler Topik & Pemrosesan Data Masuk

Pada metode `on_connect`, server secara otomatis men-*subscribe* ke topik *wildcard* utama: `device/+/register`, `rack/+/data`, dan `rack/+/cmd/ack`.

Setiap kali data JSON diterima (`on_message`), pesan didekode dan dilempar ke *handler* spesifik di `mqtt_handler.py`:
1. **Telemetry Handler** (`rack/+/data`): Melakukan validasi *payload* masukan menggunakan model Pydantic `TelemetryMicroController`. Pesan JSON kemudian disaring, memastikan `mac_addr` eksis di tabel `Device`, lalu di-*insert* ke tabel `DataLog`.
2. **Ack Command Handler** (`rack/+/cmd/ack`): Ketika frontend meminta *Sensor Adjustment* (Kalibrasi), ESP32 akan mengeksekusi secara lokal lalu mengirim status sukses/gagal ke topik ini. *Handler* kemudian mengubah `mac_addr` dan status balasan menjadi *log record* di tabel `CommandLog`.

---

## 3. Infrastruktur Docker & Server Deployment

*(Draft Awal: Merancang arsitektur microservices menggunakan Docker Compose, penyiapan database PostgreSQL, broker Mosquitto, dan mengubah STB Indihome B860H menjadi server mandiri di lab).*

> **[PLACEHOLDER GAMBAR: Diagram Arsitektur Microservices (Docker)]**
> **[PLACEHOLDER GAMBAR: Foto/Screenshot Terminal Server STB Indihome]**

**[BUTUH DETAIL DARI DAVID - SILAKAN JAWAB PERTANYAAN BERIKUT UNTUK MELENGKAPI BAGIAN INI]**
1. Dalam file `compose.prod.yml`, Anda menyertakan layanan `db`, `broker`, `backend`, dan `frontend`. Bagaimana Anda memastikan layanan `backend` tidak *crash* atau *error* saat `db` dan `broker` belum siap sepenuhnya pada saat *boot-up* awal server? (Selain `depends_on`, apakah ada mekanisme *retry* atau *healthcheck* khusus?)
2. STB Indihome B860H memiliki RAM dan ruang penyimpanan (ROM) yang sangat terbatas untuk ukuran *server*. Optimasi apa saja yang Anda lakukan pada sistem operasi Linux (Armbian/Debian) atau pada konfigurasi Docker agar semua *container* dapat berjalan lancar tanpa mengalami *Out-Of-Memory* (OOM)?
3. Bagaimana Anda mengelola migrasi skema database menggunakan **Alembic** di dalam *environment* Docker? Di *Magang Note*, tercatat ada *bug line-ending* (Windows `\r\n` ke Linux `\n`) pada file `entrypoint.sh` yang menyebabkan *crash* Alembic. Tolong ceritakan proses penemuan dan perbaikan *bug* tersebut secara detail.

---

## 4. Firmware ESP32 & Embedded System (C++)

*(Draft Awal: Pengembangan arsitektur Direct Connection, konversi nilai analog (ADC) sensor, pengolahan logika kalibrasi di level perangkat, dan penyimpanan koefisien ke flash memory).*

> **[PLACEHOLDER GAMBAR: Snippet Kode Firmware ESP32 (Fungsi Pembacaan Analog/Kalibrasi)]**
> **[PLACEHOLDER GAMBAR: Log Serial Monitor ESP32 saat Publish ke Broker]**

**[BUTUH DETAIL DARI DAVID - SILAKAN JAWAB PERTANYAAN BERIKUT UNTUK MELENGKAPI BAGIAN INI]**
1. Pada awal proyek, arsitektur yang direncanakan adalah **Master-Slave** di mana beberapa ESP32 berkomunikasi ke satu ESP32 Master, sebelum dikirim ke server. Namun, pada Minggu ke-3, keputusan diubah menjadi **Direct Connection**. Apa pertimbangan teknis utama (dari sisi stabilitas, *delay*, atau kompleksitas *coding*) yang mendasari perubahan arsitektur fundamental ini?
2. Bagaimana cara ESP32 menerima perintah kalibrasi dari frontend (melalui *topic* MQTT `rack/+/cmd`), memproses koefisien regresi yang baru, lalu menuliskannya secara permanen ke memori non-volatile (NVS/SPIFFS/EEPROM)? Hal ini krusial agar kalibrasi tidak hilang saat listrik padam.
3. Nilai yang dikeluarkan oleh sensor analog (terutama ultrasonik dan sensor aliran air / *water flow*) rentan terhadap *noise* kelistrikan. Apakah Anda mengimplementasikan *software filter* di dalam *firmware* (misalnya: *Moving Average*, *Kalman Filter*, atau *Median Filter*) sebelum data mentah dikirim ke backend?
4. Dalam pengiriman paket data (*payload*) MQTT ke `rack/+/data`, apakah pengiriman dilakukan berdasarkan interval *timer* yang statis (misal: setiap 5 detik), atau menggunakan sistem interupsi (ISR) / pendeteksian perubahan nilai delta (agar lebih hemat *bandwidth*)?

---
*Laporan ini merupakan rangkuman akhir pertanggungjawaban tugas magang.*
