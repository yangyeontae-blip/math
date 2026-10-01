import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newSave, recordCurriculumAttempt } from '../src/rules';
import { buildReport, reportHtml } from '../src/report';
import { speechText } from '../src/speech';

const regions = [{ id: 'addition', name: '덧셈숲', icon: '🍎' }, { id: 'subtraction', name: '뺄셈숲', icon: '🍂' }, { id: 'plane', name: '평면도형', icon: '△' }] as const;

test('report summarizes strong and weak units from the save', () => {
  const s = newSave('리포트', 0); s.learning.elapsedSeconds = 125;
  for (let i = 0; i < 9; i++) recordCurriculumAttempt(s, 'addition', true);
  recordCurriculumAttempt(s, 'addition', false, 0, '받아올림');
  for (let i = 0; i < 2; i++) recordCurriculumAttempt(s, 'subtraction', true);
  for (let i = 0; i < 3; i++) recordCurriculumAttempt(s, 'subtraction', false, 2, '받아내림');
  const report = buildReport(s, regions, new Date(2026, 9, 2));
  assert.equal(report.playMinutes, 2); assert.equal(report.dateLabel, '2026년 10월 2일');
  assert.equal(report.totalCorrect, 11); assert.equal(report.totalWrong, 4); assert.equal(report.overallRate, 73);
  assert.deepEqual(report.strong.map(u => u.id), ['addition']); assert.deepEqual(report.needsWork.map(u => u.id), ['subtraction']);
  assert.deepEqual(report.practiceSkills.map(i => i.skill).sort(), ['받아내림', '받아올림']);
  assert.equal(report.units.find(u => u.id === 'plane')!.rate, null);
});

test('report html escapes names and never shows undefined', () => {
  const s = newSave('<b>별</b>', 0); const html = reportHtml(buildReport(s, regions));
  assert.ok(!html.includes('<b>별</b>')); assert.ok(html.includes('&lt;b&gt;별&lt;/b&gt;')); assert.ok(!/undefined|NaN/.test(html)); assert.ok(html.includes('기록 없음'));
});

test('speech text turns math symbols into spoken Korean', () => {
  assert.equal(speechText('36 ÷ 4 = □'), '36 나누기 4 는 얼마');
  assert.equal(speechText('7 × 8'), '7 곱하기 8');
  assert.equal(speechText('3/4 만큼 색칠해요'), '4분의 3 만큼 색칠해요');
  assert.equal(speechText('무엇일까요?'), '무엇일까요?');
});
