import { resolveTemplate } from './catalog.mjs';

const urls = import.meta.glob('../catalog/*.png', { eager: true, query: '?url', import: 'default' });
const images = new Map();

export function templateURL(item, mode, thumbnail = false) {
  const name = item.variants[mode][thumbnail ? 'thumbnail' : 'asset'];
  const url = urls[`../catalog/${name}.png`];
  if (!url) throw new Error('Arquivo do modelo indisponível. O desenho não foi alterado.');
  return url;
}

export async function loadTemplate(doc, thumbnail = false) {
  if (doc.version === 1) return null;
  const item = resolveTemplate(doc.template, doc.mode);
  const url = templateURL(item, doc.mode, thumbnail);
  if (!images.has(url)) {
    // Bound decoded images on iPad; rendered previews retain their own canvas pixels.
    if (images.size >= 8) images.delete(images.keys().next().value);
    const image = new Image();
    image.src = url;
    images.set(url, image.decode().then(() => image).catch(() => {
      images.delete(url);
      throw new Error('Não foi possível carregar o modelo. Conecte-se e tente novamente; o desenho foi preservado.');
    }));
  }
  return images.get(url);
}
