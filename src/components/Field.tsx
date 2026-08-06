import React, { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Pitch } from './Pitch';
import { PlayerDisc, DISC_R } from './PlayerDisc';
import { OpponentMarker } from './OpponentMarker';
import { TacticsLayer } from './TacticsLayer';
import { FIELD_W, FIELD_H, FORMATIONS, positionLabels } from '../lib/formations';
import { useMatch } from '../store/useMatch';
import { firstName } from '../lib/types';
import { radius, rgba } from '../lib/theme';

/** A drag shorter than this is a nudge, not a run worth drawing. */
const TRAIL_MIN_DISTANCE = 45;
/** Min spacing (field units) between sampled points on a freehand drawing. */
const DRAW_SAMPLE = 14;
/** How close a drop must land to another player to offer a position swap. */
const SWAP_RADIUS = 46;

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
  /** Tapping an open starter slot, in field coordinates. */
  onEmptySlot: (x: number, y: number) => void;
};

export function Field({ color, trailsOn, onPlayerAction, onEmptySlot }: Props) {
  const match = useMatch((s) => s.match);
  const movePlayer = useMatch((s) => s.movePlayer);
  const moveOpponent = useMatch((s) => s.moveOpponent);
  const tapForBall = useMatch((s) => s.tapForBall);
  const tapOpponentBall = useMatch((s) => s.tapOpponentBall);
  const addGhost = useMatch((s) => s.addGhost);
  const addDrawing = useMatch((s) => s.addDrawing);
  const toggleShot = useMatch((s) => s.toggleShot);
  const swapPositions = useMatch((s) => s.swapPositions);

  const registerShot = (x: number, y: number) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toggleShot(x, y);
  };

  const [box, setBox] = useState({ width: 0, height: 0 });
  // Sampled freehand-draw path (flattened x,y,x,y…) in field coordinates.
  const drawPts = useSharedValue<number[]>([]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox({ width, height });
  }, []);

  const handleDragEnd = useCallback(
    (
      id: string,
      origin: { x: number; y: number },
      to: { x: number; y: number },
      carriedBall: boolean,
      points: { x: number; y: number }[]
    ) => {
      // Dropped onto another of our on-field players? Offer to swap spots.
      const m = useMatch.getState().match;
      if (m) {
        let target: (typeof m.roster)[number] | null = null;
        let best = SWAP_RADIUS * SWAP_RADIUS;
        for (const p of m.roster) {
          if (p.id === id || !p.onField || m.scratched.includes(p.id)) continue;
          const d2 = (p.x - to.x) ** 2 + (p.y - to.y) ** 2;
          if (d2 < best) {
            best = d2;
            target = p;
          }
        }
        if (target) {
          const me = m.roster.find((p) => p.id === id);
          const t = target;
          Alert.alert(
            'Swap positions?',
            `${firstName(me?.name ?? '')} ↔ ${firstName(t.name)}`,
            [
              { text: 'No', style: 'cancel' },
              { text: 'Swap', onPress: () => swapPositions(id, t.id) },
            ]
          );
        }
      }

      if (!trailsOn) return;
      const dist = Math.hypot(to.x - origin.x, to.y - origin.y);
      if (dist < TRAIL_MIN_DISTANCE) return;
      const player = useMatch.getState().match?.roster.find((p) => p.id === id);
      addGhost(
        player ? firstName(player.name) : '',
        origin,
        to,
        carriedBall,
        false,
        points
      );
    },
    [trailsOn, addGhost, swapPositions]
  );

  const handleOppDragEnd = useCallback(
    (
      index: number,
      origin: { x: number; y: number },
      to: { x: number; y: number },
      points: { x: number; y: number }[]
    ) => {
      if (!trailsOn) return;
      const dist = Math.hypot(to.x - origin.x, to.y - origin.y);
      if (dist < TRAIL_MIN_DISTANCE) return;
      // Carry (orange) when this opponent has the ball; otherwise a plain run.
      const holder = useMatch.getState().match?.opponent.holder;
      addGhost('', origin, to, holder === index, true, points);
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

  // Empty starter slots: claim the nearest formation slot for each on-field
  // player, then mark whatever is left as an open spot. Robust to dragging —
  // a moved player still holds the slot closest to where they ended up.
  const slots = FORMATIONS[match.size][match.formationIdx].slots;
  const labels = positionLabels(match.size, match.formationIdx);
  const oppLabels = positionLabels(match.size, match.opponent.formationIdx, true);
  const onFieldPlayers = match.roster.filter((p) => p.onField);
  const claimed = new Set<number>();
  onFieldPlayers.forEach((p) => {
    let best = -1;
    let bestD = Infinity;
    slots.forEach((s, i) => {
      if (claimed.has(i)) return;
      const d = (s.x - p.x) ** 2 + (s.y - p.y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best >= 0) claimed.add(best);
  });
  const emptySlots = slots
    .map((s, i) => ({ s, i }))
    .filter(({ i }) => !claimed.has(i));

  // Freehand doodling on empty space — always available, independent of the
  // tracer. Sits under the discs, so a drag that starts on a player still
  // moves the player. Cleared by Reset / clearBoard.
  const drawPan = Gesture.Pan()
    .minDistance(6)
    .onStart((e) => {
      drawPts.value = [e.x / scaleX, e.y / scaleY];
    })
    .onChange((e) => {
      const fx = e.x / scaleX;
      const fy = e.y / scaleY;
      const arr = drawPts.value;
      const dx = fx - arr[arr.length - 2];
      const dy = fy - arr[arr.length - 1];
      if (dx * dx + dy * dy >= DRAW_SAMPLE * DRAW_SAMPLE) {
        drawPts.value = [...arr, fx, fy];
      }
    })
    .onEnd((e) => {
      const flat = [...drawPts.value, e.x / scaleX, e.y / scaleY];
      if (flat.length < 6) return; // need a real stroke, not a nudge
      const pairs: { x: number; y: number }[] = [];
      for (let i = 0; i < flat.length; i += 2) {
        pairs.push({ x: flat[i], y: flat[i + 1] });
      }
      runOnJS(addDrawing)(pairs);
    });

  // Double-tap a goal mouth to drop a shot-on-goal burst there.
  const goalTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(220)
    .onEnd((e, success) => {
      if (!success) return;
      const fx = e.x / scaleX;
      const fy = e.y / scaleY;
      if (fx > 220 && fx < 380 && fy < 58) runOnJS(registerShot)(300, 30);
      else if (fx > 220 && fx < 380 && fy > 716) runOnJS(registerShot)(300, 742);
    });

  const boardGesture = Gesture.Race(goalTap, drawPan);

  return (
    <View style={styles.fill} onLayout={onLayout}>
      {ready && (
        <View style={[styles.stage, { width: stageW, height: stageH }]}>
          <View style={styles.clip}>
            <Pitch width={stageW} height={stageH} />
          </View>
          <View pointerEvents="none" style={styles.rim} />

          {/* Draw layer: captures freehand strokes on empty space, below the
              discs so players keep their own drags. */}
          <GestureDetector gesture={boardGesture}>
            <Animated.View style={StyleSheet.absoluteFill} />
          </GestureDetector>

          <TacticsLayer
            arrows={match.arrows}
            ghosts={match.ghosts}
            drawings={match.drawings}
            shots={match.shots}
            width={stageW}
            height={stageH}
            scaleX={scaleX}
            scaleY={scaleY}
          />

          {/* Open starter slots — tap one to bring a player straight on. */}
          {emptySlots.map(({ s, i }) => (
            <EmptySlot
              key={`slot-${i}`}
              x={s.x}
              y={s.y}
              label={labels[i]}
              scaleX={scaleX}
              scaleY={scaleY}
              discScale={discScale}
              onPress={() => onEmptySlot(s.x, s.y)}
            />
          ))}

          {match.opponent.on &&
            match.opponent.pos?.map((p, i) => (
              <OpponentMarker
                key={`opp-${i}`}
                index={i}
                x={p.x}
                y={p.y}
                label={oppLabels[i] ?? '·'}
                scaleX={scaleX}
                scaleY={scaleY}
                markerScale={discScale}
                hasBall={match.opponent.holder === i}
                onMove={moveOpponent}
                onDoubleTap={tapOpponentBall}
                onDragEnd={handleOppDragEnd}
              />
            ))}

          {/* Only on-field players are drawn — the bench lives in the sub sheet. */}
          {onFieldPlayers.map((p) => (
            <PlayerDisc
              key={p.id}
              player={p}
              color={color}
              scaleX={scaleX}
              scaleY={scaleY}
              discScale={discScale}
              scratched={match.scratched.includes(p.id)}
              card={match.cards[p.id]}
              queued={queuedIds.has(p.id)}
              hasBall={match.holder === p.id}
              onMove={movePlayer}
              onDragEnd={handleDragEnd}
              onDoubleTap={tapForBall}
              onTap={onPlayerAction}
            />
          ))}

          {/* Shot burst emoji, drawn at the goal end of each shot line. */}
          {match.shots.map((s) => {
            const size = Math.round(30 * discScale);
            return (
              <View
                key={s.id}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: size,
                  height: size,
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [
                    { translateX: s.x * scaleX - size / 2 },
                    { translateY: s.y * scaleY - size / 2 },
                  ],
                }}
              >
                <Text style={{ fontSize: Math.round(size * 0.92) }}>💥</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

/** A dashed ghost disc marking an unfilled starter position; tap to fill it. */
function EmptySlot({
  x,
  y,
  label,
  scaleX,
  scaleY,
  discScale,
  onPress,
}: {
  x: number;
  y: number;
  label: string;
  scaleX: number;
  scaleY: number;
  discScale: number;
  onPress: () => void;
}) {
  // Touch target matches a player disc's padded box so it's easy to hit.
  const size = (DISC_R + 14) * 2 * discScale;
  const half = size / 2;
  const inner = DISC_R * 2 * discScale;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.slotTouch,
        {
          width: size,
          height: size,
          transform: [
            { translateX: x * scaleX - half },
            { translateY: y * scaleY - half },
          ],
          opacity: pressed ? 0.6 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.slot,
          { width: inner, height: inner, borderRadius: inner / 2 },
        ]}
      >
        <Text style={[styles.slotText, { fontSize: Math.max(9, 12 * discScale) }]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  slotTouch: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  slot: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: rgba('#ffffff', 0.32),
    backgroundColor: rgba('#ffffff', 0.05),
  },
  slotText: {
    color: rgba('#ffffff', 0.62),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
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
