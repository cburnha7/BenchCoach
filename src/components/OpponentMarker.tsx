import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../lib/theme';

const OPP_R = 21;
const OPP_PAD = 16;
/** Min spacing (field units) between recorded points on the drag trail. */
const SAMPLE_DIST = 16;

type Props = {
  index: number;
  x: number;
  y: number;
  label: string;
  scaleX: number;
  scaleY: number;
  markerScale: number;
  hasBall: boolean;
  onMove: (index: number, x: number, y: number) => void;
  onDoubleTap: (index: number) => void;
  onDragEnd: (
    index: number,
    origin: { x: number; y: number },
    to: { x: number; y: number },
    points: { x: number; y: number }[]
  ) => void;
};

/**
 * An opponent: a small grey disc with its position code. Drag to move (leaving
 * an orange/grey trail when trails are on), double-tap to give them the ball.
 */
function OpponentMarkerBase({
  index,
  x: px,
  y: py,
  label,
  scaleX,
  scaleY,
  markerScale,
  hasBall,
  onMove,
  onDoubleTap,
  onDragEnd,
}: Props) {
  const x = useSharedValue(px);
  const y = useSharedValue(py);
  const originX = useSharedValue(px);
  const originY = useSharedValue(py);
  const pressed = useSharedValue(0);
  const ring = useSharedValue(0);
  const pts = useSharedValue<number[]>([]);

  useEffect(() => {
    x.value = px;
    y.value = py;
  }, [px, py, x, y]);

  useEffect(() => {
    ring.value = hasBall
      ? withRepeat(withTiming(1, { duration: 900 }), -1, true)
      : withTiming(0, { duration: 200 });
  }, [hasBall, ring]);

  const buzz = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  const ball = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDoubleTap(index);
  };

  const touchR = (OPP_R + OPP_PAD) * markerScale;
  const touchSize = touchR * 2;
  const circleSize = OPP_R * 2 * markerScale;
  const haloSize = circleSize * 1.5;

  const pan = Gesture.Pan()
    .minDistance(8)
    .onStart(() => {
      originX.value = x.value;
      originY.value = y.value;
      pts.value = [x.value, y.value];
      pressed.value = withTiming(1, { duration: 120 });
      runOnJS(buzz)();
    })
    .onChange((e) => {
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
      runOnJS(onMove)(index, x.value, y.value);
      runOnJS(onDragEnd)(
        index,
        { x: originX.value, y: originY.value },
        { x: x.value, y: y.value },
        pairs
      );
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(220)
    .onEnd((_e, success) => {
      if (success) runOnJS(ball)();
    });

  const gesture = Gesture.Race(pan, doubleTap);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value * scaleX - touchR },
      { translateY: y.value * scaleY - touchR },
      { scale: 1 + pressed.value * 0.12 },
    ],
    zIndex: pressed.value > 0 ? 20 : 5,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: hasBall ? 0.6 + ring.value * 0.4 : 0,
    transform: [{ scale: 1 + ring.value * 0.1 }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.wrap, { width: touchSize, height: touchSize }, style]}>
        <View style={{ width: circleSize, height: circleSize }}>
          {/* Orange possession halo when this opponent has the ball. */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.halo,
              {
                width: haloSize,
                height: haloSize,
                left: (circleSize - haloSize) / 2,
                top: (circleSize - haloSize) / 2,
                borderRadius: haloSize / 2,
                borderWidth: Math.max(3, 4 * markerScale),
                borderColor: theme.oppBall,
              },
              ringStyle,
            ]}
          />
          <View
            style={[
              styles.circle,
              { borderRadius: circleSize / 2 },
            ]}
          >
            <Text
              style={[styles.label, { fontSize: Math.max(9, 12 * markerScale) }]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </View>
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
    zIndex: 5,
  },
  halo: { position: 'absolute' },
  circle: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6b7280',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.35)',
  },
  label: { color: '#ffffff', fontWeight: '800', letterSpacing: 0.2 },
});

export const OpponentMarker = React.memo(OpponentMarkerBase);
