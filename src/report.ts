import type { Save, CurriculumUnitId } from './rules';

export interface ReportUnit { id: CurriculumUnitId; name: string; icon: string; correct: number; wrong: number; hints: number; total: number; rate: number | null; completedMissions: number }
export interface ReportData {
  nickname: string; level: number; dateLabel: string; playMinutes: number;
  totalCorrect: number; totalWrong: number; overallRate: number | null;
  units: ReportUnit[]; strong: ReportUnit[]; needsWork: ReportUnit[]; practiceSkills: { unitName: string; skill: string }[]; calcWrongCount: number;
}
type Region = { id: CurriculumUnitId; name: string; icon: string };

const percent = (correct: number, total: number) => total ? Math.round(correct / total * 100) : null;

/** 저장 데이터에서 선생님·보호자용 학습 리포트 내용을 만들어요. 서버로 보내지 않고 이 기기 안에서만 계산해요. */
export function buildReport(s: Save, regions: readonly Region[], now = new Date()): ReportData {
  const units: ReportUnit[] = regions.map(region => {
    const p = s.curriculum.units[region.id], total = p.correct + p.wrong;
    return { id: region.id, name: region.name, icon: region.icon, correct: p.correct, wrong: p.wrong, hints: p.hints, total, rate: percent(p.correct, total), completedMissions: p.completedMissions.length };
  });
  const attempted = units.filter(unit => unit.total >= 3);
  const totalCorrect = units.reduce((sum, unit) => sum + unit.correct, 0), totalWrong = units.reduce((sum, unit) => sum + unit.wrong, 0);
  const names = new Map(regions.map(region => [region.id, region.name]));
  return {
    nickname: s.nickname, level: s.level, dateLabel: `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`, playMinutes: Math.floor(s.learning.elapsedSeconds / 60),
    totalCorrect, totalWrong, overallRate: percent(totalCorrect, totalCorrect + totalWrong), units,
    strong: attempted.filter(unit => (unit.rate ?? 0) >= 85).sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0)).slice(0, 3),
    needsWork: attempted.filter(unit => (unit.rate ?? 100) < 70).sort((a, b) => (a.rate ?? 0) - (b.rate ?? 0)).slice(0, 3),
    practiceSkills: s.curriculum.wrongSkills.slice(0, 8).map(item => ({ unitName: names.get(item.unit) ?? '수학', skill: item.skill })),
    calcWrongCount: s.learning.wrongQuestions.length,
  };
}

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);
const rateText = (rate: number | null) => rate === null ? '기록 없음' : `${rate}%`;

/** 인쇄용 한 장짜리 리포트 HTML. 사용자 입력(닉네임, 개념 이름)은 모두 이스케이프해요. */
export function reportHtml(report: ReportData): string {
  const rows = report.units.map(unit => `<tr><td>${unit.icon} ${escapeHtml(unit.name)}</td><td>${unit.completedMissions}/10</td><td>${unit.total ? `${unit.correct}/${unit.total}` : '-'}</td><td><b>${rateText(unit.rate)}</b></td><td>${unit.hints}</td></tr>`).join('');
  const list = (items: ReportUnit[], empty: string) => items.length ? `<ul>${items.map(unit => `<li>${unit.icon} ${escapeHtml(unit.name)} · ${rateText(unit.rate)}</li>`).join('')}</ul>` : `<p class="muted">${empty}</p>`;
  const skills = report.practiceSkills.length ? `<ul>${report.practiceSkills.map(item => `<li>${escapeHtml(item.unitName)} · ${escapeHtml(item.skill)}</li>`).join('')}</ul>` : '<p class="muted">지금 다시 연습할 개념이 없어요.</p>';
  return `<article class="report-sheet"><h1>🍓 베리숲 모험학교 학습 리포트</h1><p class="report-meta"><b>${escapeHtml(report.nickname)}</b> · Lv.${report.level} · ${report.dateLabel} · 플레이 ${report.playMinutes}분</p>
<div class="report-summary"><div><small>맞힌 문제</small><b>${report.totalCorrect}</b></div><div><small>다시 도전한 문제</small><b>${report.totalWrong}</b></div><div><small>전체 정답률</small><b>${rateText(report.overallRate)}</b></div></div>
<h2>단원별 기록</h2><table><thead><tr><th>단원</th><th>임무</th><th>정답/도전</th><th>정답률</th><th>힌트 사용</th></tr></thead><tbody>${rows}</tbody></table>
<div class="report-columns"><section><h2>👍 잘하고 있어요</h2>${list(report.strong, '도전 기록이 더 쌓이면 보여 줄게요.')}</section><section><h2>🌱 더 연습하면 좋아요</h2>${list(report.needsWork, '지금은 크게 어려워하는 단원이 없어요.')}</section></div>
<h2>다시 만날 개념</h2>${skills}${report.calcWrongCount ? `<p class="muted">계산 숲에서 다시 풀 문제 ${report.calcWrongCount}개가 모여 있어요.</p>` : ''}
<p class="report-note">이 리포트는 이 기기에 저장된 기록으로 만들었어요. 서버로 전송되지 않아요. 틀린 문제는 실력을 키우는 보물 지도예요.</p></article>`;
}
