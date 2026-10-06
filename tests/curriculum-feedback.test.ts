import assert from 'node:assert/strict';
import test from 'node:test';
import { curriculumWrongFeedback, type CurriculumQuestion } from '../src/curriculum';

const fractionQuestion: CurriculumQuestion = {
  unit: 'fraction', skill: '분수 읽기', prompt: '분수로 나타내요.', kind: 'choice', answer: '2/5',
  choices: [{ label: '5/2', value: '5/2' }, { label: '2/5', value: '2/5' }],
  visual: { kind: 'fraction', numerator: 2, denominator: 5 },
  hints: ['전체 칸 수가 분모예요.', '색칠한 칸 수가 분자예요.', '2/5예요.'], explanation: '전체 5칸 중 2칸이에요.',
};

test('분자와 분모를 바꾼 선택을 구체적으로 짚어 준다', () => {
  const feedback = curriculumWrongFeedback(fractionQuestion, '5/2');
  assert.match(feedback, /분자와 분모/);
  assert.match(feedback, /전체 조각 수/);
});

test('숫자 오답은 답과의 크기 및 문제 그림에 맞는 확인 방법을 알려 준다', () => {
  const question: CurriculumQuestion = {
    unit: 'measurement', skill: '들이 단위 관계', prompt: '2 L는 몇 mL일까요?', kind: 'number', answer: '2000',
    visual: { kind: 'measure', measure: 'capacity', values: [2], unit: 'L' },
    hints: ['1 L는 1,000 mL예요.', '2 L를 mL로 바꿔요.', '2,000 mL예요.'], explanation: '2 L는 2,000 mL예요.',
  };
  const feedback = curriculumWrongFeedback(question, '200');
  assert.match(feedback, /답보다 작아요/);
  assert.match(feedback, /단위를 같게/);
});

