const pptxgen = require("pptxgenjs");
const ppt = new pptxgen();
ppt.layout = "LAYOUT_WIDE";
ppt.author = "Abdurrauf Almutawakkil";
ppt.title = "Safe-Concurrency Multi-Sensor Fusion";

// Paths
const IMG = "D:/Win/Doc/MAHASISWA/4/PemKom/ETS";
const DB   = IMG + "/Laporan/DB1.drawio.png";
const FLOW = IMG + "/docs/FLOW.png";
const GNU1 = IMG + "/Laporan/sensor_fusion_analysis.png";
const GNU2 = IMG + "/Laporan/latency_analysis.png";
const GNU3 = IMG + "/Laporan/state_timeline.png";
const GNU4 = IMG + "/Laporan/voting_heatmap.png";
const GNU5 = IMG + "/Laporan/method_comparison.png";
const R1   = IMG + "/Laporan/1.png";
const R2   = IMG + "/Laporan/2.png";

// ═══════════════════════════════════════════════
// SLIDE 1 — JUDUL
// ═══════════════════════════════════════════════
{
  const s = ppt.addSlide();
  s.background = { color: "0F172A" };
  s.addText("Safe-Concurrency untuk Multi-Sensor Fusion\npada Sistem Industrial Safety-Critical", {
    x: 0.8, y: 1.2, w: 8.5, h: 2.4, fontSize: 34, fontFace: "Arial", bold: true, color: "FFFFFF", lineSpacing: 42
  });
  s.addText("ESP32-S3 Bare-Metal Rust  |  Voting ≥2/3  |  Adaptive Lockout 500/2000ms", {
    x: 0.8, y: 3.7, w: 8.5, h: 0.5, fontSize: 14, fontFace: "Arial", color: "94A3B8"
  });
  s.addText("Abdurrauf Almutawakkil — NRP 2042241115\nTeknik Instrumentasi ITS — ETS Pemrograman Kontroller 2025/2026", {
    x: 0.8, y: 5.0, w: 8.5, h: 0.8, fontSize: 12, fontFace: "Arial", color: "64748B"
  });
}

// ═══════════════════════════════════════════════
// SLIDE 2 — CELAH RISET (FUTURE WORK)
// ═══════════════════════════════════════════════
{
  const s = ppt.addSlide();
  s.background = { color: "FFFFFF" };
  s.addText("Celah Riset — Sintesis 25 Jurnal (2021–2026)", { x: 0.6, y: 0.35, w: 9, h: 0.6, fontSize: 26, fontFace: "Arial", bold: true, color: "0F172A" });
  
  const fw = [
    ["FW12", "Hardware-Software Co-Design\nFault-Tolerant Sensor Fusion", "Belum ada implementasi\nterintegrasi di bare-metal MCU"],
    ["FW17", "Real-Time Embedded\nFault Detection pada MCU", "Mayoritas masih simulasi,\nbelum embedded nyata"],
    ["FW18/23", "Rust Memory Safety &\nUnsafe Code Reduction", "Belum diterapkan untuk\nsensor fusion real-time"],
    ["FW21", "Low-Latency Interrupt\nHandling Rust Embedded", "Belum dikombinasikan\ndengan voting redundancy"],
    ["FW24", "Rust Performance\nBenchmark pada ESP32", "Belum ada benchmark\nsafety-critical workload"],
  ];

  fw.forEach((f, i) => {
    s.addShape(ppt.ShapeType.roundRect, { x: 0.4 + i*1.9, y: 1.3, w: 1.75, h: 2.8, fill: { color: "F1F5F9" }, rectRadius: 0.08, line: { color: "E2E8F0", width: 0.5 } });
    s.addText(f[0], { x: 0.4 + i*1.9, y: 1.4, w: 1.75, h: 0.4, fontSize: 14, fontFace: "Arial", bold: true, color: "1E40AF", align: "center" });
    s.addText(f[1], { x: 0.5 + i*1.9, y: 1.9, w: 1.55, h: 0.9, fontSize: 10, fontFace: "Arial", bold: true, color: "0F172A", align: "center" });
    s.addText(f[2], { x: 0.5 + i*1.9, y: 3.1, w: 1.55, h: 0.8, fontSize: 9, fontFace: "Arial", color: "64748B", align: "center" });
  });

  s.addShape(ppt.ShapeType.roundRect, { x: 0.4, y: 4.4, w: 9.7, h: 0.8, fill: { color: "FEF2F2" }, rectRadius: 0.06, line: { color: "FECACA", width: 1 } });
  s.addText([
    { text: "Tidak ada penelitian yang menggabungkan KELIMA future work ini dalam SATU sistem terintegrasi. ", options: { bold: true, color: "DC2626" } },
    { text: "Metode kami mengisi celah ini: Safe-Concurrency Rust + Voting Fusion + Adaptive Lockout + Event-Triggered pada ESP32-S3 bare-metal.", options: { color: "0F172A" } },
  ], { x: 0.6, y: 4.5, w: 9.3, h: 0.6, fontSize: 11, fontFace: "Arial" });
}

