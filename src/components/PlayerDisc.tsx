import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { theme, contrastText, rgba } from '../lib/theme';
import { badgeLabel, FOUL_OUT, type Card, type Player } from '../lib/types';

export const DISC_R = 30;
/** Extra touch radius (field units) around the disc, for a generous tap area. */
const TAP_PAD = 22;
/** Min spacing (field units) between recorded points on the drag trail. */
const SAMPLE_DIST = 16;

type Props = {
  player: Player;
  color: string;
  /** Horizontal field scale (positions). */
  scaleX: number;
  /** Vertical field scale (positions). */
  scaleY: number;
  /** Mean of the two — keeps the disc itself round. */
  discScale: number;
  scratched: boolean;
  queued: boolean;
  /** Booking to flag on the disc, if any (soccer). */
  card?: Card;
  /** Foul count to flag on the disc (basketball); undefined for soccer. */
  fouls?: number;
  /** True when this player is on the ball. */
  hasBall: boolean;
  /** Committed once, on release, in field coordinates. */
  onMove: (id: string, x: number, y: number) => void;
  /** Called on release with the drag's start, end, and sampled path. */
  onDragEnd: (
    id: string,
    origin: { x: number; y: number },
    to: { x: number; y: number },
    carriedBall: boolean,
    points: { x: number; y: number }[]
  ) => void;
  /** Double tap: take the ball, or receive a pass from the current holder. */
  onDoubleTap: (id: string) => void;
  /** Single tap: open the player action sheet (subs, badge, scratch). */
  onTap: (id: string) => void;
};

