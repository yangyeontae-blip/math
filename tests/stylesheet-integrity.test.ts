import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../src/style.css', import.meta.url));
const text = new TextDecoder('utf-8', { fatal: true }).decode(css);

test('stylesheet is valid UTF-8 text, not binary or truncated', () => {
  assert.ok(!text.includes('�') && !text.includes('\0'), 'style.css contains broken characters');
  assert.ok(css.length > 60000, `style.css is only ${css.length} bytes; it was probably truncated or overwritten`);
});

test('stylesheet braces are balanced', () => {
  const stripped = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '');
  let depth = 0;
  for (const ch of stripped) {
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    assert.ok(depth >= 0, 'style.css has a closing brace without an opening one');
  }
  assert.equal(depth, 0, 'style.css has an unclosed brace');
});

test('stylesheet still styles the main screens', () => {
  for (const selector of ['.welcome-card', '.start-layer', '.character-picker', '.topbar', '.player-card', '.talk-bubble', 'dialog', '#toast', '.number-pad']) {
    assert.ok(text.includes(selector), `style.css lost the rules for ${selector}`);
  }
});
