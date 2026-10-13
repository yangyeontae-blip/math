import test from 'node:test';
import assert from 'node:assert/strict';
import { mathTextHtml } from '../src/math-format';

test('fractions use stacked markup and mixed numbers keep their whole part', () => {
  assert.match(mathTextHtml('6/10과 1 2/3'), /aria-label="10분의 6"/);
  assert.match(mathTextHtml('6/10과 1 2/3'), /math-whole">1/);
  assert.match(mathTextHtml('6/10과 1 2/3'), /aria-label="3분의 2"/);
});

test('math text remains escaped', () => {
  const html = mathTextHtml('<img src=x onerror=alert(1)> 1/2');
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;img/);
});
