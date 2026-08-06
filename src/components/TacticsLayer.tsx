import React, { useMemo } from 'react';
import {
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  Path,
  Skia,
  Text as SkText,
  matchFont,
} from '@shopify/react-native-skia';
import { Platform } from 'react-native';
import { theme } from '../lib/theme';
import type { FreeDraw, Ghost, PassArrow } from '../lib/types';

const DISC_R = 30;
/** One weight for passes and trails so they read as one system. */
const LINE_W = 3;
/** Freehand annotations are a touch heavier so they read as drawn-on. */
const DRAW_W = 5;
/** Gap left at each end so arrows start and finish outside the discs. */
const TAIL_GAP = 26;
const HEAD_GAP = 30;
const HEAD_LEN = 13;
const HEAD_W = 8;

const font = matchFont({
  fontFamily: Platform.select({ ios: 'Helvetica', default: 'sans-serif' }),
  fontSize: 12,
  fontWeight: 'bold',
});

type Props = {
  arrows: PassArrow[];
  ghosts: Ghost[];
  drawings: FreeDraw[];
  shots: {
    id: string;
    x: number;
    y: number;
    fromX: number;
    fromY: number;
  }[];
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
};

/** Build a line trimmed at both ends, with an arrowhead at the far end. */
function shaft(
  from: { x: number; y: number },
  to: { x: number; y: number }
): { path: ReturnType<typeof Skia.Path.Make>; mid: { x: number; y: number } } | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len < TAIL_GAP + HEAD_GAP + 6) return null;
  const ux = dx / len;
  const uy = dy / len;

  const x1 = from.x + ux * TAIL_GAP;
  const y1 = from.y + uy * TAIL_GAP;
  const x2 = to.x - ux * HEAD_GAP;
  const y2 = to.y - uy * HEAD_GAP;

  const path = Skia.Path.Make();
  path.moveTo(x1, y1);
  path.lineTo(x2, y2);

  // Arrowhead: two barbs swept back from the tip.
  const px = -uy;
  const py = ux;
  path.moveTo(x2, y2);
  path.lineTo(x2 - ux * HEAD_LEN + px * HEAD_W, y2 - uy * HEAD_LEN + py * HEAD_W);
  path.moveTo(x2, y2);
  path.lineTo(x2 - ux * HEAD_LEN - px * HEAD_W, y2 - uy * HEAD_LEN - py * HEAD_W);

  return { path, mid: { x: (x1 + x2) / 2, y: (y1 + y2) / 2 } };
}

/** A smooth path through the sampled drag points (quadratics via midpoints). */
function curvePath(points: { x: number; y: number }[]) {
  const path = Skia.Path.Make();
  path.moveTo(points[0].x, points[0].y);
  if (points.length === 2) {
    path.lineTo(points[1].x, points[1].y);
    return path;
  }
  for (let i = 1; i < points.length - 1; i++) {
    const mx = (points[i].x + points[i + 1].x) / 2;
    const my = (points[i].y + points[i + 1].y) / 2;
    path.quadTo(points[i].x, points[i].y, mx, my);
  }
  const last = points[points.length - 1];
  path.lineTo(last.x, last.y);
  return path;
}

function TacticsLayerBase({
  arrows,
  ghosts,
  drawings,
  shots,
  width,
  height,
  scaleX,
  scaleY,
}: Props) {
  const passes = useMemo(
    () =>
      arrows
        .map((a) => {
          const s = shaft(a.from, a.to);
          return s ? { ...a, ...s } : null;
        })
        .filter((a): a is NonNullable<typeof a> => a !== null),
    [arrows]
  );

  const trails = useMemo(
    () =>
      ghosts
        .map((g) => {
          // Follow the finger when we have a sampled path; else a straight run.
          if (g.points && g.points.length >= 3) {
            return { ...g, path: curvePath(g.points) };
          }
          const s = shaft(g.origin, g.to);
          return s ? { ...g, path: s.path } : null;
        })
        .filter((g): g is NonNullable<typeof g> => g !== null),
    [ghosts]
  );

  const freehand = useMemo(
    () =>
      drawings
        .filter((d) => d.points.length >= 2)
        .map((d) => ({ id: d.id, path: curvePath(d.points) })),
    [drawings]
  );

  const shotLines = useMemo(
    () =>
      shots.map((s) => {
        const p = Skia.Path.Make();
        p.moveTo(s.fromX, s.fromY);
        p.lineTo(s.x, s.y);
        return { id: s.id, path: p };
      }),
    [shots]
  );

  if (
    passes.length === 0 &&
    trails.length === 0 &&
    freehand.length === 0 &&
    shots.length === 0
  ) {
    return null;
  }

  return (
    <Canvas
      style={{ position: 'absolute', left: 0, top: 0, width, height }}
      pointerEvents="none"
    >
      <Group transform={[{ scaleX }, { scaleY }]}>
        {/* Freehand annotations: solid white, a touch thicker than the lines. */}
        {freehand.map((f) => (
          <Path
            key={f.id}
            path={f.path}
            style="stroke"
            strokeWidth={DRAW_W}
            strokeCap="round"
            strokeJoin="round"
            color={theme.run}
            opacity={0.95}
          />
        ))}

        {/* Movement trails sit under passes: they're context, not the point.
            Dashed and same weight as passes; carrying the ball is red (ours)
            or orange (theirs), a plain run is white (ours) or grey (theirs). */}
        {trails.map((g) => {
          const trailColor = g.opponent
            ? g.carry
              ? theme.oppBall
              : theme.oppRun
            : g.carry
              ? theme.carry
              : theme.run;
          return (
            <Group key={g.id}>
              <Path
                path={g.path}
                style="stroke"
                strokeWidth={LINE_W}
                strokeCap="round"
                color={trailColor}
                opacity={0.9}
              >
                <DashPathEffect intervals={[10, 8]} />
              </Path>
              {/* Origin marker: where they started. */}
              <Circle
                cx={g.origin.x}
                cy={g.origin.y}
                r={DISC_R * 0.62}
                style="stroke"
                strokeWidth={2}
                color={trailColor}
                opacity={0.4}
              />
            </Group>
          );
        })}

        {passes.map((a) => (
          <Group key={a.id}>
            <Path
              path={a.path}
              style="stroke"
              strokeWidth={LINE_W}
              strokeCap="round"
              color={theme.pass}
            />
            {/* Numbered bead at the midpoint so pass order is readable. */}
            <Circle cx={a.mid.x} cy={a.mid.y} r={10} color={theme.bg} />
            <Circle
              cx={a.mid.x}
              cy={a.mid.y}
              r={10}
              style="stroke"
              strokeWidth={1.5}
              color={theme.pass}
            />
            {font && (
              <SkText
                x={a.mid.x - (String(a.n).length * 3.4)}
                y={a.mid.y + 4.5}
                text={String(a.n)}
                font={font}
                color={theme.onAccent}
              />
            )}
          </Group>
        ))}

        {/* Shot lines into the goal; the burst emoji is drawn over them. */}
        {shotLines.map((s) => (
          <Path
            key={s.id}
            path={s.path}
            style="stroke"
            strokeWidth={LINE_W + 1}
            strokeCap="round"
            color={theme.pass}
          />
        ))}
      </Group>
    </Canvas>
  );
}

export const TacticsLayer = React.memo(TacticsLayerBase);
