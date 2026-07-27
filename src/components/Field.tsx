import React, { useCallback, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Pitch } from './Pitch';
import { PlayerDisc } from './PlayerDisc';
import { OpponentMarker } from './OpponentMarker';
import { TacticsLayer } from './TacticsLayer';
import { FIELD_W, FIELD_H } from '../lib/formations';
import { useMatch } from '../store/useMatch';
import { firstName } from '../lib/types';
import { radius } from '../lib/theme';

/** A drag shorter than this is a nudge, not a run worth drawing. */
const TRAIL_MIN_DISTANCE = 45;

/**
 * How far the pitch may stretch away from its true 600:840 proportions.
 *
 * Uniform scaling letterboxes badly on shorter phones — an iPhone SE wastes
 * about 70pt of width, which is field the coach could be using. Letting the
 * pitch fill both axes recovers all of it. The penalty areas and centre circle
 * distort slightly as a result; at this cap it reads as a wide pitch rather
 * than a broken one, and nothing about the app depends on true proportions.
 */
const MAX_STRETCH = 1.26;

type Props = {
  color: string;
  trailsOn: boolean;
  onPlayerAction: (id: string) => void;
};

export function Field({ color, trailsOn, onPlayerAction }: Props) {
  const match = useMatch((s) => s.match);
  const movePlayer = useMatch((s) => s.movePlayer);
  const moveOpponent = useMatch((s) => s.moveOpponent);
  const tapForBall = useMatch((s) => s.tapForBall);
  const addGhost = useMatch((s) => s.addGhost);

  const [box, setBox] = useState({ width: 0, height: 0 });

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox({ width, height });
  }, []);

  const handleDragEnd = useCallback(
    (
      id: string,
      origin: { x: number; y: number },
      to: { x: number; y: number },
      carriedBall: boolean
    ) => {
      if (!trailsOn) return;
      const dist = Math.hypot(to.x - origin.x, to.y - origin.y);
      if (dist < TRAIL_MIN_DISTANCE) return;
      const player = useMatch.getState().match?.roster.find((p) => p.id === id);
      addGhost(player ? firstName(player.name) : '', origin, to, carriedBall, false);
    },
    [trailsOn, addGhost]
  );

  if (!match) return <View style={styles.fill} onLayout={onLayout} />;

  // Independent axes, then pulled back toward each other so the distortion
  // never exceeds MAX_STRETCH.
  let scaleX = box.width / FIELD_W;
  let scaleY = box.height / FIELD_H;
  if (scaleX > 0 && scaleY > 0) {
    if (scaleX / scaleY > MAX_STRETCH) scaleX = scaleY * MAX_STRETCH;
    if (scaleY / scaleX > MAX_STRETCH) scaleY = scaleX * MAX_STRETCH;
  }

  const ready = scaleX > 0 && scaleY > 0;
  // Clamp against the measured box so sub-pixel rounding can never push the
  // pitch under the controls below it.
  const stageW = Math.min(FIELD_W * scaleX, box.width);
  const stageH = Math.min(FIELD_H * scaleY, box.height);

  /**
   * Discs stay circular whatever the pitch does — a squashed player disc looks
   * like a bug, while a slightly wide penalty box does not. Their positions
   * follow the stretched axes; only their size uses the mean.
   */
  const discScale = (scaleX + scaleY) / 2;

  const queuedIds = new Set(match.queue.flatMap((q) => [q.out, q.in]));

  return (
    <View style={styles.fill} onLayout={onLayout}>
      {ready && (
        <View style={[styles.stage, { width: stageW, height: stageH }]}>
          <View style={styles.clip}>
            <Pitch width={stageW} height={stageH} />
          </View>
          <View pointerEvents="none" style={styles.rim} />

          <TacticsLayer
            arrows={match.arrows}
            ghosts={match.ghosts}
            width={stageW}
            height={stageH}
            scaleX={scaleX}
            scaleY={scaleY}
          />

          {match.opponent.on &&
            match.opponent.pos?.map((p, i) => (
              <OpponentMarker
                key={`opp-${i}`}
                index={i}
                x={p.x}
                y={p.y}
                scaleX={scaleX}
                scaleY={scaleY}
                markerScale={discScale}
                onMove={moveOpponent}
              />
            ))}

          {match.roster.map((p) => (
            <PlayerDisc
              key={p.id}
              player={p}
              color={color}
              scaleX={scaleX}
              scaleY={scaleY}
              discScale={discScale}
              scratched={match.scratched.includes(p.id)}
              queued={queuedIds.has(p.id)}
              hasBall={match.holder === p.id}
              onMove={movePlayer}
              onDragEnd={handleDragEnd}
              onDoubleTap={tapForBall}
              onTap={onPlayerAction}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stage: {
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    shadowOpacity: 0.55,
    elevation: 12,
  },
  clip: { borderRadius: radius.md, overflow: 'hidden' },
  rim: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(233,237,246,0.10)',
  },
});
