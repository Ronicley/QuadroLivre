#!/usr/bin/env python3
"""Generate the original app icon using only Python's standard library."""
import math
import pathlib
import struct
import zlib

SIZE = 1024

def segment(x, y, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    t = max(0, min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy)))
    return math.hypot(x - a[0] - t * dx, y - a[1] - t * dy)

path = [(235, 630), (270, 460), (350, 610), (420, 415), (475, 570)]
rows = []
for y in range(SIZE):
    row = bytearray([0])
    for x in range(SIZE):
        color = (247, 244, 232)
        if 135 < x < 890 and 160 < y < 865:
            color = (225, 222, 244)
        if 135 < x < 890 and 140 < y < 830:
            color = (255, 255, 255)
        if any(segment(x, y, a, b) < 24 for a, b in zip(path, path[1:])):
            color = (93, 81, 190)
        # Diagonal turquoise crayon with an orange paper band and wooden tip.
        u = (x - 690 + y - 440) / math.sqrt(2)
        v = (y - 440 - (x - 690)) / math.sqrt(2)
        if -270 < u < 210 and abs(v) < 57:
            color = (34, 177, 164)
            if abs(v) > 36:
                color = (22, 145, 141)
            if -175 < u < -110:
                color = (255, 188, 65)
        if 210 <= u <= 315 and abs(v) < (315 - u) * 57 / 105:
            color = (244, 203, 151) if u < 275 else (93, 81, 190)
        if math.hypot(x - 255, y - 240) < 22:
            color = (255, 103, 113)
        if math.hypot(x - 325, y - 240) < 22:
            color = (255, 191, 65)
        if math.hypot(x - 395, y - 240) < 22:
            color = (34, 177, 164)
        row.extend(color)
    rows.append(row)

def chunk(kind, data):
    return struct.pack('!I', len(data)) + kind + data + struct.pack('!I', zlib.crc32(kind + data) & 0xffffffff)

png = b'\x89PNG\r\n\x1a\n'
png += chunk(b'IHDR', struct.pack('!2I5B', SIZE, SIZE, 8, 2, 0, 0, 0))
png += chunk(b'IDAT', zlib.compress(b''.join(rows), 9))
png += chunk(b'IEND', b'')
output = pathlib.Path(__file__).resolve().parents[1] / 'Support' / 'AppIcon.png'
output.write_bytes(png)
print(output)
