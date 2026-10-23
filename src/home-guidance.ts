import type { Save } from './rules';
import { HOME_ITEMS, HOME_REQUESTS, STARTER_BLUEPRINTS, blueprintIds, requestReady } from './homestead';

export function requestChecklist(s: Save, id: number, full: boolean) {
  const blueprints = blueprintIds(s.exploration.solved.length);
  return HOME_REQUESTS[id].needs.map(group => {
    const placed = group.find(kind => s.homestead.objects.some(o => o.kind === kind));
    const usable = group.filter(kind => (full || STARTER_BLUEPRINTS.includes(kind)) && (s.homestead.owned[kind] > 0 || blueprints.includes(kind)));
    const kind = placed ?? usable.find(kind => s.homestead.owned[kind] > 0) ?? usable[0];
    return { placed: placed !== undefined, kind, names: group.map(kind => HOME_ITEMS[kind].name).join(' 또는 ') };
  });
}

export function homeRecommendation(s: Save, full: boolean) {
  const pending = HOME_REQUESTS.map((_, id) => id).filter(id => !s.homestead.memories.includes(id));
  const id = pending.find(id => requestReady(s, id)) ?? pending.find(id => requestChecklist(s, id, full).every(item => item.kind !== undefined));
  if (id === undefined) return { action: pending.length && full ? 'discover' : 'free', label: pending.length && full ? '숲에서 발견하고 다음 정원 도안 열기' : '정원을 자유롭게 꾸미고 주민과 쉬기' } as const;
  const missing = requestChecklist(s, id, full).find(item => !item.placed);
  if (!missing) return { id, action: 'request', label: '주민의 부탁 완성하기' } as const;
  const kind = missing.kind!;
  return { id, kind, action: 'design', label: id === 0 && kind === 18 ? '벤치를 놓아 첫 부탁 준비하기' : `${HOME_ITEMS[kind].name} 놓고 ‘${HOME_REQUESTS[id].title}’ 준비하기` } as const;
}
