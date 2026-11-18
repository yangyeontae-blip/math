import type { JobId, SkillId } from './academy';

export type CombatMotif = 'blade' | 'moon' | 'leaf' | 'flower' | 'tree' | 'flask' | 'crystal' | 'seal' | 'star' | 'crown' | 'galaxy' | 'arrow' | 'planet' | 'note' | 'wave' | 'shield' | 'wind';
export type CombatArt = { color: number; accent: number; motif: CombatMotif; petals: number; twist: number };
// Stable IDs follow the painted sigils, never the order of a player's loadout.
const art = (color: number, accent: number, motif: CombatMotif, petals: number, twist = 0): CombatArt => ({ color, accent, motif, petals, twist });
export const COMBAT_ART: Record<SkillId, CombatArt> = {
  shield: art(0x79dfff, 0xffefaf, 'shield', 6), wind: art(0x79f3ce, 0xeaffcf, 'wind', 3), lantern: art(0xffd267, 0xfff9d5, 'star', 4),
  crescent: art(0x83eaff, 0xfff6c0, 'moon', 3, -.45), charge: art(0x80eece, 0xffecaf, 'shield', 4), roots: art(0x91e85c, 0xffe69c, 'tree', 5), guardian: art(0x65e1ac, 0xfff2ab, 'shield', 8),
  starbolt: art(0xffd45d, 0xfff6dd, 'star', 5), frost: art(0x80e5ff, 0xeafcff, 'crystal', 6), vortex: art(0xff8651, 0xffec99, 'wind', 3, 1), starfall: art(0xbc9bff, 0xfff2af, 'star', 8),
  arrow: art(0x74edb7, 0xf8ffbc, 'arrow', 3), pierce: art(0x9bffb0, 0xffffff, 'arrow', 4), trap: art(0xa8e36b, 0xffd790, 'leaf', 6), storm: art(0x68dfff, 0xc2ffde, 'wind', 5),
  acornRush: art(0xffbb68, 0xfff0a2, 'blade', 3, .8), vinePull: art(0x63e98e, 0xecffa5, 'leaf', 3, -.7), dawnSlash: art(0xffbd62, 0xfff6c7, 'blade', 5, -.25),
  leafOrb: art(0x8bffb7, 0xe3ffc0, 'leaf', 4), thunderChain: art(0xffe455, 0xf1ffff, 'crystal', 3, .5), comet: art(0xff9957, 0xfff6bd, 'star', 5, .4),
  tripleShot: art(0xa4fbbb, 0xffedb1, 'arrow', 3, .2), galeShot: art(0x70ddf4, 0xe4ffed, 'wind', 4, -.7), moonArrow: art(0xc8b3ff, 0xf9f6ff, 'moon', 2),
  earthsong: art(0x81eb8e, 0xffe4a0, 'leaf', 3), moonseed: art(0xc2d7ff, 0xf7ffca, 'moon', 2, .3), bloomring: art(0xffa6d8, 0xffedac, 'flower', 6), ancientGrove: art(0x6eecb6, 0xffe6a1, 'tree', 7), worldroot: art(0x90ffbd, 0xffd67f, 'tree', 9),
  sparkFlask: art(0xffd475, 0xfffaaf, 'flask', 4), frostFlask: art(0x7bdbff, 0xddfaff, 'flask', 6), prismBurst: art(0xbd9dff, 0x9dfff2, 'crystal', 7), auroraSeal: art(0xb58bff, 0xffc6fc, 'seal', 8), starforge: art(0xffce6d, 0xffeece, 'star', 5),
  dawnCrown: art(0xffca63, 0xfff8ce, 'crown', 7), galaxyNova: art(0xae81ff, 0xffb8ed, 'galaxy', 9), skyTempest: art(0x85ddff, 0xe2ffed, 'arrow', 8),
  solarOath: art(0xffc254, 0xfff8db, 'blade', 12, -.2), cosmicGenesis: art(0xc29aff, 0x8df3ff, 'planet', 9, .6), celestialHunt: art(0x9acaff, 0xfff3cf, 'arrow', 11), everbloom: art(0xffa6d8, 0xb5ffd7, 'flower', 12), astralCrucible: art(0x9af3e7, 0xffd39f, 'flask', 10),
  noteBolt: art(0xffa5d8, 0xffdc78, 'note', 3), chordRing: art(0xffafd6, 0xffecaf, 'flower', 5), moonSonata: art(0xbbbdff, 0xffe7af, 'moon', 5), auroraAnthem: art(0x96efdf, 0xffbaff, 'note', 7), starlitFinale: art(0xffd56f, 0xffb7eb, 'star', 9), oceanSymphony: art(0x88dbff, 0xffd5ee, 'wave', 10),
};

export type AttackStyle = 'slash' | 'heavy' | 'thrust' | 'bow' | 'cast' | 'throw' | 'music';
export function attackStyle(job: JobId | null, weapon: number): AttackStyle {
  if (job === 'ranger') return 'bow'; if (job === 'bard') return 'music';
  if (job === 'mage' || job === 'druid') return 'cast'; if (job === 'alchemist') return 'throw';
  if ([1, 5, 8, 13, 16].includes(weapon)) return 'heavy';
  if ([4, 10].includes(weapon)) return 'thrust';
  if ([3, 6, 7, 11, 14, 15].includes(weapon) || weapon >= 27 && (weapon - 27) % 3 === 1) return 'cast';
  if (weapon >= 27 && (weapon - 27) % 3 === 2) return 'bow';
  return 'slash';
}

const ease = (t: number) => t * t * (3 - 2 * t);
/** anticipation -> release -> trail -> settle; strictly presentation, in seconds. */
export function attackPose(style: AttackStyle, elapsed: number, reduced = false) {
  const duration = style === 'heavy' ? .52 : .4, p = Math.max(0, Math.min(1, elapsed / duration));
  const keys = style === 'heavy' ? [0, -.85, 1.25, .22, 0] : [0, -.55, 1, .16, 0];
  const stops = [0, .24, .42, .66, 1]; let segment = 0;
  while (segment < 3 && p > stops[segment + 1]) segment++;
  const a = keys[segment], b = keys[segment + 1], swing = a + (b - a) * ease((p - stops[segment]) / (stops[segment + 1] - stops[segment]));
  return { swing: swing * (reduced ? .22 : 1), anticipation: p < .24, trail: p > .25 && p < .7, done: p >= 1, duration };
}
