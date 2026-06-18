# Naskah Presentasi & Bahan Bacaan Mendalam

> Safe-Concurrency for Multi-Sensor Fusion in Industrial Safety-Critical Systems
> Untuk dipelajari, bukan sekadar dihafal.

---

## BAGIAN 1 — NARASI BESAR (The Big Story)

### Apa masalah yang kita pecahkan?

Di dunia industri, sistem safety-critical seperti kontrol valve pada pabrik kimia,
pembangkit listrik, atau kilang minyak TIDAK BOLEH GAGAL. Satu kesalahan bisa
berakibat fatal: ledakan, kebocoran gas beracun, kerusakan lingkungan.

Saat ini, mayoritas sistem embedded safety-critical ditulis dalam bahasa C/C++.
Masalahnya:
- C/C++ tidak menjamin memory safety — programmer bisa membuat bug seperti
  use-after-free, buffer overflow, atau data race.
- 186 CVE (vulnerability) terkait memory-safety ditemukan di Rust unsafe code
  saja (Xu et al., 2021) — apalagi C/C++ yang tidak punya safety guarantee.
- Sistem konvensional biasanya menggunakan single-sensor threshold — satu sensor
  rusak = false positive = shutdown tidak perlu, ATAU false negative = bencana.

### Apa solusi yang kami tawarkan?

Kami membangun sistem sensor fusion dengan tiga lapisan keamanan:
1. **Rust safe-concurrency** — compiler menjamin tidak ada data race. Bukan
   programmer yang harus hati-hati, tapi compiler yang menolak compile jika
   ada potensi race condition.
2. **Voting redundancy** — fault hanya dideklarasikan jika ≥2 dari 3 sensor
   anomali. Satu sensor rusak masih ditoleransi.
3. **Adaptive lockout** — setelah fault, aktuator dikunci dalam posisi aman.
   Durasi lockout disesuaikan dengan severity: 500ms untuk MINOR (2 sensor),
   2000ms untuk CRITICAL (3 sensor).

---

## BAGIAN 2 — MEMAHAMI SETIAP KOMPONEN

### 2.1 Rust Safe-Concurrency — Kenapa Ini Penting?

**Analoginya:** Bayangkan tiga orang (sensor) menulis di satu papan tulis
(shared state) secara bersamaan. Di C/C++, programmer harus mengatur siapa
yang pegang spidol — kalau lupa, dua orang bisa menulis bersamaan dan hasilnya
kacau (data race). Di Rust, compiler BERTINDAK SEPERTI SATPAM yang memastikan
hanya satu orang yang bisa menulis di papan setiap saat.

**Secara teknis:** Kami menggunakan `Mutex<RefCell<T>>` yang dibungkus dalam
`critical_section`. Begitu critical section dimulai, SEMUA interrupt di
ESP32-S3 dinonaktifkan — jadi tidak ada yang bisa mengakses data sensor saat
sedang dibaca/ditulis. Begitu critical section selesai, interrupt kembali normal.

**Ini BUKAN multitasking.** ESP32-S3 dual-core, tapi kami jalan di single-core
bare-metal. Tidak ada RTOS. Concurrency di sini maksudnya: interrupt handler
(timer) bisa fire kapan saja, dan Rust menjamin interrupt handler tidak akan
membaca data yang sedang setengah ditulis.

**Pertanyaan yang mungkin muncul:**
> "Kenapa tidak pakai RTOS saja?"
Karena RTOS menambah kompleksitas, overhead, dan potential failure point. Di
sistem safety-critical, semakin sedikit komponen = semakin sedikit yang bisa gagal.
Bare-metal artinya KITA yang punya kontrol penuh atas setiap instruksi.

> "Bukankah menonaktifkan interrupt itu berbahaya?"
Ya, makanya critical section harus SANGAT SINGKAT. Kami hanya menonaktifkan
interrupt selama beberapa mikrodetik — hanya saat membaca/menulis state sensor.
Setelah itu interrupt kembali normal. Timer tidak akan miss karena durasinya
sangat pendek.

