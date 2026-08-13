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
import { COURT_W, COURT_H, HALF_W, HALF_H } from '../lib/basketball';
import { LAX_HALF_W, LAX_HALF_H } from '../lib/lacrosse';

const STRIPES = 8;
const PITCH_TOP = 8;
const PITCH_H = 760;
const PITCH_X = 8;
const PITCH_W = 584;
const CHALK_W = 2.5;

/** Arc at the top of the box, drawn as an SVG path like the original. */
const topArc = Skia.Path.MakeFromSVGString('M243,116 A60,60 0 0,0 357,116')!;
const bottomArc = Skia.Path.MakeFromSVGString('M243,660 A60,60 0 0,1 357,660')!;

// Court boundary (5px inset so the line isn't clipped at the stage edge).
const CT_X = 5;
const CT_W = COURT_W - 10;
const CT_MID = COURT_W / 2; // 250

// Three-point arcs (radius 237.5 = 23.75 ft), swept AROUND each rim toward
// centre court. Corners run straight from the baseline to where they meet the
// arc, then the arc bulges away from the hoop. Sweep flags: bottom clockwise
// (1) arcs up; top counter-clockwise (0) arcs down. Getting these backwards
// draws the arc under the hoop.
const arc3Bottom = Skia.Path.MakeFromSVGString(
  'M35,935 L35,781 A237.5,237.5 0 0 1 465,781 L465,935'
)!;
const arc3Top = Skia.Path.MakeFromSVGString(
  'M35,5 L35,159 A237.5,237.5 0 0 0 465,159 L465,5'
)!;

// Half court, hoop on the RIGHT (baseline right, half-court line left).
const HALF_MID = HALF_H / 2; // 250
const arc3Half = Skia.Path.MakeFromSVGString(
  'M465,35 L311,35 A237.5,237.5 0 0 0 311,465 L465,465'
)!;
const halfCircleHalf = Skia.Path.MakeFromSVGString('M5,190 A60,60 0 0 1 5,310')!;

type Props = {
  /** Rendered size in points. The sport's field space is scaled to fit. */
  width: number;
  height: number;
  /** Which surface to draw. Defaults to the soccer field. */
  surface?: 'field' | 'court-full' | 'court-half' | 'lacrosse' | 'lax-half';
};

/**
 * The surface is static, so it draws once to a Skia canvas and never
 * re-renders during play. Players are separate native views layered on top,
 * which lets each disc animate independently on the UI thread.
 */
