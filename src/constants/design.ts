/**
 * Design 2.0 (goedgekeurd voorstel 2026-09-24): donkere knoppen met een gekleurde ring,
 * tegels op de tijdlijn en een zachte gloed in de eigen kleur van elk event.
 *
 * Vindra start gedempter dan Ebbly: je opent de app vaak midden in een moeilijk moment
 * met je kind. Eén knop voor de hele app, zodat de sterkte later op één plek bij te
 * stellen is. In nachtmodus gaat de gloed helemaal uit (zie `useGlow`).
 */

/** Sterkte van de gloed, 0 = uit, 1 = zo sterk als Ebbly. */
export const GLOW = 0.35;

/** De glansstreep over de lang-druk-banner. Uit voor Vindra: te druk op een lastig moment. */
export const SHINE = false;

/** Kleuren van de 2.0-stijl, afgestemd op Vindra's bestaande palet. */
export const Design = {
  ground: '#12171C',
  surface: '#1C252A',
  card: '#242E33',
  text: '#F1EEE7',
  muted: '#AAB4B6',
  accent: '#D6A866',
  /** Donkere kern van wielknoppen en hub: licht linksboven, donker rechtsonder. */
  coreGradient: ['#27323A', '#1A2227', '#141A1F'] as const,
} as const;

/**
 * Schaduw-stijl voor een gloed. `opacity` en `radius` zijn de Ebbly-waarden (sterkte 1);
 * `factor` is de actuele sterkte uit `useGlow()`. De straal krimpt minder hard dan de
 * dekking, anders wordt een zachte gloed een harde rand.
 */
export function glowStyle(color: string, factor: number, opacity: number, radius: number) {
  if (factor <= 0) {
    return { shadowColor: color, shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 } };
  }
  return {
    shadowColor: color,
    shadowOpacity: opacity * factor,
    shadowRadius: radius * Math.max(factor, 0.6),
    shadowOffset: { width: 0, height: 0 },
  };
}
