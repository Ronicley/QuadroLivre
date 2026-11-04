#!/usr/bin/env python3
"""A single new art-direction review pair. Does not modify the runtime catalog.
Original hand-authored Bezier outlines; no downloaded or licensed character art.
"""
from pathlib import Path
import ctypes as C
import ctypes.util
import json
import re

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'Support/Illustrations/review-natural-cat-v2'
OUT.mkdir(parents=True, exist_ok=True)
if (OUT / 'approval.json').exists():
    raise SystemExit('Amostra aprovada e congelada. Integre com make_natural_pilots.py; alterações de geometria exigem nova revisão.')

# Seated domestic cat, near-frontal head, slightly turned body. One continuous
# head/neck/body outline; longer forelegs, small paws and a rounded hindquarter.
outline = 'M 217 244 C 198 234 183 216 186 192 C 187 181 190 174 194 167 C 184 146 180 119 184 99 C 204 108 226 122 237 137 C 258 130 280 130 301 137 C 313 120 334 105 351 100 C 355 124 349 148 340 169 C 347 185 349 201 342 215 C 336 229 325 238 312 245 C 315 262 330 277 340 298 C 355 326 375 367 378 399 C 380 418 372 439 357 450 C 347 460 332 465 314 465 L 220 465 C 198 465 176 460 166 445 C 150 421 161 385 177 352 C 195 317 211 282 217 244 Z'
tail = 'M 378 399 C 399 410 427 400 434 379 C 440 362 433 346 437 337 C 441 329 451 331 456 340 C 471 370 459 408 433 426 C 415 438 391 441 370 435'
# Almond-shaped eyes, short muzzle, no human smile or enormous baby eyes.
eyes = [
    'M 211 190 C 221 179 237 180 246 190 C 237 201 222 201 211 190 Z',
    'M 283 190 C 293 179 309 180 319 190 C 310 201 294 201 283 190 Z',
    'M 229 182 C 225 186 225 194 229 199 C 233 193 233 187 229 182 Z',
    'M 301 182 C 297 186 297 194 301 199 C 305 193 305 187 301 182 Z',
]
muzzle = ['M 255 211 C 261 208 269 208 275 211 L 265 220 Z',
          'M 265 220 L 265 227 C 259 234 250 235 245 230 M 265 227 C 271 234 280 235 285 230']
legs = [
    'M 232 282 C 222 320 224 375 227 424 C 217 429 211 438 214 446 C 216 453 230 455 247 452 C 254 451 257 446 256 437 L 258 344',
    'M 292 284 C 303 325 300 377 297 425 C 308 430 315 439 311 447 C 307 454 292 455 277 452 C 271 451 268 446 269 437 L 269 345',
    'M 342 349 C 317 354 309 381 316 402 C 323 418 337 425 351 424',
]
whiskers = ['M 231 216 C 213 209 200 208 183 210 M 231 223 C 211 222 197 224 181 230',
            'M 298 216 C 316 209 330 208 347 210 M 298 223 C 318 222 332 224 348 230']
base = [outline, tail, *eyes, *muzzle, *legs, *whiskers]
# Colorable ear regions and a broad chest/coat patch, not decorative scene clutter.
details = [
    'M 198 122 C 209 128 219 137 224 145 L 205 160 C 201 147 199 135 198 122 Z',
    'M 337 124 C 326 130 316 139 312 146 L 330 160 C 334 148 336 136 337 124 Z',
    'M 236 259 C 248 267 280 269 294 258 C 289 287 280 309 264 327 C 249 309 240 286 236 259 Z',
    'M 224 439 L 223 449 M 236 440 L 236 452 M 288 440 L 289 452 M 300 440 L 302 450',
]

lib = C.CDLL(ctypes.util.find_library('cairo'))
P, D = C.c_void_p, C.c_double
def bind(name, result, *args):
    fn = getattr(lib, 'cairo_' + name)
    fn.restype, fn.argtypes = result, args
    return fn
surface = bind('image_surface_create', P, C.c_int, C.c_int, C.c_int)
create = bind('create', P, P)
scale = bind('scale', None, P, D, D)
color = bind('set_source_rgba', None, P, D, D, D, D)
paint = bind('paint', None, P)
width = bind('set_line_width', None, P, D)
cap = bind('set_line_cap', None, P, C.c_int)
join = bind('set_line_join', None, P, C.c_int)
ops = {'M': bind('move_to', None, P, D, D), 'L': bind('line_to', None, P, D, D),
       'C': bind('curve_to', None, P, *([D]*6)), 'Z': bind('close_path', None, P)}