function PitchBase({ width, height, surface = 'field' }: Props) {
  // Scale the sport's own coordinate space to the rendered box. Each surface
  // has its own proportions, so the divisor depends on surface.
  const fw =
    surface === 'court-half'
      ? HALF_W
      : surface === 'court-full'
        ? COURT_W
        : surface === 'lax-half'
          ? LAX_HALF_W
          : FIELD_W;
  const fh =
    surface === 'court-half'
      ? HALF_H
      : surface === 'court-full'
        ? COURT_H
        : surface === 'lax-half'
          ? LAX_HALF_H
          : FIELD_H;
  const scaleX = width / fw;
  const scaleY = height / fh;

  return (
    <Canvas style={{ width, height }} pointerEvents="none">
      {surface === 'court-half' ? (
        <Group transform={[{ scaleX }, { scaleY }]}>
          {/* Hardwood planks */}
          {Array.from({ length: STRIPES }).map((_, i) => (
            <Rect
              key={i}
              x={5 + i * ((HALF_W - 10) / STRIPES)}
              y={5}
              width={(HALF_W - 10) / STRIPES}
              height={HALF_H - 10}
              color={i % 2 ? theme.courtAlt : theme.court}
            />
          ))}

          {/* Boundary */}
          <Rect x={5} y={5} width={HALF_W - 10} height={HALF_H - 10} color={theme.courtLine} style="stroke" strokeWidth={CHALK_W} />

          {/* Half-court line (left) + jump-circle half */}
          <Rect x={5 - CHALK_W / 2} y={5} width={CHALK_W} height={HALF_H - 10} color={theme.courtLine} />
          <Path path={halfCircleHalf} color={theme.courtLine} style="stroke" strokeWidth={CHALK_W} />

          {/* Paint, free-throw circle, 3-pt line, rim (hoop right) */}
          <Rect x={275} y={170} width={190} height={160} color={theme.courtPaint} />
          <Rect x={275} y={170} width={190} height={160} color={theme.courtLine} style="stroke" strokeWidth={CHALK_W} />
          <Circle cx={275} cy={HALF_MID} r={60} color={theme.courtLine} style="stroke" strokeWidth={CHALK_W} />
          <Path path={arc3Half} color={theme.courtLine} style="stroke" strokeWidth={CHALK_W} />
          <Rect x={423} y={220} width={4} height={60} color={theme.courtLine} />
          <Circle cx={412} cy={HALF_MID} r={8} color={theme.courtLine} style="stroke" strokeWidth={CHALK_W} />
        </Group>
      ) : surface === 'court-full' ? (
        <Group transform={[{ scaleX }, { scaleY }]}>
          {/* Hardwood planks run the length of the court. */}
          {Array.from({ length: STRIPES }).map((_, i) => (
            <Rect
              key={i}
              x={CT_X + i * (CT_W / STRIPES)}
              y={CT_X}
              width={CT_W / STRIPES}
              height={COURT_H - 10}
              color={i % 2 ? theme.courtAlt : theme.court}
            />
          ))}

          {/* Boundary */}
          <Rect
            x={CT_X}
            y={CT_X}
            width={CT_W}
            height={COURT_H - 10}
            color={theme.courtLine}
            style="stroke"
            strokeWidth={CHALK_W}
          />

          {/* Halfway line + centre (jump) circle */}
          <Rect
            x={CT_X}
            y={470 - CHALK_W / 2}
            width={CT_W}
            height={CHALK_W}
            color={theme.courtLine}
          />
          <Circle cx={CT_MID} cy={470} r={60} color={theme.courtLine} style="stroke" strokeWidth={CHALK_W} />
          <Circle cx={CT_MID} cy={470} r={3} color={theme.courtLine} />

          {/* Our end (bottom): paint, free-throw circle, 3-pt line, rim */}
          <Rect x={170} y={745} width={160} height={190} color={theme.courtPaint} />
          <Rect x={170} y={745} width={160} height={190} color={theme.courtLine} style="stroke" strokeWidth={CHALK_W} />
          <Circle cx={CT_MID} cy={745} r={60} color={theme.courtLine} style="stroke" strokeWidth={CHALK_W} />
          <Path path={arc3Bottom} color={theme.courtLine} style="stroke" strokeWidth={CHALK_W} />
          <Rect x={220} y={893} width={60} height={4} color={theme.courtLine} />
          <Circle cx={CT_MID} cy={882} r={8} color={theme.courtLine} style="stroke" strokeWidth={CHALK_W} />

          {/* Their end (top) */}
          <Rect x={170} y={5} width={160} height={190} color={theme.courtPaint} />
          <Rect x={170} y={5} width={160} height={190} color={theme.courtLine} style="stroke" strokeWidth={CHALK_W} />
          <Circle cx={CT_MID} cy={195} r={60} color={theme.courtLine} style="stroke" strokeWidth={CHALK_W} />
          <Path path={arc3Top} color={theme.courtLine} style="stroke" strokeWidth={CHALK_W} />
          <Rect x={220} y={43} width={60} height={4} color={theme.courtLine} />
          <Circle cx={CT_MID} cy={58} r={8} color={theme.courtLine} style="stroke" strokeWidth={CHALK_W} />
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

      {surface === 'lacrosse' && (
        <Group transform={[{ scaleX }, { scaleY }]}>
          {/* Grass stripes */}
          {Array.from({ length: STRIPES }).map((_, i) => (
            <Rect
              key={i}
              x={15}
              y={15 + i * (1070 / STRIPES)}
              width={570}
              height={1070 / STRIPES}
              color={i % 2 ? theme.turfAlt : theme.turf}
            />
          ))}

          {/* Boundary */}
          <Rect x={15} y={15} width={570} height={1070} color={theme.chalk} style="stroke" strokeWidth={CHALK_W} />

          {/* Midfield line + centre faceoff X */}
          <Rect x={15} y={550 - CHALK_W / 2} width={570} height={CHALK_W} color={theme.chalk} />
          <Circle cx={300} cy={550} r={5} color={theme.chalk} />
          {/* Wing lines (10 yd, at midfield) */}
          <Rect x={200 - CHALK_W / 2} y={500} width={CHALK_W} height={100} color={theme.chalk} />
          <Rect x={400 - CHALK_W / 2} y={500} width={CHALK_W} height={100} color={theme.chalk} />

          {/* Restraining lines (the boxes), 20 yd off centre */}
          <Rect x={15} y={350 - CHALK_W / 2} width={570} height={CHALK_W} color={theme.chalk} />
          <Rect x={15} y={750 - CHALK_W / 2} width={570} height={CHALK_W} color={theme.chalk} />

          {/* Side hashes: the special substitution / wing area on both sidelines */}
          {[450, 650].flatMap((yy) => [
            <Rect key={`l${yy}`} x={15} y={yy - CHALK_W / 2} width={16} height={CHALK_W} color={theme.chalk} />,
            <Rect key={`r${yy}`} x={569} y={yy - CHALK_W / 2} width={16} height={CHALK_W} color={theme.chalk} />,
          ])}

          {/* Goals in their creases, 15 yd off each end */}
          <Circle cx={300} cy={165} r={30} color={theme.chalk} style="stroke" strokeWidth={CHALK_W} />
          <Rect x={289} y={154} width={22} height={22} color={theme.chalk} style="stroke" strokeWidth={CHALK_W} />
          <Circle cx={300} cy={935} r={30} color={theme.chalk} style="stroke" strokeWidth={CHALK_W} />
          <Rect x={289} y={924} width={22} height={22} color={theme.chalk} style="stroke" strokeWidth={CHALK_W} />
        </Group>
      )}

      {surface === 'lax-half' && (
        <Group transform={[{ scaleX }, { scaleY }]}>
          {/* Grass stripes running toward the goal */}
          {Array.from({ length: STRIPES }).map((_, i) => (
            <Rect
              key={i}
              x={5 + i * ((LAX_HALF_W - 10) / STRIPES)}
              y={5}
              width={(LAX_HALF_W - 10) / STRIPES}
              height={LAX_HALF_H - 10}
              color={i % 2 ? theme.turfAlt : theme.turf}
            />
          ))}

          {/* Boundary */}
          <Rect x={5} y={5} width={LAX_HALF_W - 10} height={LAX_HALF_H - 10} color={theme.chalk} style="stroke" strokeWidth={CHALK_W} />

          {/* Restraining line (top of the box), 20 yd off midfield */}
          <Rect x={210 - CHALK_W / 2} y={5} width={CHALK_W} height={LAX_HALF_H - 10} color={theme.chalk} />
          {/* Wing/GLE hashes on the sidelines */}
          <Rect x={330} y={5} width={CHALK_W} height={16} color={theme.chalk} />
          <Rect x={330} y={LAX_HALF_H - 21} width={CHALK_W} height={16} color={theme.chalk} />

          {/* Goal in its crease, on the right */}
          <Circle cx={420} cy={300} r={30} color={theme.chalk} style="stroke" strokeWidth={CHALK_W} />
          <Rect x={409} y={289} width={22} height={22} color={theme.chalk} style="stroke" strokeWidth={CHALK_W} />
        </Group>
      )}
    </Canvas>
  );
}

export const Pitch = React.memo(PitchBase);