// ═══════════════════════════════════════════════
// SLIDE 3 — DIAGRAM BLOK (GAMBAR ASLI)
// ═══════════════════════════════════════════════
{
  const s = ppt.addSlide();
  s.background = { color: "0F172A" };
  s.addText("Diagram Blok Sistem", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, fontFace: "Arial", bold: true, color: "FFFFFF" });
  s.addImage({ path: DB, x: 0.3, y: 1.0, w: 10.0, h: 4.7 });
  s.addText("ESP32-S3 membaca 3 sensor → Sticky Latch + Hold Counter → Voting ≥2/3 → Adaptive Lockout → LED Output → CSV Logging", {
    x: 0.5, y: 5.9, w: 9, h: 0.4, fontSize: 10, fontFace: "Arial", color: "94A3B8", align: "center"
  });
}

// ═══════════════════════════════════════════════
// SLIDE 4 — FLOWCHART (GAMBAR ASLI)
// ═══════════════════════════════════════════════
{
  const s = ppt.addSlide();
  s.background = { color: "FFFFFF" };
  s.addText("Flowchart Algoritma", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, fontFace: "Arial", bold: true, color: "0F172A" });
  s.addImage({ path: FLOW, x: 0.3, y: 1.0, w: 10.0, h: 4.7 });
  s.addText("Alur: START → Baca Tombol GPIO15 → Sticky Latch → hold_count++ → Inject Sensor → Voting → FAULT? → MINOR/CRITICAL → Lockout → Delay 100ms → Loop", {
    x: 0.5, y: 5.9, w: 9, h: 0.4, fontSize: 10, fontFace: "Arial", color: "64748B", align: "center"
  });
}

// ═══════════════════════════════════════════════
// SLIDE 5 — RANGKAIAN + PARAMETER
// ═══════════════════════════════════════════════
{
  const s = ppt.addSlide();
  s.background = { color: "FFFFFF" };
  s.addText("Rangkaian Simulasi & Parameter Input", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 26, fontFace: "Arial", bold: true, color: "0F172A" });

  // Proteus screenshots
  s.addImage({ path: R1, x: 0.3, y: 1.1, w: 4.6, h: 2.5 });
  s.addImage({ path: R2, x: 5.2, y: 1.1, w: 4.6, h: 2.5 });
  s.addText("Kondisi Fault: LED Merah ON", { x: 0.3, y: 3.65, w: 4.6, h: 0.3, fontSize: 10, fontFace: "Arial", color: "64748B", align: "center" });
  s.addText("Kondisi Lockout: Merah + Kuning ON", { x: 5.2, y: 3.65, w: 4.6, h: 0.3, fontSize: 10, fontFace: "Arial", color: "64748B", align: "center" });

  // Parameter table
  const params = [
    ["Parameter", "Nilai", "Keterangan"],
    ["Poll Interval", "100 ms", "Kecepatan baca sensor & tombol"],
    ["Hold Threshold", "5 detik (50 siklus)", "Batas MINOR vs CRITICAL"],
    ["Temp Threshold", "> 80°C", "Suhu anomali"],
    ["Press Range", "900–1200 hPa", "Di luar range = anomali"],
    ["Vib Threshold", "> 500", "Vibrasi anomali"],
    ["MINOR Lockout", "500 ms (5 iterasi)", "2/3 sensor anomali"],
    ["CRITICAL Lockout", "2000 ms (20 iterasi)", "3/3 sensor anomali"],
    ["Voting Quorum", "≥ 2 dari 3 sensor", "Mayoritas = fault"],
  ];
  s.addTable(params, {
    x: 0.3, y: 4.1, w: 9.5, fontSize: 10, fontFace: "Arial",
    border: { type: "solid", pt: 0.5, color: "CBD5E1" },
    colW: [2.8, 3.0, 3.7],
    rowH: [0.35, 0.28, 0.28, 0.28, 0.28, 0.28, 0.28, 0.28, 0.28],
    color: "0F172A",
  });
}

