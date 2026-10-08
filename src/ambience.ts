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
  const mood: Mood = moodRoll < .58 ? 'day' : moodRoll < .82 ? 'dusk' : 'night';
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
let layer: HTMLDivElement | null = null;
let rain: HTMLDivElement | null = null;
let particles: HTMLDivElement | null = null;

export function currentAmbience(): AmbienceScene { return { ...current }; }
export function randomizeAmbience(random: () => number = Math.random): AmbienceScene { current = createAmbienceScene(random); return currentAmbience(); }

function removeLayers(host: HTMLElement) {
  layer?.remove(); rain?.remove(); particles?.remove();
  layer = rain = particles = null;
  host.ownerDocument.querySelectorAll('.ambience, .ambience-rain, .ambience-particles').forEach(el => el.remove());
}

/** 현재 무작위 장면을 게임 화면에 입혀요. HUD보다 뒤에 들어가 글자와 버튼은 선명하게 유지돼요. */
export function applyAmbience(host: HTMLElement, before: Element | null, scene = current): AmbienceScene {
  current = { ...scene };
  if (!ambienceEnabled()) { removeLayers(host); return currentAmbience(); }
  if (!layer || !layer.isConnected) {
    removeLayers(host);
    layer = document.createElement('div'); layer.className = 'ambience'; layer.setAttribute('aria-hidden', 'true');
    rain = document.createElement('div'); rain.className = 'ambience-rain'; rain.setAttribute('aria-hidden', 'true');
    particles = document.createElement('div'); particles.className = 'ambience-particles'; particles.setAttribute('aria-hidden', 'true');
    host.insertBefore(layer, before); host.insertBefore(rain, before); host.insertBefore(particles, before);
  }
  layer.dataset.mood = current.mood; layer.dataset.season = current.season; layer.dataset.weather = current.weather;
  if (rain) rain.dataset.weather = current.weather;
  if (particles) particles.dataset.effect = current.weather === 'snow' ? 'snow' : current.season === 'autumn' ? 'leaves' : current.mood === 'night' ? 'stars' : 'none';
  return currentAmbience();
}

export function ambienceLabel(scene = current): string {
  const season = { green: '🌿 초록빛', autumn: '🍂 가을', winter: '❄️ 겨울' }[scene.season];
  const mood = { day: '포근한 낮', dusk: '노을 지는 숲', night: '별빛 밤' }[scene.mood];
  const weather = scene.weather === 'snow' ? ' · 눈 내림' : scene.weather === 'rain' ? ' · 보슬비' : '';
  return `${season} · ${mood}${weather}`;
}

/** NPC 대사는 현재 무작위 장면을 따라가며 실제 시각은 사용하지 않아요. */
export function lineContext(): { night: boolean; rain: boolean } {
  if (!ambienceEnabled()) return { night: false, rain: false };
  return { night: current.mood === 'night', rain: current.weather === 'rain' };
}
