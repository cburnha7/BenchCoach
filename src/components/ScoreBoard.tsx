import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useMatch } from '../store/useMatch';
import { theme, radius } from '../lib/theme';

type Props = {
  color: string;
  /** Us scored — opens the goal sheet to attribute the scorer/assist. */
  onAddUs: () => void;
  /** Us minus — opens the list of this game's goals to remove one. */
  onRemoveUs: () => void;
  /** Tapping the board (anywhere but the ± buttons) opens the game overview. */
  onOpenOverview: () => void;
  /**
   * Inline drops the bar chrome and the half-and-half stretch so the two
   * steppers can sit among the other controls in the wide (tablet) row.
   */
  inline?: boolean;
};

/**
 * Game scoreboard. Them on the left, Us on the right (the coach's own side of
 * the board). The ± buttons adjust the score — Us's plus goes through the goal
 * sheet, its minus through the goal log. Tapping anywhere else opens the game
 * overview (goals, cards, reset).
 */
export function ScoreBoard({
  color,
  onAddUs,
  onRemoveUs,
  onOpenOverview,
  inline = false,
}: Props) {
  const match = useMatch((s) => s.match);
  const bumpScore = useMatch((s) => s.bumpScore);

  if (!match) return null;

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

      <View style={styles.center}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.score, accent ? { color: accent } : null]}>
          {value}
        </Text>
      </View>

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
      <Pressable
        style={({ pressed }) => [styles.overviewBtn, pressed && styles.pressed]}
        onPress={onOpenOverview}
        hitSlop={8}
      >
        <Text style={styles.overviewIcon}>📋</Text>
      </Pressable>
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
  overviewBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: theme.control,
    borderWidth: 1,
    borderColor: theme.controlBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  overviewIcon: { fontSize: 15 },
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
  stepAdd: { backgroundColor: theme.control, borderColor: theme.controlBorder },
  stepText: { color: theme.text, fontSize: 20, fontWeight: '700', lineHeight: 22 },
  stepAddText: { color: theme.text },
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
