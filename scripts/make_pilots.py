#!/usr/bin/env python3
"""Six original pilot pairs only. Production of the other 94 requires approval."""
import runpy, json
from pathlib import Path
manifest_path = Path(__file__).resolve().parents[1] / 'Sources/QuadroLivre/Resources/catalog-v1.json'
if manifest_path.exists() and json.loads(manifest_path.read_text()).get('version', 1) > 1:
    raise SystemExit('V1 congelada: use make_natural_pilots.py. O catálogo atual não foi alterado.')
m = runpy.run_path(str(Path(__file__).with_name('make_templates.py')))
globals().update({k:v for k,v in m.items() if not k.startswith('__')})
source = root / 'Support/Illustrations/v1'
source.mkdir(parents=True, exist_ok=True)
def box(x,y,w,h): return f'M {x} {y} L {x+w} {y} L {x+w} {y+h} L {x} {y+h} Z'
def face(x,y): return [oval(x-17,y,3,5),oval(x+17,y,3,5),f'M {x-12} {y+16} C {x-4} {y+24} {x+4} {y+24} {x+12} {y+16}']
cat = ['M 185 265 C 155 315 155 385 185 425 L 345 425 C 375 385 375 315 345 265 Z','M 180 185 L 180 100 L 240 145 C 260 140 280 140 300 145 L 360 100 L 360 185 C 390 285 150 285 180 185 Z',*face(270,200),'M 205 370 L 205 425 M 325 370 L 325 425','M 355 390 C 445 410 455 300 405 315 C 385 325 410 350 395 365']
child = [oval(215,145,55,60),*face(215,145),'M 175 205 L 255 205 L 280 345 L 155 345 Z','M 175 225 C 120 240 115 285 155 290 M 255 225 C 290 225 300 260 320 265','M 175 345 L 175 430 L 210 430 L 215 355 L 230 430 L 265 430 L 250 345','M 325 300 C 285 375 425 375 385 300', 'M 320 245 C 295 165 345 165 340 237 M 370 237 C 365 165 415 165 390 245',oval(355,270,42,35),*face(355,265)]
world = ['M 85 220 L 270 75 L 455 220 Z',box(110,220,320,220),'M 270 220 L 270 440 M 110 330 L 430 330',box(140,260,95,45),box(305,245,85,65),box(140,360,75,80),oval(350,390,42,30)]
wind = [oval(260,150,53,58),*face(260,150),'M 225 210 L 295 210 L 325 345 L 200 345 Z','M 225 225 L 155 265 L 135 240 L 205 195 Z M 295 225 L 360 255 L 380 230 L 360 215 L 345 230 L 310 205 Z','M 220 345 L 190 425 L 225 435 L 265 355 L 295 435 L 330 425 L 305 345','M 85 180 C 20 110 100 60 145 95 C 200 145 100 160 75 120 M 380 150 C 500 60 520 210 425 200 C 385 190 420 155 465 170']
cozy = [box(100,310,340,110),'M 100 340 C 40 345 45 270 85 270 C 115 270 125 290 125 310 M 440 340 C 500 345 495 270 455 270 C 425 270 415 290 415 310','M 130 420 L 130 450 M 410 420 L 410 450','M 225 240 L 215 265 L 240 275 M 315 240 L 325 265 L 300 275','M 215 170 L 215 100 L 250 145 C 265 140 280 140 290 145 L 325 100 L 325 170 C 350 245 190 245 215 170 Z',*face(270,185),'M 190 260 L 270 285 L 350 260 L 350 325 L 270 350 L 190 325 Z M 270 285 L 270 350']
vehicle = art['car'] + ['M 255 305 C 280 330 310 330 335 305']
items = [
 ('cat-seated','Gatinho sentado','A',cat,[oval(420,430,40,40),'M 395 400 C 445 410 390 445 445 455']),
 ('child-rabbit','Criança com coelho de pelúcia','D',child,[box(70,390,50,50),oval(390,425,35,20)]),
 ('dollhouse','Casinha de boneca aberta','E',world,[box(320,260,20,30),box(355,260,20,30),'M 155 380 L 200 380 M 175 360 L 175 440']),
 ('air-adventure','Aventureira com redemoinho de ar','F',wind,[oval(100,350,45,20),oval(430,360,50,25)]),
 ('cat-reading','Gatinho lendo no sofá','G',cozy,[box(65,70,95,110),'M 112 70 L 112 180 M 65 125 L 160 125',oval(405,220,25,30),'M 395 190 L 395 155 M 415 190 L 415 155']),
 ('smiling-car','Carrinho sorridente','H',vehicle,[oval(130,120,45,22),'M 75 435 L 465 435'])]