### 2.2 Voting Redundansi — Kenapa ≥2 dari 3?

**Analoginya:** Tiga orang saksi melihat kejadian. Dua bilang "terjadi", satu
bilang "tidak". Kita percaya mayoritas. Kalau cuma satu yang bilang "terjadi",
mungkin dia salah lihat.

**Threshold-nya:**
- Suhu > 80°C → anomali (nilai normal: 25°C)
- Tekanan < 900 atau > 1200 hPa → anomali (nilai normal: 1013 hPa)
- Vibrasi > 500 → anomali (nilai normal: 5)

**Kenapa threshold segitu?**
- 80°C: di atas suhu operasi normal kebanyakan peralatan industri. Bukan nilai
  random — didasarkan pada typical industrial temperature rating.
- 900-1200 hPa: rentang tekanan atmosfer normal plus margin. Di luar itu
  berarti sensor rusak atau ada kebocoran sistem.
- 500: nilai vibrasi signifikan yang mengindikasikan getaran abnormal.

**Pertanyaan yang mungkin muncul:**
> "Kenapa tidak 3/3 saja biar lebih aman?"
Karena kalau 3/3, satu sensor rusak = sistem tidak akan pernah mendeteksi fault
(selalu maksimal 2/3). Kita justru MAU toleransi 1 sensor gagal — itulah gunanya
redundansi.

> "Kenapa tidak 1/3? Kan lebih sensitif?"
Terlalu sensitif = banyak false positive. Satu sensor bisa noise sesaat, dan
sistem akan shutdown tidak perlu. Di industri, false positive juga berbahaya
— bisa menghentikan produksi yang tidak perlu.

### 2.3 Adaptive Lockout — Kenapa 500ms dan 2000ms?

**Analoginya:** Seperti airbag di mobil. Begitu mengembang, airbag TIDAK
langsung kempes — butuh waktu beberapa detik. Kenapa? Karena kalau langsung
kempes, penumpang belum sempat aman, dan tabrakan susulan bisa fatal.

Begitu juga dengan valve industri. Begitu valve menutup karena fault, kita
TIDAK MAU valve langsung membuka lagi hanya karena sensor sudah normal. Kenapa?
Karena:
1. Sensor bisa berfluktuasi — normal → anomali → normal dalam hitungan milidetik
2. Proses industri butuh waktu untuk stabil — buru-buru buka valve bisa
   menyebabkan pressure surge
3. Valve yang membuka-tutup-membuka-tutup cepat (= valve bounce) bisa merusak
   aktuator secara mekanis

**Kenapa 500ms untuk MINOR?**
MINOR = 2 sensor anomali, masih ada 1 sensor normal. Artinya redundansi masih
berfungsi. Kita cukup yakin ini bukan false positive, tapi kita juga tidak
perlu terlalu lama mengunci — 500ms cukup untuk memastikan pembacaan stabil.

**Kenapa 2000ms untuk CRITICAL?**
CRITICAL = 3 sensor anomali. Semua sensor "buta". Kita harus sangat berhati-hati
karena tidak ada informasi valid sama sekali. 2000ms = 4× lebih lama dari MINOR,
memberikan waktu lebih untuk:
- Memastikan bukan transient spike
- Operator manusia bisa mengambil alih jika diperlukan
- Proses shutdown yang aman

**Bagaimana sistem membedakan MINOR vs CRITICAL?**
Di simulasi, kami menggunakan durasi tekan tombol sebagai skenario:
- Klik singkat < 5 detik → hanya suhu dan vibrasi diinjeksi → 2/3 = MINOR
- Tahan ≥ 5 detik → suhu, vibrasi, DAN tekanan diinjeksi → 3/3 = CRITICAL

Di dunia nyata, severity ditentukan oleh jumlah sensor yang melaporkan anomali
secara alami — bukan oleh tombol. Tombol di sini adalah SIMULATOR fault injection.

