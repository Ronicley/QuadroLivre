#!/usr/bin/env python3
"""100 original themes / 200 presentations. Offline, immutable shipped versions.
Creates batches of 20 and review sheets; generation does NOT assert final approval.
"""
from collections import Counter
from copy import deepcopy
import hashlib
from html import escape
import json
import sys
from pathlib import Path

import catalog_animals, catalog_nature, catalog_travel, catalog_food
import catalog_fantasy, catalog_play, catalog_adventures, catalog_cozy
from catalog_shapes import ART
from vector_art import paths_from_svg, rasterize, source, bind, surface, create, color, paint, paint_alpha, source_surface, destroy, finish, png, C, P, D

ROOT = Path(__file__).resolve().parents[1]
RES = ROOT / 'Sources/QuadroLivre/Resources'
SUP = ROOT / 'Support/Illustrations'
REVIEW = SUP / 'review-100'
SOURCES = SUP / 'v2'
REVIEW.mkdir(exist_ok=True)
manifest_path = RES / 'catalog-v1.json'
pilot_path = SUP / 'catalog-v2-pilot.json'
if not pilot_path.exists():
    current = json.loads(manifest_path.read_text())
    assert current['version'] == 2 and len(current['items']) == 6
    pilot_path.write_bytes(manifest_path.read_bytes())
pilot = json.loads(pilot_path.read_text())
assert len(pilot['items']) == 6
pilot_numbers = {1:'cat-seated',32:'child-rabbit',41:'dollhouse',51:'air-adventure',63:'cat-reading',71:'smiling-car'}
assert set(ART) | set(pilot_numbers) == set(range(1,101)) and len(ART) == 94
approval = json.loads((SUP / 'pilot-approval.json').read_text())
assert set(approval['approvedThemeIDs']) == set(pilot_numbers.values())

# Approximately 40/40/20 complexity distribution, declared per composition.
SCENES = {7,8,10,31,33,35,37,38,39,40,41,42,43,47,49,59,60,64,69,100}
SIMPLE = {1,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,71,75,76,77,79,81,82,83,84,85,89,91,92,93,94,95,96,97,98}
assert len(SCENES)==20 and len(SIMPLE)==40 and not SCENES & SIMPLE
manifest = deepcopy(pilot)
manifest['stage'] = 'catalog-awaiting-approval'
manifest['items'] = []
frozen_path = SUP / 'full-catalog-art-sha256.json'
frozen = json.loads(frozen_path.read_text()) if frozen_path.exists() else {}
if '--revise-unshipped' in sys.argv:
    assert not (SUP/'catalog-100-release.json').exists(), 'Already installed: use a new asset version instead'
    assert '--freeze' in sys.argv, 'Explicitly renew the pre-release lock after corrections'
    frozen = {}

for number in range(1,101):
    if number in pilot_numbers:
        item = deepcopy(next(i for i in pilot['items'] if i['id']==pilot_numbers[number]))
        item['reviewStatus'] = 'approved'
    else:
        art = ART[number]
        item = {k:art[k] for k in ('id','title','category')}
        item.update(assetVersion=2, aspectRatio=1,
                    author='Quadro Livre — curvas vetoriais originais elaboradas pelo assistente (IA)',
                    license='Uso, alteração e distribuição permitidos com o aplicativo; sem material de terceiros.',
                    reviewStatus='awaiting-approval', variants={})
        for mode in ('trace','coloring'):
            paths = art['base'] if mode=='trace' else art['base']+art['details']
            stem = f'{item["id"]}-v2-{mode}'
            svg = source(item['title']+' — versão 2, '+mode, paths)
            source_path = SOURCES / (stem+'.svg')
            key = str(source_path.relative_to(ROOT))
            sha = hashlib.sha256(svg.encode()).hexdigest()
            assert key not in frozen or frozen[key]==sha, 'Published art changed: create a new version, do not overwrite '+stem
            source_path.write_text(svg)
            rasterize(paths, RES / (stem+'.png'),1536)
            rasterize(paths, RES / (stem+'-thumb.png'),240,opacity=.4 if mode=='trace' else 1)
            item['variants'][mode] = dict(asset=stem,thumbnail=stem+'-thumb')
    item['number'] = number
    item['complexity'] = 'scene' if number in SCENES else 'simple' if number in SIMPLE else 'intermediate'
    manifest['items'].append(item)
    # Separate high-resolution preview pages, lazy loaded only for selected theme.
    for mode,variant in item['variants'].items():
        paths = paths_from_svg((SOURCES / (variant['asset']+'.svg')).read_text())
        rasterize(paths, REVIEW / (variant['asset']+'-preview.png'),1080,opacity=.4 if mode=='trace' else 1,white=True)
    if number%20==0:
        print(f'Produced batch {number//20}: themes {number-19}–{number}')

