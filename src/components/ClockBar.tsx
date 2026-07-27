import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useMatch } from '../store/useMatch';
import { formatClock } from '../lib/types';
import { theme, radius, CONTROL_H } from '../lib/theme';

type Props = {
  /**
   * Inline mode returns the controls without their own bar, so a wide layout
   * can put the clock, formation picker and buttons on a single row.
   */
  inline?: boolean;
};

export function ClockBar({ inline = false }: Props) {
  const match = useMatch((s) => s.match);
  const running = useMatch((s) => s.running);
  const startClock = useMatch((s) => s.startClock);
  const stopClock = useMatch((s) => s.stopClock);
  const resetClock = useMatch((s) => s.resetClock);
  const setHalfLen = useMatch((s) => s.setHalfLen);

  if (!match) return null;

  const toggle = () => {
    void Haptics.impactAsync(
      running
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Heavy
    );
    running ? stopClock() : startClock();
  };

  const expired = match.remaining <= 0;

  const controls = (
    <>
      {/*
        No half-length readout: before the clock starts the big time display
        already shows exactly that number, so a second copy earned nothing.
      */}
      <Pressable
        style={({ pressed }) => [
          styles.lenBtn,
          running && styles.disabled,
          pressed && styles.pressed,
        ]}
        disabled={running}
        onPress={() => setHalfLen(match.halfLen - 1)}
        hitSlop={10}
      >
        <Text style={styles.lenText}>−</Text>
      </Pressable>

      <Pressable
        onLongPress={resetClock}
        delayLongPress={600}
        style={inline ? styles.clockWrapInline : styles.clockWrap}
      >
        <Text
          style={[
            styles.clock,
            inline && styles.clockInline,
            running && styles.clockLive,
            expired && styles.clockDone,
          ]}
        >
          {formatClock(match.remaining)}
        </Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.lenBtn,
          running && styles.disabled,
          pressed && styles.pressed,
        ]}
        disabled={running}
        onPress={() => setHalfLen(match.halfLen + 1)}
        hitSlop={10}
      >
        <Text style={styles.lenText}>+</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.startBtn,
          running ? styles.stopBtn : styles.goBtn,
          pressed && styles.pressed,
        ]}
        onPress={toggle}
      >
        <Text style={styles.startText}>{running ? 'Stop' : 'Start'}</Text>
      </Pressable>
    </>
  );

  if (inline) return controls;
  return <View style={styles.bar}>{controls}</View>;
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    shadowOpacity: 0.4,
    elevation: 6,
  },
  pressed: { opacity: 0.75 },
  lenBtn: {
    width: CONTROL_H,
    height: CONTROL_H,
    borderRadius: radius.md,
    backgroundColor: theme.control,
    borderWidth: 1,
    borderColor: theme.controlBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.3 },
  lenText: { color: theme.text, fontSize: 26, fontWeight: '600', lineHeight: 30 },
  /** On a phone the clock takes the space between the two step buttons. */
  clockWrap: { flex: 1, alignItems: 'center' },
  /**
   * Inline it sizes to its content instead: on a wide bar the clock was
   * stretching across half the screen for the sake of five characters.
   */
  clockWrapInline: { minWidth: 82, alignItems: 'center' },
  clock: {
    color: theme.text,
    fontSize: 32,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  clockInline: { fontSize: 26 },
  clockLive: { color: theme.live },
  clockDone: { color: theme.danger },
  startBtn: {
    paddingHorizontal: 18,
    height: CONTROL_H,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  goBtn: { backgroundColor: theme.live },
  stopBtn: { backgroundColor: theme.danger },
  startText: { color: theme.onAccent, fontWeight: '800', fontSize: 15 },
});
