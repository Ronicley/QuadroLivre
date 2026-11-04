import { validateDocument } from './model.mjs';

export const MAX_BACKUP_BYTES = 50 * 1024 * 1024;

export async function readBackup(file) {
  if (!file || file.size > MAX_BACKUP_BYTES) throw new Error('Escolha um backup JSON de até 50 MiB. Nenhum desenho foi alterado.');
  let doc;
  try { doc = JSON.parse(await file.text()); }
  catch { throw new Error('Não foi possível ler este JSON. Escolha um backup do Quadro Livre web; nenhum desenho foi alterado.'); }
  return validateDocument(doc);
}
