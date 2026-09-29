export type LocalRank = { nickname: string; completed: number };

export function parseLocalRanks(raw: string | null): LocalRank[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is LocalRank => !!item && typeof item === 'object'
      && typeof (item as LocalRank).nickname === 'string' && [...(item as LocalRank).nickname.trim()].length > 0
      && [...(item as LocalRank).nickname.trim()].length <= 10 && Number.isSafeInteger((item as LocalRank).completed)
      && (item as LocalRank).completed >= 0 && (item as LocalRank).completed <= 100_000_000)
      .map(item => ({ nickname: item.nickname.trim(), completed: item.completed }));
  } catch { return []; }
}

export function updateLocalRanks(ranks: LocalRank[], nickname: string, completed: number): LocalRank[] {
  const name = nickname.trim();
  if (!name || [...name].length > 10 || !Number.isSafeInteger(completed) || completed < 0) return ranks;
  const byName = new Map<string, number>();
  for (const rank of ranks) byName.set(rank.nickname, Math.max(byName.get(rank.nickname) ?? 0, rank.completed));
  byName.set(name, Math.max(byName.get(name) ?? 0, completed));
  return [...byName].map(([rankName, best]) => ({ nickname: rankName, completed: best }))
    .sort((a, b) => b.completed - a.completed || a.nickname.localeCompare(b.nickname, 'ko')).slice(0, 20);
}
