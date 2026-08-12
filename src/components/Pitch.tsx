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

// Three-point arcs, swept around each rim. Corners run straight up from the
// baseline, then a 272-radius arc bulges toward centre court. (Curvature is a
// close approximation, not a regulation ratio — this is a coaching board.)
const arc3Bottom = Skia.Path.MakeFromSVGString(
  'M52,768 L52,630 A272,272 0 0,0 548,630 L548,768'
)!;
const arc3Top = Skia.Path.MakeFromSVGString(
  'M52,8 L52,146 A272,272 0 0,1 548,146 L548,8'
)!;

type Props = {
  /** Rendered size in points. The 600x840 field space is scaled to fit. */
  width: number;
  height: number;
  /** Which surface to draw. Defaults to the soccer field. */
  surface?: 'field' | 'court';
};

/**
 * The surface is static, so it draws once to a Skia canvas and never
 * re-renders during play. Players are separate native views layered on top,
 * which lets each disc animate independently on the UI thread.
 */
function PitchBase({ width, height, surface = 'field' }: Props) {
  // Axes scale independently so the surface fills its box; see Field.tsx.
  const scaleX = width / FIELD_W;
  const scaleY = height / FIELD_H;

  return (
    <Canvas style={{ width, height }} pointerEvents="none">
      {surface === 'court' ? (
        <Group transform={[{ scaleX }, { scaleY }]}>
          {/* Hardwood planks run the length of the court. */}
          {Array.from({ length: STRIPES }).map((_, i) => (
            <Rect
              key={i}
              x={PITCH_X + i * (PITCH_W / STRIPES)}
              y={PITCH_TOP}
              width={PITCH_W / STRIPES}
              height={PITCH_H}
              color={i % 2 ? theme.courtAlt : theme.court}
            />
          ))}

          {/* Boundary */}
          <Rect
            x={PITCH_X}
            y={PITCH_TOP}
            width={PITCH_W}
            height={PITCH_H}
            color={theme.courtLine}
            style="stroke"
            strokeWidth={CHALK_W}
          />

          {/* Halfway line + centre (jump) circle */}
          <Rect
            x={PITCH_X}
            y={388 - CHALK_W / 2}
            width={PITCH_W}
            height={CHALK_W}
            color={theme.courtLine}
          />
          <Circle cx={300} cy={388} r={66} color={theme.courtLine} style="stroke" strokeWidth={CHALK_W} />
          <Circle cx={300} cy={388} r={3} color={theme.courtLine} />

          {/* Our end (bottom): paint, free-throw circle, 3-pt line, rim */}
          <Rect x={230} y={578} width={140} height={190} color={theme.courtPaint} />
          <Rect x={230} y={578} width={140} height={190} color={theme.courtLine} style="stroke" strokeWidth={CHALK_W} />
          <Circle cx={300} cy={578} r={52} color={theme.courtLine} style="stroke" strokeWidth={CHALK_W} />
          <Path path={arc3Bottom} color={theme.courtLine} style="stroke" strokeWidth={CHALK_W} />
          <Rect x={270} y={752} width={60} height={4} color={theme.courtLine} />
          <Circle cx={300} cy={742} r={9} color={theme.courtLine} style="stroke" strokeWidth={CHALK_W} />

          {/* Their end (top) */}
          <Rect x={230} y={8} width={140} height={190} color={theme.courtPaint} />
          <Rect x={230} y={8} width={140} height={190} color={theme.courtLine} style="stroke" strokeWidth={CHALK_W} />
          <Circle cx={300} cy={198} r={52} color={theme.courtLine} style="stroke" strokeWidth={CHALK_W} />
          <Path path={arc3Top} color={theme.courtLine} style="stroke" strokeWidth={CHALK_W} />
          <Rect x={270} y={24} width={60} height={4} color={theme.courtLine} />
          <Circle cx={300} cy={34} r={9} color={theme.courtLine} style="stroke" strokeWidth={CHALK_W} />
        </Group>
      ) : (
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
      )}
    </Canvas>
  );
}

export const Pitch = React.memo(PitchBase);