### 2.4 Hold-Duration Detection — Kenapa Perlu Sticky Latch?

**Masalah:** Di Proteus, klik tombol mouse hanya berlangsung beberapa milidetik.
Sementara polling interval kita 100ms. Tanpa mekanisme khusus, klik bisa terlewat
— tombol HIGH hanya 10ms, keburu LOW lagi sebelum 100ms berikutnya.

**Solusi — Sticky Latch:**
Begitu tombol pernah terbaca HIGH, sebuah "latch" (semacam flip-flop digital)
diset ke TRUE. Latch ini TETAP TRUE meskipun tombol sudah dilepas. Latch hanya
di-reset saat:
1. Fault terdeteksi (press sudah "dikonsumsi")
2. Lockout selesai (sistem siap menerima press baru)

**Kenapa tidak pakai interrupt untuk tombol?**
Di Proteus, interrupt tidak didukung untuk komponen push-button. Di hardware
nyata, interrupt adalah solusi yang lebih baik — tapi untuk simulasi, sticky
latch adalah workaround yang elegan.

**Counter hold_count:**
Setiap siklus di mana tombol raw HIGH, counter naik 1. Counter ini digunakan
untuk menentukan durasi tekan. Di hardware nyata, counter bisa diganti dengan
timestamp difference (waktu sekarang - waktu pertama kali ditekan).

---

## BAGIAN 3 — MEMBACA DAN MEMAHAMI DATA

### 3.1 Format CSV Output

Setiap baris output memiliki 6 kolom:
```
iter  temp  press  vib  latency_us  status
```

| Kolom | Arti | Contoh |
|-------|------|--------|
| iter | Nomor iterasi | 4, 5, 6... |
| temp | Suhu (°C) | 25 (normal), 99 (fault) |
| press | Tekanan (hPa) | 1013 (normal), 0 (CRITICAL) |
| vib | Vibrasi | 5 (normal), 9999 (fault) |
| latency_us | Latensi deteksi→aktuator (µs) | 45 |
| status | Status sistem | FAULT_DETECTED, LOCKOUT_ACTIVE, dll |

### 3.2 Cara Membuktikan Adaptive Lockout dari Data

**MINOR (baris 4-9):**
```
4  99 1013 9999 45 FAULT_DETECTED(MINOR,2/3)     ← fault di iter 4
5  99 1013 9999 0  LOCKOUT_ACTIVE(400ms)          ← lockout mulai
6  99 1013 9999 0  LOCKOUT_ACTIVE(300ms)
7  99 1013 9999 0  LOCKOUT_ACTIVE(200ms)
8  99 1013 9999 0  LOCKOUT_ACTIVE(100ms)
9  99 1013 9999 0  LOCKOUT_CLEARED                ← clear di iter 9
```

Dari iter 4 ke iter 9 = 5 iterasi × 100ms = **500ms**. TERBUKTI.

**CRITICAL (baris 107-127):**
```
107 99 0 9999 45 FAULT_DETECTED(CRITICAL,3/3)    ← fault di iter 107
108 99 0 9999 0  LOCKOUT_ACTIVE(1900ms)           ← lockout mulai
...
126 99 0 9999 0  LOCKOUT_ACTIVE(100ms)
127 99 0 9999 0  LOCKOUT_CLEARED                  ← clear di iter 127
```

Dari iter 107 ke iter 127 = 20 iterasi × 100ms = **2000ms**. TERBUKTI.

**Perbedaan pressure:**
- MINOR: press = 1013 (NORMAL)
- CRITICAL: press = 0 (ANOMALI — sensor tekanan gagal total)

Ini adalah BUKTI bahwa sistem membedakan severity berdasarkan jumlah sensor
anomali. Bukan klaim kosong — ada di data mentah.

### 3.3 Memahami GNUPlot

