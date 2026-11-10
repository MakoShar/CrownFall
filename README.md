# CROWNFALL — The Last Kingdom

> **Easy to understand. Difficult to master. Never surrender until the Regent falls.**

**CROWNFALL: The Last Kingdom** is a complete, playable, browser-based turn-based tactical strategy game. Inspired by the intellectual rigor and strategic depth of chess, CROWNFALL features entirely original unit archetypes, directional movement, allegiance conversions, siege transformations, and a dramatic comeback mechanism.

---

## ⚔️ Game Overview

- **Genre**: Turn-based tactical strategy
- **Players**: Two opposing kingdoms (Gold Kingdom vs. Silver Kingdom)
- **Board**: Configurable square grid (Default: 8×8)
- **Platform**: Browser-based responsive desktop and mobile web application
- **Game Modes**:
  - **Human vs Human**: Local pass-and-play hotseat
  - **Human vs AI**: Single-player vs Minimax / Alpha-Beta tactical AI
  - **AI vs AI**: Spectator mode with real-time play/pause controls

---

## ♟️ The Six Unit Types & Rules

### 1. REGENT — The Commander
- **Movement**: Moves exactly 1 square in any of the 8 directions.
- **Capture**: Captures opposing units normally.
- **Special Rules**: Cannot be converted by an Oracle. Its capture normally results in defeat.
- **No Check/Checkmate**: Being surrounded or under attack does not force the player to move the Regent. The kingdom falls only when its Regent is captured.

### 2. CHAMPION — The Supreme Warrior
- **Movement**: Unlimited distance horizontally, vertically, and diagonally across open squares.
- **Divine Immunity**: Cannot be converted by an Oracle. If an Oracle captures a Champion, the Champion dies normally and the Oracle survives.
- **Battlefield Control**: Provides supreme zone control and defense over friendly lines.

### 3. RIDER — The Directional Warrior
- **Facing Axis**: Movement depends strictly upon current facing direction:
  - Facing **North** or **South**: Moves vertically forward or backward.
  - Facing **East** or **West**: Moves horizontally forward or backward.
- **Rotation**: Rotating to any of the 4 cardinal directions consumes the player's **entire turn**. A Rider cannot rotate and move on the same turn.
- **Allegiance Retention**: If converted by an Oracle, retains its previous facing direction.

### 4. ORACLE — The Divine Messenger
- **Movement**: Moves diagonally any number of squares.
- **DIVINE CONVERSION (Optional Special Ability)**:
  - **Option 1 — Normal Capture**: Enemy is destroyed, Oracle occupies target tile.
  - **Option 2 — Divine Conversion**: The Oracle sacrifices itself and vanishes. The captured enemy changes allegiance on the **exact same square**, retaining its state and abilities!
- **Exceptions**: Champion and Regent cannot be converted.
- **Mutual Oracle Destruction**: When an Oracle captures an enemy Oracle, both are obliterated.

### 5. BASTION — The Siege Guardian
- **Normal Movement**: 1 square in any of the 8 directions.
- **BASH Ability**: Targets an adjacent enemy unit. The game deterministically picks an empty surrounding tile using a seeded PRNG and pushes the enemy there. If completely surrounded with no empty tile, the target is crushed and destroyed!
- **Siege Mode**: Permanently unlocks upon reaching the opponent's baseline:
  - **Enhanced BASH**: Destroys two consecutive enemy units in a straight line in a single turn, advancing into the second target's tile.
  - **Soldier Leap**: Jumps over up to two consecutive Soldiers without harming them.

### 6. SOLDIER — The Infantry
- **Movement**: Moves 1 square in all 8 directions (forward, backward, sideways, diagonal).
- **Friendly Soldier Elimination**: A player can eliminate their own Soldier to unblock files and reshape formations (consumes the turn).
- **Promotion (The Last Hope)**: Upon reaching the opponent's baseline, promotes immediately into:
  1. Champion
  2. Rider
  3. Bastion (in immediate Siege Mode)
  *(Oracle and Regent are not allowed).*

---

## 👑 Mutual Regent Capture — The Comeback System

