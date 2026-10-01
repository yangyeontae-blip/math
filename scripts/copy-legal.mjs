import { copyFileSync } from 'node:fs';

for (const file of ['LICENSE', 'NOTICE.md', 'THIRD_PARTY_NOTICES.md']) {
  copyFileSync(new URL(`../${file}`, import.meta.url), new URL(`../dist/${file}`, import.meta.url));
}

console.log('Copyright and third-party notices copied to dist.');
