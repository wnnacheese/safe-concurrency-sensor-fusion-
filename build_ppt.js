const pptxgen = require("pptxgenjs");
const ppt = new pptxgen();
ppt.layout = "LAYOUT_WIDE";
ppt.author = "Abdurrauf Almutawakkil";
ppt.title = "Safe-Concurrency Multi-Sensor Fusion";

const B = "D:/Win/Doc/MAHASISWA/4/PemKom/ETS";
const img = (p) => B + p;

// ═══════════════════════════════════ SLIDE 1 — JUDUL ═══════════
{
  const s = ppt.addSlide();
  s.background = { color: "0F172A" };
  s.addText("Safe-Concurrency untuk Multi-Sensor Fusion\npada Sistem Industrial Safety-Critical", {
    x: 0.8, y: 1.0, w: 8.5, h: 2.6, fontSize: 36, fontFace: "Arial", bold: true, color: "FFFFFF", lineSpacing: 44
  });
  s.addShape(ppt.ShapeType.rect, { x: 0.8, y: 3.7, w: 3.0, h: 0.04, fill: { color: "38BDF8" } });
  s.addText([
    { text: "ESP32-S3 Bare-Metal Rust  |  Voting ≥2/3  |  Adaptive Lockout 500/2000ms\n", options: { color: "94A3B8", fontSize: 14 } },
    { text: "Evaluasi Tengah Semester — Pemrograman Kontroller\n", options: { color: "64748B", fontSize: 12 } },
    { text: "Abdurrauf Almutawakkil — NRP 2042241115 — Teknik Instrumentasi ITS\nDosen Pengampu: Ahmad Radhy, S.Si., M.Si.", options: { color: "475569", fontSize: 11 } },
  ], { x: 0.8, y: 4.0, w: 8.5, h: 1.8, fontFace: "Arial", lineSpacing: 22 });
}

// ═══════════════════════════════════ SLIDE 2 — CELAH RISET ═════
{
  const s = ppt.addSlide();
  s.background = { color: "FFFFFF" };
  s.addText("Latar Belakang — Apa yang Sudah Diteliti & Di Mana Celahnya?", { x: 0.5, y: 0.2, w: 9.5, h: 0.55, fontSize: 22, fontFace: "Arial", bold: true, color: "0F172A" });
  s.addText("Berdasarkan 25 jurnal Scopus/WoS (2021–2026), kami mengidentifikasi 5 area future work yang belum terselesaikan:", {
    x: 0.5, y: 0.75, w: 9.5, h: 0.35, fontSize: 11, fontFace: "Arial", color: "64748B"
  });
  const fw = [
    { id:"FW12",t:"HW-SW Co-Design\nFault-Tolerant Fusion",ref:"Matos et al. (2024) — Survey kegagalan sensor pada autonomous vehicles",gap:"• Membahas taksonomi kegagalan sensor di AV\n• Mengusulkan fault-tolerant fusion hw-sw co-design\n• Kelemahan: Hanya usulan konseptual, belum ada\n  implementasi nyata di embedded MCU\n• Tidak ada mekanisme lockout atau voting redundancy",c:"3B82F6"},
    { id:"FW17",t:"Real-Time Embedded\nFault Detection",ref:"Bruneo & De Vita (2022) — Echo State Networks untuk fault detection",gap:"• Menggunakan Echo State Network (ESN) untuk\n  deteksi fault di edge\n• Future work: real-time embedded deployment\n  pada mikrokontroler\n• Kelemahan: ESN terlalu berat untuk bare-metal\n  MCU, butuh resource komputasi besar\n• Belum ada voting-based sensor fusion",c:"F59E0B"},
    { id:"FW18/23",t:"Rust Memory Safety\n& Unsafe Reduction",ref:"Xu et al. (2021) — 186 CVE memory-safety di Rust\nJiang et al. (2023) — Thetis static analysis",gap:"• Mengidentifikasi 5 pola bug memory-safety\n  di Rust unsafe code\n• Thetis mengurangi unsafe code surface area\n• Kelemahan: Belum diaplikasikan ke sistem\n  embedded real-time\n• Tidak ada implementasi sensor fusion dengan\n  Rust safety guarantees",c:"EF4444"},
    { id:"FW21",t:"Low-Latency Rust\nEmbedded OS",ref:"Radovici et al. (2022) — eBPF di Tock kernel, 3× faster interrupt",gap:"• Mencapai latensi interrupt 3× lebih cepat\n  dengan Rust+eBPF di Tock kernel\n• Future work: mengurangi overhead array iteration\n• Kelemahan: Fokus pada performa OS, bukan\n  pada fault detection\n• Tidak mengimplementasikan mekanisme\n  sensor fusion atau fail-safe actuator",c:"A855F7"},
    { id:"FW24",t:"Rust Performance\nvs C/C++ pada ESP32",ref:"Plauska & Liutkevičius (2023) — Benchmark Rust/C/MicroPython/TinyGo",gap:"• Membuktikan Rust memiliki performa kompetitif\n  vs C di ESP32\n• Future work: benchmark multi-threaded dan\n  async workloads\n• Kelemahan: Hanya benchmark sintetis, bukan\n  aplikasi safety-critical nyata\n• Tidak menguji Rust dalam konteks sensor\n  fusion atau fault tolerance",c:"22C55E"},
  ];
  fw.forEach((f,i)=>{
    const x=0.3+i*1.95;
    s.addShape(ppt.ShapeType.roundRect,{x,y:1.25,w:1.82,h:4.8,fill:{color:"F8FAFC"},rectRadius:0.06,line:{color:"E2E8F0",width:0.5}});
    s.addShape(ppt.ShapeType.roundRect,{x:x+0.1,y:1.35,w:1.62,h:0.4,fill:{color:f.c},rectRadius:0.04});
    s.addText(f.id,{x:x+0.1,y:1.35,w:1.62,h:0.4,fontSize:11,fontFace:"Arial",bold:true,color:"FFFFFF",align:"center",valign:"middle"});
    s.addText(f.t,{x:x+0.1,y:1.85,w:1.62,h:0.5,fontSize:8.5,fontFace:"Arial",bold:true,color:"0F172A",align:"center"});
    s.addText(f.ref,{x:x+0.1,y:2.4,w:1.62,h:0.5,fontSize:7,fontFace:"Arial",italic:true,color:"94A3B8",align:"center"});
    s.addShape(ppt.ShapeType.rect,{x:x+0.3,y:2.95,w:1.22,h:0.015,fill:{color:"E2E8F0"}});
    s.addText(f.gap,{x:x+0.1,y:3.05,w:1.62,h:2.9,fontSize:7.5,fontFace:"Arial",color:"334155",valign:"top",lineSpacing:13});
  });
  s.addShape(ppt.ShapeType.roundRect,{x:0.3,y:6.2,w:9.9,h:0.65,fill:{color:"FEF2F2"},rectRadius:0.05,line:{color:"FECACA",width:0.8}});
  s.addText([
    {text:"KESIMPULAN: ",options:{bold:true,color:"DC2626",fontSize:10}},
    {text:"Tidak ada penelitian yang menggabungkan Rust safe-concurrency + voting fusion + adaptive lockout + event-triggered pada bare-metal ESP32-S3. ",options:{color:"0F172A",fontSize:10}},
    {text:"Metode kami mengisi celah ini secara terintegrasi.",options:{color:"0F172A",fontSize:10}},
  ],{x:0.5,y:6.25,w:9.5,h:0.55,fontFace:"Arial",lineSpacing:14});
}

