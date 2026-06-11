Pael
Jobdesk: Frontend Engineer and Embedded Hardware Engineer
Week
Pekerjaan
1
Mempelajari konsep Smart Farming UMN dari penjelasan supervisor
Mengamati langsung proses pemasangan paralon hidroponik di lab — memahami struktur fisik dan alur distribusi air/nutrisi, Menganalisis konsep sistem IoT yang akan diterapkan 
Membuat draft komponen yang dibutuhkan 
Memulai development frontend dashboard 
2
Mengimplementasikan visualisasi monitoring 5 rak hidroponik dan kondisi ruangan yang dilengkapi grafik trend, sistem threshold otomatis, serta simulasi data dummy dengan polling real-time untuk kebutuhan demonstrasi 
Perancangan sistem monitoring suhu dan kelembaban ruangan berbasis IoT menggunakan sensor DHT22 dan Wemos D1 Mini. 
Finalisasi arsitektur komunikasi data IoT dengan team
Penataan repository Github Smart Farming
3
Pengembangan fitur time series graph di frontend
Pengembangan halaman detail per sensor yang berisikan statistik avg, min, max, current
Pengembangan halaman database viewer dan implementasi fitur ekspor data ke format CSV 
4
Implementasi sistem autentikasi di sisi frontend 
Finalisasi kebutuhan hardware
Mengonstruksi STB Indihome B860H dengan instalasi sistem operasi Linux sebagai alternatif server lokal mandiri guna mendukung stabilitas environment IoT di lab
5
Implementasi sensor water level dan water flow pada sistem monitoring sesuai dengan feedback dari supervisor
Menyesuaikan tampilan frontend dashboard untuk mengakomodasi parameter sensor baru
Pembuatan simulasi payload dummy untuk pengujian stabilitas dashboard serta penataan fisik dan wiring laboratorium dalam rangka persiapan akreditasi program studi Informatika dan Teknik Komputer. 
6
Pengembangan awal fitur Sensor Adjustment
Mengembangkan Tampilan UI untuk Calibration Wizard 
Menyusun spesifikasi teknis dan perencanaan kebutuhan komponen fisik untuk pengembangan prototype hardware tahap final
7
melanjutkan Pengembangan fitur Sensor Adjustment
Melanjutkan pengembangan Tampilan UI untuk halaman sensor adjustment
merangkai skema wiring dasar komponen baru ke development board ESP32
8
Pengembangkan fitur command execution pada dashboard untuk pengiriman instruksi kalibrasi sensor secara remote  
Pembuatan mockup desain tampilan baru secara menyeluruh
9
Pembuatan asset visual baru untuk redesign
Mengimplementasikan pembaruan UI secara menyeluruh pada website
Pengembangan responsif seluruh halaman website. 
Pengujian pemasangan water flow sensor 
10
Pemeliharaan sistem hidroponik secara komprehensif serta pengujian stabilitas operasional sensor 
Implementasi fitur Kalender Tanggal Tanam
Melakukan evaluasi perkembangan software serta menyusun prioritas transisi pekerjaan ke tahap perakitan dan instalasi hardware
11
Finalisasi schematic di EasyEDA 
Finalisasi prototyping dengan perfboard
Mengubah prototype perfboard menjadi desain 3D 
12
Desain Layout PCB
Print mock-up 3D PCB dan testing penempatan komponen
Finalisasi PCB dan pencarian vendor pencetakan PCB
13
Pembuatan dokumentasi teknis sistem secara keseluruhan.
Pengembangan halaman dokumentasi teknis berbasis teks Markdown pada frontend website, lengkap dengan navigasi Table of Contents dan syntax highlighting.
Pengalihan vendor manufaktur dan finalisasi pemesanan cetak PCB.


14
Melakukan konfigurasi dan sinkronisasi ulang environment pengembangan lokal, serta pengujian stabilitas layanan software menggunakan Docker Compose.
Melakukan perakitan fisik (hardware assembly) dan penyolderan komponen-komponen sensor ke papan PCB utama.


15
Pencetakan prototype casing 3D pelindung device
Melakukan assembly papan PCB ke dalam casing dan mengevaluasi ruang serta kesesuaian lubang 
Finalisasi prototype 3d print




# Laporan Pekerjaan Magang: Smart Farming Lab UMN
**Nama:** Pael (Frontend & Hardware Integration)

Berikut adalah laporan komprehensif mengenai tugas dan pencapaian selama program magang (16 minggu) pada proyek Smart Farming Lab UMN. Laporan ini disusun berdasarkan fungsi bidang kerja, dengan penekanan detail pada pengembangan frontend.

---

## 1. Frontend Dashboard Monitoring (Sisi Client)

Sebagai penanggung jawab utama antarmuka pengguna (UI/UX) dan sistem *client-side*, saya membangun ekosistem dashboard yang modern, responsif, dan *real-time*. Pembangunan frontend dilakukan dari nol hingga menjadi sistem produksi yang stabil.

### 1.1. Setup Proyek & Arsitektur Awal

