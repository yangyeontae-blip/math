// 기상청 실제 날씨(선택): 학생 위치는 묻지 않고, 설정에서 고른 시·도 대표 지점의 날씨만 가져와요.
// 서버나 키가 준비되지 않았으면 조용히 null을 돌려주고, 숲은 지금처럼 무작위 날씨로 움직여요.
import { request } from './global-ranking';
import type { Weather } from './ambience';

export type RealWeather = { region: string; regionName: string; weather: Weather; temp: number | null };

export const WEATHER_REGION_NAMES: Record<string, string> = {
  cheongju: '청주', seoul: '서울', busan: '부산', daegu: '대구', incheon: '인천', gwangju: '광주', daejeon: '대전', ulsan: '울산', sejong: '세종',
  gyeonggi: '경기', gangwon: '강원', chungbuk: '충북', chungnam: '충남', jeonbuk: '전북', jeonnam: '전남', gyeongbuk: '경북', gyeongnam: '경남', jeju: '제주',
};

const KEY = 'berry-forest-weather-region-v1';
const FRESH_MS = 20 * 60_000;

/** 기본은 청주 기상청 날씨예요. 설정에서 "끄기"를 고르면 'off'로 기억하고 빈 문자열을 돌려줘요. */
export const DEFAULT_WEATHER_REGION = 'cheongju';
export function weatherRegion(): string {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'off') return '';
    return v && v in WEATHER_REGION_NAMES ? v : DEFAULT_WEATHER_REGION;
  } catch { return DEFAULT_WEATHER_REGION; }
}
export function setWeatherRegion(region: string) {
  try { localStorage.setItem(KEY, region in WEATHER_REGION_NAMES ? region : 'off'); } catch { /* 저장이 막혀 있어도 괜찮아요 */ }
  cached = null;
}

const WEATHER_WORDS = { clear: '맑음', rain: '비', snow: '눈' } as const;
/** 화면에 늘 보이는 기상청 표시 문구예요. 예: "기상청 실시간 · 청주 맑음 8°C" */
export function realWeatherText(real: RealWeather): string {
  return `기상청 실시간 · ${real.regionName} ${WEATHER_WORDS[real.weather]}${real.temp === null ? '' : ` ${real.temp}°C`}`;
}

export function parseRealWeather(value: unknown): RealWeather | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Partial<RealWeather>;
  if (typeof v.region !== 'string' || !(v.region in WEATHER_REGION_NAMES)) return null;
  if (!['clear', 'rain', 'snow'].includes(v.weather as string)) return null;
  const temp = typeof v.temp === 'number' && Number.isFinite(v.temp) && Math.abs(v.temp) < 60 ? Math.round(v.temp) : null;
  return { region: v.region, regionName: WEATHER_REGION_NAMES[v.region], weather: v.weather as Weather, temp };
}

let cached: { at: number; value: RealWeather } | null = null;
let pending: Promise<RealWeather | null> | null = null;

/** 마지막으로 받은 실제 날씨(고른 지역과 같을 때만). */
export function latestRealWeather(): RealWeather | null {
  const region = weatherRegion();
  return region && cached && cached.value.region === region ? cached.value : null;
}

/** 20분 안에 받은 값이 있으면 다시 묻지 않아요. 실패하면 null. */
export async function fetchRealWeather(now = Date.now()): Promise<RealWeather | null> {
  const region = weatherRegion();
  if (!region) return null;
  if (cached && cached.value.region === region && now - cached.at < FRESH_MS) return cached.value;
  if (pending) return pending;
  pending = request(`/api/weather?region=${encodeURIComponent(region)}`)
    .then(data => { const value = parseRealWeather(data); if (value) cached = { at: Date.now(), value }; return value; })
    .catch(() => null)
    .finally(() => { pending = null; });
  return pending;
}