// ═══════════════════════════ SLIDE 3 — APA ITU RUST SAFE-CONCURRENCY ═══════
{
  const s = ppt.addSlide();
  s.background = { color: "FFFFFF" };
  s.addText("Apa Itu Rust Safe-Concurrency & Mengapa Penting?", { x: 0.5, y: 0.2, w: 9.5, h: 0.55, fontSize: 22, fontFace: "Arial", bold: true, color: "0F172A" });

  // Left column: What is it
  s.addShape(ppt.ShapeType.roundRect, { x: 0.3, y: 0.95, w: 5.0, h: 5.7, fill: { color: "F8FAFC" }, rectRadius: 0.08, line: { color: "E2E8F0", width: 0.5 } });
  s.addText("Konsep Safe-Concurrency dalam Rust", { x: 0.5, y: 1.05, w: 4.5, h: 0.4, fontSize: 14, fontFace: "Arial", bold: true, color: "0F172A" });
  s.addText([
    { text: "Rust adalah bahasa pemrograman sistem yang menjamin memory safety dan thread safety TANPA garbage collector. Ini dicapai melalui sistem OWNERSHIP dan BORROWING yang diperiksa saat kompilasi.\n\n", options: { color: "334155" } },
    { text: "Ownership Rules (3 aturan utama):\n", options: { bold: true, color: "0F172A" } },
    { text: "1. Setiap nilai di Rust memiliki SATU pemilik (owner).\n", options: { color: "334155" } },
    { text: "2. Hanya boleh ada SATU mutable reference ATAU\n    beberapa immutable reference — tidak bisa keduanya.\n", options: { color: "334155" } },
    { text: "3. References harus selalu valid (tidak boleh dangling).\n\n", options: { color: "334155" } },
    { text: "Apa yang dicegah oleh sistem ini?\n", options: { bold: true, color: "DC2626" } },
    { text: "• Data race — dua thread mengakses data bersamaan,\n   salah satunya menulis → TIDAK MUNGKIN di Rust\n", options: { color: "334155" } },
    { text: "• Use-after-free — memori sudah dibebaskan tapi\n   masih diakses → TIDAK MUNGKIN di Rust\n", options: { color: "334155" } },
    { text: "• Double-free — memori dibebaskan dua kali\n   → TIDAK MUNGKIN di Rust\n", options: { color: "334155" } },
    { text: "• Null pointer dereference — Rust tidak punya null\n\n", options: { color: "334155" } },
    { text: "Semua dicek saat KOMPILASI, bukan saat runtime.\nTidak perlu garbage collector, tidak perlu runtime overhead.", options: { bold: true, color: "1E40AF" } },
  ], { x: 0.5, y: 1.5, w: 4.5, h: 5.0, fontSize: 9.5, fontFace: "Arial", lineSpacing: 14, valign: "top" });

  // Right column: How we use it
  s.addShape(ppt.ShapeType.roundRect, { x: 5.5, y: 0.95, w: 5.0, h: 5.7, fill: { color: "EFF6FF" }, rectRadius: 0.08, line: { color: "3B82F6", width: 1 } });
  s.addText("Implementasi dalam Sistem Kami", { x: 5.7, y: 1.05, w: 4.5, h: 0.4, fontSize: 14, fontFace: "Arial", bold: true, color: "1E40AF" });
  s.addText([
    { text: "Bagaimana safe-concurrency diterapkan di ESP32-S3:\n\n", options: { color: "334155" } },
    { text: "Mutex<RefCell<T>> + critical_section\n", options: { bold: true, color: "0F172A" } },
    { text: "• SystemState (suhu, tekanan, vibrasi, fault, lockout)\n   disimpan dalam Mutex<RefCell<SystemState>>\n", options: { color: "334155" } },
    { text: "• Setiap akses ke shared state dilakukan di dalam\n   blok critical_section::with()\n", options: { color: "334155" } },
    { text: "• Saat critical section aktif, SEMUA interrupt\n   dinonaktifkan → akses bersifat atomik\n", options: { color: "334155" } },
    { text: "• Compiler Rust MEMASTIKAN tidak ada data race\n   — jika ada potensi race, kode tidak akan compile.\n\n", options: { color: "334155" } },
    { text: "Perbandingan dengan C/C++ (embedded konvensional):\n", options: { bold: true, color: "DC2626" } },
    { text: "• C/C++: programmer harus manual lock/unlock mutex.\n   Salah urutan → deadlock. Lupa unlock → hang.\n", options: { color: "334155" } },
    { text: "• Rust: compiler yang menjamin lock/unlock benar.\n   Salah? Kode tidak akan compile.\n\n", options: { color: "334155" } },
    { text: "• C/C++: 186 CVE memory-safety ditemukan (Xu 2021).\n   Rust: zero CVE untuk safe code.\n\n", options: { color: "334155" } },
    { text: "Untuk sistem safety-critical seperti valve kontrol\nindustri, jaminan ini KRUSIAL — kesalahan software\nbisa berakibat fatal pada keselamatan manusia.", options: { bold: true, color: "DC2626" } },
  ], { x: 5.7, y: 1.5, w: 4.5, h: 5.0, fontSize: 9.5, fontFace: "Arial", lineSpacing: 14, valign: "top" });
}