assert Counter(i['category'] for i in manifest['items']) == {c:10 for c in 'ABCDEFGHIJ'}
assert Counter(i['complexity'] for i in manifest['items']) == dict(simple=40,intermediate=40,scene=20)
assert len({i['id'] for i in manifest['items']}) == 100
hashes={}
for item in manifest['items']:
    for variant in item['variants'].values():
        for path in (SOURCES/(variant['asset']+'.svg'),RES/(variant['asset']+'.png')):
            hashes[str(path.relative_to(ROOT))]=hashlib.sha256(path.read_bytes()).hexdigest()
if frozen:
    assert hashes==frozen, 'Published runtime assets changed'
elif '--freeze' in sys.argv:
    frozen_path.write_text(json.dumps(hashes,indent=2)+'\n')
else:
    (SUP/'draft-catalog-art-sha256.json').write_text(json.dumps(hashes,indent=2)+'\n')
for baseline in ('legacy-asset-sha256.json','v2-art-sha256.json'):
    for name,sha in json.loads((SUP/baseline).read_text()).items():
        path = RES/name if baseline.startswith('legacy') else ROOT/name
        assert hashlib.sha256(path.read_bytes()).hexdigest()==sha, 'Old board asset modified'
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')

# Contact sheets for manual inspection: 20 themes per batch, both presentations.
load_png = bind('image_surface_create_from_png',P,C.c_char_p)
translate = bind('translate',None,P,D,D)
resize = bind('scale',None,P,D,D)
save = bind('save',None,P); restore=bind('restore',None,P)
font = bind('set_font_size',None,P,D)
move=bind('move_to',None,P,D,D)
text=bind('show_text',None,P,C.c_char_p)
for start in range(0,100,20):
    for mode in ('trace','coloring'):
        s=surface(0,1200,1040); ctx=create(s)
        color(ctx,1,1,1,1); paint(ctx)
        for index,item in enumerate(manifest['items'][start:start+20]):
            image=load_png(str(RES/(item['variants'][mode]['thumbnail']+'.png')).encode())
            x=(index%5)*240; y=(index//5)*260
            save(ctx); translate(ctx,x,y); source_surface(ctx,image,0,0); paint(ctx); restore(ctx); finish(image)
            color(ctx,.1,.1,.1,1); font(ctx,13); move(ctx,x+12,y+249)
            title=f'{item["number"]:02} '+item['title']
            text(ctx,(title[:30]+'…' if len(title)>30 else title).encode())
        assert png(s,str(REVIEW/f'batch-{start//20+1}-{mode}.png').encode())==0
        destroy(ctx); finish(s)

style='<style>body{font:18px system-ui;background:#edf0f4;color:#20252c;margin:24px}main{max-width:1200px;margin:auto}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:20px}article{background:white;padding:16px;border-radius:20px}img{width:100%;height:auto}.pair{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:24px}a{color:#303fa0}h3{font-size:18px}</style>'
links=[]
for category in manifest['categories']:
    cards=[]
    for item in manifest['items']:
        if item['category']!=category['id']:continue
        filename=item['id']+'.html'
        detail='<div class="pair">'+''.join('<article><h2>'+('Seguir contorno' if mode=='trace' else 'Colorir')+'</h2><img src="'+v['asset']+'-preview.png" alt="'+escape(item['title'])+'"></article>' for mode,v in item['variants'].items())+'</div>'
        (REVIEW/filename).write_text('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width">'+style+'<main><a href="index.html#'+category['id']+'">← Catálogo</a><h1>'+str(item['number'])+'. '+escape(item['title'])+'</h1><p>Dois modos • '+item['complexity']+' • '+('Piloto aprovado' if item['reviewStatus']=='approved' else 'Arte nova: aprovação final pendente')+'</p>'+detail+'</main></html>')
        cards.append('<article><a href="'+filename+'"><img loading="lazy" src="../../../Sources/QuadroLivre/Resources/'+item['variants']['coloring']['thumbnail']+'.png" alt="'+escape(item['title'])+'"><h3>'+str(item['number'])+'. '+escape(item['title'])+'</h3></a></article>')
    links.append('<section id="'+category['id']+'"><h2>'+escape(category['title'])+'</h2><div class="grid">'+''.join(cards)+'</div></section>')
(REVIEW/'index.html').write_text('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Quadro Livre — 100 temas</title>'+style+'<main><h1>100 temas originais</h1><p>Toque numa miniatura para comparar as duas apresentações. Seis pilotos aprovados; 94 novas artes para revisão final. Nada substitui a arte dos quadros já salvos.</p><nav>'+ ' · '.join('<a href="#'+c['id']+'">'+escape(c['title'])+'</a>' for c in manifest['categories'])+'</nav>'+''.join(links)+'</main></html>')
print('Generated 100 themes / 200 activities / 400 runtime PNGs, plus retained old assets.')
print('Review: Support/Illustrations/review-100/index.html')
