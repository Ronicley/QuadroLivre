import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { documentBounds } from './model.mjs';
import { drawStroke, drawTemplate } from './render.mjs';
import { MODES, resolveTemplate } from './catalog.mjs';
import { loadTemplate } from './templates.js';

function Preview({ doc }) {
  const canvas = useRef(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let stopped = false;
    setError('');
    loadTemplate(doc, true).then(image => {
      if (stopped) return;
      const context = canvas.current.getContext('2d');
      context.resetTransform();
      context.clearRect(0, 0, 480, 320);
      const bounds = documentBounds(doc);
      if (!bounds) return;
      const scale = Math.min(2, 448 / Math.max(bounds.width, 1), 288 / Math.max(bounds.height, 1));
      context.setTransform(scale, 0, 0, scale,
        240 - (bounds.x + bounds.width / 2) * scale, 160 - (bounds.y + bounds.height / 2) * scale);
      for (const stroke of doc.strokes) drawStroke(context, stroke);
      drawTemplate(context, doc, image, true);
    }).catch(reason => { if (!stopped) setError(reason.message); });
    return () => { stopped = true; };
  }, [doc]);
  return <><canvas ref={canvas} width="480" height="320" aria-hidden="true" />
    {error && <span className="board-error" role="status">{error}</span>}</>;
}

export default function Gallery({ boards, ready, busy, onNew, onOpen }) {
  const heading = useRef(null);
  useEffect(() => { heading.current.focus(); }, []);
  return <section className="gallery" aria-labelledby="gallery-title" aria-busy={!ready || busy}>
    <div className="gallery-heading">
      <div><h2 id="gallery-title" tabIndex={-1} ref={heading}>Meus desenhos</h2>
        <p>Escolha um desenho para continuar.</p></div>
      <button className="primary-button new-board" disabled={!ready || busy} onClick={onNew}>
        <Icon name="plus" />Novo desenho</button>
    </div>
    {!ready ? <p>Seus desenhos estão protegidos enquanto o app abre.</p>
      : !boards.length ? <div className="gallery-empty">
        <h3>Um novo espaço para imaginar.</h3>
        <p>Toque em “Novo desenho” para começar.<br />Cada desenho tem seu próprio quadro.</p>
      </div> : <ul className="board-grid">{boards.map(board => <li key={board.id}>
        <button className="board-card" onClick={() => onOpen(board.id)} disabled={busy || !board.doc}
          aria-label={`Abrir ${board.title}`} aria-describedby={board.error ? `error-${board.id}` : undefined}>
          {board.doc ? <Preview doc={board.doc} /> : <span className="preview-unavailable">Prévia indisponível</span>}
          <span className="board-caption"><strong>{board.title}</strong>
            <span>{board.doc ? board.doc.version === 2
              ? `${MODES[board.doc.mode]} · ${resolveTemplate(board.doc.template, board.doc.mode).title}`
              : board.doc.strokes.length ? 'Continuar desenho' : 'Quadro em branco' : 'Quadro protegido'}</span></span>
        </button>
        {board.error && <p className="board-error" id={`error-${board.id}`} role="alert">{board.error} Os dados foram mantidos.</p>}
      </li>)}</ul>}
  </section>;
}
