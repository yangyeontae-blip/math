import type { CurriculumVisual } from './curriculum';

const esc = (value: string | number) => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);

function circleHtml(visual: Extract<CurriculumVisual, { kind: 'circle' }>) {
  const unit = visual.unit ?? 'cm', focus = visual.focus;
  let marks = '', labels = '', caption = '원 그림';
  if (focus === 'radius') marks = '<line x1="100" y1="76" x2="154" y2="76" />';
  else if (focus === 'diameter') marks = '<line x1="46" y1="76" x2="154" y2="76" />';
  else if (focus === 'compass') { marks = '<path d="M78 26 L100 76 L126 27 M100 76 L136 92"/><circle cx="78" cy="26" r="5"/><circle cx="126" cy="27" r="5"/>'; caption = '컴퍼스로 원을 그려요'; }
  else if (focus === 'given-radius') { marks = '<line x1="100" y1="76" x2="154" y2="76" /><line class="dashed" x1="46" y1="76" x2="100" y2="76" />'; labels = `<text class="circle-label" x="127" y="62">${esc(visual.radius)} ${unit}</text><text class="circle-label" x="73" y="62">?</text>`; caption = '알려 준 길이만 적었어요'; }
  else if (focus === 'given-diameter') { marks = '<line x1="46" y1="76" x2="154" y2="76" />'; labels = `<text class="circle-label" x="73" y="62">${esc(visual.radius * 2)} ${unit}</text><text class="circle-label" x="127" y="62">?</text>`; caption = '알려 준 길이만 적었어요'; }
  return `<div class="curriculum-visual circle-visual"><svg viewBox="0 0 200 150" role="img" aria-label="원 그림"><circle class="circle-shape" cx="100" cy="76" r="54"/><g class="circle-line">${marks}</g><circle class="circle-center" cx="100" cy="76" r="6"/>${labels}<text x="100" y="137">${caption}</text></svg></div>`;
}

function barGroup(numerator: number, denominator: number, label?: string) {
  const wholes = Math.max(1, Math.ceil(numerator / denominator));
  const bars = Array.from({ length: wholes }, (_, whole) => `<div class="frac-bar" style="--cells:${denominator}">${Array.from({ length: denominator }, (_, cell) => `<i class="${whole * denominator + cell < numerator ? 'filled' : ''}"></i>`).join('')}</div>`).join('');
  return `<div class="frac-group" aria-label="${denominator}칸 중 ${numerator}칸">${label ? `<em>${esc(label)}</em>` : ''}${bars}</div>`;
}

function fractionHtml(visual: Extract<CurriculumVisual, { kind: 'fraction' }>) {
  const { numerator, denominator, groups, compare } = visual;
  if (groups) {
    const boxes = Array.from({ length: denominator }, (_, id) => `<span class="frac-box${id < numerator ? ' on' : ''}">${'●'.repeat(groups)}</span>`).join('');
    return `<div class="curriculum-visual fraction-visual"><div class="frac-boxes" style="--boxes:${denominator}">${boxes}</div><small>전체를 ${denominator}묶음으로 똑같이 나누었고, 색칠한 묶음은 ${numerator}개예요</small></div>`;
  }
  if (compare) return `<div class="curriculum-visual fraction-visual">${barGroup(numerator, denominator, `${numerator}/${denominator}`)}${barGroup(compare.numerator, compare.denominator, `${compare.numerator}/${compare.denominator}`)}<small>위아래 막대는 전체의 크기가 같아요</small></div>`;
  const wholes = Math.max(1, Math.ceil(numerator / denominator));
  return `<div class="curriculum-visual fraction-visual">${barGroup(numerator, denominator)}<small>막대 하나를 ${denominator}칸으로 똑같이 나누었어요${wholes > 1 ? ` · 막대 ${wholes}개` : ''}</small></div>`;
}

export function curriculumVisualHtml(visual: CurriculumVisual): string {
  if (visual.kind === 'circle') return circleHtml(visual);
  if (visual.kind === 'fraction') return fractionHtml(visual);
  if (visual.kind === 'measure') {
    const icons = visual.measure === 'capacity' ? '🧪' : '📦';
    return `<div class="curriculum-visual measure-visual"><span>${visual.values.map((value, index) => `<b>${icons}<small>${esc(visual.labels?.[index] ?? `${value} ${visual.unit}`)}</small></b>`).join('')}</span><em>${visual.measure === 'capacity' ? '들이' : '무게'}를 같은 단위로 살펴봐요</em></div>`;
  }
  if (visual.kind === 'pictograph') return `<div class="curriculum-visual pictograph-visual"><p><b>${visual.icon}</b> 하나 = ${visual.value}${esc(visual.unitLabel ?? '명')}</p>${visual.rows.map(row => `<div><strong>${esc(row.label)}</strong><span>${visual.icon.repeat(row.icons)}</span></div>`).join('')}</div>`;
  if (visual.kind === 'array') return `<div class="curriculum-visual array-visual" style="--array-columns:${visual.columns}">${Array.from({ length: visual.rows * visual.columns }, () => '<i></i>').join('')}</div>`;
  return `<div class="curriculum-visual groups-visual"><span>${Array.from({ length: Math.min(visual.divisor, 9) }, () => '<b>●●●</b>').join('')}</span><small>${visual.total}개를 ${visual.divisor}씩 묶으면 ${visual.remainder ? `${visual.remainder}개가 남아요` : '남는 것이 없어요'}</small></div>`;
}
