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
    title: 'The Regent (King) — Royal Sovereign',
    subtitle: 'The sovereign heart of your army, subject to Check and Checkmate.',
    lore: 'The Regent marches with sovereign authority. Step by step, the ruler dictates the tempo of war.',
    instructions: 'The Regent moves exactly 1 square in any of the 8 directions (like a King). Strike the vulnerable Silver Soldier at (3, 4) to eliminate the threat.',
    mechanicNote: 'Under Chess rules, your Regent is the King: it cannot move into check, and must escape check when attacked.',
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
    title: 'The Champion (Queen) — Supreme Warrior',
    subtitle: 'The strongest piece on the battlefield, combining Rook and Bishop range.',
    lore: 'Champions command unmatched range and martial mastery, striking across ranks, files, and diagonals in a flash of gold steel.',
    instructions: 'Move your Champion across the diagonal to strike the exposed Silver Rider at (1, 1).',
    mechanicNote: 'The Queen moves any distance horizontally, vertically, or diagonally, stopping when capturing.',
    hint: 'Select the Gold Champion at (5, 5) and move along the diagonal to capture the Silver Rider at (1, 1).',
    createScenarioState: () => {
      const champion = createPiece('champion', 'gold', { row: 5, col: 5 });
      const silverRider = createPiece('rider', 'silver', { row: 1, col: 1 });
      const goldRegent = createPiece('regent', 'gold', { row: 7, col: 7 });
      const silverRegent = createPiece('regent', 'silver', { row: 0, col: 7 });
      return createInitialGameState({ customPieces: [champion, silverRider, goldRegent, silverRegent] });
    },
    validateMove: (move) => {
      if (move.type === 'move' && move.to?.row === 1 && move.to?.col === 1) {
        return { isSuccess: true, feedback: 'Decisive strike! The Champion captured the enemy unit.' };
      }
      return { isSuccess: false, feedback: 'Move the Champion diagonally to (1, 1).' };
    },
  },
  {
    id: 'bastion',
    stepNumber: 3,
    title: 'The Bastion (Rook) — Heavy Castle Rampart',
    subtitle: 'Dominates entire ranks and files in straight orthogonal lines.',
    lore: 'Bastions stand tall like fortress towers, sliding across unobstructed rows and columns with unyielding mass.',
    instructions: 'Slide your Bastion horizontally from (4, 1) across rank 4 to capture the Silver Soldier at (4, 6).',
    mechanicNote: 'Like a Chess Rook, the Bastion slides horizontally or vertically any distance until blocked.',
    hint: 'Click your Bastion at (4, 1) and slide straight right to (4, 6).',
    createScenarioState: () => {
      const bastion = createPiece('bastion', 'gold', { row: 4, col: 1 });
      const silverSoldier = createPiece('soldier', 'silver', { row: 4, col: 6 });
      const goldRegent = createPiece('regent', 'gold', { row: 7, col: 4 });
      const silverRegent = createPiece('regent', 'silver', { row: 0, col: 4 });
      return createInitialGameState({ customPieces: [bastion, silverSoldier, goldRegent, silverRegent] });
    },
    validateMove: (move) => {
      if (move.type === 'move' && move.to?.row === 4 && move.to?.col === 6) {
        return { isSuccess: true, feedback: 'Heavy impact! The Bastion crushed the enemy along the rank.' };
      }
      return { isSuccess: false, feedback: 'Move the Bastion straight to (4, 6).' };
    },
  },
  {
    id: 'oracle',
    stepNumber: 4,
    title: 'The Oracle (Bishop) — Diagonal Seer',
    subtitle: 'Glides across diagonals of matching tile color.',
    lore: 'Oracles weave between the ranks, striking swiftly along uninterrupted diagonal paths.',
    instructions: 'Glide your Oracle diagonally from (5, 2) to capture the Silver Bastion at (2, 5).',
    mechanicNote: 'Like a Chess Bishop, the Oracle moves any distance diagonally.',
    hint: 'Select the Oracle at (5, 2) and target the piece at (2, 5).',
    createScenarioState: () => {
      const oracle = createPiece('oracle', 'gold', { row: 5, col: 2 });
      const silverBastion = createPiece('bastion', 'silver', { row: 2, col: 5 });
      const goldRegent = createPiece('regent', 'gold', { row: 7, col: 7 });
      const silverRegent = createPiece('regent', 'silver', { row: 0, col: 7 });
      return createInitialGameState({ customPieces: [oracle, silverBastion, goldRegent, silverRegent] });
    },
    validateMove: (move) => {
      if (move.type === 'move' && move.to?.row === 2 && move.to?.col === 5) {
        return { isSuccess: true, feedback: 'Divine accuracy! The Oracle captured the Bastion diagonally.' };
      }
      return { isSuccess: false, feedback: 'Move the Oracle diagonally to (2, 5).' };
    },
  },
  {
    id: 'rider',
    stepNumber: 5,
    title: 'The Rider (Knight) — Mounted Cavalier',
    subtitle: 'Jumps in an agile L-shape (2 squares one way, 1 square perpendicular).',
    lore: 'Mounted on swift warbeasts, Riders leap over defenders and terrain, striking where least expected.',
    instructions: 'Leap your Rider in an L-shape from (4, 4) to capture the Silver Soldier at (2, 5), jumping over the pieces in between.',
    mechanicNote: 'The Knight (Rider) is the only piece that can jump over other pieces.',
    hint: 'Click your Rider at (4, 4) and select the landing square at (2, 5).',
    createScenarioState: () => {
      const rider = createPiece('rider', 'gold', { row: 4, col: 4 });
      const wall1 = createPiece('soldier', 'gold', { row: 3, col: 4 });
      const wall2 = createPiece('soldier', 'silver', { row: 3, col: 5 });
      const target = createPiece('soldier', 'silver', { row: 2, col: 5 });
      const goldRegent = createPiece('regent', 'gold', { row: 7, col: 4 });
      const silverRegent = createPiece('regent', 'silver', { row: 0, col: 4 });
      return createInitialGameState({ customPieces: [rider, wall1, wall2, target, goldRegent, silverRegent] });
    },
    validateMove: (move) => {
      if (move.type === 'move' && move.to?.row === 2 && move.to?.col === 5) {
        return { isSuccess: true, feedback: 'Tactical leap! The Rider vaulted over the frontlines to capture the target!' };
      }
      return { isSuccess: false, feedback: 'Leap the Rider in an L-shape to (2, 5).' };
    },
  },
  {
    id: 'soldier_movement',
    stepNumber: 6,
    title: 'The Soldier (Pawn) — Advance & Diagonal Capture',
    subtitle: 'Pawns march forward and capture diagonally.',
    lore: 'Soldiers advance with iron discipline, stepping forward to claim ground and striking diagonally to fell enemies.',
    instructions: 'Capture the diagonal Silver Soldier at (3, 5) with your Gold Soldier at (4, 4).',
    mechanicNote: 'Pawns move 1 square forward (or 2 from their start rank) if empty, but capture 1 square diagonally forward.',
    hint: 'Select the Soldier at (4, 4) and click the enemy at (3, 5) to capture.',
    createScenarioState: () => {
      const soldier = createPiece('soldier', 'gold', { row: 4, col: 4 });
      const target = createPiece('soldier', 'silver', { row: 3, col: 5 });
      const blocker = createPiece('soldier', 'silver', { row: 3, col: 4 });
      const goldRegent = createPiece('regent', 'gold', { row: 7, col: 7 });
      const silverRegent = createPiece('regent', 'silver', { row: 0, col: 0 });
      return createInitialGameState({ customPieces: [soldier, target, blocker, goldRegent, silverRegent] });
    },
    validateMove: (move) => {
      if (move.type === 'move' && move.to?.row === 3 && move.to?.col === 5) {
        return { isSuccess: true, feedback: 'Precision strike! The Soldier captured the enemy diagonally.' };
      }
      return { isSuccess: false, feedback: 'Capture diagonally at (3, 5).' };
    },
  },
  {
    id: 'soldier_promotion',
    stepNumber: 7,
    title: 'Pawn Promotion — Reaching the 8th Rank',
    subtitle: 'Reaching the opposite baseline transforms infantry into powerful pieces.',
    lore: 'When common soldiers brave the entire board and reach the enemy back rank, they are knighted into warriors of renown.',
    instructions: 'Step your Soldier from (1, 4) to (0, 4) and promote into a Champion (Queen)!',
    mechanicNote: 'Pawns reaching the 8th rank can promote into a Queen, Rook, Bishop, or Knight.',
    hint: 'Step your Soldier into row 0 and choose Champion (Queen) in the promotion dialogue.',
    createScenarioState: () => {
      const soldier = createPiece('soldier', 'gold', { row: 1, col: 4 });
      const silverRegent = createPiece('regent', 'silver', { row: 0, col: 0 });
      const goldRegent = createPiece('regent', 'gold', { row: 7, col: 7 });
      return createInitialGameState({ customPieces: [soldier, silverRegent, goldRegent] });
    },
    validateMove: (move) => {
      if (move.type === 'move' && move.to?.row === 0 && move.promotionChoice === 'champion') {
        return { isSuccess: true, feedback: 'ASCENSION! Your Soldier promoted into a mighty Champion (Queen)!' };
      }
      return { isSuccess: false, feedback: 'Move to baseline (0, 4) and select Champion promotion.' };
    },
  },
  {
    id: 'check_and_checkmate',
    stepNumber: 8,
    title: 'Check & Checkmate — The Royal Siege',
    subtitle: 'Trap the opposing Regent with nowhere to run.',
    lore: 'When a sovereign has no square to flee and no defender to shield their crown, the war is won decisively through checkmate.',
    instructions: 'Deliver checkmate to the cornered Silver Regent! Move your Gold Champion from (0, 7) to (0, 2) along rank 0.',
    mechanicNote: 'When a Regent is attacked, it is in CHECK. If the player has no legal moves to escape, it is CHECKMATE — victory is immediate!',
    hint: 'Select your Champion at (0, 7) and slide left to (0, 2) to deliver inescapable checkmate.',
    createScenarioState: () => {
      const silverRegent = createPiece('regent', 'silver', { row: 0, col: 0 });
      const silverSoldier1 = createPiece('soldier', 'silver', { row: 1, col: 0 });
      const silverSoldier2 = createPiece('soldier', 'silver', { row: 1, col: 1 });
      const goldChampion = createPiece('champion', 'gold', { row: 0, col: 7 });
      const goldRegent = createPiece('regent', 'gold', { row: 7, col: 7 });
      return createInitialGameState({
        customPieces: [silverRegent, silverSoldier1, silverSoldier2, goldChampion, goldRegent],
      });
    },
    validateMove: (move) => {
      if (move.type === 'move' && move.to?.row === 0 && move.to?.col === 2) {
        return { isSuccess: true, feedback: 'CHECKMATE! The Silver Regent is trapped with zero escape moves. Victory is yours!' };
      }
      return { isSuccess: false, feedback: 'Slide the Champion to (0, 2) to deliver checkmate!' };
    },
  },
];
