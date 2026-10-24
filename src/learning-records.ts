import type { CurriculumUnitId } from './rules';
type Store = Pick<Storage, 'getItem' | 'setItem'>;
export interface ResolutionCounts { independent: number; assisted: number; retried: number }
export interface LearningRecords { version: 1; units: Partial<Record<CurriculumUnitId, ResolutionCounts>> }
export const LEARNING_RECORDS_KEY = 'berry-forest-learning-resolutions-v1';
const empty = (): LearningRecords => ({ version: 1, units: {} });
const count = (n: unknown) => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 && n <= 1e9;
export function readLearningRecords(storage: Store): LearningRecords {
  try {
    const value = JSON.parse(storage.getItem(LEARNING_RECORDS_KEY) ?? 'null');
    if (value?.version !== 1 || !value.units || typeof value.units !== 'object' || Array.isArray(value.units)) return empty();
    if (Object.values(value.units).some((v: any) => !v || !count(v.independent) || !count(v.assisted) || !count(v.retried))) return empty();
    return value;
  } catch { return empty(); }
}
export function recordResolution(storage: Store, unit: CurriculumUnitId, missed: boolean, helped: boolean) {
  const records = readLearningRecords(storage), row = records.units[unit] ??= { independent: 0, assisted: 0, retried: 0 };
  row[missed ? 'retried' : helped ? 'assisted' : 'independent']++;
  try { storage.setItem(LEARNING_RECORDS_KEY, JSON.stringify(records)); } catch { /* Core save remains independent. */ }
}
/** A new adventure/import starts new supplemental records; purchases are never reset. */
export function resetLearningRecords(storage: Store) { try { storage.setItem(LEARNING_RECORDS_KEY, JSON.stringify(empty())); } catch { /* optional */ } }
