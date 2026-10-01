const embeddedAssets = /*__EMBEDDED_ASSETS__*/{};

const allowedOrigins = new Set([
  'https://berry-forest-school.yangyeontae.chatgpt.site',
  'https://yangyeontae-blip.github.io',
]);

function allowedOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return '';
  if (allowedOrigins.has(origin) || /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin)) return origin;
  return '';
}

function corsHeaders(request) {
  const origin = allowedOrigin(request);
  return origin ? {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    vary: 'Origin',
  } : {};
}

function json(request, value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...corsHeaders(request) },
  });
}

function normalizeNickname(value) {
  if (typeof value !== 'string') return null;
  const nickname = value.trim().replace(/\s+/g, ' '), letters = [...nickname];
  if (!letters.length || letters.length > 10 || /[\u0000-\u001f\u007f<>]/.test(nickname)) return null;
  return nickname;
}

function validPlayerId(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9-]{16,64}$/.test(value);
}

// 초등학생 대상 서비스라 부적절한 닉네임은 전체 랭킹에 올리지 않아요. src/nickname.ts와 같은 목록이에요(tests/nickname.test.ts가 일치를 확인해요).
const BLOCKED_WORDS = ['시발', '씨발', '씨바', '시바', '병신', '븅신', '지랄', '좆', '조까', '존나', '개새끼', '새끼', '미친놈', '미친년', '염병', '엿먹', '아가리', '닥쳐', '느금', '니미', '섹스', '야동', '자지', '보지', '걸레', '창녀', '꺼져', '죽어', '죽인다', 'fuck', 'shit', 'bitch', 'sex', 'porn', 'dick', 'pussy', 'nigg', 'asshole'];
function isBlockedNickname(nickname) {
  const flat = String(nickname).toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  return BLOCKED_WORDS.some(word => flat.includes(word));
}

// 한 번에 올라갈 수 있는 원정 횟수에는 상한을 둬서, 임의 숫자를 보내 1등이 되는 일을 막아요.
const FIRST_SYNC_CAP = 30, BASE_GROWTH = 3, GROWTH_PER_HOUR = 6;
function allowedCompleted(existing, now = Date.now()) {
  if (!existing) return FIRST_SYNC_CAP;
  const stored = Number(existing.completed) || 0, updated = Date.parse(String(existing.updated_at).replace(' ', 'T') + 'Z');
  const hours = Number.isFinite(updated) ? Math.max(0, (now - updated) / 3_600_000) : 0;
  return stored + BASE_GROWTH + Math.floor(hours * GROWTH_PER_HOUR);
}

// 같은 IP에서 1분에 10번까지만 기록할 수 있어요(워커 인스턴스별 최선 노력 방식).
const recentWrites = new Map();
function rateLimited(request, now = Date.now()) {
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown', windowStart = now - 60_000;
  const hits = (recentWrites.get(ip) ?? []).filter(time => time > windowStart);
  if (hits.length >= 10) { recentWrites.set(ip, hits); return true; }
  hits.push(now); recentWrites.set(ip, hits);
  if (recentWrites.size > 500) for (const [key, times] of recentWrites) if (!times.some(time => time > windowStart)) recentWrites.delete(key);
  return false;
}

async function readRankings(request, env, url) {
  const mine = url.searchParams.get('player_id') ?? '';
  const result = await env.DB.prepare(`
    SELECT player_id, nickname, completed
    FROM expedition_rankings
    ORDER BY completed DESC, updated_at ASC, nickname COLLATE NOCASE ASC
    LIMIT 50
  `).all();
  const rankings = (result.results ?? []).map((row, index) => ({
    rank: index + 1,
    nickname: String(row.nickname),
    completed: Number(row.completed),
    isMine: validPlayerId(mine) && row.player_id === mine,
  }));
  return json(request, { rankings });
}

