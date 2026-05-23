# ═══════════════════════════════════════════════════════════════════════════
# Plot 2: Detailed Fault Detection Latency Analysis (HIGH QUALITY)
# ═══════════════════════════════════════════════════════════════════════════

set terminal pngcairo enhanced font "Arial,13" size 1200,650 background "#1e1e2e"
set output 'latency_analysis.png'

set border lc rgb "#cdd6f4" lw 1.5
set grid lc rgb "#45475a" lt 1 lw 0.5
set key textcolor rgb "#cdd6f4" font "Arial,11" box lc rgb "#45475a" opaque top left
set tics textcolor rgb "#cdd6f4"

set tmargin 4
set bmargin 4
set lmargin 10
set rmargin 6

set title "{/:Bold Fault Detection Latency per Event}" font "Arial,17" textcolor rgb "#89b4fa"
set xlabel "Iteration (fault event)" textcolor rgb "#bac2de" font "Arial,12"
set ylabel "Latency (us)" textcolor rgb "#bac2de" font "Arial,12"

set yrange [0:22]
set xrange [-1:62]

# Safety threshold - IEC 61508
set arrow 1 from -1,5 to 62,5 nohead lc rgb "#f38ba8" lw 2 dt 2
set label 1 "IEC 61508 Safety Threshold (5 us)" at 32,3.2 textcolor rgb "#f38ba8" font "Arial,10"

# Mean measured latency
set arrow 2 from -1,15 to 62,15 nohead lc rgb "#a6e3a1" lw 2 dt 4
set label 2 "Mean Measured: 15 us (MicroPython VM)" at 32,17 textcolor rgb "#a6e3a1" font "Arial,10"

# Projected Rust performance
set arrow 3 from -1,1 to 62,1 nohead lc rgb "#89dceb" lw 1.5 dt 3
set label 3 "Projected Rust bare-metal: ~1 us" at 32,2 textcolor rgb "#89dceb" font "Arial,9"

# Overhead analysis box - positioned in empty area
set object 1 rect from 36,8 to 60,14 fc rgb "#313244" fs solid 0.95 behind
set label 4 "Overhead Analysis:" at 48,13 center textcolor rgb "#f9e2af" font "Arial,10"
set label 5 "MicroPython ticks_us() = 15 us" at 48,11.5 center textcolor rgb "#cdd6f4" font "Arial,9"
set label 6 "Rust TIMG0 HW timer    = ~1 us" at 48,10 center textcolor rgb "#cdd6f4" font "Arial,9"
set label 7 "Overhead ratio: 15x" at 48,8.7 center textcolor rgb "#fab387" font "Arial,10"

# Plot fault event latencies as impulses
plot 'simulation_data.dat' using 1:($6==1 ? $5 : 1/0) with impulses \
        lc rgb "#89b4fa" lw 5 title "Measured Latency (FAULT events)", \
     '' using 1:($6==1 ? $5 : 1/0) with points \
        lc rgb "#f5c2e7" pt 7 ps 1.8 title "Data Points (15 us each)"

print "Output saved: latency_analysis.png"
