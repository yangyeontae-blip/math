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
    const columns = denominator <= 6 ? denominator : Math.ceil(denominator / 2);
    return `<div class="curriculum-visual fraction-visual"><div class="frac-boxes" style="--boxes:${columns}">${boxes}</div><small>전체를 ${denominator}묶음으로 똑같이 나누었고, 색칠한 묶음은 ${numerator}개예요</small></div>`;
  }
  if (compare) return `<div class="curriculum-visual fraction-visual">${barGroup(numerator, denominator, `${numerator}/${denominator}`)}${barGroup(compare.numerator, compare.denominator, `${compare.numerator}/${compare.denominator}`)}<small>위아래 막대는 전체의 크기가 같아요</small></div>`;
  const wholes = Math.max(1, Math.ceil(numerator / denominator));
  return `<div class="curriculum-visual fraction-visual">${barGroup(numerator, denominator)}<small>막대 하나를 ${denominator}칸으로 똑같이 나누었어요${wholes > 1 ? ` · 막대 ${wholes}개` : ''}</small></div>`;
}

function geometryHtml(visual: Extract<CurriculumVisual, { kind: 'geometry' }>) {
  const common = 'stroke="#507a68" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="#dff1d5"';
  const arrows = '<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#507a68"/></marker></defs>';
  const drawings: Record<typeof visual.shape, string> = {
    segment: '<line x1="48" y1="74" x2="152" y2="74"/><circle cx="48" cy="74" r="7"/><circle cx="152" cy="74" r="7"/>',
    line: '<line x1="32" y1="74" x2="168" y2="74" marker-start="url(#arrow)" marker-end="url(#arrow)"/>',
    ray: '<circle cx="48" cy="74" r="7"/><line x1="48" y1="74" x2="168" y2="74" marker-end="url(#arrow)"/>',
    angle: '<path d="M48 112 L100 58 L160 112" fill="none"/><circle cx="100" cy="58" r="6"/>',
    'right-angle': '<path d="M55 112 L55 48 L150 48" fill="none"/><path d="M55 72 L79 72 L79 48" fill="none" stroke="#e9827b"/>',
    'right-triangle': '<path d="M48 112 L48 42 L160 112 Z"/><path d="M48 88 L72 88 L72 112" fill="none" stroke="#e9827b"/>',
    rectangle: '<rect x="42" y="38" width="116" height="76" rx="3"/><path d="M42 62 L66 62 L66 38" fill="none" stroke="#e9827b"/>',
    square: '<rect x="60" y="34" width="88" height="88" rx="3"/><path d="M60 58 L84 58 L84 34" fill="none" stroke="#e9827b"/>',
  };
  return `<div class="curriculum-visual geometry-visual"><svg viewBox="0 0 200 150" role="img" aria-label="${esc(visual.label ?? '평면도형 그림')}">${arrows}<g ${common}>${drawings[visual.shape]}</g><text x="100" y="142">${esc(visual.label ?? '도형의 성질을 살펴봐요')}</text></svg></div>`;
}

function lengthTimeHtml(visual: Extract<CurriculumVisual, { kind: 'length-time' }>) {
  const icon = visual.measure === 'length' ? '📏' : '🕰️';
  return `<div class="curriculum-visual length-time-visual"><div class="length-time-items">${visual.values.map((value, index) => `<b><span>${icon}</span><small>${esc(visual.labels?.[index] ?? `${value} ${visual.unit}`)}</small></b>`).join('')}</div><em>${visual.measure === 'length' ? '길이 단위를 맞추어 살펴봐요' : '시간 단위를 맞추어 살펴봐요'}</em></div>`;
}

function decimalHtml(visual: Extract<CurriculumVisual, { kind: 'decimal' }>) {
  const bar = (tenths: number, label: string) => `<div><strong>${label}</strong><span>${Array.from({ length: 10 }, (_, id) => `<i class="${id < tenths ? 'on' : ''}"></i>`).join('')}</span></div>`;
  return `<div class="curriculum-visual decimal-visual">${bar(visual.tenths, `0.${visual.tenths}`)}${visual.compare === undefined ? '' : bar(visual.compare, `0.${visual.compare}`)}<small>전체를 10칸으로 똑같이 나누어 살펴봐요</small></div>`;
}

export function curriculumVisualHtml(visual: CurriculumVisual): string {
  if (visual.kind === 'circle') return circleHtml(visual);
  if (visual.kind === 'geometry') return geometryHtml(visual);
  if (visual.kind === 'length-time') return lengthTimeHtml(visual);
  if (visual.kind === 'decimal') return decimalHtml(visual);
  if (visual.kind === 'fraction') return fractionHtml(visual);
  if (visual.kind === 'measure') {
    const icons = visual.measure === 'capacity' ? '🧪' : '📦';
    return `<div class="curriculum-visual measure-visual"><span>${visual.values.map((value, index) => `<b>${icons}<small>${esc(visual.labels?.[index] ?? `${value} ${visual.unit}`)}</small></b>`).join('')}</span><em>${visual.measure === 'capacity' ? '들이' : '무게'}를 같은 단위로 살펴봐요</em></div>`;
  }
  if (visual.kind === 'pictograph') return `<div class="curriculum-visual pictograph-visual"><p><b>${visual.icon}</b> 하나 = ${visual.value}${esc(visual.unitLabel ?? '명')}</p>${visual.rows.map(row => `<div><strong>${esc(row.label)}</strong><span>${visual.icon.repeat(row.icons)}</span></div>`).join('')}</div>`;
  if (visual.kind === 'array') return `<div class="curriculum-visual array-visual" style="--array-columns:${visual.columns}">${Array.from({ length: visual.rows * visual.columns }, () => '<i></i>').join('')}</div>`;
  return `<div class="curriculum-visual groups-visual"><span>${Array.from({ length: Math.min(visual.divisor, 9) }, () => '<b>●●●</b>').join('')}</span><small>${visual.total}개를 ${visual.divisor}씩 묶으면 ${visual.remainder ? `${visual.remainder}개가 남아요` : '남는 것이 없어요'}</small></div>`;
}
