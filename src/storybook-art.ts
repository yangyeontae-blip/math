import { CanvasTexture, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';

export const STORYBOOK_LIGHTING = Object.freeze({
  sky: 0xfff7df, ground: 0x829f76, hemisphereIntensity: 2.1,
  sun: 0xffe2b3, sunIntensity: 2.4, exposure: 1.08,
});

export type StorybookSurface = 'grass' | 'stone' | 'wood' | 'water';
const textures = new Map<Exclude<StorybookSurface, 'water'>, CanvasTexture>();
const materials = new Map<string, MeshStandardMaterial>();
let shadowTexture: CanvasTexture | null = null;
let shadowMaterial: MeshBasicMaterial | null = null;
let shadowGeometry: PlaneGeometry | null = null;
const fract = (n: number) => n - Math.floor(n);
const randomAt = (seed: number) => fract(Math.sin(seed * 127.1 + 311.7) * 43758.5453123);

/** Lazy, tiny textures; importing the module never requires a browser or canvas. */
function surfaceTexture(kind: Exclude<StorybookSurface, 'water'>): Texture | null {
  const existing = textures.get(kind); if (existing) return existing;
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d'); if (!ctx) return null;
  ctx.fillStyle = kind === 'wood' ? '#ede4d4' : '#f2f1e9'; ctx.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 180; i++) {
    const x = randomAt(i * 3 + 1) * 64, y = randomAt(i * 3 + 2) * 64;
    ctx.strokeStyle = i % 3 ? 'rgba(73,78,56,.075)' : 'rgba(255,255,255,.35)';
    ctx.lineWidth = kind === 'stone' ? 1.3 : .8; ctx.beginPath(); ctx.moveTo(x, y);
    if (kind === 'grass') ctx.lineTo(x + 1.5, y - 2 - randomAt(i + 5) * 2);
    else if (kind === 'stone') ctx.lineTo(x + randomAt(i + 5) * 3, y + .7);
    else ctx.bezierCurveTo(x + 4, y - 1, x + 9, y + 1, x + 16, y);
    ctx.stroke();
  }
  if (kind === 'wood') {
    ctx.strokeStyle = 'rgba(94,69,44,.12)'; ctx.lineWidth = .7;
    for (const y of [15.5, 31.5, 47.5, 63.5]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(64, y); ctx.stroke(); }
  }
  const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace;
  texture.userData.sharedStorybookAsset = true;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  const repeat = kind === 'grass' ? 12 : kind === 'stone' ? 6 : 2; texture.repeat.set(repeat, repeat);
  textures.set(kind, texture); return texture;
}

/** Shared fixed-palette materials: do not mutate these or dispose them on map changes. */
export function storybookMaterial(kind: StorybookSurface, color: number): MeshStandardMaterial {
  const key = `${kind}:${color}`; const existing = materials.get(key); if (existing) return existing;
  const material = new MeshStandardMaterial({
    color, map: kind === 'water' ? null : surfaceTexture(kind),
    roughness: kind === 'water' ? .3 : kind === 'wood' ? .88 : 1,
    metalness: 0,
  });
  material.userData.sharedStorybookAsset = true;
  materials.set(key, material); return material;
}

/** A ground contact shadow remains available when expensive real-time shadows are disabled. */
export function makeContactShadow(radius = .65): Mesh<PlaneGeometry, MeshBasicMaterial> {
  if (!shadowMaterial) {
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(55,64,42,.28)'); gradient.addColorStop(.4, 'rgba(55,64,42,.17)'); gradient.addColorStop(1, 'rgba(55,64,42,0)');
        ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64);
        shadowTexture = new CanvasTexture(canvas); shadowTexture.colorSpace = SRGBColorSpace;
        shadowTexture.userData.sharedStorybookAsset = true;
      }
    }
    shadowMaterial = new MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, opacity: shadowTexture ? 1 : 0, toneMapped: false });
    shadowMaterial.userData.sharedStorybookAsset = true;
  }
  shadowGeometry ??= new PlaneGeometry(2, 2);
  shadowGeometry.userData.sharedStorybookAsset = true;
  const shadow = new Mesh(shadowGeometry, shadowMaterial);
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = .025;
  const safeRadius = Number.isFinite(radius) ? Math.max(.01, radius) : .65;
  shadow.scale.set(safeRadius, safeRadius, 1); shadow.renderOrder = 1;
  shadow.userData.sharedStorybookAsset = true;
  return shadow;
}

/** Call only when the whole renderer is destroyed, never when switching regions. */
export function disposeStorybookArt(): void {
  for (const material of materials.values()) material.dispose(); materials.clear();
  for (const texture of textures.values()) texture.dispose(); textures.clear();
  shadowMaterial?.dispose(); shadowGeometry?.dispose(); shadowTexture?.dispose();
  shadowMaterial = null; shadowGeometry = null; shadowTexture = null;
}

/** Bounded branch movement in radians, based on seconds rather than frame count. */
export function storybookSway(time: number, phase = 0, strength = 1): number {
  if (strength <= 0) return 0;
  return (Math.sin(time * .85 + phase) * .022 + Math.sin(time * 1.43 + phase * .7) * .009) * Math.max(0, Math.min(1, strength));
}

export type SeasonalParticleKind = 'snow' | 'leaf';
/** Recycled particles fade out at the ground and in above the scene. No screen overlays. */
export function seasonalParticleAt(kind: SeasonalParticleKind, time: number, seed: number, span = 12) {
  const width = Number.isFinite(span) ? Math.max(1, span) : 12;
  const phase = randomAt(seed + 1) * Math.PI * 2;
  const cycle = fract(time * (kind === 'snow' ? .105 : .075) + randomAt(seed + 2));
  const drift = kind === 'snow' ? .22 : .65;
  return {
    x: (randomAt(seed + 3) - .5) * width + Math.sin(time * .65 + phase) * drift,
    y: (1 - cycle) * 8,
    z: (randomAt(seed + 4) - .5) * width + Math.cos(time * .47 + phase) * drift * .5,
    rotationX: kind === 'leaf' ? Math.sin(time * 1.2 + phase) * .7 : 0,
    rotationY: kind === 'leaf' ? time * .7 + phase : phase,
    rotationZ: Math.sin(time * .9 + phase) * (kind === 'leaf' ? .8 : .15),
    scale: kind === 'snow' ? .065 + randomAt(seed + 5) * .045 : .12 + randomAt(seed + 5) * .07,
    opacity: Math.max(0, Math.min(1, cycle * 12, (1 - cycle) * 12)) * (kind === 'snow' ? .8 : .9),
  };
}
