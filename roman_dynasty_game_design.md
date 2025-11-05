# Roman Dynasty Game - Design Document

## Overview
A multiplayer strategy game set in Ancient Rome where players control powerful families (gens) competing to establish a dynasty by producing 4 successive emperors.

## Win Condition
First family to produce **4 successive emperors** wins. Counter resets if another family interrupts the succession.

## Core Concepts

### Family Structure
- Each player controls one family (gens) led by a **paterfamilias**
- Each paterfamilias has:
  - A **mother** (from a different family, not wife's family)
  - A **wife** (from a different family, not mother's family)
  - **Children** (tracked individually with traits)
- Player stays with same family across generations
- Paterfamilias succession determined by player choice among sons

### Player Connections
Each player is always connected to exactly 2 other players:
1. The player controlling wife's family
2. The player controlling mother's family

This creates a web of obligations and alliances.

## Resources

### Gold
- Primary currency
- Used to: pay taxes, fund sacrifices, play cards, bribe
- Generated from: land holdings (estates in provinces)

### Popular Support
- Represents favor with the Roman people
- Key for: imperial succession, resisting coups, certain cards
- Influenced by: military contributions, public works, tax rates, decisions

### Auctoritas (Virtue)
- Represents gravitas, honor, and senatorial respect
- Key for: imperial succession, certain cards, marriage negotiations
- Influenced by: sacrifices, political choices, family behavior

### Empire Virtue/Popularity Counter
- A global counter from 1 to 100
  - **1 = All Popularity** (succession based purely on popular support)
  - **100 = All Virtue** (succession based purely on auctoritas)
- Starts at 1 (purely popularity-based)
- **Moves down by 1 each turn** (gradually shifts toward virtue)
- Can be influenced by major decisions, events, and Imperial actions
- This creates the Republican → Imperial transition naturally

**Imperial Threshold:**
- To become Emperor, a player must have:
  - `Auctoritas >= (Counter value × Threshold_multiplier)`
- Early game (low counter): No one is virtuous enough → Rome stays Republican
- Mid-game: First player crosses threshold → can declare themselves Emperor
- Late game (high counter): Succession favors the most virtuous families

## Turn Structure

### Phase 1: Income & Obligations
1. Collect gold from estates
2. Pay taxes to Emperor (X% set by Emperor)
3. Send tribute to mother's family (Y%)
4. Send tribute to wife's family (Z%)
5. Pay maintenance costs (e.g., Praetorian Guard if applicable)

### Phase 2: Core Action (Choose One)
Players choose ONE mutually exclusive action:
- **Sacrifice to Venus**: Spend gold to boost fertility (more/better children)
- **Sacrifice to Mars**: Spend gold to boost military strength OR gain popularity
- **Contribute to Military**: Pay gold, gain virtue/popularity, strengthen Rome's armies
- **Economic Development**: Improve estate yields
- **Political Maneuvering**: Gain auctoritas through Senate work
- **Marriage Negotiation**: Arrange marriages for children

### Phase 3: Card Play
- Each player has a hand of 5 cards
- Play 0-1 card per turn (costs gold + other resources)
- Hands refresh periodically (TBD: every N turns? when deck cycles?)

### Phase 4: Imperial Actions (Emperor Only)
The Emperor can take special actions:
- Set tax rate for next turn (affects popularity)
- Distribute newly conquered estates
- Launch military campaign (gamble: risk gold for provinces/popularity)
- Create/modify institutions (e.g., Praetorian Guard)
- Target rivals with political pressure
- Appoint positions (TBD)

## Marriage System

### Marriage Rules
- Paterfamilias must be married (penalty if unmarried)
- Wife must be from different family than:
  - Paterfamilias's own family
  - Mother's family
- Marriages are negotiated between players

### Marriage Negotiations
Players negotiate based on:
- **Wealth**: Rich families are attractive allies
- **Traits**: Daughters with strong traits make desirable wives
- **Tribute rates**: Can negotiate Y% and Z% rates
- **Political alliances**: Support in coups, votes, etc.

### Divorce
- Players can divorce (possibly via card or action)
- Other players can force divorces via rumor/slander cards
- Divorced state incurs penalties until remarriage
- Tribute obligations end upon divorce

### Women Never Die
- Only paterfamilias lifespan is tracked
- Wives, mothers, and daughters persist
- Simplifies the marriage web

## Character Traits

### Male Traits (Simple)
Mostly stat bonuses:
- +1 Base Auctoritas
- +1 Popular Support
- +10% Estate Income
- Military Prowess (bonus as general)

### Female Traits (Complex - More Important)
Mothers, wives, and daughters have outsized impact:
- **Financial Acumen**: Sons inherit +X% gold income
- **Political Savvy**: Family gains +X auctoritas per turn
- **Beloved by People**: Family gains +X popularity per turn
- **Fertile**: Higher chance of children, more children
- **Pious**: Cheaper/more effective sacrifices
- **Influential**: Better marriage negotiation position
- **Scheming**: Can play intrigue cards more effectively

Each character has 1-2 traits.

## Children System

### Sons
- Potential future paterfamilias (player chooses successor)
- Can become **generals** (if "extra" sons)
  - Lead military campaigns
  - Gain glory (popularity/virtue) for family
  - Risk death in battle
- Inherit traits from mother primarily

### Daughters
- Can be married to other families (creates connections)
- Can become **priestesses** (if "extra" daughters)
  - Provide virtue to family
  - Cheaper sacrifices
  - Religious influence
- Their traits matter for marriage desirability

## Military System

### Collective Military
- All families contribute to Rome's military strength
- Classic free-rider problem: benefits everyone but costs contributor
- Contributing gives virtue/popularity

### Provinces & Conquest
- The map has multiple **provinces**
- Each province contains a fixed number of **estates**
- Estates generate gold for their owners

### Military Campaigns
- Emperor decides whether to launch campaigns
- Success: 
  - New province conquered
  - New estates to distribute
  - Popularity boost for Emperor
  - Glory for generals
- Failure:
  - Gold lost
  - Popularity loss for Emperor
  - Potential death of generals
  - Potential loss of existing provinces

### Estate Distribution
- Emperor distributes estates in newly conquered provinces
- Can favor allies or consolidate own power
- Distribution decisions affect relationships

## Imperial System

### Becoming Emperor

#### Republican Start
Game begins in Republican Rome:
- Empire Virtue/Popularity Counter starts at 1 (all popularity)
- No player has enough Auctoritas to meet the Imperial threshold
- Counter increases by 1 each turn
- **First Emperor emerges** when a player's Auctoritas crosses the threshold:
  - That player can declare themselves Emperor (action/card)
  - Or succession triggered by crisis/event
- This creates organic timing: virtue accumulates while threshold lowers
- Players race to be first Emperor while building virtue

#### Succession After First Emperor
Upon Emperor's death (natural or assassination):
1. Calculate each player's succession score
2. **Score = (Popularity_weight × Popular Support) + (Virtue_weight × Auctoritas)**
   - Where: `Popularity_weight = (100 - Counter) / 100`
   - And: `Virtue_weight = Counter / 100`
   - Example at Counter=30: 70% popularity, 30% virtue
   - Example at Counter=80: 20% popularity, 80% virtue
3. Highest score becomes new Emperor
4. Must still meet minimum threshold: `Auctoritas >= Counter × Threshold_multiplier`

#### Tied Succession
TBD: Tiebreaker mechanism needed
- Most gold?
- Random?
- Military strength?

### Emperor Powers
- Set tax rate (0-50%? Higher = more unpopular)
- Distribute conquered estates
- Launch military campaigns
- Create institutions (e.g., Praetorian Guard: prevents assassination but requires ongoing bribes)
- Political pressure on rivals
- **Influence the Counter**: Emperor can take actions that shift the counter up or down
  - Populist reforms → counter moves toward popularity (down)
  - Institutional changes → counter moves toward virtue (up)
  - These decisions have other consequences (gold cost, popularity impact, etc.)

### Emperor Constraints
- High taxes = severe popularity penalty
- Failed military campaigns = popularity loss + gold loss
- Must balance popularity, virtue, and wealth
- Vulnerable to coups
- Decisions that help Rome long-term often hurt short-term popularity

### Emperor Strategy Tension
Two viable paths:
1. **Populist Path**: High popularity, risky military campaigns, low taxes, short-term thinking
2. **Virtuous Path**: High auctoritas, principled decisions, institutional building, long-term thinking

Empire slider determines which path is favored for succession.

## Coup Mechanics

### Initiating a Coup
- Non-Emperor player plays a coup card or takes coup action
- Costs gold and possibly other resources
- High risk, high reward

### Stage 1: Survival
- Does the current Emperor survive?
- Factors:
  - Emperor's Popular Support (defense)
  - Emperor's military strength (Praetorian Guard?)
  - Plotter's resources committed
  - Other players' support (TBD: do others choose sides?)
  
### Stage 2: New Emperor (if Stage 1 succeeds)
- Succession calculation runs
- Player with highest (Popular Support weight × Popular Support) + (Auctoritas weight × Auctoritas) becomes Emperor
- Not necessarily the plotter

### Failed Coup
- Plotter's paterfamilias dies
- Plotter loses significant gold
- Player must choose new paterfamilias (son)
- May trigger succession crisis in plotter's family

### Assassination vs Coup
- Assassination: Kill Emperor, trigger succession
- Coup: More complex, involves multiple players potentially

## Card System

### Hand Management
- Each player has 5 cards in hand (maximum)
- **Each turn:** Play 1 card (optional) → Discard 1 card (mandatory) → Draw 2 cards
- Net effect: +1 card per turn if you play, 0 if you don't
- Encourages active card play
- Creates hand cycling and strategic discard decisions
- Cards cost gold + potentially other resources to play

### Complete Card List (25 Cards)

#### Military Cards (5)
1. **Launch Raid**
   - Cost: 8 Gold
   - Effect: Target a province controlled by another player. Steal 1 estate from that province.
   - Risk: If target has higher military strength, lose 5 gold instead.

2. **Sabotage Campaign**
   - Cost: 6 Gold
   - Effect: Target an opponent. Their next military campaign has +30% failure chance.
   - Duration: Until their next campaign.

3. **Raise Legion**
   - Cost: 10 Gold
   - Effect: Gain +2 Popular Support and boost Rome's military strength by 10%.
   - Benefit: Makes all campaigns more likely to succeed for 3 turns.

4. **Hire Mercenaries**
   - Cost: 7 Gold
   - Effect: Immediately gain +15% military strength for your family only.
   - Duration: 2 turns.

5. **Military Tribune**
   - Cost: 5 Gold
   - Effect: Appoint one of your sons as tribune. Gain +1 Auctoritas and +1 Popular Support per turn.
   - Duration: 3 turns or until that son dies.

#### Political Cards (5)
1. **Senate Motion**
   - Cost: 6 Gold, 2 Auctoritas
   - Effect: Propose a vote affecting all players. Each player votes yes/no. Majority wins.
   - Examples: Tax rate change, estate redistribution, declare war.

2. **Bribe Senator**
   - Cost: 8 Gold
   - Effect: Gain +3 Auctoritas immediately.
   - Secondary: Choose one opponent to lose -1 Auctoritas.

3. **Denounce Rival**
   - Cost: 4 Gold
   - Effect: Target opponent loses -2 Auctoritas.
   - Risk: If target has higher Auctoritas than you, you lose -1 Auctoritas instead.

4. **Political Alliance**
   - Cost: 5 Gold
   - Effect: Propose alliance with another player. If accepted, both gain +1 Auctoritas per turn.
   - Duration: Until one player breaks it (costs 3 Auctoritas to break).

5. **Censor's Report**
   - Cost: 7 Gold
   - Effect: Force all players to reveal their current Gold, Popular Support, and Auctoritas.
   - Benefit: Gain +2 Auctoritas for exposing corruption.

#### Intrigue Cards (5)
1. **Spread Rumors**
   - Cost: 6 Gold
   - Effect: Force a divorce between target player and their wife.
   - Effect continues: Target suffers unmarried penalties until remarriage.

2. **Assassinate**
   - Cost: 12 Gold, 5 Popular Support
   - Effect: Attempt to kill target paterfamilias (Emperor or rival).
   - Success chance: 50% base, modified by target's defenses.
   - Failure: You are exposed and lose -5 Auctoritas, -10 Popular Support.

3. **Blackmail**
   - Cost: 5 Gold
   - Effect: Target opponent must choose: Pay you 8 Gold OR give you 1 estate OR lose -3 Auctoritas.
   - Requires: You must have higher Auctoritas than target.

4. **Poison**
   - Cost: 8 Gold
   - Effect: Target opponent's paterfamilias ages 2 turns instead of 1 on their next turn.
   - Can trigger early death/succession.

5. **Forge Alliance**
   - Cost: 4 Gold
   - Effect: Arrange a marriage between your daughter and target player's son.
   - Benefit: Creates new connection if both parties agree. Negotiation phase ensues.

#### Economic Cards (5)
1. **Trade Monopoly**
   - Cost: 10 Gold
   - Effect: Choose one province. Gain +1 Gold per estate in that province (even if you don't own them).
   - Duration: 4 turns.

2. **Debt Collection**
   - Cost: 3 Gold
   - Effect: Target opponent must pay you 6 Gold immediately.
   - Restriction: Can only target players who owe you tribute (mother/wife families).

3. **Estate Development**
   - Cost: 8 Gold
   - Effect: Choose up to 3 of your estates. Each produces +1 Gold per turn.
   - Duration: Permanent.

4. **Grain Dole**
   - Cost: 6 Gold
   - Effect: Spend gold to feed the people. Gain +3 Popular Support.
   - Secondary: All other players gain +1 Popular Support (shared benefit).

5. **Tax Farm**
   - Cost: 7 Gold
   - Effect: Gain +50% of the taxes you pay back to yourself next turn.
   - Duration: One-time effect next turn.

#### Religious Cards (5)
1. **Sacrifice to Venus**
   - Cost: 5 Gold
   - Effect: Boost fertility. Gain +30% chance of child this turn and next turn.
   - Quality: Children born have +1 trait.

2. **Sacrifice to Mars**
   - Cost: 6 Gold
   - Effect: Choose one: Gain +3 Popular Support OR boost Rome's military strength by 5%.
   - Duration: Military boost lasts 2 turns.

3. **Divine Favor**
   - Cost: 4 Gold
   - Effect: Choose one character trait to activate with double effectiveness.
   - Duration: 3 turns.

4. **Oracle's Warning**
   - Cost: 5 Gold
   - Effect: Block one opponent's card play this turn.
   - Timing: Play as a reaction after seeing their card.

5. **Religious Festival**
   - Cost: 7 Gold
   - Effect: Host a festival. Gain +2 Popular Support and +1 Auctoritas.
   - Secondary: All players connected to you (wife/mother families) gain +1 Popular Support.

### Card Deck Mechanics
- Total deck: 25 cards (5 of each type)
- Shuffle deck at start
- When deck is exhausted, reshuffle all discarded cards
- No limit on copies played (deck reshuffles)

## Province & Estate System

### Province Structure
- Each province has:
  - Name (e.g., Gaul, Egypt, Hispania)
  - Number of estates (fixed)
  - Conquest difficulty
  - Special resources/bonuses (TBD)

### Estate Mechanics
- Estates generate gold per turn
- Estate yield can be improved via actions/cards
- Estates can be raided, traded, or redistributed
- Losing all estates is devastating

### Starting Provinces
- Rome (Italia) starts fully divided among players
- Additional provinces conquered during game
- Military success expands the map

## Resource Formulas & Starting Values

### Estate Income
- Each estate generates **2 Gold per turn**
- Estate income can be modified by:
  - Female character traits (e.g., Financial Acumen: +10% per trait level)
  - Estate Development cards (+1 Gold per developed estate)
  - Trade Monopoly cards
  - Various temporary effects

### Starting Conditions (Per Player)
- **Gold**: 10
- **Popular Support**: 5
- **Auctoritas**: 5
- **Estates**: 5 estates (randomly distributed across starting provinces)
- **Wife**: Randomly assigned from another player's family (not mother's family)
- **Mother**: Randomly assigned from another player's family (not wife's family)
- **Children**: Start with 1-2 children (randomized)
- **Cards**: Draw 5 cards to start
- **Age**: Paterfamilias starts at age 30

### Tribute Rates (Starting)
- **Tax to Emperor**: 10% (adjustable by Emperor, 0-50%)
- **Y% to Mother's Family**: 5% (negotiable during marriage)
- **Z% to Wife's Family**: 5% (negotiable during marriage)

### Age & Death
- Each turn = 1 year
- Paterfamilias ages 1 year per turn
- Death probability increases with age:
  - Age 30-50: 2% per turn
  - Age 51-60: 5% per turn
  - Age 61-70: 10% per turn
  - Age 71+: 20% per turn
- Can be modified by Poison cards, assassination, etc.

### Imperial Threshold Formula
- To become/remain Emperor: `Auctoritas >= (Counter × 0.5)`
- Example: At Counter=20, need Auctoritas >= 10
- Example: At Counter=40, need Auctoritas >= 20
- First Emperor typically emerges when Counter reaches 15-25 range

### Succession Score Formula
- `Score = [(100 - Counter) / 100 × Popular Support] + [Counter / 100 × Auctoritas]`
- Example at Counter=30: Score = 0.70 × Popular Support + 0.30 × Auctoritas
- Highest score becomes Emperor (must meet threshold)

## Penalties & Constraints

### Unmarried Penalty
- Paterfamilias must maintain marriage
- Being unmarried: -X popular support per turn, -Y% income

### Zero-Estate Bankruptcy
- Family with no estates is severely weakened
- Can players be eliminated? Or adoption mechanic saves them?

### Adoption Mechanic
When a paterfamilias dies with no sons:

**Option 1: Negotiated Adoption**
- Player can negotiate to adopt a son from another family
- Negotiation includes:
  - Gold payment
  - Future tribute obligations
  - Political support commitments
  - Possibly creating a new connection type
- Adopted son becomes heir but may have loyalty issues (TBD: trait?)

**Option 2: Automatic Heir (Fallback)**
- If negotiation fails or player chooses not to negotiate
- An heir automatically appears (distant cousin, nephew, etc.)
- **Significant penalties apply:**
  - Lower starting traits
  - -X auctoritas (family dignity damaged)
  - -Y% estate income for Z turns (transition chaos)
  - May start with debt
- Prevents player elimination but keeps stakes high

## Player Count
- Minimum: 3 players
- Optimal: 4-6 players
- Additional families can be AI-controlled (deterministic behavior)

## Implementation Notes for Prototype

### Core State to Track
- For each player/family:
  - Current paterfamilias (name, traits, age)
  - Wife (from which family, traits)
  - Mother (from which family, traits)
  - Children (names, gender, traits, age)
  - Gold amount
  - Popular Support score
  - Auctoritas score
  - Estate holdings (which provinces)
  - Card hand (5 cards)
  
- Global state:
  - Current Emperor
  - Tax rate
  - Empire Virtue/Popularity slider
  - Provinces and estate distribution
  - Turn number
  - Dynasty counter (which family, how many successive)

### Initial Prototype Scope
- 3-4 human players
- Simplified card set (5-10 card types)
- 3-4 provinces
- Basic trait system
- Core actions working
- Marriage negotiation UI
- Succession and coup mechanics

### Future Expansions
- AI players
- More provinces
- Expanded card set
- More traits
- Events system
- Senate voting mechanics
- Historical scenarios

## Open Design Questions

1. **Tied succession**: What's the tiebreaker mechanism?
2. **AI player behavior**: What strategy do AI families follow?
3. **Province special bonuses**: Should provinces have unique effects?
4. **Senate mechanics**: Should there be explicit Senate voting?
5. **Time passage**: How much time is one turn? (affects aging, children, etc.)
6. **Other players in coups**: Do non-involved players choose sides?
7. **Starting estates distribution**: How are initial estates divided?
8. **Threshold multiplier**: What exact value for `Auctoritas >= Counter × Threshold_multiplier`?
9. **Counter movement**: Can players/Emperor accelerate or reverse the counter's movement?
10. **Card deck size**: How many total cards in the deck? When does it reshuffle?

## Thematic Design Goals

- **Difficult to be Emperor**: Being on top should be precarious, with tough tradeoffs
- **Marriage matters**: The web of family connections should create meaningful obligations and opportunities
- **Women are important**: Female traits should have outsized impact to reflect their role in Roman politics
- **Free-rider tension**: Military contributions create interesting collective action problems
- **Two paths to power**: Populist vs Virtuous strategies should both be viable
- **Short-term vs long-term**: Decisions that help now often hurt later and vice versa
- **Interconnected fates**: Players are bound together through marriage and cannot act in isolation

---

## Implementation Specification for Prototype

### Technology Stack
- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript (ES6+)
- **Architecture**: Single-page application, hot-seat multiplayer
- **Future consideration**: Design state management to be easily adaptable for online multiplayer
- **No backend needed** for prototype (all state in browser memory)

### File Structure
```
/game
  index.html           # Main game interface
  css/
    styles.css         # All styling
  js/
    game-state.js      # Core game state management
    player.js          # Player class and logic
    card.js            # Card definitions and effects
    ui.js              # UI rendering and updates
    actions.js         # Turn actions and mechanics
    marriage.js        # Marriage negotiation system
    succession.js      # Imperial succession logic
    main.js            # Game initialization and loop
```

### Core Data Structures

#### Game State Object
```javascript
{
  turn: 1,
  counter: 1,  // Virtue/Popularity counter (1-100)
  emperorId: null,  // null during Republic, playerId when Empire
  taxRate: 0.10,
  players: [Player, Player, Player],  // Array of Player objects
  provinces: [Province, Province],
  cardDeck: [Card, Card, ...],
  discardPile: [Card, ...]
}
```

#### Player Object
```javascript
{
  id: 1,
  name: "Julia Familia",
  gold: 10,
  popularSupport: 5,
  auctoritas: 5,
  estates: [Estate, Estate, ...],  // 5 to start
  paterfamilias: {
    name: "Marcus Julius",
    age: 30,
    traits: ["Military Prowess"]
  },
  wife: {
    name: "Claudia",
    fromFamily: 2,  // player id
    traits: ["Financial Acumen", "Beloved by People"]
  },
  mother: {
    name: "Cornelia",
    fromFamily: 3,  // player id
    traits: ["Political Savvy"]
  },
  children: [
    { name: "Gaius", age: 10, gender: "male", traits: [] },
    { name: "Julia", age: 8, gender: "female", traits: ["Fertile"] }
  ],
  hand: [Card, Card, Card, Card, Card],  // 5 cards
  tributeRates: {
    toMother: 0.05,
    toWife: 0.05
  }
}
```

#### Card Object
```javascript
{
  id: "launch_raid_1",
  name: "Launch Raid",
  type: "military",
  cost: { gold: 8 },
  effect: function(gameState, playerId, targetId) {
    // Implementation of card effect
  },
  description: "Target a province controlled by another player..."
}
```

### UI Layout

#### Main Game Screen
```
+----------------------------------------------------------+
|  ROMAN DYNASTY GAME                         Turn: 15     |
|  Counter: 15 (85% Popularity / 15% Virtue)               |
|  Current Player: Julia Familia                           |
+----------------------------------------------------------+
|                                                           |
|  [Player Panel - Left Side]                              |
|  Gold: 45                                                 |
|  Popular Support: 12                                      |
|  Auctoritas: 8                                            |
|  Estates: 7                                               |
|                                                           |
|  Paterfamilias: Marcus Julius (Age 45)                   |
|  Wife: Claudia (from Cornelia Familia)                   |
|  Mother: Livia (from Aemilia Familia)                    |
|                                                           |
|  [Children List]                                          |
|  - Gaius (25, male) - Military Prowess                   |
|  - Julia (23, female) - Fertile, Pious                   |
|                                                           |
+----------------------------------------------------------+
|                                                           |
|  [Action Phase Buttons]                                   |
|  [ Contribute to Military ]  [ Economic Development ]    |
|  [ Political Maneuvering ]   [ Marriage Negotiation ]    |
|                                                           |
+----------------------------------------------------------+
|                                                           |
|  [Hand of Cards]                                          |
|  [Card 1]  [Card 2]  [Card 3]  [Card 4]  [Card 5]       |
|                                                           |
|  [Play Card] [Discard] [Draw 2] [End Turn]               |
|                                                           |
+----------------------------------------------------------+
|                                                           |
|  [Other Players Summary]                                  |
|  Player 2: Cornelia Familia - Emperor - G:52 P:15 A:22  |
|  Player 3: Aemilia Familia - G:38 P:10 A:14             |
|                                                           |
+----------------------------------------------------------+
|                                                           |
|  [Game Log - Recent Events]                              |
|  - Turn 15: Julia Familia played "Raise Legion"          |
|  - Turn 14: Cornelia Familia (Emperor) launched campaign |
|  - Turn 14: Campaign successful! Egypt conquered         |
|                                                           |
+----------------------------------------------------------+
```

### Core Game Loop

1. **Game Initialization**
   - Create 3-4 players
   - Assign random wives/mothers (ensuring constraints)
   - Deal 5 cards to each player
   - Distribute starting estates (5 per player from Italia province)
   - Set counter to 1

2. **Turn Sequence** (repeat for each player)
   ```
   Phase 1: Income & Obligations
     - Collect estate income (2 gold per estate)
     - Pay tax to Emperor (if Empire exists)
     - Pay tribute to mother's family
     - Pay tribute to wife's family
     - Apply trait effects
   
   Phase 2: Core Action (player chooses one)
     - Contribute to Military
     - Economic Development
     - Political Maneuvering
     - Marriage Negotiation
     
   Phase 3: Card Play
     - [Optional] Play 1 card
     - [Mandatory] Discard 1 card
     - Draw 2 cards
   
   Phase 4: Imperial Actions (if player is Emperor)
     - Adjust tax rate
     - Launch military campaign
     - Distribute estates
     - Influence counter
     - etc.
   
   Phase 5: End of Turn
     - Check for death (age probability)
     - Check for succession trigger
     - Increment age
     - Update game log
   ```

3. **Global Turn Increment**
   - After all players complete their turns:
   - Increment global turn counter
   - Increment Virtue/Popularity counter by 1
   - Check win condition (4 successive emperors)

### Key Mechanics to Implement

#### Marriage Negotiation UI
- Modal dialog when player initiates marriage negotiation
- Shows eligible families (not own, not mother's)
- Shows traits of potential wives/daughters
- Allows negotiation of tribute rates (Y% and Z%)
- Both players must agree
- Creates new connection in game state

#### Succession System
- Triggered on Emperor death (age, assassination, coup)
- Calculate succession scores for all players
- Check threshold requirement
- Highest scoring player becomes Emperor
- Update dynasty counter (successive count or reset)
- Show succession screen with scores

#### Card Resolution
- Play card → Select targets (if applicable)
- Deduct costs from player resources
- Apply effects to game state
- Update UI
- Log event
- Handle reactions (e.g., Oracle's Warning)

#### Counter Manipulation
- Emperor actions can shift counter +/- a few points
- Major events can shift counter
- UI shows counter position visually (slider/gauge)
- Counter cannot go below 1 or above 100

### UI Components

#### Card Display
- Show card name, type, cost
- Hover for full description
- Click to select for play/discard
- Visual indication of playable (can afford) vs not

#### Player Dashboard
- Circular portrait for paterfamilias
- Resource bars (gold, popularity, virtue)
- Estate count with province breakdown
- Family tree (simplified)
- Current connections (wife's family, mother's family)

#### Province Map
- Visual representation of provinces
- Color-coded by estate ownership
- Shows conquest status
- Click for details

#### Event Log
- Scrollable list of recent events
- Color-coded by event type
- Timestamps (turn number)

### Prototype Scope (MVP Features)

**Include:**
- 3 human players, hot-seat
- All 25 cards functional
- Basic marriage system (initial random assignment, negotiation for children)
- Core actions (4 options per turn)
- Imperial succession
- Win condition (4 successive emperors)
- Estate income and tribute
- Age and death mechanics
- Counter system and Republican → Imperial transition
- Basic UI with all essential information

**Exclude for MVP:**
- AI players
- Animations
- Sound effects
- Province map visualization (use text list)
- Complex Senate voting
- Praetorian Guard and other institutions
- Campaign to specific provinces (campaigns just add generic provinces)
- Priestess/General roles for children

**Nice-to-Have for MVP:**
- Save/load game state (localStorage)
- Game log
- Undo last action
- Visual counter gauge

### Development Phases

**Phase 1: Core Engine**
- Game state management
- Player objects and initialization
- Turn sequence logic
- Resource calculations
- Random wife/mother assignment

**Phase 2: Card System**
- Card definitions (all 25)
- Card effects implementation
- Hand management (draw, play, discard)
- Deck and discard pile

**Phase 3: Actions & Events**
- 4 core actions
- Age and death
- Succession calculation
- Counter system
- Imperial actions

**Phase 4: UI**
- HTML structure
- CSS styling (clean, readable)
- UI rendering
- Player input handling
- Event log

**Phase 5: Marriage & Connections**
- Marriage negotiation UI
- Tribute calculation and payment
- Connection tracking
- Divorce mechanics

**Phase 6: Testing & Balance**
- Playtest with 3 players
- Balance card costs
- Adjust formulas
- Fix bugs

### Testing Checklist
- [ ] Game initializes with 3 players correctly
- [ ] Random wives/mothers assigned without conflicts
- [ ] Estate income calculates correctly
- [ ] Tribute payments work (tax, mother, wife)
- [ ] All 4 core actions functional
- [ ] All 25 cards play correctly
- [ ] Card draw/discard/play sequence works
- [ ] Age increments, death probability works
- [ ] Counter increments each global turn
- [ ] First Emperor emerges when threshold crossed
- [ ] Succession calculates correctly
- [ ] Dynasty counter tracks successive emperors
- [ ] Win condition triggers at 4 successive
- [ ] Marriage negotiation creates connections
- [ ] Imperial actions available to Emperor only
- [ ] UI updates reflect game state changes
- [ ] Turn sequence flows smoothly

### Future Multiplayer Considerations

When adapting to online multiplayer:
- Game state will move to server
- Use WebSocket for real-time updates
- Player authentication
- Simultaneous turn resolution (or async turns)
- Persistent game sessions
- Database for game state storage

Design current architecture with this in mind:
- Keep game state as single source of truth
- All logic in pure functions where possible
- UI purely reactive to state
- Clear separation of concerns

---

## Summary for Claude Code Implementation

### What to Build
A hot-seat multiplayer browser game in vanilla JavaScript where 3-4 players compete to establish a Roman dynasty by producing 4 successive emperors through a web of marriage alliances, resource management, and political maneuvering.

### Core Features (MVP)
1. **Turn-based gameplay** with 4-phase turn structure
2. **Resource system**: Gold, Popular Support, Auctoritas
3. **Marriage web**: Each player connected to 2 others (wife's family, mother's family)
4. **Card system**: 25 cards (5 of each type), play 1/discard 1/draw 2 per turn
5. **Counter system**: 1-100 counter that naturally transitions Republic → Empire
6. **Imperial succession**: Formula-based succession when Emperor dies
7. **Win condition**: First to 4 successive emperors

### Key Specifications
- **Starting**: 10 gold, 5 estates (2 gold/estate/turn), 5 popular support, 5 auctoritas
- **Players**: 3-4 players, hot-seat
- **Wives/Mothers**: Randomly assigned at start (no conflicts)
- **Counter**: Starts at 1, increments by 1 per global turn
- **Threshold**: Auctoritas >= Counter × 0.5 to be Emperor
- **Succession**: Score = [(100-Counter)/100 × Pop] + [Counter/100 × Virtue]

### File Structure
- `index.html` - Main interface
- `css/styles.css` - Styling
- `js/game-state.js` - State management
- `js/player.js` - Player class
- `js/card.js` - 25 card definitions
- `js/ui.js` - UI rendering
- `js/actions.js` - Turn actions
- `js/marriage.js` - Marriage system
- `js/succession.js` - Succession logic
- `js/main.js` - Game loop

### Priority Order
1. Game state and player initialization
2. Turn sequence and resource management
3. Card system (all 25 cards)
4. Core actions (4 options)
5. UI rendering
6. Succession and counter system
7. Marriage negotiation

### Design Goals
- Clean, readable UI showing all essential information
- Smooth turn flow
- Clear feedback for all actions
- Easy to understand card effects
- Strategic depth from marriage web and resource management

The game should feel like managing a Roman family dynasty with tough political decisions, marriage alliances, and a race to imperial power.
