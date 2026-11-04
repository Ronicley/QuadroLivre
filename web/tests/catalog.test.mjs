import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { catalog, resolveTemplate } from '../src/catalog.mjs';
import { activityDocument, documentBounds, validateDocument } from '../src/model.mjs';

test('100 existing themes, 10 categories, both variants and archived exact versions retained', () => {
  assert.equal(catalog.items.length, 100);
  assert.equal(catalog.categories.length, 10);
  assert.equal(catalog.archivedItems.length, 6);
  for (const category of catalog.categories) assert.equal(catalog.items.filter(item => item.category === category.id).length, 10);
  for (const item of [...catalog.items, ...catalog.archivedItems]) {
    for (const mode of ['trace', 'coloring']) {
      const doc = activityDocument(mode, item);
      assert.equal(resolveTemplate(doc.template, mode), item);
      assert.deepEqual(validateDocument(JSON.parse(JSON.stringify(doc))), doc);
      assert.deepEqual(documentBounds(doc), doc.template.rect);
    }
  }
  assert.equal(resolveTemplate({ id: 'cat-seated', assetVersion: 1 }, 'coloring').assetVersion, 1);
  assert.throws(() => resolveTemplate({ id: 'cat-seated', assetVersion: 999 }, 'coloring'));
});

test('invalid activity metadata and mismatched V1 templates are rejected, not replaced', () => {
  const doc = activityDocument('trace', catalog.items[0]);
  for (const change of [{ mode: 'fill' }, { template: null }, { version: 1 },
    { template: { ...doc.template, assetVersion: 999 } },
    { template: { ...doc.template, rect: { ...doc.template.rect, width: -1 } } }]) {
    assert.throws(() => validateDocument({ ...doc, ...change }));
  }
});

test('every copied PNG matches its recorded source hash', async () => {
  const base = new URL('../catalog/', import.meta.url);
  const hashes = (await readFile(new URL('SHA256SUMS', base), 'utf8')).trim().split('\n');
  assert.equal(hashes.length, 424);
  for (const line of hashes) {
    const [hash, file] = line.split('  ');
    const bytes = await readFile(new URL(file, base));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, file);
  }
});
