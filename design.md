# Frontend Design System: Smart Farming Lab

Dokumen ini mendeskripsikan sistem desain, styling, dan palet warna yang digunakan pada komponen frontend (Next.js) dari aplikasi hidroponik.

## 1. Core Aesthetics & Philosophy
Desain aplikasi ini mengusung tema **Modern, Clean, dan Organic**. 
- **Glassmorphism:** Penggunaan efek kaca tembus pandang secara luas (`backdrop-blur-md`, `backdrop-blur-sm`, `bg-white/40`) untuk menciptakan kesan kedalaman (depth) dan antarmuka yang ringan.
- **Fluidity & Interactivity:** Transisi yang halus (`transition-all duration-300`, `duration-500`) pada komponen interaktif, hover states, dan animasi *progress bar*.
- **Data-Centric but Friendly:** Menggunakan `tabular-nums` untuk kemudahan membaca angka sensor, dipadukan dengan bentuk melengkung (`rounded-xl`, `rounded-full`) agar tidak terlihat kaku.

## 2. Color Palette

Palet warna sangat terinspirasi dari alam (hijau/bumi) untuk mencerminkan konteks pertanian hidroponik. Aplikasi ini juga mendukung Dark Mode (`oklch` css variables).

### Background Colors
- **Global Background (Light):** `#eae9e4` (Beige / Warm Gray yang lembut, memberikan kesan organik).
- **Global Background (Dark):** `oklch(0.145 0 0)` (Hitam pekat/abu-abu sangat gelap).
- **Card Backgrounds:** Translucent white (`bg-white/50`, `bg-white/40`) atau translucent dark (`bg-gray-950/40`) untuk efek *glass*.

### Primary & Accent Colors (Organic Greens)
Warna hijau digunakan untuk menunjukkan status normal, header, dan aksen visual utama:
- **Dark Forest Green:** `#34473d` (Sering digunakan untuk teks status "Normal" dan icon).
- **Leaf Green Gradient:** Kombinasi `from-[#50705f]` ke `to-[#86a293]` (Digunakan pada header "Rack").
- **Soft Moss Green:** `#7f9c8c` (Digunakan pada background chart atau elemen sekunder).

### Status & Feedback Colors
Sistem peringatan menggunakan standar warna lalu lintas yang disesuaikan agar tetap harmonis:
- **Normal / Optimal:** Hijau (`text-[#34473d]`, atau menggunakan varian hijau utama).
- **Warning:** Amber / Kuning (`text-amber-500`, border `border-amber-200`).
- **Critical / Danger:** Rose / Merah (`text-rose-500`, border `border-rose-200`).

## 3. UI Framework & Tools
- **CSS Framework:** Tailwind CSS (v4) menggunakan `@theme inline` dan CSS variables.
- **Component Library:** **Shadcn UI** dengan *style* `new-york` (Netral).
- **Iconography:** **Lucide React** (Ikon bergaya garis yang bersih seperti `Sprout`, `Thermometer`, `Droplets`).

## 4. Key Component Patterns

### A. Sensor Cards (`<SensorCard />`)
Kartu mikro untuk menampilkan satu metrik spesifik (misal: suhu air, pH).
- **Layout:** Menggunakan ikon di sudut kiri, status badge (Normal/Warning) di sudut kanan, dan nilai tebal di tengah.
- **Visuals:** Menggunakan efek kaca (`backdrop-blur-sm`), bayangan halus (`shadow-md`), dan *progress bar* mungil di bagian bawah untuk menunjukkan posisi nilai di antara threshold (batas aman).

### B. Rack Cards (`<RackCard />`)
Kontainer utama untuk satu rak hidroponik yang menggabungkan banyak *Sensor Card*.
- **Visuals:** Header menggunakan gradient hijau tebal (`bg-gradient-to-br`) dengan teks putih untuk hierarki yang jelas. Badannya menggunakan efek *glassmorphism* tebal (`bg-white/40 backdrop-blur-md border border-white/20 shadow-xl`).
- **Struktur Data:** Dikelompokkan menjadi "On Rack Sensors" (Pencahayaan) dan "Tank Sensors" (Air, pH, Nutrisi) menggunakan Grid system.

### C. Data Visualizations (`<MiniChart />`)
Grafik kecil (sparklines) terintegrasi langsung di dalam kartu (contoh: *Water Flow*) untuk menunjukkan tren tanpa harus membuka halaman analitik penuh. Background menggunakan gradient yang sangat pudar (misal: `from-[#7f9c8c]/40 to-white`).