async function writeRanking(request, env) {
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > 1024) return json(request, { error: '요청이 너무 커요.' }, 413);
  let body;
  try { body = await request.json(); } catch { return json(request, { error: '랭킹 기록을 읽을 수 없어요.' }, 400); }
  const playerId = body?.playerId, nickname = normalizeNickname(body?.nickname), completed = body?.completed;
  if (!validPlayerId(playerId) || !nickname || !Number.isSafeInteger(completed) || completed < 0 || completed > 100_000) {
    return json(request, { error: '닉네임이나 원정 횟수를 확인해 주세요.' }, 400);
  }
  if (isBlockedNickname(nickname)) return json(request, { error: '이 닉네임은 전체 랭킹에 올릴 수 없어요. 다른 이름으로 바꿔 주세요.' }, 422);
  const existing = await env.DB.prepare('SELECT completed, updated_at FROM expedition_rankings WHERE player_id = ?').bind(playerId).first();
  const stored = Math.min(completed, allowedCompleted(existing));
  await env.DB.prepare(`
    INSERT INTO expedition_rankings (player_id, nickname, completed, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(player_id) DO UPDATE SET
      nickname = excluded.nickname,
      completed = CASE WHEN excluded.completed > expedition_rankings.completed THEN excluded.completed ELSE expedition_rankings.completed END,
      updated_at = CASE WHEN excluded.completed > expedition_rankings.completed THEN excluded.updated_at ELSE expedition_rankings.updated_at END
  `).bind(playerId, nickname, stored).run();
  return json(request, { ok: true, completed: stored });
}

// ---- 우리 반 협동 보스 -------------------------------------------------------------------
// 반 코드와 주(週)별로 정답 수를 모아요. 이름 같은 개인정보는 저장하지 않고 기기 번호와 피해량만 저장해요.
const BOSS_FIRST_CAP = 100, BOSS_BASE_GROWTH = 20, BOSS_GROWTH_PER_HOUR = 120, BOSS_PLAYER_WEEK_MAX = 1000;
function normalizeClassCode(value) {
  if (typeof value !== 'string') return null;
  const code = value.trim().toLowerCase();
  return /^[0-9a-z가-힣]{2,12}$/.test(code) ? code : null;
}
// 서버 시계를 기준으로 ISO 주차(예: 2026-W40)를 계산해요. src/boss.ts와 같은 규칙이에요.
function isoWeekKey(now = Date.now()) {
  const date = new Date(now), day = (date.getUTCDay() + 6) % 7;
  const thursday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - day + 3));
  const jan4 = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((thursday - jan4) / 86_400_000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
function bossMaxHp(members) { return 200 + 100 * Math.max(1, members); }
function allowedBossDamage(existing, now = Date.now()) {
  if (!existing) return BOSS_FIRST_CAP;
  const stored = Number(existing.damage) || 0, updated = Date.parse(String(existing.updated_at).replace(' ', 'T') + 'Z');
  const hours = Number.isFinite(updated) ? Math.max(0, (now - updated) / 3_600_000) : 0;
  return Math.min(BOSS_PLAYER_WEEK_MAX, stored + BOSS_BASE_GROWTH + Math.floor(hours * BOSS_GROWTH_PER_HOUR));
}
async function bossSummary(request, env, classCode, week, playerId) {
  const total = await env.DB.prepare('SELECT COUNT(*) AS members, COALESCE(SUM(damage), 0) AS damage FROM boss_progress WHERE class_code = ? AND week = ?').bind(classCode, week).first();
  const mine = validPlayerId(playerId) ? await env.DB.prepare('SELECT damage FROM boss_progress WHERE class_code = ? AND week = ? AND player_id = ?').bind(classCode, week, playerId).first() : null;
  const members = Number(total?.members) || 0, damage = Number(total?.damage) || 0, maxHp = bossMaxHp(members);
  return json(request, { week, classCode, members, damage, maxHp, defeated: damage >= maxHp, mine: Number(mine?.damage) || 0 });
}
async function readBoss(request, env, url) {
  const classCode = normalizeClassCode(url.searchParams.get('class'));
  if (!classCode) return json(request, { error: '반 코드는 2~12자의 글자나 숫자로 적어 주세요.' }, 400);
  return bossSummary(request, env, classCode, isoWeekKey(), url.searchParams.get('player_id') ?? '');
}
async function writeBoss(request, env) {
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > 1024) return json(request, { error: '요청이 너무 커요.' }, 413);
  let body;
  try { body = await request.json(); } catch { return json(request, { error: '기록을 읽을 수 없어요.' }, 400); }
  const classCode = normalizeClassCode(body?.classCode), playerId = body?.playerId, damage = body?.damage;
  if (!classCode || !validPlayerId(playerId) || !Number.isSafeInteger(damage) || damage < 0 || damage > 100_000) return json(request, { error: '반 코드나 기록을 확인해 주세요.' }, 400);
  const week = isoWeekKey();
  const existing = await env.DB.prepare('SELECT damage, updated_at FROM boss_progress WHERE class_code = ? AND week = ? AND player_id = ?').bind(classCode, week, playerId).first();
  const stored = Math.max(Number(existing?.damage) || 0, Math.min(damage, allowedBossDamage(existing)));
  await env.DB.prepare(`
    INSERT INTO boss_progress (class_code, week, player_id, damage, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(class_code, week, player_id) DO UPDATE SET
      damage = CASE WHEN excluded.damage > boss_progress.damage THEN excluded.damage ELSE boss_progress.damage END,
      updated_at = CASE WHEN excluded.damage > boss_progress.damage THEN excluded.updated_at ELSE boss_progress.updated_at END
  `).bind(classCode, week, playerId, stored).run();
  return bossSummary(request, env, classCode, week, playerId);
}

