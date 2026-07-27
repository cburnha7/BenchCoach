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

// Card height (88) + list gap (11): the vertical stride between cards.
const CARD_H = 88;
const GAP = 11;
const STRIDE = CARD_H + GAP;

type Props = {
  teams: Team[];
  editing: boolean;
  onReorder: (from: number, to: number) => void;
  renderItem: (team: Team) => React.ReactNode;
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
  paddingTop,
  paddingBottom,
}: Props) {
  const dragIndex = useSharedValue(-1);
  const dragY = useSharedValue(0);

  return (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop, paddingBottom }}
      // While editing, a vertical drag must move a card, not scroll the list.
      scrollEnabled={!editing}
    >
      <View style={{ height: teams.length * STRIDE }}>
        {teams.map((t, i) => (
          <Row
            key={t.id}
            index={i}
            count={teams.length}
            editing={editing}
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
  dragIndex,
  dragY,
  onReorder,
  children,
}: {
  index: number;
  count: number;
  editing: boolean;
  dragIndex: SharedValue<number>;
  dragY: SharedValue<number>;
  onReorder: (from: number, to: number) => void;
  children: React.ReactNode;
}) {
  const buzz = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const clamp = (v: number) => Math.max(0, Math.min(count - 1, v));

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
      const target = clamp(Math.round((index * STRIDE + dragY.value) / STRIDE));
      if (target !== index) runOnJS(onReorder)(index, target);
      dragIndex.value = -1;
      dragY.value = 0;
    });

  const style = useAnimatedStyle(() => {
    const d = dragIndex.value;
    if (d === index) {
      // The lifted card follows the finger.
      return {
        transform: [{ translateY: index * STRIDE + dragY.value }, { scale: 1.03 }],
        zIndex: 100,
      };
    }
    if (d === -1) {
      // Idle: sit at the natural slot with no animation (avoids a mount slide).
      return { transform: [{ translateY: index * STRIDE }, { scale: 1 }], zIndex: 1 };
    }
    // Another card is being dragged — shift to open a gap for its target slot.
    let slot = index;
    const target = clamp(Math.round((d * STRIDE + dragY.value) / STRIDE));
    if (d < index && target >= index) slot = index - 1;
    else if (d > index && target <= index) slot = index + 1;
    return {
      transform: [
        { translateY: withTiming(slot * STRIDE, { duration: 160 }) },
        { scale: 1 },
      ],
      zIndex: 1,
    };
  });

  return (
    <Animated.View style={[styles.row, style]}>
      <GestureDetector gesture={pan}>
        <View>{children}</View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  row: { position: 'absolute', left: 0, right: 0, height: CARD_H },
});
