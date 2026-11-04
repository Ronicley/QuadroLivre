import { useCallback, useEffect, useRef, useState } from 'react';
import { emptyDocument, fitCamera } from './model.mjs';
import { openStore } from './store.mjs';
import { loadTemplate } from './templates.js';

export function useBoard() {
  const [history, setHistory] = useState(null);
  const [boards, setBoards] = useState([]);
  const [boardId, setBoardId] = useState(null);
  const [gallery, setGallery] = useState(true);
  const [busy, setBusy] = useState(false);
  const [template, setTemplate] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const current = useRef(null);
  const activeId = useRef(null);
  const histories = useRef(new Map());
  const store = useRef(null);
  const timer = useRef(null);
  const saved = useRef(null);
  const navigating = useRef(false);

  const save = useCallback(async () => {
    clearTimeout(timer.current);
    const doc = current.current?.doc;
    const id = activeId.current;
    if (!store.current || !doc) return false;
    if (doc === saved.current) return true;
    setStatus('saving');
    try {
      await store.current.save(id, doc);
      if (activeId.current === id) {
        saved.current = doc;
        setBoards(values => values.map(board => board.id === id ? { ...board, doc } : board));
        if (current.current.doc === doc) { setStatus('saved'); setError(''); }
      }
      return current.current?.doc === doc;
    } catch {
      if (activeId.current === id && current.current.doc === doc) {
        setStatus('error');
        setError('Não foi possível salvar neste aparelho. Mantenha esta janela aberta, tente novamente ou exporte um backup na área dos responsáveis.');
      }
      return false;
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
          const loaded = await database.list();
          if (stopped) return;
          store.current = database;
          setBoards(loaded);
          setStatus('ready');
          await new Promise(resolve => { release = resolve; });
        } finally { database.close(); }
      });
    }
    load().catch(reason => {
      if (!stopped) { setStatus('blocked'); setError(reason?.message || 'O armazenamento local não está disponível. Tente novamente.'); }
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
    if (!current.current || navigating.current) return;
    const previous = current.current;
    const next = update(previous);
    if (previous === next) return;
    current.current = next;
    histories.current.set(activeId.current, next);
    setHistory(next);
    if (next.doc !== previous.doc) {
      setStatus('saving');
      clearTimeout(timer.current);
      // Strokes are written immediately; viewport-only changes can be coalesced.
      if (immediate) void save();
      else timer.current = setTimeout(save, 400);
    }
  }, [save]);

  const navigate = useCallback(async (id, create = false, providedDoc = null) => {
    if (!store.current || navigating.current) return;
    navigating.current = true;
    setBusy(true);
    try {
      if (current.current && !await save()) return false;
      let board;
      let image;
      if (create) {
        const doc = providedDoc ?? { ...emptyDocument(), camera: fitCamera([], innerWidth, innerHeight) };
        image = await loadTemplate(doc);
        board = await store.current.create(doc);
        setBoards(values => [...values, board]);
      } else if (id) {
        board = boards.find(value => value.id === id);
        if (!board?.doc) return false;
        image = await loadTemplate(board.doc);
      }
      if (board) {
        const next = histories.current.get(board.id) ?? { doc: board.doc, redo: [] };
        activeId.current = board.id;
        current.current = next;
        saved.current = next.doc;
        histories.current.set(board.id, next);
        setBoardId(board.id);
        setHistory(next);
        setTemplate(image);
        setGallery(false);
        setStatus('saved');
      } else {
        setGallery(true);
        setStatus('ready');
      }
      setError('');
      return true;
    } catch (reason) {
      setError(reason?.message?.includes('modelo') ? reason.message : 'Não foi possível criar o desenho. Os desenhos anteriores foram mantidos. Tente novamente; se houver um quadro aberto, você pode exportá-lo em Responsáveis.');
      return false;
    } finally {
      navigating.current = false;
      setBusy(false);
    }
  }, [boards, save]);

  const deleteBoard = useCallback(async id => {
    if (!store.current || navigating.current) return false;
    navigating.current = true;
    setBusy(true);
    try {
      if (current.current && !await save()) return false;
      await store.current.remove(id);
      setBoards(values => values.filter(board => board.id !== id));
      histories.current.delete(id);
      if (activeId.current === id) {
        current.current = null;
        activeId.current = null;
        saved.current = null;
        setBoardId(null);
        setHistory(null);
        setTemplate(null);
        setGallery(true);
        setStatus('ready');
      }
      setError('');
      return true;
    } catch {
      setError('Não foi possível excluir. O desenho foi mantido. Tente novamente na área dos responsáveis.');
      return false;
    } finally {
      navigating.current = false;
      setBusy(false);
    }
  }, [save]);

  return { history, change, status, error, save, boards, boardId, gallery, busy, template, dismissError: () => setError(''),
    openBoard: id => navigate(id), newBoard: doc => navigate(null, true, doc), showGallery: () => navigate(null), deleteBoard };
}
