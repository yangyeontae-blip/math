// 문제 제목(skill)이 정답을 그대로 알려 주는 경우를 막아요.
// 예: 제목이 "수직"인데 보기에서 "수직"을 고르는 문제. 이때는 제목과 첫 힌트의 낱말을 가려요.
import type { CurriculumQuestion } from './curriculum';

export const NEUTRAL_TITLE = '문제를 풀어 봐요';
const squash = (text: string) => text.replace(/\s/g, '');

export function titleLeaksAnswer(question: Pick<CurriculumQuestion, 'kind' | 'skill' | 'answer'>): boolean {
  if (question.kind !== 'choice') return false;
  const answer = squash(question.answer), skill = squash(question.skill);
  return answer.length >= 2 && skill.length >= 2 && (answer.includes(skill) || skill.includes(answer));
}

export function guardLeak(question: CurriculumQuestion): CurriculumQuestion {
  if (!titleLeaksAnswer(question)) return question;
  return { ...question, hints: question.hints.map(hint => hint.split(question.skill).join('이 문제')) as CurriculumQuestion['hints'] };
}