Penulis memulai pengembangan dashboard monitoring dengan melakukan proses setup proyek di *local environment*. Tahap ini diawali dengan menginisialisasi proyek baru menggunakan **Next.js 16** dengan arsitektur **App Router**, yang merupakan standar terbaru dari framework React untuk *server-side rendering* dan *client-side routing*. Penulis memilih Next.js karena framework ini menyediakan fitur **Route Handlers** (`/api/...`) yang memungkinkan pembuatan *proxy endpoint* di sisi server, sehingga frontend tidak perlu melakukan *request* langsung ke backend FastAPI dan menghindari masalah **CORS** (*Cross-Origin Resource Sharing*).

Selanjutnya, penulis mengonfigurasi bahasa pemrograman **TypeScript** untuk seluruh kode frontend. Keputusan ini diambil karena TypeScript menyediakan *type-safety* yang ketat — setiap variabel, parameter fungsi, dan *return value* didefinisikan secara eksplisit, sehingga kesalahan logika dapat terdeteksi lebih dini pada saat kompilasi, bukan pada saat *runtime*. Penulis mendefinisikan *interface* utama seperti `SensorData`, `RackData`, `RoomData`, dan `SystemStatus` di dalam file `src/lib/sensor-data.ts` sebagai kontrak data yang digunakan di seluruh komponen.

Untuk *styling*, penulis memilih kombinasi **Tailwind CSS v4** dan **Shadcn/UI** (berbasis Radix UI). Tailwind CSS dipilih karena pendekatan *utility-first* yang memungkinkan prototyping cepat dan konsistensi visual tanpa perlu menulis file CSS terpisah. Shadcn/UI digunakan untuk komponen-komponen interaktif yang sudah teruji *accessibility*-nya, seperti `Card`, `Badge`, `Button`, `Progress`, `Tooltip`, `Dropdown`, `Drawer`, dan `Switch`. Seluruh komponen Shadcn/UI diinstal secara lokal ke dalam folder `src/components/ui/` sehingga bisa dikustomisasi sepenuhnya.

Penulis juga mendaftarkan beberapa *Google Fonts* di dalam file `layout.tsx` — yaitu **Geist**, **Geist Mono**, **Manrope**, **Hanken Grotesk**, dan **JetBrains Mono** — masing-masing disimpan sebagai CSS variable agar dapat digunakan secara fleksibel di seluruh halaman. Metadata global aplikasi ditetapkan dengan judul "Lab Smart Farming" dan deskripsi "Monitoring Hidroponik C502".

> **[PLACEHOLDER GAMBAR: Screenshot Keseluruhan Halaman Utama Dashboard (Hero/Dashboard)]**

---

### 1.2. Komponen Dashboard Utama (`page.tsx`)

Halaman utama dashboard (`/`) dibangun sebagai *Client Component* (`"use client"`) di file `src/app/page.tsx`. Penulis merancang layout halaman dengan struktur berlapis yang terdiri dari:

1. **Background Layer**: Dua gambar latar berformat AVIF (*bgsmartfarmingtop.avif* dan *bgsmartfarmingbot.avif*) diposisikan secara absolut — gambar atas menampilkan suasana *garden* dengan *rounded-bottom* 30px, dan gambar bawah menampilkan *green field* dengan efek *mask gradient* transparan agar menyatu halus dengan konten. Teknik ini memberikan kedalaman visual tanpa membebani *readability* konten utama.

2. **Header Section**: Menampilkan teks sambutan "Welcome to Lab Smart Farming" dengan tipografi berjenjang (judul utama 52px *bold*, sub-judul *medium*). Di sebelah kanan header, penulis menempatkan komponen `TopNavbar` yang memuat indikator status sistem dan navigasi.

3. **Room Monitor**: Widget untuk suhu dan kelembapan ruangan diletakkan di bawah header dengan lebar maksimal 550px.

4. **Rack Cards Grid**: Menampilkan kartu sensor untuk setiap rak hidroponik (dibatasi 3 rak utama sesuai kebutuhan operasional). Penulis mengimplementasikan dua mode tampilan — **Grid View** (3 kolom responsif) dan **List View** (horizontal, khusus untuk tampilan TV lab) — yang dapat di-toggle melalui tombol di navbar.

Penulis juga menambahkan logika responsif otomatis: jika lebar layar di bawah 1200px dan mode tampilan adalah "list" (TV Mode), sistem secara otomatis mengubah ke "grid" menggunakan `useEffect` yang memantau event `resize` pada `window`.

---

### 1.3. Mekanisme Pengambilan Data Real-Time (Polling)

Salah satu tantangan teknis utama adalah bagaimana menampilkan data sensor secara *real-time* tanpa menggunakan WebSocket. Penulis memutuskan untuk menggunakan pendekatan **HTTP Polling** dengan interval 3 detik, diimplementasikan melalui *custom hook* `useRacks()` di file `src/lib/use-racks.ts`.

Cara kerja hook ini adalah sebagai berikut:
1. Saat komponen Dashboard di-*mount*, hook membuat fungsi `fetchRacks()` yang melakukan `fetch("/api/racks")` ke *Route Handler* Next.js.
2. Fungsi ini dijalankan segera, kemudian diulang setiap 3 detik menggunakan `setInterval`.
3. Response JSON yang diterima memuat array `racks` (data 5 rak) dan flag `isOnline`.
4. Data disimpan ke state React menggunakan `useState` dan diperbarui setiap polling berhasil.
5. Saat komponen di-*unmount*, `clearInterval` dipanggil untuk menghentikan polling dan menghindari *memory leak*. Variabel `active` digunakan sebagai *guard* untuk mencegah *state update* pada komponen yang sudah di-*unmount*.