manifest = {'version':1,'stage':'pilot-awaiting-approval','categories':[
 {'id':c,'title':t,'symbol':s} for c,t,s in zip('ABCDEFGHIJ',['Gatos e casinhas mágicas','Bichinhos amigos','Jardim e natureza','Amizade e brincadeiras','Pequenos mundos','Quatro elementos','Momentos aconchegantes','Veículos e passeios','Mar e fantasia','Comidinhas e celebrações'],['cat','pawprint','leaf','figure.2','house','wind','book','car','fish','birthday.cake'])], 'items':[]}
for name,title,category,base,detail in items:
    entry = dict(id=name,title=title,category=category,complexity='intermediate' if category in 'DFG' else 'simple',assetVersion=1,aspectRatio=1,author='Quadro Livre — artes vetoriais originais assistidas por IA',license='Uso, alteração e distribuição permitidos com o aplicativo; sem material de terceiros.',variants={})
    for mode,paths in [('trace',base),('coloring',base+detail)]:
        stem=f'{name}-v1-{mode}'
        (source/f'{stem}.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 540"><g fill="none" stroke="#30343b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">'+''.join(f'<path d="{p}"/>' for p in paths)+'</g></svg>\n')
        for pixels,suffix in [(1536,''),(240,'-thumb')]:
            s=surface(0,pixels,pixels); ctx=create(s); scale(ctx,pixels/540,pixels/540)
            color(ctx,.188,.204,.231, .4 if mode=='trace' and suffix else 1); width(ctx,6); cap(ctx,1); join(ctx,1)
            for path in paths:
                tokens=re.findall(r'[MLCZ]|-?\d+(?:\.\d+)?',path); i=0
                while i<len(tokens):
                    op=tokens[i]; i+=1; n={'M':2,'L':2,'C':6,'Z':0}[op]; vals=list(map(float,tokens[i:i+n])); i+=n
                    {'M':move,'L':line,'C':curve,'Z':close}[op](ctx,*vals)
                stroke(ctx)
            assert png(s,str(out/f'{stem}{suffix}.png').encode())==0
            destroy(ctx); finish(s)
        entry['variants'][mode]={'asset':stem,'thumbnail':stem+'-thumb'}
    manifest['items'].append(entry)
(out/'catalog-v1.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
review = root / 'Support/Illustrations/REVISAO-AMOSTRAS.html'
review.write_text('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Quadro Livre — seis pares-piloto</title><style>body{font:20px system-ui;background:#eef0f5;margin:24px}section{margin:32px 0}article{display:inline-block;width:min(44%,540px);background:white;padding:8px;margin:4px;vertical-align:top}img{width:100%}.trace{opacity:.4}</style><h1>Seis pares-piloto — aprovação pendente</h1><p>Esquerda: seguir contorno (40%). Direita: colorir. Esta página não substitui o teste de tinta e zoom no aplicativo.</p>'+''.join('<section><h2>'+item['title']+'</h2>'+''.join('<article><h3>'+('Seguir contorno' if mode=='trace' else 'Colorir')+'</h3><img class="'+mode+'" src="v1/'+item['variants'][mode]['asset']+'.svg" alt="'+item['title']+'"></article>' for mode in ['trace','coloring'])+'</section>' for item in manifest['items'])+'</html>')
print('Generated six pilot pairs, 12 thumbnails, review sheet and versioned manifest; approval pending.')
