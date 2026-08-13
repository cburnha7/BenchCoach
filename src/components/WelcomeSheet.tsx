import React, { useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme, radius } from '../lib/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

type Step = { emoji: string; title: string; body: string };

const STEPS: Step[] = [
  {
    emoji: '👋',
    title: 'Welcome to Bench Coach',
    body: 'Set your lineup, track everyone’s minutes, and run subs and set plays right from the sideline. It all stays on this device.',
  },
  {
    emoji: '➕',
    title: 'Build your team',
    body: 'Tap “Add team” to name it and pick your size and colour. Add players from the Roster — or scan a printed roster with the camera.',
  },
  {
    emoji: '✋',
    title: 'Work the board',
    body: 'Drag a player to move them. Double-tap to give the ball or play a pass. Tap once for subs, jersey numbers and more.',
  },
  {
    emoji: '⏱️',
    title: 'Minutes & subs',
    body: 'Start the clock and it counts each player’s minutes. Line up subs, then tap “Send Em” to make them all at once.',
  },
  {
    emoji: '🥅',
    title: 'Score & tactics',
    body: 'Tap + on the scoreboard to log goals or baskets. Use the gear for the opponent shadow, run trails and clearing the board.',
  },
  {
    emoji: '⚽🏀🥍',
    title: 'Pick your sport',
    body: 'Tap the sport name at the top to switch between Soccer, Basketball and Lacrosse — each with its own field, positions and formations.',
  },
];

/**
 * First-run walkthrough. A swipeable set of cards covering the main flows,
 * opened once automatically and any time from the home screen’s “?” button.
 */
export function WelcomeSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const scroller = useRef<ScrollView>(null);
  const [pageW, setPageW] = useState(0);
  const [idx, setIdx] = useState(0);

  const last = STEPS.length - 1;

  const onLayout = (e: LayoutChangeEvent) => setPageW(e.nativeEvent.layout.width);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (pageW > 0) setIdx(Math.round(e.nativeEvent.contentOffset.x / pageW));
  };

  const next = () => {
    if (idx >= last) {
      onClose();
      return;
    }
    scroller.current?.scrollTo({ x: (idx + 1) * pageW, animated: true });
    setIdx(idx + 1);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.sheet, { paddingTop: insets.top + 8 }]}>
        <View style={styles.top}>
          <Text style={styles.kicker}>Getting started</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={styles.skip}>{idx >= last ? 'Done' : 'Skip'}</Text>
          </Pressable>
        </View>

        <View style={styles.pager} onLayout={onLayout}>
          {pageW > 0 && (
            <ScrollView
              ref={scroller}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onScroll}
            >
              {STEPS.map((s) => (
                <View key={s.title} style={[styles.page, { width: pageW }]}>
                  <View style={styles.emojiWrap}>
                    <Text style={styles.emoji}>{s.emoji}</Text>
                  </View>
                  <Text style={styles.title}>{s.title}</Text>
                  <Text style={styles.body}>{s.body}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.dots}>
          {STEPS.map((s, i) => (
            <View key={s.title} style={[styles.dot, i === idx && styles.dotOn]} />
          ))}
        </View>

        <Pressable
          style={[styles.next, { marginBottom: insets.bottom + 14 }]}
          onPress={next}
        >
          <Text style={styles.nextText}>{idx >= last ? 'Get started' : 'Next'}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 20 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  kicker: {
    color: theme.textDim,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  skip: { color: theme.text, fontSize: 16, fontWeight: '700' },
  pager: { flex: 1 },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  emojiWrap: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  emoji: { fontSize: 56, textAlign: 'center' },
  title: {
    color: theme.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    color: theme.textDim,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 360,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 18,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.border,
  },
  dotOn: { backgroundColor: theme.live, width: 20 },
  next: {
    paddingVertical: 16,
    borderRadius: radius.lg,
    backgroundColor: theme.live,
    alignItems: 'center',
    shadowColor: theme.live,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 18,
    shadowOpacity: 0.3,
    elevation: 8,
  },
  nextText: { color: theme.onAccent, fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
});
