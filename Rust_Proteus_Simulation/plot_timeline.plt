# ═══════════════════════════════════════════════════════════════════════════
# Plot 3: System State Timeline with Color-Coded Regions (HIGH QUALITY)
# ═══════════════════════════════════════════════════════════════════════════

set terminal pngcairo enhanced font "Arial,13" size 1400,500 background "#1e1e2e"
set output 'state_timeline.png'

set border lc rgb "#cdd6f4" lw 1.5
set grid lc rgb "#45475a" lt 1 lw 0.5
set tics textcolor rgb "#cdd6f4"

set tmargin 4
set bmargin 4
set lmargin 10
set rmargin 4

set title "{/:Bold System State Timeline (Color-Coded Regions)}" font "Arial,17" textcolor rgb "#89b4fa"
set xlabel "Iteration (x500ms = real time)" textcolor rgb "#bac2de" font "Arial,12"
set ylabel "Status" textcolor rgb "#bac2de" font "Arial,12"
set yrange [-0.5:3.8]
set xrange [-1:62]
set ytics ("NORMAL" 0, "FAULT" 1, "LOCKOUT" 2, "CLEARED" 3) textcolor rgb "#cdd6f4" font "Arial,11"

# Color-coded background regions
set object 1 rect from -1,-0.5 to 11.5,3.8 fc rgb "#a6e3a1" fs transparent solid 0.12 behind
set label 10 "NORMAL PHASE" at 5,3.5 center textcolor rgb "#a6e3a1" font "Arial,10"

set object 2 rect from 11.5,-0.5 to 16.5,3.8 fc rgb "#f38ba8" fs transparent solid 0.12 behind
set label 11 "CYCLE 1" at 14,3.5 center textcolor rgb "#f38ba8" font "Arial,9"

set object 3 rect from 16.5,-0.5 to 21.5,3.8 fc rgb "#fab387" fs transparent solid 0.08 behind
set object 4 rect from 21.5,-0.5 to 26.5,3.8 fc rgb "#f38ba8" fs transparent solid 0.12 behind
set object 5 rect from 26.5,-0.5 to 31.5,3.8 fc rgb "#fab387" fs transparent solid 0.08 behind
set object 6 rect from 31.5,-0.5 to 36.5,3.8 fc rgb "#f38ba8" fs transparent solid 0.12 behind
set object 7 rect from 36.5,-0.5 to 41.5,3.8 fc rgb "#fab387" fs transparent solid 0.08 behind
set object 8 rect from 41.5,-0.5 to 46.5,3.8 fc rgb "#f38ba8" fs transparent solid 0.12 behind
set object 9 rect from 46.5,-0.5 to 51.5,3.8 fc rgb "#fab387" fs transparent solid 0.08 behind
set object 10 rect from 51.5,-0.5 to 56.5,3.8 fc rgb "#f38ba8" fs transparent solid 0.12 behind
set object 11 rect from 56.5,-0.5 to 62,3.8 fc rgb "#fab387" fs transparent solid 0.08 behind

set label 12 "Repeating fault-lockout cycles (button held)" at 40,3.5 center textcolor rgb "#fab387" font "Arial,10"

set key textcolor rgb "#cdd6f4" font "Arial,11" box lc rgb "#45475a" opaque bottom right

plot 'simulation_data.dat' using 1:6 with steps \
        lc rgb "#f9e2af" lw 3 title "State Transition", \
     '' using 1:6 with points \
        lc rgb "#cdd6f4" pt 7 ps 0.9 notitle

print "Output saved: state_timeline.png"
