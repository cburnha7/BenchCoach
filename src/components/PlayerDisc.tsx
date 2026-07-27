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
import { badgeLabel, type Card, type Player } from '../lib/types';

export const DISC_R = 30;
/** Extra touch radius (field units) around the disc, for a generous tap area. */
const TAP_PAD = 14;

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
  /** Booking to flag on the disc, if any. */
  card?: Card;
  /** True when this player is on the ball. */
  hasBall: boolean;
  /** Committed once, on release, in field coordinates. */
  onMove: (id: string, x: number, y: number) => void;
  /** Called on release with where the drag began, so a trail can be drawn. */
  onDragEnd: (
    id: string,
    origin: { x: number; y: number },
    to: { x: number; y: number },
    carriedBall: boolean
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
   *   hold then drag  — move the player
   *   double tap      — give the ball, or play a pass to them
   *   single tap      — open the action sheet (subs, badge, scratch)
   *
   * Pan only activates after a hold, so a tap can never be swallowed by a
   * stray few pixels of finger movement. The single tap waits for the double
   * tap to fail, which is what makes both work on the same target.
   */
  const pan = Gesture.Pan()
    .activateAfterLongPress(220)
    .onStart(() => {
      originX.value = x.value;
      originY.value = y.value;
      pressed.value = withTiming(1, { duration: 120 });
      runOnJS(buzz)();
    })
    .onChange((e) => {
      x.value += e.changeX / scaleX;
      y.value += e.changeY / scaleY;
    })
    .onEnd(() => {
      pressed.value = withTiming(0, { duration: 160 });
      runOnJS(onMove)(player.id, x.value, y.value);
      runOnJS(onDragEnd)(
        player.id,
        { x: originX.value, y: originY.value },
        { x: x.value, y: y.value },
        hasBall
      );
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(260)
    .maxDelay(260)
    .onEnd((_e, success) => {
      if (success) runOnJS(ball)(player.id);
    });

  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .maxDuration(260)
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

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ring.value * 0.9,
    transform: [{ scale: 1 + ring.value * 0.16 }],
  }));

  const label = badgeLabel(player);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[styles.wrap, { width: touchSize, height: touchSize }, animatedStyle]}
      >
        <View style={{ width: discSize, height: discSize }}>
          {/* Possession ring, drawn just outside the disc edge. */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ring,
              {
                borderRadius: discSize / 2,
                borderWidth: Math.max(2, 3 * discScale),
                borderColor: theme.ball,
              },
              ringStyle,
            ]}
          />
          <View
            style={[
              styles.disc,
              {
                borderRadius: discSize / 2,
                backgroundColor: scratched ? theme.surfaceAlt : color,
                borderColor: queued ? theme.queued : rgba('#000000', 0.35),
                borderWidth: queued ? 3 : 1.5,
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
  ring: { ...StyleSheet.absoluteFill },
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
  card: {
    position: 'absolute',
    top: -3,
    right: -3,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.4)',
  },
});

export const PlayerDisc = React.memo(PlayerDiscBase);
