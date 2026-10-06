// 시간대·날씨 분위기: 화면 위에 살짝 색을 입히는 장식이에요. 학습·저장과는 관계없어요.
import { moodForHour, type Mood } from './audio';

export type Weather = 'clear' | 'rain';
const KEY = 'berry-forest-ambience-v1';

export function ambienceEnabled(): boolean { try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; } }
export function setAmbience(on: boolean) { try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* 저장이 막혀 있어도 괜찮아요 */ } }

/** 같은 날에는 같은 날씨가 나와요. 대략 여섯 날에 하루쯤 비가 와요. */
export function weatherForDate(date: Date): Weather {
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  return (day * 2654435761 >>> 0) % 6 === 0 ? 'rain' : 'clear';
}

let layer: HTMLDivElement | null = null, rain: HTMLDivElement | null = null;

/** 분위기 덮개를 켜거나 끄고, 지금 시각과 날씨에 맞게 바꿔요. */
export function applyAmbience(host: HTMLElement, before: Element | null, now = new Date()): { mood: Mood; weather: Weather } {
  const mood = moodForHour(now.getHours()), weather = weatherForDate(now);
  if (!ambienceEnabled()) { layer?.remove(); rain?.remove(); layer = rain = null; return { mood, weather }; }
  if (!layer) {
    layer = document.createElement('div'); layer.className = 'ambience'; layer.setAttribute('aria-hidden', 'true');
    rain = document.createElement('div'); rain.className = 'ambience-rain'; rain.setAttribute('aria-hidden', 'true');
    host.insertBefore(layer, before); host.insertBefore(rain, before);
  }
  layer.dataset.mood = mood; layer.dataset.weather = weather; if (rain) rain.dataset.weather = weather;
  return { mood, weather };
}

/** 말풍선 대사에 쓸 지금 분위기예요. 분위기 설정을 끄면 낮·맑음으로 쳐요. */
export function lineContext(now = new Date()): { night: boolean; rain: boolean } {
  if (!ambienceEnabled()) return { night: false, rain: false };
  return { night: moodForHour(now.getHours()) === 'night', rain: weatherForDate(now) === 'rain' };
}
