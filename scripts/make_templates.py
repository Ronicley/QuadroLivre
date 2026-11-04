#!/usr/bin/env python3
"""Original Quadro Livre outlines. No external artwork or Python packages.
SVG is the editable source; Cairo rasterizes the same commands at 1536px.
"""
from pathlib import Path
import ctypes as C
import ctypes.util
import re

root = Path(__file__).resolve().parents[1]
out = root / 'Sources/QuadroLivre/Resources'
sources = root / 'Support/Templates'
sources.mkdir(parents=True, exist_ok=True)
lib = C.CDLL(ctypes.util.find_library('cairo'))
def bind(name, result, *args):
    f = getattr(lib, 'cairo_' + name); f.restype = result; f.argtypes = args
    return f
ptr, dbl = C.c_void_p, C.c_double
surface = bind('image_surface_create', ptr, C.c_int, C.c_int, C.c_int)
create = bind('create', ptr, ptr)
scale = bind('scale', None, ptr, dbl, dbl)
move = bind('move_to', None, ptr, dbl, dbl)
line = bind('line_to', None, ptr, dbl, dbl)
curve = bind('curve_to', None, ptr, *([dbl]*6))
close = bind('close_path', None, ptr)
stroke = bind('stroke', None, ptr)
width = bind('set_line_width', None, ptr, dbl)
cap = bind('set_line_cap', None, ptr, C.c_int)
join = bind('set_line_join', None, ptr, C.c_int)
color = bind('set_source_rgba', None, ptr, dbl, dbl, dbl, dbl)
png = bind('surface_write_to_png', C.c_int, ptr, C.c_char_p)
destroy = bind('destroy', None, ptr)
finish = bind('surface_destroy', None, ptr)
def oval(x, y, rx, ry):
    k = .55228475
    return f'M {x+rx} {y} C {x+rx} {y+k*ry} {x+k*rx} {y+ry} {x} {y+ry} C {x-k*rx} {y+ry} {x-rx} {y+k*ry} {x-rx} {y} C {x-rx} {y-k*ry} {x-k*rx} {y-ry} {x} {y-ry} C {x+k*rx} {y-ry} {x+rx} {y-k*ry} {x+rx} {y} Z'
art = {
 'cat': ['M 145 210 L 140 100 L 225 155 C 250 145 290 145 315 155 L 395 100 L 390 210 C 440 345 350 400 270 400 C 175 400 100 335 145 210 Z', oval(215,245,12,18), oval(325,245,12,18), 'M 250 290 L 290 290 L 270 310 Z M 270 310 C 250 335 230 325 225 320 M 270 310 C 290 335 310 325 315 320', 'M 180 285 L 95 265 M 175 310 L 90 315 M 360 285 L 445 265 M 365 310 L 450 315'],
 'dog': ['M 175 180 C 190 110 350 110 365 180 L 380 315 C 380 420 160 420 160 315 Z', 'M 175 170 C 100 100 70 205 95 285 C 115 330 155 285 175 170 M 365 170 C 440 100 470 205 445 285 C 425 330 385 285 365 170', oval(220,245,12,18), oval(320,245,12,18), 'M 245 300 C 245 275 295 275 295 300 L 270 320 Z M 270 320 L 270 340 M 230 340 C 250 365 290 365 310 340'],
 'butterfly': [oval(270,285,22,110), 'M 255 180 C 220 120 220 100 205 90 M 285 180 C 320 120 320 100 335 90', 'M 248 230 C 150 65 55 125 90 240 C 105 285 190 300 248 285 C 125 270 100 365 155 405 C 205 435 235 355 250 335', 'M 292 230 C 390 65 485 125 450 240 C 435 285 350 300 292 285 C 415 270 440 365 385 405 C 335 435 305 355 290 335', oval(170,215,34,40), oval(370,215,34,40)],
 'house': ['M 85 250 L 270 85 L 455 250 Z M 125 250 L 125 425 L 415 425 L 415 250 M 235 425 L 235 310 L 305 310 L 305 425', 'M 160 285 L 205 285 L 205 340 L 160 340 Z M 335 285 L 380 285 L 380 340 L 335 340 Z M 340 145 L 340 90 L 385 90 L 385 185', 'M 65 425 L 475 425'],
 'car': ['M 100 300 L 145 205 C 155 190 170 180 195 180 L 320 180 C 345 180 360 200 385 250 L 435 265 C 455 270 465 285 465 310 L 465 360 L 415 360 M 335 360 L 210 360 M 130 360 L 75 360 L 75 325 C 75 310 85 300 100 300 Z', 'M 150 265 L 185 210 L 250 210 L 250 265 Z M 280 210 L 315 210 C 330 210 345 235 360 265 L 280 265 Z', oval(170,360,40,40), oval(375,360,40,40), 'M 430 300 L 460 300'],
 'flower': ['M 270 290 L 270 445 M 270 385 C 190 385 160 340 160 330 C 225 320 260 345 270 385 M 270 410 C 350 410 380 365 380 355 C 315 345 280 370 270 410', 'M 235 175 C 185 65 355 65 305 175 C 415 95 465 255 340 245 C 450 315 310 405 290 285 C 270 410 125 320 220 245 C 90 260 135 95 235 175 Z', oval(270,230,55,55)]
}
for name, paths in art.items():
    svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 540">\n<g fill="none" stroke="#30343b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">\n'
    svg += '\n'.join(f'<path d="{p}"/>' for p in paths) + '\n</g></svg>\n'
    (sources / f'{name}-v1.svg').write_text(svg)
    s = surface(0,1536,1536); ctx = create(s); scale(ctx,1536/540,1536/540)
    color(ctx,.188,.204,.231,1); width(ctx,6); cap(ctx,1); join(ctx,1)
    for path in paths:
        tokens = re.findall(r'[MLCZ]|-?\d+(?:\.\d+)?', path); i = 0
        while i < len(tokens):
            op = tokens[i]; i += 1
            n = {'M':2,'L':2,'C':6,'Z':0}[op]
            vals = list(map(float,tokens[i:i+n])); i += n
            {'M':move,'L':line,'C':curve,'Z':close}[op](ctx,*vals)
        stroke(ctx)
    assert png(s,str(out / f'{name}-v1.png').encode()) == 0
    destroy(ctx); finish(s)
print('Generated six original SVG sources and transparent runtime PNGs.')
