# 📋 Laporan Kegiatan Mingguan Magang — Pael

**Nama:** Pael (Frontend & Hardware Integration)  
**Project:** Smart Farming Lab IoT Monitoring System — Phase 1  
**Durasi:** 16 Minggu (23 Februari – 12 Juni 2026)  
**Supervisor:** Pak Niki  

> Dokumen ini berisi ringkasan point-point kegiatan per minggu, hanya fokus pada pekerjaan Pael.  
> Akan di-expand menjadi laporan naratif detail pada tahap berikutnya.

**Pembagian Kerja:**
| Pael | David |
|------|-------|
| Frontend monitoring dashboard | Backend (FastAPI) |
| Pemilihan & analisis hardware | Embedded system / Firmware ESP32 |
| Desain skema elektronik & PCB (EasyEDA) | Database (PostgreSQL, Alembic) |
| Desain enclosure 3D (FreeCAD) | Server infrastructure & Docker |
| Peletakan modul di rak hidroponik | MQTT handler/worker backend |
| Pemeliharaan fisik laboratorium | — |

---

## Week 1 (23–27 Feb 2026) — Onboarding & Sprint Dashboard MVP untuk Open House

- Memahami kembali project Smart Garden semester 4 sebagai referensi arsitektur dan implementasi
- Mempelajari konsep Smart Farming UMN dari penjelasan Pak Niki
- Mengamati langsung proses pemasangan paralon hidroponik di lab — memahami struktur fisik dan alur distribusi air/nutrisi
- Menganalisis konsep sistem IoT yang akan diterapkan (awalnya mengira closed-loop control, ternyata fokus monitoring)
- Memahami ToR (Term of Reference) dan ruang lingkup magang
- Membuat **draft kebutuhan sensor**: plafon (suhu & humidity), tandon (water level, pH, nutrisi, water temp), rak (cahaya, arus air)
- Memulai development frontend dashboard dari nol: **Next.js 16 + TypeScript + Tailwind CSS + Shadcn/UI**
- Implementasi tampilan **5 rak hidroponik** dengan 6 parameter per rak (Water Level, pH, EC, Water Temp, Water Flow, Light Intensity)
- Pembuatan komponen **Room Monitor** (suhu & kelembapan ruangan)
- Implementasi **mini sparkline chart** (Recharts) — 25 data point terakhir
- Membangun **sistem threshold & status otomatis** (Normal, Warning, Low, High, Critical)
- Implementasi dark/light mode dengan `next-themes`
- Membuat **sistem simulasi data dummy** (Stable, Trending Up, Trending Down) untuk demo tanpa hardware
- Diskusi penggunaan sensor **DHT22** milik lab IoT + ESP32 pribadi untuk demo Open House
- Finishing & penyempurnaan dashboard — polling data setiap 3 detik
- Persiapan DHT22 untuk Open House, list sensor & ESP32 yang perlu dibeli

**Kendala:**
- Sprint sangat ketat — hanya ~4 hari kerja untuk membangun seluruh dashboard MVP dari nol hingga siap demo Open House

---

## Week 2 (2–6 Mar 2026) — Diskusi Arsitektur & Penataan Repository

- Diskusi bersama David tentang arsitektur komunikasi data IoT (sensor → MQTT → server → dashboard)
- Perapihan struktur repository: dokumentasi README, penataan folder, push ke GitHub
- Sinkronisasi repo dengan David — cloning dan merge masing-masing pekerjaan
- Pemisahan frontend dashboard dan modul simulasi ke branch berbeda untuk menjaga stabilitas
- Evaluasi stack frontend: sempat mempertimbangkan migrasi ke **React + Vite** (lebih ringan)
- Menambahkan fitur awal **log time-series** di frontend

**Kendala:**
- Sempat mempertimbangkan pindah dari Next.js ke Vite, memakan waktu evaluasi — akhirnya belum diputuskan

---

## Week 3 (9–13 Mar 2026) — Kembali ke Next.js, Grafik Time-Series, Database Viewer, Auth

