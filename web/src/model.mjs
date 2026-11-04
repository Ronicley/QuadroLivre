export const COLORS = [
  ['#353345', 'Preto'], ['#6353ba', 'Roxo'], ['#1679cb', 'Azul'],
  ['#18887e', 'Verde'], ['#e23f73', 'Rosa'], ['#e15334', 'Vermelho'],
  ['#ee941e', 'Laranja'], ['#f2cb3c', 'Amarelo'],
];
export const WIDTHS = [4, 10, 22];
export const MIN_ZOOM = 0.15;
export const MAX_ZOOM = 6;
const finite = (value, limit) => Number.isFinite(value) && Math.abs(value) <= limit;

export function emptyDocument() {
  return { version: 1, strokes: [], camera: { x: 0, y: 0, scale: 1 } };
}

// IndexedDB is a trust boundary: never silently replace a document we cannot read.
export function validateDocument(doc) {
  if (!doc || doc.version !== 1 || !Array.isArray(doc.strokes) || doc.strokes.length > 100_000 ||
      !doc.camera || !finite(doc.camera.x, 10_000_000) || !finite(doc.camera.y, 10_000_000) ||
      !Number.isFinite(doc.camera.scale) || doc.camera.scale < MIN_ZOOM || doc.camera.scale > MAX_ZOOM) {
    throw new Error('Formato de quadro inválido. O original não foi substituído.');
  }
  let total = 0;
  for (const stroke of doc.strokes) {
    if (!stroke || !['pen', 'eraser'].includes(stroke.tool) || !/^#[\da-f]{6}$/i.test(stroke.color) ||
        !Number.isFinite(stroke.width) || stroke.width < 1 || stroke.width > 100 ||
        !Array.isArray(stroke.points) || !stroke.points.length) {
      throw new Error('Traço inválido. O original não foi substituído.');
    }
    total += stroke.points.length;
    if (total > 2_000_000 || stroke.points.some(point => !point ||
        !finite(point.x, 1_000_000) || !finite(point.y, 1_000_000) ||
        !Number.isFinite(point.p) || point.p < 0 || point.p > 1)) {
      throw new Error('Pontos inválidos ou quadro muito grande. O original não foi substituído.');
    }
  }
  return doc;
}

export function toWorld(point, camera) {
  return { x: (point.x - camera.x) / camera.scale, y: (point.y - camera.y) / camera.scale };
}

export function zoomAt(camera, anchor, factor) {
  const scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, camera.scale * factor));
  const point = toWorld(anchor, camera);
  return { x: anchor.x - point.x * scale, y: anchor.y - point.y * scale, scale };
}

export function pinchCamera(camera, before, after) {
  const midpoint = pair => ({ x: (pair[0].x + pair[1].x) / 2, y: (pair[0].y + pair[1].y) / 2 });
  const distance = pair => Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y);
  const start = midpoint(before);
  const end = midpoint(after);
  const zoomed = zoomAt(camera, start, distance(after) / Math.max(distance(before), 1));
  return { ...zoomed, x: zoomed.x + end.x - start.x, y: zoomed.y + end.y - start.y };
}

export function strokeBounds(strokes) {
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  for (const stroke of strokes) {
    if (stroke.tool === 'eraser') continue;
    for (const point of stroke.points) {
      left = Math.min(left, point.x - stroke.width / 2);
      top = Math.min(top, point.y - stroke.width / 2);
      right = Math.max(right, point.x + stroke.width / 2);
      bottom = Math.max(bottom, point.y + stroke.width / 2);
    }
  }
  return Number.isFinite(left) ? { x: left, y: top, width: right - left, height: bottom - top } : null;
}

export function fitCamera(strokes, width, height, bottom = 130) {
  const bounds = strokeBounds(strokes);
  if (!bounds) return { x: width / 2, y: height / 2, scale: 1 };
  const scale = Math.min(2, Math.max(MIN_ZOOM,
    Math.min((width - 64) / Math.max(bounds.width, 1), (height - 120 - bottom) / Math.max(bounds.height, 1))));
  return {
    x: width / 2 - (bounds.x + bounds.width / 2) * scale,
    y: (height + 120 - bottom) / 2 - (bounds.y + bounds.height / 2) * scale,
    scale,
  };
}

export function undo(history) {
  if (!history.doc.strokes.length) return history;
  return {
    doc: { ...history.doc, strokes: history.doc.strokes.slice(0, -1) },
    redo: [...history.redo, history.doc.strokes.at(-1)],
  };
}

export function redo(history) {
  if (!history.redo.length) return history;
  return {
    doc: { ...history.doc, strokes: [...history.doc.strokes, history.redo.at(-1)] },
    redo: history.redo.slice(0, -1),
  };
}

export function appendStroke(history, stroke) {
  return { doc: { ...history.doc, strokes: [...history.doc.strokes, stroke] }, redo: [] };
}
