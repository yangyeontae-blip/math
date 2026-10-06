import test from 'node:test';
import assert from 'node:assert/strict';
import { answerCurriculumQuestion } from '../src/curriculum';
import { generateGradeQuestion, gradeMissions, gradeRegions } from '../src/grade-content';
import { NEW_CURRICULUM_UNITS, newSave, validateSave, type SchoolGrade } from '../src/rules';

const grades = [1, 2, 4, 5, 6] as const;

test('every added grade has two semesters and ten missions in every activity region', () => {
  for (const grade of grades) {
    const regions = gradeRegions(grade)!;
    assert.ok(regions.first.length > 0 && regions.second.length > 0);
    for (const unit of NEW_CURRICULUM_UNITS) assert.equal(gradeMissions(grade, unit)!.length, 10);
  }
});

test('grade question generators always include an answer that can be submitted', () => {
  for (const grade of grades) for (const unit of NEW_CURRICULUM_UNITS) for (let mission = 0; mission < 10; mission++) {
    for (let sample = 0; sample < 20; sample++) {
      const question = generateGradeQuestion(grade, unit, mission);
      assert.equal(answerCurriculumQuestion(question, question.answer), true, `${grade}-${unit}-${mission}`);
      if (question.kind === 'choice') assert.ok(question.choices?.some(choice => choice.value === question.answer));
      else assert.match(question.answer, /^\d{1,4}$/);
    }
  }
});

test('grade is saved and old version-12 saves continue as grade 3', () => {
  for (const grade of [1,2,3,4,5,6] as SchoolGrade[]) assert.equal(validateSave(newSave('숲이', 0, grade)).grade, grade);
  const old = newSave('옛숲', 0, 3) as unknown as Record<string, unknown>;
  delete old.grade;
  assert.equal(validateSave(old).grade, 3);
});