// ═══════════════════════════════════ SLIDE 4 — METODE ═════════
{
  const s = ppt.addSlide();
  s.background = { color: "FFFFFF" };
  s.addText("Metode yang Diusulkan — Safe-Concurrency Multi-Sensor Fusion", { x: 0.5, y: 0.2, w: 9.5, h: 0.55, fontSize: 22, fontFace: "Arial", bold: true, color: "0F172A" });
  s.addText("Sistem membaca 3 sensor (suhu, tekanan, vibrasi) → voting ≥2/3 → adaptive lockout → aktuator fail-safe. ESP32-S3 bare-metal Rust tanpa unsafe code.", {
    x: 0.5, y: 0.75, w: 9.5, h: 0.35, fontSize: 11, fontFace: "Arial", color: "64748B"
  });
  const methods = [
    {t:"Concurrency Model:\nMutex<RefCell<T>>",d:"Shared state ketiga sensor dilindungi Mutex<RefCell<T>> dengan critical_section. Setiap akses state bersifat atomik — interrupt dinonaktifkan sementara. Model ini menjamin data-race-free TANPA unsafe code. Berbeda dengan C/C++ yang mengandalkan mutex manual (rentan deadlock, priority inversion), Rust menjamin keamanan di waktu kompilasi.",c:"3B82F6"},
    {t:"Voting Redundansi:\n≥2 dari 3 Sensor",d:"evaluate_sensor_redundancy() menghitung jumlah sensor anomali. Threshold: suhu >80°C, tekanan <900 atau >1200 hPa, vibrasi >500. Jika ≥2 anomali → FAULT. Toleransi 1 sensor gagal — menghindari false positive. Berbeda dengan single-sensor yang langsung fault tanpa verifikasi silang.",c:"F59E0B"},
    {t:"Adaptive Lockout:\n500ms / 2000ms",d:"Dua tingkat severity. MINOR (2/3 sensor): lockout 500ms — redundansi masih ada. CRITICAL (3/3): lockout 2000ms — semua sensor gagal, butuh waktu lebih lama. Selama lockout, aktuator TETAP aman meskipun sensor normal → mencegah valve bounce.",c:"EF4444"},
    {t:"Hold-Duration\nDetection",d:"Tombol GPIO15 + pull-down 10kΩ. Sticky latch — begitu tombol HIGH, latch TRUE sampai fault terproses. Counter hold_count melacak durasi tekan. <5 detik = MINOR (2 sensor). ≥5 detik = CRITICAL (3 sensor + tekanan 0 hPa). Mengatasi timing Proteus (klik mouse milidetik).",c:"A855F7"},
  ];
  methods.forEach((m,i)=>{
    const x=0.3+(i%2)*5.0, y=1.3+Math.floor(i/2)*2.5;
    s.addShape(ppt.ShapeType.roundRect,{x,y,w:4.8,h:2.3,fill:{color:"F8FAFC"},rectRadius:0.08,line:{color:"E2E8F0",width:0.5}});
    s.addShape(ppt.ShapeType.rect,{x:x+0.1,y:y+0.1,w:0.05,h:2.1,fill:{color:m.c}});
    s.addText(m.t,{x:x+0.3,y:y+0.1,w:2.0,h:0.7,fontSize:11,fontFace:"Arial",bold:true,color:"0F172A",valign:"top"});
    s.addText(m.d,{x:x+0.3,y:y+0.9,w:4.3,h:1.3,fontSize:9.5,fontFace:"Arial",color:"334155",valign:"top",lineSpacing:15});
  });
}

