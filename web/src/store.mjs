import { validateDocument } from './model.mjs';

function validateGallery(value) {
  if (!value || ![1, 2].includes(value.version) || !Array.isArray(value.ids) ||
      (value.version === 1 && value.ids[0] !== 'current') ||
      new Set(value.ids).size !== value.ids.length || [...value.ids].some(id =>
        typeof id !== 'string' || (id !== 'current' && !/^board:[\da-f-]{36}$/.test(id)))) {
    throw new Error('Formato de galeria inválido. Os desenhos originais não foram substituídos.');
  }
  if (value.version === 1) return { version: 2, ids: value.ids,
    numbers: value.ids.map((_, index) => index + 1), nextNumber: value.ids.length + 1 };
  if (!Array.isArray(value.numbers) || value.numbers.length !== value.ids.length ||
      !Number.isSafeInteger(value.nextNumber) || value.nextNumber < 1 ||
      new Set(value.numbers).size !== value.numbers.length || [...value.numbers].some(number =>
        !Number.isSafeInteger(number) || number < 1 || number >= value.nextNumber)) {
    throw new Error('Numeração de galeria inválida. Os desenhos originais não foram substituídos.');
  }
  return value;
}

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
      let result, failure;
      const fail = error => { failure = error; tx.abort(); };
      tx.oncomplete = () => resolve(result);
      tx.onabort = () => reject(failure ?? tx.error ?? new Error('O armazenamento local cancelou a gravação.'));
      try { operation(tx.objectStore('boards'), value => { result = value; }, fail); }
      catch (error) { fail(error); }
    });
  }

  return {
    async list() {
      return transaction('readwrite', (store, done, fail) => {
        const index = store.get('gallery');
        index.onsuccess = () => {
          try {
            if (index.result !== undefined) {
              const { ids, numbers } = validateGallery(index.result);
              const boards = new Array(ids.length);
              if (!ids.length) done(boards);
              let remaining = ids.length;
              ids.forEach((id, position) => {
                const request = store.get(id);
                request.onsuccess = () => {
                  const board = { id, title: `Desenho ${numbers[position]}` };
                  try { board.doc = validateDocument(request.result); }
                  catch (error) { board.error = error.message; }
                  boards[position] = board;
                  if (--remaining === 0) done(boards);
                };
              });
              return;
            }
            const legacy = store.get('current');
            legacy.onsuccess = () => {
              try {
                if (legacy.result === undefined) { done([]); return; }
                const doc = validateDocument(legacy.result);
                // Keep the original key and bytes readable by the previous app.
                store.put({ version: 1, ids: ['current'] }, 'gallery');
                done([{ id: 'current', title: 'Desenho 1', doc }]);
              } catch (error) { fail(error); }
            };
          } catch (error) { fail(error); }
        };
      });
    },
    async create(doc) {
      validateDocument(doc);
      return transaction('readwrite', (store, done, fail) => {
        const request = store.get('gallery');
        request.onsuccess = () => {
          try {
            const index = request.result === undefined ? { version: 2, ids: [], numbers: [], nextNumber: 1 } : validateGallery(request.result);
            const id = index.nextNumber === 1 ? 'current' : `board:${crypto.randomUUID()}`;
            store.add(doc, id);
            store.put({ version: 2, ids: [...index.ids, id], numbers: [...index.numbers, index.nextNumber],
              nextNumber: index.nextNumber + 1 }, 'gallery');
            done({ id, title: `Desenho ${index.nextNumber}`, doc });
          } catch (error) { fail(error); }
        };
      });
    },
    async save(id, doc) {
      validateDocument(doc);
      await transaction('readwrite', (store, done, fail) => {
        const request = store.get('gallery');
        request.onsuccess = () => {
          try {
            if (!validateGallery(request.result).ids.includes(id)) throw new Error('Quadro não encontrado na galeria.');
            store.put(doc, id);
          } catch (error) { fail(error); }
        };
      });
    },
    async remove(id) {
      await transaction('readwrite', (store, done, fail) => {
        const request = store.get('gallery');
        request.onsuccess = () => {
          try {
            const index = validateGallery(request.result);
            const position = index.ids.indexOf(id);
            if (position === -1) throw new Error('Quadro não encontrado na galeria.');
            store.delete(id);
            store.put({ ...index, ids: index.ids.filter((_, i) => i !== position),
              numbers: index.numbers.filter((_, i) => i !== position) }, 'gallery');
          } catch (error) { fail(error); }
        };
      });
    },
    close: () => db.close(),
  };
}
