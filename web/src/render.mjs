import { strokeBounds } from './model.mjs';

export function drawStroke(context, stroke) {
  context.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
  context.strokeStyle = stroke.color;
  context.fillStyle = stroke.color;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  const points = stroke.points;
  const radius = point => stroke.width * (0.35 + 0.65 * point.p) / 2;
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
  return (doc, active) => {
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
  };
}

export async function exportPNG(doc) {
  const bounds = strokeBounds(doc.strokes) ?? { x: 0, y: 0, width: 512, height: 512 };
  const width = bounds.width + 64, height = bounds.height + 64;
  const scale = Math.min(1, 2048 / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(width * scale));
  canvas.height = Math.max(1, Math.ceil(height * scale));
  const context = canvas.getContext('2d');
  context.setTransform(scale, 0, 0, scale, (32 - bounds.x) * scale, (32 - bounds.y) * scale);
  for (const stroke of doc.strokes) drawStroke(context, stroke);
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.globalCompositeOperation = 'destination-over';
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob(blob => {
    if (blob) resolve(blob);
    else reject(new Error('Não foi possível gerar a imagem. Tente novamente.'));
  }, 'image/png'));
}
