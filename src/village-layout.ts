/** 공지판·개인 마을 입구는 큰 포털/꽃밭/나무와 다른 구역에 둡니다. */
export const VILLAGE_SPOTS = {
  notice: { x: -4, z: 8 },
  home: { x: -14, z: 8 },
  flowers: { x: -7, z: 24 },
} as const;

export function villageWelcomeClear(x: number, z: number): boolean {
  return Math.hypot(x - VILLAGE_SPOTS.notice.x, z - VILLAGE_SPOTS.notice.z) < 4.5
    || Math.hypot(x - VILLAGE_SPOTS.home.x, z - VILLAGE_SPOTS.home.z) < 4.5
    || Math.hypot(x - VILLAGE_SPOTS.flowers.x, z - VILLAGE_SPOTS.flowers.z) < 5
    || (x > 5 && z < 0);
}

/** 나무를 벤 기록의 인덱스를 유지하면서 입구를 가리던 두 나무만 옮깁니다. */
export function villageTreeSpot(id: number, x: number, z: number): { x: number; z: number } {
  if (id === 0) return { x: -21, z: -7 };
  if (id === 2) return { x: -22, z: -14 };
  if (id === 3) return { x: -15, z: -16 };
  if (id === 1) return { x: -21, z: 11 };
  if (id === 4) return { x: -21, z: -1 };
  return { x, z };
}

export function villageMonsterSpot(id: number, x: number, z: number): { x: number; z: number } {
  if (id === 0) return { x: -19, z: 3 };
  if (id === 1) return { x: -19, z: 14 };
  if (id === 2) return { x: -7, z: -16 };
  return { x, z };
}
