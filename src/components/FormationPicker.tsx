import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { FORMATIONS, type TeamSize } from '../lib/formations';
import { theme, radius, CONTROL_H } from '../lib/theme';

type Props = {
  size: TeamSize;
  index: number;
  onSelect: (index: number) => void;
  /**
   * On a wide bar the trigger sizes to its content. Left to flex it swallowed
   * the whole row for the sake of a short formation name.
   */
  inline?: boolean;
};

/**
 * The formation list ran to ten or more entries per size, which made the old
 * horizontal chip strip a scroll-and-hunt exercise. A dropdown shows the
 * current shape at all times and puts every option one tap away.
 */
export function FormationPicker({
  size,
  index,
  onSelect,
  inline = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const formations = FORMATIONS[size];
  const current = formations[index];

  const choose = (i: number) => {
    void Haptics.selectionAsync();
    onSelect(i);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.trigger,
          inline && styles.triggerInline,
          pressed && styles.pressed,
        ]}
        onPress={() => setOpen(true)}
      >
        {/*
          No "Formation" label: the value is self-evidently a formation, and
          dropping it makes this one line tall like every other control in the
          bar instead of standing a head above them.
        */}
        <Text style={styles.current} numberOfLines={1}>
          {current?.name ?? '—'}
        </Text>
        <Text style={styles.caret}>⌄</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.grip} />
          <Text style={styles.title}>Formation</Text>
          <Text style={styles.sub}>
            {formations.length} shapes for {size}v{size}
          </Text>

          <FlatList
            data={formations}
            keyExtractor={(f) => f.name}
            style={styles.list}
            renderItem={({ item, index: i }) => {
              const on = i === index;
              return (
                <Pressable
                  style={[styles.row, on && styles.rowOn]}
                  onPress={() => choose(i)}
                >
                  <Text style={[styles.rowText, on && styles.rowTextOn]}>
                    {item.name}
                  </Text>
                  {on && <Text style={styles.check}>✓</Text>}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    // Matches the step buttons and the gear so the row reads as one band.
    height: CONTROL_H,
    borderRadius: radius.md,
    backgroundColor: theme.control,
    borderWidth: 1,
    borderColor: theme.controlBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    shadowOpacity: 0.35,
    elevation: 4,
  },
  triggerInline: { flex: 0, minWidth: 132 },
  pressed: { opacity: 0.85 },
  current: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '700',
  },
  caret: { color: theme.textDim, fontSize: 18, marginTop: -3, marginLeft: 10 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: theme.scrim },
  sheet: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 24,
    maxHeight: '72%',
    backgroundColor: theme.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 18,
  },
  grip: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: theme.border,
    marginBottom: 14,
  },
  title: { color: theme.text, fontSize: 20, fontWeight: '800' },
  sub: { color: theme.textDim, fontSize: 13, marginTop: 2, marginBottom: 12 },
  list: { flexGrow: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    marginBottom: 6,
    backgroundColor: theme.control,
  },
  rowOn: { backgroundColor: theme.text },
  rowText: { color: theme.text, fontSize: 16, fontWeight: '600' },
  rowTextOn: { color: theme.bg, fontWeight: '700' },
  check: { color: theme.bg, fontSize: 16, fontWeight: '800' },
});