function serveAsset(request, pathname) {
  const path = pathname === '/' ? '/index.html' : pathname;
  const asset = embeddedAssets[path];
  if (!asset) return new Response('Not found', { status: 404 });
  const headers = {
    'content-type': asset.type,
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'cache-control': ['/index.html', '/sw.js', '/manifest.webmanifest'].includes(path) ? 'no-cache' : path.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
  };
  const body = asset.base64 ? Uint8Array.from(atob(asset.body), ch => ch.charCodeAt(0)) : asset.body;
  return new Response(request.method === 'HEAD' ? null : body, { headers });
}

export { normalizeNickname, validPlayerId, isBlockedNickname, allowedCompleted, BLOCKED_WORDS, normalizeClassCode, isoWeekKey, bossMaxHp, allowedBossDamage };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/rankings') {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
      if (!env.DB) return json(request, { error: '전체 랭킹 서버를 준비하는 중이에요.' }, 503);
      try {
        if (request.method === 'GET') return await readRankings(request, env, url);
        if (request.method === 'POST') return rateLimited(request) ? json(request, { error: '잠시 후에 다시 시도해 주세요.' }, 429) : await writeRanking(request, env);
        return json(request, { error: '지원하지 않는 요청이에요.' }, 405);
      } catch (error) {
        console.error('ranking-api', error);
        return json(request, { error: '전체 랭킹 서버가 잠시 쉬고 있어요.' }, 503);
      }
    }
    if (url.pathname === '/api/boss') {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
      if (!env.DB) return json(request, { error: '협동 보스를 준비하는 중이에요.' }, 503);
      try {
        if (request.method === 'GET') return await readBoss(request, env, url);
        if (request.method === 'POST') return rateLimited(request) ? json(request, { error: '잠시 후에 다시 시도해 주세요.' }, 429) : await writeBoss(request, env);
        return json(request, { error: '지원하지 않는 요청이에요.' }, 405);
      } catch (error) {
        console.error('boss-api', error);
        return json(request, { error: '협동 보스가 잠시 쉬고 있어요.' }, 503);
      }
    }
    if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405 });
    return serveAsset(request, url.pathname);
  },
};
