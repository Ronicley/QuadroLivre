import React, { useEffect, useRef, useState } from 'react';
import DrawingCanvas from './DrawingCanvas.jsx';
import Gallery from './Gallery.jsx';
import NewBoard from './NewBoard.jsx';
import Icon from './Icon.jsx';
import { COLORS, WIDTHS, INSTRUMENTS, fitDocument, redo, undo, zoomAt } from './model.mjs';
import { MODES, resolveTemplate } from './catalog.mjs';
import { exportPNG } from './render.mjs';
import { useBoard } from './useBoard.js';
import { readBackup } from './backup.mjs';

function Tool({ label, icon, selected, className = '', children, ...props }) {
  return <button type="button" className={`tool ${className}`} aria-label={label} title={label}
    aria-pressed={selected} {...props}>{icon && <Icon name={icon} />}{children}</button>;
}

async function download(blob, filename) {
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file] });
    return;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export default function App() {
  const { history, change, status, error, save, boards, boardId, gallery, busy, template, openBoard, newBoard, showGallery, deleteBoard, dismissError } = useBoard();
  const [creating, setCreating] = useState(false);
  const [tool, setTool] = useState('pen');
  const [instrument, setInstrument] = useState('pen');
  const [instrumentsOpen, setInstrumentsOpen] = useState(false);
  const [color, setColor] = useState(COLORS[1][0]);
  const [width, setWidth] = useState(WIDTHS[1]);
  const [palette, setPalette] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [offlineError, setOfflineError] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  const [parents, setParents] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [challenge, setChallenge] = useState([7, 5]);
  const [answer, setAnswer] = useState('');
  const [gateError, setGateError] = useState('');
  const [exportError, setExportError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const dialog = useRef(null);
  const paletteRef = useRef(null);
  const instrumentsRef = useRef(null);
  const instrumentButton = useRef(null);
  const finishStroke = useRef(null);
  const galleryButton = useRef(null);
  const doc = history?.doc;
  const enabled = Boolean(doc) && !gallery && !busy;
  const title = boards.find(board => board.id === boardId)?.title;

  useEffect(() => {
    if (!gallery && !busy) galleryButton.current?.focus();
  }, [gallery, boardId, busy]);

  useEffect(() => {
    const network = () => setOnline(navigator.onLine);
    addEventListener('online', network);
    addEventListener('offline', network);
    let stopped = false;
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then(async registration => {
        await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Offline setup timed out')), 30_000)),
        ]);
        if (!stopped) setOfflineReady(Boolean(registration.active));
      }).catch(() => {
        if (!stopped) setOfflineError('O modo offline não ficou pronto. Conecte-se e reabra o app para tentar novamente.');
      });
    } else if (import.meta.env.PROD) {
      setOfflineError('Modo offline indisponível neste navegador. Use Safari atualizado e HTTPS.');
    }
    return () => { stopped = true; removeEventListener('online', network); removeEventListener('offline', network); };
  }, []);

  useEffect(() => {
    const close = event => {
      if (!paletteRef.current?.contains(event.target)) setPalette(false);
      if (!instrumentsRef.current?.contains(event.target)) setInstrumentsOpen(false);
    };
    const key = event => {
      if (event.key === 'Escape') setPalette(false);
      if (event.key === 'Escape' && instrumentsOpen) {
        setInstrumentsOpen(false);
        instrumentButton.current?.focus();
      }
      if (!enabled || parents || event.target.matches('input, textarea')) return;
      if ((event.ctrlKey || event.metaKey) && ['z', 'y'].includes(event.key.toLowerCase())) {
        event.preventDefault();
        change(event.shiftKey || event.key.toLowerCase() === 'y' ? redo : undo, true);
      }
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', key); };
  }, [enabled, parents, change, instrumentsOpen]);

  useEffect(() => {
    if (parents) dialog.current.showModal();
    else dialog.current.close();
  }, [parents]);

  const fit = () => change(value => ({ ...value, doc: { ...value.doc,
    camera: fitDocument(value.doc, innerWidth, innerHeight, innerWidth < 600 ? 200 : 130) } }));
  const zoom = factor => change(value => ({ ...value, doc: { ...value.doc,
    camera: zoomAt(value.doc.camera, { x: innerWidth / 2, y: innerHeight / 2 }, factor) } }));
  const openParents = () => {
    finishStroke.current?.();
    setChallenge([Math.floor(Math.random() * 8) + 4, Math.floor(Math.random() * 7) + 3]);
    setAnswer(''); setGateError(''); setExportError(''); setUnlocked(false); setPalette(false); setInstrumentsOpen(false); setParents(true);
    setRestoreError(''); setDeleteId(null); setDeleteError('');
  };
  const goToGallery = () => {
    finishStroke.current?.();
    setPalette(false);
    setInstrumentsOpen(false);
    void showGallery();
  };
  const createBoard = async candidate => {
    const doc = candidate ? { ...candidate, camera: fitDocument(candidate, innerWidth, innerHeight, innerWidth < 600 ? 200 : 130) } : null;
    if (await newBoard(doc)) { setCreating(false); setTool(instrument); }
  };
  const exportFile = async format => {
    setExporting(true); setExportError('');
    try {
      const blob = format === 'png' ? await exportPNG(doc, template)
        : new Blob([JSON.stringify(doc)], { type: 'application/json' });
      await download(blob, `quadro-livre-${new Date().toISOString().slice(0, 10)}.${format}`);
    } catch (reason) {
      if (reason.name !== 'AbortError') setExportError('Não foi possível exportar. Tente novamente e mantenha o quadro aberto.');
    } finally { setExporting(false); }
  };
  const restoreFile = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setRestoring(true); setRestoreError('');
    try {
      const restored = await readBackup(file);
      finishStroke.current?.();
      if (await newBoard(restored)) { setParents(false); setCreating(false); setTool(instrument); }
      else setRestoreError('Não foi possível restaurar. Confira o aviso do app e tente novamente. Os desenhos anteriores foram mantidos.');
    } catch (reason) { setRestoreError(reason.message); }
    finally { setRestoring(false); }
  };

  const statusLabel = {
    loading: 'Abrindo seus desenhos…', ready: 'Desenhos neste aparelho', blocked: 'Quadro protegido', saved: 'Salvo neste aparelho',
    saving: 'Salvando…', error: 'Ainda não foi salvo',
  }[status];

  return <main className={`workspace${gallery ? ' gallery-workspace' : ''}`}>
    {!gallery && <DrawingCanvas key={boardId} doc={doc} template={template} change={change} tool={tool} color={color} width={width}
      enabled={enabled && !parents} finishRef={finishStroke} onInteract={() => { setPalette(false); setInstrumentsOpen(false); }} />}

    {gallery && (creating ? <NewBoard busy={busy} onCreate={createBoard} onCancel={() => setCreating(false)} />
      : <Gallery boards={boards} ready={!['loading', 'blocked'].includes(status)} busy={busy}
        onNew={() => setCreating(true)} onOpen={openBoard} />)}

    <header className="topbar">
      <div className="identity">
        <span className="brand-mark"><Icon name="pen" size={24} /></span>
        <div><h1>Quadro Livre</h1><p>{gallery ? 'Sua galeria local' : `${title} · ${MODES[doc.mode ?? 'free']}`}</p></div>
      </div>
      <div className="top-actions">
        <div className={`save-state ${status === 'error' || status === 'blocked' ? 'save-error' : ''}`} role="status" aria-live="polite">
          {status === 'saved' && <Icon name="check" size={16} />}<span>{statusLabel}</span>
        </div>
        {!gallery && <>
          <Tool label="Meus desenhos" icon="gallery" ref={galleryButton} disabled={!enabled} onClick={goToGallery} />
          <Tool label="Reenquadrar desenho" icon="fit" className="fit-button" disabled={!enabled} onClick={fit} />
        </>}
        <Tool label="Área dos responsáveis" icon="lock" className="parent-button" onClick={openParents} />
      </div>
    </header>

    {error && <section className="error-banner" role="alert">
      <p>{error}</p>
      {status === 'blocked' ? <button onClick={() => location.reload()}>Tentar abrir novamente</button>
        : status === 'error' ? <button disabled={busy} onClick={save}>Tentar salvar novamente</button>
          : <button onClick={dismissError}>Fechar aviso</button>}
    </section>}

    {enabled && doc.version === 1 && !doc.strokes.length && <div className="empty-hint" aria-hidden="true">
      <span className="hint-line" />
      <h2>Solte a imaginação.</h2>
      <p>Caneta para desenhar.<br />Dois dedos para mover e ampliar.</p>
      <span className="desktop-hint">No computador, use o mouse.</span>
    </div>}

    {!gallery && <><div className="zoom-controls" aria-label="Ampliação do quadro">
      <Tool label="Diminuir zoom" icon="minus" disabled={!enabled || doc.camera.scale <= 0.15} onClick={() => zoom(0.8)} />
      <output aria-label="Zoom atual">{Math.round((doc?.camera.scale ?? 1) * 100)}%</output>
      <Tool label="Aumentar zoom" icon="plus" disabled={!enabled || doc.camera.scale >= 6} onClick={() => zoom(1.25)} />
    </div>

    <div className="bottom-area">
      <p className="input-hint">{tool === 'hand' ? 'Modo mover · arraste para explorar' : tool === 'eraser'
        ? 'Borracha · apague com a caneta' : `${INSTRUMENTS.find(([id]) => id === instrument)[1]} · dedos movimentam`}</p>
      <div className="dock" role="toolbar" aria-label="Ferramentas de desenho">
        <div className="palette-anchor" ref={paletteRef}>
          <Tool label="Escolher cor" disabled={!enabled} aria-expanded={palette} aria-controls="palette"
            onClick={() => { setPalette(!palette); setInstrumentsOpen(false); }}>
            <span className="current-color" style={{ backgroundColor: color }} />
          </Tool>
          {palette && <div className="palette" id="palette" role="group" aria-label="Cores do traço">
            <p>Qual é a sua cor?</p>
            <div className="swatches">{COLORS.map(([value, label]) => <button key={value} type="button"
              aria-label={label} aria-pressed={color === value} className="swatch" style={{ '--swatch': value }}
              onClick={() => { setColor(value); setTool(instrument); setPalette(false); }}>
              {color === value && <Icon name="check" size={20} />}
            </button>)}</div>
            <label className="custom-color" htmlFor="custom-color">
              <span>Outra cor</span>
              <input id="custom-color" type="color" value={color} onChange={event => {
                setColor(event.target.value); setTool(instrument);
              }} />
            </label>
          </div>}
        </div>
        <div className="instrument-anchor" ref={instrumentsRef}>
          <Tool label="Escolher instrumento" title={`Instrumento: ${INSTRUMENTS.find(([id]) => id === instrument)[1]}`}
            icon={instrument} ref={instrumentButton} selected={tool === instrument} disabled={!enabled}
            aria-expanded={instrumentsOpen} aria-controls="instruments"
            onClick={() => { setTool(instrument); setInstrumentsOpen(!instrumentsOpen); setPalette(false); }}>
            <span className="instrument-chevron"><Icon name="chevron" size={14} /></span>
          </Tool>
          {instrumentsOpen && <div className="instruments palette" id="instruments" role="group" aria-label="Instrumentos de desenho">
            <p>Com o que vamos desenhar?</p>
            <div className="instrument-options">{INSTRUMENTS.map(([id, label]) => <button key={id} type="button"
              aria-pressed={instrument === id} onClick={() => {
                finishStroke.current?.();
                setInstrument(id); setTool(id); setInstrumentsOpen(false); instrumentButton.current?.focus();
              }}><Icon name={id} /><span>{label}</span></button>)}</div>
          </div>}
        </div>
        <div className="widths" role="group" aria-label="Espessura do traço">
          {WIDTHS.map((value, index) => <button key={value} type="button" aria-label={['Traço fino', 'Traço médio', 'Traço grosso'][index]}
            aria-pressed={width === value} disabled={!enabled} onClick={() => { setWidth(value); setTool(instrument); }}>
            <span style={{ width: 6 + index * 6, height: 6 + index * 6 }} />
          </button>)}
        </div>
        <Tool label="Borracha" icon="eraser" className="eraser-button" selected={tool === 'eraser'} disabled={!enabled} onClick={() => setTool('eraser')} />
        <span className="dock-divider" />
        <Tool label="Desfazer" icon="undo" disabled={!enabled || !doc?.strokes.length} onClick={() => change(undo, true)} />
        <Tool label="Refazer" icon="redo" disabled={!enabled || !history?.redo.length} onClick={() => change(redo, true)} />
        <Tool label="Mover quadro" icon="hand" className="hand-button" selected={tool === 'hand'} disabled={!enabled} onClick={() => setTool(tool === 'hand' ? instrument : 'hand')} />
      </div>
    </div></>}
    <div className={gallery ? 'gallery-offline' : 'editor-offline'}>
      <p className="offline-state">{offlineReady ? 'Pronto para desenhar sem internet' : import.meta.env.DEV
        ? 'Modo desenvolvimento · offline disponível no build' : offlineError || 'Preparando modo offline…'}
        {!online && ' · Sem conexão'}</p>
    </div>

    <dialog ref={dialog} className="parents-dialog" onCancel={event => {
      if (busy || restoring || exporting) event.preventDefault(); else setParents(false);
    }} onClose={() => setParents(false)}
      aria-labelledby="parents-title">
      <div className="dialog-heading"><h2 id="parents-title">Área dos responsáveis</h2>
        <Tool label="Fechar área dos responsáveis" icon="close" disabled={busy || restoring || exporting} onClick={() => setParents(false)} /></div>
      {!unlocked ? <form onSubmit={event => {
        event.preventDefault();
        if (Number(answer) === challenge[0] + challenge[1]) { setUnlocked(true); setGateError(''); }
        else { setGateError('Ainda não. Confira a soma e tente novamente.'); setAnswer(''); }
      }}>
        <p>Peça ajuda a um adulto para continuar.</p>
        <label className="gate-label" htmlFor="parent-answer">Quanto é {challenge[0]} + {challenge[1]}?</label>
        <input id="parent-answer" autoFocus inputMode="numeric" pattern="[0-9]*" required autoComplete="off" value={answer}
          onChange={event => setAnswer(event.target.value)} aria-describedby={gateError ? 'gate-error' : undefined} />
        {gateError && <p className="form-error" id="gate-error" role="alert">{gateError}</p>}
        <button type="submit" className="primary-button">Continuar</button>
        <p className="fine-print">Barreira infantil, não autenticação.</p>
      </form> : <div className="parent-content">
        <section><h3>Guarde uma cópia</h3>
          <p>Os desenhos ficam só neste navegador. Limpar dados do site pode apagá-los. Abra cada desenho na galeria e exporte antes de trocar de aparelho.</p>
          <div className="export-actions">
            <button disabled={!enabled || exporting || restoring} onClick={() => exportFile('png')}><Icon name="download" size={20} />Salvar imagem PNG</button>
            <button disabled={!enabled || exporting || restoring} onClick={() => exportFile('json')}><Icon name="download" size={20} />Backup dos traços</button>
          </div>
          <p className="fine-print">PNG não é editável. Backup JSON preserva traços, modelo e enquadramento para restaurar como outro desenho.</p>
          {exportError && <p className="form-error" role="alert">{exportError}</p>}
        </section>
        <section><h3>Restaurar um desenho</h3>
          <p>Escolha um backup JSON do Quadro Livre web, até 50 MiB. Ele será aberto como outro desenho; nenhum quadro existente será substituído.</p>
          <label className="backup-label" htmlFor="restore-backup">Arquivo de backup JSON</label>
          <input id="restore-backup" type="file" accept=".json,application/json" disabled={busy || restoring || exporting} onChange={restoreFile} />
          {restoring && <p role="status">Validando e restaurando…</p>}
          {restoreError && <p className="form-error" role="alert">{restoreError}</p>}
          <p className="fine-print">Não aceita PNG nem arquivos PencilKit do aplicativo nativo.</p>
        </section>
        <section><h3>Excluir um desenho</h3>
          <p>A exclusão é definitiva neste aparelho. Exporte um backup antes de continuar.</p>
          {deleteId ? <div className="delete-confirm" role="group" aria-label="Confirmar exclusão">
            <p>Excluir {boards.find(board => board.id === deleteId)?.title}? Esta ação não pode ser desfeita.</p>
            <div className="export-actions">
              <button autoFocus disabled={busy || restoring || exporting} onClick={() => { setDeleteId(null); setDeleteError(''); }}>Cancelar exclusão</button>
              <button className="danger-button" disabled={busy || restoring || exporting} onClick={async () => {
                setDeleteError('');
                if (await deleteBoard(deleteId)) setDeleteId(null);
                else setDeleteError('Não foi possível excluir. O desenho foi mantido; tente novamente.');
              }}>Excluir definitivamente</button>
            </div>
            {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
          </div> : <ul className="delete-list">{boards.map(board => <li key={board.id}>
            <span>{board.title}</span><button className="secondary-button" disabled={busy || restoring || exporting}
              aria-label={`Excluir ${board.title}`} onClick={() => setDeleteId(board.id)}>Excluir</button>
          </li>)}</ul>}
          {!boards.length && <p>Nenhum desenho para excluir.</p>}
        </section>
        <section><h3>Instalar no iPad</h3>
          <p>No Safari, abra Compartilhar e escolha <strong>Adicionar à Tela de Início</strong>. Depois de ver “Pronto para desenhar sem internet”, teste abrindo sem conexão.</p>
          {offlineError && <p className="form-error">{offlineError}</p>}
        </section>
        <section><h3>Seus desenhos, separados</h3>
          <p>“Meus desenhos” volta à galeria depois de salvar. “Novo desenho” oferece Livre, Seguir contorno e Colorir sem apagar os anteriores. A borracha apaga só a tinta; os modelos ficam protegidos.</p>
          {doc?.version === 2 && <p className="fine-print">Modelo: {resolveTemplate(doc.template, doc.mode).title}, versão {doc.template.assetVersion}. {resolveTemplate(doc.template, doc.mode).author}. {resolveTemplate(doc.template, doc.mode).license}</p>}
          <p className="fine-print">Nenhum desenho do aplicativo Swift é alterado ou importado. Sem contas, anúncios ou envio automático de dados.</p>
        </section>
      </div>}
    </dialog>
  </main>;
}