// ═══════════════════════════════════ SLIDE 5 — DIAGRAM BLOK ═══
{
  const s = ppt.addSlide();
  s.background = { color: "0F172A" };
  s.addText("Diagram Blok Sistem", { x: 0.5, y: 0.15, w: 9, h: 0.5, fontSize: 26, fontFace: "Arial", bold: true, color: "FFFFFF" });
  s.addText("Aliran data: sensor → latch → voting → lockout → aktuator → logging", { x: 0.5, y: 0.6, w: 9, h: 0.3, fontSize: 11, fontFace: "Arial", color: "94A3B8" });
  s.addImage({ path: img("/Laporan/DB1.drawio.png"), x: 0.3, y: 1.0, w: 9.8, h: 4.2 });
  s.addText([
    { text: "Cara membaca diagram: ", options: { bold: true, color: "FFFFFF" } },
    { text: "3 sensor (kiri) → Sticky Latch + Hold Counter → Sensor Injection → Voting ≥2/3 → Adaptive Lockout → LED Output (kanan) → CSV Logging → Auto-Recovery\n", options: { color: "CBD5E1" } },
    { text: "State machine: NORMAL → FAULT_DETECTED → LOCKOUT (500/2000ms) → LOCKOUT_CLEARED → NORMAL (loop)", options: { color: "94A3B8" } },
  ], { x: 0.5, y: 5.4, w: 9.5, h: 0.9, fontSize: 10, fontFace: "Arial", lineSpacing: 16 });
}

// ═══════════════════════════════════ SLIDE 6 — FLOWCHART ═══════
{
  const s = ppt.addSlide();
  s.background = { color: "FFFFFF" };
  s.addText("Flowchart Algoritma — Alur Lengkap Sistem", { x: 0.5, y: 0.15, w: 9, h: 0.5, fontSize: 24, fontFace: "Arial", bold: true, color: "0F172A" });
  s.addImage({ path: img("/docs/FLOW.png"), x: 0.2, y: 0.75, w: 6.3, h: 5.2 });
  s.addShape(ppt.ShapeType.roundRect,{x:6.8,y:0.75,w:3.5,h:5.2,fill:{color:"F8FAFC"},rectRadius:0.08,line:{color:"E2E8F0",width:0.5}});
  s.addText("Penjelasan Alur:",{x:6.95,y:0.85,w:3.2,h:0.3,fontSize:12,fontFace:"Arial",bold:true,color:"0F172A"});
  s.addText([
    {text:"1. START → Baca Tombol GPIO15\n   Polling tiap 100ms\n\n",options:{}},
    {text:"2. Button HIGH?\n",options:{bold:true}},
    {text:"   YA → Sticky Latch = TRUE\n   hold_count++\n   Inject: temp=99, vib=9999\n\n",options:{color:"334155"}},
    {text:"3. hold_count ≥ 50?\n",options:{bold:true}},
    {text:"   YA (≥5s) → Inject press=0 (CRITICAL)\n   TIDAK → press tetap 1013 (MINOR)\n\n",options:{color:"334155"}},
    {text:"4. Baca Sensor State\n   temp, press, vib → Voting\n\n",options:{bold:true,color:"0F172A"}},
    {text:"5. Anomalies ≥ 2?\n",options:{bold:true,color:"DC2626"}},
    {text:"   YA → FAULT → Set Lockout\n   TIDAK → Cek Lockout > 0?\n     YA → Lanjut countdown\n     TIDAK → NORMAL\n\n",options:{color:"334155"}},
    {text:"6. Lockout Countdown\n   -100ms per iterasi\n   Selesai → CLEAR → Reset\n\n",options:{bold:true,color:"0F172A"}},
    {text:"7. DELAY 100ms → LOOP",options:{bold:true,color:"3B82F6"}},
  ],{x:6.95,y:1.2,w:3.2,h:4.6,fontSize:8,fontFace:"Arial",color:"0F172A",lineSpacing:14,valign:"top"});
}

// ═══════════════════════════════════ SLIDE 7 — RANGKAIAN ══════
{
  const s = ppt.addSlide();
  s.background = { color: "FFFFFF" };
  s.addText("Rangkaian Simulasi — Proteus 9.00 VSM", { x: 0.5, y: 0.15, w: 9, h: 0.5, fontSize: 24, fontFace: "Arial", bold: true, color: "0F172A" });
  s.addImage({ path: img("/Laporan/1.png"), x: 0.2, y: 0.8, w: 5.0, h: 2.6 });
  s.addImage({ path: img("/Laporan/2.png"), x: 5.5, y: 0.8, w: 5.0, h: 2.6 });
  s.addText("Kondisi FAULT: LED Merah (GPIO3) ON, Hijau OFF", { x: 0.2, y: 3.45, w: 5.0, h: 0.25, fontSize: 9, fontFace: "Arial", color: "64748B", align: "center" });
  s.addText("Kondisi LOCKOUT: Merah + Kuning (GPIO5) ON", { x: 5.5, y: 3.45, w: 5.0, h: 0.25, fontSize: 9, fontFace: "Arial", color: "64748B", align: "center" });

  s.addShape(ppt.ShapeType.roundRect,{x:0.2,y:3.85,w:5.0,h:2.8,fill:{color:"F8FAFC"},rectRadius:0.06,line:{color:"E2E8F0",width:0.5}});
  s.addText("Wiring (Active-High)",{x:0.35,y:3.9,w:3,h:0.3,fontSize:11,fontFace:"Arial",bold:true,color:"0F172A"});
  s.addTable([["Pin","Komponen","Fungsi"],["GPIO3","LED Merah","Valve tertutup (fault)"],["GPIO4","LED Hijau","Sistem normal"],["GPIO5","LED Kuning","Lockout aktif"],["GPIO15","Push-Button","Fault injection (pull-down 10kΩ)"]],{
    x:0.35,y:4.25,w:4.7,fontSize:9,fontFace:"Arial",border:{type:"solid",pt:0.4,color:"CBD5E1"},colW:[1.2,1.5,2.0],rowH:[0.3,0.25,0.25,0.25,0.25],color:"0F172A"
  });

  s.addShape(ppt.ShapeType.roundRect,{x:5.5,y:3.85,w:5.0,h:2.8,fill:{color:"F8FAFC"},rectRadius:0.06,line:{color:"E2E8F0",width:0.5}});
  s.addText("Sensor — Normal vs Injeksi",{x:5.65,y:3.9,w:4,h:0.3,fontSize:11,fontFace:"Arial",bold:true,color:"0F172A"});
  s.addTable([["Sensor","Normal","Injeksi MINOR","Injeksi CRITICAL"],["Suhu","25°C","99°C","99°C"],["Tekanan","1013 hPa","1013 hPa (normal)","0 hPa (GAGAL)"],["Vibrasi","5","9999","9999"],["Anomali","0/3","2/3","3/3"]],{
    x:5.65,y:4.25,w:4.7,fontSize:8.5,fontFace:"Arial",border:{type:"solid",pt:0.4,color:"CBD5E1"},colW:[1.0,1.1,1.3,1.3],rowH:[0.3,0.22,0.22,0.22,0.22],color:"0F172A"
  });
}

