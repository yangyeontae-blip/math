export const STAGES = [
  { name: '새싹 들판', subtitle: '첫 발걸음이 자라는 초록 들판', ground: 0x98c978, foliage: 0x72b67a, sky: 0xc9e7d4, accent: 0xe4ce9f, theme: 'meadow' },
  { name: '버섯 오솔길', subtitle: '커다란 버섯 사이로 난 구불구불한 길', ground: 0x9cbe7b, foliage: 0x79a06d, sky: 0xd5e4d0, accent: 0xeac0ab, theme: 'mushroom' },
  { name: '벚꽃 언덕', subtitle: '꽃비가 내리는 분홍빛 언덕', ground: 0xb8cc8b, foliage: 0xe7a1b6, sky: 0xf3dfe6, accent: 0xead4c3, theme: 'blossom' },
  { name: '반짝 호숫길', subtitle: '푸른 호수를 따라 숨은 베리 찾기', ground: 0x8fbf9a, foliage: 0x67a89b, sky: 0xc6e8ef, accent: 0xd8d8b0, theme: 'lake' },
  { name: '도토리 숲', subtitle: '금빛 나무와 도토리 정령의 고향', ground: 0xbabc74, foliage: 0xd9ac5b, sky: 0xeee2c2, accent: 0xe3c496, theme: 'autumn' },
  { name: '구름 정원', subtitle: '폭신한 구름 아래 펼쳐진 높은 정원', ground: 0xb7d8b5, foliage: 0x9bcbb6, sky: 0xdceefa, accent: 0xede8d0, theme: 'cloud' },
  { name: '달빛 수정숲', subtitle: '연보라 수정이 길을 비추는 숲', ground: 0x979ec0, foliage: 0x9291c9, sky: 0xc9cbe8, accent: 0xcfc7df, theme: 'crystal' },
  { name: '눈꽃 산책길', subtitle: '발자국이 남을 듯 포근한 눈의 나라', ground: 0xe1eced, foliage: 0xa9c9d1, sky: 0xd9e9f4, accent: 0xc9d9df, theme: 'snow' },
  { name: '별빛 옛터', subtitle: '오래된 돌기둥 사이에 숨은 이야기', ground: 0x9eafa2, foliage: 0x78a39c, sky: 0xc8d9df, accent: 0xd6cdb1, theme: 'ruins' },
  { name: '무지개 꽃섬', subtitle: '열 번의 모험이 꽃피는 마지막 섬', ground: 0xa2ce8c, foliage: 0xdca1ca, sky: 0xe0e8f3, accent: 0xf2d4b1, theme: 'rainbow' },
] as const;
export function stageSize(stage: number) { return stage === 0 ? { x: 25, z: 20 } : { x: 38 + stage, z: 32 + stage }; }
export function stageMonsters(stage: number) {
  if (stage === 0) return [[-11, 5], [-9, 11], [-15, 1], [15, -15]].map(([x, z], i) => ({ x, z, type: i }));
  const positions = [[-16, 14], [12, 10], [-23, 0], [24, -4], [-12, -14], [10, -18], [-25, -21], [25, -23], [0, -27]];
  return positions.slice(0, 5 + Math.floor((stage - 1) / 2)).map(([x, z], i) => ({ x: x * (stage % 2 ? 1 : -1), z: z + Math.sin(stage + i) * 2, type: (i + stage - 1) % 4 }));
}
export function stagePlatforms(stage: number) {
  return stage === 0 ? [{ x: 15, z: -11, w: 2, d: 2, h: .5 }, { x: 18, z: -11, w: 2, d: 2, h: .95 }, { x: 21, z: -11, w: 2, d: 2, h: 1.4 }] : [0, 1, 2].map(i => ({ x: 9 + i * 3, z: 18, w: 2, d: 2, h: .5 + i * .45 }));
}
export function stageBerries(stage: number) {
  if (stage === 0) return [[0, 6], [0, 4], [0, 1], [0, -1], [-3, -4], [-5, -4], [3, -4], [5, -4], [0, -6], [-5, 7], [-7, 9], [-9, 7], [-12, 8], [3, 9], [5, 9], [15, -11], [18, -11], [21, -11], [2, 13], [3, 15], [-3, 12], [-5, 14]].map(([x, z]) => ({ x, z }));
  const result = Array.from({ length: 26 + stage * 2 }, (_, i) => ({ x: Math.sin(i * 2.399 + stage) * (12 + i % 4 * 4), z: 23 - i / (25 + stage * 2) * 48 }));
  return [...result, ...stagePlatforms(stage).map(p => ({ x: p.x, z: p.z }))];
}
export function stageTrees(stage: number) {
  if (stage === 0) return [[-15, -6], [-15, 8], [14, -9], [16, -14], [-6, 15]].map(([x, z]) => ({ x, z }));
  const size = stageSize(stage), count = 7 + Math.min(stage, 5);
  return Array.from({ length: count }, (_, i) => {
    const side = i % 2 ? 1 : -1, lane = Math.floor(i / 2);
    return { x: side * (8 + (lane % 3) * 6), z: size.z - 12 - lane * 8 };
  });
}
export const berryValue = (stage: number) => stage === 0 ? 3 : 3 + stage;
export const clearBonus = (stage: number) => 50 + stage * 25;
