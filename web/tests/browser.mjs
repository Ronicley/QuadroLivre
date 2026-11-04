import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { activityDocument, INSTRUMENTS } from '../src/model.mjs';
import { catalog } from '../src/catalog.mjs';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const screenshots = fileURLToPath(new URL('../../.impeccable/review/', import.meta.url));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
// Test-only module endpoints. Nothing is added to the production bundle or personal profile.
const testModules = new Map([
  ['/test-src/render.mjs', new URL('../src/render.mjs', import.meta.url)],
  ['/test-src/model.mjs', new URL('../src/model.mjs', import.meta.url)],
  ['/test-src/catalog.mjs', new URL('../src/catalog.mjs', import.meta.url)],
  ['/catalog/catalog.json', new URL('../catalog/catalog.json', import.meta.url)],
]);

async function readBoard(page, id = 'current') {
  return page.evaluate(id => new Promise((resolve, reject) => {
    const request = indexedDB.open('quadro-livre-pwa', 1);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('boards');
      const get = tx.objectStore('boards').get(id);
      tx.oncomplete = () => { resolve(get.result); db.close(); };
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  }), id);
}

async function seed(page, url, entries) {
  await page.goto(`${url}/fixture`);
  await page.evaluate(entries => new Promise((resolve, reject) => {
    const request = indexedDB.open('quadro-livre-pwa', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('boards');
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction('boards', 'readwrite');
      for (const [key, value] of entries) tx.objectStore('boards').put(value, key);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onabort = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  }), entries);
}

async function keys(page) {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('quadro-livre-pwa', 1);
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction('boards');
      const get = tx.objectStore('boards').getAllKeys();
      tx.oncomplete = () => { db.close(); resolve(get.result); };
      tx.onabort = () => reject(tx.error);
    };
  }));
}

async function gallery(page) {
  await page.getByRole('button', { name: 'Meus desenhos', exact: true }).click();
  await page.getByRole('heading', { name: 'Meus desenhos', exact: true }).waitFor();
}

async function openBoard(page, number = 1) {
  await page.getByRole('button', { name: `Abrir Desenho ${number}`, exact: true }).click();
  await saved(page);
}

const saved = page => page.getByRole('status').filter({ hasText: 'Salvo neste aparelho' }).waitFor();
async function createFree(page) {
  await page.getByRole('button', { name: 'Novo desenho', exact: true }).click();
  await page.getByRole('button', { name: 'Livre', exact: true }).click();
  await saved(page);
}
async function draw(page, x = 350, y = 300) {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 160, y + 90, { steps: 20 });
  await page.mouse.move(x + 280, y + 20, { steps: 16 });
  await page.mouse.up();
  await saved(page);
}

async function unlock(page) {
  await page.getByRole('button', { name: 'Área dos responsáveis', exact: true }).click();
  const label = await page.locator('.gate-label').textContent();
  const numbers = label.match(/\d+/g).map(Number);
  await page.getByLabel(/Quanto é/).fill(String(numbers[0] + numbers[1]));
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
}

async function pixelAlpha(page, x, y) {
  return page.evaluate(({ x, y }) => {
    const canvas = document.querySelector('canvas');
    const ratio = canvas.width / canvas.clientWidth;
    return canvas.getContext('2d').getImageData(Math.round(x * ratio), Math.round(y * ratio), 1, 1).data[3];
  }, { x, y });
}