Di sisi server, penulis merancang *Route Handler* `/api/racks/route.ts` yang bertindak sebagai **proxy sekaligus in-memory cache**. Ketika menerima request GET, route handler ini:
1. Melakukan `fetch` ke backend FastAPI (`/api/v1/datalogs/latest?device_type=HYDROPONIC_RACKS`) untuk mendapatkan data sensor terbaru.
2. Menyimpan data ke dalam variabel `store` (bertipe `Map<number, RackStore>`) yang bertahan selama proses Next.js server berjalan.
3. Mempertahankan **25 data point** histori per sensor secara *in-memory* untuk kebutuhan *sparkline chart*. Setiap kali data baru masuk, array histori diperbarui dengan `slice(-(HISTORY_LENGTH - 1))` diikuti *push* nilai terbaru.
4. Melakukan **mapping key** dari format ESP32 (*snake_case*: `ph`, `ec`, `water_temp`, `water_level`, `water_flow`, `light_intensity`) ke format frontend (*camelCase*: `ph`, `ec`, `waterTemp`, `waterLevel`, `waterFlow`, `lightIntensity`) menggunakan konstanta `SENSOR_MAP`.
5. Menjamin bahwa 5 rak selalu ada di *store* meskipun belum ada data dari ESP32 (menggunakan `getOrCreateRack()` dengan *placeholder* nilai 0).

Pendekatan in-memory ini dipilih agar dashboard tidak perlu melakukan query berulang ke database PostgreSQL setiap 3 detik dari setiap pengguna, yang akan sangat membebani server.

---

### 1.4. Komponen `RackCard` — Kartu Sensor Per Rak

Penulis merancang komponen `RackCard` (`src/components/rack-card.tsx`) sebagai unit visual utama dashboard. Setiap kartu merepresentasikan satu rak hidroponik dan menampilkan data dari 6 sensor secara simultan. Proses perancangan dimulai dengan membuat sub-komponen `SensorCard` yang bersifat *reusable*, menerima props generik berupa ikon, label, nilai, unit, status, dan konfigurasi threshold.

**Struktur visual `RackCard`:**

1. **Header Rak**: Menampilkan nama rak (contoh: "Rack 1") di dalam *rounded card* dengan gradient hijau (`from-[#50705f] to-[#86a293]`). Jika rak memiliki tanggal tanam yang diset, badge "Day X" muncul di sebelah kanan menampilkan usia tanaman yang dihitung secara *real-time*.

2. **On Rack Sensors**: Bagian ini menampilkan sensor yang secara fisik terpasang pada rak, yaitu **Light Intensity** (intensitas cahaya LED *grow light*).

3. **Water Flow Chart**: Menampilkan *sparkline chart* interaktif menggunakan komponen `MiniChart` yang dibangun di atas library Recharts. Chart menampilkan 25 data point terakhir dengan warna yang berubah sesuai status sensor.

4. **Tank Sensors** (Grid 2×2): Menampilkan 4 sensor tangki dalam layout *bento grid* — **Water Level** (persentase), **pH Level** (skala 0–14), **Nutrition/EC** (mS/cm), dan **Water Temperature** (°C).

**Fitur `SensorCard` yang diimplementasikan:**
- **Ikon kontekstual** dari library Lucide React (Droplets, Gauge, Zap, Thermometer, Sun, Waves) yang warnanya berubah sesuai status sensor.
- **Progress bar** yang menampilkan posisi nilai sensor terhadap range min-max threshold secara visual. Warna progress bar berubah: hijau tua (`#34473d`) untuk Normal, oranye (`#f8650c`) untuk Warning, dan merah tua (`#8c0000`) untuk Critical.
- **Trend indicator**: Penulis mengimplementasikan fungsi `calcTrend()` yang menghitung persentase perubahan tren sensor dengan membandingkan rata-rata 5 data terakhir dengan rata-rata 5 data sebelumnya. Hasilnya ditampilkan sebagai ikon panah naik/turun dengan persentase perubahan.
- **Tooltip informatif**: Setiap sensor card dibungkus oleh `Tooltip` dari Radix UI yang menampilkan deskripsi dan range optimal (contoh: "Water pH level — optimal for hydroponics: 5.5–6.5").
- **Responsive badge position**: Penulis membuat opsi `badgePosition` (`"side"`, `"bottom"`, `"responsive"`) agar badge status sensor dapat menyesuaikan posisinya tergantung lebar layar, menggunakan *breakpoint* Tailwind `2xl:`.

Penulis juga membuat varian horizontal (`RackCardHorizontal` di file `rack-card-horizontal.tsx`) untuk mode tampilan TV lab, di mana setiap rak ditampilkan dalam satu baris horizontal yang lebih cocok untuk layar lebar.

---

### 1.5. Room Monitor — Widget Suhu & Kelembapan Ruangan

Komponen `RoomMonitor` (`src/components/room-monitor.tsx`) dirancang untuk menampilkan kondisi lingkungan ruangan laboratorium yang diambil dari sensor fisik **DHT22** yang digantung di plafon.

