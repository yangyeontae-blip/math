function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
}

/** 문제 문장을 안전하게 표시하면서 6/10 같은 분수를 교과서식 세로 분수로 바꿉니다. */
export function mathTextHtml(value: string) {
  const escaped = escapeHtml(value);
  const fraction = (whole: string, numerator: string, denominator: string) =>
    `<span class="math-mixed">${whole ? `<span class="math-whole">${whole}</span>` : ''}<span class="math-fraction" role="img" aria-label="${denominator}분의 ${numerator}"><span>${numerator}</span><span>${denominator}</span></span></span>`;
  return escaped
    .replace(/(^|[^\d.])(\d+)\s+(\d+)\/(\d+)(?!\d)/g, (_, prefix, whole, numerator, denominator) => `${prefix}${fraction(whole, numerator, denominator)}`)
    .replace(/(^|[^\d.>])(\d+)\/(\d+)(?!\d)/g, (_, prefix, numerator, denominator) => `${prefix}${fraction('', numerator, denominator)}`);
}
