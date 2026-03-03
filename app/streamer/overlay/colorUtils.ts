/**
 * Color utility helpers for overlay themes.
 * Used to derive secondary/structural colors from the main config.colors palette.
 */

/** Parse a hex color (#rrggbb or #rgb) into [r, g, b] */
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ];
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Convert [r, g, b] back to hex string */
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
}

/** Append hex alpha to a hex color: hexAlpha('#ff0000', 0.5) → '#ff000080' */
export function hexAlpha(hex: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  const alphaHex = Math.round(a * 255).toString(16).padStart(2, '0');
  return `${hex.replace(/#([0-9a-f]{6})[0-9a-f]{0,2}/i, '#$1')}${alphaHex}`;
}

/** Convert hex to rgba string: toRgba('#ff0000', 0.5) → 'rgba(255,0,0,0.5)' */
export function toRgba(hex: string, alpha: number = 1): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Darken a hex color by mixing with black. amount: 0 = no change, 1 = full black */
export function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = 1 - Math.max(0, Math.min(1, amount));
  return rgbToHex(r * f, g * f, b * f);
}

/** Lighten a hex color by mixing with white. amount: 0 = no change, 1 = full white */
export function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const a = Math.max(0, Math.min(1, amount));
  return rgbToHex(r + (255 - r) * a, g + (255 - g) * a, b + (255 - b) * a);
}

/** Blend two hex colors. ratio: 0 = color1, 1 = color2 */
export function blend(hex1: string, hex2: string, ratio: number): string {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const r = Math.max(0, Math.min(1, ratio));
  return rgbToHex(
    r1 + (r2 - r1) * r,
    g1 + (g2 - g1) * r,
    b1 + (b2 - b1) * r,
  );
}

/**
 * Injects or re-injects a <style> element with a unique ID.
 * Only updates if the CSS content has changed (tracked via data-hash).
 */
export function injectDynamicKeyframes(styleId: string, cssContent: string): void {
  if (typeof document === 'undefined') return;
  // Simple hash to detect changes
  const hash = simpleHash(cssContent);
  const existing = document.getElementById(styleId) as HTMLStyleElement | null;
  if (existing && existing.dataset.hash === hash) return;
  if (existing) existing.remove();
  const style = document.createElement('style');
  style.id = styleId;
  style.dataset.hash = hash;
  style.textContent = cssContent;
  document.head.appendChild(style);
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}