1. Player A captures Player B's Regent.
2. The engine checks if Player A's own Regent is simultaneously under threat.
3. If safe: Player A wins immediately.
4. If threatened: Player B receives **exactly one final response turn**.
5. During this final response, only legal moves that capture Player A's Regent are allowed.
6. If Player B successfully counter-captures Player A's Regent, the match ends in an honorable **DRAW**.
7. If no legal counter-capture exists, Player A wins immediately.

---

## 🧠 Artificial Intelligence Engine

Four genuine algorithms are implemented with zero mock visualizations:

1. **Minimax**: Genuine adversarial search tree alternating maximizing (Gold) and minimizing (Silver) positions.
2. **Alpha-Beta Pruning**: Maintains $[\alpha, \beta]$ cutoff bounds, prunes suboptimal subtrees, uses move ordering (captures, threats, promotions first), and safely models stochastic BASH outcomes via expected-value chance nodes.
3. **A\* Pathfinding**: True $f(n) = g(n) + h(n)$ pathfinder using Chebyshev heuristics, unit directional constraints (Rider axis), and obstacle avoidance.
4. **AO\* Graph Search**: Solves compound strategic plans using a genuine AND-OR hypergraph, evaluating AND coordination hyper-arcs and OR alternative strategies with bottom-up cost propagation.

### AI Opponent Difficulties
- **Beginner**: Shallow Minimax search with basic material heuristics.
- **Intermediate**: Alpha-Beta pruning with board control, threat awareness, and promotion foresight.
- **Expert**: Deep Alpha-Beta search with move ordering, threat anticipation, Oracle conversion timing, and Bastion siege strategy.

---

## 🔬 AI Educational Mode & Analysis

Includes a dedicated fullscreen AI Analysis environment featuring:
- Live search telemetry (Depth, Evaluated Nodes, Pruned Branches, Execution Time, Board Score).
- Interactive **Minimax Tree** with Max/Min badges.
- Interactive **Alpha-Beta Tree** with $[\alpha, \beta]$ intervals and highlighted pruned branches.
- Interactive **A\* Pathfinding Explorer** with live open/closed sets and $f(n) = g(n) + h(n)$ coordinate tables.
- Interactive **AO\* AND-OR Hypergraph** visualizing compound multi-action doctrines and optimal sub-hyperpaths.
- **Head-to-Head Benchmark Tool** running Minimax vs. Alpha-Beta side-by-side to verify pruning efficiency gains.

---

## 🎓 Interactive Beginner Academy

Nine dedicated interactive scenarios:
1. Regent and command structure
2. Champion movement
3. Rider orientation and rotation
4. Oracle Divine Conversion
5. Bastion BASH displacement
6. Siege Mode: Enhanced BASH & Soldier Leap
7. Soldier movement and Friendly Elimination
8. Soldier baseline promotion
9. Mutual Regent Capture comeback

---

## 🛠️ Tech Stack & Architecture

- **Engine**: TypeScript (100% headless, pure deterministic logic, seeded PRNG)
- **Frontend**: React 19, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Build Tool**: Vite
- **Testing**: Vitest automated unit test suite (28 comprehensive test cases)

```
src/
  algorithms/          # Pure AI search algorithms (Minimax, AlphaBeta, AStar, AOStar)
  ai/                  # Heuristic evaluation, move ordering, chance nodes, opponent presets
  components/
    AIAnalysis/        # Fullscreen AI decision tree & benchmark explorer
    Board/             # Responsive stone grid, tactical overlay, move indicators
    ConversionDialog/  # Oracle capture vs conversion modal
    GameControls/      # Rider rotation & Bastion BASH action panel
    MatchResult/       # Endgame victory & draw presentation
    MoveHistory/       # Auto-scrolling battle chronicle
    Pieces/            # Bespoke dark-fantasy SVG artwork
    PromotionDialog/   # Soldier baseline ascendance modal
    Rules/             # Full in-game rulebook
    Tutorial/          # 9-step interactive academy
  config/              # Board geometry, directions, starting layout presets
  engine/              # GameState, move generator, attack map, abilities, endgame
  tests/               # Vitest engine rules & AI validation suites
  tutorials/           # Academy scenario configurations
  utils/               # Seeded PRNG (Mulberry32)
```

---

## 🚀 Running the Project

### Development Server
```bash
npm install
npm run dev
```

### Run Unit Tests
```bash
npm test
```

### Production Build
```bash
npm run build
```
