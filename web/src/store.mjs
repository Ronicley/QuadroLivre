import { validateDocument } from './model.mjs';

export async function openStore() {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('quadro-livre-pwa', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('boards');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Feche outras janelas do Quadro Livre e tente novamente.'));
  });
  db.onversionchange = () => db.close();

  function transaction(mode, operation) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('boards', mode);
      const request = operation(tx.objectStore('boards'));
      tx.oncomplete = () => resolve(request.result);
      tx.onabort = () => reject(tx.error ?? new Error('O armazenamento local cancelou a gravação.'));
      tx.onerror = () => reject(tx.error);
    });
  }

  return {
    async load() {
      const doc = await transaction('readonly', store => store.get('current'));
      return doc === undefined ? null : validateDocument(doc);
    },
    async save(doc) {
      validateDocument(doc);
      await transaction('readwrite', store => store.put(doc, 'current'));
    },
    close: () => db.close(),
  };
}
