/** Navigation marks: 24px, rounded 1.75px strokes, inherited ink. Learning artwork is separate. */
const paths = {
  leaf: '<path d="M20 4C10 3 4 7 4 13a7 7 0 0 0 7 7c6 0 10-6 9-16Z"/><path d="m4 21 11-11M9 16v-5m0 5h5"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6 6-2Z"/>',
  map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6h14M5 18h14"/>',
  chat: '<path d="M4 4h16v12H9l-5 4V4Z"/><path d="M8 8h8m-8 4h5"/>',
  friends: '<circle cx="8" cy="7" r="3"/><path d="M2 20v-3a6 6 0 0 1 12 0v3m2-16a3 3 0 0 1 0 6m1 4a5 5 0 0 1 5 5v1"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-14 4h3m4 0h3m-10 3h3"/>',
  dragon: '<path d="m5 19-2-5 4-3V6l5 2 3-5 2 6 4 3-3 5h-5l-3 4-5-2Z"/><path d="m7 11 5 3m4-3h.01M5 19l-2 2"/>',
  book: '<path d="M12 5C9 3 6 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 5h4m-3 14h2"/>',
  medal: '<path d="m7 3 5 7 5-7M4 3h5m6 0h5"/><circle cx="12" cy="15" r="6"/><path d="m10 15 1 1 3-3"/>',
  trophy: '<path d="M7 3h10v7a5 5 0 0 1-10 0V3Zm0 2H3v3a4 4 0 0 0 5 4m9-7h4v3a4 4 0 0 1-5 4M12 15v5m-4 1h8"/>',
  cloud: '<path d="M6 16a4 4 0 1 1 1-8 6 6 0 0 1 11 1 3.5 3.5 0 0 1 0 7H6Zm2 3-1 2m6-2-1 2m6-2-1 2"/>',
  snow: '<path d="M12 2v20M3 7l18 10M3 17 21 7m-12-3 3 3 3-3M9 20l3-3 3 3M3 11l4-1-1-4m12 12-1-4 4-1M3 13l4 1-1 4m12-12-1 4 4 1"/>',
  star: '<path d="m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 4v3"/>',
  home: '<path d="m2 11 10-8 10 8M5 9v12h14V9m-10 12v-7h6v7"/>',
  bag: '<path d="M6 8h12l2 13H4L6 8Zm3 0V6a3 3 0 0 1 6 0v2m-6 5h6v5H9v-5Z"/>',
  shop: '<path d="M3 9h18l-2-6H5L3 9Zm0 0v3a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0V9M5 15v6h14v-6m-9 6v-6h4v6"/>',
  berry: '<path d="M12 7C4 3 2 10 7 17l5 5 5-5c5-7 3-14-5-10Zm0 0L8 2m4 5 5-5M8 11h.01M15 12h.01M11 16h.01"/>',
  sword: '<path d="m7 17 12-14 2 2L7 19M4 14l6 6m-7 1 4-4"/>',
  school: '<path d="m3 8 9-5 9 5H3Zm2 3v8m7-8v8m7-8v8M3 22h18M2 19h20"/>',
  spark: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="m8 8 12 13M8 16 20 3"/>',
  gear: '<path d="m9 3-1 3-3 1 1 4-1 4 3 1 1 3h6l1-3 3-1-1-4 1-4-3-1-1-3H9Z"/><circle cx="12" cy="11" r="3"/>',
  heart: '<path d="M12 21 4 13C-2 7 6-1 12 6c6-7 14 1 8 7l-8 8Z"/>',
  lamp: '<path d="M8 16v-2a6 6 0 1 1 8 0v2H8Zm0 3h8m-6 3h4"/>',
  ruler: '<path d="m3 16 13-13 5 5L8 21l-5-5Zm10-10 2 2m-5 1 2 2m-5 1 2 2m-5 1 2 2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  cube: '<path d="m12 2 9 5v10l-9 5-9-5V7l9-5Zm0 10L3 7m9 5 9-5m-9 5v10M7 5l10 5"/>',
  speaker: '<path d="M3 9h4l5-5v16l-5-5H3V9Zm13-2a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16"/>',
} as const;
export type UiIcon = keyof typeof paths;
export function uiIcon(name: UiIcon) {
  return `<svg class="ui-icon" data-ui-icon="${name}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]}</svg>`;
}
const marks: Record<string, UiIcon> = {
  '🧭':'compass','🌿':'leaf','🍂':'leaf','🍃':'leaf','🌱':'leaf','🌳':'leaf','🌲':'leaf',
  '🗺':'map','🌐':'globe','🌍':'globe','💬':'chat','🤝':'friends','👋':'friends',
  '✉':'mail','💌':'mail','📮':'mail','📅':'calendar','🐉':'dragon','📖':'book','📚':'book',
  '📱':'phone','🏅':'medal','🏆':'trophy','🥇':'medal','🥈':'medal','🥉':'medal',
  '🌧':'cloud','❄':'snow','🌟':'star','⭐':'star','✨':'spark','🔒':'lock',
  '🏠':'home','🏡':'home','🎒':'bag','🛍':'shop','🍓':'berry','⚔':'sword','🏛':'school',
  '🐾':'leaf','🌷':'leaf','📐':'map','🪐':'globe','🌌':'star','🎯':'compass',
  '🦄':'leaf','👗':'shop','🪄':'spark','🧪':'berry','🍪':'berry','🌾':'leaf','🍎':'berry','❋':'leaf',
  '💇':'scissors','⚙':'gear',
  '🪽':'leaf','📊':'book','🌈':'star','🐑':'leaf','🎁':'bag','❔':'compass','📜':'book',
  '🧚':'spark',
  '💛':'heart',
  '💡':'lamp','🎉':'spark','💾':'book','👍':'medal','👑':'medal',
  '📏':'ruler','🕰':'clock','📦':'cube','🔢':'book','🔟':'book','🍕':'compass','🧩':'map','🔊':'speaker',
  '👻':'dragon','🦑':'dragon','🐲':'dragon','🦖':'dragon','🐙':'dragon','🦇':'dragon','🐊':'dragon','🎓':'book',
};
const pattern = new RegExp(`(${Object.keys(marks).join('|')})\uFE0F?`, 'gu');
/** Only trusted UI strings or previously escaped markup; never call with a player's input. */
export const uiLabel = (text: string) => text.replace(pattern, (_, mark: string) => uiIcon(marks[mark]));

