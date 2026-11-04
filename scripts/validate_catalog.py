#!/usr/bin/env python3
"""Offline gate for current + archived assets, original sources and approvals."""
import ctypes as C
import hashlib
import json
from pathlib import Path
import struct
import sys
import zlib

from vector_art import bind, finish

root = Path(__file__).resolve().parents[1]
resources = root / 'Sources/QuadroLivre/Resources'
support = root / 'Support/Illustrations'
catalog = json.loads((resources / 'catalog-v1.json').read_text())
assert catalog['version'] in (1, 2)
assert catalog['stage'] in ('pilot-awaiting-approval', 'catalog-awaiting-approval', 'complete')
assert len(catalog['items']) == (6 if catalog['stage'] == 'pilot-awaiting-approval' else 100)
if catalog['stage'] != 'pilot-awaiting-approval':
    from collections import Counter
    assert {i['number'] for i in catalog['items']} == set(range(1,101))
    assert Counter(i['category'] for i in catalog['items']) == {c:10 for c in 'ABCDEFGHIJ'}
    assert Counter(i['complexity'] for i in catalog['items']) == dict(simple=40,intermediate=40,scene=20)
assert len({x['id'] for x in catalog['items']}) == len(catalog['items'])
assert len({x['id'] for x in catalog['categories']}) == 10
revisions = catalog['items'] + catalog.get('archivedItems', [])
assert len({(x['id'], x['assetVersion']) for x in revisions}) == len(revisions)

load_png = bind('image_surface_create_from_png', C.c_void_p, C.c_char_p)
get_data = bind('image_surface_get_data', C.c_void_p, C.c_void_p)
stride = bind('image_surface_get_stride', C.c_int, C.c_void_p)
status = bind('surface_status', C.c_int, C.c_void_p)
flush = bind('surface_flush', None, C.c_void_p)
seen = set()
totals = {1: 0, 2: 0}
for item in revisions:
    assert item['author'] and item['license']
    assert item['category'] in {c['id'] for c in catalog['categories']}
    assert set(item['variants']) == {'trace', 'coloring'}
    if item in catalog['items'] and catalog['version'] == 2:
        assert item['reviewStatus'] in ('approved-reference', 'awaiting-approval', 'approved')
        if catalog['stage'] == 'complete':
            assert item['reviewStatus'] == 'approved', 'Unreviewed artwork cannot be published as complete'
    for mode, variant in item['variants'].items():
        source = support / f'v{item["assetVersion"]}' / (variant['asset'] + '.svg')
        assert source.is_file(), source
        assert 'fill="none"' in source.read_text(), 'Coloring assets must not hide ink behind a white fill'
        for key, dimension in [('asset', 1536), ('thumbnail', 240)]:
            name = variant[key]
            assert all(c in 'abcdefghijklmnopqrstuvwxyz0123456789-' for c in name)
            path = resources / (name + '.png')
            data = path.read_bytes()
            totals[item['assetVersion']] += len(data)
            digest = hashlib.sha256(data).hexdigest()
            assert digest not in seen, f'Duplicate: {name}'
            seen.add(digest)
            assert data[:8] == b'\x89PNG\r\n\x1a\n'
            offset = 8
            compressed = b''
            ended = False
            while offset < len(data):
                length, = struct.unpack('>I', data[offset:offset+4])
                kind = data[offset+4:offset+8]
                payload = data[offset+8:offset+8+length]
                crc, = struct.unpack('>I', data[offset+8+length:offset+12+length])
                assert zlib.crc32(kind + payload) == crc
                if kind == b'IHDR':
                    w,h,depth,color,*_ = struct.unpack('>IIBBBBB', payload)
                    assert (w,h,depth,color) == (dimension,dimension,8,6), name
                if kind == b'IDAT': compressed += payload
                if kind == b'IEND': ended = True
                offset += 12 + length
            assert ended and offset == len(data)
            assert len(zlib.decompress(compressed)) == dimension * (1 + dimension * 4)
            # Decode with Cairo to check actual alpha and safe transparent borders.
            image = load_png(str(path).encode())
            try:
                assert status(image) == 0
                flush(image)
                row = stride(image)
                pixels = C.string_at(get_data(image), row * dimension)
                alpha_offset = 3 if sys.byteorder == 'little' else 0
                alpha = pixels[alpha_offset::4]
                assert min(alpha) == 0 and max(alpha) > 0, 'Empty or opaque placeholder'
                if item['assetVersion'] == 2 and key == 'thumbnail' and mode == 'trace':
                    assert 100 <= max(alpha) <= 102, 'Trace contrast must be applied to the whole layer, not per path'
                assert .001 < sum(a > 0 for a in alpha) / len(alpha) < .2, 'Unexpected outline density'
                assert not any(alpha[:dimension]) and not any(alpha[-dimension:]), 'Clipped art'
                assert not any(alpha[::dimension]) and not any(alpha[dimension-1::dimension]), 'Clipped art'
            finally:
                finish(image)

if catalog['version'] == 2:
    # Exact artwork once used in a saved board is never silently replaced.
    baseline = json.loads((support / 'legacy-asset-sha256.json').read_text())
    for name, sha in baseline.items():
        assert hashlib.sha256((resources / name).read_bytes()).hexdigest() == sha, name
    archive = json.loads((support / 'catalog-v1-archive.json').read_text())
    assert archive['items'] == catalog['archivedItems'], 'Legacy links must remain exact'
    frozen = json.loads((support / 'v2-art-sha256.json').read_text())
    for relative, sha in frozen.items():
        assert hashlib.sha256((root / relative).read_bytes()).hexdigest() == sha, relative
    approval = json.loads((support / 'review-natural-cat-v2/approval.json').read_text())
    for mode in ('trace', 'coloring'):
        sha = approval['sources'][f'cat-natural-v2-{mode}.svg']
        assert hashlib.sha256((support / f'v2/cat-seated-v2-{mode}.svg').read_bytes()).hexdigest() == sha

print(f'Validated {len(catalog["items"])} current pairs + {len(catalog.get("archivedItems", []))} archived pairs, {len(seen)} transparent PNGs.')
for version, size in totals.items():
    if size:
        print(f'  V{version} PNGs: {size / 1024 / 1024:.2f} MiB')
if catalog['stage'] != 'pilot-awaiting-approval':
    frozen = json.loads((support / 'full-catalog-art-sha256.json').read_text())
    assert len(frozen) == 400
    for relative, sha in frozen.items():
        assert hashlib.sha256((root / relative).read_bytes()).hexdigest() == sha, relative
    # Check every local HTML/image link in the review catalog, without a server.
    from html.parser import HTMLParser
    class Links(HTMLParser):
        def handle_starttag(self, tag, attrs):
            for key,value in attrs:
                if key in ('href','src') and value and not value.startswith('#'):
                    target = value.split('#')[0]
                    assert (self.base / target).is_file(), f'Broken review link: {target}'
    pages = list((support/'review-100').glob('*.html'))
    assert len(pages) == 101
    for page in pages:
        parser = Links(); parser.base = page.parent; parser.feed(page.read_text())
    print('Validated all 100 review pages and their offline links; 400 source/runtime hashes locked.')
    print('Full 100-theme assets measured above; device memory, gestures and final user approval remain pending.')
else:
    print('Pilot measurement only; full 100-theme bundle and device performance remain pending.')