// ═══════════════════════════════════ SLIDE 8 — MINOR ══════════
{
  const s = ppt.addSlide();
  s.background = { color: "FFFFFF" };
  s.addText("Skenario 1 — MINOR Fault (Klik Singkat < 5 detik)", { x: 0.5, y: 0.15, w: 9, h: 0.5, fontSize: 24, fontFace: "Arial", bold: true, color: "D97706" });
  s.addShape(ppt.ShapeType.roundRect,{x:0.3,y:0.8,w:10.0,h:2.8,fill:{color:"FFFBEB"},rectRadius:0.08,line:{color:"F59E0B",width:1.2}});
  s.addText([
    {text:"Apa yang terjadi saat tombol ditekan singkat:\n\n",options:{bold:true,fontSize:13}},
    {text:"1. ",options:{bold:true}},{text:"Tombol GPIO15 ditekan dan langsung dilepas (durasi < 5 detik).\n",options:{}},
    {text:"2. ",options:{bold:true}},{text:"Sticky latch menangkap klik → hold_count mulai dari 1.\n",options:{}},
    {text:"3. ",options:{bold:true}},{text:"Sensor diinjeksi: suhu 25→99°C (>threshold 80°C), vibrasi 5→9999 (>threshold 500).\n",options:{}},
    {text:"4. ",options:{bold:true}},{text:"Tekanan TETAP 1013 hPa (dalam range 900-1200) — hold_count < 50.\n",options:{}},
    {text:"5. ",options:{bold:true}},{text:"Voting: 2 sensor anomali (suhu + vibrasi) ≥ quorum 2/3 → FAULT DETECTED.\n",options:{}},
    {text:"6. ",options:{bold:true}},{text:"Klasifikasi: 2/3 anomali → MINOR → lockout 500 ms.\n",options:{}},
    {text:"7. ",options:{bold:true}},{text:"LED Merah (GPIO3) ON, Hijau (GPIO4) OFF, Kuning (GPIO5) ON.\n",options:{}},
    {text:"8. ",options:{bold:true}},{text:"Countdown: 500→400→300→200→100→0 ms.\n",options:{}},
    {text:"9. ",options:{bold:true}},{text:"LOCKOUT CLEARED: sensor di-reset, LED Merah OFF, Kuning OFF, Hijau ON.",options:{}},
  ],{x:0.5,y:0.9,w:9.6,h:2.6,fontSize:11,fontFace:"Arial",color:"0F172A",lineSpacing:18});
  s.addShape(ppt.ShapeType.roundRect,{x:0.3,y:3.8,w:10.0,h:2.8,fill:{color:"0F172A"},rectRadius:0.08});
  s.addText("Output CSV dari Debug Console Proteus:",{x:0.5,y:3.9,w:4,h:0.3,fontSize:10,fontFace:"Arial",bold:true,color:"F59E0B"});
  s.addText("iter  temp  press  vib   lat  status\n  4    99   1013   9999   45  FAULT_DETECTED(MINOR,2/3)    ← fault\n  5    99   1013   9999    0  LOCKOUT_ACTIVE(400ms)\n  6    99   1013   9999    0  LOCKOUT_ACTIVE(300ms)\n  7    99   1013   9999    0  LOCKOUT_ACTIVE(200ms)\n  8    99   1013   9999    0  LOCKOUT_ACTIVE(100ms)\n  9    99   1013   9999    0  LOCKOUT_CLEARED                ← 5 iter = 500ms ✓",{
    x:0.5,y:4.25,w:9.6,h:2.2,fontSize:9.5,fontFace:"Consolas",color:"CBD5E1",lineSpacing:17
  });
}

