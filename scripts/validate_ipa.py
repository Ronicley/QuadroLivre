#!/usr/bin/env python3
"""Validate the actual packaged app, not only the source Resources folder."""
import hashlib
import json
from pathlib import Path
import plistlib
import sys
from zipfile import ZipFile

root = Path(__file__).resolve().parents[1]
ipa = Path(sys.argv[1]) if len(sys.argv)>1 else root/'xtool/QuadroLivre.ipa'
with ZipFile(ipa) as archive:
    assert archive.testzip() is None, 'Damaged IPA archive'
    names = archive.namelist()
    manifest_names = [n for n in names if n.endswith('/catalog-v1.json')]
    assert len(manifest_names)==1
    prefix = manifest_names[0].removesuffix('catalog-v1.json')
    manifest = json.loads(archive.read(manifest_names[0]))
    assert len(manifest['items'])==100 and len(manifest['archivedItems'])==6
    source_manifest = root/'Sources/QuadroLivre/Resources/catalog-v1.json'
    assert archive.read(manifest_names[0])==source_manifest.read_bytes(), 'Stale bundled manifest'
    expected=set()
    for item in manifest['items']+manifest['archivedItems']:
        for variant in item['variants'].values():
            for field in ('asset','thumbnail'):
                filename=variant[field]+'.png'
                expected.add(filename)
    legacy=json.loads((root/'Support/Illustrations/legacy-asset-sha256.json').read_text())
    expected.update(legacy)
    for filename in expected:
        content=archive.read(prefix+filename)
        original=(root/'Sources/QuadroLivre/Resources'/filename).read_bytes()
        assert hashlib.sha256(content).digest()==hashlib.sha256(original).digest(), filename
    info_name = next(n for n in names if n.endswith('.app/Info.plist'))
    info=plistlib.loads(archive.read(info_name))
    assert info['CFBundleShortVersionString']=='1.2.0'
    assert info['CFBundleVersion']=='120'
    print(f'IPA validated: {len(expected)} drawing PNGs, 100 themes, current + legacy data links, version 1.2.0 (120).')
    print(f'IPA {ipa.stat().st_size/1024**2:.2f} MiB; unpacked files {sum(i.file_size for i in archive.infolist())/1024**2:.2f} MiB.')
