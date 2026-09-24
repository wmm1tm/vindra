function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const value = parseInt(clean, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Mixes `hex` towards white by `amount` (0-1) — the RN equivalent of
 * `color-mix(in srgb, C 100%, white X%)`, which isn't available as a style string here. */
export function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}

/** Mixes `hex` towards black by `amount` (0-1). */
export function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

/** `hex` as an `rgba()` string at the given opacity — for shadows/overlays tinted to an
 * event color instead of plain black. */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Ondoorzichtige mix van `hex` over een achtergrondkleur, in verhouding `amount` (0-1) —
 * voor een getint vlak dat níet laat doorschijnen wat eronder ligt (bv. een capsule-marker
 * die over zijn eigen balk valt). */
export function mixOver(hex: string, background: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const [br, bg, bb] = hexToRgb(background);
  return rgbToHex(br + (r - br) * amount, bg + (g - bg) * amount, bb + (b - bb) * amount);
}
