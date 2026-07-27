import React, { useMemo } from 'react';
import {
  Canvas,
  Circle,
  Group,
  Path,
  Skia,
  Text as SkText,
  matchFont,
} from '@shopify/react-native-skia';
import { Platform } from 'react-native';
import { theme } from '../lib/theme';
import type { Ghost, PassArrow } from '../lib/types';

const DISC_R = 30;
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

function TacticsLayerBase({
  arrows,
  ghosts,
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
          const s = shaft(g.origin, g.to);
          return s ? { ...g, ...s } : null;
        })
        .filter((g): g is NonNullable<typeof g> => g !== null),
    [ghosts]
  );

  if (passes.length === 0 && trails.length === 0) return null;

  return (
    <Canvas
      style={{ position: 'absolute', left: 0, top: 0, width, height }}
      pointerEvents="none"
    >
      <Group transform={[{ scaleX }, { scaleY }]}>
        {/* Movement trails sit under passes: they're context, not the point. */}
        {trails.map((g) => (
          <Group key={g.id}>
            <Path
              path={g.path}
              style="stroke"
              strokeWidth={2.5}
              strokeCap="round"
              color={
                g.opponent
                  ? theme.opponent
                  : g.carry
                    ? theme.carry
                    : theme.run
              }
              opacity={0.85}
            >
              {/* Dashed, to read as "was here" rather than "is here". */}
            </Path>
            {/* Origin marker: where the player started. */}
            <Circle
              cx={g.origin.x}
              cy={g.origin.y}
              r={DISC_R * 0.62}
              style="stroke"
              strokeWidth={2}
              color={g.opponent ? theme.opponent : theme.run}
              opacity={0.4}
            />
          </Group>
        ))}

        {passes.map((a) => (
          <Group key={a.id}>
            <Path
              path={a.path}
              style="stroke"
              strokeWidth={3.5}
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
      </Group>
    </Canvas>
  );
}

export const TacticsLayer = React.memo(TacticsLayerBase);
