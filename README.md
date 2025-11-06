# Roman Dynasty Game - Prototype

A hot-seat multiplayer strategy game set in Ancient Rome where players control powerful families competing to establish a dynasty by producing 4 successive emperors.

## How to Play

1. **Start the Game**: Open `index.html` in a web browser
2. **Setup**: Choose the number of players (3-4) and enter family names
3. **Game Flow**: Each player takes turns going through the following phases:
   - **Income & Obligations**: Automatically collect estate income and pay taxes/tribute
   - **Core Action**: Choose ONE action (Contribute to Military, Economic Development, Political Maneuvering, or Marriage Negotiation)
   - **Card Play**: Optionally play 1 card from your hand
   - **Card Management**: Must discard 1 card, then draw 2 cards
   - **Imperial Actions**: If you're the Emperor, you can take special actions
   - **End Turn**: Click "End Turn" to finish your turn

## Win Condition

Be the first family to produce **4 successive emperors**. If another family interrupts your succession, your counter resets!

## Key Mechanics

### Resources
- **Gold**: Used for everything - cards, actions, bribes
- **Popular Support**: Helps you become Emperor early in the game
- **Auctoritas (Virtue)**: Helps you become Emperor later in the game

### The Counter System
- The game starts at Counter = 1 (100% Popularity-based succession)
- Each turn, the Counter increases by 1 (max 100)
- As the Counter increases, succession favors Auctoritas over Popular Support
- This creates a natural transition from Republic → Empire

### Family Web
- Each player is connected to 2 other players through marriage (wife's family and mother's family)
- You pay tribute to both families
- Women have powerful traits that affect your family

### Cards
- 25 unique cards across 5 categories: Military, Political, Intrigue, Economic, Religious
- Each card costs gold (and sometimes other resources)
- Cards can dramatically change the game state

### Becoming Emperor
- **First Emperor**: When Counter × 0.5 ≤ Your Auctoritas, you can become Emperor
- **Succession**: When Emperor dies, succession score = (Popularity% × Popular Support) + (Virtue% × Auctoritas)
- **Dynasty Counter**: Same family = increment counter; Different family = reset to 1

## Tips

1. **Early Game**: Focus on Popular Support - it's easier to become Emperor
2. **Mid Game**: Balance both resources as the counter rises
3. **Late Game**: Auctoritas becomes more important
4. **Marriage**: Don't neglect your wife - her traits are powerful!
5. **Children**: Sons become heirs, daughters can be married for alliances
6. **Estates**: More estates = more gold = more power
7. **Watch the Counter**: It tells you what strategy to pursue

## Keyboard Shortcuts

- **Enter**: End turn
- **Ctrl+S**: Save game
- **Ctrl+L**: Load game

## Game Features

✅ Hot-seat multiplayer (3-4 players)
✅ All 25 cards implemented
✅ Marriage system with family connections
✅ Imperial succession with dynasty tracking
✅ 4 core actions per turn
✅ Age and death mechanics
✅ Estate management and income
✅ Counter system (Republic → Empire transition)
✅ Auto-save every 30 seconds

## File Structure

```
game/
├── index.html           # Main game interface
├── css/
│   └── styles.css       # All styling
├── js/
│   ├── game-state.js    # Core game state management
│   ├── player.js        # Player class and logic
│   ├── card.js          # All 25 card definitions and effects
│   ├── actions.js       # Turn actions and mechanics
│   ├── succession.js    # Imperial succession logic
│   ├── marriage.js      # Marriage negotiation system
│   ├── ui.js            # UI rendering and updates
│   └── main.js          # Game initialization and loop
└── README.md            # This file
```

## Technical Details

- **Technology**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **No dependencies**: Runs entirely in the browser
- **State Management**: All game state in memory (saved to localStorage)
- **Architecture**: Modular design with clear separation of concerns

## Future Enhancements (Not in MVP)

- AI players
- Animations and sound effects
- Online multiplayer
- Province map visualization
- Senate voting mechanics
- Praetorian Guard institution
- General/Priestess roles for children
- Campaign targeting specific provinces
- More complex coup mechanics

## Credits

Based on the game design document for a Roman Dynasty strategy game. Prototype built with Claude Code.

---

**Enjoy building your dynasty and may the gods favor your family!** 🏛️
