# Panduan Fix Diagram Blok (DB1.drawio.png)

File: Laporan/DB1.drawio.png

## Yang perlu diubah (2 edit saja):

### 1. GPIO2 → GPIO3
Di blok aktuator/valve, ubah teks:
```
GPIO2
```
menjadi:
```
GPIO3
```

### 2. Lockout 2000 ms → Adaptive Lockout
Di blok aktuator, ubah teks:
```
Lockout 2000 ms
```
menjadi:
```
Adaptive Lockout
(500 / 2000 ms)
```

## Cara edit:
1. Buka draw.io (app.diagrams.net)
2. File → Open → pilih DB1.drawio.png
3. Double-click teks yang mau diubah
4. File → Save
5. Export as PNG (File → Export as → PNG)
6. Timpa DB1.drawio.png lama

Done. Cuma 2 teks doang.
