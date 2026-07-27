# Bench Coach — Expo rebuild

Youth soccer lineups, minutes, and tactics. All data stays on-device.

Rebuilt from the original single-file Capacitor web app onto Expo SDK 57 /
React Native 0.86, so the tactics board runs on native gesture handling and the
same codebase ships to both the App Store and Google Play.

---

## Running it

```bash
npm install --legacy-peer-deps
npx expo start
```

Scan the QR code with Expo Go on your phone. No Mac required for development.

`--legacy-peer-deps` is needed because `expo-router` pulls web-only dependencies
(`vaul`, `@radix-ui/*`) that want `react-dom`, which this project doesn't
install. They're unused on native.

### Useful scripts

| Command | What it does |
|---|---|
| `npm run typecheck` | `tsc --noEmit` across the project |
| `npm run build:ios` | EAS production build for iOS |
| `npm run build:android` | EAS production build for Android |
| `npm run submit:ios` | Submit the latest build to App Store Connect |

---

## Architecture

```
app/                     expo-router file-based routes
  _layout.tsx            gesture root, safe area, dark stack
  index.tsx              home — team list, new team modal
  team/[id].tsx          match screen — field, clock, formations, sheets
src/
  lib/
    formations.ts        all 27 formations, generated from the original app
    types.ts             domain model, clock formatting, id generation
    theme.ts             palette carried over from the original design
  store/
    storage.ts           typed AsyncStorage repository
    useTeams.ts          team registry
    useMatch.ts          match state: roster, clock, minutes, subs
  components/
    Pitch.tsx            Skia-drawn pitch (static, drawn once)
    PlayerDisc.tsx       draggable disc, UI-thread gestures
    Field.tsx            composes pitch + player layer
    ClockBar.tsx         half clock and length controls
    RosterSheet.tsx      live minutes per player
    SubSheet.tsx         substitution picker
```

### Two decisions worth knowing about

**Skia draws the pitch; the players are native views.** The obvious approach is
to draw everything in one Skia canvas, but then every drag re-renders the whole
canvas. Instead the pitch is a static Skia layer that never re-renders during
play, and each player disc is its own `Animated.View` whose transform is driven
on the UI thread by Reanimated. Dragging a player touches nothing else on
screen. Position is committed to the store once, on release.

**Storage is AsyncStorage behind a repository interface**, not SQLite. This is a
change from the original plan. The current data — teams, roster, current
minutes — is a small object graph with no queries against it, so SQLite would be
setup cost with no payoff today. When game history lands and the data becomes
genuinely relational (games → appearances → minutes, season totals), swap the
implementation inside `src/store/storage.ts` and the stores don't change.

### Field coordinate space

Positions are stored in the original app's 600 × 840 space, where the pitch
occupies y 8..768 and the bench row sits at y 831. `Field.tsx` computes a single
scale factor to fit the screen and passes it down; discs convert gesture deltas
back into field units. Keeping this space means every formation ported over
without adjustment, and saved matches from the original data model line up.

---

## Building for the stores

Both bundle IDs are `com.charlesburnham.benchcoach`, matching the original app —
so builds land on the same App Store Connect record rather than creating a
second listing.

```bash
npm install -g eas-cli
eas login
eas build --platform ios --profile production
eas build --platform android --profile production
```

EAS handles signing, so no Xcode and no keystore management.

`.github/workflows/eas-build.yml` runs the same thing on push. It needs one
secret: `EXPO_TOKEN`, from **expo.dev → Account Settings → Access Tokens**.

---

## What's ported and what isn't

**Working:**

- Teams: create, colour, size (7v7 / 9v9 / 11v11), delete
- All 27 formations across the three sizes, tap to apply
- Drag players anywhere on the pitch, springs back into formation on change
- Half clock with adjustable length, long-press the time to reset
- Per-player minutes, accumulating only while on field, unscratched, clock running
- Substitutions: immediate or queued, run individually or all at once
- Scratch a player to pause their minutes
- Bench auto-layout
- Haptics on drag start and substitution
- Everything persists across app restarts

- Opponent shadow team: toggle on, drag the X markers, reset the shape
- Pass arrows, numbered in sequence, with a possession ring on the player
  holding the ball
- Movement trails drawn from any drag longer than a nudge
- Team photos on the team cards
- Jersey number and icon badge editor

**Still open:**

- Animated play-back of a pass sequence
- Season totals across games (needs the game-history model first)

## The two modes

The match screen splits into **Lineup** and **Tactics**, because the two jobs
want different controls and cramming both into one bar made every button
smaller than it should be for a phone held at arm's length in the cold.

- **Lineup** shows the formation picker. Tap a player to give them the ball,
  hold for subs and options.
- **Tactics** shows opponent and board controls, and drags leave movement
  trails behind.

The original used a 250ms timer to tell a single tap from a double tap, which
cost a quarter-second on every substitution. Tap and long-press are separate
gestures here, so there is no delay on either.

## The backdrop

The stadium behind the app is drawn in Skia, not photographed — see
`src/components/StadiumBackdrop.tsx`. It is an empty ground at dusk seen from
the technical area: horizon at 58% so it sits at bench eye level, four
floodlight pylons, deterministic seat dots that compress toward the top of the
stand, and a dugout roofline across the bottom.

Drawing it rather than shipping a JPEG keeps it a few kilobytes, renders sharp
on every screen density, and means the palette is exactly the app's palette. It
also has no licensing attached, which a stock photo would.

It runs at half intensity behind the match screen so the pitch stays the
brightest thing on screen during a game.
