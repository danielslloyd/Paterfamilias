# Paterfamilias — CLAUDE.md

## Project Overview

**Paterfamilias** is a browser-based hot-seat multiplayer strategy game set in Ancient Rome. 3–4 players control noble Roman families competing to establish a dynasty by producing 4 successive emperors. The core of the design is the **web of family obligations**: every paterfamilias has a wife and a mother from two different rival families, whose traits power his household and whose families collect his tribute. It runs entirely in the browser with no build step, no dependencies, and no server.

**Play it:** Open `index.html` in any modern browser.

---

## Tech Stack

- **Vanilla JavaScript (ES6+)** — no frameworks, no bundler
- **HTML5 + CSS3** — single `index.html` entry point
- **Inline SVG** — the empire map (`js/map.js`)
- **Zero external dependencies**
- **localStorage** — save/load game state

---

## Repository Structure

```
/
├── index.html                # Single HTML entry point; all game UI markup
├── css/
│   └── styles.css            # All styles
├── js/
│   ├── game-config.js        # Centralized balance constants (tune here first)
│   ├── event-card.js         # 22 empire event cards; estate-sync helpers; rehydration
│   ├── game-state.js         # Core state, decks, provinces, kinship helpers, save/load
│   ├── player.js             # Family: traits engine, aging/death, generational succession
│   ├── card.js               # 25 card definitions (×2 copies each) and effects
│   ├── map.js                # SVG map of the Mediterranean (RomanMap)
│   ├── actions.js            # Playable actions; income & tribute flow; end-turn upkeep
│   ├── succession.js         # Imperial succession, dynasty tracking, coup logic
│   ├── marriage.js           # Marriage negotiation, dowry, tribute rates, divorce
│   ├── ui.js                 # UI rendering, modal system, hot-seat dialogs
│   └── main.js               # DOMContentLoaded init, keyboard shortcuts, auto-save
├── README.md                 # Player-facing how-to-play guide
└── roman_dynasty_game_design.md  # Original design document (historical reference;
                                  # the implementation has since evolved — code + this file win)
```

Scripts are loaded in dependency order via `<script>` tags in `index.html`:
`game-config → event-card → game-state → player → card → map → actions → succession → marriage → ui → main`.
There is no module system; each file exposes a single global `const` (e.g. `GameState`, `Player`, `Actions`, `UI`, `RomanMap`).

---

## Architecture

### Data Flow

```
main.js (startGame)
  → GameState.init()         # players, wives/mothers, children, provinces, decks
  → UI.init()                # binds DOM events, first render
  → UI.startTurn()           # income phase for current player
      → Actions.processIncome()   # estates → tax → tributes → player
      → UI.render(); UI.showTurnBanner()   # hot-seat handoff

UI.handleEndTurn()
  → Actions.drawCards(player, 2)      # capped at maxHandSize (8)
  → Actions.endTurn()                 # aging (+extra for emperor/poison), death check,
                                      # births, unmarried penalty, per-round empire upkeep
  → Player.resetTurnFlags()
  → GameState.nextPlayer()            # calls nextTurn() when the round completes
  → UI.startTurn()
```

### Turn Structure

| Phase | Flag | Notes |
|-------|------|-------|
| Income | (automatic at turn start) | Estate income → Emperor's tax → mother tribute → wife tribute → player keeps rest. Tributes pay **at least 1 gold** when owed. |
| Core Action | `player.actionTaken` | One of: military contribution, economic development, political maneuvering, marriage negotiation (consumed on a **concluded** marriage), plot coup |
| Free actions | — | Declare Emperor (Republic, threshold met), Divorce, Read the Omens |
| Card Play | `player.cardPlayed` | Play up to 1 card. Discarding is **optional** (no mandatory discard). |
| Imperial | (Emperor only) | Tax rate, campaign, estate distribution, counter influence |
| End | (automatic) | Draw 2, age, death check, per-round military decay/revolts/tax penalty |

---

## Key Game Concepts