// ═══════════════════════════════════ SLIDE 9 — CRITICAL ═══════
{
  const s = ppt.addSlide();
  s.background = { color: "FFFFFF" };
  s.addText("Skenario 2 — CRITICAL Fault (Tahan ≥ 5 detik)", { x: 0.5, y: 0.15, w: 9, h: 0.5, fontSize: 24, fontFace: "Arial", bold: true, color: "DC2626" });
  s.addShape(ppt.ShapeType.roundRect,{x:0.3,y:0.8,w:10.0,h:2.8,fill:{color:"FEF2F2"},rectRadius:0.08,line:{color:"EF4444",width:1.2}});
  s.addText([
    {text:"Apa yang terjadi saat tombol DITAHAN ≥ 5 detik:\n\n",options:{bold:true,fontSize:13}},
    {text:"1. ",options:{bold:true}},{text:"Tombol GPIO15 ditekan dan DITAHAN. hold_count mulai naik.\n",options:{}},
    {text:"2. ",options:{bold:true}},{text:"0–5 detik: hold_count 1→49. Sistem mendeteksi MINOR berulang.\n",options:{}},
    {text:"3. ",options:{bold:true,color:"DC2626"}},{text:"Detik ke-5 (hold_count=50): TRIGGER CRITICAL!\n",options:{color:"DC2626"}},
    {text:"4. ",options:{bold:true}},{text:"Sensor diinjeksi: suhu 99°C, vibrasi 9999, DAN tekanan 0 hPa.\n",options:{}},
    {text:"5. ",options:{bold:true}},{text:"Tekanan 0 hPa = SIMULASI KEGAGALAN TOTAL sensor tekanan.\n",options:{}},
    {text:"6. ",options:{bold:true}},{text:"Voting: 3 sensor anomali = SEMUA GAGAL → CRITICAL FAULT.\n",options:{}},
    {text:"7. ",options:{bold:true}},{text:"Lockout 2000 ms (4× lebih lama dari MINOR) — 20 iterasi.\n",options:{}},
    {text:"8. ",options:{bold:true}},{text:"LED Merah ON, Kuning ON — sistem AMAN selama 2 detik penuh.\n",options:{}},
    {text:"9. ",options:{bold:true}},{text:"Setelah 2000ms: CLEARED, sensor reset, kembali NORMAL.",options:{}},
  ],{x:0.5,y:0.9,w:9.6,h:2.6,fontSize:11,fontFace:"Arial",color:"0F172A",lineSpacing:18});
  s.addShape(ppt.ShapeType.roundRect,{x:0.3,y:3.8,w:10.0,h:2.8,fill:{color:"0F172A"},rectRadius:0.08});
  s.addText("Output CSV dari Debug Console Proteus:",{x:0.5,y:3.9,w:4,h:0.3,fontSize:10,fontFace:"Arial",bold:true,color:"EF4444"});
  s.addText("iter  temp  press  vib   lat  status\n 107   99    0     9999   45  FAULT_DETECTED(CRITICAL,3/3)   ← press=0!\n 108   99    0     9999    0  LOCKOUT_ACTIVE(1900ms)\n 109   99    0     9999    0  LOCKOUT_ACTIVE(1800ms)\n  ...\n 126   99    0     9999    0  LOCKOUT_ACTIVE(100ms)\n 127   99    0     9999    0  LOCKOUT_CLEARED                 ← 20 iter = 2000ms ✓",{
    x:0.5,y:4.25,w:9.6,h:2.2,fontSize:9.5,fontFace:"Consolas",color:"CBD5E1",lineSpacing:17
  });
}

// ═══════════════════════════════════ SLIDE 10 — PERBANDINGAN ═══
{
  const s = ppt.addSlide();
  s.background = { color: "FFFFFF" };
  s.addText("Perbandingan MINOR vs CRITICAL — Adaptive Lockout Terbukti", { x: 0.5, y: 0.15, w: 9, h: 0.5, fontSize: 22, fontFace: "Arial", bold: true, color: "0F172A" });
  s.addTable([
    ["Parameter","MINOR","CRITICAL","Kesimpulan"],
    ["Trigger","Klik < 5 detik","Tahan ≥ 5 detik","Durasi tekan → severity"],
    ["Sensor Anomali","2 dari 3\n(suhu + vibrasi)","3 dari 3\n(semua sensor)","Jumlah anomali → lockout"],
    ["Tekanan","1013 hPa (normal)","0 hPa (GAGAL TOTAL)","0 hPa = simulasi kerusakan"],
    ["Lockout","500 ms","2000 ms","4× lebih lama CRITICAL"],
    ["Iterasi @100ms","5 iterasi","20 iterasi","Konsisten dgn durasi"],
    ["LED","Merah+Kuning ON","Merah+Kuning ON","Indikator sama, durasi beda"],
    ["Data Signature","MINOR,2/3","CRITICAL,3/3","Label severity di CSV"],
    ["Latensi","45 µs","45 µs","Konsisten semua fault"],
  ],{x:0.3,y:0.8,w:10.0,fontSize:10,fontFace:"Arial",border:{type:"solid",pt:0.5,color:"CBD5E1"},colW:[2.0,2.5,2.8,2.7],rowH:[0.45,0.5,0.5,0.45,0.4,0.4,0.4,0.4,0.4],color:"0F172A",autoPage:false});
  s.addShape(ppt.ShapeType.roundRect,{x:0.3,y:5.2,w:10.0,h:1.5,fill:{color:"F0FDF4"},rectRadius:0.06,line:{color:"86EFAC",width:1}});
  s.addText([
    {text:"BUKTI ADAPTIVE LOCKOUT:\n\n",options:{bold:true,color:"16A34A",fontSize:13}},
    {text:"• Tombol SAMA, durasi BERBEDA → severity BERBEDA → lockout BERBEDA.\n",options:{}},
    {text:"• MINOR: 500ms (5 iter) — recovery cepat, redundansi masih ada.\n",options:{}},
    {text:"• CRITICAL: 2000ms (20 iter) — 4× lebih lama, semua sensor gagal.\n",options:{}},
    {text:"• Valve bounce TIDAK TERJADI — aktuator aman selama lockout.\n",options:{}},
    {text:"• Data dari Proteus, diverifikasi python/analyze.py — TANPA REKAYASA.",options:{}},
  ],{x:0.5,y:5.25,w:9.6,h:1.4,fontSize:11,fontFace:"Arial",color:"0F172A",lineSpacing:18});
}

