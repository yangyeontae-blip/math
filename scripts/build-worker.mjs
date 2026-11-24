import {createRequire} from 'node:module';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { embedWorkerAssets } from './embed-worker-assets.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = join(root, 'dist'), workerSource = join(root, 'worker', 'index.js');

const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};
const textTypes = new Set(['.css', '.html', '.js', '.json', '.txt', '.svg', '.webmanifest']);

async function files(directory) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'server' || entry.name === '.openai') continue;
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await files(absolute));
    else if (entry.isFile()) found.push(absolute);
  }
  return found;
}

const manifest = {};
for (const file of await files(dist)) {
  const pathname = `/${relative(dist, file).split(sep).join('/')}`;
  // The five-minute promo is served by GitHub Pages for the Sites build.
  // Keeping it out of the Worker bundle preserves room for the game APIs.
  if (pathname === '/promo.mp4') continue;
  // 게임 화면은 GitHub Pages가 보여 줘요. Cloudflare 무료 한도(압축 3MB)를 넘지 않도록 글꼴·그림 파일은 서버 묶음에 넣지 않아요.
  if (/\.(ttf|otf|woff2?|webp|png|jpe?g|gif|pdf)$/i.test(pathname)) continue;
  const extension = extname(file), text = textTypes.has(extension);
  manifest[pathname] = { body: await readFile(file, text ? 'utf8' : 'base64'), type: types[extension] ?? 'application/octet-stream', ...(text ? {} : { base64: true }) };
}

const feedback = (await readFile(join(root, 'worker', 'feedback.js'), 'utf8')).replace('export async function handleFeedback', 'async function handleFeedback');
const template = (await readFile(workerSource, 'utf8')).replace("import { handleFeedback } from './feedback.js';", feedback);
const marker = '/*__EMBEDDED_ASSETS__*/{}';
await mkdir(join(dist, 'server'), { recursive: true });
const {build} = createRequire(import.meta.resolve('vite'))('esbuild');
const bundled = await build({stdin:{contents:embedWorkerAssets(template, marker, manifest),resolveDir:join(root,'worker'),sourcefile:'index.js'},bundle:true,format:'esm',platform:'browser',target:'es2022',write:false});
await writeFile(join(dist, 'server', 'index.js'), bundled.outputFiles[0].text, 'utf8');
// Cloudflare 정적 파일(assets)로 게임 화면을 함께 올릴 때 서버 묶음·호스팅 설정·큰 홍보 영상(25MB 한도 초과)은 빼요.
await writeFile(join(dist, '.assetsignore'), ['server', '.openai', 'promo.mp4', '.assetsignore'].join('\n') + '\n', 'utf8');
// 첫 화면·서비스 워커는 늘 새로 받고, 이름에 해시가 붙은 assets/만 오래 보관해요(GitHub Pages 쪽과 같은 갱신 흐름).
await writeFile(join(dist, '_headers'), [
  ...['/', '/index.html', '/sw.js', '/manifest.webmanifest'].map(path => `${path}\n  Cache-Control: no-store`),
  '/assets/*\n  Cache-Control: public, max-age=31536000, immutable',
].join('\n') + '\n', 'utf8');
await mkdir(join(dist, '.openai'), { recursive: true });
await cp(join(root, '.openai', 'hosting.json'), join(dist, '.openai', 'hosting.json'));
await rm(join(dist, '.openai', 'drizzle'), { recursive: true, force: true });
await cp(join(root, 'drizzle'), join(dist, '.openai', 'drizzle'), { recursive: true });
console.log(`Sites Worker prepared with ${Object.keys(manifest).length} embedded assets.`);