- Diskusi kebutuhan hardware → keputusan beli ESP32
- Ikut diskusi perubahan arsitektur dari master-slave menjadi **direct connection** (setiap ESP32 langsung publish ke MQTT)
- Keputusan final kembali ke **Next.js** (butuh API route handler sebagai proxy ke backend)
- Mengembangkan fitur **time-series graph**:
  - Membuat halaman `/rack/[id]` — grafik **Area Chart** (Recharts) untuk 6 sensor per rak
  - Implementasi pilihan range waktu: 1 Jam, 6 Jam, 24 Jam, 7 Hari
  - Mulai implementasi halaman detail per sensor (zoom chart) — statistik avg, min, max, current
- Membuat **Database Viewer** di frontend:
  - Tabel data menggunakan **TanStack Table** (pagination, filtering)
  - Fitur **export data ke CSV**
- Implementasi **sistem autentikasi** di sisi frontend:
  - Halaman login dengan validasi **Zod**
  - Proteksi halaman data historis agar hanya bisa diakses setelah login

**Kendala:**
- Bolak-balik evaluasi antara Vite dan Next.js memakan waktu — keputusan final Next.js karena butuh Route Handler sebagai proxy

---

## Week 4 (16–20 Mar 2026) — Setup Server STB Indihome & Libur Idul Fitri

- Memanfaatkan **STB Indihome B860H** sebagai alternatif server lokal di lab
- Melakukan instalasi **Linux** pada STB agar bisa menjalankan service IoT secara mandiri
- Melanjutkan setup environment STB — tujuannya agar sistem tidak bergantung pada laptop pribadi
- **Rabu–Jumat: Libur Hari Raya Idul Fitri**

**Kendala:**
- STB B860H memiliki keterbatasan resource — perlu eksplorasi untuk mengoptimasi agar service bisa jalan
- Minggu terpotong libur, hanya 2 hari kerja efektif

---

## Week 5 (23–27 Mar 2026) — Diskusi Sensor Baru & Persiapan Akreditasi

- **Senin–Selasa: Cuti bersama Idul Fitri**
- Hari pertama masuk: diskusi tentang sensor fisik baru yang dibutuhkan:
  - **Waterproof ultrasonic** untuk water level di tandon
  - **Water flow sensor** untuk debit sirkulasi air
  - **Float switch** sebagai pengaman tambahan
- Menyesuaikan tampilan frontend dashboard untuk mengakomodasi parameter sensor baru
- Membuat simulasi payload dummy untuk parameter tambahan — memastikan dashboard siap menampilkan data tanpa hardware
- Mengikuti Google Meet persiapan **Akreditasi Prodi IF & TK**
- **Gladi resik** di kampus: pengecekan fisik lab, memastikan dashboard stabil di layar, merapikan wiring sementara

**Kendala:**
- Minggu sangat pendek (3 hari kerja efektif), banyak kegiatan non-teknis persiapan akreditasi
- Sensor fisik baru belum bisa dipesan, hanya bisa siapkan simulasi di frontend

---

## Week 6 (30 Mar – 3 Apr 2026) — Akreditasi IF, Mulai Fitur Sensor Adjustment

- **Senin: Akreditasi Prodi IF** — standby di lab, memastikan sistem berjalan lancar jika ada kunjungan asesor
- Merencanakan prototype hardware fisik — menyusun daftar spesifikasi komponen final
- Mengajukan **permohonan pembelian komponen** (ultrasonic, flow sensor, float switch) kepada Pak Niki
- **Mulai mengembangkan fitur Sensor Adjustment (Kalibrasi):**
  - Menganalisis alur data: ESP32 mengirim raw ADC (0–4095), perlu konversi dinamis ke pH (0–14) dan TDS (ppm)
  - Membuat `calibration.ts` — logika matematika regresi kalibrasi (2-point untuk pH, K-factor untuk TDS)
  - Mengembangkan **UI Calibration Wizard** (`calibration-wizard.tsx`) — panduan step-by-step
  - Membuat route `/calibration` — overview 5 rak dengan status kalibrasi (Calibrated / Not Calibrated)
  - Membangun komponen `live-sensor-display.tsx` — polling data raw real-time dari `/api/racks?raw_mode=true`
- Persiapan final **Akreditasi Prodi TK** (Sabtu 4 April)

**Kendala:**
- Kegiatan akreditasi memakan waktu di awal dan akhir minggu
- Harus standby dan siap presentasi teknis jika asesor bertanya tentang implementasi IoT

