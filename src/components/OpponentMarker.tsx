import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';
import { theme } from '../lib/theme';

const R = 16;
const HIT = 26;

type Props = {
  index: number;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  markerScale: number;
  onMove: (index: number, x: number, y: number) => void;
};

/**
 * Opponents are drawn as an X rather than a disc — the same convention as a
 * coach's whiteboard, and it keeps them visually subordinate to your own
 * players without needing a second colour ramp.
 */
function OpponentMarkerBase({
  index,
  x: px,
  y: py,
  scaleX,
  scaleY,
  markerScale,
  onMove,
}: Props) {
  const x = useSharedValue(px);
  const y = useSharedValue(py);
  const pressed = useSharedValue(0);

  useEffect(() => {
    x.value = withSpring(px, { damping: 18, stiffness: 180 });
    y.value = withSpring(py, { damping: 18, stiffness: 180 });
  }, [px, py, x, y]);

  const pan = Gesture.Pan()
    .minDistance(2)
    .onStart(() => {
      pressed.value = withTiming(1, { duration: 120 });
    })
    .onChange((e) => {
      x.value += e.changeX / scaleX;
      y.value += e.changeY / scaleY;
    })
    .onEnd(() => {
      pressed.value = withTiming(0, { duration: 160 });
      // onMove is a JS-thread setter; the gesture callback runs on the UI
      // thread, so it must be marshalled across or the app crashes.
      runOnJS(onMove)(index, x.value, y.value);
    });

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value * scaleX - HIT * markerScale },
      { translateY: y.value * scaleY - HIT * markerScale },
      { scale: 1 + pressed.value * 0.14 },
    ],
    opacity: 0.75 + pressed.value * 0.25,
  }));

  const size = HIT * 2 * markerScale;
  const arm = R * markerScale;
  const c = size / 2;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.wrap, { width: size, height: size }, style]}>
        <Svg width={size} height={size}>
          <Line
            x1={c - arm}
            y1={c - arm}
            x2={c + arm}
            y2={c + arm}
            stroke={theme.opponent}
            strokeWidth={3.5}
            strokeLinecap="round"
          />
          <Line
            x1={c + arm}
            y1={c - arm}
            x2={c - arm}
            y2={c + arm}
            stroke={theme.opponent}
            strokeWidth={3.5}
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, top: 0, zIndex: 5 },
});

export const OpponentMarker = React.memo(OpponentMarkerBase);
