import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useMatch } from '../store/useMatch';
import { theme, radius } from '../lib/theme';

type Props = {
  color: string;
  /** Us scored — opens the goal sheet to attribute the scorer/assist. */
  onAddUs: () => void;
};

/**
 * Slim game scoreboard under the pitch. Them on the left, Us on the right
 * (matching the coach's own side of the board). Them's buttons and Us's minus
 * just nudge the number; Us's plus goes through the goal sheet so the goal is
 * credited to a player. Long-press either score to reset the game to 0–0.
 */
export function ScoreBoard({ color, onAddUs }: Props) {
  const match = useMatch((s) => s.match);
  const bumpScore = useMatch((s) => s.bumpScore);
  const resetScore = useMatch((s) => s.resetScore);

  if (!match) return null;

  const reset = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resetScore();
  };

  const Stepper = ({
    side,
    label,
    value,
    accent,
    onPlus,
  }: {
    side: 'them' | 'us';
    label: string;
    value: number;
    accent?: string;
    onPlus: () => void;
  }) => (
    <View style={styles.block}>
      <Pressable
        style={({ pressed }) => [styles.step, pressed && styles.pressed]}
        onPress={() => bumpScore(side, -1)}
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
    <View style={styles.bar}>
      <Stepper
        side="them"
        label="THEM"
        value={match.score.them}
        onPlus={() => bumpScore('them', 1)}
      />
      <View style={styles.divider} />
      <Stepper
        side="us"
        label="US"
        value={match.score.us}
        accent={color}
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
  block: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
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
