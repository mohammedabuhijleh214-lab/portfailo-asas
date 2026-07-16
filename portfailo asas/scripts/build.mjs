/**
 * Production build — minify JS/CSS into dist/ (no secrets, no obfuscation of auth)
 */
import * as esbuild from 'esbuild';
import { cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');

mkdirSync(dist, { recursive: true });
mkdirSync(join(dist, 'js'), { recursive: true });
mkdirSync(join(dist, 'css'), { recursive: true });
mkdirSync(join(dist, 'assets'), { recursive: true });

const jsFiles = readdirSync(join(root, 'js')).filter((f) => f.endsWith('.js'));
for (const file of jsFiles) {
  await esbuild.build({
    entryPoints: [join(root, 'js', file)],
    outfile: join(dist, 'js', file),
    bundle: false,
    minify: true,
    target: ['es2020'],
    legalComments: 'none',
  });
}

const cssFiles = readdirSync(join(root, 'css')).filter((f) => f.endsWith('.css'));
for (const file of cssFiles) {
  await esbuild.build({
    entryPoints: [join(root, 'css', file)],
    outfile: join(dist, 'css', file),
    minify: true,
    legalComments: 'none',
  });
}

for (const name of [
  'index.html',
  '404.html',
  '403.html',
  '500.html',
  'offline.html',
  'manifest.webmanifest',
  'sw.js',
  'sitemap.xml',
  'robots.txt',
  'README.md',
]) {
  if (existsSync(join(root, name))) {
    cpSync(join(root, name), join(dist, name));
  }
}

if (existsSync(join(root, 'assets'))) {
  cpSync(join(root, 'assets'), join(dist, 'assets'), { recursive: true });
}

// Point service worker cache at minified assets (same paths)
console.log('Built production assets → dist/');
console.log('Serve dist/ behind HTTPS and proxy /api to the auth server.');
