import { Piece, createPiece } from '../engine/pieces';
import { GameState, createInitialGameState } from '../engine/gameState';
import { Move } from '../engine/moveGenerator';

export interface TutorialScenario {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  instructions: string;
  lore: string;
  mechanicNote: string;
  createScenarioState: () => GameState;
  validateMove: (move: Move, stateBefore: GameState, stateAfter: GameState) => { isSuccess: boolean; feedback: string };
  hint: string;
}

export const TUTORIAL_SCENARIOS: TutorialScenario[] = [
  {
    id: 'regent',
    stepNumber: 1,
    title: 'The Regent — Commander of the Realm',
    subtitle: 'The Kingdom loses its command structure when its Regent is captured.',
    lore: 'The Regent marches with sovereign authority. Step by step, the ruler dictates the tempo of war.',
    instructions: 'The Regent moves exactly 1 square in any of the 8 directions. Strike the vulnerable Silver Soldier at (3, 4) to eliminate the threat.',
    mechanicNote: 'No chess-style check or checkmate exists in CROWNFALL. The Regent can remain under attack without being forced to move.',
    hint: 'Select the Gold Regent at (4, 4) and click the Silver Soldier at (3, 4) to capture it.',
    createScenarioState: () => {
      const goldRegent = createPiece('regent', 'gold', { row: 4, col: 4 });
      const enemySoldier = createPiece('soldier', 'silver', { row: 3, col: 4 });
      const silverRegent = createPiece('regent', 'silver', { row: 0, col: 4 });
      return createInitialGameState({ customPieces: [goldRegent, enemySoldier, silverRegent] });
    },
    validateMove: (move) => {
      if (move.type === 'move' && move.to?.row === 3 && move.to?.col === 4) {
        return { isSuccess: true, feedback: 'Glorious strike! The Regent eliminated the infiltrator directly.' };
      }
      return { isSuccess: false, feedback: 'Target the Silver Soldier at (3, 4) with your Regent.' };
    },
  },
  {
    id: 'champion',
    stepNumber: 2,
    title: 'The Champion — Supreme Warrior',
    subtitle: 'The strongest conventional attacking unit on the battlefield.',
    lore: 'Champions command unmatched range and martial mastery, striking across files and diagonals in a flash of gold steel.',
    instructions: 'Move your Champion across the diagonal to strike the exposed Silver Rider at (1, 1).',
    mechanicNote: 'Champions cannot jump over pieces, but their vast attack range provides supreme battlefield control.',
    hint: 'Select the Gold Champion at (5, 5) and move along the diagonal to capture the Silver Rider at (1, 1).',
    createScenarioState: () => {
      const champion = createPiece('champion', 'gold', { row: 5, col: 5 });
      const silverRider = createPiece('rider', 'silver', { row: 1, col: 1 }, { orientation: 'S' });
      const goldRegent = createPiece('regent', 'gold', { row: 7, col: 7 });
      const silverRegent = createPiece('regent', 'silver', { row: 0, col: 7 });
      return createInitialGameState({ customPieces: [champion, silverRider, goldRegent, silverRegent] });
    },
    validateMove: (move) => {
      if (move.type === 'move' && move.to?.row === 1 && move.to?.col === 1) {
        return { isSuccess: true, feedback: 'Decisive strike! The Champion severed the enemy rider.' };
      }
      return { isSuccess: false, feedback: 'Move the Champion diagonally to (1, 1).' };
    },
  },
  {
    id: 'rider',
    stepNumber: 3,
    title: 'The Rider — The Directional Warrior',
    subtitle: 'Movement depends entirely upon current facing direction.',
    lore: 'Mounted on swift warbeasts carrying mystic spheres, Riders charge along their chosen axis.',
    instructions: 'Your Rider currently faces North (vertical axis only). Rotate its facing to East to prepare a lateral charge.',
    mechanicNote: 'Rotating the Rider consumes your ENTIRE turn. A Rider cannot rotate and move during the same turn.',
    hint: 'Click your Rider at (4, 4), and in the action panel or rotation controls, choose East (E).',
    createScenarioState: () => {
      const rider = createPiece('rider', 'gold', { row: 4, col: 4 }, { orientation: 'N' });
      const goldRegent = createPiece('regent', 'gold', { row: 7, col: 4 });
      const silverRegent = createPiece('regent', 'silver', { row: 0, col: 4 });
      return createInitialGameState({ customPieces: [rider, goldRegent, silverRegent] });
    },
    validateMove: (move) => {
      if (move.type === 'rider_rotate' && move.newOrientation === 'E') {
        return { isSuccess: true, feedback: 'Orientation locked East! The Rider now commands the horizontal file.' };
      }
      return { isSuccess: false, feedback: 'Rotate the Rider to face East (E).' };
    },
  },
  {
    id: 'oracle',
    stepNumber: 4,
    title: 'The Oracle — Divine Conversion',
    subtitle: 'Transfer enemy allegiance through sacred sacrifice.',
    lore: 'Oracles speak the ancient language of the gods. Upon striking, they can sacrifice their form to turn the enemy into a loyal subject.',
    instructions: 'Capture the Silver Bastion at (2, 2) using your Oracle at (5, 5), and choose Divine Conversion.',
    mechanicNote: 'The Oracle disappears. The enemy unit changes allegiance on the EXACT square, keeping its abilities and orientation.',
    hint: 'Move the Oracle diagonally to (2, 2) and select "Divine Conversion" in the confirmation prompt.',
    createScenarioState: () => {
      const oracle = createPiece('oracle', 'gold', { row: 5, col: 5 });
      const silverBastion = createPiece('bastion', 'silver', { row: 2, col: 2 });
      const goldRegent = createPiece('regent', 'gold', { row: 7, col: 7 });
      const silverRegent = createPiece('regent', 'silver', { row: 0, col: 7 });
      return createInitialGameState({ customPieces: [oracle, silverBastion, goldRegent, silverRegent] });
    },
    validateMove: (move) => {
      if (move.type === 'move' && move.to?.row === 2 && move.to?.col === 2 && move.oracleAction === 'convert') {
        return { isSuccess: true, feedback: 'Divine Miracle! The enemy Bastion has converted to the Gold Kingdom!' };
      }
      return { isSuccess: false, feedback: 'Capture the Bastion at (2, 2) and select "Divine Conversion".' };
    },
  },
  {
    id: 'bastion_bash',
    stepNumber: 5,
    title: 'The Bastion — BASH Ability',
    subtitle: 'Reposition enemies with seismic force.',
    lore: 'Bastions are monolithic living fortresses capable of hurling foes across the battlefield.',
    instructions: 'Activate BASH on the adjacent Silver Soldier at (4, 5). Watch it get violently displaced to a random surrounding empty square!',
    mechanicNote: 'If no empty square surrounds the target, BASH crushes and destroys the target completely!',
    hint: 'Select your Bastion at (4, 4), click the BASH action button and target the adjacent enemy at (4, 5).',
    createScenarioState: () => {
      const bastion = createPiece('bastion', 'gold', { row: 4, col: 4 });
      const silverSoldier = createPiece('soldier', 'silver', { row: 4, col: 5 });
      const goldRegent = createPiece('regent', 'gold', { row: 7, col: 4 });
      const silverRegent = createPiece('regent', 'silver', { row: 0, col: 4 });
      return createInitialGameState({ customPieces: [bastion, silverSoldier, goldRegent, silverRegent] });
    },
    validateMove: (move) => {
      if (move.type === 'bastion_bash') {
        return { isSuccess: true, feedback: 'SEISMIC IMPACT! The enemy soldier was violently displaced!' };
      }
      return { isSuccess: false, feedback: 'Use BASH on the adjacent enemy soldier.' };
    },
  },
  {
    id: 'siege_mode',
    stepNumber: 6,
    title: 'Siege Mode — Enhanced BASH & Soldier Leap',
    subtitle: 'Breaching the opponent baseline transforms the Bastion into an engine of ruin.',
    lore: 'Once a Bastion breaches the enemy heartland (Rank 0 for Gold), its armor unlocks permanent Siege Mode.',
    instructions: 'Your Bastion is in Siege Mode! Unleash Enhanced BASH on the two aligned enemy Soldiers at (3, 4) and (2, 4) in one crushing action.',
    mechanicNote: 'Enhanced BASH destroys both consecutive enemies in a line and advances the Bastion into the second target\'s tile.',
    hint: 'Target the two consecutive Silver Soldiers in front of your Bastion with Enhanced Siege BASH.',
    createScenarioState: () => {
      const siegeBastion = createPiece('bastion', 'gold', { row: 4, col: 4 }, { isSiegeMode: true });
      const s1 = createPiece('soldier', 'silver', { row: 3, col: 4 });
      const s2 = createPiece('soldier', 'silver', { row: 2, col: 4 });
      const goldRegent = createPiece('regent', 'gold', { row: 7, col: 7 });
      const silverRegent = createPiece('regent', 'silver', { row: 0, col: 0 });
      return createInitialGameState({ customPieces: [siegeBastion, s1, s2, goldRegent, silverRegent] });
    },
    validateMove: (move) => {
      if (move.type === 'siege_bash_two') {
        return { isSuccess: true, feedback: 'CATASTROPHIC SIEGE! Both enemies obliterated in a single advance!' };
      }
      return { isSuccess: false, feedback: 'Activate the Enhanced 2-Piece BASH against the aligned enemy line.' };
    },
  },
  {
    id: 'soldier_sacrifice',
    stepNumber: 7,
    title: 'The Soldier — Infantry Movement & Self-Sacrifice',
    subtitle: 'Soldiers move 1 step in all 8 directions and can sacrifice themselves to clear lines.',
    lore: 'Unlike chess pawns, CROWNFALL Soldiers can step in any direction, forward, backward, or diagonally.',
    instructions: 'Your Soldier at (5, 4) is blocking your Champion\'s line of attack. Eliminate your Soldier via Friendly Sacrifice.',
    mechanicNote: 'Friendly Soldier Elimination consumes your turn, but allows tactical path clearing and formation shifts.',
    hint: 'Click your Soldier at (5, 4) and choose "Sacrifice / Eliminate".',
    createScenarioState: () => {
      const champion = createPiece('champion', 'gold', { row: 6, col: 4 });
      const soldier = createPiece('soldier', 'gold', { row: 5, col: 4 });
      const silverRegent = createPiece('regent', 'silver', { row: 1, col: 4 });
      const goldRegent = createPiece('regent', 'gold', { row: 7, col: 7 });
      return createInitialGameState({ customPieces: [champion, soldier, silverRegent, goldRegent] });
    },
    validateMove: (move) => {
      if (move.type === 'soldier_sacrifice') {
        return { isSuccess: true, feedback: 'Honor in sacrifice! The path for your Champion is now wide open!' };
      }
      return { isSuccess: false, feedback: 'Eliminate the friendly Soldier using Friendly Elimination.' };
    },
  },
  {
    id: 'soldier_promotion',
    stepNumber: 8,
    title: 'Promotion — The Last Hope',
    subtitle: 'Reaching the baseline transforms infantry into legendary champions.',
    lore: 'When common soldiers brave the entire battlefield and touch the enemy baseline, they are knighted into warriors of renown.',
    instructions: 'Move your Soldier from (1, 4) to the opponent baseline at (0, 4) and promote into a Champion!',
    mechanicNote: 'Soldiers can promote to Champion, Rider, or Bastion. Oracle and Regent are NOT available.',
    hint: 'Step your Soldier into row 0 and choose Champion in the promotion dialogue.',
    createScenarioState: () => {
      const soldier = createPiece('soldier', 'gold', { row: 1, col: 4 });
      const silverRegent = createPiece('regent', 'silver', { row: 0, col: 0 });
      const goldRegent = createPiece('regent', 'gold', { row: 7, col: 7 });
      return createInitialGameState({ customPieces: [soldier, silverRegent, goldRegent] });
    },
    validateMove: (move) => {
      if (move.type === 'move' && move.to?.row === 0 && move.promotionChoice === 'champion') {
        return { isSuccess: true, feedback: 'ASCENSION! Your Soldier has been knighted as a mighty Champion!' };
      }
      return { isSuccess: false, feedback: 'Move to baseline (0, 4) and select Champion promotion.' };
    },
  },
  {
    id: 'mutual_regent_capture',
    stepNumber: 9,
    title: 'Mutual Regent Capture — The Comeback System',
    subtitle: 'Never surrender until the Regent falls.',
    lore: 'If a king strikes down their rival while their own heart is under blade, the dying empire gets one final strike.',
    instructions: 'Silver has just captured your Regent, but your Champion at (7, 0) can strike back! Counter-capture Silver\'s Regent at (7, 4) for an honorable DRAW.',
    mechanicNote: 'During Mutual Regent Response, ONLY moves that capture the enemy Regent are legal. A successful counter-strike forces a draw!',
    hint: 'Take your final response turn: move your Champion from (7, 0) to capture the Silver Regent at (7, 4).',
    createScenarioState: () => {
      const silverRegent = createPiece('regent', 'silver', { row: 7, col: 4 }); // just captured gold regent on (7,4)
      const goldChampion = createPiece('champion', 'gold', { row: 7, col: 0 }); // Gold champion in horizontal line
      const silverSoldier = createPiece('soldier', 'silver', { row: 2, col: 2 });
      const state = createInitialGameState({ customPieces: [silverRegent, goldChampion, silverSoldier] });
      state.activePlayer = 'gold';
      state.status = 'mutual_regent_response';
      state.statusReason = 'Silver captured Gold Regent, but Gold has one final response!';
      return state;
    },
    validateMove: (move) => {
      if (move.type === 'move' && move.to?.row === 7 && move.to?.col === 4) {
        return { isSuccess: true, feedback: 'HONORABLE DRAW! Mutual Regent Capture achieved! Neither kingdom surrendered!' };
      }
      return { isSuccess: false, feedback: 'Strike Silver\'s Regent at (7, 4) to force the draw!' };
    },
  },
];
