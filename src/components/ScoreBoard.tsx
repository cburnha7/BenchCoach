import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useMatch } from '../store/useMatch';
import { theme, radius } from '../lib/theme';

type Props = {
  color: string;
  /** Us scored — opens the goal sheet to attribute the scorer/assist. */
  onAddUs: () => void;
  /** Us minus — opens the list of this game's goals to remove one. */
  onRemoveUs: () => void;
  /**
   * Inline drops the bar chrome and the half-and-half stretch so the two
   * steppers can sit among the other controls in the wide (tablet) row.
   */
  inline?: boolean;
};

/**
 * Game scoreboard. Them on the left, Us on the right (the coach's own side of
 * the board). Them's buttons and Us's minus nudge the number; Us's plus goes
 * through the goal sheet so the goal is credited to a player, and Us's minus
 * opens the goal log to remove one. Long-press either score to reset to 0–0.
 */
export function ScoreBoard({ color, onAddUs, onRemoveUs, inline = false }: Props) {
  const match = useMatch((s) => s.match);
  const bumpScore = useMatch((s) => s.bumpScore);
  const resetScore = useMatch((s) => s.resetScore);

  if (!match) return null;

  const reset = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resetScore();
  };

  const Stepper = ({
    label,
    value,
    accent,
    onMinus,
    onPlus,
  }: {
    label: string;
    value: number;
    accent?: string;
    onMinus: () => void;
    onPlus: () => void;
  }) => (
    <View style={[styles.block, !inline && styles.blockFill]}>
      <Pressable
        style={({ pressed }) => [styles.step, pressed && styles.pressed]}
        onPress={onMinus}
        hitSlop={6}
      >
        <Text style={styles.stepText}>−</Text>
      </Pressable>

      <Pressable style={styles.center} onLongPress={reset} delayLongPress={600}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.score, accent ? { color: accent } : null]}>
          {value}
        </Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.step,
          styles.stepAdd,
          pressed && styles.pressed,
        ]}
        onPress={onPlus}
        hitSlop={6}
      >
        <Text style={[styles.stepText, styles.stepAddText]}>+</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={inline ? styles.inline : styles.bar}>
      <Stepper
        label="THEM"
        value={match.score.them}
        onMinus={() => bumpScore('them', -1)}
        onPlus={() => bumpScore('them', 1)}
      />
      <View style={styles.divider} />
      <Stepper
        label="US"
        value={match.score.us}
        accent={color}
        onMinus={onRemoveUs}
        onPlus={onAddUs}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: 4,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  inline: { flexDirection: 'row', alignItems: 'center' },
  block: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  blockFill: { flex: 1, justifyContent: 'space-between', gap: 0 },
  divider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: theme.border },
  step: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: theme.control,
    borderWidth: 1,
    borderColor: theme.controlBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepAdd: { backgroundColor: theme.live, borderColor: theme.live },
  stepText: { color: theme.text, fontSize: 20, fontWeight: '700', lineHeight: 22 },
  stepAddText: { color: theme.onAccent },
  pressed: { opacity: 0.7 },
  center: { alignItems: 'center', paddingHorizontal: 6 },
  label: {
    color: theme.textDim,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  score: {
    color: theme.text,
    fontSize: 26,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    lineHeight: 30,
  },
});