**Panel 1 — Multi-Sensor Readings:**
Garis KUNING = suhu. Garis HIJAU = vibrasi/100. Garis putus MERAH = threshold.
Spike tajam = tombol ditekan. Perhatikan: suhu selalu spike bersamaan dengan
vibrasi — ini karena tombol menginjeksi keduanya sekaligus.

**Panel 2 — Recovery Latency:**
Garis BIRU = latensi dalam mikrodetik. Semua fault punya latensi 45µs —
KONSISTEN. Ini overhead MicroPython interpreter. Di Rust bare-metal,
diprediksi < 5µs karena TIMG0 punya resolusi 12.5 nanodetik.

**Panel 3 — Status Timeline:**
Sumbu Y: 0=NORMAL, 1=FAULT, 2=LOCKOUT, 3=CLEARED. Pola berulang yang SAMA
setiap kali tombol ditekan = sistem deterministik. Tidak ada random behavior.

**Voting Heatmap:**
Tiga baris = tiga sensor. Baris atas: suhu. Tengah: tekanan. Bawah: vibrasi.
MERAH = anomali. BIRU = normal. Perhatikan: tekanan (baris tengah) HANYA merah
saat CRITICAL. Ini bukti visual bahwa CRITICAL menginjeksi 3 sensor.

**Method Comparison:**
Radar/spider chart membandingkan 6 dimensi. Metode kami selalu di outer ring
(nilai tertinggi) di semua dimensi. Artinya kami UNGGUL di memory safety,
concurrency, sensor fusion, fail-safe, latency, dan dokumentasi.

---

## BAGIAN 4 — PERTANYAAN DOSEN & JAWABAN

### Q1: "Kenapa pakai Rust? Apa salahnya C/C++?"

**Jawaban:**
C/C++ tidak punya memory safety guarantee di level compiler. Programmer
bertanggung jawab penuh atas alokasi memori, pointer, dan concurrency.
Akibatnya: 186 CVE ditemukan bahkan di Rust UNSAFE code saja. Di sistem
safety-critical, bug memory bisa berakibat fatal.

Rust menjamin memory safety TANPA garbage collector — melalui sistem ownership
yang diperiksa saat compile. Kalau ada potensi bug, kode tidak akan compile.
Ini seperti punya asisten yang memeriksa setiap baris kode sebelum dijalankan.

Rust juga zero-cost abstraction — performanya setara C. Dibuktikan oleh
Plauska & Liutkevičius (2023) yang membenchmark Rust vs C di ESP32.

### Q2: "Kenapa voting ≥2/3? Kenapa tidak 3/3?"

**Jawaban:**
Karena kita ingin TOLERANSI SATU SENSOR GAGAL. Kalau threshold 3/3, begitu
satu sensor rusak, sistem tidak akan pernah mendeteksi fault lagi (maksimal
hanya 2 sensor yang tersisa). Justru berbahaya.

Dengan threshold 2/3:
- 1 sensor rusak → masih bisa deteksi fault (asalkan 2 lainnya anomali)
- 2 sensor rusak → tetap deteksi fault (mayoritas)
- Ini adalah prinsip redundancy di safety engineering.

### Q3: "Apakah sistem ini real-time?"

**Jawaban:**
Sistem ini SOFT real-time. Polling interval 100ms, latensi deteksi ke aktuator
45µs (di MicroPython). Di Rust bare-metal, diprediksi < 5µs.

Untuk HARD real-time, butuh interrupt-driven architecture dengan jaminan
worst-case execution time (WCET). Itu adalah arah pengembangan selanjutnya.

### Q4: "Kenapa simulasi pakai MicroPython, bukan Rust langsung?"

**Jawaban:**
Proteus VSM mendukung MicroPython untuk ESP32-S3, tapi tidak mendukung
Rust bare-metal secara langsung. Port MicroPython adalah behavioral equivalent
— logika voting, lockout, dan hold-duration SAMA persis dengan kode Rust.

Kode Rust sudah dicek kompilasinya (cargo check 0 error 0 warning) dan
binary-nya tersedia di GitHub. Siap di-flash ke hardware nyata.

