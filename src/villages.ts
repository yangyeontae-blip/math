import type { ForestKind, NewCurriculumUnitId } from './rules';

export type VillageThemeId = ForestKind | NewCurriculumUnitId;
export type VillageDeco = 'none' | 'sunflower' | 'apple' | 'leaves' | 'shapes' | 'clock' | 'decimal' | 'moon' | 'cake' | 'scales' | 'stars';
export interface VillageTheme { name: string; icon: string; blurb: string; sky: number; ground: number; groundDeep: number; path: number; square: number; foliage?: number; pinkTrees: boolean; gate: number; deco: VillageDeco }

export const VILLAGE_THEMES: Record<VillageThemeId, VillageTheme> = {
  division: { name: '베리숲 마을', icon: '❋', blurb: '딸기 향이 솔솔 나는 나눗셈 마을', sky: 0xd0eade, ground: 0x8cbc65, groundDeep: 0x719d55, path: 0xe4ce9f, square: 0xe9d6ad, pinkTrees: false, gate: 0x9e78c9, deco: 'none' },
  multiplication: { name: '해바라기 마을', icon: '🌻', blurb: '해바라기가 가득한 곱셈 마을', sky: 0xffe9bf, ground: 0xa9c85f, groundDeep: 0x869f48, path: 0xf0d28a, square: 0xf6dfa0, foliage: 0x8dbb65, pinkTrees: false, gate: 0xe5a743, deco: 'sunflower' },
  addition: { name: '사과 마을', icon: '🍎', blurb: '빨간 사과가 주렁주렁 열린 덧셈 마을', sky: 0xfdf0c8, ground: 0xa6cc6a, groundDeep: 0x82a653, path: 0xf0c9a8, square: 0xf7dcc0, foliage: 0x7dbd5d, pinkTrees: false, gate: 0xe86f68, deco: 'apple' },
  subtraction: { name: '낙엽 마을', icon: '🍂', blurb: '낙엽이 사각사각 쌓인 뺄셈 마을', sky: 0xf8dcc0, ground: 0xcbb26c, groundDeep: 0xa98e4f, path: 0xe2b078, square: 0xedc795, foliage: 0xd98a44, pinkTrees: false, gate: 0xd98a44, deco: 'leaves' },
  plane: { name: '도형 마을', icon: '📐', blurb: '세모와 네모 길이 이어지는 평면도형 마을', sky: 0xdff0ff, ground: 0x91c7ae, groundDeep: 0x69a188, path: 0xf0d6a5, square: 0xf8e3bb, foliage: 0x68b68d, pinkTrees: false, gate: 0x5f9fc7, deco: 'shapes' },
  lengthTime: { name: '시계 마을', icon: '🕰️', blurb: '자와 시계가 똑딱이는 길이·시간 마을', sky: 0xffedc9, ground: 0xa9c879, groundDeep: 0x819d5b, path: 0xdabf91, square: 0xead6ad, foliage: 0x8ab46c, pinkTrees: false, gate: 0xd79a55, deco: 'clock' },
  fractionDecimal: { name: '소수 마을', icon: '🔟', blurb: '열 칸 눈금과 분수 조각이 반짝이는 마을', sky: 0xefe2ff, ground: 0xb6a5d5, groundDeep: 0x8f7db3, path: 0xffe0c3, square: 0xffead4, foliage: 0xa995cf, pinkTrees: true, gate: 0xaa7ac5, deco: 'decimal' },
  circle: { name: '달빛 마을', icon: '🌙', blurb: '둥근 달빛 무늬가 반짝이는 원의 마을', sky: 0xd6dbf4, ground: 0x9cb6d6, groundDeep: 0x7f9bbd, path: 0xe9e2f4, square: 0xf1ecfa, foliage: 0x93a9d8, pinkTrees: false, gate: 0x8f86d8, deco: 'moon' },
  fraction: { name: '케이크 마을', icon: '🍰', blurb: '달콤한 케이크를 똑같이 나누는 분수 마을', sky: 0xffe5ee, ground: 0xf1c9cd, groundDeep: 0xd9a6ae, path: 0xfff0d6, square: 0xfff6e4, foliage: 0xf4a6bf, pinkTrees: true, gate: 0xf08fa8, deco: 'cake' },
  measurement: { name: '저울 마을', icon: '⚖️', blurb: '물약병과 저울이 반짝이는 들이·무게 마을', sky: 0xdff4f5, ground: 0x9fd3cf, groundDeep: 0x7db7b3, path: 0xf2ecd2, square: 0xf7f3df, foliage: 0x6fbfa7, pinkTrees: false, gate: 0x4fb5b8, deco: 'scales' },
  pictograph: { name: '별빛 마을', icon: '🔭', blurb: '별을 세어 그림그래프를 그리는 관측소 마을', sky: 0xdedcf8, ground: 0x959fe0, groundDeep: 0x7882c4, path: 0xe7e3fa, square: 0xf0edfd, foliage: 0x8f90d8, pinkTrees: false, gate: 0x8a74d6, deco: 'stars' },
};

export function villageThemeId(s: { forest: ForestKind; hub?: NewCurriculumUnitId }): VillageThemeId { return s.hub ?? s.forest; }