Penulis membuat sub-komponen `RoomSensor` yang menampilkan data suhu atau kelembapan dalam *card* dengan styling berbeda:
- **Suhu**: Menggunakan gradient hijau gelap (`from-[#50705f] to-[#86a293]`) dengan teks putih, memberikan kesan *inverted* yang kontras dengan kartu sensor lainnya.
- **Kelembapan**: Menggunakan latar transparan (`bg-white/30`) dengan teks hijau tua.
- Jika salah satu parameter memasuki zona *warning* atau *critical*, warna *card* berubah secara otomatis menggunakan fungsi `getStatusBg()`.

Data ruangan diambil melalui hook `useRoomSensor()` di file `src/lib/sensor-data.ts`, yang melakukan polling ke endpoint `/api/room` setiap 3 detik. Hook ini mengembalikan objek `roomData` (berisi `temperature` dan `humidity` bertipe `SensorData`) serta flag `esp32Online` yang mengindikasikan apakah ESP32 Room Monitor masih aktif mengirim data.

---

### 1.6. Top Navbar — Status Konektivitas & Navigasi

Komponen `TopNavbar` (`src/components/top-navbar.tsx`) merupakan *navigation bar* yang berfungsi ganda sebagai panel indikator status sistem dan pusat navigasi.

**Elemen yang diimplementasikan:**

1. **Status ESP32**: Menampilkan ikon `Wifi` (hijau) jika ESP32 terhubung, atau `WifiOff` (merah) jika terputus. Status ditentukan berdasarkan apakah ada data sensor yang diterima dalam 15 detik terakhir (`OFFLINE_TIMEOUT_MS`).

2. **Status Server**: Menampilkan ikon `Server`/`ServerOff` untuk mengindikasikan apakah backend FastAPI bisa dijangkau.

3. **Last Sync**: Menampilkan waktu sinkronisasi terakhir dalam format jam:menit:detik. Penulis membuat komponen khusus `ClientTime` yang hanya me-*render* waktu di sisi klien menggunakan `useEffect` untuk menghindari *hydration mismatch* antara server dan client rendering Next.js.

4. **View Mode Toggle**: Dua tombol (ikon `LayoutGrid` dan `List`) dalam container transparan (`bg-white/20 backdrop-blur-md`) untuk beralih antara mode Grid dan TV.

5. **Notification Center**: Tombol lonceng dengan badge jumlah notifikasi yang belum dibaca (detail di Bagian 1.7).

6. **Quick Navigation**: Tiga tombol navigasi — History (ikon jam), Planting Management (ikon Sprout), dan Sensor Adjustment (ikon Wrench) — masing-masing mengarah ke halaman terkait.

7. **Settings Dropdown**: Berisi kontrol **mode simulasi** dengan `Switch` untuk mengaktifkan/menonaktifkan simulasi data dan tiga tombol mode: Stable (ikon Activity), Trending Up (ikon panah naik, merah), dan Trending Down (ikon panah turun, biru).

Untuk tampilan **mobile**, penulis mengimplementasikan `Drawer` dari Shadcn/UI yang muncul dari sisi kanan layar (`direction="right"`). Drawer ini memuat semua elemen yang sama dalam layout vertikal yang lebih *touch-friendly*, termasuk status sistem, navigasi, dan kontrol simulasi.

---

### 1.7. Sistem Notifikasi & *Threshold Engine*

Penulis merancang sistem pemantauan ambang batas sensor (*threshold engine*) yang terdiri dari dua lapisan: konfigurasi threshold dan engine notifikasi.

**Konfigurasi Threshold (`src/lib/thresholds.ts`)**

Penulis mendefinisikan konstanta `THRESHOLDS` yang memuat parameter batas untuk setiap jenis sensor. Setiap entri memiliki properti `min`, `max`, `warningLow`, `warningHigh`, `criticalLow`, `criticalHigh`, beserta `unit` dan `label`. Contoh konfigurasi pH: `warningLow: 5.5`, `warningHigh: 6.5`, `criticalLow: 4.5`, `criticalHigh: 7.5` — artinya pH di bawah 5.5 akan menghasilkan status "Low", pH di atas 6.5 menghasilkan "High", dan pH di bawah 4.5 atau di atas 7.5 menghasilkan "Critical".

Penulis membuat fungsi `getStatus(value, type)` yang mengevaluasi nilai sensor secara berurutan: pertama mengecek critical range, kemudian warning range, dan mengembalikan "Normal" jika tidak ada pelanggaran. Selain itu, penulis membuat helper functions `getStatusColor()`, `getStatusBg()`, `getStatusDot()`, dan `getProgressColor()` yang mengembalikan class Tailwind CSS sesuai status — hijau tua `#34473d` untuk Normal, oranye `#f8650c` untuk Warning, dan merah tua `#8c0000` untuk Critical.

**Engine Notifikasi (`src/lib/notifications.ts`)**

Hook `useNotifications()` merupakan *reactive notification engine* yang secara otomatis menghasilkan notifikasi saat status sensor berubah. Penulis mengimplementasikan logika sebagai berikut:

1. **Inisialisasi**: Pada *render* pertama, hook menyimpan status awal semua sensor ke dalam `prevStatuses` (bertipe `Map<string, Status>`) menggunakan `useRef`. Pada tahap ini **tidak ada notifikasi yang dihasilkan** — ini mencegah *flood* notifikasi saat dashboard pertama kali dibuka.