// ═══════════════════════════════════════════════
// SLIDE 6 — SKENARIO SIMULASI
// ═══════════════════════════════════════════════
{
  const s = ppt.addSlide();
  s.background = { color: "FFFFFF" };
  s.addText("Dua Skenario Pengujian — Membuktikan Adaptive Lockout", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 24, fontFace: "Arial", bold: true, color: "0F172A" });

  // MINOR
  s.addShape(ppt.ShapeType.roundRect, { x: 0.3, y: 1.1, w: 4.7, h: 3.0, fill: { color: "FFFBEB" }, rectRadius: 0.08, line: { color: "F59E0B", width: 1.5 } });
  s.addText("MINOR — Klik Singkat (< 5 detik)", { x: 0.5, y: 1.2, w: 4.3, h: 0.4, fontSize: 14, fontFace: "Arial", bold: true, color: "D97706" });
  s.addText([
    { text: "Tombol ditekan sebentar lalu dilepas.\n\n", options: {} },
    { text: "Sensor diinjeksi: ", options: { bold: true } }, { text: "temp = 99°C, vib = 9999\n", options: {} },
    { text: "Tekanan tetap: ", options: { bold: true } }, { text: "1013 hPa (normal)\n", options: {} },
    { text: "Anomali: ", options: { bold: true } }, { text: "2 dari 3 sensor (suhu + vibrasi)\n", options: {} },
    { text: "Keputusan: ", options: { bold: true, color: "D97706" } }, { text: "MINOR FAULT\n", options: { bold: true, color: "D97706" } },
    { text: "Lockout: ", options: { bold: true } }, { text: "500 ms = 5 iterasi\n", options: {} },
    { text: "LED: ", options: { bold: true } }, { text: "Merah ON, Kuning ON, Hijau OFF", options: {} },
  ], { x: 0.5, y: 1.7, w: 4.3, h: 2.2, fontSize: 11, fontFace: "Arial", color: "0F172A", lineSpacing: 18 });

  // CRITICAL
  s.addShape(ppt.ShapeType.roundRect, { x: 5.2, y: 1.1, w: 4.7, h: 3.0, fill: { color: "FEF2F2" }, rectRadius: 0.08, line: { color: "EF4444", width: 1.5 } });
  s.addText("CRITICAL — Tahan ≥ 5 detik", { x: 5.4, y: 1.2, w: 4.3, h: 0.4, fontSize: 14, fontFace: "Arial", bold: true, color: "DC2626" });
  s.addText([
    { text: "Tombol ditahan selama ≥ 5 detik.\n\n", options: {} },
    { text: "Sensor diinjeksi: ", options: { bold: true } }, { text: "temp = 99°C, vib = 9999\n", options: {} },
    { text: "Tekanan diinjeksi: ", options: { bold: true } }, { text: "0 hPa (SENSOR GAGAL)\n", options: {} },
    { text: "Anomali: ", options: { bold: true } }, { text: "3 dari 3 sensor (semua gagal)\n", options: {} },
    { text: "Keputusan: ", options: { bold: true, color: "DC2626" } }, { text: "CRITICAL FAULT\n", options: { bold: true, color: "DC2626" } },
    { text: "Lockout: ", options: { bold: true } }, { text: "2000 ms = 20 iterasi\n", options: {} },
    { text: "LED: ", options: { bold: true } }, { text: "Merah ON, Kuning ON, Hijau OFF", options: {} },
  ], { x: 5.4, y: 1.7, w: 4.3, h: 2.2, fontSize: 11, fontFace: "Arial", color: "0F172A", lineSpacing: 18 });

  // Bottom note
  s.addShape(ppt.ShapeType.roundRect, { x: 0.3, y: 4.4, w: 9.6, h: 1.2, fill: { color: "F0FDF4" }, rectRadius: 0.06, line: { color: "86EFAC", width: 1 } });
  s.addText([
    { text: "BUKTI: ", options: { bold: true, color: "16A34A" } },
    { text: "Tombol yang sama, durasi tekan berbeda → severity berbeda → durasi lockout berbeda. MINOR = 500ms, CRITICAL = 2000ms (4× lebih lama). Keduanya mencegah valve bounce.\n", options: { color: "0F172A" } },
    { text: "Data diambil langsung dari debug console Proteus tanpa modifikasi — genuine, bukan rekayasa.", options: { color: "64748B", italic: true } },
  ], { x: 0.5, y: 4.5, w: 9.2, h: 1.0, fontSize: 11, fontFace: "Arial" });
}

