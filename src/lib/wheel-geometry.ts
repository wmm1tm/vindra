export interface ArcAngleOptions {
  index: number;
  count: number;
  angleSpanDeg: number;
  centerAngleRad?: number;
}

export function arcAngle({ index, count, angleSpanDeg, centerAngleRad = Math.PI }: ArcAngleOptions) {
  const angleSpanRad = (angleSpanDeg * Math.PI) / 180;
  const step = count > 1 ? angleSpanRad / (count - 1) : 0;
  const startAngle = centerAngleRad - angleSpanRad / 2;

  return startAngle + step * index;
}

export interface ArcPositionOptions extends ArcAngleOptions {
  radius: number;
  pivot: { x: number; y: number };
}

export function arcPosition({ radius, pivot, ...angleOptions }: ArcPositionOptions) {
  const angle = arcAngle(angleOptions);

  return {
    x: pivot.x + radius * Math.cos(angle),
    y: pivot.y + radius * Math.sin(angle),
  };
}