// ═══════════════════════════════ SLIDE 11 — GNUPLOT DETAIL ════
{
  const s = ppt.addSlide();
  s.background = { color: "0F172A" };
  s.addText("Visualisasi Data — GNUPlot 5-Panel Analysis", { x: 0.5, y: 0.08, w: 9, h: 0.4, fontSize: 22, fontFace: "Arial", bold: true, color: "FFFFFF" });
  s.addText("Bagaimana membaca grafik: setiap panel menunjukkan aspek berbeda dari perilaku sistem. Data dari simulation_data.dat (319 iterasi).", {
    x: 0.5, y: 0.45, w: 9.5, h: 0.25, fontSize: 9, fontFace: "Arial", color: "94A3B8"
  });

  // Main 3-panel
  s.addImage({ path: img("/Laporan/sensor_fusion_analysis.png"), x: 0.15, y: 0.8, w: 6.5, h: 3.5 });

  // Panel explanations right side
  s.addShape(ppt.ShapeType.roundRect,{x:6.8,y:0.8,w:3.7,h:3.5,fill:{color:"1E293B"},rectRadius:0.06,line:{color:"334155",width:0.5}});
  s.addText("Panel 1 — Multi-Sensor Readings",{x:6.95,y:0.9,w:3.4,h:0.25,fontSize:10,fontFace:"Arial",bold:true,color:"F59E0B"});
  s.addText("• Garis KUNING = suhu (°C)\n• Garis HIJAU = vibrasi (dibagi 100)\n• Garis putus MERAH = threshold 80°C\n• Spike tajam = tombol ditekan\n  (suhu 25→99, vibrasi 5→9999)\n• Terlihat suhu & vibrasi selalu\n  naik bersamaan saat fault",{x:6.95,y:1.2,w:3.4,h:1.3,fontSize:8.5,fontFace:"Arial",color:"CBD5E1",lineSpacing:15,valign:"top"});

  s.addShape(ppt.ShapeType.rect,{x:6.95,y:2.6,w:3.4,h:0.01,fill:{color:"334155"}});
  s.addText("Panel 2 — Recovery Latency",{x:6.95,y:2.65,w:3.4,h:0.25,fontSize:10,fontFace:"Arial",bold:true,color:"22C55E"});
  s.addText("• Garis BIRU = latensi (µs)\n• Garis putus MERAH = safety\n  threshold 5µs\n• Nilai terukur 45µs — overhead\n  MicroPython interpreter\n• Prediksi Rust bare-metal: <5µs\n  (resolusi TIMG0 12.5ns/tick)",{x:6.95,y:2.95,w:3.4,h:1.2,fontSize:8.5,fontFace:"Arial",color:"CBD5E1",lineSpacing:15,valign:"top"});

  s.addShape(ppt.ShapeType.rect,{x:6.95,y:4.15,w:3.4,h:0.01,fill:{color:"334155"}});
  s.addText("Panel 3 — Status Timeline",{x:6.95,y:4.2,w:3.4,h:0.15,fontSize:10,fontFace:"Arial",bold:true,color:"3B82F6"});

  // Bottom row: 3 more graphs + explanations
  s.addImage({ path: img("/Laporan/latency_analysis.png"), x: 0.15, y: 4.5, w: 3.2, h: 2.0 });
  s.addText([
    {text:"Panel 4 — Latency Detail\n",options:{bold:true,color:"22C55E"}},
    {text:"Zoom-in analisis latensi.\nMenunjukkan konsistensi\n45µs di semua fault event.\nTidak ada variasi — sistem\nbersifat deterministik.",options:{color:"CBD5E1"}},
  ],{x:0.2,y:6.55,w:3.1,h:1.0,fontSize:8,fontFace:"Arial",lineSpacing:13,valign:"top"});

  s.addImage({ path: img("/Laporan/state_timeline.png"), x: 3.55, y: 4.5, w: 3.2, h: 2.0 });
  s.addText([
    {text:"Panel 5 — State Timeline\n",options:{bold:true,color:"3B82F6"}},
    {text:"Region berwarna:\nHIJAU = fase NORMAL\nMERAH/ORANYE = siklus\nfault-lockout.\nPola berulang deterministik\nsaat tombol ditekan kontinu.",options:{color:"CBD5E1"}},
  ],{x:3.6,y:6.55,w:3.1,h:1.0,fontSize:8,fontFace:"Arial",lineSpacing:13,valign:"top"});

  s.addImage({ path: img("/Laporan/voting_heatmap.png"), x: 6.95, y: 4.5, w: 3.5, h: 2.0 });
  s.addText([
    {text:"Voting Heatmap\n",options:{bold:true,color:"A855F7"}},
    {text:"3 baris = 3 sensor:\nAtas: suhu (>80°C)\nTengah: tekanan (<900\n  atau >1200 hPa)\nBawah: vibrasi (>500)\n\nMerah = anomali\nBiru = normal\n\nTerlihat tekanan hanya\nmerah saat CRITICAL\n(tahan ≥5 detik).",options:{color:"CBD5E1"}},
  ],{x:7.0,y:6.55,w:3.4,h:1.0,fontSize:8,fontFace:"Arial",lineSpacing:13,valign:"top"});
}