2. **Deteksi Transisi Status**: Setiap kali data sensor diperbarui (setiap 3 detik), hook membandingkan status baru dengan status sebelumnya untuk setiap sensor pada setiap rak. Notifikasi hanya dihasilkan saat status **berpindah ke zona warning/critical** (bukan saat sudah berada di zona tersebut), menghindari duplikasi.

3. **Pesan Remediasi Cerdas**: Setiap notifikasi dilengkapi saran penanganan spesifik per sensor dan arah deviasi. Penulis mendefinisikan pesan remediasi untuk setiap sensor, misalnya:
   - pH terlalu rendah: *"Tambahkan larutan pH Up secara bertahap dan ukur kembali setelah 30 menit."*
   - Water Flow terlalu rendah: *"Pump Failure Detected — Immediate action required! Periksa pompa air, kemungkinan tersumbat, rusak, atau mati."*
   
   Fungsi `getRemediationSmart()` menentukan arah deviasi ("low" atau "high") berdasarkan posisi nilai sensor terhadap *midpoint* dari *warning range*, sehingga pesan yang ditampilkan selalu relevan.

4. **Manajemen State**: Notifikasi disimpan dengan kapasitas maksimal 50 entri (`MAX_NOTIFICATIONS`). Penulis juga mengimplementasikan fungsi `markAllRead()` dan `clearAll()` yang dibungkus `useCallback` untuk efisiensi *re-render*.

---

### 1.8. Sistem Simulasi Data Internal

Karena pada tahap awal pengembangan (khususnya untuk demo Open House) perangkat keras belum tersedia, penulis membangun sistem simulasi data sensor yang lengkap menggunakan **React Context API**.

Penulis membuat file `src/lib/simulation-context.tsx` yang berisi `SimulationProvider` — sebuah *context provider* yang membungkus seluruh aplikasi di `layout.tsx`. Sistem ini menyediakan tiga mode simulasi:

1. **Stable**: Nilai sensor berfluktuasi halus di sekitar *midpoint* range normal. Fungsi `drift()` menerapkan *random noise* kecil dan *pull force* lemah (`pullStrength: 0.01`) menuju titik tengah.

2. **Trending Up**: Nilai sensor secara gradual naik menuju 85% dari range maksimum (`pullStrength: 0.03` menuju `target = min + range * 0.85`). Mode ini berguna untuk mendemonstrasikan skenario sensor memasuki zona *warning* dan *critical*.

3. **Trending Down**: Kebalikan dari Trending Up — nilai turun menuju 15% dari range minimum.

Setiap 2,5 detik, fungsi `tick()` memperbarui semua sensor secara simultan. Fungsi `clamp()` memastikan nilai tidak pernah keluar dari range fisik yang valid. Seluruh hook data (`useRacks`, `useRoomSensor`) dilengkapi pengecekan `sim.isSimulating` — jika simulasi aktif, hook langsung mengembalikan data simulasi tanpa melakukan fetch ke API.

---

### 1.9. History Hub & Grafik Time-Series

Penulis mengembangkan halaman `History Hub` (`/history`) sebagai *overview* navigasi menuju grafik detail, dan halaman `/rack/[id]` sebagai halaman grafik per rak.

**Halaman Grafik Detail (`src/app/rack/[id]/page.tsx`)**

Penulis mengimplementasikan halaman grafik time-series menggunakan library **Recharts** dengan komponen `AreaChart`. Proses pengembangan dimulai dengan membuat *custom hook* `useRackHistory()` di file `src/lib/useRackHistory.ts` yang melakukan `fetch` ke endpoint `/api/rack/[id]/history?range={timeRange}`.

Fitur-fitur yang diimplementasikan:

1. **Filter Rentang Waktu**: Empat opsi — 1 Jam, 6 Jam, 24 Jam, dan 7 Hari — ditampilkan sebagai *button group* di *sticky header*. Saat user memilih rentang waktu, hook otomatis memuat ulang data dari backend.

2. **Warna Unik Per Sensor**: Penulis menetapkan warna berbeda untuk setiap tipe sensor: hijau `#10b981` untuk pH, biru `#3b82f6` untuk EC, kuning `#f59e0b` untuk suhu air, cyan `#06b6d4` untuk water level, ungu `#8b5cf6` untuk water flow, dan oranye `#f97316` untuk light intensity.

3. **Gradient Area Fill**: Setiap grafik menggunakan `linearGradient` SVG yang memberikan efek transisi dari warna sensor (30% opacity di atas) menjadi transparan di bawah, menciptakan kesan visual yang lebih elegan dibandingkan area fill solid.

4. **Format Waktu Kontekstual**: Fungsi `formatTime()` otomatis menyesuaikan format label sumbu X — menggunakan jam:menit untuk rentang 1–24 jam, dan tanggal:bulan untuk rentang 7 hari.

5. **Badge Nilai Terkini**: Setiap panel grafik menampilkan badge di pojok kanan atas yang menunjukkan nilai terakhir sensor yang tercatat.

6. **Responsive Grid**: Grafik-grafik sensor ditampilkan dalam grid responsif (1 kolom di mobile, 2 di tablet, 3 di desktop).

---

### 1.10. Database Viewer & Halaman Eksplorasi Data

