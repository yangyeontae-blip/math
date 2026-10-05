// 개발 서버에서만 불러오는 화면 점검 도구예요. 프로덕션 빌드에는 들어가지 않아요.
type Issue = { screen: string; kind: string; detail: string };
type Api = Record<string, (...args: never[]) => unknown> & { getState: () => unknown };

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const shown = (el: Element) => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !(el as HTMLElement).hidden; };
const label = (el: Element) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}${(el.textContent ?? '').trim().slice(0, 14) ? ` "${(el.textContent ?? '').trim().slice(0, 14)}"` : ''}`;

function inspect(screen: string): Issue[] {
  const issues: Issue[] = [], vw = innerWidth, vh = innerHeight, add = (kind: string, detail: string) => issues.push({ screen, kind, detail });
  if (document.documentElement.scrollWidth > vw + 1) add('page-overflow-x', `${document.documentElement.scrollWidth} > ${vw}`);
  const dialog = document.querySelector<HTMLDialogElement>('#modal'), open = !!dialog?.open, root: ParentNode = open ? dialog! : document.querySelector('#hud') ?? document;
  const box = open ? dialog!.getBoundingClientRect() : null;
  if (box && (box.left < -1 || box.right > vw + 1 || box.top < -1 || box.bottom > vh + 1)) add('modal-outside-screen', `${Math.round(box.left)},${Math.round(box.top)} → ${Math.round(box.right)},${Math.round(box.bottom)} in ${vw}x${vh}`);
  const small: string[] = [], clipped: string[] = [], overflowRight: string[] = [];
  root.querySelectorAll<HTMLElement>('button, input:not([type=hidden]), select, textarea').forEach(el => {
    if (!shown(el)) return; const r = (el.closest('label') ?? el).getBoundingClientRect();
    if (Math.min(r.width, r.height) < 44) small.push(`${label(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
  });
  root.querySelectorAll<HTMLElement>('*').forEach(el => {
    if (!shown(el)) return; const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (box && r.right > box.right + 2 && !el.closest('.close') && cs.position !== 'fixed') overflowRight.push(`${label(el)} +${Math.round(r.right - box.right)}px`);
    if (!box && r.right > vw + 2 && cs.position !== 'fixed' && !el.closest('.world-labels')) overflowRight.push(`${label(el)} +${Math.round(r.right - vw)}px`);
    if ((cs.overflowX === 'hidden' || cs.textOverflow === 'ellipsis') && el.children.length === 0 && el.scrollWidth > el.clientWidth + 2 && (el.textContent ?? '').trim()) clipped.push(`${label(el)} ${el.scrollWidth}>${el.clientWidth}`);
  });
  if (small.length) add('small-touch-target', `${small.length}: ${small.slice(0, 4).join(' | ')}`);
  if (overflowRight.length) add('overflow-right', `${overflowRight.length}: ${overflowRight.slice(0, 4).join(' | ')}`);
  if (clipped.length) add('clipped-text', `${clipped.length}: ${clipped.slice(0, 4).join(' | ')}`);
  if (open && dialog!.scrollHeight > dialog!.clientHeight + 2 && getComputedStyle(dialog!).overflowY === 'hidden') add('modal-cannot-scroll', `${dialog!.scrollHeight} > ${dialog!.clientHeight}`);
  return issues;
}

export function installAudit(api: Api) {
  const call = async (name: string, ...args: unknown[]): Promise<void> => { await (api[name] as unknown as (...a: unknown[]) => unknown)(...args); };
  const closeModal = async () => { const dialog = document.querySelector<HTMLDialogElement>('#modal'); if (dialog?.open) { (dialog.querySelector('[data-close]') as HTMLElement | null)?.click(); if (dialog.open) dialog.close(); await wait(250); } };
  const clickIn = async (selector: string) => { (document.querySelector(selector) as HTMLElement | null)?.click(); await wait(700); };
  const screens: [string, () => Promise<void> | void][] = [
    ['hud', async () => { await call('switchStage', 0, 'division'); await wait(1200); }],
    ['settings', () => call('openSettings')],
    ['inventory-weapon', () => call('openInventory', 'weapon')], ['inventory-outfit', () => call('openInventory', 'outfit')], ['inventory-ride', () => call('openInventory', 'ride')], ['inventory-pet', () => call('openInventory', 'pet')],
    ['weapon-shop', () => call('openShop', 'weapon')], ['outfit-shop', () => call('openShop', 'outfit')], ['ride-shop', () => call('openInventory', 'ride')], ['pet-shop', () => call('openPetShop')], ['guide', () => call('openGuide')], ['notebook', () => call('openNotebook')], ['room', () => call('openRoom')],
    ['stage-map', () => call('openStageMap')], ['forest-division', () => call('openStageMap', 'division')], ['forest-multiplication', () => call('openStageMap', 'multiplication')], ['forest-addition', () => call('openStageMap', 'addition')], ['forest-subtraction', () => call('openStageMap', 'subtraction')],
    ['unit-circle', async () => { await call('openCurriculumUnit', 'circle'); await wait(900); }],
    ['question-circle', async () => { await call('openCurriculumUnit', 'circle'); await wait(900); await clickIn('[data-mission="3"]'); }],
    ['question-fraction', async () => { await call('openCurriculumUnit', 'fraction'); await wait(900); await clickIn('[data-mission="2"]'); }],
    ['daily', () => call('openDaily')],
    ['arena', () => call('openArena')],
    ['arena-battle', async () => { call('openArena'); await wait(500); await clickIn('#arena-start'); }],
    ['hunt-picker', () => call('beginHuntBattle', 0, 'monster0')],
    ['hunt-battle', async () => { call('beginHuntBattle', 0, 'monster0'); await wait(500); await clickIn('#practice-go'); }],
  ];
  (window as unknown as Record<string, unknown>).__audit = async (only?: string[]) => {
    const issues: Issue[] = [], visited: string[] = [], errors: string[] = [];
    const onError = (e: ErrorEvent) => errors.push(e.message);
    const onRejection = (e: PromiseRejectionEvent) => errors.push(`Promise: ${String(e.reason)}`);
    window.addEventListener('error', onError); window.addEventListener('unhandledrejection', onRejection);
    for (const [name, open] of screens) {
      if (only && !only.includes(name)) continue;
      await closeModal(); try { await open(); } catch (e) { issues.push({ screen: name, kind: 'open-failed', detail: String(e) }); }
      await wait(600); issues.push(...inspect(name)); visited.push(name);
    }
    await closeModal(); window.removeEventListener('error', onError); window.removeEventListener('unhandledrejection', onRejection);
    return { viewport: `${innerWidth}x${innerHeight}`, coarse: matchMedia('(pointer: coarse)').matches, visited: visited.length, errors, issues };
  };
}
