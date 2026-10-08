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
  '.svg': 'image/svg+xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};
const textTypes = new Set(['.css', '.html', '.js', '.json', '.svg', '.webmanifest']);

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
  const extension = extname(file), text = textTypes.has(extension);
  manifest[pathname] = { body: await readFile(file, text ? 'utf8' : 'base64'), type: types[extension] ?? 'application/octet-stream', ...(text ? {} : { base64: true }) };
}

const template = await readFile(workerSource, 'utf8');
const marker = '/*__EMBEDDED_ASSETS__*/{}';
await mkdir(join(dist, 'server'), { recursive: true });
await writeFile(join(dist, 'server', 'index.js'), embedWorkerAssets(template, marker, manifest), 'utf8');
await mkdir(join(dist, '.openai'), { recursive: true });
await cp(join(root, '.openai', 'hosting.json'), join(dist, '.openai', 'hosting.json'));
await rm(join(dist, '.openai', 'drizzle'), { recursive: true, force: true });
await cp(join(root, 'drizzle'), join(dist, '.openai', 'drizzle'), { recursive: true });
console.log(`Sites Worker prepared with ${Object.keys(manifest).length} embedded assets.`);