// ═══════════════════════════════ SLIDE 12 — KEUNGGULAN ════════
{
  const s = ppt.addSlide();
  s.background = { color: "FFFFFF" };
  s.addText("Keunggulan Metode vs Penelitian Sebelumnya", { x: 0.5, y: 0.08, w: 9, h: 0.45, fontSize: 20, fontFace: "Arial", bold: true, color: "0F172A" });
  s.addTable([
    ["Dimensi","Metode Kami","J14 (Desikan 2025)","J17 (Bruneo 2022)","J21 (Radovici 2022)"],
    ["Memory\nSafety","✅ Rust compile-time\nzero CVE surface","❌ Tidak dibahas\n(C/C++ assumed)","❌ Tidak dibahas","✅ Rust-based Tock OS\n(OS-level, bukan\nbare-metal)"],
    ["Concurrency","✅ Mutex<RefCell<T>>\n+ critical_section","❌ Tidak ada\nmekanisme","❌ Single-thread\nESN processing","✅ eBPF + Tock\n(kernel-space,\nkompleks)"],
    ["Sensor\nFusion","✅ Voting ≥2/3\nmajority quorum","⚠️ Dynamic threshold\n(single-sensor)","⚠️ ESN anomaly\ndetection (ML-heavy)","❌ Tidak ada\nsensor fusion"],
    ["Fail-Safe","✅ Adaptive Lockout\n500/2000ms","❌ Tidak ada\nlockout","❌ Tidak ada\nfail-safe actuator","❌ Tidak ada\nlockout"],
    ["Latency","✅ Hardware timer\n45µs (MicroPython)","❌ Tidak diukur","⚠️ ESN inference\ntime (tidak real-time)","✅ 3× faster interrupt\n(vs Linux, bukan\nbare-metal)"],
    ["Dokumentasi","✅ LaTeX 25 ref\nGNUPlot 5 panel\nPython analysis","✅ Paper terstruktur\n(tanpa kode)","✅ Paper + eksperimen\n(Matlab, tidak\nembedded)","✅ Paper + benchmark\n(kode OS, bukan\naplikasi)"],
  ],{x:0.15,y:0.6,w:10.3,fontSize:8,fontFace:"Arial",border:{type:"solid",pt:0.4,color:"CBD5E1"},colW:[1.3,2.3,2.1,2.1,2.5],rowH:[0.4,0.9,0.9,0.8,0.8,0.7,0.9],color:"0F172A",autoPage:false});
  s.addShape(ppt.ShapeType.roundRect,{x:0.15,y:5.7,w:10.3,h:1.0,fill:{color:"EFF6FF"},rectRadius:0.06,line:{color:"3B82F6",width:1}});
  s.addText([
    {text:"Kontribusi Orisinal: ",options:{bold:true,color:"1E40AF"}},
    {text:"Tidak ada penelitian yang mengintegrasikan Rust bare-metal + voting fusion + adaptive lockout dalam satu sistem. Metode kami menjembatani celah antara formal verification Rust (J18, J19, J23) dengan implementasi praktis pada embedded system (J24). Hasil simulasi MEMBUKTIKAN adaptive lockout bekerja — tanpa rekayasa data.",options:{color:"0F172A"}},
  ],{x:0.35,y:5.75,w:9.9,h:0.9,fontSize:10,fontFace:"Arial",lineSpacing:15});
}

// ═══════════════════════════════ SLIDE 13 — KESIMPULAN ════════
{
  const s = ppt.addSlide();
  s.background = { color: "0F172A" };
  s.addText("Kesimpulan", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 36, fontFace: "Arial", bold: true, color: "FFFFFF" });
  s.addShape(ppt.ShapeType.rect, { x: 0.5, y: 0.95, w: 2.0, h: 0.03, fill: { color: "38BDF8" } });
  s.addText([
    {text:"1. Celah riset: ",options:{bold:true,color:"38BDF8"}},{text:"25 jurnal (2021-2026) — tidak ada yang integrasikan Rust safe-concurrency + voting fusion + adaptive lockout.\n\n",options:{color:"CBD5E1"}},
    {text:"2. Metode: ",options:{bold:true,color:"38BDF8"}},{text:"Safe-Concurrency Multi-Sensor Fusion — Mutex<RefCell<T>>, voting ≥2/3, adaptive lockout 500/2000ms, hold-duration detection.\n\n",options:{color:"CBD5E1"}},
    {text:"3. Simulasi MEMBUKTIKAN: ",options:{bold:true,color:"22C55E"}},{text:"319 iterasi Proteus VSM. 5 MINOR (500ms) + 3 CRITICAL (2000ms). Python verify — tanpa rekayasa.\n\n",options:{color:"CBD5E1"}},
    {text:"4. Keunggulan vs literatur: ",options:{bold:true,color:"38BDF8"}},{text:"Memory safety (Rust), voting redundancy, adaptive lockout, event-triggered — kombinasi pertama di embedded system.",options:{color:"CBD5E1"}},
  ],{x:0.5,y:1.2,w:9.5,h:4.5,fontSize:13,fontFace:"Arial",lineSpacing:22,valign:"top"});
  s.addText("Abdurrauf Almutawakkil — NRP 2042241115 — Teknik Instrumentasi ITS — 2025/2026",{x:0.5,y:5.9,w:9.5,h:0.35,fontSize:10,fontFace:"Arial",color:"64748B"});
}

// ═══════════════════════════════════════════════════════════════
ppt.writeFile({ fileName: B + "/Presentasi_ETS_Final.pptx" })
  .then(() => console.log("PPT TERSIMPAN: Presentasi_ETS_Final.pptx"))
  .catch(e => console.error("ERROR:", e));
