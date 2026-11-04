import catalog from '../catalog/catalog.json' with { type: 'json' };

export { catalog };
export const MODES = { free: 'Livre', trace: 'Seguir contorno', coloring: 'Colorir' };

export function resolveTemplate(template, mode) {
  const item = [...catalog.items, ...catalog.archivedItems].find(item =>
    item.id === template?.id && item.assetVersion === template?.assetVersion);
  if (!item || !['trace', 'coloring'].includes(mode)) {
    throw new Error('A versão exata deste modelo não está disponível. O desenho foi preservado; restaure o modelo antes de abrir ou exportar.');
  }
  return item;
}