test('PWA production browser acceptance (Chromium)', { timeout: 120_000 }, async t => {
  await mkdir(screenshots, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const server = createServer(async (request, response) => {
    try {
      let pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (testModules.has(pathname)) {
        response.writeHead(200, { 'Content-Type': pathname.endsWith('.json') ? 'application/json' : 'text/javascript', 'Cache-Control': 'no-store' });
        response.end(await readFile(testModules.get(pathname)));
        return;
      }
      if (pathname.startsWith('/atelier/')) pathname = pathname.slice('/atelier'.length);
      if (pathname.endsWith('/')) pathname += 'index.html';
      const file = resolve(dist, `.${pathname}`);
      if (!file.startsWith(dist.endsWith(sep) ? dist : dist + sep)) throw new Error('Outside test root');
      const content = await readFile(file);
      response.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
      response.end(content);
    } catch { response.writeHead(404); response.end('Not found'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await t.test('built precache includes every emitted file and valid icon sizes', async () => {
      const sw = await readFile(resolve(dist, 'sw.js'), 'utf8');
      const precache = JSON.parse(sw.match(/const PRECACHE = (.*);/)[1]);
      assert.ok(precache.includes('index.html'));
      for (const file of precache) assert.ok((await stat(resolve(dist, file))).isFile() || file === './');
      for (const size of [192, 512]) {
        const png = await readFile(resolve(dist, `icons/icon-${size}.png`));
        assert.equal(png.readUInt32BE(16), size);
        assert.equal(png.readUInt32BE(20), size);
      }
    });

    await t.test('shell, controls, responsive layout, empty state and offline setup', async () => {
      await page.goto(url);
      await page.getByText('Desenhos neste aparelho', { exact: true }).waitFor();
      await page.getByText('Pronto para desenhar sem internet', { exact: true }).waitFor();
      assert.deepEqual(await keys(page), [], 'opening empty gallery creates no document');
      await page.screenshot({ path: resolve(screenshots, 'gallery-empty.png'), fullPage: true });
      await createFree(page);
      for (const [width, height, name] of [[1440, 900, 'desktop'], [1024, 768, 'tablet'], [390, 844, 'mobile'], [320, 568, 'narrow'], [844, 390, 'landscape']]) {
        await page.setViewportSize({ width, height });
        const geometry = await page.evaluate(() => {
          const rect = selector => {
            const { x, y, width, height } = document.querySelector(selector).getBoundingClientRect();
            return { x, y, width, height };
          };
          return { dock: rect('.dock'), zoom: rect('.zoom-controls'), scroll: document.documentElement.scrollWidth, width: innerWidth };
        });
        assert.ok(geometry.dock.x >= 0 && geometry.dock.x + geometry.dock.width <= width, `${name}: dock fits`);
        assert.ok(geometry.dock.y > 90 && geometry.dock.y + geometry.dock.height <= height, `${name}: dock remains visible`);
        assert.ok(geometry.zoom.y + geometry.zoom.height <= geometry.dock.y || geometry.zoom.x >= geometry.dock.x + geometry.dock.width, `${name}: zoom doesn't overlap dock`);
        assert.ok(geometry.scroll <= geometry.width, `${name}: no horizontal overflow`);
        await page.screenshot({ path: resolve(screenshots, `${name}.png`), fullPage: true });
      }
      await page.getByRole('button', { name: 'Escolher cor' }).click();
      await page.screenshot({ path: resolve(screenshots, 'palette.png'), fullPage: true });
      await page.getByRole('button', { name: 'Azul', exact: true }).click();
      await page.setViewportSize({ width: 1440, height: 900 });
    });

    await t.test('16 presets and any custom RGB color preserve ink, backup and reload; palette fits small viewports', async () => {
      const isolated = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
      const target = await isolated.newPage();
      await target.goto(url);
      await createFree(target);
      await draw(target);
      const original = await readBoard(target);
      await target.getByRole('button', { name: 'Borracha', exact: true }).click();
      await target.getByRole('button', { name: 'Escolher cor', exact: true }).click();
      assert.equal(await target.locator('.swatches button').count(), 16);
      await target.getByRole('button', { name: 'Marrom', exact: true }).click();
      assert.equal(await target.getByRole('button', { name: 'Escolher instrumento', exact: true }).getAttribute('aria-pressed'), 'true');
      assert.deepEqual(await readBoard(target), original, 'changing color never changes saved ink');
      await draw(target, 350, 420);
      assert.equal((await readBoard(target)).strokes.at(-1).color, '#8a5135');
      await target.getByRole('button', { name: 'Escolher cor', exact: true }).click();
      await target.getByRole('button', { name: 'Branco', exact: true }).click();
      await draw(target, 350, 500);
      assert.equal((await readBoard(target)).strokes.at(-1).color, '#ffffff');
      await target.getByRole('button', { name: 'Escolher cor', exact: true }).click();
      await target.getByLabel('Outra cor', { exact: true }).evaluate(input => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, '#12abcf');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      assert.equal(await target.getByLabel('Outra cor', { exact: true }).inputValue(), '#12abcf');
      assert.equal(await target.locator('.swatch[aria-pressed="true"]').count(), 0);
      await target.keyboard.press('Escape');
      await target.locator('#palette').waitFor({ state: 'hidden' });
      await draw(target, 600, 400);
      const expected = await readBoard(target);
      assert.equal(expected.strokes.at(-1).color, '#12abcf');
      assert.deepEqual(expected.strokes[0], original.strokes[0]);
      await unlock(target);
      const download = target.waitForEvent('download');
      await target.getByRole('button', { name: 'Backup dos traços', exact: true }).click();
      const backup = await download;
      const path = resolve(screenshots, 'custom-color-backup.json');
      await backup.saveAs(path);
      assert.deepEqual(JSON.parse(await readFile(path, 'utf8')), expected);
      await target.getByRole('button', { name: 'Fechar área dos responsáveis', exact: true }).click();
      await target.reload();
      await openBoard(target);
      assert.deepEqual(await readBoard(target), expected);
      for (const [width, height, name] of [[1440, 900, 'desktop'], [1024, 768, 'tablet'], [390, 844, 'mobile'], [320, 568, 'narrow'], [844, 390, 'landscape']]) {
        await target.setViewportSize({ width, height });
        await target.getByRole('button', { name: 'Escolher cor', exact: true }).click();
        await target.getByLabel('Outra cor', { exact: true }).scrollIntoViewIfNeeded();
        const geometry = await target.evaluate(() => {
          const rect = selector => {
            const { x, y, right, bottom } = document.querySelector(selector).getBoundingClientRect();
            return { x, y, right, bottom };
          };
          return { panel: rect('#palette'), input: rect('#custom-color'), overflow: document.documentElement.scrollWidth > innerWidth };
        });
        assert.ok(geometry.panel.x >= 0 && geometry.panel.y >= 0 && geometry.panel.right <= width && geometry.panel.bottom <= height, `${name}: palette stays in viewport`);
        assert.ok(geometry.input.y >= geometry.panel.y && geometry.input.bottom <= geometry.panel.bottom, `${name}: custom picker reachable inside palette`);
        assert.equal(geometry.overflow, false);
        await target.screenshot({ path: resolve(screenshots, `colors-${name}.png`), fullPage: true });
        await target.keyboard.press('Escape');
      }
      await isolated.close();
    });

    await t.test('shared renderer preserves legacy pixels; brushes differ, scale with pressure/width and keep stable grain', async () => {
      const checks = await page.evaluate(async () => {
        const { drawStroke, exportPNG, createRenderer } = await import('/test-src/render.mjs');
        const { emptyDocument, documentBounds } = await import('/test-src/model.mjs');
        const canvas = () => { const c = document.createElement('canvas'); c.width = 400; c.height = 240; return c; };
        const pixels = c => c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        const equal = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
        const stroke = (tool, width = 22, p = 0.6) => ({ tool, width, color: '#6353ba', points: [{ x: 30, y: 90, p }, { x: 350, y: 90, p }] });
        const paint = (strokes, transform = [1, 0, 0, 1, 0, 0]) => {
          const c = canvas(), ctx = c.getContext('2d'); ctx.setTransform(...transform);
          for (const s of strokes) drawStroke(ctx, s);
          return c;
        };
        // Frozen pre-instrument renderer, deliberately independent of new implementation.
        const legacy = (ctx, s) => {
          ctx.globalCompositeOperation = s.tool === 'eraser' ? 'destination-out' : 'source-over';
          ctx.strokeStyle = s.color; ctx.fillStyle = s.color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          const r = p => s.width * (0.35 + 0.65 * p.p) / 2;
          if (s.points.length === 1) {
            ctx.beginPath(); ctx.arc(s.points[0].x, s.points[0].y, r(s.points[0]), 0, Math.PI * 2); ctx.fill();
          }
          for (let i = 1; i < s.points.length; i++) {
            ctx.lineWidth = r(s.points[i - 1]) + r(s.points[i]); ctx.beginPath();
            ctx.moveTo(s.points[i - 1].x, s.points[i - 1].y); ctx.lineTo(s.points[i].x, s.points[i].y); ctx.stroke();
          }
          ctx.globalCompositeOperation = 'source-over';
        };
        const old = [stroke('pen'), { ...stroke('pen', 4), points: [{ x: 80, y: 70, p: 0.3 }] },
          { ...stroke('pen', 10), points: [{ x: -20, y: 30, p: 0.1 }, { x: 80, y: 110, p: 0.9 }, { x: 180, y: 30, p: 1 }] },
          { ...stroke('eraser', 30), points: [{ x: 120, y: 0, p: 0.3 }, { x: 150, y: 200, p: 1 }] }];
        const expected = canvas(); for (const s of old) legacy(expected.getContext('2d'), s);
        const result = { legacy: equal(pixels(paint(old)), pixels(expected)), tools: {}, unknown: false };
        try { drawStroke(canvas().getContext('2d'), stroke('future-brush')); } catch { result.unknown = true; }
        const count = c => pixels(c).reduce((n, v, i) => n + (i % 4 === 3 && v > 0 ? 1 : 0), 0);
        const images = [];
        for (const tool of ['pen', 'ballpoint', 'pencil', 'crayon']) {
          const s = stroke(tool), c = paint([s]); images.push(pixels(c));
          const widths = [4, 10, 22].map(w => count(paint([stroke(tool, w)])));
          const tap = { ...s, points: [s.points[0]] };
          const moved = paint([s], [1, 0, 0, 1, 13, 7]);
          const a = c.getContext('2d').getImageData(20, 70, 350, 40).data;
          const b = moved.getContext('2d').getImageData(33, 77, 350, 40).data;
          const shades = new Set(c.getContext('2d').getImageData(60, 90, 200, 1).data.filter((_, i) => i % 4 === 3));
          const dense = { ...s, points: Array.from({ length: 33 }, (_, i) => ({ x: 30 + i * 10, y: 90, p: 0.6 })) };
          const live = canvas(); live.style.cssText = 'position:fixed;left:-1000px;width:400px;height:240px'; document.body.append(live);
          const render = createRenderer(live), doc = { ...emptyDocument(), strokes: [] };
          render(doc, s); const active = pixels(live);
          render({ ...doc, strokes: [s] }, null);
          const committed = equal(active, pixels(live));
          render({ ...doc, camera: { x: 20, y: -10, scale: 2 } }, s);
          render(doc, s); const zoomReturn = equal(active, pixels(live)); live.remove();
          result.tools[tool] = {
            widths, pressure: count(paint([stroke(tool, 22, 1)])) > count(paint([stroke(tool, 22, 0.1)])),
            tap: count(paint([tap])) > 0, pan: equal(a, b), repeat: equal(pixels(c), pixels(paint([s]))),
            grain: shades.size,
            // Extra path vertices may change edge antialiasing, never interior opacity.
            density: equal(c.getContext('2d').getImageData(60, 88, 200, 4).data,
              paint([dense]).getContext('2d').getImageData(60, 88, 200, 4).data), committed, zoomReturn,
          };
        }
        result.distinct = images.every((a, i) => images.slice(i + 1).every(b => !equal(a, b)));
        const doc = { ...emptyDocument(), strokes: ['pen', 'ballpoint', 'pencil', 'crayon'].map((tool, i) => ({
          ...stroke(tool), points: [{ x: -40, y: i * 40, p: 0.3 }, { x: 180, y: i * 40, p: 0.9 }],
        })) };
        const blob = await exportPNG(doc), bitmap = await createImageBitmap(blob);
        const bounds = documentBounds(doc), out = document.createElement('canvas'); out.width = bitmap.width; out.height = bitmap.height;
        const ctx = out.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 32 - bounds.x, 32 - bounds.y);
        for (const s of doc.strokes) drawStroke(ctx, s);
        ctx.resetTransform(); ctx.globalCompositeOperation = 'destination-over'; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, out.width, out.height);
        const png = document.createElement('canvas'); png.width = bitmap.width; png.height = bitmap.height;
        png.getContext('2d').drawImage(bitmap, 0, 0); bitmap.close();
        result.png = equal(pixels(out), pixels(png));
        return result;
      });
      assert.equal(checks.legacy, true, 'legacy pen/eraser pixels unchanged');
      assert.equal(checks.unknown, true, 'no silent renderer fallback');
      assert.equal(checks.distinct, true, 'four genuinely different renderings');
      assert.equal(checks.png, true, 'PNG uses exact stroke composition');
      for (const [tool, check] of Object.entries(checks.tools)) {
        assert.ok(check.widths[0] < check.widths[1] && check.widths[1] < check.widths[2], `${tool}: three widths`);
        for (const key of ['pressure', 'tap', 'pan', 'repeat', 'committed', 'zoomReturn']) assert.equal(check[key], true, `${tool}: ${key}`);
        if (['pencil', 'crayon'].includes(tool)) {
          assert.ok(check.grain > 5, `${tool}: visible grain`);
          assert.equal(check.density, true, `${tool}: sampling density never darkens same line`);
        }
      }
    });

    await t.test('instruments persist per stroke and board, with colors, pressure, history, backup/restore and responsive picker', async () => {
      const isolated = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
      const target = await isolated.newPage();
      const fixture = JSON.parse(await readFile(new URL('./fixtures/board-v1.json', import.meta.url), 'utf8'));
      await seed(target, url, [['current', fixture]]);
      await target.goto(url); await openBoard(target);
      await gallery(target); await createFree(target);
      const id = (await readBoard(target, 'gallery')).ids[1];
      const cdp = await isolated.newCDPSession(target);
      for (const [i, [tool, label]] of INSTRUMENTS.entries()) {
        await target.getByRole('button', { name: 'Escolher instrumento', exact: true }).click();
        await target.getByRole('button', { name: label, exact: true }).click();
        await target.getByRole('button', { name: 'Escolher cor', exact: true }).click();
        await target.getByRole('button', { name: 'Marrom', exact: true }).click();
        for (const [j, width] of ['Traço fino', 'Traço médio', 'Traço grosso'].entries()) {
          await target.getByRole('button', { name: width, exact: true }).click();
          const x = 250 + j * 330, y = 220 + i * 100;
          await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, pointerType: 'pen', force: 0.3, clickCount: 1 });
          await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x + 200, y: y + 20, button: 'left', buttons: 1, pointerType: 'pen', force: 0.9 });
          await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x + 200, y: y + 20, button: 'left', buttons: 0, pointerType: 'pen', clickCount: 1 });
          await saved(target);
          const s = (await readBoard(target, id)).strokes.at(-1);
          assert.equal(s.tool, tool); assert.equal(s.color, '#8a5135'); assert.equal(s.width, [4, 10, 22][j]);
          assert.ok(s.points.some(p => Math.abs(p.p - 0.3) < 0.01) && s.points.some(p => Math.abs(p.p - 0.9) < 0.01));
        }
      }
      await cdp.detach();
      await target.screenshot({ path: resolve(screenshots, 'instruments-drawing.png') });
      const ink = await readBoard(target, id);
      await target.getByRole('button', { name: 'Mover quadro', exact: true }).click();
      await target.getByRole('button', { name: 'Mover quadro', exact: true }).click();
      assert.ok(await target.locator('.drawing-canvas.tool-crayon').count(), 'hand returns to chosen instrument');
      await target.getByRole('button', { name: 'Borracha', exact: true }).click();
      await draw(target, 350, 420);
      await target.getByRole('button', { name: 'Desfazer', exact: true }).click(); await saved(target);
      assert.deepEqual(await readBoard(target, id), ink);
      await gallery(target); await openBoard(target); assert.deepEqual(await readBoard(target), fixture);
      await gallery(target); await openBoard(target, 2);
      await target.getByRole('button', { name: 'Refazer', exact: true }).click(); await saved(target);
      const expected = await readBoard(target, id); assert.equal(expected.strokes.at(-1).tool, 'eraser');
      await gallery(target);
      const thumbnailMatches = await target.locator('.board-card canvas').nth(1).evaluate(async (canvas, doc) => {
        const { drawStroke } = await import('/test-src/render.mjs');
        const { documentBounds } = await import('/test-src/model.mjs');
        const bounds = documentBounds(doc), scale = Math.min(2, 448 / bounds.width, 288 / bounds.height);
        const expected = document.createElement('canvas'); expected.width = 480; expected.height = 320;
        const ctx = expected.getContext('2d');
        ctx.setTransform(scale, 0, 0, scale, 240 - (bounds.x + bounds.width / 2) * scale, 160 - (bounds.y + bounds.height / 2) * scale);
        for (const stroke of doc.strokes) drawStroke(ctx, stroke);
        const a = canvas.getContext('2d').getImageData(0, 0, 480, 320).data;
        return expected.getContext('2d').getImageData(0, 0, 480, 320).data.every((v, i) => v === a[i]);
      }, expected);
      assert.equal(thumbnailMatches, true, 'gallery uses same textured strokes and eraser');
      await openBoard(target, 2);
      await unlock(target);
      const pngPending = target.waitForEvent('download'); await target.getByRole('button', { name: 'Salvar imagem PNG', exact: true }).click();
      const pngDownload = await pngPending, pngPath = resolve(screenshots, 'instruments-export.png'); await pngDownload.saveAs(pngPath);
      assert.equal(await target.evaluate(async ({ doc, base64 }) => {
        const { exportPNG } = await import('/test-src/render.mjs');
        const a = await createImageBitmap(await (await fetch(`data:image/png;base64,${base64}`)).blob());
        const b = await createImageBitmap(await exportPNG(doc));
        const pixels = bitmap => {
          const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
          const ctx = canvas.getContext('2d'); ctx.drawImage(bitmap, 0, 0);
          return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        };
        const expectedPixels = pixels(b), actual = pixels(a);
        const matches = a.width === b.width && a.height === b.height && expectedPixels.every((v, i) => v === actual[i]);
        a.close(); b.close(); return matches;
      }, { doc: expected, base64: (await readFile(pngPath)).toString('base64') }), true, 'UI PNG matches all instruments');
      const pending = target.waitForEvent('download'); await target.getByRole('button', { name: 'Backup dos traços', exact: true }).click();
      const backup = await pending, path = resolve(screenshots, 'instruments-backup.json'); await backup.saveAs(path);
      assert.deepEqual(JSON.parse(await readFile(path, 'utf8')), expected);
      const beforeRestore = await readBoard(target, 'gallery');
      const unknown = { ...expected, strokes: [{ ...expected.strokes[0], tool: 'future-brush' }] };
      await target.getByLabel('Arquivo de backup JSON', { exact: true }).setInputFiles({ name: 'unknown.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(unknown)) });
      await target.getByRole('alert').filter({ hasText: 'Instrumento desconhecido' }).waitFor();
      assert.deepEqual(await readBoard(target, 'gallery'), beforeRestore);
      assert.deepEqual(await readBoard(target, id), expected);
      await target.getByLabel('Arquivo de backup JSON', { exact: true }).setInputFiles(path);
      await target.getByRole('dialog').waitFor({ state: 'hidden' }); await saved(target);
      const restoredId = (await readBoard(target, 'gallery')).ids[2];
      assert.deepEqual(await readBoard(target, restoredId), expected);
      await target.getByText('Pronto para desenhar sem internet', { exact: true }).waitFor();
      await isolated.setOffline(true); await target.reload(); await openBoard(target, 3);
      assert.deepEqual(await readBoard(target, restoredId), expected);
      assert.deepEqual(await readBoard(target, id), expected); assert.deepEqual(await readBoard(target), fixture);
      await isolated.setOffline(false);
      for (const [width, height, name] of [[1440, 900, 'desktop'], [1024, 768, 'tablet'], [390, 844, 'mobile'], [320, 568, 'narrow'], [844, 390, 'landscape']]) {
        await target.setViewportSize({ width, height });
        await target.getByRole('button', { name: 'Escolher instrumento', exact: true }).click();
        await target.getByRole('button', { name: 'Giz de cera', exact: true }).scrollIntoViewIfNeeded();
        const geometry = await target.evaluate(() => {
          const rect = selector => { const { x, y, right, bottom } = document.querySelector(selector).getBoundingClientRect(); return { x, y, right, bottom }; };
          return { panel: rect('#instruments'), dock: rect('.dock'), targets: [...document.querySelectorAll('.instrument-options button')].map(b => ({ width: b.offsetWidth, height: b.offsetHeight })),
            overflow: document.documentElement.scrollWidth > innerWidth };
        });
        assert.ok(geometry.panel.x >= 0 && geometry.panel.y >= 0 && geometry.panel.right <= width && geometry.panel.bottom <= geometry.dock.y, `${name}: picker fits above dock`);
        assert.equal(geometry.overflow, false); assert.ok(geometry.targets.every(t => t.width >= 44 && t.height >= 44));
        await target.screenshot({ path: resolve(screenshots, `instruments-${name}.png`) });
        await target.keyboard.press('Escape');
        assert.equal(await target.getByRole('button', { name: 'Escolher instrumento', exact: true }).evaluate(b => b === document.activeElement), true);
      }
      await isolated.close();
    });

    await t.test('mouse drawing, eraser, undo/redo, branch history and PNG/JSON export', async () => {
      await draw(page);
      assert.equal((await readBoard(page)).strokes.length, 1);
      assert.ok(await pixelAlpha(page, 430, 345) > 0, 'pen renders actual ink');
      await page.getByRole('button', { name: 'Borracha', exact: true }).click();
      await draw(page, 390, 320);
      assert.equal((await readBoard(page)).strokes[1].tool, 'eraser');
      assert.equal(await pixelAlpha(page, 430, 345), 0, 'eraser removes ink without painting white');
      await page.getByRole('button', { name: 'Desfazer', exact: true }).click();
      await saved(page);
      assert.equal((await readBoard(page)).strokes.length, 1);
      assert.ok(await pixelAlpha(page, 430, 345) > 0, 'undo restores erased pixels');
      await page.keyboard.press('Control+Shift+Z');
      await saved(page);
      assert.equal((await readBoard(page)).strokes.length, 2);
      await page.getByRole('button', { name: 'Escolher instrumento', exact: true }).click();
      await page.getByRole('button', { name: 'Desfazer', exact: true }).click();
      await draw(page, 600, 300);
      assert.equal(await page.getByRole('button', { name: 'Refazer', exact: true }).isDisabled(), true);
      await page.screenshot({ path: resolve(screenshots, 'drawing.png'), fullPage: true });
      await unlock(page);
      await page.screenshot({ path: resolve(screenshots, 'parents.png'), fullPage: true });
      let download = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Salvar imagem PNG' }).click();
      const image = await download;
      const imagePath = resolve(screenshots, 'export.png');
      await image.saveAs(imagePath);
      const png = await readFile(imagePath);
      assert.equal(png.subarray(1, 4).toString(), 'PNG');
      assert.ok(png.readUInt32BE(16) <= 2048 && png.readUInt32BE(20) <= 2048);
      download = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Backup dos traços' }).click();
      const backup = await download;
      const backupPath = resolve(screenshots, 'backup.json');
      await backup.saveAs(backupPath);
      assert.deepEqual(JSON.parse(await readFile(backupPath, 'utf8')), await readBoard(page));
      await page.getByRole('button', { name: 'Fechar área dos responsáveis' }).click();
    });

    await t.test('pen pressure, pointer cancellation, fingers never draw, pinch zoom and hand pan', async () => {
      const cdp = await context.newCDPSession(page);
      const before = (await readBoard(page)).strokes.length;
      await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 400, y: 450, button: 'left', buttons: 1, pointerType: 'pen', force: 0.3, clickCount: 1 });
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 600, y: 450, button: 'left', buttons: 1, pointerType: 'pen', force: 0.9 });
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 600, y: 450, button: 'left', buttons: 0, pointerType: 'pen', clickCount: 1 });
      await saved(page);
      let board = await readBoard(page);
      assert.equal(board.strokes.length, before + 1);
      assert.ok(board.strokes.at(-1).points.some(point => Math.abs(point.p - 0.3) < 0.01));
      assert.ok(board.strokes.at(-1).points.some(point => Math.abs(point.p - 0.9) < 0.01));

      await page.evaluate(() => document.querySelector('canvas').addEventListener('pointerdown', event => { window.lastPointer = event.pointerId; }, { once: true }));
      await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 400, y: 450, button: 'left', buttons: 1, pointerType: 'pen', force: 0.5, clickCount: 1 });
      await page.evaluate(() => document.querySelector('canvas').dispatchEvent(new PointerEvent('pointercancel', { pointerId: window.lastPointer, pointerType: 'pen' })));
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 600, y: 450, button: 'left', buttons: 0, pointerType: 'pen', clickCount: 1 });
      assert.equal((await readBoard(page)).strokes.length, before + 1);

      // Reload removes the deliberate post-pen palm guard delay from this isolated touch test.
      await page.reload();
      await openBoard(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 400, y: 400, id: 1 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 500, y: 450, id: 1 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      assert.equal((await readBoard(page)).strokes.length, before + 1);

      const scale = (await readBoard(page)).camera.scale;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 400, y: 400, id: 1 }, { x: 600, y: 400, id: 2 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 350, y: 400, id: 1 }, { x: 650, y: 400, id: 2 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await saved(page);
      board = await readBoard(page);
      assert.ok(board.camera.scale > scale, 'two-finger gesture increases scale');
      assert.equal(board.strokes.length, before + 1);
      await page.getByRole('button', { name: 'Mover quadro' }).click();
      const oldX = board.camera.x;
      await page.mouse.move(600, 400);
      await page.mouse.down();
      await page.mouse.move(660, 450, { steps: 5 });
      await page.mouse.up();
      await saved(page);
      assert.ok((await readBoard(page)).camera.x > oldX);
      await page.getByRole('button', { name: 'Mover quadro' }).click();
      await page.getByRole('button', { name: 'Reenquadrar desenho' }).click();
      await saved(page);
      await cdp.detach();
    });

    await t.test('second tab cannot overwrite; saved board survives an offline reload', async () => {
      const expected = await readBoard(page);
      const second = await context.newPage();
      await second.goto(url);
      await second.getByRole('alert').filter({ hasText: 'outra janela' }).waitFor();
      assert.equal(await second.getByRole('button', { name: 'Novo desenho', exact: true }).isDisabled(), true);
      await second.close();
      await context.setOffline(true);
      await page.reload();
      await openBoard(page);
      assert.deepEqual(await readBoard(page), expected);
      assert.ok(await page.evaluate(() => navigator.serviceWorker.controller !== null));
      assert.deepEqual(errors, []);
      await context.setOffline(false);
    });

    await t.test('V1 migration is lossless, idempotent and keeps previous-app compatibility', async () => {
      const fixture = JSON.parse(await readFile(new URL('./fixtures/board-v1.json', import.meta.url), 'utf8'));
      const isolated = await browser.newContext({ viewport: { width: 1024, height: 768 }, acceptDownloads: true });
      const target = await isolated.newPage();
      await seed(target, url, [['current', fixture]]);
      await target.goto(url);
      await target.getByRole('button', { name: 'Abrir Desenho 1', exact: true }).waitFor();
      assert.deepEqual(await readBoard(target), fixture, 'migration never rewrites legacy document');
      assert.deepEqual(await readBoard(target, 'gallery'), { version: 1, ids: ['current'] });
      assert.deepEqual(await target.locator('.board-card canvas').evaluate(canvas => {
        const context = canvas.getContext('2d');
        return [context.getImageData(140, 110, 1, 1).data[3] > 0, context.getImageData(240, 160, 1, 1).data[3]];
      }), [true, 0], 'thumbnail preserves real ink and eraser');
      await target.reload();
      await openBoard(target);
      assert.deepEqual(await readBoard(target), fixture);
      assert.ok(await pixelAlpha(target, 312, 276) > 0, 'original pen rendered in original viewport');
      assert.equal(await pixelAlpha(target, 400, 320), 0, 'original eraser still cuts ink');
      assert.equal(await target.getByLabel('Zoom atual').textContent(), '175%');
      await unlock(target);
      const download = target.waitForEvent('download');
      await target.getByRole('button', { name: 'Backup dos traços' }).click();
      const backup = await download;
      const path = resolve(screenshots, 'migrated-backup.json');
      await backup.saveAs(path);
      assert.deepEqual(JSON.parse(await readFile(path, 'utf8')), fixture);
      await target.getByRole('button', { name: 'Fechar área dos responsáveis' }).click();
      await gallery(target);
      // Simulate a rollback: the old writer still writes a plain V1 document at current.
      const edited = { ...fixture, camera: { ...fixture.camera, x: 420 } };
      await target.evaluate(doc => new Promise(resolve => {
        const request = indexedDB.open('quadro-livre-pwa', 1);
        request.onsuccess = () => {
          const db = request.result, tx = db.transaction('boards', 'readwrite');
          tx.objectStore('boards').put(doc, 'current');
          tx.oncomplete = () => { db.close(); resolve(); };
        };
      }), edited);
      await target.reload();
      await openBoard(target);
      assert.deepEqual(await readBoard(target), edited);
      assert.deepEqual(await keys(target), ['current', 'gallery']);
      await isolated.close();
    });

    await t.test('gallery, isolated histories, viewport flush, previews and multiple boards offline', async () => {
      const expected = await readBoard(page);
      await page.getByRole('button', { name: 'Desfazer', exact: true }).click();
      await saved(page);
      const undone = await readBoard(page);
      await gallery(page);
      await page.keyboard.press('Control+z');
      assert.deepEqual(await readBoard(page), undone, 'gallery shortcuts never edit a hidden board');
      await createFree(page);
      const index = await readBoard(page, 'gallery');
      assert.equal(index.ids.length, 2);
      const secondId = index.ids[1];
      assert.notEqual(secondId, 'current');
      assert.equal(await page.getByRole('button', { name: 'Refazer', exact: true }).isDisabled(), true);
      assert.equal(await pixelAlpha(page, 430, 345), 0, 'new board has no previous ink');
      await draw(page);
      const second = await readBoard(page, secondId);
      assert.equal(second.strokes.length, 1);
      assert.deepEqual(await readBoard(page), undone, 'drawing on another board never changes current');
      await gallery(page);
      await openBoard(page);
      assert.equal(await page.getByRole('button', { name: 'Refazer', exact: true }).isEnabled(), true);
      await page.getByRole('button', { name: 'Refazer', exact: true }).click();
      await saved(page);
      assert.deepEqual(await readBoard(page), expected, 'first history restored independently');
      const x = expected.camera.x;
      await page.locator('.drawing-canvas').focus();
      await page.keyboard.press('ArrowLeft');
      await gallery(page);
      assert.equal((await readBoard(page)).camera.x, x + 40, 'navigation flushes debounced viewport');
      await openBoard(page, 2);
      await page.getByRole('button', { name: 'Desfazer', exact: true }).click();
      await saved(page);
      assert.equal((await readBoard(page, secondId)).strokes.length, 0);
      await gallery(page);
      await openBoard(page);
      assert.equal(await page.getByRole('button', { name: 'Refazer', exact: true }).isDisabled(), true);
      await gallery(page);
      await openBoard(page, 2);
      assert.equal(await page.getByRole('button', { name: 'Refazer', exact: true }).isEnabled(), true);
      await page.getByRole('button', { name: 'Refazer', exact: true }).click();
      await saved(page);
      assert.deepEqual(await readBoard(page, secondId), second);
      await gallery(page);
      for (const [width, height, name] of [[1440, 900, 'desktop'], [1024, 768, 'tablet'], [390, 844, 'mobile'], [320, 568, 'narrow'], [844, 390, 'landscape']]) {
        await page.setViewportSize({ width, height });
        const geometry = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth, width: innerWidth,
          cards: [...document.querySelectorAll('.board-card')].map(card => {
            const { x, width } = card.getBoundingClientRect(); return { x, width };
          }),
        }));
        assert.ok(geometry.scroll <= geometry.width, `${name}: gallery has no horizontal overflow`);
        assert.ok(geometry.cards.every(card => card.x >= 0 && card.x + card.width <= width), `${name}: cards fit`);
        await page.screenshot({ path: resolve(screenshots, `gallery-${name}.png`), fullPage: true });
      }
      await page.setViewportSize({ width: 1440, height: 900 });
      const first = await readBoard(page);
      await context.setOffline(true);
      await page.reload();
      await page.getByRole('button', { name: 'Abrir Desenho 2', exact: true }).waitFor();
      assert.deepEqual(await readBoard(page), first);
      assert.deepEqual(await readBoard(page, secondId), second);
      await openBoard(page, 2);
      assert.equal(await page.getByRole('button', { name: 'Refazer', exact: true }).isDisabled(), true, 'redo resets on app restart, not board switch');
      await context.setOffline(false);
      await gallery(page);
      await openBoard(page);
      assert.deepEqual(errors, []);
    });

    await t.test('unfinished pen is committed to its original board before leaving', async () => {
      const before = (await readBoard(page)).strokes.length;
      await page.mouse.move(400, 400);
      await page.mouse.down();
      await page.mouse.move(520, 450, { steps: 4 });
      // Keyboard activation can occur while a pen still holds pointer capture.
      await page.evaluate(() => document.querySelector('[aria-label="Meus desenhos"]').click());
      await page.getByRole('heading', { name: 'Meus desenhos', exact: true }).waitFor();
      await page.mouse.up();
      assert.equal((await readBoard(page)).strokes.length, before + 1);
      const index = await readBoard(page, 'gallery');
      assert.equal((await readBoard(page, index.ids[1])).strokes.length, 1);
      await openBoard(page, 2);
      await draw(page, 400, 450);
      assert.equal((await readBoard(page, index.ids[1])).strokes.length, 2);
      assert.equal((await readBoard(page)).strokes.length, before + 1);
    });

    await t.test('aborted migration and creation leave no partial writes; retry creates exactly one board', async () => {
      const fixture = JSON.parse(await readFile(new URL('./fixtures/board-v1.json', import.meta.url), 'utf8'));
      const isolated = await browser.newContext();
      const target = await isolated.newPage();
      await seed(target, url, [['current', fixture]]);
      await target.evaluate(() => localStorage.setItem('abort-gallery', 'yes'));
      await isolated.addInitScript(() => {
        const put = IDBObjectStore.prototype.put;
        IDBObjectStore.prototype.put = function (value, key) {
          const request = put.call(this, value, key);
          if (key === 'gallery' && localStorage.getItem('abort-gallery')) this.transaction.abort();
          return request;
        };
      });
      await target.goto(url);
      await target.getByRole('button', { name: 'Tentar abrir novamente' }).waitFor();
      assert.deepEqual(await readBoard(target), fixture);
      assert.deepEqual(await keys(target), ['current']);
      await target.evaluate(() => localStorage.removeItem('abort-gallery'));
      await target.getByRole('button', { name: 'Tentar abrir novamente' }).click();
      await target.getByRole('button', { name: 'Abrir Desenho 1', exact: true }).waitFor();
      await target.evaluate(() => localStorage.setItem('abort-gallery', 'yes'));
      await target.getByRole('button', { name: 'Novo desenho', exact: true }).click();
      await target.getByRole('button', { name: 'Livre', exact: true }).click();
      await target.getByRole('alert').filter({ hasText: 'Não foi possível criar' }).waitFor();
      assert.deepEqual(await keys(target), ['current', 'gallery'], 'aborted add leaves no orphan');
      assert.deepEqual(await readBoard(target, 'gallery'), { version: 1, ids: ['current'] });
      assert.deepEqual(await readBoard(target), fixture);
      await target.screenshot({ path: resolve(screenshots, 'gallery-create-error.png'), fullPage: true });
      await target.setViewportSize({ width: 320, height: 568 });
      const layout = await target.evaluate(() => ({
        error: document.querySelector('.error-banner').getBoundingClientRect().bottom,
        gallery: document.querySelector('.gallery').getBoundingClientRect().top,
        overflow: document.documentElement.scrollWidth > innerWidth,
      }));
      assert.ok(layout.error <= layout.gallery, 'mobile error never overlaps gallery');
      assert.equal(layout.overflow, false);
      await target.screenshot({ path: resolve(screenshots, 'gallery-create-error-mobile.png'), fullPage: true });
      await target.evaluate(() => localStorage.removeItem('abort-gallery'));
      await target.evaluate(() => {
        const button = document.querySelector('[aria-label="Livre"]');
        button.click(); button.click();
      });
      await saved(target);
      assert.equal((await readBoard(target, 'gallery')).ids.length, 2, 'rapid double activation creates once');
      assert.deepEqual(await readBoard(target), fixture);
      await isolated.close();
    });

    await t.test('invalid gallery blocks writes; one invalid indexed board does not replace other drawings', async () => {
      const fixture = JSON.parse(await readFile(new URL('./fixtures/board-v1.json', import.meta.url), 'utf8'));
      const secondId = 'board:00000000-0000-4000-8000-000000000002';
      const corrupt = { version: 99, strokes: ['preserve'] };
      const isolated = await browser.newContext();
      const target = await isolated.newPage();
      const invalid = { version: 1, ids: ['current', 'current'] };
      await seed(target, url, [['current', fixture], ['gallery', invalid], [secondId, corrupt]]);
      await target.goto(url);
      await target.getByRole('alert').filter({ hasText: 'Formato de galeria inválido' }).waitFor();
      assert.equal(await target.getByRole('button', { name: 'Novo desenho', exact: true }).isDisabled(), true);
      assert.deepEqual(await readBoard(target, 'gallery'), invalid);
      assert.deepEqual(await readBoard(target), fixture);
      await target.evaluate(() => new Promise(resolve => {
        const request = indexedDB.open('quadro-livre-pwa', 1);
        request.onsuccess = () => {
          const db = request.result, tx = db.transaction('boards', 'readwrite');
          tx.objectStore('boards').put({ version: 1, ids: ['current', ,] }, 'gallery');
          tx.oncomplete = () => { db.close(); resolve(); };
        };
      }));
      await target.reload();
      await target.getByRole('alert').filter({ hasText: 'Formato de galeria inválido' }).waitFor();
      assert.deepEqual(await readBoard(target), fixture, 'sparse indexes are rejected without touching documents');
      await seed(target, url, [['gallery', { version: 1, ids: ['current', secondId] }]]);
      await target.goto(url);
      await target.getByRole('alert').filter({ hasText: 'original não foi substituído' }).waitFor();
      assert.equal(await target.getByRole('button', { name: 'Abrir Desenho 2', exact: true }).isDisabled(), true);
      await openBoard(target);
      assert.deepEqual(await readBoard(target), fixture);
      assert.deepEqual(await readBoard(target, secondId), corrupt);
      await gallery(target);
      await target.screenshot({ path: resolve(screenshots, 'gallery-corrupt-board.png'), fullPage: true });
      await isolated.close();
    });

    await t.test('corrupt saved board stays untouched and editor is blocked', async () => {
      const isolated = await browser.newContext();
      const target = await isolated.newPage();
      const corrupt = { version: 77, strokes: ['do not replace'] };
      await seed(target, url, [['current', corrupt]]);
      await target.goto(url);
      await target.getByRole('alert').filter({ hasText: 'original não foi substituído' }).waitFor();
      assert.deepEqual(await readBoard(target), corrupt);
      assert.equal(await target.getByRole('button', { name: 'Novo desenho', exact: true }).isDisabled(), true);
      assert.deepEqual(await keys(target), ['current']);
      await target.screenshot({ path: resolve(screenshots, 'corrupt.png'), fullPage: true });
      await isolated.close();
    });

    await t.test('write failure is visible, retains live drawing and allows export', async () => {
      const isolated = await browser.newContext();
      const target = await isolated.newPage();
      await target.goto(url);
      await createFree(target);
      await target.evaluate(() => {
        window.originalPut = IDBObjectStore.prototype.put;
        IDBObjectStore.prototype.put = () => { throw new DOMException('Test quota exceeded', 'QuotaExceededError'); };
      });
      const original = await readBoard(target);
      await target.mouse.move(200, 250); await target.mouse.down(); await target.mouse.move(500, 400); await target.mouse.up();
      await target.getByRole('alert').filter({ hasText: 'Não foi possível salvar' }).waitFor();
      assert.deepEqual(await readBoard(target), original);
      await target.getByRole('button', { name: 'Meus desenhos', exact: true }).click();
      await target.getByRole('alert').filter({ hasText: 'Não foi possível salvar' }).waitFor();
      assert.equal(await target.getByRole('heading', { name: 'Meus desenhos', exact: true }).count(), 0, 'cannot leave unsaved ink');
      await unlock(target);
      assert.equal(await target.getByRole('button', { name: 'Backup dos traços' }).isEnabled(), true);
      const download = target.waitForEvent('download');
      await target.getByRole('button', { name: 'Backup dos traços' }).click();
      const backup = await download;
      const backupPath = resolve(screenshots, 'unsaved-backup.json');
      await backup.saveAs(backupPath);
      assert.equal(JSON.parse(await readFile(backupPath, 'utf8')).strokes.length, 1);
      await target.getByRole('button', { name: 'Fechar área dos responsáveis' }).click();
      await target.evaluate(() => { IDBObjectStore.prototype.put = window.originalPut; });
      await target.getByRole('button', { name: 'Tentar salvar novamente' }).click();
      await saved(target);
      assert.equal((await readBoard(target)).strokes.length, 1);
      await isolated.close();
    });

    await t.test('static deployment in subdirectory works offline', async () => {
      const isolated = await browser.newContext();
      const target = await isolated.newPage();
      await target.goto(`${url}/atelier/`);
      await target.getByText('Pronto para desenhar sem internet', { exact: true }).waitFor();
      await createFree(target);
      await draw(target);
      await isolated.setOffline(true);
      await target.reload();
      await openBoard(target);
      assert.equal((await readBoard(target)).strokes.length, 1);
      await isolated.close();
    });

    await t.test('activity picker exposes 100 themes per mode, category filtering and guided boards offline', async () => {
      const isolated = await browser.newContext({ viewport: { width: 1024, height: 768 } });
      const target = await isolated.newPage();
      await target.goto(url);
      await target.getByRole('button', { name: 'Novo desenho', exact: true }).click();
      for (const [width, height, name] of [[1440, 900, 'desktop'], [390, 844, 'mobile']]) {
        await target.setViewportSize({ width, height });
        await target.screenshot({ path: resolve(screenshots, `activities-${name}.png`), fullPage: true });
      }
      await target.setViewportSize({ width: 1024, height: 768 });
      assert.equal(await target.getByRole('button', { name: 'Seguir contorno', exact: true }).locator('img')
        .evaluate(image => getComputedStyle(image).opacity), '1', 'sample must not attenuate baked thumbnail again');
      await target.getByRole('button', { name: 'Seguir contorno', exact: true }).click();
      assert.equal(await target.getByRole('button', { name: /^Criar / }).count(), 100);
      await target.getByLabel('Categoria', { exact: true }).selectOption('A');
      assert.equal(await target.getByRole('button', { name: /^Criar / }).count(), 10);
      await target.getByRole('button', { name: 'Criar Gatinho sentado', exact: true }).click();
      await saved(target);
      const trace = await readBoard(target);
      assert.equal(trace.mode, 'trace');
      assert.equal(trace.template.assetVersion, 2);
      await target.screenshot({ path: resolve(screenshots, 'trace-tablet.png'), fullPage: true });
      await gallery(target);
      await target.getByRole('button', { name: 'Novo desenho', exact: true }).click();
      await target.getByRole('button', { name: 'Colorir', exact: true }).click();
      assert.equal(await target.getByRole('button', { name: /^Criar / }).count(), 100);
      await target.getByLabel('Categoria', { exact: true }).selectOption('J');
      assert.equal(await target.getByRole('button', { name: /^Criar / }).count(), 10);
      for (const [width, height, name] of [[1440, 900, 'desktop'], [390, 844, 'mobile'], [320, 568, 'narrow'], [844, 390, 'landscape']]) {
        await target.setViewportSize({ width, height });
        assert.equal(await target.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await target.screenshot({ path: resolve(screenshots, `catalog-${name}.png`), fullPage: true });
      }
      await target.setViewportSize({ width: 1024, height: 768 });
      await target.getByLabel('Categoria', { exact: true }).selectOption('A');
      await target.getByRole('button', { name: 'Criar Gatinho sentado', exact: true }).click();
      await saved(target);
      const index = await readBoard(target, 'gallery');
      assert.equal((await readBoard(target, index.ids[1])).mode, 'coloring');
      assert.deepEqual(await readBoard(target), trace);
      await target.screenshot({ path: resolve(screenshots, 'coloring-tablet.png'), fullPage: true });
      await target.getByText('Pronto para desenhar sem internet', { exact: true }).waitFor();
      await isolated.setOffline(true);
      await target.reload();
      await openBoard(target, 2);
      assert.deepEqual(await readBoard(target), trace);
      await gallery(target);
      await openBoard(target);
      await isolated.close();
    });

    await t.test('guided layering, protected contours, 40% trace guide, archived revisions and composed PNG', async () => {
      const sw = await readFile(resolve(dist, 'sw.js'), 'utf8');
      const precache = JSON.parse(sw.match(/const PRECACHE = (.*);/)[1]);
      for (const [mode, version] of [['trace', 2], ['coloring', 2], ['coloring', 1]]) {
        const item = [...catalog.items, ...catalog.archivedItems].find(item => item.id === 'cat-seated' && item.assetVersion === version);
        const doc = { ...activityDocument(mode, item), camera: { x: 512, y: 384, scale: 0.5 }, strokes: [{
          tool: 'pen', color: '#e15334', width: 22, points: [{ x: -450, y: 0, p: 1 }, { x: 450, y: 0, p: 1 }],
        }] };
        const asset = precache.find(file => file.startsWith(`assets/${item.variants[mode].asset}-`));
        assert.ok(asset);
        const isolated = await browser.newContext({ viewport: { width: 1024, height: 768 }, acceptDownloads: true });
        const target = await isolated.newPage();
        await seed(target, url, [['current', doc]]);
        await target.goto(url);
        await openBoard(target);
        await target.waitForFunction(() => document.querySelector('.drawing-canvas')
          ?.getContext('2d').getImageData(512, 384, 1, 1).data[3] > 0);
        const samples = await target.evaluate(async ({ src, doc }) => {
          const image = new Image(); image.src = src; await image.decode();
          const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 768;
          const expected = canvas.getContext('2d');
          expected.setTransform(0.5, 0, 0, 0.5, 512, 384);
          expected.globalAlpha = doc.mode === 'trace' ? 0.4 : 1;
          expected.globalCompositeOperation = doc.mode === 'trace' ? 'destination-over' : 'source-over';
          expected.drawImage(image, -450, -450, 900, 900);
          window.expectedGuide = expected.getImageData(0, 0, 1024, 768).data;
          const actual = document.querySelector('.drawing-canvas').getContext('2d').getImageData(0, 0, 1024, 768).data;
          const samples = [];
          for (let y = 383; y <= 385; y++) for (let x = 300; x < 724; x++) {
            const i = (y * 1024 + x) * 4;
            if (window.expectedGuide[i + 3] >= (doc.mode === 'trace' ? 100 : 250)) samples.push([...actual.slice(i, i + 4)]);
          }
          return samples;
        }, { src: `${url}/${asset}`, doc });
        assert.ok(samples.length > 0, `${mode} V${version}: contour pixels found beneath ink`);
        assert.ok(samples.every(([r, g]) => mode === 'trace' ? r > 200 && g < 120 : r < 100 && g < 100), `${mode}: correct template/ink order`);
        await target.getByRole('button', { name: 'Traço grosso', exact: true }).click();
        await target.getByRole('button', { name: 'Borracha', exact: true }).click();
        await target.mouse.move(287, 384); await target.mouse.down();
        await target.mouse.move(737, 384, { steps: 10 }); await target.mouse.up();
        await saved(target);
        await target.evaluate(() => new Promise(requestAnimationFrame));
        const difference = await target.evaluate(() => {
          const actual = document.querySelector('.drawing-canvas').getContext('2d').getImageData(0, 0, 1024, 768).data;
          let maximum = 0;
          const samples = [];
          for (let i = 0; i < actual.length; i++) {
            const delta = Math.abs(actual[i] - window.expectedGuide[i]);
            maximum = Math.max(maximum, delta);
            if (delta > 5 && samples.length < 5) samples.push({ i, actual: actual[i], expected: window.expectedGuide[i], alpha: actual[i - i % 4 + 3] });
          }
          return { maximum, samples };
        });
        assert.equal(difference.maximum, 0, `${mode} V${version}: eraser leaves exact guide, never erases illustration: ${JSON.stringify(difference.samples)}`);
        await unlock(target);
        const download = target.waitForEvent('download');
        await target.getByRole('button', { name: 'Salvar imagem PNG', exact: true }).click();
        const png = await download;
        const path = resolve(screenshots, `${mode}-v${version}-export.png`);
        await png.saveAs(path);
        const bytes = await readFile(path);
        assert.ok(bytes.readUInt32BE(16) >= 900 && bytes.readUInt32BE(16) <= 2048);
        const visible = await target.evaluate(async base64 => {
          const image = new Image(); image.src = `data:image/png;base64,${base64}`; await image.decode();
          const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
          const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
          const pixels = context.getImageData(0, 0, image.width, image.height).data;
          let nonwhite = 0;
          for (let i = 0; i < pixels.length; i += 4) if (pixels[i] < 250) nonwhite++;
          return nonwhite;
        }, bytes.toString('base64'));
        assert.ok(visible > 100, 'export contains protected template after ink erased');
        await isolated.close();
      }
      for (const version of [1, 2]) {
        const item = [...catalog.items, ...catalog.archivedItems].find(item => item.id === 'cat-seated' && item.assetVersion === version);
        const doc = activityDocument('trace', item);
        const isolated = await browser.newContext();
        const target = await isolated.newPage();
        await seed(target, url, [['current', doc]]);
        await target.goto(url);
        await target.waitForFunction(() => {
          const canvas = document.querySelector('.board-card canvas');
          return canvas && canvas.getContext('2d').getImageData(0, 0, 480, 320).data.some((value, i) => i % 4 === 3 && value > 0);
        });
        const thumb = precache.find(file => file.startsWith(`assets/${item.variants.trace.thumbnail}-`));
        const difference = await target.locator('.board-card canvas').evaluate(async (canvas, src) => {
          const image = new Image(); image.src = src; await image.decode();
          const expected = document.createElement('canvas'); expected.width = 480; expected.height = 320;
          const context = expected.getContext('2d');
          context.setTransform(0.32, 0, 0, 0.32, 240, 160);
          context.globalCompositeOperation = 'destination-over';
          context.drawImage(image, -450, -450, 900, 900);
          const a = canvas.getContext('2d').getImageData(0, 0, 480, 320).data;
          const b = context.getImageData(0, 0, 480, 320).data;
          let maximum = 0;
          for (let i = 3; i < a.length; i += 4) maximum = Math.max(maximum, Math.abs(a[i] - b[i]));
          return maximum;
        }, `${url}/${thumb}`);
        assert.equal(difference, 0, `archived/current trace V${version}: preview keeps baked alpha exactly once`);
        await target.screenshot({ path: resolve(screenshots, `trace-preview-v${version}.png`), fullPage: true });
        await isolated.close();
      }
    });

    await t.test('every instrument works in guided modes; erasing textured ink leaves exact protected illustration', async () => {
      const sw = await readFile(resolve(dist, 'sw.js'), 'utf8');
      const precache = JSON.parse(sw.match(/const PRECACHE = (.*);/)[1]);
      const item = catalog.items.find(item => item.id === 'cat-seated');
      for (const mode of ['trace', 'coloring']) {
        const doc = { ...activityDocument(mode, item), camera: { x: 512, y: 384, scale: 0.5 }, strokes: [] };
        const isolated = await browser.newContext({ viewport: { width: 1024, height: 768 } });
        const target = await isolated.newPage();
        await seed(target, url, [['current', doc]]); await target.goto(url); await openBoard(target);
        await target.getByRole('button', { name: 'Traço grosso', exact: true }).click();
        for (const [i, [tool, label]] of INSTRUMENTS.entries()) {
          await target.getByRole('button', { name: 'Escolher instrumento', exact: true }).click();
          await target.getByRole('button', { name: label, exact: true }).click();
          const y = 354 + i * 20;
          await target.mouse.move(287, y); await target.mouse.down(); await target.mouse.move(737, y, { steps: 10 }); await target.mouse.up(); await saved(target);
          assert.equal((await readBoard(target)).strokes.at(-1).tool, tool);
        }
        const ink = await readBoard(target);
        const asset = precache.find(file => file.startsWith(`assets/${item.variants[mode].asset}-`));
        await target.evaluate(() => new Promise(requestAnimationFrame));
        assert.equal(await target.evaluate(async ({ src, doc }) => {
          const { drawStroke } = await import('/test-src/render.mjs');
          const image = new Image(); image.src = src; await image.decode();
          const expected = document.createElement('canvas'); expected.width = 1024; expected.height = 768;
          const ctx = expected.getContext('2d'); ctx.setTransform(0.5, 0, 0, 0.5, 512, 384);
          for (const s of doc.strokes) drawStroke(ctx, s);
          ctx.globalAlpha = doc.mode === 'trace' ? 0.4 : 1;
          ctx.globalCompositeOperation = doc.mode === 'trace' ? 'destination-over' : 'source-over';
          ctx.drawImage(image, -450, -450, 900, 900);
          const actual = document.querySelector('.drawing-canvas').getContext('2d').getImageData(0, 0, 1024, 768).data;
          const matches = ctx.getImageData(0, 0, 1024, 768).data.every((v, i) => v === actual[i]);
          ctx.clearRect(-1024, -768, 2048, 1536); ctx.drawImage(image, -450, -450, 900, 900);
          window.instrumentGuide = ctx.getImageData(0, 0, 1024, 768).data;
          return matches;
        }, { src: `${url}/${asset}`, doc: ink }), true, `${mode}: exact ink/template layer order and opacity`);
        await target.screenshot({ path: resolve(screenshots, `instruments-${mode}.png`) });
        await target.getByRole('button', { name: 'Borracha', exact: true }).click();
        for (let i = 0; i < 4; i++) {
          const y = 354 + i * 20;
          await target.mouse.move(280, y); await target.mouse.down(); await target.mouse.move(745, y, { steps: 10 }); await target.mouse.up(); await saved(target);
        }
        await target.evaluate(() => new Promise(requestAnimationFrame));
        assert.equal(await target.evaluate(() => document.querySelector('.drawing-canvas').getContext('2d')
          .getImageData(0, 0, 1024, 768).data.every((v, i) => v === window.instrumentGuide[i])), true, `${mode}: only ink erased`);
        assert.deepEqual((await readBoard(target)).template, doc.template);
        await isolated.close();
      }
    });

    await t.test('unknown saved instrument is protected, never reinterpreted or rewritten', async () => {
      const fixture = JSON.parse(await readFile(new URL('./fixtures/board-v1.json', import.meta.url), 'utf8'));
      fixture.strokes[0].tool = 'future-brush';
      const isolated = await browser.newContext(), target = await isolated.newPage();
      await seed(target, url, [['current', fixture], ['gallery', { version: 1, ids: ['current'] }]]);
      await target.goto(url);
      await target.getByRole('alert').filter({ hasText: 'Instrumento desconhecido' }).waitFor();
      assert.equal(await target.getByRole('button', { name: 'Abrir Desenho 1', exact: true }).isDisabled(), true);
      assert.deepEqual(await readBoard(target), fixture);
      assert.equal(await target.locator('.drawing-canvas').count(), 0);
      await isolated.close();
    });

    await t.test('missing exact revision or unavailable image never becomes a blank editable board', async () => {
      const isolated = await browser.newContext({ serviceWorkers: 'block' });
      const target = await isolated.newPage();
      const unknown = { ...activityDocument('coloring', catalog.items[0]), template: {
        ...activityDocument('coloring', catalog.items[0]).template, assetVersion: 999,
      } };
      await seed(target, url, [['current', unknown], ['gallery', { version: 1, ids: ['current'] }]]);
      await target.goto(url);
      await target.getByRole('alert').filter({ hasText: 'versão exata' }).waitFor();
      assert.equal(await target.getByRole('button', { name: 'Abrir Desenho 1', exact: true }).isDisabled(), true);
      assert.deepEqual(await readBoard(target), unknown);
      const doc = activityDocument('coloring', catalog.items[0]);
      await seed(target, url, [['current', doc]]);
      await isolated.route('**/assets/cat-seated-v2-coloring-*.png', route => route.abort());
      await target.goto(url);
      await target.getByRole('button', { name: 'Abrir Desenho 1', exact: true }).click();
      await target.getByRole('alert').filter({ hasText: 'Não foi possível carregar o modelo' }).waitFor();
      assert.equal(await target.locator('.drawing-canvas').count(), 0);
      assert.deepEqual(await readBoard(target), doc);
      await isolated.close();
    });

    await t.test('restore creates editable copy; invalid backup and aborted deletion preserve drawings; confirmed deletion is scoped', async () => {
      const isolated = await browser.newContext({ acceptDownloads: true });
      const target = await isolated.newPage();
      await target.goto(url);
      await createFree(target);
      await draw(target);
      const original = await readBoard(target);
      await unlock(target);
      const before = await readBoard(target, 'gallery');
      await target.getByLabel('Arquivo de backup JSON', { exact: true }).setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
      await target.getByRole('alert').filter({ hasText: 'Formato de quadro inválido' }).waitFor();
      await target.screenshot({ path: resolve(screenshots, 'parents-restore-error.png'), fullPage: true });
      assert.deepEqual(await readBoard(target), original);
      assert.deepEqual(await readBoard(target, 'gallery'), before);
      const fixture = JSON.parse(await readFile(new URL('./fixtures/board-v1.json', import.meta.url), 'utf8'));
      await target.getByLabel('Arquivo de backup JSON', { exact: true }).setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fixture)) });
      await target.getByRole('dialog').waitFor({ state: 'hidden' });
      await saved(target);
      const restoredId = (await readBoard(target, 'gallery')).ids[1];
      assert.deepEqual(await readBoard(target, restoredId), fixture, 'restoration preserves exact editable content and camera');
      assert.deepEqual(await readBoard(target), original);
      await target.getByRole('button', { name: 'Desfazer', exact: true }).click();
      await saved(target);
      assert.equal((await readBoard(target, restoredId)).strokes.length, 1, 'restored strokes remain editable');
      await target.getByRole('button', { name: 'Refazer', exact: true }).click();
      await saved(target);
      assert.deepEqual(await readBoard(target, restoredId), fixture);
      await unlock(target);
      await target.getByRole('button', { name: 'Excluir Desenho 1', exact: true }).click();
      await target.getByRole('button', { name: 'Cancelar exclusão', exact: true }).click();
      assert.deepEqual(await readBoard(target), original);
      await target.getByRole('button', { name: 'Excluir Desenho 1', exact: true }).click();
      await target.screenshot({ path: resolve(screenshots, 'parents-delete-confirm.png'), fullPage: true });
      await target.setViewportSize({ width: 390, height: 844 });
      await target.getByRole('button', { name: 'Excluir definitivamente', exact: true }).scrollIntoViewIfNeeded();
      await target.screenshot({ path: resolve(screenshots, 'parents-delete-mobile.png'), fullPage: true });
      assert.equal(await target.locator('dialog').evaluate(dialog => dialog.scrollWidth > dialog.clientWidth), false);
      await target.setViewportSize({ width: 1280, height: 720 });
      await target.evaluate(() => {
        window.originalPut = IDBObjectStore.prototype.put;
        IDBObjectStore.prototype.put = function (value, key) {
          const request = window.originalPut.call(this, value, key);
          if (key === 'gallery') this.transaction.abort();
          return request;
        };
      });
      await target.getByRole('button', { name: 'Excluir definitivamente', exact: true }).click();
      await target.getByRole('alert').filter({ hasText: 'Não foi possível excluir. O desenho foi mantido; tente novamente.' }).waitFor();
      assert.deepEqual(await readBoard(target), original, 'aborted transaction rolls back document delete');
      assert.deepEqual(await readBoard(target, restoredId), fixture);
      await target.evaluate(() => { IDBObjectStore.prototype.put = window.originalPut; });
      await target.getByRole('button', { name: 'Excluir definitivamente', exact: true }).click();
      await target.getByRole('button', { name: 'Excluir Desenho 2', exact: true }).waitFor();
      assert.equal(await readBoard(target), undefined);
      assert.deepEqual(await readBoard(target, restoredId), fixture, 'only confirmed target is deleted');
      await target.getByRole('button', { name: 'Excluir Desenho 2', exact: true }).click();
      await target.getByRole('button', { name: 'Excluir definitivamente', exact: true }).click();
      await target.getByText('Nenhum desenho para excluir.', { exact: true }).waitFor();
      assert.deepEqual((await readBoard(target, 'gallery')).ids, []);
      await target.getByRole('button', { name: 'Fechar área dos responsáveis', exact: true }).click();
      await createFree(target);
      const index = await readBoard(target, 'gallery');
      assert.equal(index.numbers[0], 3, 'numbers are never reused after deletion');
      assert.notEqual(index.ids[0], 'current', 'deleted legacy key is never reused');
      assert.equal(await readBoard(target), undefined);
      await target.reload();
      await openBoard(target, 3);
      await unlock(target);
      const guided = activityDocument('coloring', catalog.archivedItems.find(item => item.id === 'cat-seated'));
      await target.getByLabel('Arquivo de backup JSON', { exact: true }).setInputFiles({ name: 'guided.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(guided)) });
      await target.getByRole('dialog').waitFor({ state: 'hidden' });
      await saved(target);
      const guidedId = (await readBoard(target, 'gallery')).ids[1];
      assert.deepEqual(await readBoard(target, guidedId), guided, 'guided restore keeps archived exact version');
      await isolated.close();
    });
  } finally {
    await context.close();
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
