import assert from 'node:assert/strict';
import {test} from 'node:test';
import {newSave} from '../src/rules';
import {TITLES,titleAvailable,titleDefinition,selectTitle,titleEffect,activeTitle} from '../src/titles';
import {compatibleTitleProfile,parsePlazaProfile,titleCatalogOf} from '../src/plaza-protocol';
import {plazaProfile} from '../src/plaza-identity';

test('berry wealth titles unlock at 1M, 10M and 100M held berries', () => {
  const s = newSave('부자', 0);
  const rich = ['rich-1m', 'rich-10m', 'rich-100m'].map(id => titleDefinition(id)!);
  assert.deepEqual(rich.map(t => t.name), ['백만장자', '천만장자', '억만장자']);
  s.berries = 999_999; assert.equal(rich.some(t => titleAvailable(s, t)), false);
  s.berries = 1_000_000; assert.deepEqual(rich.map(t => titleAvailable(s, t)), [true, false, false]);
  s.berries = 100_000_000; assert.ok(rich.every(t => titleAvailable(s, t)));
  selectTitle(s, 'rich-100m'); assert.equal(activeTitle(s)?.name, '억만장자');
  assert.match(titleEffect(s).label, /\+15%/);
  s.level = 1999; assert.equal(titleAvailable(s, titleDefinition('level-2000')!), false);
  s.level = 2000; assert.equal(titleAvailable(s, titleDefinition('level-2000')!), true); assert.equal(titleDefinition('level-2000')!.name, '베리의 숲 VIP');
  assert.equal(new Set(TITLES.map(t => t.id)).size, TITLES.length);
});

test('older plaza peers never receive an unknown wealth title id', () => {
  const s = newSave('부자', 0); s.berries = 10_000_000; selectTitle(s, 'rich-10m');
  const p = plazaProfile(s)!; assert.equal(p.selectedTitleId, 'rich-10m');
  assert.equal(compatibleTitleProfile(p, 3).selectedTitleId, 'rich-10m');
  assert.equal(compatibleTitleProfile(p, 2).selectedTitleId, null);
  assert.equal(compatibleTitleProfile(p, 1).selectedTitleId, null);
  assert.ok(parsePlazaProfile(compatibleTitleProfile(p, 2)));
  s.level = 2000; selectTitle(s, 'level-2000'); const vip = plazaProfile(s)!;
  assert.equal(compatibleTitleProfile(vip, 3).selectedTitleId, 'level-2000');
  assert.equal(compatibleTitleProfile(vip, 2).selectedTitleId, 'level-1000');
  assert.equal(compatibleTitleProfile(vip, 1).selectedTitleId, 'level-300');
  assert.deepEqual([titleCatalogOf(3), titleCatalogOf(2), titleCatalogOf(9), titleCatalogOf(undefined)], [3, 2, 1, 1]);
});
