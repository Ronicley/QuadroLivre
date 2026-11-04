import React, { useEffect, useRef, useState } from 'react';
import DrawingCanvas from './DrawingCanvas.jsx';
import Icon from './Icon.jsx';
import { COLORS, WIDTHS, fitCamera, redo, undo, zoomAt } from './model.mjs';
import { exportPNG } from './render.mjs';
import { useBoard } from './useBoard.js';

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
  const { history, change, status, error, save } = useBoard();
  const [tool, setTool] = useState('pen');
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
  const dialog = useRef(null);
  const paletteRef = useRef(null);
  const doc = history?.doc;
  const enabled = Boolean(doc);

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
    const close = event => { if (!paletteRef.current?.contains(event.target)) setPalette(false); };
    const key = event => {
      if (event.key === 'Escape') setPalette(false);
      if (!doc || parents || event.target.matches('input, textarea')) return;
      if ((event.ctrlKey || event.metaKey) && ['z', 'y'].includes(event.key.toLowerCase())) {
        event.preventDefault();
        change(event.shiftKey || event.key.toLowerCase() === 'y' ? redo : undo, true);
      }
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', key); };
  }, [doc, parents, change]);

  useEffect(() => {
    if (parents) dialog.current.showModal();
    else dialog.current.close();
  }, [parents]);

  const fit = () => change(value => ({ ...value, doc: { ...value.doc,
    camera: fitCamera(value.doc.strokes, innerWidth, innerHeight, innerWidth < 600 ? 200 : 130) } }));
  const zoom = factor => change(value => ({ ...value, doc: { ...value.doc,
    camera: zoomAt(value.doc.camera, { x: innerWidth / 2, y: innerHeight / 2 }, factor) } }));
  const openParents = () => {
    setChallenge([Math.floor(Math.random() * 8) + 4, Math.floor(Math.random() * 7) + 3]);
    setAnswer(''); setGateError(''); setExportError(''); setUnlocked(false); setPalette(false); setParents(true);
  };
  const exportFile = async format => {
    setExporting(true); setExportError('');
    try {
      const blob = format === 'png' ? await exportPNG(doc)
        : new Blob([JSON.stringify(doc)], { type: 'application/json' });
      await download(blob, `quadro-livre-${new Date().toISOString().slice(0, 10)}.${format}`);
    } catch (reason) {
      if (reason.name !== 'AbortError') setExportError('Não foi possível exportar. Tente novamente e mantenha o quadro aberto.');
    } finally { setExporting(false); }
  };

  const statusLabel = {
    loading: 'Abrindo seu quadro…', blocked: 'Quadro protegido', saved: 'Salvo neste aparelho',
    empty: 'Seu quadro está pronto', saving: 'Salvando…', error: 'Ainda não foi salvo',
  }[status];

  return <main className="workspace">
    <DrawingCanvas doc={doc} change={change} tool={tool} color={color} width={width}
      enabled={enabled && !parents} onInteract={() => setPalette(false)} />

    <header className="topbar">
      <div className="identity">
        <span className="brand-mark"><Icon name="pen" size={24} /></span>
        <div><h1>Quadro Livre</h1><p>Desenho livre · protótipo web</p></div>
      </div>
      <div className="top-actions">
        <div className={`save-state ${status === 'error' || status === 'blocked' ? 'save-error' : ''}`} role="status" aria-live="polite">
          {status === 'saved' && <Icon name="check" size={16} />}<span>{statusLabel}</span>
        </div>
        <Tool label="Reenquadrar desenho" icon="fit" className="fit-button" disabled={!enabled} onClick={fit} />
        <Tool label="Área dos responsáveis" icon="lock" className="parent-button" onClick={openParents} />
      </div>
    </header>

    {error && <section className="error-banner" role="alert">
      <p>{error}</p>
      {status === 'blocked' ? <button onClick={() => location.reload()}>Tentar abrir novamente</button>
        : <button onClick={save}>Tentar salvar novamente</button>}
    </section>}

    {enabled && !doc.strokes.length && <div className="empty-hint" aria-hidden="true">
      <span className="hint-line" />
      <h2>Solte a imaginação.</h2>
      <p>Caneta para desenhar.<br />Dois dedos para mover e ampliar.</p>
      <span className="desktop-hint">No computador, use o mouse.</span>
    </div>}

    <div className="zoom-controls" aria-label="Ampliação do quadro">
      <Tool label="Diminuir zoom" icon="minus" disabled={!enabled || doc.camera.scale <= 0.15} onClick={() => zoom(0.8)} />
      <output aria-label="Zoom atual">{Math.round((doc?.camera.scale ?? 1) * 100)}%</output>
      <Tool label="Aumentar zoom" icon="plus" disabled={!enabled || doc.camera.scale >= 6} onClick={() => zoom(1.25)} />
    </div>

    <div className="bottom-area">
      <p className="input-hint">{tool === 'hand' ? 'Modo mover · arraste para explorar' : tool === 'eraser'
        ? 'Borracha · apague com a caneta' : 'Caneta desenha · dedos movimentam'}</p>
      <div className="dock" role="toolbar" aria-label="Ferramentas de desenho">
        <div className="palette-anchor" ref={paletteRef}>
          <Tool label="Escolher cor" disabled={!enabled} aria-expanded={palette} aria-controls="palette"
            onClick={() => setPalette(!palette)}>
            <span className="current-color" style={{ backgroundColor: color }} />
          </Tool>
          {palette && <div className="palette" id="palette" role="group" aria-label="Cores da canetinha">
            <p>Qual é a sua cor?</p>
            <div className="swatches">{COLORS.map(([value, label]) => <button key={value} type="button"
              aria-label={label} aria-pressed={color === value} className="swatch" style={{ '--swatch': value }}
              onClick={() => { setColor(value); setTool('pen'); setPalette(false); }}>
              {color === value && <Icon name="check" size={20} />}
            </button>)}</div>
          </div>}
        </div>
        <Tool label="Canetinha" icon="pen" selected={tool === 'pen'} disabled={!enabled} onClick={() => setTool('pen')} />
        <div className="widths" role="group" aria-label="Espessura do traço">
          {WIDTHS.map((value, index) => <button key={value} type="button" aria-label={['Traço fino', 'Traço médio', 'Traço grosso'][index]}
            aria-pressed={width === value} disabled={!enabled} onClick={() => { setWidth(value); setTool('pen'); }}>
            <span style={{ width: 6 + index * 6, height: 6 + index * 6 }} />
          </button>)}
        </div>
        <Tool label="Borracha" icon="eraser" className="eraser-button" selected={tool === 'eraser'} disabled={!enabled} onClick={() => setTool('eraser')} />
        <span className="dock-divider" />
        <Tool label="Desfazer" icon="undo" disabled={!doc?.strokes.length} onClick={() => change(undo, true)} />
        <Tool label="Refazer" icon="redo" disabled={!history?.redo.length} onClick={() => change(redo, true)} />
        <Tool label="Mover quadro" icon="hand" className="hand-button" selected={tool === 'hand'} disabled={!enabled} onClick={() => setTool(tool === 'hand' ? 'pen' : 'hand')} />
      </div>
      <p className="offline-state">{offlineReady ? 'Pronto para desenhar sem internet' : import.meta.env.DEV
        ? 'Modo desenvolvimento · offline disponível no build' : offlineError || 'Preparando modo offline…'}
        {!online && ' · Sem conexão'}</p>
    </div>

    <dialog ref={dialog} className="parents-dialog" onCancel={() => setParents(false)} onClose={() => setParents(false)}
      aria-labelledby="parents-title">
      <div className="dialog-heading"><h2 id="parents-title">Área dos responsáveis</h2>
        <Tool label="Fechar área dos responsáveis" icon="close" onClick={() => setParents(false)} /></div>
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
          <p>O desenho fica só neste navegador. Limpar dados do site pode apagá-lo. Exporte antes de trocar de aparelho.</p>
          <div className="export-actions">
            <button disabled={!enabled || exporting} onClick={() => exportFile('png')}><Icon name="download" size={20} />Salvar imagem PNG</button>
            <button disabled={!enabled || exporting} onClick={() => exportFile('json')}><Icon name="download" size={20} />Backup dos traços</button>
          </div>
          <p className="fine-print">PNG não é editável. Backup JSON preserva traços; restauração pela interface ainda não disponível. Guarde o arquivo para uma etapa futura.</p>
          {exportError && <p className="form-error" role="alert">{exportError}</p>}
        </section>
        <section><h3>Instalar no iPad</h3>
          <p>No Safari, abra Compartilhar e escolha <strong>Adicionar à Tela de Início</strong>. Depois de ver “Pronto para desenhar sem internet”, teste abrindo sem conexão.</p>
          {offlineError && <p className="form-error">{offlineError}</p>}
        </section>
        <section><h3>Primeiro, testar a caneta</h3>
          <p>Este protótipo tem um quadro livre. Teste palma apoiada, dois dedos, borracha, histórico e reabertura. Catálogo e galeria vêm depois da validação.</p>
          <p className="fine-print">Nenhum desenho do aplicativo Swift é alterado ou importado. Sem contas, anúncios ou envio automático de dados.</p>
        </section>
      </div>}
    </dialog>
  </main>;
}