### The Family Web (the design's center of gravity)
- Each player's **wife** and **mother** come from two different rival families; their families receive tribute (% of gross income) every turn.
- **Generational turnover**: on a pater's death, the eldest son ≥16 succeeds; the **widow becomes the new mother** (her family tie and tribute rate carry over), and the heir starts **unmarried**. No eligible heir → a distant relative takes over and **all ties are severed** (succession crisis penalties).
- **Marriage negotiation** is a real two-player dialog (hot-seat): dowry (based on bride's traits) + tribute rate (5–25%) with an accept/counter/refuse flow. `Marriage.concludeMarriage` finalizes.
- **Betrothal Pact card**: promises a daughter to another family's *next* pater; auto-marries at succession.
- **Kinship** (`GameState.areKin`, `GameState.getKinFamilyIds`): kin are protected from Raid/Denounce/Blackmail/Rumors; Assassinate/Poison against kin cost impiety; kin of the Emperor gain +1 Support/turn, add +10 each to his coup defense, and lose Support when he falls violently.

### Female traits (must all have mechanical effect)
Implemented in `Player.femaleTraitCount(player, trait)` (counts wife + mother; doubled by Divine Favor):
Financial Acumen (+20% income), Political Savvy (+1 V/turn), Beloved by People (+1 S/turn), Fertile (+15% births), Pious (religious/omen discounts), Influential (+10 coup defense, −15% assassination), Scheming (intrigue discounts, +15 coup attack, +15% assassination).

### Age & Death
- Paters have an **age** (start 38–46); death probability per turn from `GameConfig.deathCurve` (2% under 50 → 60% at 80+).
- **Emperors age +1 extra per turn**; Poison adds +2 years once.

### The Counter (1–100) & Succession
- +1/turn; weights: `popularity = (100-counter)/100`, `virtue = counter/100`.
- **Imperial threshold** = `max(30, counter × 0.5)` (`GameState.getImperialThreshold`). Becoming the first Emperor is a **declaration** (free action); at counter ≥40 the Senate acclaims the strongest candidate automatically.
- Succession on emperor death: reigning dynasty's family scores ×1.25 legitimacy; no eligible candidate → **interregnum** (Republic restored, everyone suffers).
- **Win:** 4 successive emperors from one family.

### Empire destabilization (the second axis of tension)
- Legions decay per round: `1 + provincesHeld/3`; each province needs 10 strength.
- Every succession −5 military, every coup attempt −10, emperor assassination −10, interregnum −15.
- Below requirement → newest province **revolts** and all estates there are lost by their owners.
- Conquest follows the **historical order** of `GameConfig.provinces` (Sicilia 241 BC → Dacia AD 106).

### Coups
- Core action, cost `25 + 10×(dynastyCount−1)` (`Succession.getCoupCost`). Odds are **shown to the plotter** (`Succession.getCoupOdds`). Failure executes the plotter's pater; success kills the Emperor and runs the normal succession formula (the plotter is not guaranteed the throne).

---

## Configuration (game-config.js)

All balance values are centralized in `GameConfig`. **Always modify balance here, never hardcode in logic files.** Notable knobs: `imperialMinAuctoritas`, `deathCurve`, `coup.*`, `tributeRateMin/Max`, `kinEmperorSupportPerTurn`, `militaryDecayPerProvincesHeld`, `dynastyWinThreshold`.

---

## Development Guidelines

### No Build System / No Test Framework
- Edit files, refresh browser. Use `Ctrl+S`/`Ctrl+L` in-game to save/load during testing.
- A headless simulation harness pattern exists for balance work: load the non-UI modules into a `node vm` context with a stubbed `localStorage`, run bot-policy games, and check completion rates/lengths. (See PR history for an example harness.)

### Code Conventions
- Module pattern: each file exports a single `const` object with methods. No `class`, no ES modules.
- Balance numbers come from `GameConfig`, never hardcoded.
- Log via `GameState.log(message)`, not `console.log`.
- Resource mutations through `Player.addResources()` / `Player.payCost()` where possible (they clamp at 0).
- **Card effects return `false` to refuse an illegal play** (cost is refunded, card stays in hand).
- **Estate moves must keep `player.estates` and `province.estates[].ownerId` in sync** — use the patterns in `event-card.js` (`eventAwardEstate`/`eventSeizeEstate`).

### Save/Load Rehydration (important)
Cards and event cards carry functions that JSON.stringify drops. `GameState.load()` calls `GameState.rehydrate()`, which rebuilds them via `CardDefinitions.rehydrate(card)` (matched by `defId`) and `rehydrateEventCard(card)` (matched by `id`). **Any new card/event must have a stable `defId`/`id` and be registered in its definitions list**, or saves will break.

### Adding a New Card
1. Add an `add(defId, name, type, cost, description, effect, needsTarget)` line in `CardDefinitions.getDefinitions()` in `card.js`
2. Add the effect function to `CardDefinitions` (return `false` for illegal plays)
3. Targeting is driven by the `needsTarget` flag — no UI list to update

### Adding a New Event Card
1. Add the event object (with unique `id`) to `EventCardDefinitions` in `event-card.js`
2. Follow the `{ id, name, description, type, execute(state) }` shape; `execute` receives `GameState.state`

### Adding a New Action
1. Add the function to `Actions` in `actions.js`
2. Add the button to `index.html` (`data-action="..."` for core actions)
3. Handle it in `UI.handleAction()` / `UI.handleImperialAction()` in `ui.js`

### Touching the Map
`js/map.js` holds hand-drawn SVG polygon paths keyed by **province name** (must match `GameConfig.provinces[].name`), plus `labelPositions` and `shortNames`. New provinces need a path + label entry.

---

## Modal System

Two distinct mechanisms — do not confuse them:

| Element | Used for | Open | Close |
|---------|----------|------|-------|
| `#modal-overlay` | All in-game dialogs (negotiation, coup, tax, distribution, turn banner) | `UI.showModal(html)` | `UI.closeModal()` |
| `#setup-modal` (class `modal`) | Initial player setup | `style.display = 'flex'` | `style.display = 'none'` |

When checking whether a game modal is open (e.g., keyboard shortcuts), check `#modal-overlay` explicitly.

Multi-step hot-seat dialogs (marriage negotiation, senate motion direction, estate distribution) keep transient state on `UI` (`UI.negotiation`, `UI.distribution`) and re-render the modal between steps.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | End turn (no modal open, not typing in an input) |
| `Ctrl+S` | Save game |
| `Ctrl+L` | Load game |

---

## Save / Load

- `GameState.save()` → localStorage key `romanDynastyGame`; `GameState.load()` restores **and rehydrates** card/event functions.
- Auto-save every 30 seconds (not during `setup`/`game_over`).

---

## Known Limitations / Future Work

- No AI players — purely hot-seat multiplayer
- Marriage negotiation supports one counter-offer round (no free-form haggling)
- Trade Monopoly auto-picks the richest province (no picker UI)
- No network play, no undo system
- Name pool can exhaust in very long games (falls back to epithets like "the Younger")
