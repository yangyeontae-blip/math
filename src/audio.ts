export type Mood = 'day' | 'night';
/** 지금 시각(0~23)에 어울리는 분위기: 낮과 별빛 밤. */
export function moodForHour(hour: number): Mood { return hour >= 6 && hour < 20 ? 'day' : 'night'; }

/** 배경음악이 바뀌는 장소: 마을, 네 숲, 시합. */
export type Scene = 'village' | 'addition' | 'subtraction' | 'multiplication' | 'division';
type Melody = { notes: number[]; bass: number[]; every: number; volume: number };

// 장소마다 선율, 빠르기, 밝기가 달라요. 모두 잔잔한 숲속 멜로디예요.
const DAY: Record<Scene, Melody> = {
  village: { notes: [523, 659, 784, 659, 587, 659, 523, 0, 440, 523, 659, 587, 523, 392, 440, 0], bass: [131, 175, 147, 196], every: 470, volume: .022 },
  addition: { notes: [587, 740, 880, 740, 659, 740, 587, 0, 494, 587, 740, 659, 587, 440, 494, 0], bass: [147, 196, 165, 220], every: 420, volume: .021 },
  subtraction: { notes: [440, 523, 659, 587, 523, 440, 392, 0, 349, 440, 523, 494, 440, 330, 392, 0], bass: [110, 147, 131, 165], every: 560, volume: .02 },
  multiplication: { notes: [659, 784, 988, 784, 880, 784, 659, 0, 587, 659, 784, 880, 784, 659, 587, 0], bass: [165, 220, 196, 247], every: 380, volume: .019 },
  division: { notes: [494, 0, 587, 659, 587, 0, 494, 440, 392, 0, 494, 587, 494, 440, 392, 0], bass: [123, 165, 147, 196], every: 500, volume: .021 },
};
const NIGHT: Melody = { notes: [392, 0, 494, 0, 440, 0, 392, 0, 330, 0, 392, 440, 392, 0, 294, 0], bass: [98, 131, 110, 147], every: 700, volume: .017 };
const BATTLE: Melody = { notes: [659, 784, 880, 784, 659, 587, 659, 0, 523, 587, 659, 784, 659, 587, 523, 0], bass: [165, 196, 147, 196], every: 260, volume: .018 };

export class Sound {
  private ctx?: AudioContext;
  private timer?: ReturnType<typeof setInterval>;
  music = true; effects = true; private step = 0; private mood: Mood = 'day'; private scene: Scene = 'village'; private battle = false; private watching = false;
  start() {
    this.ctx ??= new AudioContext(); void this.ctx.resume(); this.restartTimer();
    // 앱을 내렸다 다시 열면(특히 iOS) 소리가 멈춰 있을 수 있어서 다시 깨워요.
    if (!this.watching) { this.watching = true; document.addEventListener('visibilitychange', () => { if (!document.hidden) void this.ctx?.resume(); }); }
  }
  setMood(mood: Mood) { if (mood === this.mood) return; this.mood = mood; this.step = 0; if (this.timer) this.restartTimer(); }
  setScene(scene: Scene) { if (scene === this.scene) return; this.scene = scene; this.step = 0; if (this.timer) this.restartTimer(); }
  setBattle(battle: boolean) { if (battle === this.battle) return; this.battle = battle; this.step = 0; if (this.timer) this.restartTimer(); }
  private get melody(): Melody { return this.battle ? BATTLE : this.mood === 'night' ? NIGHT : DAY[this.scene]; }
  private restartTimer() { if (this.timer) clearInterval(this.timer); this.timer = setInterval(() => this.background(), this.melody.every); }
  private note(freq: number, length: number, volume: number, delay = 0, type: OscillatorType = 'sine') {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const at = this.ctx.currentTime + delay, osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.type = type; osc.frequency.value = freq; gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(volume, at + .02); gain.gain.exponentialRampToValueAtTime(.001, at + length);
    osc.connect(gain); gain.connect(this.ctx.destination); osc.start(at); osc.stop(at + length + .02);
  }
  private background() {
    if (!this.music || document.hidden) return;
    const m = this.melody, n = m.notes[this.step++ % m.notes.length]; if (n) this.note(n, this.battle ? .4 : .8, m.volume, 0, this.battle ? 'triangle' : 'sine');
    if (this.step % 4 === 0) this.note(m.bass[Math.floor(this.step / 4) % 4], this.battle ? .8 : 1.6, m.volume + .003);
  }
  /** 말풍선에서 글자가 나올 때 나는 작은 '뽀로롱' 소리 (높이를 조금씩 바꿔요). */
  talk(seed: number) {
    if (!this.effects) return;
    this.note([392, 440, 494, 523, 587][Math.abs(seed) % 5], .09, .018, 0, 'triangle');
  }
  /** 정답으로 몬스터를 맞힐 때: 연속 정답일수록 조금씩 높아져요. */
  hit(streak: number) {
    if (!this.effects) return; const lift = Math.min(streak, 6) * 40;
    this.note(196, .12, .05, 0, 'square'); this.note(660 + lift, .18, .03, .05, 'triangle'); if (streak >= 3) this.note(990 + lift, .22, .02, .12);
  }
  play(kind: 'berry' | 'correct' | 'wrong' | 'level' | 'buy' | 'jump' | 'swing' | 'chop' | 'victory') {
    if (!this.effects) return;
    if (kind === 'correct') { [523, 659, 784, 1047].forEach((n, i) => { this.note(n, .45, .04, i * .09, 'triangle'); this.note(n * 2, .3, .012, i * .09 + .01); }); return; }
    if (kind === 'victory') { [[523, 0], [659, .12], [784, .24], [1047, .36], [784, .56], [1047, .68]].forEach(([n, t]) => { this.note(n, .5, .04, t, 'triangle'); this.note(n / 2, .5, .015, t); }); return; }
    if (kind === 'wrong') { [330, 262].forEach((n, i) => this.note(n, .32, .03, i * .14, 'triangle')); return; }
    const notes = { berry: [880, 1175], level: [523, 659, 784, 1047], buy: [659, 880], jump: [392, 523], swing: [260], chop: [180, 240] }[kind];
    notes.forEach((n, i) => this.note(n, .28, .05, i * .1));
  }
}
