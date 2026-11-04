import { useCallback, useEffect, useRef, useState } from 'react';
import { emptyDocument, fitCamera } from './model.mjs';
import { openStore } from './store.mjs';

export function useBoard() {
  const [history, setHistory] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const current = useRef(null);
  const store = useRef(null);
  const timer = useRef(null);
  const saved = useRef(null);

  const save = useCallback(async () => {
    clearTimeout(timer.current);
    const doc = current.current?.doc;
    if (!store.current || !doc || doc === saved.current) return;
    setStatus('saving');
    try {
      await store.current.save(doc);
      saved.current = doc;
      if (current.current.doc === doc) { setStatus('saved'); setError(''); }
    } catch {
      if (current.current.doc === doc) {
        setStatus('error');
        setError('Não foi possível salvar neste aparelho. Mantenha esta janela aberta, tente novamente ou exporte um backup na área dos responsáveis.');
      }
    }
  }, []);

  useEffect(() => {
    let stopped = false;
    let release;
    async function load() {
      if (!window.isSecureContext || !navigator.locks) {
        throw new Error('Abra por HTTPS (ou localhost) em um navegador atualizado. O quadro não foi alterado.');
      }
      await navigator.locks.request('quadro-livre-editor', { ifAvailable: true }, async lock => {
        if (stopped) return;
        if (!lock) throw new Error('O quadro já está aberto em outra janela. Feche a outra janela e tente novamente aqui.');
        const database = await openStore();
        try {
          const loaded = await database.load();
          if (stopped) return;
          const doc = loaded ?? { ...emptyDocument(), camera: fitCamera([], window.innerWidth, window.innerHeight) };
          current.current = { doc, redo: [] };
          saved.current = loaded;
          store.current = database;
          setHistory(current.current);
          setStatus(loaded ? 'saved' : 'empty');
          await new Promise(resolve => { release = resolve; });
        } finally { database.close(); }
      });
    }
    load().catch(reason => {
      if (!stopped) { setStatus('blocked'); setError(reason.message || 'O armazenamento local não está disponível. Tente novamente.'); }
    });
    const onHide = () => { if (document.visibilityState === 'hidden') void save(); };
    window.addEventListener('pagehide', save);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      stopped = true;
      clearTimeout(timer.current);
      release?.();
      store.current = null;
      window.removeEventListener('pagehide', save);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [save]);

  const change = useCallback((update, immediate = false) => {
    if (!current.current) return;
    const previous = current.current;
    const next = update(previous);
    if (previous === next) return;
    current.current = next;
    setHistory(next);
    if (next.doc !== previous.doc) {
      setStatus('saving');
      clearTimeout(timer.current);
      // Strokes are written immediately; viewport-only changes can be coalesced.
      if (immediate) void save();
      else timer.current = setTimeout(save, 400);
    }
  }, [save]);

  return { history, change, status, error, save };
}
