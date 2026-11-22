# Ember Arcana — Duel of the Three Embers

[![Competition](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![Rank](https://make.fun/badge/best-card-game-20261122-1826/Kh43t/ember-arcana-card-duel/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![Reward](https://make.fun/badge/best-card-game-20261122-1826/Kh43t/ember-arcana-card-duel/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

An original duel card game, built for make.fun's **"Make the best card game"** bounty.

You are **Aria, the Emberwright**, duelling **Vex, the Hollow Sage**, across an arcane table. Both sides have 30 life. Each turn your mana grows (1, 2, … up to 10) and you draw a card; spend mana to play cards from your hand. First to win **2 rounds** takes the match.

## The cards

Three elements, told apart by colour **and** shape — never by text alone:

- **Ember ▲** (red) — raw damage: Cinder Strike, Flame Lash, Inferno…
- **Tide ●** (blue) — healing and shields: Soothing Rain, Tidewall, Moon Tide…
- **Thorn ◆** (green) — damage plus guard: Thorn Whip, Bramble Guard, Root Grasp…

**Resonance:** play two cards of the same element in one turn and the second one hits +2 harder — damage, healing or shield. Chaining elements is the whole game.

## The opponent

Vex is a real AI, not a random player: it checks for lethal, heals when wounded, raises shields when you threaten it, and chases its own Resonance chains. Its thinking is written to the battle log ("Vex raises a wall of thorns…") so you can read its plan and answer it.

## Feel

- Cards slide in on the deal, lift on hover, and glow when you can afford them
- Floating damage / heal / shield numbers, animated life bars, round banners
- Procedural WebAudio sound: card snaps, damage thuds, healing chimes, a win fanfare — plus a gentle music loop (M to mute). No audio files, no network: everything is local.

## Controls

- **Mouse:** click a card to play it, click End Turn
- **Keyboard:** `1–7` play a card · `Enter` / `E` end turn · `M` mute · `H` help · `R` rematch on the end screens

## Play it

```sh
node serve.ts   # then open http://localhost:8080 in desktop Chrome
```

Or open `game/index.html` from any static server. The game is plain static files under `game/` — no build step, no network requests, no libraries.

## Layout

- `game/index.html` — the page: title, table, win and loss screens
- `game/styles.css` — the table, the cards, the animations
- `game/src/cards.js` — the 15-card catalogue and Resonance rules
- `game/src/deck.js` — shuffling, drawing, discarding
- `game/src/game.js` — turns, mana, rounds, win / loss
- `game/src/ai.js` — Vex's decisions, scored and explained
- `game/src/render.js` — hands, life/mana bars, log, floating numbers
- `game/src/audio.js` — procedural WebAudio sounds and music
- `game/src/main.js` — boot, input, Vex's turn pacing, screenshot presets
- `main.ts` — the make.fun hand-in program (copies `game/` + `screenshots/` to `/output`, writes `dossier.json`)
- `screenshots/` — title, mid-game table, win and loss screens, taken in a real browser

## License

MIT — see [LICENSE](LICENSE).
