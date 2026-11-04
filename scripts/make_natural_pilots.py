#!/usr/bin/env python3
"""Integrate the approved cat and five new review pairs, preserving all V1 assets.
Never produces the remaining 94 illustrations or marks unreviewed art approved.
"""
from copy import deepcopy
import hashlib
from html import escape
import json
from pathlib import Path

from natural_pilot_art import PILOTS
from vector_art import paths_from_svg, rasterize, source

ROOT = Path(__file__).resolve().parents[1]
current_manifest = ROOT / 'Sources/QuadroLivre/Resources/catalog-v1.json'
if current_manifest.exists() and len(json.loads(current_manifest.read_text())['items']) > 6:
    raise SystemExit('Catálogo de 100 já integrado. Use make_full_catalog.py; o catálogo não foi alterado.')
RESOURCES = ROOT / 'Sources/QuadroLivre/Resources'
SUPPORT = ROOT / 'Support/Illustrations'
SOURCES = SUPPORT / 'v2'
REVIEW = SUPPORT / 'review-natural-pilots-v2'
APPROVED = SUPPORT / 'review-natural-cat-v2'
for directory in (SOURCES, REVIEW):
    directory.mkdir(parents=True, exist_ok=True)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


# Archive the shipped catalog exactly once; subsequent generation must retain it.
archive_path = SUPPORT / 'catalog-v1-archive.json'
manifest_path = RESOURCES / 'catalog-v1.json'
if not archive_path.exists():
    original = json.loads(manifest_path.read_text())
    assert original['version'] == 1, 'Cannot invent an archive after replacing the catalog'
    archive_path.write_bytes(manifest_path.read_bytes())
archive = json.loads(archive_path.read_text())
assert archive['version'] == 1 and len(archive['items']) == 6
baseline = SUPPORT / 'legacy-asset-sha256.json'
legacy_names = [variant[key]+'.png' for item in archive['items']
                for variant in item['variants'].values() for key in ('asset', 'thumbnail')]
legacy_names += [name+'-v1.png' for name in ('cat','dog','house','car','flower','butterfly')]
legacy_hashes = {name: digest(RESOURCES / name) for name in sorted(legacy_names)}
if baseline.exists():
    assert json.loads(baseline.read_text()) == legacy_hashes, 'Legacy asset was modified'
else:
    baseline.write_text(json.dumps(legacy_hashes, indent=2)+'\n')

approval = json.loads((APPROVED / 'approval.json').read_text())
assert approval['status'] == 'approved-as-visual-reference'
for name, sha in approval['sources'].items():
    assert digest(APPROVED / name) == sha, 'Approved cat geometry has changed: request a new review'

frozen_path = SUPPORT / 'v2-art-sha256.json'
frozen = json.loads(frozen_path.read_text()) if frozen_path.exists() else {}
manifest = dict(version=2, stage='pilot-awaiting-approval', categories=archive['categories'],
                items=[], archivedItems=deepcopy(archive['items']))
for old in archive['items']:
    item = deepcopy(old)
    item['assetVersion'] = 2
    item['reviewStatus'] = 'approved-reference' if item['id'] == 'cat-seated' else 'awaiting-approval'
    item['complexity'] = 'scene' if item['id'] in ('dollhouse', 'cat-reading') else 'intermediate'
    item['author'] = 'Quadro Livre — curvas vetoriais originais elaboradas pelo assistente (IA)'
    item['variants'] = {}
    for mode in ('trace', 'coloring'):
        stem = f'{item["id"]}-v2-{mode}'
        if item['id'] == 'cat-seated':
            # Copy approved source byte-for-byte, not an approximation/redraw.
            svg = (APPROVED / f'cat-natural-v2-{mode}.svg').read_text()
            paths = paths_from_svg(svg)
        else:
            base, details = PILOTS[item['id']]
            paths = base if mode == 'trace' else base + details
            svg = source(item['title']+' — versão 2, '+mode, paths)
        source_key = str((SOURCES / (stem+'.svg')).relative_to(ROOT))
        if source_key in frozen:
            assert hashlib.sha256(svg.encode()).hexdigest() == frozen[source_key], 'Shipped V2 geometry is frozen; create a new asset version'
        (SOURCES / (stem+'.svg')).write_text(svg)
        rasterize(paths, RESOURCES / (stem+'.png'), 1536)
        opacity = .4 if mode == 'trace' else 1
        rasterize(paths, RESOURCES / (stem+'-thumb.png'), 240, opacity=opacity)
        rasterize(paths, REVIEW / (stem+'-preview.png'), 1080, opacity=opacity, white=True)
        item['variants'][mode] = dict(asset=stem, thumbnail=stem+'-thumb')
    manifest['items'].append(item)
current_hashes = {}
for item in manifest['items']:
    for variant in item['variants'].values():
        for path in (SOURCES / (variant['asset']+'.svg'), RESOURCES / (variant['asset']+'.png')):
            current_hashes[str(path.relative_to(ROOT))] = digest(path)
if frozen:
    assert current_hashes == frozen, 'Shipped V2 artwork must be preserved'
else:
    frozen_path.write_text(json.dumps(current_hashes, indent=2)+'\n')
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')

cards = []
for item in manifest['items']:
    label = 'Referência aprovada pelo responsável' if item['reviewStatus']=='approved-reference' else 'Nova amostra — aguardando aprovação'
    cards.append('<section><h2>'+escape(item['title'])+'</h2><p>'+label+'</p><div class="pair">'+''.join(
        '<article><h3>'+('Seguir contorno' if mode=='trace' else 'Colorir')+'</h3><img loading="lazy" src="'+item['variants'][mode]['asset']+'-preview.png" alt="'+escape(item['title'])+'"></article>' for mode in ('trace','coloring'))+'</div></section>')
(REVIEW / 'index.html').write_text('''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Quadro Livre — pilotos de proporções naturais</title>
<style>body{font:18px system-ui;background:#edf0f4;color:#20252c;margin:24px}main{max-width:1120px;margin:auto}.pair{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:24px}section{margin:40px 0}article{background:white;border-radius:20px;padding:16px}img{width:100%;height:auto}h3{text-align:center}</style>
<main><h1>Seis pares — nova direção visual</h1><p>Gato aprovado como referência; cinco novos pares aguardam sua revisão. A geração dos outros 94 temas continua bloqueada. Essas imagens já estão disponíveis para novos quadros no build piloto; nenhum quadro antigo teve sua arte substituída.</p>'''+''.join(cards)+'</main></html>\n')
print('Integrated 6 V2 pairs; retained 6 archived V1 pairs and all V1.1 templates.')
print('Review: '+str(REVIEW.relative_to(ROOT) / 'index.html'))
