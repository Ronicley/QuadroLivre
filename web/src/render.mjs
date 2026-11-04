import { documentBounds, INSTRUMENTS } from './model.mjs';

const textures = new Map();

function texture(context, tool, color) {
  const key = `${tool}:${color}`;
  if (!textures.has(key)) {
    const tile = document.createElement('canvas');
    tile.width = tile.height = 64;
    const ink = tile.getContext('2d');
    ink.fillStyle = color;
    const step = tool === 'pencil' ? 1 : 2;
    for (let y = 0; y < 64; y += step) for (let x = 0; x < 64; x += step) {
      // Fixed integer grain in board coordinates, never frame/zoom-dependent randomness.
      const grain = (Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263)) >>> 0;
      const value = ((Math.imul(grain ^ (grain >>> 13), 1274126177) >>> 0) % 100) / 100;
      ink.globalAlpha = tool === 'pencil' ? 0.12 + value * 0.55 : value < 0.22 ? 0.06 : 0.45 + value * 0.5;
      ink.fillRect(x, y, step, step);
    }
    // Bound retained colors even when children use many custom RGB values.
    if (textures.size >= 32) textures.delete(textures.keys().next().value);
    textures.set(key, tile);
  }
  return context.createPattern(textures.get(key), 'repeat');
}

// Compose after all erasing: templates are never part of the editable ink layer.
export function drawTemplate(context, doc, image, thumbnail = false) {
  if (doc.version === 1) return;
  if (!image) throw new Error('O modelo precisa estar disponível antes de abrir ou exportar.');
  const { x, y, width, height } = doc.template.rect;
  context.save();
  context.globalCompositeOperation = doc.mode === 'trace' ? 'destination-over' : 'source-over';
  // Catalog thumbnails already bake trace contrast; full-size guides need it here.
  context.globalAlpha = doc.mode === 'trace' && !thumbnail ? 0.4 : 1;
  context.drawImage(image, x, y, width, height);
  context.restore();
}

export function drawStroke(context, stroke) {
  if (stroke.tool !== 'eraser' && !INSTRUMENTS.some(([id]) => id === stroke.tool)) {
    throw new Error('Instrumento desconhecido. Não foi possível desenhar este traço.');
  }
  context.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
  const ink = ['pencil', 'crayon'].includes(stroke.tool) ? texture(context, stroke.tool, stroke.color) : stroke.color;
  context.strokeStyle = ink;
  context.fillStyle = ink;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  const points = stroke.points;
  const radius = point => stroke.tool === 'ballpoint'
    ? stroke.width * 0.45 * (0.75 + 0.25 * point.p) / 2
    : stroke.width * (stroke.tool === 'pencil' ? 0.65 : 1) * (0.35 + 0.65 * point.p) / 2;
  if (stroke.tool === 'pencil' || stroke.tool === 'crayon') {
    // One filled silhouette prevents translucent joins darkening with input sample density.
    context.beginPath();
    for (let i = 0; i < points.length; i++) {
      const point = points[i], r = radius(point);
      context.moveTo(point.x + r, point.y);
      context.arc(point.x, point.y, r, 0, Math.PI * 2);
      if (!i) continue;
      const previous = points[i - 1], before = radius(previous);
      const angle = Math.atan2(point.y - previous.y, point.x - previous.x);
      const nx = -Math.sin(angle), ny = Math.cos(angle);
      context.moveTo(previous.x + nx * before, previous.y + ny * before);
      context.lineTo(previous.x - nx * before, previous.y - ny * before);
      context.lineTo(point.x - nx * r, point.y - ny * r);
      context.lineTo(point.x + nx * r, point.y + ny * r);
      context.closePath();
    }
    context.fill();
    context.globalCompositeOperation = 'source-over';
    return;
  }
  if (points.length === 1) {
    context.beginPath();
    context.arc(points[0].x, points[0].y, radius(points[0]), 0, Math.PI * 2);
    context.fill();
  }
  for (let i = 1; i < points.length; i++) {
    context.lineWidth = radius(points[i - 1]) + radius(points[i]);
    context.beginPath();
    context.moveTo(points[i - 1].x, points[i - 1].y);
    context.lineTo(points[i].x, points[i].y);
    context.stroke();
  }
  context.globalCompositeOperation = 'source-over';
}

export function createRenderer(canvas) {
  const base = document.createElement('canvas');
  let cachedStrokes, cachedCamera, cachedWidth, cachedHeight;
  return (doc, active, template) => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(canvas.clientWidth * ratio);
    const height = Math.round(canvas.clientHeight * ratio);
    const key = `${doc.camera.x},${doc.camera.y},${doc.camera.scale},${ratio}`;
    if (width !== cachedWidth || height !== cachedHeight || cachedCamera !== key || cachedStrokes !== doc.strokes) {
      base.width = width;
      base.height = height;
      const context = base.getContext('2d');
      const { x, y, scale } = doc.camera;
      context.setTransform(ratio * scale, 0, 0, ratio * scale, ratio * x, ratio * y);
      for (const stroke of doc.strokes) drawStroke(context, stroke);
      cachedWidth = width; cachedHeight = height; cachedCamera = key; cachedStrokes = doc.strokes;
    }
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    const context = canvas.getContext('2d');
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, width, height);
    context.drawImage(base, 0, 0);
    if (active) {
      const { x, y, scale } = doc.camera;
      context.setTransform(ratio * scale, 0, 0, ratio * scale, ratio * x, ratio * y);
      drawStroke(context, active);
    }
    const { x, y, scale } = doc.camera;
    context.setTransform(ratio * scale, 0, 0, ratio * scale, ratio * x, ratio * y);
    drawTemplate(context, doc, template);
  };
}

export async function exportPNG(doc, template) {
  const bounds = documentBounds(doc) ?? { x: 0, y: 0, width: 512, height: 512 };
  const width = bounds.width + 64, height = bounds.height + 64;
  const scale = Math.min(1, 2048 / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(width * scale));
  canvas.height = Math.max(1, Math.ceil(height * scale));
  const context = canvas.getContext('2d');
  context.setTransform(scale, 0, 0, scale, (32 - bounds.x) * scale, (32 - bounds.y) * scale);
  for (const stroke of doc.strokes) drawStroke(context, stroke);
  drawTemplate(context, doc, template);
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.globalCompositeOperation = 'destination-over';
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob(blob => {
    if (blob) resolve(blob);
    else reject(new Error('Não foi possível gerar a imagem. Tente novamente.'));
  }, 'image/png'));
}
