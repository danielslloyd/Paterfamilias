# Paterfamilias — CLAUDE.md

## Project Overview

**Paterfamilias** is a browser-based hot-seat multiplayer strategy game set in Ancient Rome. 3–4 players control noble Roman families competing to establish a dynasty by producing 4 successive emperors. It runs entirely in the browser with no build step, no dependencies, and no server.

**Play it:** Open `index.html` in any modern browser.

---

## Tech Stack

- **Vanilla JavaScript (ES6+)** — no frameworks, no bundler
- **HTML5 + CSS3** — single `index.html` entry point
- **Zero external dependencies**
- **localStorage** — save/load game state

---

## Repository Structure

```
/
├── index.html                # Single HTML entry point; all game UI markup
├── css/
│   └── styles.css            # All styles (~868 lines)
├── js/
│   ├── game-config.js        # Centralized balance constants (tune here first)
│   ├── game-state.js         # Core state object, initialization, card/event deck management
│   ├── player.js             # Player class: resources, traits, family, income, death
│   ├── card.js               # 25 card definitions (5 types × 5 cards) and effects
│   ├── event-card.js         # 20 empire-wide event cards and queue system
│   ├── succession.js         # Imperial succession, dynasty tracking, coup logic
│   ├── marriage.js           # Marriage proposals, tributes, divorce
│   ├── actions.js            # All playable actions (military, economic, political, imperial)
│   ├── ui.js                 # UI rendering, modal system, event handlers
│   └── main.js               # DOMContentLoaded init, keyboard shortcuts, auto-save
├── README.md                 # Player-facing how-to-play guide
└── roman_dynasty_game_design.md  # Full design document (authoritative reference)
```

Scripts are loaded in dependency order via `<script>` tags in `index.html`. There is no module system.

---

## Architecture

### Global State Pattern

All modules are plain objects attached to `window`. Load order matters:

```
game-config.js  →  game-state.js  →  player.js  →  card.js  →  event-card.js
→  succession.js  →  marriage.js  →  actions.js  →  ui.js  →  main.js
```

Each module exposes a single `const` (e.g., `GameState`, `Player`, `Actions`, `UI`) accessible globally.

### Data Flow

```
main.js (init)
  → GameState.init()         # creates players, provinces, decks
  → UI.init()                # binds DOM events, first render
  → UI.startTurn()           # income phase for current player
      → Actions.processIncome()
      → UI.render()

UI.handleEndTurn()           # end of each player's turn
  → Actions.drawCards()
  → Actions.endTurn()        # age family, death check, military decay
  → Player.resetTurnFlags()
  → GameState.nextPlayer()   # advances index; calls nextTurn() when round completes
  → UI.startTurn()           # begins next player's turn
```

### Turn Structure

Each player's turn follows these phases (enforced by flags on the player object):

| Phase | Flag | Notes |
|-------|------|-------|
| Income | (automatic at turn start) | Estate income → accumulated → distributed when threshold met |
| Core Action | `player.actionTaken` | One of: military contribution, economic development, political maneuvering, marriage |
| Card Play | `player.cardPlayed` | Play one card from hand |
| Card Discard | `player.cardDiscarded` | Discard one card (enforced before end-turn) |
| Draw | (automatic at end-turn) | Draw 2 cards |
| Imperial | (Emperor only) | Set tax, launch campaign, distribute estates, influence counter |

---

## Key Game Concepts

### Resources
- **Gold** — primary currency; accumulated from estates, then distributed (taxes → mother tribute → wife tribute → player)
- **Popular Support (S)** — needed for Popularity-based succession (early game / Republic)
- **Auctoritas (V)** — needed for Virtue-based succession (late game / Empire)

### The Counter (1–100)
- Starts at 1 (pure Popularity) and increments +1 per turn, capped at 100 (pure Virtue)
- Controls succession weights: `popularity_weight = (100 - counter) / 100`, `virtue_weight = counter / 100`
- Emperor can spend 15g to shift it ±3

### Succession
- Triggered by emperor death or successful coup
- Candidates must meet `checkImperialThreshold(auctoritas)` = `auctoritas >= (counter × 0.5)`
- Winner is highest `(popularSupport × popularity_weight) + (auctoritas × virtue_weight)`
- Dynasty counter tracks consecutive emperors from the same family
- **Win condition:** 4 successive emperors from one family

