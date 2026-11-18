// 실제 날씨: 기상청 초단기실황(공공데이터포털)을 서버에서 대신 불러와요.
// 서비스 키는 서버 비밀값 KMA_SERVICE_KEY(일반 인증키 Decoding)에만 두고 화면 코드에는 넣지 않아요.
// 위치는 시·도 단위 대표 격자만 써서 학교를 알 수 없어요.

export const WEATHER_REGIONS = {
  cheongju: { name: '청주', nx: 69, ny: 106 },
  seoul: { name: '서울', nx: 60, ny: 127 },
  busan: { name: '부산', nx: 98, ny: 76 },
  daegu: { name: '대구', nx: 89, ny: 90 },
  incheon: { name: '인천', nx: 55, ny: 124 },
  gwangju: { name: '광주', nx: 58, ny: 74 },
  daejeon: { name: '대전', nx: 67, ny: 100 },
  ulsan: { name: '울산', nx: 102, ny: 84 },
  sejong: { name: '세종', nx: 66, ny: 103 },
  gyeonggi: { name: '경기', nx: 60, ny: 121 },
  gangwon: { name: '강원', nx: 73, ny: 134 },
  chungbuk: { name: '충북', nx: 69, ny: 106 },
  chungnam: { name: '충남', nx: 55, ny: 106 },
  jeonbuk: { name: '전북', nx: 63, ny: 89 },
  jeonnam: { name: '전남', nx: 51, ny: 67 },
  gyeongbuk: { name: '경북', nx: 91, ny: 106 },
  gyeongnam: { name: '경남', nx: 90, ny: 77 },
  jeju: { name: '제주', nx: 52, ny: 38 },
};

const KMA_URL = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst';
const CACHE_MS = 10 * 60_000;
const cache = new Map();

/** 초단기실황은 매시 정각 자료가 약 40분 뒤에 나와요. 45분 전이면 한 시간 전 자료를 물어요. */
export function kmaBaseTime(now = Date.now()) {
  let t = new Date(now + 9 * 3600_000); // 한국 시각을 UTC 필드로 읽어요.
  if (t.getUTCMinutes() < 45) t = new Date(t.getTime() - 3600_000);
  const pad = n => String(n).padStart(2, '0');
  return {
    baseDate: `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}`,
    baseTime: `${pad(t.getUTCHours())}00`,
  };
}

/** 강수형태(PTY): 0 없음, 1 비, 2 비/눈, 3 눈, 5 빗방울, 6 빗방울눈날림, 7 눈날림 */
export function weatherFromKma(pty, temp) {
  const code = Number(pty);
  if (code === 1 || code === 5) return 'rain';
  if (code === 3 || code === 7) return 'snow';
  if (code === 2 || code === 6) return Number(temp) <= 1 ? 'snow' : 'rain';
  return 'clear';
}

export function parseKma(body) {
  if (body?.response?.header?.resultCode !== '00') return null;
  const items = body.response.body?.items?.item;
  if (!Array.isArray(items)) return null;
  const value = name => items.find(item => item.category === name)?.obsrValue;
  const pty = value('PTY'), temp = Number(value('T1H'));
  if (pty === undefined || !Number.isFinite(temp)) return null;
  return { weather: weatherFromKma(pty, temp), temp: Math.round(temp * 10) / 10 };
}

export async function handleWeather(request, env, { json, corsHeaders }, fetcher = fetch, now = Date.now()) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== 'GET') return json(request, { error: '지원하지 않는 요청이에요.' }, 405);
  const regionId = new URL(request.url).searchParams.get('region') || 'cheongju';
  const region = WEATHER_REGIONS[regionId];
  if (!region) return json(request, { error: '지역을 다시 골라 주세요.' }, 400);
  if (!env.KMA_SERVICE_KEY) return json(request, { error: '실제 날씨 서버를 준비하는 중이에요.' }, 503);
  const hit = cache.get(regionId);
  if (hit && now - hit.at < CACHE_MS) return json(request, hit.value);
  const { baseDate, baseTime } = kmaBaseTime(now);
  const query = new URLSearchParams({ serviceKey: env.KMA_SERVICE_KEY, pageNo: '1', numOfRows: '20', dataType: 'JSON', base_date: baseDate, base_time: baseTime, nx: String(region.nx), ny: String(region.ny) });
  try {
    const response = await fetcher(`${KMA_URL}?${query}`, { signal: AbortSignal.timeout(6000) });
    const parsed = parseKma(await response.json().catch(() => null));
    if (!response.ok || !parsed) return json(request, { error: '기상청 날씨를 받지 못했어요. 숲은 평소 날씨로 지내요.' }, 502);
    const value = { ...parsed, region: regionId, regionName: region.name, baseDate, baseTime, source: 'kma' };
    cache.set(regionId, { at: now, value });
    return json(request, value);
  } catch (error) {
    console.error('weather-api', error?.name || error);
    return json(request, { error: '기상청 날씨를 받지 못했어요. 숲은 평소 날씨로 지내요.' }, 502);
  }
}
