import assert from 'node:assert/strict';
import {test} from 'node:test';
import {newSave} from '../src/rules';
import {selectTitle} from '../src/titles';
import {MATH_CARDS,claimTierSet,fishingOf} from '../src/fishing';
import {PLAZA_TITLE_CATALOG,compatibleTitleProfile,parsePlazaProfile,titleCatalogOf} from '../src/plaza-protocol';
import {plazaProfile} from '../src/plaza-identity';

test('fishing tier titles travel only to catalog-4 plaza peers', () => {
  const s = newSave('낚시', 0);
  for (const c of MATH_CARDS.filter(c => c.tier === 'common')) fishingOf(s).cards[c.id] = 1;
  claimTierSet(s, 'common'); selectTitle(s, 'fish-common');
  const p = plazaProfile(s)!;
  assert.equal(PLAZA_TITLE_CATALOG, 4); assert.equal(titleCatalogOf(4), 4);
  assert.equal(compatibleTitleProfile(p, 4).selectedTitleId, 'fish-common');
  for (const old of [1, 2, 3]) { const q = compatibleTitleProfile(p, old); assert.equal(q.selectedTitleId, null); assert.ok(parsePlazaProfile(q)); }
  assert.ok(parsePlazaProfile(p));
});
