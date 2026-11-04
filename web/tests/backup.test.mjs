import test from 'node:test';
import assert from 'node:assert/strict';
import { readBackup, MAX_BACKUP_BYTES } from '../src/backup.mjs';
import { emptyDocument, activityDocument, INSTRUMENTS } from '../src/model.mjs';
import { catalog } from '../src/catalog.mjs';

test('web backup accepts editable V1 and guided V2 without changing viewport or strokes', async () => {
  for (const doc of [emptyDocument(), activityDocument('coloring', catalog.items[0])]) {
    doc.strokes = [...INSTRUMENTS.map(([tool]) => tool), 'eraser'].map(tool => ({
      tool, color: '#12abcf', width: 10, points: [{ x: -12, y: 45, p: 0.3 }, { x: 80, y: 60, p: 0.9 }],
    }));
    assert.deepEqual(await readBackup(new Blob([JSON.stringify(doc)])), doc);
  }
});

test('oversized, invalid JSON, invalid document and missing exact template rejected before writes', async () => {
  await assert.rejects(readBackup({ size: MAX_BACKUP_BYTES + 1, text() { throw new Error('must not read'); } }), /50 MiB/);
  for (const text of ['not JSON', '{}', JSON.stringify({ ...emptyDocument(), camera: null }),
    JSON.stringify({ ...emptyDocument(), strokes: [{ tool: 'future-brush' }] }),
    JSON.stringify({ ...activityDocument('trace', catalog.items[0]), template: { id: 'cat-seated', assetVersion: 999 } })]) {
    await assert.rejects(readBackup(new Blob([text])));
  }
});