---

## Week 7 (6–10 Apr 2026) — Integrasi Kalibrasi ke Dashboard & Kedatangan Hardware

- Proses pembelian komponen hardware yang sudah disetujui
- Modifikasi `rack-card.tsx` dan `header.tsx` — menampilkan notifikasi **"Uncalibrated"** jika belum ada data kalibrasi pada rak
- Endpoint API kalibrasi dari backend belum ready → implementasi **fallback menggunakan localStorage** di browser sebagai penyimpanan koefisien kalibrasi
- Menyiapkan **API proxy placeholder** `/api/calibration/route.ts` agar mudah di-switch ketika backend siap
- Integrasi logika kalibrasi ke dashboard utama — modifikasi `/api/racks/route.ts` untuk membaca koefisien (slope & offset) dan menerapkannya ke data sensor
- Menguji konversi raw value ESP32 → nilai pH dan TDS terkalibrasi di grafik dan indikator numerik — **berhasil**
- **Komponen sensor datang**: waterproof ultrasonic, flow sensor, float switch
- Pengecekan fisik kelengkapan komponen
- Mulai **merangkai skema wiring dasar** komponen baru ke development board ESP32
- Menulis **test code** sederhana (Arduino IDE) untuk membaca nilai sensor ultrasonik dan flow sensor secara terpisah

**Kendala:**
- Backend API kalibrasi belum siap, harus buat workaround localStorage dulu agar fitur tetap bisa berjalan
- Sensor baru masih tahap uji coba individual, belum bisa digabung ke sistem utama

---

## Week 8 (13–17 Apr 2026) — Integrasi Frontend, Sinkronisasi, Kunjungan Supervisor

- Menyesuaikan frontend untuk mendukung fitur **command execution** dari dashboard — mengirim instruksi ke ESP32 melalui antarmuka UI (kalibrasi pH & TDS secara remote)
- Menyesuaikan frontend untuk entitas **Room Monitoring** yang terpisah dari data rak hidroponik
- **Sinkronisasi codebase** dengan David — merge branch utama ke frontend
- Menerapkan pembaruan: endpoint terbaru kini menggunakan `rack_id` alih-alih `device_id`
- Testing dan perbaikan bug frontend terkait transisi parameter `rack_id`
- Menerima **kunjungan Pak Niki dan Jacob Brown** di lab Smart Farming
- Merapikan codebase secara keseluruhan

**Kendala:**
- Transisi dari `device_id` ke `rack_id` menimbulkan bug di beberapa komponen frontend yang sebelumnya hardcoded

---

## Week 9 (20–24 Apr 2026) — Merge Besar, Redesign UI Glassmorphism, Uji Coba Flow Sensor

- **Integrasi besar-besaran** repo GitHub — merge Pull Request dan sinkronisasi backend + frontend
- Persiapan arsitektur UI untuk redesign — memastikan logika fetching data dan autentikasi tidak terganggu saat desain diubah
- Pembuatan **asset visual baru** untuk redesign (background images)
- Testing komprehensif fungsionalitas dasar sebelum mulai redesign
- **Eksekusi redesign UI besar-besaran:**
  - Mengganti flat design → **Glassmorphism** (`bg-white/40 backdrop-blur-md border-white/20`)
  - Palet warna baru: dark green `#34473d`
  - Background AVIF beresolusi tinggi (suasana garden & field)
  - Menghapus theme provider (dark/light mode) yang memberatkan
  - Memperbaiki **responsivitas layout** untuk mobile, desktop, dan TV lab
  - Redesign halaman **History** dan **Top Navbar**
- Mengintegrasikan fitur **ESP32 command execution** langsung dari dashboard — kalibrasi pH & TDS secara remote via UI
- **Sisi Hardware:** Uji coba fisik **water flow sensor**
  - Pergi ke toko material di **Medang** untuk membeli sambungan pipa khusus agar sensor flow terpasang presisi di jalur irigasi rak

**Kendala:**
- Merge conflict cukup banyak karena banyak perubahan paralel antara frontend dan backend
- Sambungan pipa standar tidak cocok dengan diameter sensor flow — harus cari fitting khusus di Medang
- Redesign UI sangat time-consuming, hampir 3 hari penuh untuk overhaul seluruh tampilan

