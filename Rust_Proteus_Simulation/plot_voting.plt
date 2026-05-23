# ═══════════════════════════════════════════════════════════════════════════
# Plot 5: Voting Decision Matrix Heatmap (HIGH QUALITY, ALL TEXT LIGHT)
# ═══════════════════════════════════════════════════════════════════════════

set terminal pngcairo enhanced font "Arial,13" size 1300,600 background "#1e1e2e"
set output 'voting_heatmap.png'

set border lc rgb "#cdd6f4" lw 1.5
set tics textcolor rgb "#cdd6f4"
set grid lc rgb "#45475a" lt 1 lw 0.3

set multiplot layout 3,1 \
    title "{/:Bold Voting Decision Matrix: Per-Sensor Anomaly Detection}" \
    font "Arial,17" textcolor rgb "#89b4fa" \
    margins 0.12,0.88,0.10,0.88 spacing 0.0,0.04

set xrange [-1:62]

# ── Panel 1: Temperature ──────────────────────────────────────────────
set yrange [-0.2:1.4]
set ytics ("OK" 0, "ANOMALY" 1) textcolor rgb "#cdd6f4" font "Arial,11"
set ylabel "Temp (>80C)" textcolor rgb "#f9e2af" font "Arial,11"
unset xlabel
set format x ""

set key textcolor rgb "#cdd6f4" font "Arial,10" box lc rgb "#45475a" opaque top right

plot 'simulation_data.dat' using 1:($2>80?1:0) with filledcurves y=0 \
    lc rgb "#f9e2af" fs transparent solid 0.45 title "Temperature > 80 C", \
    '' using 1:($2>80?1:0) with steps lc rgb "#f9e2af" lw 2.5 notitle

set title ""

# ── Panel 2: Pressure ─────────────────────────────────────────────────
set ylabel "Pressure" textcolor rgb "#89b4fa" font "Arial,11"

plot 'simulation_data.dat' using 1:($3<900||$3>1200?1:0) with filledcurves y=0 \
    lc rgb "#89b4fa" fs transparent solid 0.45 title "Pressure outside [900,1200]", \
    '' using 1:($3<900||$3>1200?1:0) with steps lc rgb "#89b4fa" lw 2.5 notitle

# ── Panel 3: Vibration ────────────────────────────────────────────────
set format x "%g"
set xlabel "Iteration" textcolor rgb "#bac2de" font "Arial,12"
set ylabel "Vib (>500)" textcolor rgb "#a6e3a1" font "Arial,11"

plot 'simulation_data.dat' using 1:($4>500?1:0) with filledcurves y=0 \
    lc rgb "#a6e3a1" fs transparent solid 0.45 title "Vibration > 500", \
    '' using 1:($4>500?1:0) with steps lc rgb "#a6e3a1" lw 2.5 notitle

unset multiplot

print "Output saved: voting_heatmap.png"
