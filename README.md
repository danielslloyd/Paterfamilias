# Paterfamilias — A Roman Dynasty Game

A hot-seat multiplayer strategy game set in Ancient Rome. 3–4 players lead noble families bound to each other by marriage, competing to seat **4 successive emperors** — while the web of family obligations pulls their fates together and the empire itself strains under the weight of their ambitions.

## How to Play

1. **Start the Game**: Open `index.html` in a web browser
2. **Setup**: Choose the number of players (3–4) and enter family names
3. **Each turn**:
   - **Income & Obligations** (automatic): estates pay gold; the Emperor's tax, your mother's family, and your wife's family each take their cut
   - **Core Action**: choose ONE — Contribute to Military, Economic Development, Political Maneuvering, Marriage Negotiation, or Plot a Coup
   - **Card Play**: optionally play 1 card (discarding is optional; you draw 2 at end of turn, hand cap 8)
   - **Imperial Actions**: the Emperor may also set taxes, launch campaigns, distribute estates, and bend Rome's institutions
   - **End Turn**: your paterfamilias ages — and may die

## The Family Web

This is the heart of the game:

- Your **wife** and your **mother** each come from a *different rival family*. Their traits work for your household every turn, and their families collect a percentage of your income as **tribute**.
- **Generations turn the web**: when your paterfamilias dies, his widow becomes the new pater's **mother** — her family tie (and its tribute rate) carries into the next generation. The heir starts **unmarried** and must negotiate a new marriage, re-weaving the web.
- **Marriage is negotiated between players**: dowry paid up front, tribute rate haggled (5–25%), and the bride's traits are worth fighting over. The rate you agree to today is the rate your heir's mother-tie inherits tomorrow.
- **Kinship cuts both ways**: kin can't be raided, denounced, or blackmailed; kin of the Emperor bask in his glory (+1 Support per turn) and rally to his defense in coups — but they're tainted when he falls, and raising a blade against kin is *impiety*.
- **Women never die** — a divorced or widowed wife returns to her family's household, traits intact, ready to be married again.

### Female Traits (the powers behind the throne)

| Trait | Effect |
|---|---|
| Financial Acumen | +20% estate income |
| Political Savvy | +1 Auctoritas / turn |
| Beloved by People | +1 Popular Support / turn |
| Fertile | +15% chance of a child each turn |
| Pious | Religious cards & Reading the Omens cost less |
| Influential | +10 coup defense, harder to assassinate |
| Scheming | Cheaper intrigue cards, +15 coup attack, deadlier assassins |

## The Empire (and its destabilization)

- **The map** shows the Mediterranean; conquest follows the historical order of Roman expansion (Sicilia 241 BC → Dacia AD 106). Click provinces for estate ownership.
- **The legions are a shared good**: every conquered province demands upkeep; anyone may contribute (and gain standing for it), but the free-rider problem is real.
- **Ambition has a price**: every succession, coup, and assassination drains the legions. If they fall below what the empire needs, the newest province **revolts** — and every family holding estates there loses them. The more powerful men vie for the throne, the more the empire rots.

## Becoming Emperor

- The **counter** (1–100) rises each turn, shifting succession from Popularity toward Virtue — the Republic hardens into Empire.
- Once your Auctoritas reaches the **imperial threshold** (30, rising with the counter), you may **declare yourself Emperor**. If nobody dares by counter 40, the Senate acclaims someone.
- On an Emperor's death: succession score = (Popularity-weight × Support) + (Virtue-weight × Auctoritas). The reigning dynasty's family gets a **legitimacy bonus** (×1.25). Highest eligible score takes the purple — dynasties continue or break.
- **Coups**: a core action with visible odds. Failure = your paterfamilias is executed. Success = the Emperor dies and the succession formula decides — *not necessarily in your favor*.
- Emperors **age faster** ("the purple weighs heavy") and wear a target on their back.

## Win Condition

First family to **4 successive emperors**. An interrupted succession resets your count.

## Keyboard Shortcuts

- **Enter**: End turn
- **Ctrl+S**: Save game — **Ctrl+L**: Load game (auto-saves every 30s)

## Technical Details

- Vanilla JavaScript (ES6+), HTML5, CSS3 — zero dependencies, no build step
- All state in memory, persisted to localStorage
- The empire map is inline SVG (`js/map.js`)

## File Structure

```
├── index.html           # Main game interface
├── css/styles.css       # All styling
└── js/
    ├── game-config.js   # All balance numbers (tune here)
    ├── game-state.js    # State, decks, provinces, save/load
    ├── player.js        # Family, traits, aging, generational succession
    ├── card.js          # 25 card definitions (×2 copies)
    ├── event-card.js    # 22 empire event cards
    ├── map.js           # SVG map of the empire
    ├── succession.js    # Imperial succession, dynasty, coups
    ├── marriage.js      # Marriage negotiation, dowry, divorce
    ├── actions.js       # Turn actions, income & tribute flow
    ├── ui.js            # Rendering, dialogs, hot-seat handoff
    └── main.js          # Init, shortcuts, auto-save
```

## Future Enhancements

- AI players
- Online multiplayer
- Praetorian Guard and other institutions
- General/Priestess roles for children
- Senate voting with real stakes

---

**May the gods favor your family — and may your in-laws stay loyal.** 🏛️
