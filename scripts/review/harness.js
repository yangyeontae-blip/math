// 브라우저에서 실제 화면을 눌러 문제를 푸는 점검 도구예요. (개발 서버에서 페이지를 연 뒤 콘솔/도구로 불러와요)
//   const h = await import('/scripts/review/harness.js'); await h.install();
//   await window.__newGame(3);                   // 학년을 골라 새 모험 시작
//   window.__queue = [[3, 'plane', 0], ...];     // [학년, 단원, 미션 번호]
//   await window.__runQueue(38000);              // 시간 안에 풀 수 있는 만큼 풀고 요약을 돌려줘요
// 화면에 나온 문제와 같은 문제를 생성기에서 찾아 정답을 누르고, 못 찾으면 보기를 차례로 눌러 보거나 힌트 속 숫자로 풀어요.
export async function install() {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const gc = await import('/src/grade-content.ts'), cv = await import('/src/curriculum-visual.ts'), cu = await import('/src/curriculum.ts');
  const UNITS = ['plane', 'lengthTime', 'fractionDecimal', 'circle', 'fraction', 'measurement', 'pictograph'];
  const norm = html => { const d = document.createElement('div'); d.innerHTML = html; return d.innerHTML; };
  const squash = s => s.replace(/[\s/]/g, '');
  Object.assign(window, { __sleep: sleep, __log: [], __queue: [], __results: [] });

  window.__findQ = (grade, unit, mission, prompt, visualHtml) => {
    const target = norm(visualHtml), p = squash(prompt);
    const gen = (u, m) => (grade === 3 ? cu.generateCurriculumQuestion(u, m) : gc.generateGradeQuestion(grade, u, m));
    const tryGen = (u, m, n) => { for (let i = 0; i < n; i++) { const x = gen(u, m); if (squash(x.prompt) === p && norm(cv.curriculumVisualHtml(x.visual)) === target) return x; } return null; };
    let q = tryGen(unit, mission, 20000); if (q) return q;
    for (let m = 0; m < 10; m++) if (m !== mission && (q = tryGen(unit, m, 2500))) return q;
    for (const u of UNITS) if (u !== unit) for (let m = 0; m < 10; m++) if ((q = tryGen(u, m, 300))) return q;
    return null;
  };

  window.__solveByHints = async () => {
    const hb = document.querySelector('#curriculum-hint-button');
    if (hb) for (let i = 0; i < 3; i++) { hb.click(); await sleep(120); }
    const text = (document.querySelector('#curriculum-hint')?.innerText || '') + ' ' + (document.querySelector('#curriculum-message')?.innerText || '');
    const cands = [...new Set((text.match(/\d[\d,]*/g) || []).map(x => x.replace(/,/g, '')).filter(x => x.length <= 7))].reverse();
    for (const c of cands) {
      for (let i = 0; i < 8; i++) document.querySelector('[data-curriculum-number="지우기"]')?.click();
      for (const d of c) { const k = document.querySelector(`[data-curriculum-number="${d}"]`); if (!k) break; k.click(); await sleep(25); }
      document.querySelector('[data-curriculum-number="확인"]')?.click(); await sleep(150);
      if (document.querySelector('#curriculum-next')) return c;
    }
    return null;
  };

  window.__playMission = async (grade, unit, mission) => {
    const out = { unit, mission, qs: 0, miss: 0, notes: [] };
    document.getElementById('stage-map').click(); await sleep(350);
    document.querySelector(`[data-curriculum-unit="${unit}"]`).click(); await sleep(500);
    const card = document.querySelector(`[data-mission="${mission}"]`);
    if (!card || card.disabled) { out.notes.push('locked'); document.querySelector('#modal [data-close]')?.click(); await sleep(250); return out; }
    card.click(); await sleep(500);
    for (let step = 0; step < 12; step++) {
      const h3 = document.querySelector('.curriculum-question-card h3'); if (!h3) break;
      const prompt = h3.textContent, vis = document.querySelector('.curriculum-question-card .curriculum-visual');
      const title = document.querySelector('#modal h2')?.textContent, btns = [...document.querySelectorAll('[data-curriculum-answer]')];
      let q = window.__findQ(grade, unit, mission, prompt, vis ? vis.outerHTML : ''); out.qs++;
      if (q && ((q.kind === 'choice') !== (btns.length > 0) || (q.kind === 'choice' && !btns.find(x => x.dataset.curriculumAnswer === q.answer)))) q = null;
      if (!q) {
        out.miss++;
        if (btns.length) { for (const b of btns) { b.click(); await sleep(100); if (document.querySelector('#curriculum-next')) break; } }
        else if ((await window.__solveByHints()) === null) out.notes.push('unsolved:' + prompt.slice(0, 50));
        if (!document.querySelector('#curriculum-next')) { out.notes.push('stuck:' + prompt.slice(0, 40)); break; }
        window.__log.push([grade, unit, mission, title, prompt.slice(0, 80), '(fallback)']);
        document.querySelector('#curriculum-next').click(); await sleep(250); continue;
      }
      window.__log.push([grade, unit, mission, title, prompt.slice(0, 80), q.answer]);
      if (q.kind === 'choice') btns.find(x => x.dataset.curriculumAnswer === q.answer).click();
      else {
        for (const d of String(q.answer)) { const k = document.querySelector(`[data-curriculum-number="${d}"]`); if (!k) { out.notes.push('nokey:' + d); break; } k.click(); await sleep(30); }
        document.querySelector('[data-curriculum-number="확인"]').click();
      }
      await sleep(200);
      if (!document.querySelector('#curriculum-next')) { out.notes.push('nonext:' + prompt.slice(0, 40) + ' ans=' + q.answer); await window.__solveByHints(); if (!document.querySelector('#curriculum-next')) break; }
      if (!/정답/.test(document.querySelector('#curriculum-message')?.textContent || '')) out.notes.push('notcorrect');
      document.querySelector('#curriculum-next')?.click(); await sleep(280);
    }
    out.end = document.querySelector('#modal h2')?.textContent;
    document.querySelector('#modal [data-close]')?.click(); await sleep(300);
    return out;
  };

  window.__runQueue = async (limitMs = 38000) => {
    const t0 = Date.now();
    while (window.__queue.length && Date.now() - t0 < limitMs) {
      const [g, u, m] = window.__queue.shift(), r = await window.__playMission(g, u, m);
      window.__results.push(`g${g} ${u}#${m} qs=${r.qs} miss=${r.miss} ${r.notes.join(';')}`);
    }
    return { left: window.__queue.length, done: window.__results.length, plays: window.__log.length, problems: window.__results.filter(x => /stuck|unsolved|notcorrect|nokey|nonext|locked/.test(x)).slice(-6) };
  };

  window.__newGame = async grade => {
    const hud = document.querySelector('#hud');
    if (!hud.hidden) { document.querySelector('#modal [data-close]')?.click(); await sleep(300); document.getElementById('settings').click(); await sleep(600); document.getElementById('return-title').click(); await sleep(800); }
    [...document.querySelectorAll('#start-screen button')].find(b => b.textContent.trim() === `${grade}학년`).click(); await sleep(300);
    document.querySelector('#nickname-input').value = '검수' + grade; document.querySelector('#new-game').click(); await sleep(700);
    document.querySelector('#confirm-action')?.click();
    const hud2 = document.querySelector('#hud'); for (let k = 0; k < 60 && hud2.hidden; k++) await sleep(500);
    await sleep(2500); document.querySelector('#modal [data-close]')?.click(); await sleep(500);
    const s = JSON.parse(localStorage.getItem('berry-forest-save-v1')); return [hud2.hidden, s.grade, s.nickname];
  };

  window.__fill = (grade, missions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) => { window.__queue = []; window.__results = []; window.__log.length = 0; for (const u of UNITS) for (const m of missions) window.__queue.push([grade, u, m]); return window.__queue.length; };
  return 'installed';
}
