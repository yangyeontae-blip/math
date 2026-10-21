export class UnicodeProcessor { constructor(indexer: number[]); }
export class Style { constructor(ttl: unknown, dp: unknown); }
export class TextToSpeech {
  constructor(config: any, processor: UnicodeProcessor, dp: unknown, encoder: unknown, estimator: unknown, vocoder: unknown);
  sampleRate: number;
  call(text: string, language: string, style: Style, steps: number, speed?: number): Promise<{wav:number[];duration:number[]}>;
}
