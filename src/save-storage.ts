/** Recovery copies use separate keys and never accept unvalidated data. */
export type SaveStatus = 'saved' | 'error' | 'recovered';
type Store = Pick<Storage, 'getItem' | 'setItem'>;
export class SafeSaveStore<T> {
  status: SaveStatus = 'saved';
  private lastRaw: string | null = null;
  private checkpointAt = 0;
  constructor(private storage: () => Store, readonly key: string, private validate: (value: unknown) => T) {}
  private parse(raw: string | null): T | null { return raw ? this.validate(JSON.parse(raw)) : null; }
  checkpoint(): T | null { try { return this.parse(this.storage().getItem(`${this.key}-checkpoint`)); } catch { return null; } }
  load(): T | null {
    try { const raw = this.storage().getItem(this.key); const value = this.parse(raw); this.lastRaw = raw; return value; }
    catch { const backup = this.checkpoint(); this.status = backup ? 'recovered' : 'error'; return backup; }
  }
  write(value: T, now = Date.now()): boolean {
    try {
      const raw = JSON.stringify(value);
      if (raw === this.lastRaw && this.status === 'saved') return false;
      const store = this.storage(), previous = store.getItem(this.key);
      // A broken current record must never replace a valid recovery copy.
      if (previous && previous !== raw && (!this.checkpointAt || now - this.checkpointAt >= 30_000)) {
        try { this.parse(previous); store.setItem(`${this.key}-checkpoint`, previous); this.checkpointAt = now; } catch { /* Keep the previous checkpoint. */ }
      }
      store.setItem(this.key, raw); this.lastRaw = raw; this.status = 'saved'; return true;
    } catch { this.status = 'error'; return false; }
  }
}
