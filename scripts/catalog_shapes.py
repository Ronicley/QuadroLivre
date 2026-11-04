"""Original drawing vocabulary for the 100-theme collection.
Reusable small motifs, not finished pages. Each registered theme has a separately
composed silhouette/scene. All paths are editable Bezier curves, no external art.
"""
import math
from vector_art import oval, transform

ART = {}
def add(number, identifier, title, category, base, details):
    assert number not in ART and base and details
    ART[number] = dict(id=identifier, title=title, category=category, base=base, details=details)

def place(paths, scale=1, x=0, y=0):
    return [transform(p, scale, x, y) for p in paths]

def rect(x,y,w,h):
    return f'M {x} {y} L {x+w} {y} L {x+w} {y+h} L {x} {y+h} Z'

def roundbox(x,y,w,h,r=12):
    return f'M {x+r} {y} L {x+w-r} {y} C {x+w} {y} {x+w} {y} {x+w} {y+r} L {x+w} {y+h-r} C {x+w} {y+h} {x+w} {y+h} {x+w-r} {y+h} L {x+r} {y+h} C {x} {y+h} {x} {y+h} {x} {y+h-r} L {x} {y+r} C {x} {y} {x} {y} {x+r} {y} Z'

def star(x,y,r=20):
    points=[]
    for i in range(10):
        a=math.pi*(i/5-.5); radius=r if i%2==0 else r*.45
        points.append((x+math.cos(a)*radius,y+math.sin(a)*radius))
    return 'M '+' L '.join(f'{a:.3f} {b:.3f}' for a,b in points)+' Z'

def leaf(x,y,w=45,h=25):
    return f'M {x} {y} C {x+w*.25} {y-h} {x+w*.8} {y-h} {x+w} {y} C {x+w*.75} {y+h} {x+w*.2} {y+h} {x} {y} Z'

def flower(x,y,r=24):
    # Single closed scalloped petal silhouette with a broad circular centre.
    return [f'M {x-r*.5} {y-r*.65} C {x-r} {y-r*2} {x+r} {y-r*2} {x+r*.5} {y-r*.65} C {x+r*1.9} {y-r} {x+r*2} {y+r*.7} {x+r*.65} {y+r*.5} C {x+r} {y+r*2} {x-r} {y+r*2} {x-r*.65} {y+r*.5} C {x-r*2} {y+r*.7} {x-r*1.9} {y-r} {x-r*.5} {y-r*.65} Z',oval(x,y,r*.45,r*.45)]

def cloud(x,y,w=120):
    return f'M {x} {y} C {x-w*.2} {y-w*.2} {x} {y-w*.45} {x+w*.2} {y-w*.3} C {x+w*.25} {y-w*.7} {x+w*.65} {y-w*.7} {x+w*.7} {y-w*.3} C {x+w} {y-w*.45} {x+w*1.2} {y} {x+w*.9} {y} Z'

def face(x,y,spread=15):
    return [oval(x-spread,y,3,5),oval(x+spread,y,3,5),f'M {x-10} {y+18} C {x-3} {y+24} {x+5} {y+24} {x+12} {y+17}']

def cat_head():
    return ['M 15 43 L 10 8 C 20 10 29 17 35 24 C 47 19 59 19 70 24 C 77 16 87 10 96 8 L 91 43 C 100 76 77 92 53 92 C 28 92 8 74 15 43 Z',
            'M 28 53 C 35 46 43 46 49 53 C 43 61 35 61 28 53 Z M 61 53 C 67 46 76 46 82 53 C 76 61 68 61 61 53 Z',
            'M 48 68 L 60 68 L 54 75 Z M 54 75 C 48 83 41 82 38 78 M 54 75 C 60 83 67 82 70 78',
            'M 33 70 L 4 65 M 33 77 L 4 81 M 75 70 L 104 65 M 75 77 L 104 81']

