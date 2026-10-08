import assert from 'node:assert/strict';
import test from 'node:test';

import { embedWorkerAssets } from '../scripts/embed-worker-assets.mjs';

test('worker embedding preserves dollar replacement sequences in minified assets', () => {
  const marker = '/*__EMBEDDED_ASSETS__*/{}';
  const manifest = {
    '/assets/app.js': {
      body: 'function render(){state$&&view();return "$& $` $\' $$"}',
      type: 'text/javascript; charset=utf-8',
    },
  };
  const output = embedWorkerAssets(`const assets=${marker};`, marker, manifest);

  assert.equal(output, `const assets=${JSON.stringify(manifest)};`);
  assert.match(output, /state\$&&view/);
  assert.match(output, /\$& \$` \$' \$\$/);
});

test('worker embedding rejects a template without its marker', () => {
  assert.throws(() => embedWorkerAssets('const assets={};', 'missing', {}), /marker is missing/);
});
