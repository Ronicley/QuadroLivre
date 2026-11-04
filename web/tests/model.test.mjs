import test from 'node:test';
import assert from 'node:assert/strict';
import { appendStroke, COLORS, INSTRUMENTS, emptyDocument, fitCamera, MAX_ZOOM, MIN_ZOOM, pinchCamera, redo, strokeBounds, toWorld, undo, validateDocument, zoomAt } from '../src/model.mjs';

const stroke = (tool = 'pen') => ({ tool, color: '#6353ba', width: 10, points: [{ x: 5, y: 10, p: 0.7 }, { x: 40, y: 60, p: 1 }] });

test('instrument IDs round-trip per stroke, preserve legacy data and survive history', () => {
  assert.deepEqual(INSTRUMENTS.map(([id]) => id), ['pen', 'ballpoint', 'pencil', 'crayon']);
  let history = { doc: emptyDocument(), redo: [] };
  for (const tool of [...INSTRUMENTS.map(([id]) => id), 'eraser']) {
    history = appendStroke(history, stroke(tool));
    assert.deepEqual(redo(undo(history)), history);
  }
  assert.deepEqual(validateDocument(JSON.parse(JSON.stringify(history.doc))), history.doc);
  assert.deepEqual(history.doc.strokes[0], stroke(), 'no added defaults or metadata in legacy strokes');
  for (const tool of ['future-brush', null, 4, undefined]) {
    const doc = { ...emptyDocument(), strokes: [stroke(tool)] };
    if (tool === undefined) delete doc.strokes[0].tool;
    const original = structuredClone(doc);
    assert.throws(() => validateDocument(doc), /Instrumento desconhecido/);
    assert.deepEqual(doc, original, 'unknown tool is never normalized or removed');
  }
});

test('16 unique presets and arbitrary RGB colors remain valid editable stroke colors', () => {
  assert.equal(COLORS.length, 16);
  assert.equal(new Set(COLORS.map(([value]) => value)).size, 16);
  for (const color of [...COLORS.map(([value]) => value), '#12abcf', '#000000']) {
    const doc = { ...emptyDocument(), strokes: [{ ...stroke(), color }] };
    assert.deepEqual(validateDocument(JSON.parse(JSON.stringify(doc))), doc);
  }
});

test('document round-trip preserves editable strokes, eraser and viewport', () => {
  const doc = { ...emptyDocument(), strokes: [stroke(), stroke('eraser')], camera: { x: -30, y: 45, scale: 1.5 } };
  assert.deepEqual(validateDocument(JSON.parse(JSON.stringify(doc))), doc);
});

test('invalid documents are rejected instead of becoming blank boards', () => {
  for (const doc of [null, {}, { ...emptyDocument(), version: 2 }, { ...emptyDocument(), strokes: [null] },
    { ...emptyDocument(), camera: { x: Infinity, y: 0, scale: 1 } },
    { ...emptyDocument(), camera: { x: 0, y: 0, scale: NaN } },
    { ...emptyDocument(), camera: { x: 0, y: 0, scale: 0 } }]) {
    assert.throws(() => validateDocument(doc));
  }
});

test('invalid tool, color, width, pressure, coordinates and empty points rejected', () => {
  for (const change of [{ tool: 'fill' }, { color: 'red' }, { width: -1 }, { width: 101 },
    { points: [] }, { points: [{ x: NaN, y: 0, p: 0.5 }] },
    { points: [{ x: 0, y: 0, p: -1 }] }, { points: [{ x: 0, y: 1_000_001, p: 1 }] }]) {
    assert.throws(() => validateDocument({ ...emptyDocument(), strokes: [{ ...stroke(), ...change }] }));
  }
});

test('undo/redo restores an eraser as a stroke without modifying prior history', () => {
  const first = appendStroke({ doc: emptyDocument(), redo: [] }, stroke());
  const second = appendStroke(first, stroke('eraser'));
  const previous = undo(second);
  assert.equal(previous.doc.strokes.length, 1);
  assert.equal(second.doc.strokes.length, 2);
  assert.deepEqual(redo(previous), second);
  assert.equal(first.doc.strokes.length, 1);
});

test('new stroke discards redo history; empty undo/redo are safe', () => {
  const empty = { doc: emptyDocument(), redo: [] };
  assert.equal(undo(empty), empty);
  assert.equal(redo(empty), empty);
  const history = appendStroke(undo(appendStroke(empty, stroke())), stroke('eraser'));
  assert.equal(history.redo.length, 0);
  assert.equal(history.doc.strokes[0].tool, 'eraser');
});

test('zoom preserves the world coordinate beneath its anchor, even at limits', () => {
  const camera = { x: 30, y: -10, scale: 2 }, anchor = { x: 160, y: 280 };
  for (const factor of [0.00001, 0.5, 2, 1_000]) {
    const result = zoomAt(camera, anchor, factor);
    assert.deepEqual(toWorld(anchor, result), toWorld(anchor, camera));
    assert.ok(result.scale >= MIN_ZOOM && result.scale <= MAX_ZOOM);
  }
});

test('pinch scales about midpoint and translates with fingers', () => {
  const result = pinchCamera({ x: 0, y: 0, scale: 1 }, [{ x: 0, y: 0 }, { x: 100, y: 0 }], [{ x: 10, y: 20 }, { x: 210, y: 20 }]);
  assert.deepEqual(result, { x: 10, y: 20, scale: 2 });
  assert.ok(Number.isFinite(pinchCamera({ x: 0, y: 0, scale: 1 }, [{ x: 0, y: 0 }, { x: 0, y: 0 }], [{ x: 0, y: 0 }, { x: 0, y: 0 }]).scale));
});

test('bounds include brush width and ignore eraser-only extent', () => {
  assert.equal(strokeBounds([]), null);
  assert.equal(strokeBounds([stroke('eraser')]), null);
  assert.deepEqual(strokeBounds([stroke(), { ...stroke('eraser'), points: [{ x: 900, y: 800, p: 1 }] }]), { x: 0, y: 5, width: 45, height: 60 });
});

test('fit keeps strokes between top controls and dock on tablet and phone', () => {
  for (const [width, height, bottom] of [[1024, 768, 130], [390, 844, 200]]) {
    const strokes = [{ ...stroke(), points: [{ x: -500, y: -300, p: 1 }, { x: 500, y: 300, p: 1 }] }];
    const camera = fitCamera(strokes, width, height, bottom);
    const bounds = strokeBounds(strokes);
    assert.ok(bounds.x * camera.scale + camera.x >= 31);
    assert.ok(bounds.y * camera.scale + camera.y >= 119);
    assert.ok((bounds.y + bounds.height) * camera.scale + camera.y <= height - bottom + 1);
  }
});

test('blank fit recenters at 100%', () => {
  assert.deepEqual(fitCamera([], 1024, 768), { x: 512, y: 384, scale: 1 });
});
