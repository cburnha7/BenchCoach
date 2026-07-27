import React from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { FormationPicker } from './FormationPicker';
import { useMatch } from '../store/useMatch';
import { theme, radius } from '../lib/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  trailsOn: boolean;
  onToggleTrails: (on: boolean) => void;
};

/**
 * Board options behind the gear. These are set once and left alone for most of
 * a match, so they don't earn permanent space next to the formation picker.
 */
export function BoardSettings({
  visible,
  onClose,
  trailsOn,
  onToggleTrails,
}: Props) {
  const match = useMatch((s) => s.match);
  const toggleOpponent = useMatch((s) => s.toggleOpponent);
  const setOpponentFormation = useMatch((s) => s.setOpponentFormation);

  if (!match) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.grip} />
        <Text style={styles.title}>Board</Text>

        <View style={styles.row}>
          <View style={styles.rowMain}>
            <Text style={styles.rowLabel}>Opponents</Text>
            <Text style={styles.rowHint}>
              Draggable markers in a mirrored shape
            </Text>
          </View>
          <Switch
            value={match.opponent.on}
            onValueChange={toggleOpponent}
            trackColor={{ false: theme.controlBorder, true: theme.live }}
            thumbColor={theme.text}
          />
        </View>

        {match.opponent.on && (
          <View style={styles.oppFormation}>
            <FormationPicker
              size={match.size}
              index={match.opponent.formationIdx}
              onSelect={setOpponentFormation}
              title="Opponent formation"
            />
          </View>
        )}

        <View style={styles.row}>
          <View style={styles.rowMain}>
            <Text style={styles.rowLabel}>Trace runs</Text>
            <Text style={styles.rowHint}>
              Dragging a player leaves a trail behind
            </Text>
          </View>
          <Switch
            value={trailsOn}
            onValueChange={onToggleTrails}
            trackColor={{ false: theme.controlBorder, true: theme.live }}
            thumbColor={theme.text}
          />
        </View>

        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Controls</Text>
          <Text style={styles.legendRow}>
            <Text style={styles.legendKey}>Double tap</Text>  give the ball, or
            pass to them
          </Text>
          <Text style={styles.legendRow}>
            <Text style={styles.legendKey}>Tap</Text>  sub
          </Text>
          <Text style={styles.legendRow}>
            <Text style={styles.legendKey}>Hold and drag</Text>  move a player
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: theme.scrim },
  sheet: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 24,
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
  title: { color: theme.text, fontSize: 20, fontWeight: '800', marginBottom: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  rowMain: { flex: 1 },
  rowLabel: { color: theme.text, fontSize: 16, fontWeight: '600' },
  rowHint: { color: theme.textDim, fontSize: 12.5, marginTop: 3 },
  oppFormation: { marginTop: 12 },
  legend: {
    marginTop: 16,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: theme.surfaceAlt,
    gap: 7,
  },
  legendTitle: {
    color: theme.textDim,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  legendRow: { color: theme.textDim, fontSize: 13 },
  legendKey: { color: theme.text, fontWeight: '700' },
});
