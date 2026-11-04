import React, { useEffect, useRef, useState } from 'react';
import { catalog, MODES } from './catalog.mjs';
import { activityDocument } from './model.mjs';
import { templateURL } from './templates.js';

export default function NewBoard({ busy, onCreate, onCancel }) {
  const [mode, setMode] = useState(null);
  const [category, setCategory] = useState('all');
  const heading = useRef(null);
  useEffect(() => { heading.current.focus(); }, [mode]);
  const sample = catalog.items[0];
  const items = catalog.items.filter(item => category === 'all' || item.category === category);
  return <section className="gallery activity-picker" aria-labelledby="activity-title" aria-busy={busy}>
    <div className="gallery-heading">
      <div><h2 id="activity-title" ref={heading} tabIndex={-1}>{mode ? MODES[mode] : 'O que vamos fazer?'}</h2>
        <p>{mode ? 'Escolha um tema para começar.' : 'Um novo quadro, sem apagar seus desenhos.'}</p></div>
      <button className="secondary-button" disabled={busy} onClick={() => {
        if (mode) { setMode(null); setCategory('all'); } else onCancel();
      }}>Voltar</button>
    </div>
    {!mode ? <div className="activity-modes">{Object.entries(MODES).map(([value, title]) =>
      <button className="activity-choice" key={value} aria-label={title} disabled={busy} onClick={() =>
        value === 'free' ? onCreate(null) : setMode(value)}>
        {value === 'free' ? <span className="free-preview">Seu quadro em branco</span>
          : <img src={templateURL(sample, value, true)} alt="" />}
        <strong>{title}</strong><span>{value === 'free' ? 'Imagine o que quiser.' : value === 'trace'
          ? 'Desenhe sobre uma guia suave.' : 'Pinte à mão, sob os contornos.'}</span>
      </button>)}</div> : <>
      {catalog.stage !== 'complete' && <p className="catalog-note">100 temas disponíveis. Coleção em revisão final com o responsável.</p>}
      <label className="category-label" htmlFor="activity-category">Categoria</label>
      <select id="activity-category" value={category} disabled={busy} onChange={event => setCategory(event.target.value)}>
        <option value="all">Todos os temas</option>
        {catalog.categories.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
      </select>
      <p className="catalog-count" role="status">{items.length} temas</p>
      <ul className="board-grid catalog-grid">{items.map(item => <li key={item.id}>
        <button className="board-card" disabled={busy} onClick={() => onCreate(activityDocument(mode, item))}
          aria-label={`Criar ${item.title}`}>
          <img src={templateURL(item, mode, true)} alt="" loading="lazy" />
          <span className="board-caption"><strong>{item.title}</strong></span>
        </button>
      </li>)}</ul>
    </>}
  </section>;
}
