import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MatchBackdrop } from '../../src/components/MatchBackdrop';
import { Field } from '../../src/components/Field';
import { ClockBar } from '../../src/components/ClockBar';
import { FormationPicker } from '../../src/components/FormationPicker';
import { BoardSettings } from '../../src/components/BoardSettings';
import { RosterSheet } from '../../src/components/RosterSheet';
import { SubSheet } from '../../src/components/SubSheet';
import { BadgeSheet } from '../../src/components/BadgeSheet';
import { useTeams } from '../../src/store/useTeams';
import { useMatch, onFieldCount } from '../../src/store/useMatch';
import { DEFAULT_COLOR } from '../../src/lib/types';
import { theme, radius, CONTROL_H } from '../../src/lib/theme';

/**
 * Past this width every control fits on one line, so both bars and the footer
 * collapse into a single row and the field takes the rest of the screen.
 *
 * 740 rather than 700: the bar needs about 715pt for its contents, and an iPad
 * mini in portrait is 744. Anything narrower would wrap.
 */
const WIDE_BREAKPOINT = 740;

export default function TeamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;

  const hydrate = useTeams((s) => s.hydrate);
  const hydrated = useTeams((s) => s.hydrated);
  const team = useTeams((s) => s.teams.find((t) => t.id === id));

  const match = useMatch((s) => s.match);
  const load = useMatch((s) => s.load);
  const unload = useMatch((s) => s.unload);
  const setFormation = useMatch((s) => s.setFormation);
  const runAllQueued = useMatch((s) => s.runAllQueued);

  const [rosterOpen, setRosterOpen] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);
  const [actionFor, setActionFor] = useState<string | null>(null);
  const [badgeFor, setBadgeFor] = useState<string | null>(null);
  const [trailsOn, setTrailsOn] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!team) return;
    void load(team.id, team.size);
    return () => unload();
  }, [team?.id, team?.size, load, unload, team]);

  if (!hydrated) return <View style={styles.screen} />;

  if (!team) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ title: 'Not found' }} />
        <Text style={styles.missing}>That team no longer exists.</Text>
      </View>
    );
  }

  const color = team.color ?? DEFAULT_COLOR;
  const ready = match && match.teamId === team.id;
  const queued = ready ? match.queue.length : 0;
  const boardActive =
    ready && (match.opponent.on || trailsOn || match.arrows.length > 0);

  return (
    <View style={styles.screen}>
      <MatchBackdrop />
      <Stack.Screen options={{ title: team.name }} />

      {!wide && <ClockBar />}

      <View style={[styles.controls, wide && styles.controlsWide]}>
        {wide && <ClockBar inline />}
        {ready && (
          <FormationPicker
            size={team.size}
            index={match.formationIdx}
            onSelect={setFormation}
            inline={wide}
          />
        )}
        <Pressable
          style={({ pressed }) => [
            styles.gear,
            boardActive && styles.gearOn,
            pressed && styles.pressed,
          ]}
          onPress={() => setBoardOpen(true)}
        >
          <Text style={[styles.gearIcon, boardActive && styles.gearIconOn]}>
            ⚙
          </Text>
        </Pressable>

        {wide && <View style={styles.spacer} />}

        {wide && (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                styles.btnWide,
                pressed && styles.pressed,
              ]}
              onPress={() => setRosterOpen(true)}
            >
              <Text style={styles.btnText}>Roster</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                styles.btnWide,
                queued > 0 ? styles.btnAlert : styles.btnOff,
                pressed && styles.pressed,
              ]}
              onPress={runAllQueued}
              disabled={queued === 0}
            >
              <Text
                style={[
                  styles.btnText,
                  queued > 0 ? styles.btnTextAlert : styles.btnTextOff,
                ]}
              >
                {queued > 0 ? `Run ${queued}` : 'No subs'}
              </Text>
            </Pressable>
          </>
        )}
      </View>

      <Field color={color} trailsOn={trailsOn} onPlayerAction={setActionFor} />

      {!wide && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
          <Pressable
            style={({ pressed }) => [
              styles.btn,
              styles.btnStacked,
              pressed && styles.pressed,
            ]}
            onPress={() => setRosterOpen(true)}
          >
            <Text style={styles.btnText}>Roster</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.btn,
              queued > 0 ? styles.btnAlert : styles.btnOff,
              pressed && styles.pressed,
            ]}
            onPress={runAllQueued}
            disabled={queued === 0}
          >
            <Text
              style={[
                styles.btnText,
                queued > 0 ? styles.btnTextAlert : styles.btnTextOff,
              ]}
            >
              {queued > 0
                ? `Run ${queued} sub${queued > 1 ? 's' : ''}`
                : 'No subs queued'}
            </Text>
          </Pressable>
        </View>
      )}

      <BoardSettings
        visible={boardOpen}
        onClose={() => setBoardOpen(false)}
        trailsOn={trailsOn}
        onToggleTrails={setTrailsOn}
      />
      <RosterSheet
        visible={rosterOpen}
        onClose={() => setRosterOpen(false)}
        teamName={team.name}
        color={color}
        onEditBadge={(pid) => setBadgeFor(pid)}
      />
      <SubSheet
        outId={actionFor}
        onClose={() => setActionFor(null)}
        onEditBadge={(pid) => {
          setActionFor(null);
          setBadgeFor(pid);
        }}
      />
      <BadgeSheet playerId={badgeFor} onClose={() => setBadgeFor(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  missing: { color: theme.textDim, textAlign: 'center', marginTop: 60 },
  controls: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
  },
  /** Wide layout: clock, formation, gear and actions all on one row. */
  controlsWide: {
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    shadowOpacity: 0.4,
    elevation: 6,
  },
  pressed: { opacity: 0.82 },
  gear: {
    width: 54,
    height: CONTROL_H,
    borderRadius: radius.md,
    backgroundColor: theme.control,
    borderWidth: 1,
    borderColor: theme.controlBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    shadowOpacity: 0.35,
    elevation: 4,
  },
  gearOn: { backgroundColor: theme.text, borderColor: theme.text },
  gearIcon: { color: theme.textDim, fontSize: 22 },
  gearIconOn: { color: theme.bg },
  footer: { paddingHorizontal: 12, paddingTop: 6 },
  /**
   * Shorter than before — 44pt tall, which is Apple's minimum target and no
   * more. Every point saved here goes straight to the field.
   */
  btn: {
    height: CONTROL_H,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    backgroundColor: theme.control,
    borderWidth: 1,
    borderColor: theme.controlBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    shadowOpacity: 0.35,
    elevation: 5,
  },
  btnStacked: { marginBottom: 6 },
  /** Pushes the action buttons to the trailing edge of the wide bar. */
  spacer: { flex: 1 },
  /** On a wide screen these sit inline, so they size to their content. */
  btnWide: { minWidth: 88 },
  btnOff: { opacity: 0.5 },
  btnAlert: {
    backgroundColor: theme.queued,
    borderColor: theme.queued,
    shadowColor: theme.queued,
    shadowOpacity: 0.4,
  },
  btnText: { color: theme.text, fontWeight: '800', fontSize: 15 },
  btnTextOff: { color: theme.textDim },
  btnTextAlert: { color: theme.bg },
  countBox: { alignItems: 'center' },
  count: {
    color: theme.text,
    fontSize: 19,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  countLabel: {
    color: theme.textDim,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 1,
  },
});
