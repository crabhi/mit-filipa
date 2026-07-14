# Mít Filipa

Party quiz game for one phone passed around: single-page app, Czech UI, no build step, no backend.

## Files

- `index.html` — the whole app (inline CSS + JS, no external dependencies).
- `kvizove_otazky.json` — 100 questions; each has `otazka` and 10 `moznosti` (`text`, `spravne`, `vysvetleni`), always exactly 5 correct.

## Game rules

- Setup: add players (min 1, remembered across games), choose rounds (default 3). Turns rotate round-robin.
- All players in one round get the same question; only the answer order is reshuffled per turn (so watching a previous turn doesn't map positions to picks). The deck holds one question per round.
- Player picks answers one at a time with immediate right/wrong feedback.
- Scoring ladder by correct picks: 1, 3, 6, 9, 18 points. Player may bank ("Vzít X bodů") anytime; 5/5 auto-banks 18.
- One wrong pick = bust: turn ends, 0 points, the wrong answer's explanation is shown in the banner.
- Never reveal unpicked answers — at turn end they dim uniformly with no truth marks or explanations.
- After all rounds: scoreboard, replay with same roster or new setup.
- The handoff screen has a small "Ukončit hru" link; confirming it discards the game and returns to setup (roster stays remembered).

## Tech decisions

- Questions load via `fetch('kvizove_otazky.json')` into a variable at boot — the app requires an HTTP server (`python3 -m http.server` in dev, a webserver in production); `file://` is not supported. Fetch failure shows an error screen with a retry button. Offline packaging is planned but not implemented.
- All state in localStorage under `game.*` keys (in-progress game lives in `game.state`): roster, known names, rounds, used question IDs (no repeats until the pool is exhausted), and the full in-progress game (reload mid-turn → "Pokračovat" resumes exactly, including picks).
- Layout: locked to `100dvh`, `overflow:hidden` — no screen ever scrolls. Answers are a 5×2 grid that flexes to fill the viewport; fonts clamp on `dvh`. Answer texts are short (max 37 chars) so two columns are safe.
- No web fonts (offline requirement) — system font stacks only. Animations are pure CSS and never block input; `prefers-reduced-motion` disables them.
- All user/data strings go through `esc()` before hitting innerHTML.

## Verifying changes

The sandbox here can't bind ports or launch browsers — for in-browser verification, ask the user to open the game themselves (or run a server via `! python3 -m http.server`). Syntax-only check: extract the inline `<script>` to a file and run `node --check` on it.