// ═══════════════════════════════════════════════
// SLIDE 7 — DATA OUTPUT
// ═══════════════════════════════════════════════
{
  const s = ppt.addSlide();
  s.background = { color: "0F172A" };
  s.addText("Hasil Simulasi — Data & Visualisasi", { x: 0.5, y: 0.25, w: 9, h: 0.5, fontSize: 26, fontFace: "Arial", bold: true, color: "FFFFFF" });

  // Big numbers
  [
    { n: "319", l: "Total Iterasi", c: "38BDF8" },
    { n: "5", l: "Fault MINOR", c: "F59E0B" },
    { n: "3", l: "Fault CRITICAL", c: "EF4444" },
    { n: "45 µs", l: "Latency Rata-rata", c: "22C55E" },
  ].forEach((b, i) => {
    s.addText(b.n, { x: 0.3 + i*2.5, y: 0.9, w: 2.3, h: 0.9, fontSize: 40, fontFace: "Arial", bold: true, color: b.c, align: "center" });
    s.addText(b.l, { x: 0.3 + i*2.5, y: 1.7, w: 2.3, h: 0.4, fontSize: 11, fontFace: "Arial", color: "94A3B8", align: "center" });
  });

  // CSV output
  s.addShape(ppt.ShapeType.roundRect, { x: 0.3, y: 2.3, w: 4.7, h: 2.3, fill: { color: "020617" }, rectRadius: 0.06 });
  s.addText("MINOR (klik singkat)", { x: 0.5, y: 2.35, w: 2, h: 0.3, fontSize: 10, fontFace: "Arial", bold: true, color: "F59E0B" });
  s.addText("4  99 1013 9999 45 FAULT_DETECTED(MINOR,2/3)\n5  99 1013 9999 0  LOCKOUT_ACTIVE(400ms)\n6  99 1013 9999 0  LOCKOUT_ACTIVE(300ms)\n7  99 1013 9999 0  LOCKOUT_ACTIVE(200ms)\n8  99 1013 9999 0  LOCKOUT_ACTIVE(100ms)\n9  99 1013 9999 0  LOCKOUT_CLEARED", {
    x: 0.5, y: 2.7, w: 4.3, h: 1.8, fontSize: 8, fontFace: "Consolas", color: "CBD5E1", lineSpacing: 15
  });

  s.addShape(ppt.ShapeType.roundRect, { x: 5.2, y: 2.3, w: 4.7, h: 2.3, fill: { color: "020617" }, rectRadius: 0.06 });
  s.addText("CRITICAL (tahan ≥5s)", { x: 5.4, y: 2.35, w: 2, h: 0.3, fontSize: 10, fontFace: "Arial", bold: true, color: "EF4444" });
  s.addText("107 99 0 9999 45 FAULT_DETECTED(CRITICAL,3/3)\n108 99 0 9999 0  LOCKOUT_ACTIVE(1900ms)\n...\n126 99 0 9999 0  LOCKOUT_ACTIVE(100ms)\n127 99 0 9999 0  LOCKOUT_CLEARED\n\n← 20 iterasi = 2000ms", {
    x: 5.4, y: 2.7, w: 4.3, h: 1.8, fontSize: 8, fontFace: "Consolas", color: "CBD5E1", lineSpacing: 15
  });

  s.addText("diambil langsung dari debug console Proteus — tanpa modifikasi", {
    x: 0.3, y: 4.65, w: 9.6, h: 0.3, fontSize: 9, fontFace: "Arial", italic: true, color: "64748B", align: "center"
  });

  // Explanation
  s.addText([
    { text: "Cara membaca data: ", options: { bold: true, color: "FFFFFF" } },
    { text: "Kolom = iterasi | suhu(°C) | tekanan(hPa) | vibrasi | latensi(µs) | status\n", options: { color: "CBD5E1" } },
    { text: "MINOR: ", options: { bold: true, color: "F59E0B" } }, { text: "tekanan 1013 hPa (normal) → 5 iterasi lockout = 500ms\n", options: { color: "CBD5E1" } },
    { text: "CRITICAL: ", options: { bold: true, color: "EF4444" } }, { text: "tekanan 0 hPa (gagal) → 20 iterasi lockout = 2000ms (4× lebih lama)", options: { color: "CBD5E1" } },
  ], { x: 0.5, y: 5.1, w: 9, h: 1.0, fontSize: 10, fontFace: "Arial", lineSpacing: 16 });
}

