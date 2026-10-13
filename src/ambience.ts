// 무작위 숲 분위기: 실제 시각과 관계없이 계절·하늘·날씨가 천천히 바뀌어요.
import type { Mood } from './audio';

export type Season = 'green' | 'autumn' | 'winter';
export type Weather = 'clear' | 'rain' | 'snow';
export type AmbienceScene = { mood: Mood; season: Season; weather: Weather };

const KEY = 'berry-forest-ambience-v1';
const DEFAULT_SCENE: AmbienceScene = { mood: 'day', season: 'green', weather: 'clear' };

export function ambienceEnabled(): boolean { try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; } }
export function setAmbience(on: boolean) { try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* 저장이 막혀 있어도 괜찮아요 */ } }

/** 테스트할 수 있도록 난수만 받아 한 장면을 만들어요. 실제 날짜·시각은 읽지 않아요. */
export function createAmbienceScene(random: () => number = Math.random): AmbienceScene {
  const seasonRoll = random();
  const season: Season = seasonRoll < .62 ? 'green' : seasonRoll < .84 ? 'autumn' : 'winter';
  const moodRoll = random();
  const mood: Mood = moodRoll < .7 ? 'day' : 'night';
  const weatherRoll = random();
  const weather: Weather = season === 'winter'
    ? (weatherRoll < .58 ? 'snow' : 'clear')
    : (weatherRoll < (season === 'autumn' ? .08 : .12) ? 'rain' : 'clear');
  return { mood, season, weather };
}

/** 한 장면은 2~4분 머물러 수학 문제를 푸는 동안 화면이 자주 바뀌지 않아요. */
export function ambienceDelay(random: () => number = Math.random): number {
  return 120_000 + Math.floor(random() * 120_001);
}

let current: AmbienceScene = DEFAULT_SCENE;
export function currentAmbience(): AmbienceScene { return { ...current }; }
export function randomizeAmbience(random: () => number = Math.random): AmbienceScene { current = createAmbienceScene(random); return currentAmbience(); }

/** 0~1 사이로 고르게 흩어지는 값이에요. 같은 i와 salt면 늘 같아서 장면이 안정적이고, 줄지어 서지 않아요. */
export function spread(i: number, salt: number): number {
  const v = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/** 실제 시간과 무관한 무작위 장면만 기억해요. 이펙트는 3D 월드 안에서 그립니다. */
export function applyAmbience(_host: HTMLElement, _before: Element | null, scene = current): AmbienceScene {
  current = { ...scene };
  _host.querySelectorAll('.ambience, .ambience-rain, .ambience-particles').forEach(el => el.remove());
  return currentAmbience();
}

export function ambienceLabel(scene = current): string {
  const season = { green: '🌿 초록빛', autumn: '🍂 가을', winter: '❄️ 겨울' }[scene.season];
  const mood = { day: '포근한 낮', night: '별빛 밤' }[scene.mood];
  const weather = scene.weather === 'snow' ? ' · 눈 내림' : scene.weather === 'rain' ? ' · 보슬비' : '';
  return `${season} · ${mood}${weather}`;
}

/** NPC 대사는 현재 무작위 장면을 따라가며 실제 시각은 사용하지 않아요. */
export function lineContext(): { night: boolean; rain: boolean } {
  if (!ambienceEnabled()) return { night: false, rain: false };
  return { night: current.mood === 'night', rain: current.weather === 'rain' };
}