Penulis membangun halaman tabular untuk melihat data *raw* dari database menggunakan **TanStack Table** — library *headless table* yang menyediakan *pagination*, *sorting*, dan *filtering* tanpa *opinionated styling*.

Fitur yang diimplementasikan:
- Tabel menampilkan kolom: `device_id`, `data_log` (JSON), dan `timestamp`.
- Pagination untuk navigasi data dalam jumlah besar.
- Filter berdasarkan *device_id* dan rentang waktu.
- **Export CSV**: Tombol download yang memanggil endpoint backend `/api/v1/datalogs/exports/csv` dan menghasilkan file CSV yang bisa dibuka di Excel.

---

### 1.11. Proteksi Halaman (Autentikasi)

Penulis mengimplementasikan sistem login sederhana menggunakan **JWT** (*JSON Web Token*) untuk memproteksi halaman data historis agar hanya dapat diakses oleh admin laboratorium.

Proses yang dilakukan:
1. Membuat halaman login di frontend dengan form input username dan password.
2. Menggunakan library **Zod** untuk validasi input — memastikan username minimal 3 karakter dan password tidak kosong sebelum dikirim ke server.
3. Jika autentikasi berhasil, token JWT disimpan dan disertakan di setiap request ke endpoint yang terproteksi.
4. Halaman data historis mengecek keberadaan token sebelum menampilkan konten.

---

### 1.12. *Sensor Adjustment* (Kalibrasi Remote via MQTT)

Penulis merancang sistem kalibrasi sensor yang memungkinkan admin lab melakukan kalibrasi pH dan TDS secara remote langsung dari browser, tanpa harus menyentuh perangkat ESP32 secara fisik.

**Logika Kalibrasi (`src/lib/calibration.ts`)**

Penulis mendefinisikan tipe `CalibrationCoefficients` yang menyimpan koefisien kalibrasi: `ph_slope`, `ph_offset`, `tds_k_factor`, `tds_offset`, beserta timestamp dan identitas kalibrasi.

Untuk **pH**, kalibrasi menggunakan metode *2-point*:
1. Sensor dicelupkan ke larutan buffer **pH 7.00** (neutral) — nilai ADC dicatat.
2. Sensor dicelupkan ke larutan buffer **pH 4.00** (acid) — nilai ADC dicatat.
3. ESP32 menghitung **slope** dan **offset** dari dua titik tersebut.
4. Formula konversi: `pH = (slope × raw_ADC) + offset`.

Untuk **TDS**, kalibrasi menggunakan metode *1-point*:
1. Sensor dicelupkan ke larutan referensi **1382 ppm**.
2. ESP32 menghitung **k_factor** dan **offset** dengan kompensasi suhu.
3. Formula konversi: `TDS = (value × k_factor + offset) / (1 + 0.019 × (temp - 25))`.

Penulis juga mengimplementasikan fungsi `isStable()` yang mendeteksi apakah pembacaan sensor sudah stabil (standar deviasi dari 5 data terakhir di bawah threshold tertentu) sebelum kalibrasi dapat dikonfirmasi.

**Alur Pengiriman Perintah**

Fungsi `sendCalibrationCommand()` mengirimkan POST request ke `/api/calibration/{rackId}/command` dengan payload berisi `command_type` (misalnya `KALIBRASI_PH`) dan `known_value` (nilai referensi). Setelah perintah terkirim, fungsi `pollForAck()` melakukan polling setiap 2 detik ke `/api/calibration/{rackId}/status` untuk mengecek apakah ESP32 sudah mengirim ACK. Timeout ditetapkan 30 detik — jika tidak ada respons, status dianggap `TIMEOUT_ASSUMED_OK` karena perintah sudah terkirim meskipun ACK mungkin hilang di jaringan.

**UI Wizard**

Penulis membangun 4 komponen wizard di folder `src/components/calibration/`:
- `calibration-wizard.tsx` — *container* utama yang mengatur alur kalibrasi.
- `ph-calibration-steps.tsx` — step-by-step pH kalibrasi (2 langkah + konfirmasi).
- `tds-calibration-steps.tsx` — step-by-step TDS kalibrasi (1 langkah + konfirmasi).
- `live-sensor-display.tsx` — menampilkan nilai *raw* sensor secara *real-time* selama proses kalibrasi berlangsung, menggunakan polling ke `/api/racks?raw_mode=true`.

**Penyimpanan Koefisien**

Karena pada awal pengembangan endpoint kalibrasi dari backend belum tersedia, penulis mengimplementasikan *fallback* menggunakan **localStorage** browser. Koefisien kalibrasi disimpan di `localStorage` dengan key `hydroponic_calibration` dan di-*load* kembali setiap kali dashboard diakses. Fungsi helper `saveCalibration()`, `loadCalibration()`, dan `clearCalibration()` mengelola operasi CRUD pada penyimpanan ini.

Saat koefisien tersedia, route handler `/api/racks` membaca koefisien dari query parameter `calibration` dan menerapkannya ke data sensor sebelum dikirim ke browser, menggunakan fungsi `applyPhCalibration()` dan `applyTdsCalibration()`.

---

### 1.13. Fitur *Planting Management* (Kalender Tanam & "Day X")

Penulis merancang modul *fullstack* untuk melacak masa pertumbuhan tanaman di setiap rak.

