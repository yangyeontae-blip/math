import { test } from 'node:test';
import assert from 'node:assert/strict';
import { curriculumVisualHtml } from '../src/curriculum-visual.ts';

const draw = (shape: string) => curriculumVisualHtml({ kind: 'geometry', shape } as never);
const heads = (html: string) => (html.match(/<path d="M\d+ 74 L\d+ 63 L\d+ 85 Z"/g) ?? []);

test('a line shows an arrowhead pointing outward at both ends so it is not mistaken for a ray', () => {
  const html = draw('line');
  assert.equal(heads(html).length, 2);
  assert.ok(html.includes('M22 74 L38 63 L38 85 Z'), 'left arrow must point left');
  assert.ok(html.includes('M178 74 L162 63 L162 85 Z'), 'right arrow must point right');
  assert.ok(!html.includes('marker-'), 'arrowheads are drawn directly, not with direction-guessing markers');
  assert.ok(!html.includes('<circle'), 'a line has no end points');
});

test('a ray has one end point and one arrowhead, a segment has two end points and no arrowheads', () => {
  const ray = draw('ray'); assert.equal(heads(ray).length, 1); assert.ok(ray.includes('M178 74 L162 63 L162 85 Z')); assert.equal((ray.match(/<circle/g) ?? []).length, 1);
  const segment = draw('segment'); assert.equal(heads(segment).length, 0); assert.equal((segment.match(/<circle/g) ?? []).length, 2);
});
