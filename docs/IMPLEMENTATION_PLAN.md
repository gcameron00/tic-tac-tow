# Implementation Plan

This document captures the plan for building out the Tic-Tac-Toe site. It is
kept in the repo as a record of the intended design and as a guide for future
work.

## 1. Goals & constraints

- **Elegant** UI for **one or two players** (Tic-Tac-Toe / noughts and crosses).
- **One-player** mode adds computer **"thinking time"** so moves feel natural.
- Occasional **WarGames (1983) references** for a bit of fun.
- **Static** site: HTML + CSS + JS, **no framework**, no build step.
- Hosted on **Cloudflare Pages**.
- Document the project: `README.md`, an **About** page, and this plan.

## 2. Architecture

Single-page game plus a static About page. All logic runs client-side.

| Concern            | Where it lives                     |
| ------------------ | ---------------------------------- |
| Markup / layout    | `index.html`, `about/index.html`   |
| Styling / themes   | `assets/css/styles.css`            |
| Game engine + AI   | `assets/js/main.js`                |
| Icon               | `assets/favicon.svg`               |
| Docs               | `README.md`, `docs/`               |

### State model

A single `state` object holds the board (`Array(9)`), current player, mode
(1 or 2), difficulty, game-over/busy flags, and cumulative scores. Rendering is
derived from state; input handlers mutate state then re-render.

### Turn flow

1. Human clicks an empty cell → place mark.
2. Check for winner/draw; if the round is over, update scores and stop.
3. Otherwise switch player.
4. In one-player mode, if it's the computer's turn, trigger `computerMove()`,
   which sets a "thinking" status, waits a randomized delay, then plays.

## 3. The computer opponent

Three selectable levels, so casual players can win but purists can't:

- **Playful (easy):** picks a uniformly random legal move.
- **Wary (medium):** win-if-possible → block-if-needed → weighted
  center/corner/random. Solid but beatable.
- **W.O.P.R. (hard):** **minimax** with depth weighting (prefers faster wins and
  slower losses). Plays perfectly — unbeatable, so the human's best result is a
  draw. This is the on-brand WarGames setting.

"Thinking time" is a randomized `setTimeout` (roughly 0.45–1.35s, longer on
harder levels) that also drives an animated "thinking…" status.

## 4. WarGames references

Sprinkled, not spammed:

- Landing tagline: *"Shall we play a game?"*
- Occasional WOPR one-liners on new rounds and before some computer moves
  (probabilistic, ~28–35%).
- Draw and loss messages riff on *"the only winning move is not to play."*

## 5. Accessibility & UX

- Cells are real `<button>`s (keyboard + screen-reader friendly) with ARIA
  grid/gridcell roles and descriptive labels.
- Status line is an `aria-live="polite"` region.
- Focus-visible outlines throughout.
- `prefers-color-scheme` for light/dark; `prefers-reduced-motion` to disable
  animations.
- Responsive board via `aspect-ratio` and `clamp()` typography.

## 6. Deliverables (build-out checklist)

- [x] Documentation: `README.md`, About page, this plan.
- [x] Elegant responsive front end (`index.html` + `styles.css`).
- [x] Game engine: two-player local play.
- [x] One-player mode with AI and thinking time.
- [x] Difficulty levels including unbeatable minimax.
- [x] WarGames references.
- [x] Win/draw detection, winning-line highlight, score tracking, resets.
- [x] Theme-aware favicon.

## 7. Possible future enhancements

- Persist scores and preferences in `localStorage`.
- Let the human choose to play O / move second.
- Sound effects (respecting a mute toggle).
- Larger boards / variants (e.g. 4×4, gravity mode).
- Lightweight unit tests for the win-detection and minimax functions.
- A subtle "WOPR simulating" board flicker on the hard level.
