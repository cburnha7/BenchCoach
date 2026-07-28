import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type { Team } from '../lib/types';

type Props = {
  teams: Team[];
  editing: boolean;
  onReorder: (from: number, to: number) => void;
  renderItem: (team: Team) => React.ReactNode;
  /** Card height and the gap between cards, driving the drag stride. */
  cardHeight: number;
  gap: number;
  paddingTop: number;
  paddingBottom: number;
};

/**
 * The team list. In edit mode a card can be held and dragged to reorder the
 * list; the rest slide out of the way and the new order is saved on drop.
 */
export function DraggableTeamList({
  teams,
  editing,
  onReorder,
  renderItem,
  cardHeight,
  gap,
  paddingTop,
  paddingBottom,
}: Props) {
  const dragIndex = useSharedValue(-1);
  const dragY = useSharedValue(0);
  const stride = cardHeight + gap;

  return (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop, paddingBottom }}
      // While editing, a vertical drag must move a card, not scroll the list.
      scrollEnabled={!editing}
    >
      <View style={{ height: Math.max(0, teams.length * stride - gap) }}>
        {teams.map((t, i) => (
          <Row
            key={t.id}
            index={i}
            count={teams.length}
            editing={editing}
            cardHeight={cardHeight}
            stride={stride}
            dragIndex={dragIndex}
            dragY={dragY}
            onReorder={onReorder}
          >
            {renderItem(t)}
          </Row>
        ))}
      </View>
    </ScrollView>
  );
}

function Row({
  index,
  count,
  editing,
  cardHeight,
  stride,
  dragIndex,
  dragY,
  onReorder,
  children,
}: {
  index: number;
  count: number;
  editing: boolean;
  cardHeight: number;
  stride: number;
  dragIndex: SharedValue<number>;
  dragY: SharedValue<number>;
  onReorder: (from: number, to: number) => void;
  children: React.ReactNode;
}) {
  const buzz = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const last = count - 1;

  const pan = Gesture.Pan()
    .enabled(editing)
    .activateAfterLongPress(200)
    .onStart(() => {
      dragIndex.value = index;
      dragY.value = 0;
      runOnJS(buzz)();
    })
    .onUpdate((e) => {
      dragY.value = e.translationY;
    })
    .onEnd(() => {
      // Clamp inline — a worklet can't call a plain JS helper.
      const raw = Math.round((index * stride + dragY.value) / stride);
      const target = Math.max(0, Math.min(last, raw));
      if (target !== index) runOnJS(onReorder)(index, target);
      dragIndex.value = -1;
      dragY.value = 0;
    });

  const style = useAnimatedStyle(() => {
    const d = dragIndex.value;
    if (d === index) {
      // The lifted card follows the finger.
      return {
        transform: [{ translateY: index * stride + dragY.value }, { scale: 1.03 }],
        zIndex: 100,
      };
    }
    if (d === -1) {
      // Idle: sit at the natural slot with no animation (avoids a mount slide).
      return { transform: [{ translateY: index * stride }, { scale: 1 }], zIndex: 1 };
    }
    // Another card is being dragged — shift to open a gap for its target slot.
    const raw = Math.round((d * stride + dragY.value) / stride);
    const target = Math.max(0, Math.min(last, raw));
    let slot = index;
    if (d < index && target >= index) slot = index - 1;
    else if (d > index && target <= index) slot = index + 1;
    return {
      transform: [
        { translateY: withTiming(slot * stride, { duration: 160 }) },
        { scale: 1 },
      ],
      zIndex: 1,
    };
  });

  return (
    <Animated.View style={[styles.row, { height: cardHeight }, style]}>
      <GestureDetector gesture={pan}>
        <View>{children}</View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  row: { position: 'absolute', left: 0, right: 0 },
});
