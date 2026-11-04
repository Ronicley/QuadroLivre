import React from 'react';

const paths = {
  pen: 'm14 4 6 6M3 21l5-1L21 7a2.1 2.1 0 0 0-3-3L5 17l-2 4Z',
  ballpoint: 'm16 3 5 5-11 11-7 2 2-7L16 3Zm-11 11 5 5m3-13 5 5M3 21l4-4',
  pencil: 'm16 3 5 5-12 12-6 1 1-6L16 3Zm-12 12 5 5m4-14 5 5M3 21l3-1',
  crayon: 'M8 9V6l4-4 4 4v3M7 9h10v12H7V9Zm0 4h10M7 18h10',
  chevron: 'm8 10 4 4 4-4',
  eraser: 'm9 19-5-5a2 2 0 0 1 0-3l8-8a2 2 0 0 1 3 0l6 6a2 2 0 0 1 0 3l-7 7H9Zm-2-9 8 8m-3 1h9',
  undo: 'M9 5 4 10l5 5M4 10h10a6 6 0 0 1 0 12',
  redo: 'm15 5 5 5-5 5m5-5H10a6 6 0 0 0 0 12',
  hand: 'M8 13V5a2 2 0 0 1 4 0v7-8a2 2 0 0 1 4 0v8-6a2 2 0 0 1 4 0v9c0 5-3 7-7 7-3 0-5-2-7-5l-3-5a2 2 0 0 1 3-2l2 3Z',
  fit: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M8 12h8m-4-4v8',
  lock: 'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5V10Zm7 5v2',
  close: 'm6 6 12 12M6 18 18 6',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  check: 'm5 12 4 4L19 6',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  gallery: 'M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z',
};

export default function Icon({ name, size = 26 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={paths[name]} />
  </svg>;
}
