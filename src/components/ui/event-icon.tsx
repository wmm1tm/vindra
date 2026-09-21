import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export type IconSet = 'mci' | 'material';

interface EventIconProps {
  name: string;
  /** Welke iconset de naam hoort bij. Default 'material' — de meeste glyphs komen
   * uit Google Material omdat dat de internationaal herkenbare pictogrammen zijn. */
  set?: IconSet;
  size: number;
  color: string;
}

/** MaterialIcons tekent zijn glyph iets kleiner binnen hetzelfde kader dan MCI; zonder
 * deze correctie ogen de Material-iconen lichter naast de MCI-iconen in dezelfde rij. */
const MATERIAL_OPTICAL_SCALE = 1.06;

export function EventIcon({ name, set = 'material', size, color }: EventIconProps) {
  if (set === 'mci') {
    return <MaterialCommunityIcons name={name as never} size={size} color={color} />;
  }
  return <MaterialIcons name={name as never} size={Math.round(size * MATERIAL_OPTICAL_SCALE)} color={color} />;
}
