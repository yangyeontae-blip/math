export class Sound {
  private ctx?: AudioContext;
  private timer?: ReturnType<typeof setInterval>;
  music = true; effects = true; private step = 0;
  start() { this.ctx ??= new AudioContext(); void this.ctx.resume(); this.timer ??= setInterval(() => this.background(), 470); }
  private note(freq: number, length: number, volume: number, delay = 0, type: OscillatorType = 'sine') {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const at = this.ctx.currentTime + delay, osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.type = type; osc.frequency.value = freq; gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(volume, at + .02); gain.gain.exponentialRampToValueAtTime(.001, at + length);
    osc.connect(gain); gain.connect(this.ctx.destination); osc.start(at); osc.stop(at + length + .02);
  }
  private background() {
    if (!this.music || document.hidden) return;
    const melody = [523, 659, 784, 659, 587, 659, 523, 0, 440, 523, 659, 587, 523, 392, 440, 0];
    const n = melody[this.step++ % melody.length]; if (n) this.note(n, .8, .022);
    if (this.step % 4 === 0) this.note([131, 175, 147, 196][Math.floor(this.step / 4) % 4], 1.6, .025);
  }
  play(kind: 'berry' | 'correct' | 'wrong' | 'level' | 'buy' | 'jump') {
    if (!this.effects) return;
    const notes = { berry: [880, 1175], correct: [523, 659, 784], wrong: [330, 294], level: [523, 659, 784, 1047], buy: [659, 880], jump: [392, 523] }[kind];
    notes.forEach((n, i) => this.note(n, .28, .05, i * .1));
  }
}
