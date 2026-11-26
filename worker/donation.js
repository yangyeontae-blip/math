// 광장 작은 기부함(2026-11-26): 모든 학생이 낸 베리의 합계만 보관한다.
// 이름·닉네임·IP·저장 기록은 저장하지 않고, 같은 요청 번호는 한 번만 더한다.
export const DONATION_MAX = 100_000;
/** 크리스마스(2026-12-25, 한국 시간)가 지나면 더 받지 않는다. 합계는 계속 보여 준다. */
export const DONATION_END = Date.parse('2026-12-26T00:00:00+09:00');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KEEP_GIFTS = 30 * 86_400_000;

async function readTotal(env) {
  const row = await env.DB.prepare('SELECT total, gifts FROM donation_box WHERE id = 1').first();
  return { total: Number(row?.total ?? 0), gifts: Number(row?.gifts ?? 0) };
}

export async function handleDonation(request, env, { json, corsHeaders, rateLimited }, now = Date.now()) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (!env.DB) return json(request, { error: '기부함을 준비하는 중이에요.' }, 503);
  try {
    if (request.method === 'GET') return json(request, await readTotal(env));
    if (request.method !== 'POST') return json(request, { error: '지원하지 않는 요청이에요.' }, 405);
    if (!corsHeaders(request)['access-control-allow-origin']) return json(request, { error: '허용되지 않은 주소예요.' }, 403);
    if (now >= DONATION_END) return json(request, { error: '기부함은 크리스마스(12월 25일)까지만 열려 있었어요.', closed: true, ...(await readTotal(env)) }, 410);
    if (rateLimited(request, now)) return json(request, { error: '잠시 후에 다시 시도해 주세요.' }, 429);
    let data;
    try { data = await request.json(); } catch { return json(request, { error: '기부 내용을 읽지 못했어요.' }, 400); }
    const amount = data?.amount, requestId = data?.requestId;
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > DONATION_MAX || typeof requestId !== 'string' || !UUID.test(requestId)) return json(request, { error: `1베리부터 ${DONATION_MAX.toLocaleString('ko-KR')}베리까지 낼 수 있어요.` }, 400);
    const inserted = await env.DB.prepare('INSERT OR IGNORE INTO donation_gifts (request_id, amount, created_at) VALUES (?, ?, ?)').bind(requestId.toLowerCase(), amount, now).run();
    if ((inserted?.meta?.changes ?? 0) > 0) {
      await env.DB.prepare('INSERT INTO donation_box (id, total, gifts, updated_at) VALUES (1, ?, 1, ?) ON CONFLICT(id) DO UPDATE SET total = total + excluded.total, gifts = gifts + 1, updated_at = excluded.updated_at').bind(amount, now).run();
      await env.DB.prepare('DELETE FROM donation_gifts WHERE created_at < ?').bind(now - KEEP_GIFTS).run();
    }
    return json(request, { ok: true, ...(await readTotal(env)) });
  } catch (error) {
    console.error('donation-api', error);
    return json(request, { error: '기부함이 잠시 쉬고 있어요.' }, 503);
  }
}
