import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newSave, questionPool, validateSave } from '../src/rules.ts';
import { stageMonsters } from '../src/stages.ts';
import { EXPEDITION_STAR_SPOTS, EXPEDITION_TITLES, expeditionLayout, expeditionUnlocked, startExpedition, collectExpeditionStar, defeatExpeditionMonster, canFinishExpedition, finishExpedition, selectExpeditionTitle } from '../src/expedition.ts';

function finishedStory() {
  const s = newSave('별빛', 0);
  for (let stage = 1; stage <= 10; stage++) {
    s.journey.maps[stage].monsters = stageMonsters(stage).map((_, id) => id);
    s.journey.maps[stage].cleared = true;
  }
  return s;
}

test('the repeatable expedition unlocks only after all ten stages or in teacher mode', () => {
  const s = newSave('봄', 0);
  assert.equal(expeditionUnlocked(s), false);
  assert.equal(startExpedition(s), false);
  s.teacherMode = true;
  assert.equal(expeditionUnlocked(s), true);
  assert.equal(startExpedition(s), true);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))), s);
  assert.equal(expeditionUnlocked(finishedStory()), true);
});

test('each expedition has three distinct safe markers and two distinct monsters', () => {
  for (let completed = 0; completed < 40; completed++) {
    const layout = expeditionLayout(completed);
    assert.equal(layout.stage, completed % 10 + 1);
    assert.equal(new Set(layout.stars).size, 3);
    assert.equal(new Set(layout.monsters).size, 2);
    for (const id of layout.stars) assert.ok(EXPEDITION_STAR_SPOTS[id]);
    for (const id of layout.monsters) assert.ok(stageMonsters(layout.stage)[id]);
  }
  assert.notDeepEqual(expeditionLayout(0).stars, expeditionLayout(1).stars);
});

test('gate questions follow the current stage and teacher range', () => {
  for (let completed = 0; completed < 10; completed++) {
    const s = finishedStory(); s.expedition.completed = completed;
    if (completed >= 5) s.settings.maxDividend = 90;
    startExpedition(s);
    const q = s.expedition.active!.gateQuestion;
    assert.ok(questionPool(s.level, s.expedition.active!.stage, s.settings.maxDividend).some(candidate => candidate.dividend === q.dividend && candidate.divisor === q.divisor));
    if (completed < 4 || s.settings.maxDividend === 90) assert.ok(q.dividend < 100);
    assert.equal(s.expedition.active!.storyKind, completed % 2);
  }
});

test('wrong or duplicate objectives never give berries, XP or a second completion', () => {
  const s = finishedStory(); s.berries = 321; s.xp = 17;
  assert.equal(startExpedition(s), true);
  const active = s.expedition.active!, layout = expeditionLayout(0);
  assert.ok(questionPool(s.level, active.stage, s.settings.maxDividend).some(q => q.dividend === active.gateQuestion.dividend && q.divisor === active.gateQuestion.divisor));
  assert.equal(finishExpedition(s, active.gateQuestion.answer), null);
  assert.equal(collectExpeditionStar(s, 99), false);
  for (const id of layout.stars) { assert.equal(collectExpeditionStar(s, id), true); assert.equal(collectExpeditionStar(s, id), false); }
  for (const id of layout.monsters) { assert.equal(defeatExpeditionMonster(s, id), true); assert.equal(defeatExpeditionMonster(s, id), false); }
  assert.equal(canFinishExpedition(s), true);
  assert.equal(finishExpedition(s, active.gateQuestion.answer + 1), null);
  assert.deepEqual(finishExpedition(s, active.gateQuestion.answer), { completed: 1, newTitle: 1 });
  assert.equal(finishExpedition(s, active.gateQuestion.answer), null);
  assert.equal(s.berries, 321); assert.equal(s.xp, 17); assert.equal(s.expedition.completed, 1);
  assert.equal(selectExpeditionTitle(s, 1), true);
  assert.equal(selectExpeditionTitle(s, 2), false);
  assert.equal(EXPEDITION_TITLES[s.expedition.selectedTitle].name, '첫 발자국');
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))), s);
});

test('an active expedition and old version 6 saves survive loading', () => {
  const s = finishedStory(); s.berries = 890; startExpedition(s);
  const marker = expeditionLayout(0).stars[0]; collectExpeditionStar(s, marker);
  const restored = validateSave(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(restored.expedition.active, s.expedition.active);
  assert.equal(restored.journey.maps[1].cleared, true);
  const old = { ...finishedStory(), version: 6 } as Record<string, unknown>;
  delete old.expedition;
  const migrated = validateSave(old);
  assert.equal(migrated.version, 7);
  assert.deepEqual(migrated.expedition, { completed: 0, selectedTitle: 0, active: null });
  assert.equal(migrated.journey.maps[10].cleared, true);
  const broken = structuredClone(s);
  broken.expedition.active!.stars.push(999);
  assert.throws(() => validateSave(broken));
});

test('titles at 3, 10 and 30 completions unlock exactly once', () => {
  for (const milestone of [3, 10, 30]) {
    const s = finishedStory(); s.expedition.completed = milestone - 1;
    assert.equal(startExpedition(s), true);
    const layout = expeditionLayout(s.expedition.completed), answer = s.expedition.active!.gateQuestion.answer;
    layout.stars.forEach(id => collectExpeditionStar(s, id));
    layout.monsters.forEach(id => defeatExpeditionMonster(s, id));
    const result = finishExpedition(s, answer);
    assert.equal(result?.completed, milestone);
    assert.equal(EXPEDITION_TITLES[result!.newTitle].need, milestone);
    assert.equal(finishExpedition(s, answer), null);
  }
});
