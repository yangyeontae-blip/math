import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newSave, validateSave, Encounter, collectBerry, finishHunt, canEnter, recordWrongAnswer, recordCorrectAnswer } from '../src/rules.ts';
import { stageBerries, stageMonsters } from '../src/stages.ts';

test('300 complete journeys keep saves and repeated rewards safe', () => {
  for (let run = 0; run < 300; run++) {
    let save = newSave(`모험${run}`, run % 4);
    let expectedCorrect = 0;
    for (let stage = 1; stage <= 10; stage++) {
      assert.equal(canEnter(save, stage), true);
      save.journey.stage = stage;
      stageBerries(stage).forEach((_, id) => {
        const first = collectBerry(save, id);
        assert.ok(first > 0);
        assert.equal(collectBerry(save, id), 0);
      });
      stageMonsters(stage).forEach((monster, id) => {
        expectedCorrect++;
        const encounter = new Encounter(monster.type, false, save.level, undefined, stage, save.settings.maxDividend);
        if ((run + stage + id) % 3 === 0) {
          assert.equal(encounter.answer(String(encounter.question.answer + 1)), 'wrong');
          recordWrongAnswer(save, encounter.question);
        }
        assert.equal(encounter.answer(String(encounter.question.answer)), 'correct');
        assert.equal(encounter.answer(String(encounter.question.answer)), 'ignored');
        recordCorrectAnswer(save, monster.type);
        const reward = finishHunt(save, id);
        assert.ok(reward);
        assert.equal(finishHunt(save, id), null);
        assert.ok(save.berries >= 0);
        assert.ok(save.xp >= 0 && save.xp < save.level * 40);
      });
      assert.equal(save.journey.maps[stage].cleared, true);
      save = validateSave(JSON.parse(JSON.stringify(save)));
    }
    assert.equal(save.journey.maps[10].cleared, true);
    assert.equal(save.learning.correct, expectedCorrect);
    assert.ok(save.berries > 0);
  }
});
