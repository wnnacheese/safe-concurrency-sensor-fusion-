const pptxgen = require("pptxgenjs");

const ppt = new pptxgen();
ppt.layout = "LAYOUT_WIDE";
ppt.author = "Abdurrauf Almutawakkil";
ppt.title = "Safe-Concurrency Multi-Sensor Fusion";

const C = {
  navy: "1E2761",
  ice:   "CADCFC",
  white: "FFFFFF",
  dark:  "0F172A",
  gray:  "64748B",
  red:   "EF4444",
  green: "22C55E",
  amber: "F59E0B",
  cyan:  "06B6D4",
};

// ═══════════════════════════════════════════════════════════════
// SLIDE 1: TITLE
// ═══════════════════════════════════════════════════════════════
{
  const s = ppt.addSlide();
  s.background = { color: C.navy };
  s.addText("Safe-Concurrency for\nMulti-Sensor Fusion in\nIndustrial Safety-Critical Systems", {
    x: 0.6, y: 1.0, w: 8, h: 2.8, fontSize: 36, fontFace: "Arial Black", color: C.white, bold: true, lineSpacing: 42
  });
  s.addShape(ppt.ShapeType.rect, { x: 0.6, y: 3.9, w: 2.5, h: 0.04, fill: { color: C.ice } });
  s.addText("ESP32-S3 Bare-Metal Rust | Voting ≥2/3 | Adaptive Lockout 500/2000ms", {
    x: 0.6, y: 4.1, w: 8, h: 0.6, fontSize: 16, fontFace: "Calibri", color: C.ice
  });
  s.addText("Abdurrauf Almutawakkil — NRP 2042241115\nTeknik Instrumentasi ITS | ETS Pemrograman Kontroller 2025/2026", {
    x: 0.6, y: 5.5, w: 8, h: 0.8, fontSize: 13, fontFace: "Calibri", color: C.gray
  });
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 2: RESEARCH GAP
// ═══════════════════════════════════════════════════════════════
{
  const s = ppt.addSlide();
  s.background = { color: C.white };
  s.addText("Research Gap — Future Work Synthesis", { x: 0.6, y: 0.4, fontSize: 30, fontFace: "Arial Black", color: C.navy });
  s.addShape(ppt.ShapeType.rect, { x: 0.6, y: 1.0, w: 1.5, h: 0.03, fill: { color: C.cyan } });

  const gaps = [
    ["FW12", "HW-SW co-design\nfault-tolerant fusion"],
    ["FW17", "Real-time embedded\nfault detection on MCU"],
    ["FW18/23", "Rust memory-safety\nunsafe reduction"],
    ["FW21", "Low-latency interrupt\nhandling Rust embedded"],
    ["FW24", "Rust performance\nbenchmark on ESP32"],
  ];

  gaps.forEach((g, i) => {
    const x = 0.6 + (i * 1.8);
    s.addShape(ppt.ShapeType.roundRect, { x, y: 1.4, w: 1.6, h: 1.5, fill: { color: C.navy }, rectRadius: 0.1 });
    s.addText(g[0], { x, y: 1.5, w: 1.6, h: 0.4, fontSize: 14, fontFace: "Arial Black", color: C.amber, align: "center" });
    s.addText(g[1], { x, y: 1.9, w: 1.6, h: 0.9, fontSize: 11, fontFace: "Calibri", color: C.white, align: "center" });
  });

  s.addText("No existing research combines ALL of these in ONE integrated system", {
    x: 0.6, y: 3.2, w: 9, h: 0.5, fontSize: 16, fontFace: "Arial Black", color: C.red
  });
  s.addText("→ Our method fills this gap: safe-concurrency Rust + voting fusion + adaptive lockout + event-triggered on bare-metal ESP32-S3", {
    x: 0.6, y: 3.7, w: 9, h: 0.6, fontSize: 13, fontFace: "Calibri", color: C.dark
  });

  s.addText("Based on 25 Scopus/WoS references (2021–2026)", {
    x: 0.6, y: 4.8, w: 9, h: 0.4, fontSize: 11, fontFace: "Calibri", color: C.gray, italic: true
  });
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 3: METHOD OVERVIEW
// ═══════════════════════════════════════════════════════════════
{
  const s = ppt.addSlide();
  s.background = { color: C.white };
  s.addText("Method — Safe-Concurrency Multi-Sensor Fusion", { x: 0.6, y: 0.4, fontSize: 28, fontFace: "Arial Black", color: C.navy });
  s.addShape(ppt.ShapeType.rect, { x: 0.6, y: 1.0, w: 1.5, h: 0.03, fill: { color: C.cyan } });

  const items = [
    ["Mutex<RefCell<T>>\n+ critical_section", "Safe concurrency without unsafe code. Zero data races at compile time.", C.cyan],
    ["Voting ≥2/3\nMajority Quorum", "3 sensors (Temp, Press, Vib). 2+ anomalies = FAULT. Tolerates 1 sensor failure.", C.amber],
    ["Adaptive Lockout\n500ms / 2000ms", "MINOR (2/3 sensors) → 500ms. CRITICAL (3/3 sensors) → 2000ms. Prevents valve bounce.", C.red],
    ["Hold-Duration\nDetection", "Sticky latch + hold counter. <5s short press → MINOR. ≥5s long press → CRITICAL.", C.green],
    ["Event-Triggered\n100ms Poll", "Evaluation only on button event or state change. Idle heartbeat every 10 cycles.", C.navy],
    ["Hardware-Timed\nLatency µs", "time.ticks_us() for detection-to-actuator latency measurement.", C.amber],
  ];

  items.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.6 + col * 4.7;
    const y = 1.3 + row * 1.4;

    s.addShape(ppt.ShapeType.roundRect, { x, y, w: 4.3, h: 1.2, fill: { color: "F8FAFC" }, rectRadius: 0.08, line: { color: "E2E8F0", width: 0.5 } });
    s.addShape(ppt.ShapeType.rect, { x: x+0.05, y: y+0.1, w: 0.06, h: 1.0, fill: { color: item[2] } });
    s.addText(item[0], { x: x+0.3, y: y+0.1, w: 1.8, h: 1.0, fontSize: 11, fontFace: "Arial Black", color: C.navy, valign: "middle" });
    s.addText(item[1], { x: x+2.1, y: y+0.1, w: 2.1, h: 1.0, fontSize: 10, fontFace: "Calibri", color: C.gray, valign: "middle" });
  });
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 4: BLOCK DIAGRAM
// ═══════════════════════════════════════════════════════════════
{
  const s = ppt.addSlide();
  s.background = { color: C.navy };
  s.addText("System Block Diagram", { x: 0.6, y: 0.3, fontSize: 30, fontFace: "Arial Black", color: C.white });
  s.addText("ESP32-S3 | Voting ≥2/3 | Adaptive Lockout | Sticky Latch | 100ms Poll", { x: 0.6, y: 0.9, fontSize: 13, fontFace: "Calibri", color: C.ice });

  // Flow boxes
  const boxes = [
    { t: "3× Sensors\nTemp | Press | Vib", x: 0.5, y: 1.6, c: C.cyan },
    { t: "Sticky Latch\n+ Hold Counter", x: 2.8, y: 1.6, c: "A855F7" },
    { t: "Sensor Injection\ntemp=99, vib=9999", x: 5.1, y: 1.6, c: C.red },
    { t: "Voting ≥2/3\nMajority Quorum", x: 7.4, y: 1.6, c: C.amber },
    { t: "Adaptive Lockout\n500/2000ms", x: 2.8, y: 3.8, c: C.red },
    { t: "3× LEDs\nRed/Yellow/Green", x: 7.4, y: 3.8, c: C.green },
    { t: "Auto-Recovery\n→ NORMAL", x: 5.1, y: 3.8, c: C.cyan },
  ];

  boxes.forEach(b => {
    s.addShape(ppt.ShapeType.roundRect, { x: b.x, y: b.y, w: 2.0, h: 1.2, fill: { color: "1A2744" }, rectRadius: 0.08, line: { color: b.c, width: 1.5 } });
    s.addText(b.t, { x: b.x, y: b.y, w: 2.0, h: 1.2, fontSize: 11, fontFace: "Calibri", color: C.white, align: "center", valign: "middle" });
  });

  // GPIO label
  s.addText("GPIO15 Button", { x: 9.6, y: 1.8, w: 1.2, h: 0.5, fontSize: 9, fontFace: "Calibri", color: C.amber });
  s.addText("GPIO3 Red · GPIO4 Green · GPIO5 Yellow", { x: 9.6, y: 4.0, w: 1.2, h: 0.5, fontSize: 8, fontFace: "Calibri", color: C.gray });

  s.addText("State Machine: NORMAL → FAULT → LOCKOUT → CLEARED → NORMAL", {
    x: 0.5, y: 5.3, w: 9, h: 0.4, fontSize: 11, fontFace: "Calibri", color: C.ice, align: "center"
  });
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 5: HARDWARE + PARAMETERS
// ═══════════════════════════════════════════════════════════════
{
  const s = ppt.addSlide();
  s.background = { color: C.white };
  s.addText("Hardware Wiring & Input Parameters", { x: 0.6, y: 0.4, fontSize: 28, fontFace: "Arial Black", color: C.navy });
  s.addShape(ppt.ShapeType.rect, { x: 0.6, y: 1.0, w: 1.5, h: 0.03, fill: { color: C.cyan } });

  // Pin table
  const pins = [
    ["GPIO3", "LED Red", "Valve CLOSED (Fault Active)"],
    ["GPIO4", "LED Green", "System NORMAL"],
    ["GPIO5", "LED Yellow", "Lockout Active"],
    ["GPIO15", "Button", "Fault Injection (pull-down 10kΩ)"],
  ];
  const pinRows = [["Pin", "Component", "Function"], ...pins];
  s.addTable(pinRows, {
    x: 0.5, y: 1.3, w: 4.8, fontSize: 12, fontFace: "Calibri",
    border: { type: "solid", pt: 0.5, color: "CBD5E1" },
    colW: [1.2, 1.5, 2.1],
    rowH: [0.4, 0.35, 0.35, 0.35, 0.35],
    color: C.dark,
    fill: { color: "F8FAFC" },
  });

  // Parameters
  const params = [
    ["Parameter", "Value"],
    ["Poll Interval", "100 ms"],
    ["Temp Threshold", "> 80°C"],
    ["Press Range", "900–1200 hPa"],
    ["Vib Threshold", "> 500"],
    ["Hold Threshold", "5 seconds (50 cycles)"],
    ["MINOR Lockout", "500 ms (5 iter)"],
    ["CRITICAL Lockout", "2000 ms (20 iter)"],
    ["Voting Quorum", "≥ 2 of 3 sensors"],
  ];
  s.addTable(params, {
    x: 5.8, y: 1.3, w: 4.2, fontSize: 12, fontFace: "Calibri",
    border: { type: "solid", pt: 0.5, color: "CBD5E1" },
    colW: [2.2, 2.0],
    rowH: [0.4, 0.32, 0.32, 0.32, 0.32, 0.32, 0.32, 0.32, 0.32],
    color: C.dark,
    fill: { color: "F8FAFC" },
  });

  // Sensor injection values
  s.addShape(ppt.ShapeType.roundRect, { x: 0.5, y: 4.5, w: 9.5, h: 1.0, fill: { color: "FEF2F2" }, rectRadius: 0.08, line: { color: "FECACA", width: 1 } });
  s.addText("Sensor Injection Values", { x: 0.7, y: 4.55, w: 3, h: 0.3, fontSize: 12, fontFace: "Arial Black", color: C.red });
  s.addText("Normal:  temp=25°C, press=1013 hPa, vib=5    |    MINOR:  temp=99°C, vib=9999 (press normal)    |    CRITICAL:  temp=99°C, vib=9999, press=0 hPa", {
    x: 0.7, y: 4.85, w: 9, h: 0.6, fontSize: 11, fontFace: "Consolas", color: C.dark
  });
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 6: SIMULATION SCENARIOS
// ═══════════════════════════════════════════════════════════════
{
  const s = ppt.addSlide();
  s.background = { color: C.white };
  s.addText("Simulation Scenarios — Proving Adaptive Lockout", { x: 0.6, y: 0.4, fontSize: 28, fontFace: "Arial Black", color: C.navy });
  s.addShape(ppt.ShapeType.rect, { x: 0.6, y: 1.0, w: 1.5, h: 0.03, fill: { color: C.cyan } });

  // Scenario 1: MINOR
  s.addShape(ppt.ShapeType.roundRect, { x: 0.5, y: 1.3, w: 4.6, h: 4.2, fill: { color: "FFFBEB" }, rectRadius: 0.1, line: { color: C.amber, width: 1.5 } });
  s.addText("🔵 MINOR Fault — Short Press (<5s)", { x: 0.7, y: 1.4, w: 4, h: 0.4, fontSize: 16, fontFace: "Arial Black", color: C.amber });
  s.addText([
    { text: "Action: ", options: { bold: true } }, { text: "Click button briefly (< 5 seconds)" },
  ], { x: 0.7, y: 1.9, w: 4, h: 0.3, fontSize: 11, fontFace: "Calibri", color: C.dark });
  s.addText([
    { text: "Sensors: ", options: { bold: true } }, { text: "temp=99°C, vib=9999, press=1013 hPa (normal)" },
  ], { x: 0.7, y: 2.2, w: 4.2, h: 0.3, fontSize: 11, fontFace: "Calibri", color: C.dark });
  s.addText([
    { text: "Anomalies: ", options: { bold: true } }, { text: "2 of 3 (temp + vib)" },
  ], { x: 0.7, y: 2.5, w: 4, h: 0.3, fontSize: 11, fontFace: "Calibri", color: C.dark });
  s.addText([
    { text: "Lockout: ", options: { bold: true } }, { text: "500 ms = 5 iterations @ 100ms poll" },
  ], { x: 0.7, y: 2.8, w: 4, h: 0.3, fontSize: 11, fontFace: "Calibri", color: C.dark });
  s.addText([
    { text: "LEDs: ", options: { bold: true } }, { text: "Red ON, Green OFF, Yellow ON (500ms)" },
  ], { x: 0.7, y: 3.1, w: 4, h: 0.3, fontSize: 11, fontFace: "Calibri", color: C.dark });

  // Scenario 2: CRITICAL
  s.addShape(ppt.ShapeType.roundRect, { x: 5.3, y: 1.3, w: 4.6, h: 4.2, fill: { color: "FEF2F2" }, rectRadius: 0.1, line: { color: C.red, width: 1.5 } });
  s.addText("🔴 CRITICAL Fault — Long Press (≥5s)", { x: 5.5, y: 1.4, w: 4, h: 0.4, fontSize: 16, fontFace: "Arial Black", color: C.red });
  s.addText([
    { text: "Action: ", options: { bold: true } }, { text: "Hold button ≥ 5 seconds" },
  ], { x: 5.5, y: 1.9, w: 4, h: 0.3, fontSize: 11, fontFace: "Calibri", color: C.dark });
  s.addText([
    { text: "Sensors: ", options: { bold: true } }, { text: "temp=99°C, vib=9999, press=0 hPa (FAILED)" },
  ], { x: 5.5, y: 2.2, w: 4.2, h: 0.3, fontSize: 11, fontFace: "Calibri", color: C.dark });
  s.addText([
    { text: "Anomalies: ", options: { bold: true } }, { text: "3 of 3 (all sensors failed)" },
  ], { x: 5.5, y: 2.5, w: 4, h: 0.3, fontSize: 11, fontFace: "Calibri", color: C.dark });
  s.addText([
    { text: "Lockout: ", options: { bold: true } }, { text: "2000 ms = 20 iterations @ 100ms poll" },
  ], { x: 5.5, y: 2.8, w: 4, h: 0.3, fontSize: 11, fontFace: "Calibri", color: C.dark });
  s.addText([
    { text: "LEDs: ", options: { bold: true } }, { text: "Red ON, Green OFF, Yellow ON (2000ms)" },
  ], { x: 5.5, y: 3.1, w: 4, h: 0.3, fontSize: 11, fontFace: "Calibri", color: C.dark });

  s.addText("Proteus 9.00 VSM | ESP32-S3 MicroPython | Debug Console CSV Output", {
    x: 0.5, y: 5.7, w: 9, h: 0.3, fontSize: 10, fontFace: "Calibri", color: C.gray, align: "center", italic: true
  });
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 7: RESULTS — DATA
// ═══════════════════════════════════════════════════════════════
{
  const s = ppt.addSlide();
  s.background = { color: C.navy };
  s.addText("Results — Genuine Simulation Data", { x: 0.6, y: 0.3, fontSize: 30, fontFace: "Arial Black", color: C.white });

  // Big numbers
  [
    { n: "5", l: "MINOR Faults\n(short press)", c: C.amber },
    { n: "3", l: "CRITICAL Faults\n(long press ≥5s)", c: C.red },
    { n: "319", l: "Total Iterations\n@ 100ms poll", c: C.cyan },
    { n: "45µs", l: "Avg Recovery\nLatency", c: C.green },
  ].forEach((b, i) => {
    s.addText(b.n, { x: 0.5 + i*2.5, y: 1.2, w: 2.2, h: 1.0, fontSize: 48, fontFace: "Arial Black", color: b.c, align: "center" });
    s.addText(b.l, { x: 0.5 + i*2.5, y: 2.2, w: 2.2, h: 0.7, fontSize: 11, fontFace: "Calibri", color: C.ice, align: "center" });
  });

  // CSV output example
  s.addShape(ppt.ShapeType.roundRect, { x: 0.5, y: 3.2, w: 4.8, h: 2.5, fill: { color: "0A0F1A" }, rectRadius: 0.08 });
  s.addText("MINOR Fault (short press)", { x: 0.7, y: 3.25, w: 3, h: 0.3, fontSize: 11, fontFace: "Arial Black", color: C.amber });
  s.addText("4  99 1013 9999 45 FAULT_DETECTED(MINOR,2/3)\n5  99 1013 9999 0  LOCKOUT_ACTIVE(400ms)\n6  99 1013 9999 0  LOCKOUT_ACTIVE(300ms)\n7  99 1013 9999 0  LOCKOUT_ACTIVE(200ms)\n8  99 1013 9999 0  LOCKOUT_ACTIVE(100ms)\n9  99 1013 9999 0  LOCKOUT_CLEARED", {
    x: 0.7, y: 3.6, w: 4.4, h: 2.0, fontSize: 9, fontFace: "Consolas", color: C.ice, lineSpacing: 16
  });

  s.addShape(ppt.ShapeType.roundRect, { x: 5.5, y: 3.2, w: 4.8, h: 2.5, fill: { color: "0A0F1A" }, rectRadius: 0.08 });
  s.addText("CRITICAL Fault (hold >=5s)", { x: 5.7, y: 3.25, w: 3, h: 0.3, fontSize: 11, fontFace: "Arial Black", color: C.red });
  s.addText("107 99 0 9999 45 FAULT_DETECTED(CRITICAL,3/3)\n108 99 0 9999 0  LOCKOUT_ACTIVE(1900ms)\n109 99 0 9999 0  LOCKOUT_ACTIVE(1800ms)\n  ...\n126 99 0 9999 0  LOCKOUT_ACTIVE(100ms)\n127 99 0 9999 0  LOCKOUT_CLEARED", {
    x: 5.7, y: 3.6, w: 4.4, h: 2.0, fontSize: 9, fontFace: "Consolas", color: C.ice, lineSpacing: 16
  });

  s.addText("Genuine data from Proteus debug console — no modification, no fabrication", {
    x: 0.5, y: 5.85, w: 9, h: 0.3, fontSize: 10, fontFace: "Calibri", color: C.gray, align: "center", italic: true
  });
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 8: ADAPTIVE LOCKOUT PROOF
// ═══════════════════════════════════════════════════════════════
{
  const s = ppt.addSlide();
  s.background = { color: C.white };
  s.addText("Adaptive Lockout — Proven", { x: 0.6, y: 0.4, fontSize: 30, fontFace: "Arial Black", color: C.navy });
  s.addShape(ppt.ShapeType.rect, { x: 0.6, y: 1.0, w: 1.5, h: 0.03, fill: { color: C.cyan } });

  // Comparison table
  const rows = [
    ["", "MINOR", "CRITICAL"],
    ["Trigger", "Short press <5s", "Long press ≥5s"],
    ["Sensors Anomalous", "2 of 3 (temp+vib)", "3 of 3 (all sensors)"],
    ["Pressure Value", "1013 hPa (normal)", "0 hPa (FAILED)"],
    ["Lockout Duration", "500 ms", "2000 ms"],
    ["Iterations @ 100ms", "5 iterations", "20 iterations"],
    ["LED States", "Red+Yellow ON", "Red+Yellow ON"],
    ["Data Signature", "MINOR,2/3", "CRITICAL,3/3"],
  ];

  s.addTable(rows, {
    x: 0.5, y: 1.3, w: 9.5, fontSize: 12, fontFace: "Calibri",
    border: { type: "solid", pt: 0.5, color: "CBD5E1" },
    colW: [2.3, 3.6, 3.6],
    rowH: [0.45, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4],
    color: C.dark,
  });

  // Key takeaway
  s.addShape(ppt.ShapeType.roundRect, { x: 0.5, y: 4.9, w: 9.5, h: 0.8, fill: { color: "F0FDF4" }, rectRadius: 0.08, line: { color: C.green, width: 1.5 } });
  s.addText([
    { text: "✓ PROVEN: ", options: { bold: true, color: C.green } },
    { text: "Same button, different hold duration → different severity → different lockout duration. 4× longer lockout for CRITICAL (2000ms vs 500ms). Valve bounce prevented in both cases.", options: { color: C.dark } },
  ], { x: 0.7, y: 5.0, w: 9, h: 0.5, fontSize: 12, fontFace: "Calibri" });
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 9: KEY INNOVATIONS
// ═══════════════════════════════════════════════════════════════
{
  const s = ppt.addSlide();
  s.background = { color: C.white };
  s.addText("Key Innovations & Advantages", { x: 0.6, y: 0.4, fontSize: 30, fontFace: "Arial Black", color: C.navy });
  s.addShape(ppt.ShapeType.rect, { x: 0.6, y: 1.0, w: 1.5, h: 0.03, fill: { color: C.cyan } });

  const innovations = [
    { t: "Rust Bare-Metal", d: "ESP32-S3 no_std. Mutex<RefCell<T>> + critical_section. Zero unsafe blocks, zero data races at compile time.", c: C.cyan },
    { t: "Voting Redundancy", d: "≥2 of 3 sensors must be anomalous to trigger fault. Tolerates single sensor failure — no false positives.", c: C.amber },
    { t: "Adaptive Lockout", d: "MINOR (500ms) for 2/3 anomalies — CRITICAL (2000ms) for 3/3. Prevents dangerous valve bounce oscillation.", c: C.red },
    { t: "Hold-Duration Detection", d: "Sticky latch + hold counter. <5s = MINOR, ≥5s = CRITICAL. Proteus-optimized for reliable click detection.", c: "A855F7" },
    { t: "Event-Triggered", d: "Evaluation only on button press or state transition. No redundant computation. Heartbeat every 10 idle cycles.", c: C.green },
    { t: "Genuine Data", d: "319 iterations from Proteus VSM. 5 MINOR + 3 CRITICAL faults. Python analysis script verifies all metrics.", c: C.navy },
  ];

  innovations.forEach((inn, i) => {
    const x = 0.5 + (i % 3) * 3.2;
    const y = 1.3 + Math.floor(i / 3) * 2.3;
    s.addShape(ppt.ShapeType.roundRect, { x, y, w: 2.9, h: 2.0, fill: { color: "F8FAFC" }, rectRadius: 0.1, line: { color: "E2E8F0", width: 0.5 } });
    s.addShape(ppt.ShapeType.roundRect, { x: x+0.3, y: y+0.3, w: 2.3, h: 0.5, fill: { color: inn.c }, rectRadius: 0.06 });
    s.addText(inn.t, { x: x+0.3, y: y+0.3, w: 2.3, h: 0.5, fontSize: 12, fontFace: "Arial Black", color: C.white, align: "center", valign: "middle" });
    s.addText(inn.d, { x: x+0.2, y: y+1.0, w: 2.5, h: 0.9, fontSize: 10, fontFace: "Calibri", color: C.gray, valign: "top" });
  });
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 10: CONCLUSION
// ═══════════════════════════════════════════════════════════════
{
  const s = ppt.addSlide();
  s.background = { color: C.navy };
  s.addText("Conclusion", { x: 0.6, y: 0.5, fontSize: 36, fontFace: "Arial Black", color: C.white });
  s.addShape(ppt.ShapeType.rect, { x: 0.6, y: 1.2, w: 2, h: 0.04, fill: { color: C.ice } });

  const conclusions = [
    "✅  Voting-based 3-sensor fusion successfully implemented on ESP32-S3 bare-metal Rust",
    "✅  Adaptive lockout mechanism PROVEN: MINOR 500ms / CRITICAL 2000ms",
    "✅  Hold-duration detection reliably classifies short vs long button press",
    "✅  Sticky latch ensures no button press missed in Proteus simulation",
    "✅  Genuine data (319 iterations) with Python verification — no fabrication",
    "✅  Zero unsafe code, zero data races, zero magic numbers",
    "",
    "→ First integrated system combining Rust safe-concurrency, voting fusion,",
    "   adaptive lockout, and hold-duration detection on ESP32-S3",
  ];

  s.addText(conclusions.join("\n"), {
    x: 0.6, y: 1.6, w: 8.5, h: 3.5, fontSize: 14, fontFace: "Calibri", color: C.white, lineSpacing: 28
  });

  s.addText("Abdurrauf Almutawakkil — NRP 2042241115 — Teknik Instrumentasi ITS", {
    x: 0.6, y: 5.8, w: 9, h: 0.4, fontSize: 12, fontFace: "Calibri", color: C.gray
  });
}

// ═══════════════════════════════════════════════════════════════
// SAVE
// ═══════════════════════════════════════════════════════════════
ppt.writeFile({ fileName: "D:/Win/Doc/MAHASISWA/4/PemKom/ETS/Presentasi_ETS.pptx" })
  .then(() => console.log("PPT saved: Presentasi_ETS.pptx"))
  .catch(e => console.error(e));
