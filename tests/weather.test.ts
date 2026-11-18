import assert from 'node:assert/strict';
import test from 'node:test';
import { withRealWeather } from '../src/ambience.ts';
import { parseRealWeather } from '../src/weather-client.ts';
// @ts-expect-error 서버 코드는 JS예요.
import { handleWeather, kmaBaseTime, parseKma, weatherFromKma } from '../worker/weather.js';

const kma = (pty: string, t1h: string) => ({ response: { header: { resultCode: '00' }, body: { items: { item: [{ category: 'PTY', obsrValue: pty }, { category: 'T1H', obsrValue: t1h }] } } } });
const helpers = {
  json: (_r: Request, value: unknown, status = 200) => new Response(JSON.stringify(value), { status }),
  corsHeaders: () => ({}),
};

test('real weather only replaces the weather and never darkens the forest', () => {
  const night = { mood: 'night' as const, season: 'green' as const, weather: 'clear' as const };
  assert.deepEqual(withRealWeather(night, null), night);
  assert.deepEqual(withRealWeather(night, { weather: 'rain' }), { ...night, weather: 'rain' });
  assert.deepEqual(withRealWeather(night, { weather: 'snow' }), { mood: 'night', season: 'winter', weather: 'snow' });
  assert.equal(withRealWeather({ mood: 'day', season: 'winter', weather: 'snow' }, { weather: 'rain' }).season, 'autumn');
});

test('KMA precipitation codes map to forest weather', () => {
  assert.equal(weatherFromKma('0', 10), 'clear');
  assert.equal(weatherFromKma('1', 10), 'rain');
  assert.equal(weatherFromKma('5', 10), 'rain');
  assert.equal(weatherFromKma('3', -2), 'snow');
  assert.equal(weatherFromKma('2', 0.5), 'snow');
  assert.equal(weatherFromKma('2', 4), 'rain');
  assert.deepEqual(parseKma(kma('1', '7.3')), { weather: 'rain', temp: 7.3 });
  assert.equal(parseKma({ response: { header: { resultCode: '03' } } }), null);
});

test('base time uses the previous hour until data is published at :45 (KST)', () => {
  assert.deepEqual(kmaBaseTime(Date.UTC(2026, 10, 18, 3, 30)), { baseDate: '20261118', baseTime: '1100' });
  assert.deepEqual(kmaBaseTime(Date.UTC(2026, 10, 18, 3, 50)), { baseDate: '20261118', baseTime: '1200' });
  assert.deepEqual(kmaBaseTime(Date.UTC(2026, 10, 17, 15, 10)), { baseDate: '20261117', baseTime: '2300' });
});

test('weather endpoint keeps the key on the server and degrades safely', async () => {
  const req = (region = 'seoul') => new Request(`https://x/api/weather?region=${region}`);
  assert.equal((await handleWeather(req(), {}, helpers)).status, 503);
  assert.equal((await handleWeather(req('mars'), { KMA_SERVICE_KEY: 'k' }, helpers)).status, 400);
  let asked = '';
  const ok = await handleWeather(req('busan'), { KMA_SERVICE_KEY: 'secret' }, helpers, async (url: string) => { asked = url; return new Response(JSON.stringify(kma('3', '-1'))); }, Date.UTC(2026, 10, 18, 3, 50));
  const body = await ok.json();
  assert.equal(body.weather, 'snow'); assert.equal(body.regionName, '부산'); assert.ok(!JSON.stringify(body).includes('secret'));
  assert.match(asked, /nx=98&ny=76/);
  const broken = await handleWeather(req('jeju'), { KMA_SERVICE_KEY: 'k' }, helpers, async () => { throw new Error('down'); }, Date.UTC(2026, 10, 18, 3, 50));
  assert.equal(broken.status, 502);
});

test('client accepts only well-formed weather from the server', () => {
  assert.deepEqual(parseRealWeather({ region: 'seoul', weather: 'rain', temp: 3.6 }), { region: 'seoul', regionName: '서울', weather: 'rain', temp: 4 });
  assert.equal(parseRealWeather({ region: 'seoul', weather: 'hail' }), null);
  assert.equal(parseRealWeather({ region: 'nowhere', weather: 'clear' }), null);
  assert.equal(parseRealWeather({ error: '준비 중' }), null);
});
