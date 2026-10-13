import test from 'node:test';
import assert from 'node:assert/strict';
import { answerCurriculumQuestion } from '../src/curriculum';
import { generateGradeQuestion } from '../src/grade-content';
import { completeCurriculumMission, curriculumUnitsForGrade, Encounter, NEW_CURRICULUM_UNITS, newSave, questionAnswerText, recordCorrectAnswer, validateSave, type NewCurriculumUnitId, type Operation, type SchoolGrade } from '../src/rules';

test('50 grade-select playthroughs answer generated work and keep valid saves', () => {
  for (let run = 0; run < 50; run++) {
    const grade = (run % 6 + 1) as SchoolGrade;
    let save = newSave(`학년${run}`, run % 4, grade);
    for (const unit of curriculumUnitsForGrade(grade)) {
      if (NEW_CURRICULUM_UNITS.includes(unit as NewCurriculumUnitId)) {
        if (grade === 3) continue; // The original grade-3 bank has its own exhaustive playthrough suite.
        for (let mission = 0; mission < 10; mission++) {
          const question = generateGradeQuestion(grade as Exclude<SchoolGrade, 3>, unit as NewCurriculumUnitId, mission);
          assert.equal(answerCurriculumQuestion(question, question.answer), true);
          completeCurriculumMission(save, unit as NewCurriculumUnitId, mission, 3);
        }
      } else {
        for (let stage = 1; stage <= 10; stage++) {
          const encounter = new Encounter(stage % 9, false, 1, undefined, stage, 0, unit as Operation, 'stage', undefined, grade);
          assert.equal(encounter.answer(questionAnswerText(encounter.question)), 'correct');
          recordCorrectAnswer(save, stage % 9);
        }
      }
    }
    save = validateSave(JSON.parse(JSON.stringify(save)));
    assert.equal(save.grade, grade);
  }
});