stroke = bind('stroke', None, P)
png = bind('surface_write_to_png', C.c_int, P, C.c_char_p)
destroy = bind('destroy', None, P)
finish = bind('surface_destroy', None, P)

def natural_proportions(path):
    # Keep the adult cat's head narrower than its seated haunches; blend the
    # adjustment through the shoulders rather than scaling a detached head.
    def point(match):
        x, y = map(float, match.groups())
        blend = max(0, min(1, (290 - y) / 45))
        x = 265 + (x - 265) * (1 - .22 * blend)
        if y < 245:
            y = 245 + (y - 245) * .82
        return f'{x:.3f} {y:.3f}'
    return re.sub(r'(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)', point, path)

for mode, paths in [('trace', base), ('coloring', base + details)]:
    paths = [natural_proportions(path) for path in paths]
    opacity = .4 if mode == 'trace' else 1
    svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 540">\n'
    svg += '<title>Gato sentado — estudo de proporções naturais, versão 2</title>\n'
    svg += '<g fill="none" stroke="#292d32" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">\n'
    svg += '\n'.join(f'<path d="{path}"/>' for path in paths) + '\n</g></svg>\n'
    (OUT / f'cat-natural-v2-{mode}.svg').write_text(svg)
    for transparent in (True, False):
        s = surface(0, 1080, 1080)
        ctx = create(s)
        if not transparent:
            color(ctx, 1, 1, 1, 1); paint(ctx)
        scale(ctx, 2, 2)
        color(ctx, .161, .176, .196, opacity if not transparent else 1)
        width(ctx, 3.5); cap(ctx, 1); join(ctx, 1)
        for path in paths:
            tokens = re.findall(r'[MLCZ]|-?\d+(?:\.\d+)?', path)
            i = 0
            while i < len(tokens):
                op = tokens[i]; i += 1
                count = {'M':2, 'L':2, 'C':6, 'Z':0}[op]
                values = list(map(float, tokens[i:i+count])); i += count
                ops[op](ctx, *values)
            stroke(ctx)
        suffix = '' if transparent else '-preview'
        assert png(s, str(OUT / f'cat-natural-v2-{mode}{suffix}.png').encode()) == 0
        destroy(ctx); finish(s)

(OUT / 'index.html').write_text('''<!doctype html>
<html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Gato — nova amostra para aprovação</title>
<style>body{font:18px system-ui;margin:24px;background:#edf0f4;color:#20252c}main{max-width:1120px;margin:auto}.pair{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:24px}article{padding:16px;background:white;border-radius:20px}img{width:100%;height:auto}h2{text-align:center}</style>
<main><h1>Gato: nova direção de contorno</h1>
<p>Estudo original de anatomia e proporções mais naturais, sem fundo ou acessórios. <strong>Aguardando sua aprovação.</strong> Esta amostra não substituiu nenhum desenho salvo nem entrou no catálogo.</p>
<div class="pair"><article><h2>Seguir contorno</h2><img src="cat-natural-v2-trace-preview.png" alt="Gato sentado, guia claro"><p>Guia a 40%, menos linhas internas.</p></article>
<article><h2>Colorir</h2><img src="cat-natural-v2-coloring-preview.png" alt="Gato sentado em contornos escuros"><p>Contorno escuro, regiões adicionais nas orelhas e peito.</p></article></div>
<p>Revisar principalmente: proporção cabeça/corpo, postura e patas, expressão e se esse estilo é o desejado. Só após aprovação integrar como nova versão, preservando os assets V1.</p></main></html>
''')
(OUT / 'origin.json').write_text(json.dumps(dict(id='cat-natural', assetVersion=2, status='awaiting-visual-approval',
    author='Quadro Livre — curvas vetoriais originais elaboradas pelo assistente (IA)',
    source='scripts/make_natural_cat_sample.py', license='Uso, alteração e distribuição permitidos com o aplicativo; sem material de terceiros.',
    runtimeIntegrated=False), ensure_ascii=False, indent=2)+'\n')
print(f'Generated review pair only: {OUT.relative_to(ROOT)}/index.html')
