import type { CurriculumVisual } from './curriculum';
import { mathTextHtml } from './math-format';

const esc = (value: string | number) => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);

function circleHtml(visual: Extract<CurriculumVisual, { kind: 'circle' }>) {
  const unit = visual.unit ?? 'cm', focus = visual.focus;
  let marks = '', dimensions = '', labels = '', caption = '원 그림';
  if (focus === 'radius') marks = '<line x1="100" y1="76" x2="154" y2="76" />';
  else if (focus === 'diameter') marks = '<line x1="46" y1="76" x2="154" y2="76" />';
  else if (focus === 'compass') { marks = '<path d="M78 26 L100 76 L126 27 M100 76 L136 92"/><circle cx="78" cy="26" r="5"/><circle cx="126" cy="27" r="5"/>'; caption = '컴퍼스로 원을 그려요'; }
  else if (focus === 'given-radius') {
    marks = '<line class="dashed" x1="46" y1="76" x2="100" y2="76" /><line x1="100" y1="76" x2="154" y2="76" />';
    dimensions = '<path d="M46 103 V111 M46 107 H154 M154 103 V111" />';
    labels = `<text class="circle-known-label" x="127" y="61">반지름 ${esc(visual.radius)} ${unit}</text><text class="circle-question-label" x="100" y="123">지름 ?</text>`;
    caption = '반지름은 중심에서 원 둘레까지예요';
  }
  else if (focus === 'given-diameter') {
    marks = '<line x1="46" y1="76" x2="154" y2="76" />';
    dimensions = '<path d="M100 101 V109 M100 105 H154 M154 101 V109" />';
    labels = `<text class="circle-known-label" x="100" y="52">지름 ${esc(visual.radius * 2)} ${unit}</text><text class="circle-question-label" x="127" y="122">반지름 ?</text>`;
    caption = '지름은 중심을 지나 원 끝에서 끝까지예요';
  }
  return `<div class="curriculum-visual circle-visual"><svg viewBox="0 0 200 150" role="img" aria-label="원 그림"><circle class="circle-shape" cx="100" cy="76" r="54"/><g class="circle-line">${marks}</g><g class="circle-dimension">${dimensions}</g><circle class="circle-center" cx="100" cy="76" r="6"/>${labels}<text class="circle-caption" x="100" y="143">${caption}</text></svg></div>`;
}

function barGroup(numerator: number, denominator: number, label?: string) {
  const wholes = Math.max(1, Math.ceil(numerator / denominator));
  const bars = Array.from({ length: wholes }, (_, whole) => `<div class="frac-bar" style="--cells:${denominator}">${Array.from({ length: denominator }, (_, cell) => `<i class="${whole * denominator + cell < numerator ? 'filled' : ''}"></i>`).join('')}</div>`).join('');
  return `<div class="frac-group" aria-label="${denominator}칸 중 ${numerator}칸">${label ? `<em>${mathTextHtml(label)}</em>` : ''}${bars}</div>`;
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
  // 화살촉은 표식(marker) 대신 직접 그려요. 표식은 왼쪽 끝에서도 오른쪽을 가리켜서 직선이 반직선처럼 보였어요.
  const head = (tip: number, dir: 1 | -1) => `<path d="M${tip} 74 L${tip - dir * 16} 63 L${tip - dir * 16} 85 Z" fill="#507a68" stroke-width="3"/>`;
  const drawings: Record<typeof visual.shape, string> = {
    segment: '<line x1="48" y1="74" x2="152" y2="74"/><circle cx="48" cy="74" r="7"/><circle cx="152" cy="74" r="7"/>',
    line: `<line x1="36" y1="74" x2="164" y2="74"/>${head(22, -1)}${head(178, 1)}`,
    ray: `<circle cx="48" cy="74" r="7"/><line x1="48" y1="74" x2="164" y2="74"/>${head(178, 1)}`,
    angle: '<path d="M48 112 L100 58 L160 112" fill="none"/><circle cx="100" cy="58" r="6"/>',
    'right-angle': '<path d="M55 112 L55 48 L150 48" fill="none"/><path d="M55 72 L79 72 L79 48" fill="none" stroke="#e9827b"/>',
    'right-triangle': '<path d="M48 112 L48 42 L160 112 Z"/><path d="M48 88 L72 88 L72 112" fill="none" stroke="#e9827b"/>',
    rectangle: '<rect x="42" y="38" width="116" height="76" rx="3"/><path d="M42 62 L66 62 L66 38" fill="none" stroke="#e9827b"/>',
    square: '<rect x="60" y="34" width="88" height="88" rx="3"/><path d="M60 58 L84 58 L84 34" fill="none" stroke="#e9827b"/>',
    circle: '<circle cx="100" cy="78" r="46"/>',
    triangle: '<path d="M100 30 L152 120 L48 120 Z"/>',
  };
  return `<div class="curriculum-visual geometry-visual"><svg viewBox="0 0 200 150" role="img" aria-label="${esc(visual.label ?? '평면도형 그림')}"><g ${common}>${drawings[visual.shape]}</g><text x="100" y="142">${esc(visual.label ?? '도형의 성질을 살펴봐요')}</text></svg></div>`;
}

