export type Mood = 'day' | 'dusk' | 'night';
/** 지금 시각(0~23)에 어울리는 분위기: 낮, 노을, 밤. */
export function moodForHour(hour: number): Mood { return hour >= 6 && hour < 17 ? 'day' : hour >= 17 && hour < 20 ? 'dusk' : 'night'; }

// 분위기마다 선율, 느리기, 밝기가 달라요. 모두 잔잔한 숲속 멜로디예요.
const MELODIES: Record<Mood, { notes: number[]; bass: number[]; every: number; volume: number }> = {
  day: { notes: [523, 659, 784, 659, 587, 659, 523, 0, 440, 523, 659, 587, 523, 392, 440, 0], bass: [131, 175, 147, 196], every: 470, volume: .022 },
  dusk: { notes: [440, 523, 659, 523, 494, 523, 440, 0, 392, 440, 523, 494, 440, 330, 392, 0], bass: [110, 147, 131, 165], every: 560, volume: .02 },
  night: { notes: [392, 0, 494, 0, 440, 0, 392, 0, 330, 0, 392, 440, 392, 0, 294, 0], bass: [98, 131, 110, 147], every: 700, volume: .017 }
};

export class Sound {
  private ctx?: AudioContext;
  private timer?: ReturnType<typeof setInterval>;
  music = true; effects = true; private step = 0; private mood: Mood = 'day';
  start() { this.ctx ??= new AudioContext(); void this.ctx.resume(); this.restartTimer(); }
  setMood(mood: Mood) { if (mood === this.mood) return; this.mood = mood; this.step = 0; if (this.timer) this.restartTimer(); }
  private restartTimer() { if (this.timer) clearInterval(this.timer); this.timer = setInterval(() => this.background(), MELODIES[this.mood].every); }
  private note(freq: number, length: number, volume: number, delay = 0, type: OscillatorType = 'sine') {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const at = this.ctx.currentTime + delay, osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.type = type; osc.frequency.value = freq; gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(volume, at + .02); gain.gain.exponentialRampToValueAtTime(.001, at + length);
    osc.connect(gain); gain.connect(this.ctx.destination); osc.start(at); osc.stop(at + length + .02);
  }
  private background() {
    if (!this.music || document.hidden) return;
    const m = MELODIES[this.mood], n = m.notes[this.step++ % m.notes.length]; if (n) this.note(n, .8, m.volume);
    if (this.step % 4 === 0) this.note(m.bass[Math.floor(this.step / 4) % 4], 1.6, m.volume + .003);
  }
  /** 말풍선에서 글자가 나올 때 나는 작은 '뽀로롱' 소리 (높이를 조금씩 바꿔요). */
  talk(seed: number) {
    if (!this.effects) return;
    this.note([392, 440, 494, 523, 587][Math.abs(seed) % 5], .09, .018, 0, 'triangle');
  }
  play(kind: 'berry' | 'correct' | 'wrong' | 'level' | 'buy' | 'jump' | 'swing' | 'chop') {
    if (!this.effects) return;
    if (kind === 'correct') { [523, 659, 784, 1047].forEach((n, i) => { this.note(n, .45, .04, i * .09, 'triangle'); this.note(n * 2, .3, .012, i * .09 + .01); }); return; }
    if (kind === 'wrong') { [330, 262].forEach((n, i) => this.note(n, .32, .03, i * .14, 'triangle')); return; }
    const notes = { berry: [880, 1175], level: [523, 659, 784, 1047], buy: [659, 880], jump: [392, 523], swing: [260], chop: [180, 240] }[kind];
    notes.forEach((n, i) => this.note(n, .28, .05, i * .1));
  }
}
