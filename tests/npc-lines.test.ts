import assert from 'node:assert/strict';
import test from 'node:test';
import { GREETINGS, NIGHT_LINES, RAIN_LINES, pickLine } from '../src/npc-lines.ts';

test('every talking spot has several short lines', () => {
  for (const [id, lines] of Object.entries(GREETINGS)) {
    assert.ok(lines.length >= 3, `${id} has ${lines.length} lines`);
    assert.equal(new Set(lines).size, lines.length, `${id} repeats a line`);
    for (const line of [...lines, ...NIGHT_LINES, ...RAIN_LINES]) assert.ok(line.length <= 40, `too long: ${line}`);
  }
});

test('the same line is not repeated twice in a row and night lines only appear at night', () => {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let prev = '';
  for (let i = 0; i < 200; i++) { const line = pickLine('guide', rnd, {}, prev)!; assert.notEqual(line, prev); assert.ok(GREETINGS.guide.includes(line)); prev = line; }
  const seen = new Set<string>();
  for (let i = 0; i < 300; i++) seen.add(pickLine('weapon', rnd, { night: true }, '')!);
  assert.ok([...seen].some(line => NIGHT_LINES.includes(line)));
  assert.equal(pickLine('nobody', rnd), null);
});
