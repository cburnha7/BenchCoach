import React from 'react';
import {
  Canvas,
  Circle,
  Group,
  Path,
  Rect,
  Skia,
} from '@shopify/react-native-skia';
import { theme } from '../lib/theme';
import { FIELD_W, FIELD_H } from '../lib/formations';

const STRIPES = 8;
const PITCH_TOP = 8;
const PITCH_H = 760;
const PITCH_X = 8;
const PITCH_W = 584;
const CHALK_W = 2.5;

/** Arc at the top of the box, drawn as an SVG path like the original. */
const topArc = Skia.Path.MakeFromSVGString('M243,116 A60,60 0 0,0 357,116')!;
const bottomArc = Skia.Path.MakeFromSVGString('M243,660 A60,60 0 0,1 357,660')!;

type Props = {
  /** Rendered size in points. The 600x840 field space is scaled to fit. */
  width: number;
  height: number;
};

/**
 * The pitch is static, so it draws once to a Skia canvas and never re-renders
 * during play. Players are separate native views layered on top, which lets
 * each disc animate independently on the UI thread.
 */
function PitchBase({ width, height }: Props) {
  // Axes scale independently so the pitch fills its box; see Field.tsx.
  const scaleX = width / FIELD_W;
  const scaleY = height / FIELD_H;

  return (
    <Canvas style={{ width, height }} pointerEvents="none">
      <Group transform={[{ scaleX }, { scaleY }]}>
        {/* Mown stripes */}
        {Array.from({ length: STRIPES }).map((_, i) => (
          <Rect
            key={i}
            x={PITCH_X}
            y={PITCH_TOP + i * (PITCH_H / STRIPES)}
            width={PITCH_W}
            height={PITCH_H / STRIPES}
            color={i % 2 ? theme.turfAlt : theme.turf}
          />
        ))}

        {/* Touchlines */}
        <Rect
          x={PITCH_X}
          y={PITCH_TOP}
          width={PITCH_W}
          height={PITCH_H}
          color={theme.chalk}
          style="stroke"
          strokeWidth={CHALK_W}
        />

        {/* Halfway line + centre circle */}
        <Rect
          x={PITCH_X}
          y={388 - CHALK_W / 2}
          width={PITCH_W}
          height={CHALK_W}
          color={theme.chalk}
        />
        <Circle
          cx={300}
          cy={388}
          r={66}
          color={theme.chalk}
          style="stroke"
          strokeWidth={CHALK_W}
        />
        <Circle cx={300} cy={388} r={3} color={theme.chalk} />

        {/* Attacking third: penalty area, six-yard box, D, goal */}
        <Rect x={165} y={8} width={270} height={108} color={theme.chalk} style="stroke" strokeWidth={CHALK_W} />
        <Rect x={232} y={8} width={136} height={46} color={theme.chalk} style="stroke" strokeWidth={CHALK_W} />
        <Path path={topArc} color={theme.chalk} style="stroke" strokeWidth={CHALK_W} />
        <Rect x={262} y={2} width={76} height={6} color={theme.chalk} style="stroke" strokeWidth={CHALK_W} />

        {/* Defensive third */}
        <Rect x={165} y={660} width={270} height={108} color={theme.chalk} style="stroke" strokeWidth={CHALK_W} />
        <Rect x={232} y={722} width={136} height={46} color={theme.chalk} style="stroke" strokeWidth={CHALK_W} />
        <Path path={bottomArc} color={theme.chalk} style="stroke" strokeWidth={CHALK_W} />
        <Rect x={262} y={768} width={76} height={6} color={theme.chalk} style="stroke" strokeWidth={CHALK_W} />
      </Group>
    </Canvas>
  );
}

export const Pitch = React.memo(PitchBase);