---

## Week 10 (27 Apr – 1 Mei 2026) — Heavy Maintenance Lab, Bimbingan Supervisor

- **Heavy maintenance fisik di lab:**
  - Pencabutan tanaman bayam merah yang mati
  - Pengurasan dan pembersihan total tank hidroponik
  - Mengaktifkan kembali pompa nutrisi, memastikan sirkulasi air normal
- Merge PR frontend pasca redesign UI Glassmorphism
- Observasi sistem sirkulasi air pasca maintenance
- **Stress-testing** UI frontend di layar mobile, desktop, dan TV lab
- Maintenance tambahan: membersihkan area sekitar sensor
- **Sesi bimbingan bersama Pak Dareen dan Pak Niki:**
  - Mempresentasikan kelengkapan software (**90% selesai**)
  - Diskusi transisi fokus pekerjaan ke **perakitan & instalasi hardware**
- Evaluasi feedback bimbingan → menyusun daftar prioritas perakitan hardware
- Jumat: **Tanggal merah (1 Mei)**

**Kendala:**
- Heavy maintenance memakan waktu signifikan — kondisi tanaman di lab cukup buruk (bayam mati, air kotor)
- Harus hati-hati agar sensor-sensor yang sudah terpasang tidak rusak saat proses pembersihan

---

## Week 11 (4–8 Mei 2026) — Fitur Planted Date (Fullstack), Prototyping Hardware, Mulai EasyEDA & FreeCAD

**Sisi Frontend:**
- Implementasi fitur **Kalender Tanggal Tanam (Planted Date)** secara fullstack:
  - Frontend: native date picker, kalkulasi otomatis "Day X", tombol Panen (reset)
  - Integrasi ke komponen RackCard (Grid & List view) dan halaman dedicated `/planted-date`
  - Membuat proxy API route Next.js: `/api/racks/[id]/planted-date`
  - Ikut buat juga endpoint backend PATCH karena fitur ini dirancang sendiri dari awal (fullstack)
- **Refactoring Planting Management:** memisahkan fitur dari Dashboard utama ke halaman `/planted-date` — menyederhanakan UI Dashboard
- Membatasi manajemen planted date hanya untuk **3 rak utama** sesuai kebutuhan operasional
- Mengubah warna tombol Panen menjadi Hijau Premium (`#50705f`)
- Menambahkan shortcut ikon **Sprout** di Top Navbar untuk akses cepat
- **Rebranding "Calibration" → "Sensor Adjustment"** di seluruh UI (navbar, hub, wizard, halaman per rak)
- Bug fixes: import error `rack-card.tsx`, syntax error TDS Adjustment

**Sisi Hardware:**
- Mulai membuat **schematic di EasyEDA** — skema wiring ESP32 ke sensor-sensor
- Perencanaan hasil akhir hardware, pembelian alat solder
- Mulai belajar **FreeCAD** untuk desain 3D casing enclosure
- **Prototyping dengan perfboard dan konektor XH** — merakit sirkuit dasar sebagai purwarupa sebelum buat PCB
- **Diskusi dengan Bernard** (mahasiswa Management, berpengalaman di hidroponik) — konsultasi sensor yang dibutuhkan dan validasi kebutuhan dari sisi agrikultur
- Finalisasi prototype dan tes koneksi dengan server
- Pengukuran dimensi prototype perfboard sebagai acuan untuk desain 3D casing

**Kendala:**
- Prototyping di perfboard menghasilkan sirkuit yang rapuh dan berantakan — memperkuat keputusan untuk mendesain PCB custom
- Pertama kali menggunakan EasyEDA dan FreeCAD — perlu waktu belajar dari awal

---

## Week 12 (11–15 Mei 2026) — Desain PCB Final & 3D Casing, Order Fabrikasi

- **Pengukuran dimensi** setiap komponen yang digunakan (ESP32, sensor, konektor)
- Mengubah prototype perfboard menjadi **desain 3D PCB dengan penempatan komponen** di EasyEDA
- **Desain PCB layout** di EasyEDA: wiring jalur tembaga, tata letak komponen, routing
- **Desain 3D casing di FreeCAD:**
  - Merancang enclosure pelindung yang water-resistant
  - Menyediakan jalur keluar-masuk kabel dan lubang ventilasi
  - Menyesuaikan dimensi dengan PCB dan komponen yang sudah diukur