**Pemanfaatan JSONB**: Penulis menyimpan atribut tanggal tanam (`planted_at`) secara dinamis di dalam kolom `attr` bertipe JSONB di tabel `Device` pada database PostgreSQL. Keputusan ini diambil agar fitur ini dapat ditambahkan tanpa harus merombak skema tabel utama atau membuat migrasi database yang kompleks — cukup menambahkan key baru ke dalam objek JSON yang sudah ada.

**Implementasi Frontend (`src/app/planted-date/page.tsx`)**:
1. Halaman menampilkan 3 rak utama dalam grid responsif dengan card yang menunjukkan status tanam.
2. Jika rak belum ditanami, ditampilkan tombol "Set Tanggal Tanam" yang membungkus `<input type="date">` transparan di atas `<Button>` — teknik ini memberikan tampilan tombol yang konsisten dengan desain sambil memanfaatkan *native date picker* bawaan browser.
3. Fungsi `calculateDays()` menghitung selisih hari antara tanggal tanam dan hari ini, menampilkan sebagai "Day 1", "Day 14", dst.
4. Tombol "Panen Sekarang" mereset tanggal tanam menjadi `null` dengan konfirmasi dialog bawaan browser.
5. Tombol "Ubah Tanggal" muncul hanya jika rak sudah memiliki tanggal tanam.

**API Proxy**: Penulis membuat route handler `/api/racks/[id]/planted-date/route.ts` yang meneruskan PATCH request ke endpoint backend `/api/v1/generals/devices/{id}/planted-date`.

**Integrasi Dashboard**: Di route handler utama `/api/racks/route.ts`, penulis menambahkan logika untuk mengambil data device dari endpoint `/api/v1/generals/devices`, mengekstrak `planted_at` dari `attr` JSONB, dan menyimpannya ke in-memory store agar badge "Day X" bisa tampil di `RackCard` header.

---

### 1.14. *Redesign* Tema & UI/UX (Glassmorphism)

Pada minggu ke-9, penulis mengeksekusi perombakan total visual antarmuka (*UI Redesign*).

Proses redesign dimulai dengan membuat aset latar belakang (*background images*) beresolusi tinggi berformat **AVIF** — dipilih karena rasio kompresi yang jauh lebih baik dibandingkan JPEG/PNG tanpa kehilangan kualitas visual yang signifikan. Dua gambar digunakan: suasana *garden* untuk bagian atas dan *green field* untuk bagian bawah.

Penulis mengganti pendekatan *flat design* sebelumnya menjadi gaya **Glassmorphism** — sebuah tren desain modern yang menggunakan elemen semi-transparan dengan efek *blur* di belakangnya. Implementasinya menggunakan kombinasi class Tailwind CSS: `bg-white/40` (background putih 40% opacity), `backdrop-blur-md` (blur 12px pada elemen di belakang), dan `border border-white/20` (border putih tipis transparan).

Palet warna utama ditetapkan sebagai **dark green `#34473d`** untuk teks dan elemen primer, dengan variasi gradient `#50705f` hingga `#86a293` untuk aksen. Warna krem `#ece9e5` digunakan sebagai warna dasar halaman.

Penulis juga menghapus fitur *dark/light mode* (ThemeProvider dari `next-themes`) yang awalnya telah diimplementasikan. Keputusan ini diambil karena *glassmorphism* dengan background image beresolusi tinggi sudah memberikan estetika yang kuat dan konsisten, sementara mendukung dua mode tema akan menggandakan pekerjaan *styling* dan berpotensi mengurangi kualitas visual pada salah satu mode.

Optimasi *layouting* dilakukan agar tampilan beradaptasi sempurna di tiga target perangkat: TV laboratorium (untuk *fullscreen monitoring* dengan mode List/Horizontal), PC desktop (mode Grid 3 kolom), dan *smartphone* (mode Grid 1 kolom). Komponen `RackCardHorizontal` dirancang khusus untuk tampilan TV lab.

---