### Family Web
- Each player has a **wife** (from another family) and **mother** (from yet another family)
- These create tribute obligations: when income is distributed, a % goes to wife's and mother's families
- Unmarried penalty: −1 Popular Support per turn

### Event Cards
- Separate 20-card deck; one event executes every full round cycle
- 5 upcoming cards visible face-down in the event queue
- "Read the Omens" (5g) reveals the next 3 cards

---

## Configuration (game-config.js)

All balance values are centralized in `GameConfig`. **Always modify balance here, never hardcode in logic files.**

Key tunable values:
```js
GameConfig.maxPaterfamiliasTurns   // 10 — turns before forced succession
GameConfig.dynastyWinThreshold     // 4 — successive emperors to win
GameConfig.counterIncrementPerTurn // 1 — how fast game shifts to virtue
GameConfig.initialMilitaryStrength // 100
GameConfig.militaryDecayPerTurn    // 1 — per round
GameConfig.startingGold            // 10
GameConfig.eventCardDrawFrequency  // 1 — event every N full rounds
```

---

## Development Guidelines

### No Build System
- Edit files directly and refresh the browser
- No compilation, bundling, transpilation, or minification
- No package.json, no npm scripts

### No Test Framework
- Testing is manual via browser devtools
- Use `console.log` and the game's own log system for debugging

### Making Changes
1. Edit the relevant JS or CSS file
2. Open/refresh `index.html` in browser
3. Use `Ctrl+S` / `Ctrl+L` in-game to save/load state during testing

### Code Conventions
- Module pattern: each file exports a single `const` object with methods
- No classes (`class` keyword), no ES modules (`import`/`export`)
- Balance numbers always come from `GameConfig`, not hardcoded
- Game log messages via `GameState.log(message)`, not `console.log`
- Player resource mutations go through `Player.addResources()` / `Player.payCost()` where possible (they enforce non-negative bounds)

### Adding a New Card
1. Add the card definition to `CardDefinitions.getAllCards()` in `card.js`
2. Add the effect function to `CardDefinitions` in `card.js`
3. If the card type needs targeting, ensure it's included in the `needsTarget` list in `ui.js:handlePlayCard`

### Adding a New Event Card
1. Add the event object to the array returned by `createEventDeck()` in `event-card.js`
2. Follow the `{ name, description, type, execute(state) }` shape
3. `execute` receives the full `GameState.state` object

### Adding a New Action
1. Add the action function to `Actions` in `actions.js`
2. Add the button to `index.html` with `data-action="your-action-name"`
3. Handle it in `UI.handleAction()` or `UI.handleImperialAction()` in `ui.js`

---

## Modal System

There are two distinct modal mechanisms — do not confuse them:

| Element | Used for | How to open | How to close |
|---------|----------|-------------|--------------|
| `#modal-overlay` | In-game dialogs (tax, estates, targets, omens) | `UI.showModal(html)` | `UI.closeModal()` |
| `#setup-modal` (class `modal`) | Initial player setup | `setupModal.style.display = 'flex'` | `setupModal.style.display = 'none'` |

When checking whether any modal is open (e.g., to block keyboard shortcuts), check `#modal-overlay` explicitly:
```js
document.getElementById('modal-overlay').style.display !== 'flex'
```
Do **not** use `document.querySelector('.modal')` — that only matches `#setup-modal`.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | End turn (when no modal is open and end-turn button is enabled) |
| `Ctrl+S` | Save game |
| `Ctrl+L` | Load game |

---

## Save / Load

- `GameState.save()` serializes full state to `localStorage` key `romanDynastyGame`
- `GameState.load()` deserializes and replaces `GameState.state`
- Auto-save runs every 30 seconds (only when not in `setup` phase)
- After loading, call `UI.render()` to refresh display

---

## Known Limitations / Future Work

- No AI players — purely hot-seat multiplayer
- Marriage negotiation is auto-accepted at 5% tribute (no real negotiation UI)
- Distribute Estates dialog is simplified (auto-distributes evenly)
- Political Alliance, Senate Motion, Oracle's Warning, and some other cards have simplified or stub effects
- No network play
- No undo system
- Children share a name pool that can produce duplicate names (low probability edge case)
