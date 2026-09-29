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
  await env.DB.prepare(`
    INSERT INTO expedition_rankings (player_id, nickname, completed, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(player_id) DO UPDATE SET
      nickname = excluded.nickname,
      completed = CASE WHEN excluded.completed > expedition_rankings.completed THEN excluded.completed ELSE expedition_rankings.completed END,
      updated_at = CASE WHEN excluded.completed > expedition_rankings.completed THEN excluded.updated_at ELSE expedition_rankings.updated_at END
  `).bind(playerId, nickname, completed).run();
  return json(request, { ok: true });
}

function serveAsset(request, pathname) {
  const path = pathname === '/' ? '/index.html' : pathname;
  const asset = embeddedAssets[path];
  if (!asset) return new Response('Not found', { status: 404 });
  const headers = {
    'content-type': asset.type,
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'cache-control': path === '/index.html' ? 'no-cache' : path.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
  };
  return new Response(request.method === 'HEAD' ? null : asset.body, { headers });
}

export { normalizeNickname, validPlayerId };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/rankings') {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
      if (!env.DB) return json(request, { error: '전체 랭킹 서버를 준비하는 중이에요.' }, 503);
      try {
        if (request.method === 'GET') return await readRankings(request, env, url);
        if (request.method === 'POST') return await writeRanking(request, env);
        return json(request, { error: '지원하지 않는 요청이에요.' }, 405);
      } catch (error) {
        console.error('ranking-api', error);
        return json(request, { error: '전체 랭킹 서버가 잠시 쉬고 있어요.' }, 503);
      }
    }
    if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405 });
    return serveAsset(request, url.pathname);
  },
};
