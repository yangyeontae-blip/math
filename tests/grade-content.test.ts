import test from 'node:test';
import assert from 'node:assert/strict';
import { answerCurriculumQuestion } from '../src/curriculum';
import { generateGradeQuestion, gradeMissions, gradeRegions } from '../src/grade-content';
import { newUnitsForGrade, newSave, validateSave, type SchoolGrade } from '../src/rules';

const grades = [1, 2, 4, 5, 6] as const;

test('every added grade has two semesters and ten missions in every activity region', () => {
  for (const grade of grades) {
    const regions = gradeRegions(grade)!;
    assert.ok(regions.first.length > 0 && regions.second.length > 0);
    for (const unit of newUnitsForGrade(grade)) assert.equal(gradeMissions(grade, unit)!.length, 10);
  }
});

test('grade question generators always include an answer that can be submitted', () => {
  for (const grade of grades) for (const unit of newUnitsForGrade(grade)) for (let mission = 0; mission < 10; mission++) {
    for (let sample = 0; sample < 20; sample++) {
      const question = generateGradeQuestion(grade, unit, mission);
      assert.equal(answerCurriculumQuestion(question, question.answer), true, `${grade}-${unit}-${mission}`);
      if (question.kind === 'choice') assert.ok(question.choices?.some(choice => choice.value === question.answer));
      else assert.match(question.answer, /^\d{1,4}$/);
    }
  }
});

test('2022 curriculum topics and questions are genuinely grade-specific', () => {
  const expected = new Map<SchoolGrade, string[]>([
    [1, ['9와 50 수마을', '시계와 규칙길', '모양과 위치섬']],
    [2, ['수와 식 마을', '길이 재기마을', '표와 그래프 관측소']],
    [4, ['큰 수 별마을', '각도 재기길', '삼각형길', '소수 덧셈뺄셈마을']],
    [5, ['약수와 배수마을', '합동과 대칭정원', '평균과 가능성관측소']],
    [6, ['분수 나눗셈마을', '비와 비율마을', '원의 넓이정원']],
  ]);
  for (const [grade, names] of expected) {
    const regions = gradeRegions(grade)!;
    const visibleNames = [...regions.first, ...regions.second].map(region => region.name);
    for (const name of names) assert.ok(visibleNames.includes(name), `${grade}학년: ${name}`);
  }
  for (let mission = 0; mission < 10; mission++) {
    assert.doesNotMatch(generateGradeQuestion(1, 'fraction', mission, () => .42).prompt, /분수|분모|분자/);
    assert.doesNotMatch(generateGradeQuestion(2, 'fraction', mission, () => .42).prompt, /분수|분모|분자/);
  }
  assert.match(generateGradeQuestion(4, 'fractionDecimal', 0, () => .42).prompt, /밀/);
  assert.match(generateGradeQuestion(5, 'measurement', 1, () => .42).prompt, /평행사변형/);
  assert.match(generateGradeQuestion(6, 'circle', 3, () => .42).prompt, /원의 넓이/);
});

test('grade is saved and old version-12 saves continue as grade 3', () => {
  for (const grade of [1,2,3,4,5,6] as SchoolGrade[]) assert.equal(validateSave(newSave('숲이', 0, grade)).grade, grade);
  const old = newSave('옛숲', 0, 3) as unknown as Record<string, unknown>;
  delete old.grade;
  assert.equal(validateSave(old).grade, 3);
});
