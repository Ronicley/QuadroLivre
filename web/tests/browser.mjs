import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const screenshots = fileURLToPath(new URL('../../.impeccable/review/', import.meta.url));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };

async function readBoard(page) {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('quadro-livre-pwa', 1);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('boards');
      const get = tx.objectStore('boards').get('current');
      tx.oncomplete = () => { resolve(get.result); db.close(); };
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  }));
}

const saved = page => page.getByRole('status').filter({ hasText: 'Salvo neste aparelho' }).waitFor();
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
      if (pathname.startsWith('/atelier/')) pathname = pathname.slice('/atelier'.length);
      if (pathname.endsWith('/')) pathname += 'index.html';
      const file = resolve(dist, `.${pathname}`);
      if (!file.startsWith(dist.endsWith(sep) ? dist : dist + sep)) throw new Error('Outside test root');
      response.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
      response.end(await readFile(file));
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
      await page.getByText('Seu quadro está pronto', { exact: true }).waitFor();
      await page.getByText('Pronto para desenhar sem internet', { exact: true }).waitFor();
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
      await page.getByRole('button', { name: 'Canetinha', exact: true }).click();
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
      await saved(page);
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
      assert.equal(await second.getByRole('button', { name: 'Canetinha', exact: true }).isDisabled(), true);
      await second.close();
      await context.setOffline(true);
      await page.reload();
      await saved(page);
      assert.deepEqual(await readBoard(page), expected);
      assert.ok(await page.evaluate(() => navigator.serviceWorker.controller !== null));
      assert.deepEqual(errors, []);
      await context.setOffline(false);
    });

    await t.test('corrupt saved board stays untouched and editor is blocked', async () => {
      const isolated = await browser.newContext();
      const target = await isolated.newPage();
      await target.goto(url);
      await target.getByText('Seu quadro está pronto', { exact: true }).waitFor();
      const corrupt = { version: 77, strokes: ['do not replace'] };
      await target.evaluate(doc => new Promise((resolve, reject) => {
        const request = indexedDB.open('quadro-livre-pwa', 1);
        request.onsuccess = () => {
          const db = request.result, tx = db.transaction('boards', 'readwrite');
          tx.objectStore('boards').put(doc, 'current');
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.onerror = () => reject(tx.error);
        };
      }), corrupt);
      await target.reload();
      await target.getByRole('alert').filter({ hasText: 'original não foi substituído' }).waitFor();
      assert.deepEqual(await readBoard(target), corrupt);
      assert.equal(await target.getByRole('button', { name: 'Canetinha', exact: true }).isDisabled(), true);
      await target.screenshot({ path: resolve(screenshots, 'corrupt.png'), fullPage: true });
      await isolated.close();
    });

    await t.test('write failure is visible, retains live drawing and allows export', async () => {
      const isolated = await browser.newContext();
      await isolated.addInitScript(() => { IDBObjectStore.prototype.put = () => { throw new DOMException('Test quota exceeded', 'QuotaExceededError'); }; });
      const target = await isolated.newPage();
      await target.goto(url);
      await target.getByText('Seu quadro está pronto', { exact: true }).waitFor();
      await target.mouse.move(200, 250); await target.mouse.down(); await target.mouse.move(500, 400); await target.mouse.up();
      await target.getByRole('alert').filter({ hasText: 'Não foi possível salvar' }).waitFor();
      assert.equal(await readBoard(target), undefined);
      await unlock(target);
      assert.equal(await target.getByRole('button', { name: 'Backup dos traços' }).isEnabled(), true);
      await isolated.close();
    });

    await t.test('static deployment in subdirectory works offline', async () => {
      const isolated = await browser.newContext();
      const target = await isolated.newPage();
      await target.goto(`${url}/atelier/`);
      await target.getByText('Pronto para desenhar sem internet', { exact: true }).waitFor();
      await draw(target);
      await isolated.setOffline(true);
      await target.reload();
      await saved(target);
      assert.equal((await readBoard(target)).strokes.length, 1);
      await isolated.close();
    });
  } finally {
    await context.close();
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
