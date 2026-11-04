import { defineConfig } from 'vite';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export default defineConfig({
  base: './',
  build: { target: 'safari17', assetsInlineLimit: 0 },
  plugins: [{
    name: 'offline-shell',
    generateBundle(_options, bundle) {
      const publicFiles = ['manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
      const files = [...new Set(['./', 'index.html', ...publicFiles, ...Object.values(bundle).map(file => file.fileName)])];
      const worker = readFileSync(new URL('./src/service-worker.js', import.meta.url), 'utf8');
      const hash = createHash('sha256').update(files.join('\n') + worker);
      hash.update(readFileSync(new URL('./index.html', import.meta.url)));
      for (const file of publicFiles) hash.update(readFileSync(new URL(`./public/${file}`, import.meta.url)));
      const version = hash.digest('hex').slice(0, 16);
      this.emitFile({ type: 'asset', fileName: 'sw.js', source:
        `const VERSION = ${JSON.stringify(version)};\nconst PRECACHE = ${JSON.stringify(files)};\n${worker}` });
    },
  }],
});