## 2. Pemilihan Hardware & Analisis Kebutuhan Fisik
*(Draft Awal: Menganalisis sistem Smart Garden terdahulu, menetapkan pembagian lokasi sensor (plafon, tandon, rak), evaluasi ketersediaan sensor, dan diskusi dengan pakar hidroponik (Bernard).*

> **[PLACEHOLDER GAMBAR: Tabel Daftar Spesifikasi Lengkap Sensor & Hardware]**
> **[PLACEHOLDER GAMBAR: Foto Perangkat/Sensor Sebelum Dirakit]**

**[BUTUH DETAIL DARI PAEL - SILAKAN JAWAB PERTANYAAN BERIKUT UNTUK MELENGKAPI BAGIAN INI]**
1. Apa alasan spesifik (teknis/harga/ketersediaan/ketahanan) Anda memilih sensor Ultrasonik tipe *waterproof* dibandingkan sensor pelampung (float switch) biasa untuk tandon?
2. Mengapa memilih DHT22 untuk suhu ruangan dibandingkan tipe DHT11 atau sensor lainnya? Bagaimana karakteristiknya?
3. Jenis/tipe spesifik apa yang digunakan untuk sensor pH dan TDS? Apakah ada alasan khusus?
4. Bagaimana proses diskusi dengan Bernard (mahasiswa Management) memengaruhi keputusan akhir pemilihan hardware? Apakah ada jenis sensor yang awalnya tidak direncanakan lalu ditambahkan berkat masukannya?
5. Apa tantangan terbesar saat menganalisis ketersediaan kelistrikan dan jaringan di dalam Lab Smart Farming?

---

## 3. Desain Skema Elektronik & PCB (EasyEDA)
*(Draft Awal: Menguji sirkuit dasar menggunakan perf board & XH connector, merancang skematik sistem kelistrikan dengan EasyEDA, menentukan letak komponen PCB, hingga fabrikasi PCB di vendor RaftechID).*

> **[PLACEHOLDER GAMBAR: Skematik Elektronik (EasyEDA Blueprint)]**
> **[PLACEHOLDER GAMBAR: Desain Layout PCB (2D / 3D Render dari EasyEDA)]**
> **[PLACEHOLDER GAMBAR: Foto Fisik PCB yang Sudah Dicetak]**

**[BUTUH DETAIL DARI PAEL - SILAKAN JAWAB PERTANYAAN BERIKUT UNTUK MELENGKAPI BAGIAN INI]**
1. Bagaimana detail skema *wiring* pin dari ESP32 menuju sensor-sensor analog (pH, TDS)? Apakah Anda menggunakan komponen tambahan seperti *multiplexer*, *level shifter*, resistor, atau *op-amp*?
2. Pembacaan sensor analog seringkali mengalami *noise* atau gangguan frekuensi di satu *board*. Bagaimana cara Anda mengatasi tantangan ini dalam skema kelistrikan?
3. Tolong ceritakan proses merakit purwarupa (*prototyping*) dengan *perfboard*. Hambatan apa yang terjadi sebelum akhirnya memutuskan mendesain PCB?
4. Apa spesifikasi teknis dari PCB yang dicetak di RaftechID (misal: tebal jalur tembaga, ukuran *board*, jumlah *layer*, jenis *surface finish*)? 

---

## 4. Desain Enclosure 3D & Tata Letak Fisik (FreeCAD)
*(Draft Awal: Mengukur dimensi fisik modul dan ESP32, melakukan perancangan bentuk pelindung dengan FreeCAD, dan proses cetak 3D casing).*

> **[PLACEHOLDER GAMBAR: Desain 3D Casing Enclosure di Layar FreeCAD]**
> **[PLACEHOLDER GAMBAR: Foto Casing Fisik yang Sudah Dicetak dan Terpasang]**

**[BUTUH DETAIL DARI PAEL - SILAKAN JAWAB PERTANYAAN BERIKUT UNTUK MELENGKAPI BAGIAN INI]**
1. Mengapa menggunakan FreeCAD dibandingkan *software 3D modeling* lain? 
2. Laboratorium hidroponik sangat rentan terhadap air dan kelembapan tinggi. Bagaimana desain *casing* ini dibuat agar *water-resistant* namun tetap menyediakan jalur keluar-masuk kabel dan lubang pembuangan panas (ventilasi) untuk ESP32?
3. Material filamen apa yang digunakan untuk mencetak *casing* ini (PLA, PETG, ABS)? Apa alasannya memilih bahan tersebut mengingat alat diletakkan di dekat air?
4. Di titik mana secara spesifik pada rak hidroponik atau area tandon *enclosure* ini ditempel/diletakkan? Bagaimana mekanisme *mounting*-nya?

---

## 5. Pengujian Fisik, Integrasi, & Pemeliharaan Laboratorium
*(Draft Awal: Pemasangan sensor flow air dengan fitting paralon di Medang, setup alternatif server STB Indihome Linux, heavy maintenance lab (menguras air, mencabut bayam mati), serta demonstrasi saat Akreditasi IF & TK).*

> **[PLACEHOLDER GAMBAR: Foto Proses Pemasangan/Wiring di Rak Hidroponik Lab]**
> **[PLACEHOLDER GAMBAR: Foto STB Indihome B860H yang Dijadikan Server]**
> **[PLACEHOLDER GAMBAR: Foto Suasana Lab saat Demonstrasi / Akreditasi / Open House]**

**[BUTUH DETAIL DARI PAEL - SILAKAN JAWAB PERTANYAAN BERIKUT UNTUK MELENGKAPI BAGIAN INI]**
1. Tolong ceritakan tantangan fisik saat menginstalasi pipa sirkulasi (*water flow sensor*). Kenapa harus berbelanja sambungan khusus hingga ke material di Medang? 
2. Apa alasan teknis di balik ide brilian mengubah STB Indihome B860H menjadi *server* Linux? Apakah perangkat ini terbukti sanggup menjalankan *Docker Compose* (Backend, Frontend, MQTT, DB) secara mandiri di dalam Lab?
3. Saat melakukan *heavy maintenance* (menguras tangki dan membersihkan sisa akar/bayam busuk), bagaimana hal tersebut berdampak pada kualitas air? Apakah terjadi fluktuasi nilai drastis pada pembacaan sensor pH dan TDS sebelum dan sesudahnya?
4. Bagaimana peran dan tanggung jawab Anda di lapangan saat momen-momen kritis seperti acara *Open House* kampus dan visitasi asesor Akreditasi prodi IF & TK?

---
*Laporan ini merupakan rangkuman akhir pertanggungjawaban tugas magang.*
