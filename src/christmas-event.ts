import { ambienceEnabled } from './ambience';

export const CHRISTMAS_END = Date.parse('2026-12-26T00:00:00+09:00');

/** Uses the existing seasonal-event preference, never a new save field.
 * The explicit preview URL overrides both expiry and the preference. */
export function christmasActive(now = Date.now(), settings: { seasonalEvents?: boolean; search?: string } = {}): boolean {
  const search = settings.search ?? (typeof location === 'undefined' ? '' : location.search);
  return new URLSearchParams(search).get('event') === 'christmas'
    || (now < CHRISTMAS_END && (settings.seasonalEvents ?? ambienceEnabled()));
}

export function christmasNotice(): string {
  return christmasActive() ? `<section class="christmas-notice"><img src="${import.meta.env.BASE_URL}art/christmas/hero.webp" width="1500" height="500" alt="눈 덮인 광장 분수와 크리스마스 트리"><h3>중앙 광장의 포근한 크리스마스</h3><p>2026년 12월 25일 밤 11시 59분까지, 광장에서 겨울 장식을 만나 보세요.</p></section>` : '';
}
