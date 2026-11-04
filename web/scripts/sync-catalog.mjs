// Copies published resources; never regenerates or changes the native catalog.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const source = new URL('../../Sources/QuadroLivre/Resources/', import.meta.url);
const target = new URL('../catalog/', import.meta.url);
const manifest = await readFile(new URL('catalog-v1.json', source));
const catalog = JSON.parse(manifest);
assert.equal(catalog.items.length, 100);
assert.equal(catalog.categories.length, 10);
const revisions = [...catalog.items, ...catalog.archivedItems];
assert.equal(new Set(revisions.map(item => `${item.id}:${item.assetVersion}`)).size, revisions.length);
const files = new Set(revisions.flatMap(item => Object.values(item.variants)
  .flatMap(variant => [variant.asset, variant.thumbnail])));
await mkdir(target, { recursive: true });
const hashes = [];
for (const name of [...files].sort()) {
  assert.match(name, /^[a-zA-Z0-9-]+$/);
  const filename = `${name}.png`;
  const bytes = await readFile(new URL(filename, source));
  assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
  await copyFile(new URL(filename, source), new URL(filename, target));
  assert.deepEqual(await readFile(new URL(filename, target)), bytes);
  hashes.push(`${createHash('sha256').update(bytes).digest('hex')}  ${filename}`);
}
await writeFile(new URL('catalog.json', target), manifest);
await writeFile(new URL('SHA256SUMS', target), hashes.join('\n') + '\n');
console.log(`Copied ${files.size} PNGs, ${catalog.items.length} current themes and ${catalog.archivedItems.length} archived revisions.`);