function clockHtml(h: number, m: number, s?: number) {
  const hand = (deg: number, len: number, width: number, color: string) => `<line x1="80" y1="80" x2="${(80 + len * Math.sin(deg * Math.PI / 180)).toFixed(1)}" y2="${(80 - len * Math.cos(deg * Math.PI / 180)).toFixed(1)}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
  const numbers = Array.from({ length: 12 }, (_, i) => { const n = i + 1, a = n * 30 * Math.PI / 180; return `<text x="${(80 + 60 * Math.sin(a)).toFixed(1)}" y="${(86 - 60 * Math.cos(a)).toFixed(1)}" text-anchor="middle" font-size="15" font-weight="700" fill="#5a4a3a">${n}</text>`; }).join('');
  const ticks = Array.from({ length: 60 }, (_, i) => { const a = i * 6 * Math.PI / 180, r1 = i % 5 === 0 ? 72 : 75; return `<line x1="${(80 + r1 * Math.sin(a)).toFixed(1)}" y1="${(80 - r1 * Math.cos(a)).toFixed(1)}" x2="${(80 + 77 * Math.sin(a)).toFixed(1)}" y2="${(80 - 77 * Math.cos(a)).toFixed(1)}" stroke="#c9b58a" stroke-width="1"/>`; }).join('');
  return `<div class="curriculum-visual clock-visual"><svg viewBox="0 0 160 160" role="img" aria-label="시계 그림"><circle cx="80" cy="80" r="78" fill="#fffaee" stroke="#d9ad7c" stroke-width="4"/>${ticks}${numbers}${hand((h % 12) * 30 + m * 0.5, 38, 5, '#5a4a3a')}${hand(m * 6, 56, 3.5, '#3b8a57')}${s === undefined ? '' : hand(s * 6, 62, 1.6, '#e07a5f')}<circle cx="80" cy="80" r="4" fill="#5a4a3a"/></svg><em>시계의 바늘을 잘 살펴봐요</em></div>`;
}

function lengthTimeHtml(visual: Extract<CurriculumVisual, { kind: 'length-time' }>) {
  if (visual.clock && visual.measure === 'time') return clockHtml(visual.values[0], visual.values[1] ?? 0, visual.values[2]);
  const icon = visual.measure === 'length' ? '📏' : '🕰️';
  return `<div class="curriculum-visual length-time-visual"><div class="length-time-items">${visual.values.map((value, index) => `<b><span>${icon}</span><small>${esc(visual.labels?.[index] ?? `${value} ${visual.unit}`)}</small></b>`).join('')}</div><em>${visual.measure === 'length' ? '길이 단위를 맞추어 살펴봐요' : '시간 단위를 맞추어 살펴봐요'}</em></div>`;
}

function decimalHtml(visual: Extract<CurriculumVisual, { kind: 'decimal' }>) {
  const bar = (tenths: number, label: string) => `<div><strong>${label}</strong><span>${Array.from({ length: 10 }, (_, id) => `<i class="${id < tenths ? 'on' : ''}"></i>`).join('')}</span></div>`;
  return `<div class="curriculum-visual decimal-visual">${bar(visual.tenths, `0.${visual.tenths}`)}${visual.compare === undefined ? '' : bar(visual.compare, `0.${visual.compare}`)}<small>전체를 10칸으로 똑같이 나누어 살펴봐요</small></div>`;
}

const PALETTE = ['#7fb99a', '#f2b86b', '#e9827b', '#8db4e8', '#c79be0', '#e6d36a'];

function barGraphHtml(visual: Extract<CurriculumVisual, { kind: 'bar-graph' }>) {
  const { labels, values, unit, line, hidden = [] } = visual, W = 240, H = 168, left = 30, right = 8, top = 24, bottom = 30;
  const peak = Math.max(...values, 1), step = visual.step ?? (peak <= 10 ? 2 : peak <= 20 ? 5 : peak <= 50 ? 10 : peak <= 100 ? 20 : 50), top_ = Math.ceil(peak / step) * step;
  const plotW = W - left - right, plotH = H - top - bottom, slot = plotW / values.length;
  const y = (v: number) => top + plotH - v / top_ * plotH, x = (i: number) => left + slot * i + slot / 2;
  const grid = Array.from({ length: top_ / step + 1 }, (_, k) => `<line x1="${left}" x2="${W - right}" y1="${y(k * step)}" y2="${y(k * step)}" stroke="#d9e6d2"/><text x="${left - 4}" y="${y(k * step) + 3}" text-anchor="end" font-size="8" fill="#507a68">${k * step}</text>`).join('');
  const label = (i: number, ypos: number) => `<text x="${x(i)}" y="${ypos}" text-anchor="middle" font-size="9" font-weight="700" fill="#2f5b49">${hidden.includes(i) ? '?' : values[i]}</text>`;
  const marks = line
    ? `<polyline fill="none" stroke="#e9827b" stroke-width="2.5" points="${values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}"/>${values.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3.5" fill="#e9827b"/>${label(i, y(v) - 6)}`).join('')}`
    : values.map((v, i) => `<rect x="${x(i) - slot * .3}" y="${y(v)}" width="${slot * .6}" height="${plotH - (y(v) - top)}" rx="2" fill="${PALETTE[i % PALETTE.length]}"/>${label(i, y(v) - 3)}`).join('');
  const names = labels.map((name, i) => `<text x="${x(i)}" y="${H - bottom + 12}" text-anchor="middle" font-size="8.5" fill="#507a68">${esc(name)}</text>`).join('');
  return `<div class="curriculum-visual bar-graph-visual"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${line ? '꺾은선그래프' : '막대그래프'}">${grid}${marks}${names}<text x="2" y="9" font-size="8" fill="#507a68">(${esc(unit)})</text></svg></div>`;
}

function ratioGraphHtml(visual: Extract<CurriculumVisual, { kind: 'ratio-graph' }>) {
  const { parts, mode, hidden = [] } = visual, name = (p: { label: string; percent: number }, i: number) => `${esc(p.label)} ${hidden.includes(i) ? '?' : `${p.percent}%`}`;
  if (mode === 'band') {
    let at = 0;
    const segs = parts.map((p, i) => { const x = 10 + at * 2, w = p.percent * 2; at += p.percent; return `<rect x="${x}" y="40" width="${w}" height="34" fill="${PALETTE[i % PALETTE.length]}" stroke="#fff" stroke-width="1.5"/><text x="${x + w / 2}" y="60" text-anchor="middle" font-size="9" font-weight="700" fill="#2f5b49">${hidden.includes(i) ? '?' : `${p.percent}%`}</text><text x="${x + w / 2}" y="92" text-anchor="middle" font-size="8.5" fill="#507a68">${esc(p.label)}</text>`; }).join('');
    return `<div class="curriculum-visual ratio-graph-visual"><svg viewBox="0 0 220 110" role="img" aria-label="띠그래프">${segs}<text x="10" y="30" font-size="8" fill="#507a68">전체 100%</text></svg></div>`;
  }
  let angle = -Math.PI / 2;
  const cx = 70, cy = 70, rad = 56, slices = parts.map((p, i) => { const sweep = p.percent / 100 * Math.PI * 2, a0 = angle, a1 = angle + sweep; angle = a1; const large = sweep > Math.PI ? 1 : 0, mid = (a0 + a1) / 2; return `<path d="M${cx} ${cy} L${cx + rad * Math.cos(a0)} ${cy + rad * Math.sin(a0)} A${rad} ${rad} 0 ${large} 1 ${cx + rad * Math.cos(a1)} ${cy + rad * Math.sin(a1)} Z" fill="${PALETTE[i % PALETTE.length]}" stroke="#fff" stroke-width="1.5"/><text x="${cx + rad * .62 * Math.cos(mid)}" y="${cy + rad * .62 * Math.sin(mid) + 3}" text-anchor="middle" font-size="8.5" font-weight="700" fill="#2f5b49">${hidden.includes(i) ? '?' : `${p.percent}%`}</text>`; }).join('');
  const legend = parts.map((p, i) => `<rect x="146" y="${22 + i * 20}" width="10" height="10" fill="${PALETTE[i % PALETTE.length]}"/><text x="160" y="${31 + i * 20}" font-size="9" fill="#507a68">${esc(p.label)}</text>`).join('');
  return `<div class="curriculum-visual ratio-graph-visual"><svg viewBox="0 0 220 140" role="img" aria-label="원그래프">${slices}${legend}</svg></div>`;
}

function transformHtml(visual: Extract<CurriculumVisual, { kind: 'transform' }>) {
  const arrows: Record<typeof visual.op, string> = { slide: '→', 'flip-h': '⇄', 'flip-v': '⇅', 'rotate-cw90': '↻', 'rotate-ccw90': '↺', 'rotate-180': '⟳' };
  const shape = '<path d="M20 14 H62 V28 H36 V42 H56 V56 H36 V92 H20 Z" fill="#dff1d5" stroke="#507a68" stroke-width="3" stroke-linejoin="round"/>';
  const star = { top: [41, 12], bottom: [28, 106], left: [8, 56], right: [76, 56] }[visual.mark ?? 'none' as 'top'], mark = visual.mark && star ? `<text x="${star[0]}" y="${star[1]}" text-anchor="middle" font-size="16" fill="#e9a23b">★</text>` : '';
  return `<div class="curriculum-visual transform-visual"><svg viewBox="0 0 200 112" role="img" aria-label="${esc(visual.label ?? '도형 움직이기')}"><g>${shape}</g>${mark}<text x="120" y="60" text-anchor="middle" font-size="34" fill="#e9827b">${arrows[visual.op]}</text><text x="100" y="104" text-anchor="middle" font-size="9" fill="#507a68">${esc(visual.label ?? '도형을 움직여요')}</text></svg></div>`;
}

function sceneHtml(visual: Extract<CurriculumVisual, { kind: 'scene' }>) {
  return `<div class="curriculum-visual scene-visual"><div class="scene-items">${visual.items.map(item => `<b><span>${esc(item.icon)}</span>${item.label ? `<small>${esc(item.label)}</small>` : ''}</b>`).join('')}</div>${visual.caption ? `<em>${esc(visual.caption)}</em>` : ''}</div>`;
}

function rulerHtml(end: number, max = Math.max(10, Math.ceil((end + 1) / 5) * 5)) {
  const x = (n: number) => 20 + n * (300 / max);
  const ticks = Array.from({ length: max + 1 }, (_, n) => `<line x1="${x(n)}" y1="46" x2="${x(n)}" y2="${n % 5 === 0 ? 62 : 56}" stroke="#8a7863" stroke-width="1.5"/><text x="${x(n)}" y="78" text-anchor="middle" font-size="10" fill="#5a4a3a">${n}</text>`).join('');
  return `<div class="curriculum-visual ruler-visual"><svg viewBox="0 0 340 92" role="img" aria-label="자 그림"><rect x="${x(0)}" y="10" width="${x(end) - x(0)}" height="20" rx="4" fill="#f4c978" stroke="#d9ad7c" stroke-width="2"/><path d="M${x(end)} 10 L${x(end) + 12} 20 L${x(end)} 30 Z" fill="#e07a5f"/><rect x="14" y="38" width="${300 + 12}" height="46" rx="4" fill="#fff3d6" stroke="#d9ad7c" stroke-width="2"/>${ticks}</svg><em>자의 눈금을 살펴봐요 (cm)</em></div>`;
}

export function curriculumVisualHtml(visual: CurriculumVisual): string {
  if (visual.kind === 'none') return '';
  if (visual.kind === 'scene') return sceneHtml(visual);
  if (visual.kind === 'ruler') return rulerHtml(visual.end, visual.max);
  if (visual.kind === 'bar-graph') return barGraphHtml(visual);
  if (visual.kind === 'ratio-graph') return ratioGraphHtml(visual);
  if (visual.kind === 'transform') return transformHtml(visual);
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
