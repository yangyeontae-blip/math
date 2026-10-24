// Server-only. Never copy runtime mail secrets or recipient addresses into the client build.
const categories = ['개선 제안', '오류 제보', '좋았던 점'];
const origins = new Set(['https://berry-forest-school.yangyeontae.chatgpt.site', 'https://yangyeontae-blip.github.io']);
export async function handleFeedback(request, env, fetcher = fetch) {
  const origin = request.headers.get('origin') || '';
  const allowed = origins.has(origin) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
  const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', vary: 'Origin', ...(allowed ? {
    'access-control-allow-origin': origin, 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type',
  } : {}) };
  const reply = (value, status = 200) => new Response(JSON.stringify(value), { status, headers });
  if (!allowed) return reply({ error: '허용되지 않은 요청입니다.' }, 403);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return reply({ error: '지원하지 않는 요청입니다.' }, 405);
  if (!env.RESEND_API_KEY || !env.FEEDBACK_TO || !env.FEEDBACK_FROM || !env.DB) return reply({ error: '의견 받기를 준비 중입니다.' }, 503);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return reply({ error: 'JSON 요청이 필요합니다.' }, 415);
  // Bound streamed bytes too; content-length is optional and cannot be trusted.
  const reader = request.body?.getReader(); if (!reader) return reply({ error: '내용이 없습니다.' }, 400);
  const chunks = []; let size = 0;
  try {
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > 6000) { await reader.cancel(); return reply({ error: '내용이 너무 깁니다.' }, 413); } chunks.push(value); }
  } catch { return reply({ error: '내용을 읽을 수 없습니다.' }, 400); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let data; try { data = JSON.parse(new TextDecoder().decode(bytes)); } catch { return reply({ error: '내용을 읽을 수 없습니다.' }, 400); }
  const message = typeof data?.message === 'string' ? data.message.trim() : '';
  if (!categories.includes(data?.category) || message.length < 5 || message.length > 1000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(message) || data?.consent !== true || !/^[a-f0-9-]{36}$/i.test(data?.requestId || '')) return reply({ error: '의견과 동의 여부를 확인해 주세요.' }, 400);
  try {
    // Ten-minute buckets in D1 enforce a shared limit across Worker instances.
    // Hash only for abuse prevention; do not forward the IP or store the opinion in D1.
    const bucket = Math.floor(Date.now() / 600_000);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${bucket}:${request.headers.get('cf-connecting-ip') || 'unknown'}`));
    const key = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
    await env.DB.prepare('DELETE FROM feedback_limits WHERE bucket < ?').bind(bucket - 1).run();
    const limit = await env.DB.prepare(`INSERT INTO feedback_limits (key, bucket, hits) VALUES (?, ?, 1) ON CONFLICT(key) DO UPDATE SET hits = hits + 1 WHERE hits < 3 RETURNING hits`).bind(key, bucket).first();
    if (!limit) return reply({ error: '10분 뒤 다시 시도해 주세요.' }, 429);
    const response = await fetcher('https://api.resend.com/emails', {
      method: 'POST', signal: AbortSignal.timeout(10_000),
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json', 'Idempotency-Key': `berry-feedback/${data.requestId}` },
      body: JSON.stringify({ from: env.FEEDBACK_FROM, to: [env.FEEDBACK_TO], subject: `[베리숲 의견] ${data.category}`, text: `분류: ${data.category}\n\n${message}` }),
    });
    const delivered = await response.json().catch(() => null);
    if (!response.ok || typeof delivered?.id !== 'string' || !delivered.id) return reply({ error: '메일 전송을 확인하지 못했습니다.' }, 502);
    return reply({ ok: true });
  } catch { return reply({ error: '의견 전송이 잠시 어렵습니다.' }, 503); }
}
