# ═══════════════════════════════════════════════════════════════════════════
# Plot 1: Multi-Sensor Fusion — 3-Panel Overview (HIGH QUALITY)
# ═══════════════════════════════════════════════════════════════════════════

set terminal pngcairo enhanced font "Arial,13" size 1400,1000 background "#1e1e2e"
set output 'sensor_fusion_analysis.png'

# Global style
set border lc rgb "#cdd6f4" lw 1.5
set grid lc rgb "#45475a" lt 1 lw 0.5
set key textcolor rgb "#cdd6f4" font "Arial,11" box lc rgb "#45475a" opaque
set tics textcolor rgb "#cdd6f4"

set multiplot layout 3,1 title "{/:Bold Safe-Concurrency Multi-Sensor Fusion --- ESP32 Rust}" \
    font "Arial,18" textcolor rgb "#cdd6f4" \
    margins 0.10,0.92,0.08,0.92 spacing 0.0,0.04

# ══════════════════════════════════════════════════════════════════════════
# Panel 1: Multi-Sensor Readings
# ══════════════════════════════════════════════════════════════════════════
set title "Panel 1: Multi-Sensor Readings" textcolor rgb "#f9e2af" font "Arial,13"
set ylabel "Sensor Value" textcolor rgb "#bac2de"
set yrange [0:120]
set xrange [0:60]
unset xlabel
set format x ""

set arrow 1 from 0,80 to 60,80 nohead lc rgb "#f38ba8" lw 2 dt 2
set label 1 "Temp Threshold (80 C)" at 45,87 textcolor rgb "#f38ba8" font "Arial,10"

plot 'simulation_data.dat' using 1:2 with linespoints \
        lc rgb "#f9e2af" lw 2.5 pt 7 ps 0.7 title "Temperature (C)", \
     '' using 1:($4/100.0) with linespoints \
        lc rgb "#a6e3a1" lw 2.5 pt 9 ps 0.7 title "Vibration (Capped/100)"

unset arrow 1
unset label 1

# ══════════════════════════════════════════════════════════════════════════
# Panel 2: Fault Recovery Latency
# ══════════════════════════════════════════════════════════════════════════
set title "Panel 2: Fault Recovery Latency (Detection -> Actuator)" textcolor rgb "#a6e3a1" font "Arial,13"
set ylabel "Latency (us)" textcolor rgb "#bac2de"
set yrange [0:20]

set arrow 2 from 0,5 to 60,5 nohead lc rgb "#f38ba8" lw 2 dt 2
set label 2 "Safety Threshold (5 us)" at 45,6.8 textcolor rgb "#f38ba8" font "Arial,10"

plot 'simulation_data.dat' using 1:5 with impulses \
        lc rgb "#89b4fa" lw 3.5 title "Latency (us)", \
     '' using 1:5 with points \
        lc rgb "#f5c2e7" pt 7 ps 1.0 title "Measured Points"

unset arrow 2
unset label 2

# ══════════════════════════════════════════════════════════════════════════
# Panel 3: System Status Timeline
# ══════════════════════════════════════════════════════════════════════════
set title "Panel 3: System Status Timeline" textcolor rgb "#89b4fa" font "Arial,13"
set ylabel "Status Code" textcolor rgb "#bac2de"
set xlabel "Iteration" textcolor rgb "#bac2de"
set format x "%g"
set yrange [-0.3:3.5]
set ytics ("NORMAL" 0, "FAULT" 1, "LOCKOUT" 2, "CLEARED" 3) textcolor rgb "#cdd6f4"

plot 'simulation_data.dat' using 1:6 with steps \
        lc rgb "#fab387" lw 3 title "System State", \
     '' using 1:6 with points \
        lc rgb "#f5c2e7" pt 7 ps 0.7 notitle

unset multiplot

print "Output saved: sensor_fusion_analysis.png"
print "3 panels generated: Sensors, Latency, Status Timeline"
