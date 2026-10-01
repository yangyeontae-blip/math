type Store = Pick<Storage, 'getItem' | 'setItem'>;

const BACKUP_KEY = 'berry-forest-last-backup-v1', REMIND_KEY = 'berry-forest-backup-reminded-v1';
const DAY = 86_400_000, BACKUP_EVERY_DAYS = 7, MIN_LEVEL_TO_REMIND = 3;

function read(storage: Store, key: string) {
  try { const value = Number(storage.getItem(key)); return Number.isFinite(value) && value > 0 ? value : 0; } catch { return 0; }
}
function write(storage: Store, key: string, value: number) { try { storage.setItem(key, String(value)); } catch { /* 저장 공간이 없어도 게임은 계속돼요 */ } }

/** 저장 파일을 내려받은 시각을 기록해요. */
export function markBackup(storage: Store, now = Date.now()) { write(storage, BACKUP_KEY, now); }

/** 저장 파일을 7일 넘게 내려받지 않았다면 하루에 한 번만 알려 줘요. 막 시작한 모험(레벨 3 미만)은 잃을 것이 적어 알리지 않아요. */
export function shouldRemindBackup(storage: Store, level: number, now = Date.now()): boolean {
  if (level < MIN_LEVEL_TO_REMIND) return false;
  if (now - read(storage, BACKUP_KEY) < BACKUP_EVERY_DAYS * DAY) return false;
  if (now - read(storage, REMIND_KEY) < DAY) return false;
  write(storage, REMIND_KEY, now);
  return true;
}
