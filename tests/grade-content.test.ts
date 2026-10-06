import test from 'node:test';
import assert from 'node:assert/strict';
import { answerCurriculumQuestion } from '../src/curriculum';
import { GRADE_CURRICULUM_UNITS, generateGradeQuestion, gradeMissions, gradeRegions } from '../src/grade-content';
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
      else assert.match(question.answer, /^\d{1,6}(?:\.\d+)?$/);
    }
  }
});

test('2022 curriculum topics and questions are genuinely grade-specific', () => {
  const expected = new Map<SchoolGrade, string[]>([
    [1, ['9와 50 수마을', '시계와 규칙길', '모양과 위치섬']],
    [2, ['천과 만 수마을', '길이 재기마을', '표와 그래프 관측소']],
    [4, ['큰 수 별마을', '각도와 삼각형길', '소수와 어림마을']],
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
  assert.match(Array.from({length: 10}, (_, mission) => generateGradeQuestion(4, 'measurement', mission, () => .42).prompt).join(' '), /소수.*반올림/);
  assert.match(Array.from({length: 10}, (_, mission) => generateGradeQuestion(5, 'measurement', mission, () => .42).prompt).join(' '), /반올림.*둘레.*평행사변형.*직육면체.*전개도/);
  assert.match(Array.from({length: 10}, (_, mission) => generateGradeQuestion(6, 'circle', mission, () => .42).prompt).join(' '), /원주.*원주율.*지름.*원의 넓이/);
});

test('the audit matrix covers every 2022 revised curriculum semester unit', () => {
  const expectedCounts: Record<SchoolGrade, [number, number]> = {
    1: [5, 4], 2: [6, 6], 3: [6, 6], 4: [6, 6], 5: [6, 6], 6: [6, 6],
  };
  const required: Record<SchoolGrade, string[]> = {
    1: ['수', '모양', '덧셈과 뺄셈', '비교', '시계', '규칙'],
    2: ['세 자리 수', '네 자리 수', '도형', '길이', '분류', '곱셈', '시간', '표와 그래프'],
    3: ['덧셈과 뺄셈', '평면도형', '나눗셈', '곱셈', '길이와 시간', '분수와 소수', '원', '들이와 무게', '자료'],
    4: ['큰 수', '각도와 삼각형', '분수의 덧셈과 뺄셈', '혼합 계산', '막대그래프', '소수의 덧셈과 뺄셈', '수직과 평행', '다각형', '어림', '꺾은선그래프', '규칙과 대응'],
    5: ['혼합 계산', '약수와 배수', '규칙과 대응', '약분과 통분', '분수의 덧셈과 뺄셈', '둘레와 넓이', '수의 범위', '분수의 곱셈', '합동과 대칭', '소수의 곱셈', '직육면체', '평균과 가능성'],
    6: ['분수의 나눗셈', '각기둥과 각뿔', '소수의 나눗셈', '비와 비율', '여러 가지 그래프', '겉넓이와 부피', '공간과 입체', '비례식과 비례배분', '원의 넓이', '원기둥·원뿔·구'],
  };
  for (const grade of [1,2,3,4,5,6] as SchoolGrade[]) {
    const units = GRADE_CURRICULUM_UNITS[grade];
    assert.deepEqual([units.first.length, units.second.length], expectedCounts[grade]);
    const all = [...units.first, ...units.second].join(' ');
    for (const keyword of required[grade]) assert.match(all, new RegExp(keyword), `${grade}학년: ${keyword}`);
  }
});

test('every added activity region generates varied curriculum-aligned missions', () => {
  for (const grade of grades) for (const unit of NEW_CURRICULUM_UNITS) {
    const prompts = Array.from({length: 5}, (_, mission) => generateGradeQuestion(grade, unit, mission, () => .42).prompt);
    assert.ok(new Set(prompts).size >= 3, `${grade}학년 ${unit}: ${prompts.join(' / ')}`);
  }
});

test('grade is saved and old version-12 saves continue as grade 3', () => {
  for (const grade of [1,2,3,4,5,6] as SchoolGrade[]) assert.equal(validateSave(newSave('숲이', 0, grade)).grade, grade);
  const old = newSave('옛숲', 0, 3) as unknown as Record<string, unknown>;
  delete old.grade;
  assert.equal(validateSave(old).grade, 3);
});