def cat_crouch():
    return ['M 179 270 C 215 201 335 188 373 248 C 399 273 408 307 391 335 L 324 342 L 240 342 C 224 334 218 314 218 296',
            'M 179 270 C 158 253 131 254 120 270 L 100 248 L 99 293 C 87 314 108 340 136 342 C 164 345 184 333 193 316',
            'M 174 333 C 183 348 204 350 219 344 L 229 332 M 309 272 C 280 275 278 319 306 321 L 324 321 C 340 323 337 341 324 342',
            'M 391 335 C 453 342 476 307 464 278 C 458 264 443 271 447 283 C 453 303 435 318 402 314',
            oval(125,302,4,5),oval(154,302,4,5),'M 134 317 L 144 317 L 139 323 Z']

def bear():
    return [oval(160,135,30,31),oval(296,135,30,31),oval(228,180,80,75),
            'M 172 244 C 139 268 131 335 156 368 L 184 389 L 274 389 C 321 362 322 282 282 244',
            oval(161,382,40,30),oval(294,382,40,30),
            'M 170 267 C 133 270 119 319 145 331 M 285 267 C 327 278 332 320 311 332',
            *face(228,180,28),oval(228,207,27,20),'M 219 201 L 237 201 L 228 210 Z']

def rabbit():
    return ['M 210 167 C 173 119 178 58 199 65 C 221 72 231 128 231 154 M 263 154 C 268 109 296 66 310 79 C 325 96 294 153 281 170',
            'M 210 167 C 162 182 167 251 217 267 C 278 290 330 250 313 201 C 306 180 288 165 263 154 C 246 150 226 155 210 167 Z',
            'M 214 267 C 172 310 172 376 212 400 L 294 400 C 332 374 329 309 285 268',
            oval(204,404,40,19),oval(304,404,40,19),oval(340,349,20,22),
            *face(247,211,28),'M 238 230 L 256 230 L 247 239 Z',
            'M 217 306 C 196 326 201 353 215 358 M 285 306 C 305 327 300 353 287 358']

def person(pose='open'):
    head=['M 210 148 C 207 118 226 98 251 98 C 279 98 298 119 294 149 C 304 154 301 166 292 167 C 288 189 271 201 251 202 C 230 201 214 188 211 167 C 200 165 201 152 210 148 Z',
          'M 210 147 C 219 140 224 129 226 120 C 244 134 270 132 281 119 L 294 149',*face(252,159,18),'M 238 201 L 238 215 M 266 201 L 266 215']
    body=['M 238 215 L 215 226 L 205 267 L 220 275 L 225 250 M 266 215 L 290 226 L 301 266 L 285 276 L 280 251',
          'M 225 250 L 217 326 C 239 333 269 333 289 326 L 280 251',
          'M 217 326 L 219 380 L 224 437 L 249 437 L 253 366 L 258 437 L 283 437 L 289 326',
          'M 224 437 L 213 449 C 207 457 217 461 248 459 L 249 437 M 258 437 L 257 459 L 291 459 C 300 453 290 445 283 443 L 283 437']
    if pose=='open':
        body += ['M 215 226 L 171 261 L 140 246 C 130 232 120 239 126 250 L 163 283 C 170 288 179 284 187 280 L 220 259',
                 'M 290 226 L 324 255 L 359 239 C 369 226 379 234 373 244 L 333 280 C 324 285 316 281 306 276 L 287 260']
    elif pose=='hold':
        body += ['M 215 226 C 187 248 176 281 199 301 L 234 311 M 220 259 L 211 279 L 237 291',
                 'M 290 226 C 319 250 324 279 305 299 L 276 311 M 287 260 L 294 279 L 272 292']
    return head+body

def tree():
    return ['M 224 306 L 220 440 L 286 440 L 281 305',
            'M 224 306 C 160 329 120 277 146 234 C 102 188 139 131 184 142 C 196 81 275 74 303 122 C 368 99 411 164 375 207 C 418 262 359 320 281 305',
            'M 252 326 L 252 377 M 252 351 L 235 336 M 252 364 L 272 344']

def boat():
    return ['M 99 339 L 441 339 L 391 407 C 310 429 224 429 149 407 Z',
            'M 264 339 L 264 104 L 402 312 L 280 312 L 280 339',
            'M 247 145 L 247 312 L 125 312 Z']

def mountains():
    return ['M 75 351 L 180 119 L 278 351 Z','M 283 351 L 383 147 L 474 351 Z',
            'M 155 175 L 178 190 L 198 163 M 360 198 L 382 217 L 402 191']