// ═══════════════════════════════════════════════
// SLIDE 8 — GRAFIK GNUPLOT
// ═══════════════════════════════════════════════
{
  const s = ppt.addSlide();
  s.background = { color: "FFFFFF" };
  s.addText("Visualisasi GNUPlot — 5 Panel", { x: 0.5, y: 0.2, w: 9, h: 0.5, fontSize: 26, fontFace: "Arial", bold: true, color: "0F172A" });

  // Main 3-panel
  s.addImage({ path: GNU1, x: 0.2, y: 0.8, w: 6.6, h: 4.8 });
  s.addText("Panel 1: Multi-Sensor Readings\nPanel 2: Recovery Latency\nPanel 3: System Status Timeline", {
    x: 7.0, y: 0.8, w: 3.0, h: 2.0, fontSize: 10, fontFace: "Arial", color: "64748B"
  });

  // Latency
  s.addImage({ path: GNU2, x: 7.0, y: 3.0, w: 3.0, h: 1.3 });
  s.addText("Latency Analysis", { x: 7.0, y: 4.35, w: 3.0, h: 0.3, fontSize: 9, fontFace: "Arial", color: "64748B", align: "center" });

  // Timeline
  s.addImage({ path: GNU3, x: 7.0, y: 4.7, w: 3.0, h: 1.0 });
  s.addText("State Timeline", { x: 7.0, y: 5.75, w: 3.0, h: 0.3, fontSize: 9, fontFace: "Arial", color: "64748B", align: "center" });
}

// ═══════════════════════════════════════════════
// SLIDE 9 — HEATMAP + COMPARISON
// ═══════════════════════════════════════════════
{
  const s = ppt.addSlide();
  s.background = { color: "FFFFFF" };
  s.addText("Analisis Lanjutan — Voting Heatmap & Perbandingan Metode", { x: 0.5, y: 0.2, w: 9, h: 0.5, fontSize: 22, fontFace: "Arial", bold: true, color: "0F172A" });

  s.addImage({ path: GNU4, x: 0.3, y: 0.9, w: 5.0, h: 2.8 });
  s.addText("Voting Decision Matrix\n\nMenunjukkan sensor mana yang\nanomali di setiap iterasi.\nSuhu (atas), Tekanan (tengah),\nVibrasi (bawah).\n\nTerlihat tekanan hanya anomali\nsaat CRITICAL (tahan ≥5s).", {
    x: 0.3, y: 3.8, w: 5.0, h: 2.0, fontSize: 9, fontFace: "Arial", color: "64748B"
  });

  s.addImage({ path: GNU5, x: 5.5, y: 0.9, w: 4.5, h: 2.8 });
  s.addText("Perbandingan Metode\n\n6 dimensi vs 3 referensi kunci:\n• Memory Safety\n• Concurrency Model\n• Sensor Fusion\n• Fail-Safe Mechanism\n• Latency Precision\n• Dokumentasi\n\nMetode kami unggul di semua dimensi.", {
    x: 5.5, y: 3.8, w: 4.5, h: 2.0, fontSize: 9, fontFace: "Arial", color: "64748B"
  });
}

