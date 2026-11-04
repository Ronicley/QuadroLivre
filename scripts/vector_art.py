"""Small offline SVG path authoring/rasterization helper. No app dependency.
Supports only explicit M/L/C/Z commands; sources remain ordinary editable SVG.
"""
import ctypes as C
import ctypes.util
from html import escape
import re
import xml.etree.ElementTree as ET

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
paint_alpha = bind('paint_with_alpha', None, P, D)
source_surface = bind('set_source_surface', None, P, P, D, D)
width = bind('set_line_width', None, P, D)
cap = bind('set_line_cap', None, P, C.c_int)
join = bind('set_line_join', None, P, C.c_int)
ops = {'M': bind('move_to', None, P, D, D), 'L': bind('line_to', None, P, D, D),
       'C': bind('curve_to', None, P, *([D]*6)), 'Z': bind('close_path', None, P)}
stroke = bind('stroke', None, P)
png = bind('surface_write_to_png', C.c_int, P, C.c_char_p)
destroy = bind('destroy', None, P)
finish = bind('surface_destroy', None, P)


def oval(x, y, rx, ry):
    k = .55228475
    return f'M {x+rx} {y} C {x+rx} {y+k*ry} {x+k*rx} {y+ry} {x} {y+ry} C {x-k*rx} {y+ry} {x-rx} {y+k*ry} {x-rx} {y} C {x-rx} {y-k*ry} {x-k*rx} {y-ry} {x} {y-ry} C {x+k*rx} {y-ry} {x+rx} {y-k*ry} {x+rx} {y} Z'


def transform(path, factor=1, dx=0, dy=0):
    def point(match):
        x, y = map(float, match.groups())
        return f'{x*factor+dx:.4f} {y*factor+dy:.4f}'
    return re.sub(r'(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)', point, path)


def source(title, paths):
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 540">\n<title>'+escape(title)+'</title>\n<g fill="none" stroke="#292d32" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">\n'+'\n'.join(f'<path d="{p}"/>' for p in paths)+'\n</g></svg>\n'


def paths_from_svg(text):
    tree = ET.fromstring(text)
    assert tree.get('viewBox') == '0 0 540 540'
    return [node.attrib['d'] for node in tree.iter() if node.tag.endswith('}path')]


def rasterize(paths, destination, pixels, opacity=1, white=False):
    s = surface(0, pixels, pixels)
    ctx = create(s)
    try:
        scale(ctx, pixels/540, pixels/540)
        # Apply contrast to the completed layer, just like UIImageView.alpha.
        # Per-path alpha would darken every joint/crossing in thumbnails.
        color(ctx, .161, .176, .196, 1)
        width(ctx, 3.5); cap(ctx, 1); join(ctx, 1)
        for path in paths:
            assert not re.sub(r'[MLCZ\s\d.\-]', '', path), 'Unsupported SVG command'
            tokens = re.findall(r'[MLCZ]|-?\d+(?:\.\d+)?', path)
            i = 0
            while i < len(tokens):
                op = tokens[i]; i += 1
                count = {'M':2, 'L':2, 'C':6, 'Z':0}[op]
                values = list(map(float, tokens[i:i+count])); i += count
                assert len(values) == count
                ops[op](ctx, *values)
            stroke(ctx)
        if white or opacity != 1:
            composed = surface(0, pixels, pixels)
            target = create(composed)
            try:
                if white:
                    color(target, 1, 1, 1, 1); paint(target)
                source_surface(target, s, 0, 0)
                paint_alpha(target, opacity)
                assert png(composed, str(destination).encode()) == 0
            finally:
                destroy(target); finish(composed)
        else:
            assert png(s, str(destination).encode()) == 0
    finally:
        destroy(ctx); finish(s)