- **Wiring PCB** — finalisasi jalur koneksi antar komponen
- Print **mock-up 3D** untuk validasi dimensi sebelum cetak final
- **Finalisasi tata letak komponen PCB**
- Research vendor cetak PCB
- Finishing wiring PCB
- **Order cetak PCB ke vendor RaftechID**
- Kamis: Tanggal merah

**Kendala:**
- Learning curve EasyEDA dan FreeCAD cukup signifikan — iterasi desain berkali-kali
- Desain casing harus memperhitungkan lingkungan lab yang lembab dan dekat air
- Perlu cetak mock-up 3D terlebih dahulu untuk memastikan semua komponen pas sebelum order PCB

---

## Week 13 (18–22 Mei 2026) — Dokumentasi, Laporan Magang, Finalisasi PCB

- Membuat **laporan magang dan dokumentasi teknis**
- Pembelian komponen terakhir
- **Fix file Gerber** untuk cetak PCB — format export awal perlu direvisi sesuai spesifikasi RaftechID
- **Order cetak PCB ke RaftechID** (final)
- **Frontend:** membuat halaman `/docs` untuk dokumentasi teknis di website
- Menambahkan dokumentasi dalam format **Markdown** ke dalam aplikasi
- Melanjutkan penulisan laporan dan dokumentasi
- Buat SPMB (administrasi)

**Kendala:**
- File Gerber perlu direvisi sebelum bisa dikirim ke vendor — format export awal tidak sesuai spesifikasi
- Menulis dokumentasi teknis yang komprehensif cukup memakan waktu

---

## Week 14–16 (25 Mei – 12 Jun 2026) — Perakitan Hardware, Integrasi Final, Serah Terima *(Proyeksi)*

- Menunggu PCB dari RaftechID → solder komponen ke PCB
- **Perakitan hardware final:** ESP32 + PCB custom + sensor-sensor → pasang di rak hidroponik
- Desain peletakan modul di setiap rak dan area tandon
- Pemasangan enclosure 3D yang sudah dicetak
- Testing integrasi penuh: hardware ↔ dashboard frontend (end-to-end)
- Kalibrasi sensor pH & TDS menggunakan fitur **Sensor Adjustment** yang sudah dibangun
- Validasi tampilan dashboard di **monitor TV lab** (fullscreen mode)
- Pengujian stabilitas sistem jangka panjang
- Finalisasi laporan magang akhir
- Dokumentasi foto & video sistem terpasang
- Presentasi hasil di Smart Farming Lab & serah terima

**Kendala (Proyeksi):**
- Waktu pengiriman PCB dari vendor bisa delay
- Potensi isu saat solder komponen ke PCB custom (pertama kali)
- Integrasi hardware di lingkungan lab yang basah memerlukan waterproofing ekstra

---

## 📊 Ringkasan Timeline

| Fase | Minggu | Kegiatan Utama Pael |
|------|--------|---------------------|
| **Sprint Awal** | 1 | Dashboard MVP dari nol untuk Open House |
| **Fondasi Frontend** | 2–3 | Repo setup, time-series graph, database viewer, auth |
| **Server & Sensor** | 4–5 | STB Indihome server, diskusi sensor baru, persiapan akreditasi |
| **Fitur Kalibrasi** | 6–7 | Sensor Adjustment Wizard (pH & TDS), kedatangan hardware sensor |
| **Stabilisasi Frontend** | 8 | Sinkronisasi codebase, fix bug rack_id, kunjungan supervisor |
| **Redesign & Hardware** | 9–10 | UI Glassmorphism overhaul, uji flow sensor di Medang, heavy maintenance lab |
| **Fullstack & PCB** | 11 | Planted Date (fullstack), prototyping perfboard, mulai EasyEDA & FreeCAD |
| **Fabrikasi** | 12 | Desain PCB final, desain 3D casing, order fabrikasi ke RaftechID |
| **Dokumentasi** | 13 | Laporan magang, fix Gerber, halaman docs di website |
| **Integrasi Final** | 14–16 | Perakitan, pemasangan di rak, testing end-to-end, serah terima *(proyeksi)* |