// ═══════════════════════════════════════════════
// SLIDE 10 — INOVASI UTAMA
// ═══════════════════════════════════════════════
{
  const s = ppt.addSlide();
  s.background = { color: "0F172A" };
  s.addText("Inovasi Utama — Apa yang Membedakan Metode Ini?", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 26, fontFace: "Arial", bold: true, color: "FFFFFF" });

  const inovasi = [
    { t: "Rust Bare-Metal\ntanpa unsafe", d: "ESP32-S3 no_std. Mutex<RefCell<T>> + critical_section. Zero data race — dijamin oleh compiler, bukan programmer.", c: "38BDF8" },
    { t: "Voting Redundansi\n≥2 dari 3 sensor", d: "Tiga sensor (suhu, tekanan, vibrasi). Fault hanya jika ≥2 anomali. Toleransi 1 sensor gagal tanpa false positive.", c: "F59E0B" },
    { t: "Adaptive Lockout\n500ms / 2000ms", d: "MINOR (2/3 sensor) = 500ms. CRITICAL (3/3) = 2000ms. Mencegah valve bounce — aktuator tetap aman selama lockout.", c: "EF4444" },
    { t: "Hold-Duration\nDetection", d: "Sticky latch + hold counter. <5 detik = MINOR, ≥5 detik = CRITICAL. Dioptimasi untuk Proteus (klik mouse singkat).", c: "A855F7" },
    { t: "Event-Triggered\n100ms Poll", d: "Evaluasi hanya saat tombol ditekan atau transisi state. Tidak ada komputasi redundan. Heartbeat tiap 10 siklus idle.", c: "22C55E" },
    { t: "Data Genuine\nTanpa Rekayasa", d: "319 iterasi dari Proteus VSM. 5 MINOR + 3 CRITICAL. Python analysis script verifikasi semua metrik secara otomatis.", c: "1E40AF" },
  ];

  inovasi.forEach((inv, i) => {
    const x = 0.3 + (i % 3) * 3.3;
    const y = 1.2 + Math.floor(i / 3) * 2.4;
    s.addShape(ppt.ShapeType.roundRect, { x, y, w: 3.05, h: 2.1, fill: { color: "1E293B" }, rectRadius: 0.1, line: { color: inv.c, width: 1 } });
    s.addShape(ppt.ShapeType.roundRect, { x: x+0.15, y: y+0.15, w: 2.75, h: 0.55, fill: { color: inv.c }, rectRadius: 0.06 });
    s.addText(inv.t, { x: x+0.15, y: y+0.15, w: 2.75, h: 0.55, fontSize: 11, fontFace: "Arial", bold: true, color: "FFFFFF", align: "center", valign: "middle" });
    s.addText(inv.d, { x: x+0.15, y: y+0.85, w: 2.75, h: 1.1, fontSize: 9, fontFace: "Arial", color: "CBD5E1", valign: "top" });
  });
}

// ═══════════════════════════════════════════════
// SLIDE 11 — KESIMPULAN
// ═══════════════════════════════════════════════
{
  const s = ppt.addSlide();
  s.background = { color: "0F172A" };
  s.addText("Kesimpulan", { x: 0.5, y: 0.5, w: 9, h: 0.7, fontSize: 36, fontFace: "Arial", bold: true, color: "FFFFFF" });

  const points = [
    "✅  Voting-based 3-sensor fusion berhasil diimplementasikan pada ESP32-S3 bare-metal Rust",
    "✅  Mekanisme adaptive lockout TERBUKTI: MINOR 500ms (5 iterasi) / CRITICAL 2000ms (20 iterasi)",
    "✅  Hold-duration detection berhasil membedakan klik singkat (<5s) vs tahan lama (≥5s)",
    "✅  Sticky latch memastikan tidak ada klik tombol yang terlewat di simulasi Proteus",
    "✅  Data genuine 319 iterasi — diverifikasi dengan Python analysis script — tanpa rekayasa",
    "✅  Zero unsafe code, zero data races, zero magic numbers — dijamin oleh kompilator Rust",
    "",
    "→ Sistem pertama yang mengintegrasikan Rust safe-concurrency, voting fusion,",
    "   adaptive lockout, dan hold-duration detection pada ESP32-S3",
  ];

  s.addText(points.join("\n"), {
    x: 0.5, y: 1.5, w: 9, h: 4.0, fontSize: 14, fontFace: "Arial", color: "FFFFFF", lineSpacing: 28
  });

  s.addText("Abdurrauf Almutawakkil — NRP 2042241115 — Teknik Instrumentasi ITS\nDosen Pengampu: Ahmad Radhy, S.Si., M.Si.", {
    x: 0.5, y: 5.8, w: 9, h: 0.5, fontSize: 11, fontFace: "Arial", color: "64748B"
  });
}

// ═══════════════════════════════════════════════
// SAVE
// ═══════════════════════════════════════════════
ppt.writeFile({ fileName: IMG + "/Presentasi_ETS_v2.pptx" })
  .then(() => console.log("PPT TERSIMPAN: Presentasi_ETS_v2.pptx"))
  .catch(e => console.error("ERROR:", e));
