/** Invalidate cached nameplate measurements after a font finishes between frames. */
let revision = 0;
if (typeof document !== 'undefined' && document.fonts) {
 const changed = () => { revision++; };
 document.fonts.addEventListener('loadingdone', changed);
 document.fonts.addEventListener('loadingerror', changed);
}
export function nameFontState() {
 return (typeof document === 'undefined' ? 'loaded' : document.fonts?.status ?? 'loaded') + ':' + revision;
}