/** Explicit navigation/status surfaces only. Question statements, answers and learning diagrams are excluded. */
export function decorateUiIcons(host: HTMLElement) {
  const selectors = '.modal-heading,.nav-list,.nav-links,.nav-tabs,.nav-section,.destination-card,.island-place,.ranking-tabs,.title-heading,.title-list,.ranking-loading,.ranking-unavailable,.inventory-tabs,.inventory-summary,.title-catalog,.hall-heading,.hall-tabs,.hall-rank,.hall-value,.shop-explainer,.item-card small,.collection-card small,.salon-banner,.salon-balance,.salon-tabs,.salon-card small,#buy-look,#buy-item,#buy-pet,#collection-action,.expedition-note,.local-ranking,.location-pill,.battle-top,.battle-footer,[data-curriculum-unit],[data-forest],.stage-card,.map-nav,.unit-progress,#curriculum-read,#curriculum-hint-button,.boss-icon,.arena-symbol';
  const targets = [...host.querySelectorAll<HTMLElement>(selectors)];
  if (host.matches(selectors)) targets.unshift(host);
  for (const target of targets) {
    const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      if (!node.parentElement?.closest('svg') && node.textContent && /[\p{Extended_Pictographic}❋]/u.test(node.textContent)) nodes.push(node);
    }
    for (const node of nodes) {
      const escaped = (node.textContent ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const html = uiLabel(escaped);
      if (html === escaped) continue;
      const template = document.createElement('template'); template.innerHTML = html;
      node.replaceWith(template.content);
    }
  }
}