### Q5: "Dari mana nilai threshold 80°C, 500, 900-1200?"

**Jawaban:**
Nilai-nilai ini adalah representative value untuk mendemonstrasikan konsep.
Di aplikasi nyata, threshold ditentukan oleh:
- Spesifikasi peralatan industri
- Safety analysis (HAZOP, LOPA)
- Regulatory requirements

Yang penting adalah MEKANISME-nya — voting, lockout, hold-duration — bukan
nilai threshold spesifiknya. Threshold bisa disesuaikan per aplikasi.

### Q6: "Apa kontribusi orisinal riset ini?"

**Jawaban:**
Belum ada penelitian yang mengintegrasikan:
(a) Rust bare-metal pada ESP32-S3,
(b) Mutex<RefCell<T>> + critical_section untuk concurrency,
(c) Voting-based 3-sensor fusion dengan majority quorum,
(d) Adaptive lockout berdasarkan fault severity,
(e) Hold-duration detection dengan sticky latch,
(f) Event-triggered architecture,

DALAM SATU SISTEM TERINTEGRASI.

Masing-masing komponen mungkin sudah ada di riset terpisah, tapi
KOMBINASINYA belum pernah dilakukan. Itu kontribusi kami.

### Q7: "Kenapa lockout 500ms dan 2000ms? Kenapa bukan 1 detik dan 3 detik?"

**Jawaban:**
Nilai spesifik bisa disesuaikan. Yang penting adalah KONSEP ADAPTIVE — durasi
lockout BERBEDA berdasarkan severity. Di dunia nyata, durasi ditentukan oleh:
- Process safety time (seberapa cepat sistem harus merespons)
- Valve actuation time (seberapa cepat valve bisa membuka/tutup)
- Process dynamics (seberapa cepat proses kembali stabil)

500ms dan 2000ms adalah nilai demonstrasi yang menunjukkan perbedaan 4× antara
MINOR dan CRITICAL. Di aplikasi nyata, nilai ini dikonfigurasi per plant.

---

## BAGIAN 5 — TIPS PRESENTASI

### Urutan bercerita yang efektif:

1. **BUKA dengan masalah:** "Apa yang terjadi kalau sistem kontrol valve gagal?"
2. **TUNJUKKAN celah riset:** "25 jurnal, tidak ada yang mengintegrasikan
   Rust + voting + lockout"
3. **JELASKAN solusi:** "Safe-Concurrency Multi-Sensor Fusion — tiga lapis
   keamanan"
4. **DEMONSTRASIKAN bukti:** "Ini data dari Proteus — lihat perbedaan MINOR
   dan CRITICAL"
5. **TUTUP dengan kontribusi:** "Kombinasi pertama dari keenam elemen ini"

### Cara menjelaskan teknis ke non-teknis:

- Ganti "Mutex<RefCell<T>>" → "mekanisme penguncian otomatis"
- Ganti "data race" → "konflik akses data bersamaan"
- Ganti "critical section" → "zona eksklusif — hanya satu yang boleh masuk"
- Ganti "voting quorum" → "keputusan berdasarkan suara terbanyak"

### Cara menjelaskan data:

- Jangan bilang "baris 4 sampai 9"
- Tapi: "Perhatikan, dari fault ke clear butuh 5 langkah. Setiap langkah 100ms.
  Jadi total 500ms. Bandingkan dengan yang ini — 20 langkah, 2000ms."

### Slide mana yang paling penting:

1. Slide 2 (Celah Riset) — buat dosen paham ini bukan proyek asal-asalan
2. Slide 9 (Perbandingan MINOR vs CRITICAL) — bukti utama adaptive lockout
3. Slide 7+8 (Skenario) — narasi "apa yang terjadi"

---

*Naskah ini dibuat sebagai bahan belajar mendalam. Baca, pahami, lalu jelaskan
dengan kata-kata sendiri. Jangan dihafal — dimengerti.*
