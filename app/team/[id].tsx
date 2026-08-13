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
import { ScoreBoard } from '../../src/components/ScoreBoard';
import { GoalSheet } from '../../src/components/GoalSheet';
import { GoalLogSheet } from '../../src/components/GoalLogSheet';
import { ThemScoreSheet } from '../../src/components/ThemScoreSheet';
import { GameSheet } from '../../src/components/GameSheet';
import { RosterSheet } from '../../src/components/RosterSheet';
import { SubSheet } from '../../src/components/SubSheet';
import { useTeams } from '../../src/store/useTeams';
import { useMatch, onFieldCount } from '../../src/store/useMatch';
import { offenseFormations } from '../../src/lib/sports';
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
  const resetPositions = useMatch((s) => s.resetPositions);
  const clearBoard = useMatch((s) => s.clearBoard);
  const resetOpponent = useMatch((s) => s.resetOpponent);
  const setCourtMode = useMatch((s) => s.setCourtMode);
  const toggleFlipEnds = useMatch((s) => s.toggleFlipEnds);

  // Reset the board: every player back to their home spot (where they were
  // before any dragging), the opponent shape back to its mirror, and the
  // passes/run trails wiped.
  const resetField = () => {
    resetPositions();
    clearBoard();
    resetOpponent();
  };

  const [rosterOpen, setRosterOpen] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);
  const [actionFor, setActionFor] = useState<string | null>(null);
  const [bringOnSlot, setBringOnSlot] = useState<{ x: number; y: number } | null>(
    null
  );
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalLogOpen, setGoalLogOpen] = useState(false);
  const [themOpen, setThemOpen] = useState(false);
  const [gameOpen, setGameOpen] = useState(false);
  const [trailsOn, setTrailsOn] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!team) return;
    void load(team.id, team.size, team.sport);
    return () => unload();
  }, [team?.id, team?.size, team?.sport, load, unload, team]);

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

  // Shared controls, reused between the tablet (one row) and phone layouts.
  const gearBtn = (
    <Pressable
      style={({ pressed }) => [
        styles.gear,
        boardActive && styles.gearOn,
        pressed && styles.pressed,
      ]}
      onPress={() => setBoardOpen(true)}
    >
      <Text style={[styles.gearIcon, boardActive && styles.gearIconOn]}>⚙</Text>
    </Pressable>
  );

  const resetBtn = (
    <Pressable
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      onPress={resetField}
    >
      <Text style={styles.btnText}>Reset</Text>
    </Pressable>
  );

  const rosterButton = (extra: object) => (
    <Pressable
      style={({ pressed }) => [styles.btn, extra, pressed && styles.pressed]}
      onPress={() => setRosterOpen(true)}
    >
      <Text style={styles.btnText}>Roster</Text>
    </Pressable>
  );

  const subsButton = (extra: object) => (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        extra,
        queued > 0 ? styles.btnAlert : styles.btnOff,
        pressed && styles.pressed,
      ]}
      onPress={runAllQueued}
      disabled={queued === 0}
    >
      <Text
        style={[styles.btnText, queued > 0 ? styles.btnTextAlert : styles.btnTextOff]}
      >
        {queued > 0 ? 'Send Em' : 'No subs'}
      </Text>
    </Pressable>
  );

  const formationPicker = (fill: boolean) =>
    ready ? (
      <FormationPicker
        formations={offenseFormations(team.sport, team.size, match.courtMode)}
        index={match.formationIdx}
        onSelect={setFormation}
        inline={!fill}
        fill={fill}
      />
    ) : null;

  // Basketball-only: full/half court and flip-ends, on the bottom bar.
  const courtControls =
    team.sport === 'basketball' && ready ? (
      <View style={styles.courtRow}>
        <View style={styles.segment}>
          {(['full', 'half'] as const).map((mode) => {
            const on = match.courtMode === mode;
            return (
              <Pressable
                key={mode}
                style={[styles.segBtn, on && styles.segOn]}
                onPress={() => setCourtMode(mode)}
              >
                <Text style={[styles.segText, on && styles.segTextOn]}>
                  {mode === 'full' ? 'Full' : 'Half'}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          style={({ pressed }) => [styles.btn, styles.flipBtn, pressed && styles.pressed]}
          onPress={toggleFlipEnds}
        >
          <Text style={styles.btnText}>Flip ends</Text>
        </Pressable>
      </View>
    ) : null;

  return (
    <View style={styles.screen}>
      <MatchBackdrop />
      {/* Back label defaults to the previous screen's title ("Bench Coach"),
          which competed with the team name. Force the short, quiet "Back".
          gestureEnabled off so the swipe-from-edge back gesture stops
          hijacking player drags near the left edge — use the Back button. */}
      <Stack.Screen
        options={{
          title: team.name,
          headerBackTitle: 'Back',
          gestureEnabled: false,
        }}
      />

      {wide ? (
        /* Tablet top row: the things that sit on top on phone — the clock and
           the scoreboard — on a single row. */
        <View style={[styles.controls, styles.controlsWide]}>
          <ClockBar inline />
          <View style={styles.spacer} />
          {ready && (
            <ScoreBoard
              inline
              color={color}
              onAddUs={() => setGoalOpen(true)}
              onRemoveUs={() => setGoalLogOpen(true)}
              onAddThem={() => setThemOpen(true)}
              onOpenOverview={() => setGameOpen(true)}
            />
          )}
        </View>
      ) : (
        /* Phone: scoreboard on top, then the clock, above the pitch. */
        <>
          {ready && (
            <ScoreBoard
              color={color}
              onAddUs={() => setGoalOpen(true)}
              onRemoveUs={() => setGoalLogOpen(true)}
              onAddThem={() => setThemOpen(true)}
              onOpenOverview={() => setGameOpen(true)}
            />
          )}
          <ClockBar />
        </>
      )}

      <Field
        color={color}
        trailsOn={trailsOn}
        onPlayerAction={setActionFor}
        onEmptySlot={(x, y) => setBringOnSlot({ x, y })}
      />

      {courtControls}

      {wide ? (
        /* Tablet bottom row: the things that sit at the bottom on phone —
           formation, gear, reset and the roster/subs actions — on one row. */
        <View style={[styles.footerWide, { paddingBottom: insets.bottom + 8 }]}>
          {formationPicker(false)}
          {gearBtn}
          {resetBtn}
          <View style={styles.spacer} />
          {rosterButton(styles.btnWide)}
          {subsButton(styles.btnWide)}
        </View>
      ) : (
        /* Phone: formation/gear/reset, then roster/subs, sit below the pitch. */
        <>
          <View style={styles.controls}>
            {formationPicker(true)}
            {gearBtn}
            {resetBtn}
          </View>
          <View
            style={[
              styles.footer,
              styles.footerRow,
              { paddingBottom: insets.bottom + 8 },
            ]}
          >
            {rosterButton(styles.footerBtn)}
            {subsButton(styles.footerBtn)}
          </View>
        </>
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
      />
      <SubSheet
        outId={actionFor}
        slot={bringOnSlot}
        onClose={() => {
          setActionFor(null);
          setBringOnSlot(null);
        }}
        color={color}
      />
      <GoalSheet
        visible={goalOpen}
        onClose={() => setGoalOpen(false)}
        color={color}
      />
      <GoalLogSheet
        visible={goalLogOpen}
        onClose={() => setGoalLogOpen(false)}
        color={color}
      />
      <ThemScoreSheet visible={themOpen} onClose={() => setThemOpen(false)} />
      <GameSheet
        visible={gameOpen}
        onClose={() => setGameOpen(false)}
        teamName={team.name}
        color={color}
      />
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
  /** Basketball court-mode strip below the field. */
  courtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  segment: {
    flexDirection: 'row',
    height: CONTROL_H,
    borderRadius: radius.md,
    backgroundColor: theme.control,
    borderWidth: 1,
    borderColor: theme.controlBorder,
    overflow: 'hidden',
  },
  segBtn: {
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segOn: { backgroundColor: theme.text },
  segText: { color: theme.text, fontWeight: '800', fontSize: 15 },
  segTextOn: { color: theme.bg },
  flipBtn: {},
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
  footerRow: { flexDirection: 'row', gap: 8 },
  footerBtn: { flex: 1 },
  /** Wide layout: formation, gear, reset and actions on one row below the pitch. */
  footerWide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: theme.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 12,
    shadowOpacity: 0.4,
    elevation: 6,
  },
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
