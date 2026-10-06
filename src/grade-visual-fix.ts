// 1·2학년 문제의 그림을 문제에 맞게 바로잡아요.
// 여러 생성기가 같은 모양의 그림(점 몇 개 등)을 썼는데, 문제와 상관없거나 숫자가 달라 헷갈리는 경우를 여기서 한꺼번에 고쳐요.
import type { CurriculumQuestion, CurriculumVisual } from './curriculum';

const NONE: CurriculumVisual = { kind: 'none' };
const PEOPLE = new Set(['🧒', '🙂', '👦', '👧', '🧑']);

const OBJECT_EMOJI: Record<string, string> = {
  '선물 상자': '🎁', 주사위: '🎲', '과자 상자': '📦', '지우개 상자': '📦', 벽돌: '🧱', 상자: '📦',
  축구공: '⚽', 야구공: '⚾', 구슬: '🔮', 지구본: '🌐', 수박: '🍉', 공: '🏀',
  '통조림 캔': '🥫', '음료수 캔': '🥤', '두루마리 휴지': '🧻', 북: '🥁', 초: '🕯️', 풀통: '🧴'
};
const ROW_EMOJI: Record<string, string> = { 별: '⭐', 나무: '🌳', 집: '🏠', 연못: '🌊', 꽃: '🌸' };
const COLOR_EMOJI: Record<string, string> = { 빨간색: '🟥', 파란색: '🟦', 노란색: '🟨', 초록색: '🟩', 주황색: '🟧', 보라색: '🟪' };
const WEIGHT_EMOJI: Record<string, string> = { 수박: '🍉', 사과: '🍎', 책가방: '🎒', 공: '🏀' };

// 이 낱말이 있는 문제는 그림이 도움이 되지 않으니 그림 칸을 비워요.
const NO_PICTURE: Record<number, string[]> = {
  1: ['수 규칙', '모양 규칙', '빈칸 수', '동그라미', '세모와 네모'],
  2: ['세 수의 덧셈·뺄셈', '□가 있는 식', '덧셈과 뺄셈의 관계', '네 자리 수', '수 비교', '수 규칙', '무늬 규칙', '늘어나는 규칙', '줄어드는 규칙', '규칙 설명', '기준 정하기', '원', '도형 분류']
};

const objectNamesIn = (text: string) => Object.keys(OBJECT_EMOJI).filter(name => text.includes(name)).sort((a, b) => b.length - a.length)
  .filter((name, index, all) => !all.some((other, i) => i < index && other.includes(name) && text.includes(other)));

export function fixVisual(grade: number, question: CurriculumQuestion): CurriculumQuestion {
  let visual: CurriculumVisual = question.visual;
  const skill = question.skill, prompt = question.prompt, choices = (question.choices ?? []).map(c => c.label);

  // 그림 한 개가 '몇 명'이 아니라 '몇 개'를 나타내는 경우가 대부분이에요.
  if (visual.kind === 'pictograph' && visual.unitLabel === undefined) visual = { ...visual, unitLabel: PEOPLE.has(visual.icon) || /\d명/.test(prompt) ? '명' : '개' };

  if (NO_PICTURE[grade]?.includes(skill)) visual = NONE;

  if (grade === 1) {
    if (['수의 순서', '50까지의 수'].includes(skill) && visual.kind === 'pictograph' && visual.rows.some(row => Number(row.label) > 12)) visual = NONE;
    if (skill === '50까지의 수') visual = NONE;
    if (skill === '수 비교') {
      const numbers = prompt.match(/\d+/g)?.slice(0, 2) ?? [];
      visual = numbers.some(n => Number(n) > 12) ? { kind: 'scene', items: numbers.map(n => ({ icon: n })), caption: '두 수를 비교해 봐요' } : visual;
    }
    if (['상자 모양', '공 모양', '둥근기둥 모양'].includes(skill)) {
      const names = objectNamesIn(`${prompt} ${choices.join(' ')}`.replace(/(상자|공|둥근기둥) 모양/g, ' '));
      visual = names.length ? { kind: 'scene', items: names.map(name => ({ icon: OBJECT_EMOJI[name], label: name })), caption: '물건의 모양을 떠올려 봐요' } : NONE;
    }
    if (skill === '세모와 네모' && /곧은 선은 모두/.test(prompt)) visual = { kind: 'geometry', shape: 'square', label: '네모' };
    if (skill === '무게 비교') {
      const thing = Object.keys(WEIGHT_EMOJI).find(name => prompt.includes(name));
      visual = thing ? { kind: 'scene', items: [{ icon: '⚖️', label: '시소' }, { icon: WEIGHT_EMOJI[thing], label: thing }], caption: prompt.includes('내려') ? '내려간 쪽을 살펴봐요' : '올라간 쪽을 살펴봐요' } : NONE;
    }
    if (['왼쪽과 오른쪽', '몇 번째'].includes(skill)) {
      const list = prompt.match(/(?:한 줄로 놓여 있어요: |왼쪽부터 )([^.]+?)(?:이|가)? 있어요|있어요: ([^.]+)\./);
      const names = (list?.[1] ?? list?.[2] ?? '').split(/,\s*/).map(s => s.replace(/[이가]$/, '').trim()).filter(name => ROW_EMOJI[name]);
      visual = names.length >= 3 ? { kind: 'scene', items: names.map(name => ({ icon: ROW_EMOJI[name], label: name })), caption: '왼쪽 → 오른쪽' } : NONE;
    }
  }

  if (grade === 2) {
    if (['백 알아보기', '천 알아보기'].includes(skill) && /보다 얼마나/.test(prompt)) visual = NONE;
    if (skill === 'cm로 재기') {
      const end = Number(prompt.match(/다른 쪽 끝이 (\d+)/)?.[1]);
      visual = end > 0 ? { kind: 'ruler', end } : NONE;
    }
    if (skill === '입체도형 모양') {
      const names = objectNamesIn(prompt.split(/[은는]/)[0]);
      visual = names.length ? { kind: 'scene', items: names.map(name => ({ icon: OBJECT_EMOJI[name], label: name })), caption: '물건의 모양을 떠올려 봐요' } : NONE;
    }
    if (skill === '쌓기나무 위치와 방향') {
      const colors = (prompt.match(/([가-힣]+색(?:, [가-힣]+색)+) 쌓기나무/)?.[1] ?? '').split(', ');
      const known = colors.filter(color => COLOR_EMOJI[color]);
      visual = known.length >= 3 ? { kind: 'scene', items: known.map(color => ({ icon: COLOR_EMOJI[color], label: color })), caption: '왼쪽 → 오른쪽' } : NONE;
    }
    if (['삼각형', '사각형'].includes(skill)) {
      const asksCount = /(꼭짓점|변|곧은 선)[은는이가]? 모두 몇 개/.test(prompt);
      visual = asksCount ? { kind: 'geometry', shape: skill === '삼각형' ? 'triangle' : 'rectangle', label: skill } : NONE;
    }
  }
  return visual === question.visual ? question : { ...question, visual };
}