function PlayerDiscBase({
  player,
  color,
  scaleX,
  scaleY,
  discScale,
  scratched,
  queued,
  card,
  fouls,
  hasBall,
  onMove,
  onDragEnd,
  onDoubleTap,
  onTap,
}: Props) {
  const x = useSharedValue(player.x);
  const y = useSharedValue(player.y);
  const pressed = useSharedValue(0);
  const ring = useSharedValue(0);
  // Drag origin, captured on start so the trail knows where the run began.
  const originX = useSharedValue(player.x);
  const originY = useSharedValue(player.y);
  // Sampled drag path (flattened x,y,x,y…) for a curved trail.
  const pts = useSharedValue<number[]>([]);

  // Snap to the stored position instantly. A spring here overshot on Reset —
  // players slingshot past their slots before settling — which read as a bug.
  useEffect(() => {
    x.value = player.x;
    y.value = player.y;
  }, [player.x, player.y, x, y]);

  // The possession ring breathes slowly: readable at a glance, not loud.
  useEffect(() => {
    ring.value = hasBall
      ? withRepeat(withTiming(1, { duration: 900 }), -1, true)
      : withTiming(0, { duration: 200 });
  }, [hasBall, ring]);

  const buzz = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const ball = (pid: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDoubleTap(pid);
  };

  /*
   * Gesture model, matching the original app:
   *   drag       — move the player (activates the moment the finger travels,
   *                so no hold needed — that was the "had to try several times")
   *   double tap — give the ball, or play a pass to them
   *   single tap — open the action sheet (subs, cards)
   *
   * Pan activates on movement (minDistance), so a still finger is always a tap
   * and the two never fight. The trail records the path the finger took.
   */
  const pan = Gesture.Pan()
    .minDistance(10)
    .onStart(() => {
      originX.value = x.value;
      originY.value = y.value;
      pts.value = [x.value, y.value];
      pressed.value = withTiming(1, { duration: 120 });
      runOnJS(buzz)();
    })
    .onChange((e) => {
      // Absolute from the origin so the disc never lags the finger.
      x.value = originX.value + e.translationX / scaleX;
      y.value = originY.value + e.translationY / scaleY;
      const arr = pts.value;
      const dx = x.value - arr[arr.length - 2];
      const dy = y.value - arr[arr.length - 1];
      if (dx * dx + dy * dy >= SAMPLE_DIST * SAMPLE_DIST) {
        pts.value = [...arr, x.value, y.value];
      }
    })
    .onEnd(() => {
      pressed.value = withTiming(0, { duration: 160 });
      const flat = [...pts.value, x.value, y.value];
      const pairs: { x: number; y: number }[] = [];
      for (let i = 0; i < flat.length; i += 2) {
        pairs.push({ x: flat[i], y: flat[i + 1] });
      }
      runOnJS(onMove)(player.id, x.value, y.value);
      runOnJS(onDragEnd)(
        player.id,
        { x: originX.value, y: originY.value },
        { x: x.value, y: y.value },
        hasBall,
        pairs
      );
    });

  // Short delay so a single tap resolves quickly; no duration cap so a slow
  // tap still counts.
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(180)
    .onEnd((_e, success) => {
      if (success) runOnJS(ball)(player.id);
    });

  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd((_e, success) => {
      if (success) runOnJS(onTap)(player.id);
    });

  const gesture = Gesture.Race(
    pan,
    Gesture.Exclusive(doubleTap, singleTap)
  );

  // Touch target is bigger than the disc: a transparent padded box carries the
  // gesture so the circle is easy to hit. Declared before the worklet below —
  // Reanimated captures a worklet's closure at its definition site, so a value
  // it reads must be initialised first or it throws when the disc mounts.
  const discSize = DISC_R * 2 * discScale;
  const touchSize = (DISC_R + TAP_PAD) * 2 * discScale;
  const touchR = touchSize / 2;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value * scaleX - touchR },
      { translateY: y.value * scaleY - touchR },
      { scale: 1 + pressed.value * 0.12 },
    ],
    zIndex: pressed.value > 0 ? 20 : 10,
  }));

  // Bright and always visible while they hold the ball (never fades to 0).
  const ringStyle = useAnimatedStyle(() => ({
    opacity: hasBall ? 0.6 + ring.value * 0.4 : 0,
    transform: [{ scale: 1 + ring.value * 0.1 }],
  }));

  // A big yellow halo, distinctly larger than the disc.
  const haloSize = discSize * 1.5;

  const label = badgeLabel(player);
  // An emoji badge is drawn big and bare — no coloured disc behind it. The
  // possession ring still appears (it's a sibling) when they have the ball.
  const isEmoji = !!player.emoji;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[styles.wrap, { width: touchSize, height: touchSize }, animatedStyle]}
      >
        <View style={{ width: discSize, height: discSize }}>
          {/* Possession halo — big, bright yellow, unmistakable. */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ring,
              {
                width: haloSize,
                height: haloSize,
                left: (discSize - haloSize) / 2,
                top: (discSize - haloSize) / 2,
                borderRadius: haloSize / 2,
                borderWidth: Math.max(3, 5 * discScale),
                borderColor: theme.ball,
              },
              ringStyle,
            ]}
          />
          {isEmoji ? (
            <View pointerEvents="none" style={styles.emojiWrap}>
              <Text
                style={[
                  styles.emoji,
                  {
                    // Sized to the disc so the glyph stays inside the tap box.
                    fontSize: Math.round(discSize * 0.9),
                    opacity: scratched ? 0.45 : 1,
                  },
                ]}
              >
                {player.emoji}
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.disc,
                {
                  borderRadius: discSize / 2,
                  backgroundColor: scratched ? theme.surfaceAlt : color,
                  borderColor: queued ? theme.subMark : rgba('#000000', 0.35),
                  borderWidth: queued ? 2.5 : 1.5,
                  opacity: scratched ? 0.45 : 1,
                },
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  {
                    color: scratched ? theme.textDim : contrastText(color),
                    fontSize: Math.max(11, 17 * discScale),
                  },
                ]}
              >
                {label}
              </Text>
            </View>
          )}

          {/* A queued sub still needs a hint when there's no disc to tint. */}
          {isEmoji && queued && (
            <View pointerEvents="none" style={styles.queuedDot} />
          )}

          {/* Booking flag, clipped to the top-right of the disc. */}
          {card && (
            <View
              pointerEvents="none"
              style={[
                styles.card,
                {
                  width: Math.max(7, 9 * discScale),
                  height: Math.max(10, 13 * discScale),
                  backgroundColor: card === 'red' ? theme.danger : theme.ball,
                },
              ]}
            />
          )}

          {/* Foul count (basketball) — red once fouled out. */}
          {fouls != null && fouls > 0 && (
            <View
              pointerEvents="none"
              style={[
                styles.foul,
                { backgroundColor: fouls >= FOUL_OUT ? theme.danger : theme.surfaceAlt },
              ]}
            >
              <Text style={styles.foulText}>{fouls}</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: { position: 'absolute' },
  disc: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    shadowOpacity: 0.4,
    elevation: 4,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  emojiWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    textAlign: 'center',
    // A soft shadow keeps the glyph legible over the bright pitch.
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  queuedDot: {
    position: 'absolute',
    bottom: -1,
    left: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.subMark,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.4)',
  },
  card: {
    position: 'absolute',
    top: -3,
    right: -3,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.4)',
  },
  foul: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.45)',
  },
  foulText: { color: '#ffffff', fontWeight: '800', fontSize: 10 },
});

export const PlayerDisc = React.memo(PlayerDiscBase);
