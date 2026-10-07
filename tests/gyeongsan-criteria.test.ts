import test from 'node:test';
import assert from 'node:assert/strict';
import { gradeTopics } from '../src/grade-content.ts';
import { GYEONGSAN_MATH_CRITERIA } from '../src/gyeongsan-criteria.ts';
import { newUnitsForGrade, type NewCurriculumUnitId, type SchoolGrade } from '../src/rules.ts';

test('경산초 1·2·4·5·6학년 평가 초점은 실제 문제 주제로 연결된다', () => {
  for (const grade of [1, 2, 4, 5, 6] as SchoolGrade[]) {
    const skills = new Set(newUnitsForGrade(grade).flatMap(unit => gradeTopics(grade as Exclude<SchoolGrade, 3>, unit as NewCurriculumUnitId)));
    for (const criterion of GYEONGSAN_MATH_CRITERIA[grade]) for (const skill of criterion.gameSkills) {
      if (!skill.includes(':')) assert.ok(skills.has(skill), `${grade}학년 ${criterion.unit}: ${skill}`);
    }
  }
});

test('경산초 자료의 모든 학년·평가단원·성취기준을 기록한다', () => {
  assert.deepEqual(Object.keys(GYEONGSAN_MATH_CRITERIA), ['1', '2', '3', '4', '5', '6']);
  for (const [grade, criteria] of Object.entries(GYEONGSAN_MATH_CRITERIA)) {
    assert.ok(criteria.length >= 2, `${grade}학년 평가단원 누락`);
    for (const criterion of criteria) {
      assert.ok(criterion.unit && criterion.assessment && criterion.gameSkills.length);
      criterion.standards.forEach(code => assert.match(code, /^\d수\d{2}-\d{2}$/));
    }
  }
});
