---
marp: true
theme: default
paginate: true
size: 16:9
math: mathjax
---

# Safe-Concurrency for Multi-Sensor Fusion
## in Industrial Safety-Critical Systems
**N-Sensor + Adaptive Lockout + Event-Triggered**

**Oleh:** Abdurrauf Almutawakkil (2042241115)
**Mata Kuliah:** Pemrograman Kontroller (ETS Bagian B)

---

# 1. Latar Belakang & *Future Work*

**Sintesis dari 25 Jurnal Acuan (2021-2026):**
Mayoritas riset IoT/Embedded mengarah pada integrasi *edge AI*, deteksi *fault-tolerant*, dan penggunaan bahasa pemrograman yang *memory-safe* (Rust). 

**Celah Riset (Gabungan Future Work):**
Belum ada implementasi terintegrasi yang memadukan:
- **Rust *Memory-Safety*** tanpa *overhead* OS (*bare-metal*).
- **Multi-Sensor Fusion** berbasis *voting* (redundansi).
- **Hardware-Timed Fail-Safe** dengan latensi sangat rendah.

**Solusi yang Diusulkan:**
Implementasi *Safe-Concurrency* Rust untuk *voting-based multi-sensor fusion* dengan aktuator *fail-safe* pada ESP32-S3.

---

# 2. Sistem Kerja: Arsitektur Utama

**1. Concurrency Model (Data-Race Free)**
- Menggunakan `Mutex<RefCell<T>>` dan `critical_section`.
- Akses data sensor terjamin aman dari tabrakan (tanpa fungsi *unsafe*).

**2. Voting-Based Redundancy**
- Membaca 3 sensor: Suhu, Tekanan, Vibrasi.
- **Kondisi Fault:** Jika $\geq 2$ dari 3 sensor anomali (melewati threshold).

**3. Adaptive Lockout (Pencegah *Valve Bounce*)**
- **Minor Fault:** 2 sensor rusak $\rightarrow$ Lockout aktuator selama **500 ms**.
- **Critical Fault:** 3 sensor rusak $\rightarrow$ Lockout aktuator selama **2000 ms**.
- Aktuator darurat (katup/valve) akan tertutup penuh dan terkunci sesuai durasi.

---

# 3. Sistem Kerja: Diagram Blok & Flowchart

*(Tambahkan gambar dari direktori proyek di sini)*

- **Diagram Blok:** Menunjukkan interaksi tertutup antara ESP32-S3, Sensor, dan Aktuator. `[Masukkan DB1.drawio.png]`
- **Flowchart:** Alur deteksi *event-triggered* setiap 100 ms. `[Masukkan FLOW.png]`

**Alur Algoritma Utama:**
1. Deteksi Tombol Injeksi (Event).
2. Baca nilai sensor (Suhu $>80^\circ$C, Vibrasi $>500$).
3. Hitung Kuorum (Voting $\geq 2$).
4. Evaluasi Severity (Minor / Critical).
5. Aktifkan *Lockout Countdown*.

---

# 4. Simulator & Rangkaian Pengujian

**Perangkat Lunak:**
- **Simulator:** Proteus 9.00 (PROSPICE ESP32-S3 MicroPython VSM)
- **Toolchain:** Rust `esp-hal` v1.1.1 (Target: `xtensa-esp32s3-none-elf`)
- **Visualisasi Data:** GNUPlot 5.4+

**Rangkaian Perangkat Keras (Proteus):**
- **ESP32-S3:** Mikrokontroler Utama (240 MHz).
- **Push-Button (GPIO15):** Tombol injeksi *fault* (simulasi sensor error).
- **LED Hijau (GPIO4):** Indikator Sistem Normal.
- **LED Merah (GPIO3):** Aktuator Valve Tertutup (*Fault* aktif).
- **LED Kuning (GPIO5):** Status *Lockout* Sedang Berjalan.

---

# 5. Hasil Simulasi & Data Pengujian

**Skenario 1: Minor Fault (Tombol Ditekan Singkat)**
- Sensor Suhu & Vibrasi melebihi batas (2 dari 3 sensor).
- Valve darurat tertutup secara instan.
- **Lockout 500 ms** aktif (LED Merah & Kuning menyala). Sistem otomatis normal setelahnya.

**Skenario 2: Critical Fault (Tombol Ditahan $\geq 5$ detik)**
- Ketiga sensor (Suhu, Vibrasi, Tekanan) dinyatakan *error*.
- **Lockout 2000 ms** aktif, aktuator dipaksa tertutup lebih lama.

**Performa Latensi (Waktu Respons):**
- Diukur menggunakan *Hardware Timer* (TIMG0).
- Latensi deteksi-ke-aksi pada simulator: **$45\\ \\mu s$**.
- Proyeksi pada *bare-metal hardware* nyata: **$< 5\ \mu s$**.

*(Tambahkan Gambar GNUPlot: sensor_fusion_analysis.png & latency_analysis.png di sini)*

---

# 6. Kesimpulan Utama

1. **Memory-Safety Absolut:** Rust menghilangkan bug konduktansi memori (*data-race*) tanpa menurunkan kecepatan komputasi.
2. **Efisiensi Sistem:** Logika *voting* memakan daya dan sumber daya memori yang sangat kecil dibandingkan *framework* ML, ideal untuk mikrokontroler (*edge device*).
3. **Ketahanan Industri:** Mekanisme *Adaptive Lockout* sukses membuktikan sistem kebal terhadap osilasi sinyal sensor palsu (*valve bounce*), menjaga aktuator tetap stabil dalam keadaan darurat.
