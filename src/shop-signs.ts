export const SHOP_SIGNS = [
  { name: '무기', icon: '⚔', action: '무기 고르기' },
  { name: '옷', icon: '👗', action: '옷 고르기' },
  { name: '펫', icon: '🐾', action: '펫 만나기' },
  { name: '탈것', icon: '🐴', action: '탈것 고르기' },
  { name: '살롱', icon: '✂', action: '헤어와 얼굴 꾸미기' },
  { name: '물약', icon: '🧪', action: '물약 고르기' },
] as const;
export const shopSignText = (kind: number) => `${SHOP_SIGNS[kind].icon} ${SHOP_SIGNS[kind].name}`;
export const shopInteraction = (kind: number) => `${SHOP_SIGNS[kind].name} 가게 · ${SHOP_SIGNS[kind].action}`;
