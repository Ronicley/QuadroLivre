#!/usr/bin/env python3
"""Resize the original, filter-0 RGB app icon without external dependencies."""
import pathlib
import struct
import zlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
source = ROOT / "Support" / "AppIcon.png"
data = source.read_bytes()
assert data[:8] == b"\x89PNG\r\n\x1a\n", "Invalid source PNG"
offset, compressed = 8, bytearray()
while offset < len(data):
    length = struct.unpack_from("!I", data, offset)[0]
    kind = data[offset + 4:offset + 8]
    payload = data[offset + 8:offset + 8 + length]
    if kind == b"IHDR":
        width, height, depth, color, compression, filtering, interlace = struct.unpack("!2I5B", payload)
        assert (depth, color, compression, filtering, interlace) == (8, 2, 0, 0, 0), "Unsupported source PNG"
    if kind == b"IDAT":
        compressed.extend(payload)
    offset += length + 12
pixels = zlib.decompress(compressed)
stride = width * 3 + 1
assert len(pixels) == stride * height
assert all(pixels[y * stride] == 0 for y in range(height)), "Source needs a PNG decoder for nonzero filters"


def chunk(kind, payload):
    return struct.pack("!I", len(payload)) + kind + payload + struct.pack("!I", zlib.crc32(kind + payload) & 0xffffffff)


output = ROOT / "web" / "public" / "icons"
output.mkdir(parents=True, exist_ok=True)
for size, name in [(192, "icon-192.png"), (512, "icon-512.png"), (180, "apple-touch-icon.png")]:
    rows = bytearray()
    for y in range(size):
        rows.append(0)
        for x in range(size):
            # Average source area to keep the original diagonal edges smooth.
            x0, x1 = x * width // size, (x + 1) * width // size
            y0, y1 = y * height // size, (y + 1) * height // size
            samples = [pixels[sy * stride + 1 + sx * 3:sy * stride + 4 + sx * 3]
                       for sy in range(y0, y1) for sx in range(x0, x1)]
            rows.extend(round(sum(sample[channel] for sample in samples) / len(samples)) for channel in range(3))
    assert len(rows) == size * (size * 3 + 1)
    png = (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack("!2I5B", size, size, 8, 2, 0, 0, 0))
           + chunk(b"tEXt", b"impeccable:prompt\0Origin: Support/AppIcon.png, original artwork produced by scripts/make_icon.py. "
                   b"Resized by web/scripts/make_icons.py; no generated-image prompt or third-party source.")
           + chunk(b"IDAT", zlib.compress(rows, 9)) + chunk(b"IEND", b""))
    (output / name).write_bytes(png)
    assert struct.unpack_from("!2I", png, 16) == (size, size)
    print(output / name)
