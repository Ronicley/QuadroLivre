import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { appendStroke, pinchCamera, toWorld, zoomAt } from './model.mjs';
import { createRenderer } from './render.mjs';

export default function DrawingCanvas({ doc, change, tool, color, width, enabled, onInteract }) {
  const canvasRef = useRef(null);
  const latest = useRef({});
  latest.current = { doc, change, tool, color, width, onInteract };
  const session = useRef({ active: null, pointer: null, touches: new Map(), lastPen: -Infinity });
  const paint = useRef(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    const render = createRenderer(canvas);
    let frame;
    paint.current = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        if (latest.current.doc) render(latest.current.doc, session.current.active);
      });
    };
    const resize = new ResizeObserver(paint.current);
    resize.observe(canvas);
    paint.current();
    return () => { resize.disconnect(); cancelAnimationFrame(frame); };
  }, []);

  useLayoutEffect(() => { paint.current(); }, [doc]);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    const state = session.current;
    const local = event => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const camera = update => latest.current.change(history => ({ doc: { ...history.doc, camera: update(history.doc.camera) }, redo: history.redo }));
    const finish = (commit = true) => {
      if (!state.active) return;
      const stroke = state.active;
      state.active = null;
      state.pointer = null;
      state.lastPen = performance.now();
      if (commit) latest.current.change(history => appendStroke(history, stroke), true);
      paint.current();
    };
    const addPoint = event => {
      const position = toWorld(local(event), latest.current.doc.camera);
      const point = {
        x: Math.min(1_000_000, Math.max(-1_000_000, position.x)),
        y: Math.min(1_000_000, Math.max(-1_000_000, position.y)),
        p: event.pointerType === 'pen' && event.pressure > 0 ? event.pressure : 0.6,
      };
      const previous = state.active.points.at(-1);
      if (!previous || Math.hypot(point.x - previous.x, point.y - previous.y) * latest.current.doc.camera.scale > 0.3) {
        state.active.points.push(point);
      }
    };
    const down = event => {
      if (event.button !== 0) return;
      latest.current.onInteract();
      event.preventDefault();
      if (event.pointerType === 'touch') {
        if (state.active || performance.now() - state.lastPen < 700) return;
        state.touches.set(event.pointerId, local(event));
        canvas.setPointerCapture(event.pointerId);
        return;
      }
      if (state.pointer !== null) return;
      state.touches.clear();
      canvas.setPointerCapture(event.pointerId);
      state.pointer = event.pointerId;
      if (latest.current.tool === 'hand') {
        state.drag = local(event);
        return;
      }
      state.active = {
        tool: latest.current.tool, color: latest.current.color,
        width: latest.current.tool === 'eraser' ? latest.current.width * 3 : latest.current.width,
        points: [],
      };
      addPoint(event);
      paint.current();
    };
    const move = event => {
      if (state.touches.has(event.pointerId)) {
        const before = [...state.touches.values()];
        const previous = state.touches.get(event.pointerId);
        const point = local(event);
        state.touches.set(event.pointerId, point);
        if (state.active || performance.now() - state.lastPen < 700) return;
        if (state.touches.size === 2) {
          const after = [...state.touches.values()];
          camera(value => pinchCamera(value, before, after));
        }
        else if (state.touches.size === 1 && latest.current.tool === 'hand') {
          camera(value => ({ ...value, x: value.x + point.x - previous.x, y: value.y + point.y - previous.y }));
        }
        return;
      }
      if (event.pointerId !== state.pointer) return;
      if (state.active) {
        const events = event.getCoalescedEvents?.() ?? [];
        for (const sample of events.length ? events : [event]) addPoint(sample);
        paint.current();
      } else if (state.drag) {
        const point = local(event);
        const previous = state.drag;
        camera(value => ({ ...value, x: value.x + point.x - previous.x, y: value.y + point.y - previous.y }));
        state.drag = point;
      }
    };
    const end = event => {
      state.touches.delete(event.pointerId);
      if (event.pointerId !== state.pointer) return;
      if (event.type === 'pointerup' && state.active) addPoint(event);
      finish(event.type === 'pointerup');
      state.pointer = null;
      state.drag = null;
    };
    const wheel = event => {
      event.preventDefault();
      if (!state.active) camera(value => zoomAt(value, local(event), Math.exp(-event.deltaY * 0.002)));
    };
    const hidden = () => { if (document.visibilityState === 'hidden') finish(); };
    const blur = () => { finish(); state.touches.clear(); state.pointer = null; state.drag = null; };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('lostpointercapture', end);
    canvas.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('blur', blur);
    window.addEventListener('pagehide', blur);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      finish();
      state.touches.clear(); state.pointer = null; state.drag = null;
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', end);
      canvas.removeEventListener('pointercancel', end);
      canvas.removeEventListener('lostpointercapture', end);
      canvas.removeEventListener('wheel', wheel);
      window.removeEventListener('blur', blur);
      window.removeEventListener('pagehide', blur);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [enabled]);

  return <canvas ref={canvasRef} className={`drawing-canvas tool-${tool}`} tabIndex={enabled ? 0 : -1}
    role="img" aria-label="Quadro de desenho livre. Desenhe com caneta ou mouse; use dois dedos para mover e ampliar."
    onKeyDown={event => {
      if (!enabled) return;
      const shifts = { ArrowLeft: [40, 0], ArrowRight: [-40, 0], ArrowUp: [0, 40], ArrowDown: [0, -40] };
      const shift = shifts[event.key];
      if (shift || ['+', '=', '-'].includes(event.key)) {
        event.preventDefault();
        change(history => ({ ...history, doc: { ...history.doc, camera: shift
          ? { ...doc.camera, x: doc.camera.x + shift[0], y: doc.camera.y + shift[1] }
          : zoomAt(doc.camera, { x: innerWidth / 2, y: innerHeight / 2 }, event.key === '-' ? 0.8 : 1.25) } }));
      }
    }} />;
}
