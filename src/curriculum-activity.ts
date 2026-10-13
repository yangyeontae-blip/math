import type { CurriculumQuestion } from './curriculum';

const esc = (value: string | number) => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);

/** 원을 같은 크기의 클릭 가능한 부채꼴로 나누기 위한 CSS polygon을 만듭니다. */
export function pizzaSliceClip(index: number, total: number) {
  const points = ['50% 50%'];
  const steps = Math.max(2, Math.ceil(12 / total));
  for (let step = 0; step <= steps; step++) {
    const angle = (-90 + (index + step / steps) * 360 / total) * Math.PI / 180;
    points.push(`${(50 + Math.cos(angle) * 50).toFixed(3)}% ${(50 + Math.sin(angle) * 50).toFixed(3)}%`);
  }
  return `polygon(${points.join(',')})`;
}

function pizzaActivity(question: CurriculumQuestion) {
  if (question.kind !== 'choice' || question.visual.kind !== 'fraction') return '';
  const { numerator, denominator } = question.visual;
  if (question.answer !== `${numerator}/${denominator}` || !question.prompt.includes('부분으로 똑같이 나누고')) return '';
  const slices = Array.from({ length: denominator }, (_, index) => `<button type="button" data-pizza-slice="${index}" aria-label="피자 ${index + 1}번 조각" aria-pressed="false" style="clip-path:${pizzaSliceClip(index, denominator)}"></button>`).join('');
  return `<section class="math-activity pizza-activity" data-math-activity="pizza" data-denominator="${denominator}">
    <div class="activity-story"><span>🍕</span><div><strong>피자 나누기 체험</strong><small>조각을 직접 눌러 ${numerator}조각을 접시에 담아 보세요.</small></div></div>
    <div class="pizza-workbench"><div class="pizza-board" role="group" aria-label="${denominator}조각 피자">${slices}</div><div class="fraction-counter" aria-live="polite"><b data-pizza-count>0</b><i></i><span>${denominator}</span><small>고른 조각 / 전체 조각</small></div></div>
    <button type="button" class="primary wide activity-submit" data-pizza-submit disabled>만든 분수로 답하기</button>
  </section>`;
}

function circleActivity(question: CurriculumQuestion) {
  if (question.kind !== 'number' || question.visual.kind !== 'circle' || !['given-radius', 'given-diameter'].includes(question.visual.focus)) return '';
  const { focus, radius, unit = 'cm' } = question.visual;
  const known = focus === 'given-radius' ? radius : radius * 2;
  const knownName = focus === 'given-radius' ? '반지름' : '지름';
  const targetName = focus === 'given-radius' ? '지름' : '반지름';
  const max = Math.max(known * 2, Number(question.answer) + 2);
  return `<section class="math-activity circle-activity" data-math-activity="circle" data-circle-max="${max}" data-circle-unit="${esc(unit)}">
    <div class="activity-story"><span>📏</span><div><strong>달빛 원 측정소</strong><small>${knownName} ${known} ${esc(unit)}를 보고 ${targetName} 측정띠를 맞춰 보세요.</small></div></div>
    <div class="circle-workbench"><div class="measure-circle" aria-hidden="true"><i></i><span></span></div><div class="measure-control"><div class="measure-tape"><i data-circle-tape></i></div><output data-circle-value aria-live="polite">0 ${esc(unit)}</output><div><button type="button" data-circle-adjust="-1" aria-label="측정값 1 줄이기">−</button><button type="button" data-circle-adjust="1" aria-label="측정값 1 늘리기">＋</button></div></div></div>
    <button type="button" class="primary wide activity-submit" data-circle-submit disabled>측정값으로 답하기</button>
  </section>`;
}

/** 문제 위에 표시할 직접 조작 활동판. 해당하지 않는 문제에는 빈 문자열을 반환합니다. */
export function curriculumActivityHtml(question: CurriculumQuestion) {
  return pizzaActivity(question) || circleActivity(question);
}
