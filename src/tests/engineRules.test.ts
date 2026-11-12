import { describe, it, expect } from 'vitest';
import { createPiece } from '../engine/pieces';
import { createInitialGameState, applyMove } from '../engine/gameState';
import { generateLegalMoves } from '../engine/moveGenerator';
import { executePromotion } from '../engine/promotionHandler';
import { isRegentThreatened } from '../engine/attackDetection';

describe('Special Ability Chess Rules', () => {
  it('King (Passive): can move up to 2 spaces in all 8 directions, but cannot jump over pieces', () => {
    // King on (4, 4) in the center of an empty board
    const king = createPiece('regent', 'white', { row: 4, col: 4 });
    const blueKing = createPiece('regent', 'blue', { row: 0, col: 7 });
    const state = createInitialGameState({ customPieces: [king, blueKing] });

    const moves = generateLegalMoves(state.pieces, 'white');
    const kingMoves = moves.filter((m) => m.pieceId === king.id);

    // From (4, 4), 8 directions:
    // 1 step in 8 directions = 8 moves
    // 2 steps in 8 directions (rows 2, 6, cols 2, 6, diagonals) = 8 moves
    // Total = 16 moves (minus any that step into blueKing attack or off-board)
    expect(kingMoves.length).toBe(16);

    // Verify 2-space destinations
    const dests = kingMoves.map((m) => `${m.to!.row},${m.to!.col}`);
    expect(dests).toContain('2,4'); // 2 steps North
    expect(dests).toContain('6,4'); // 2 steps South
    expect(dests).toContain('4,2'); // 2 steps West
    expect(dests).toContain('4,6'); // 2 steps East
    expect(dests).toContain('2,2'); // 2 steps North-West
    expect(dests).toContain('6,6'); // 2 steps South-East

    // Now place a friendly soldier at (3, 4) blocking the North step
    const blocker = createPiece('soldier', 'white', { row: 3, col: 4 });
    const blockedState = createInitialGameState({ customPieces: [king, blocker, blueKing] });
    const blockedMoves = generateLegalMoves(blockedState.pieces, 'white').filter((m) => m.pieceId === king.id);
    const blockedDests = blockedMoves.map((m) => `${m.to!.row},${m.to!.col}`);

    // Cannot step to (3, 4) because friendly piece is there, AND CANNOT jump over it to (2, 4)!
    expect(blockedDests).not.toContain('3,4');
    expect(blockedDests).not.toContain('2,4');
  });

  it('Soldier: Friendly Elimination allows soldiers to voluntarily sacrifice themselves', () => {
    const soldier = createPiece('soldier', 'white', { row: 4, col: 4 });
    const whiteKing = createPiece('regent', 'white', { row: 7, col: 4 });
    const blueKing = createPiece('regent', 'blue', { row: 0, col: 4 });

    const state = createInitialGameState({ customPieces: [soldier, whiteKing, blueKing] });
    const moves = generateLegalMoves(state.pieces, 'white');

    const sacrificeMove = moves.find((m) => m.type === 'soldier_sacrifice' && m.pieceId === soldier.id);
    expect(sacrificeMove).toBeDefined();

    // Applying friendly elimination removes soldier and consumes turn
    const { nextState } = applyMove(state, sacrificeMove!);
    expect(nextState.pieces.find((p) => p.id === soldier.id)).toBeUndefined();
    expect(nextState.activePlayer).toBe('blue');
  });

  it('Horse (Active): can skip opponent turn once, but cannot move on the next turn', () => {
    const horse = createPiece('rider', 'white', { row: 4, col: 4 });
    const whiteKing = createPiece('regent', 'white', { row: 7, col: 7 });
    const blueKing = createPiece('regent', 'blue', { row: 0, col: 0 });

    const state = createInitialGameState({ customPieces: [horse, whiteKing, blueKing] });
    const moves = generateLegalMoves(state.pieces, 'white');

    const skipMove = moves.find((m) => m.type === 'horse_skip_turn' && m.pieceId === horse.id);
    expect(skipMove).toBeDefined();

    // Activate skip turn
    const { nextState } = applyMove(state, skipMove!);

    // Opponent's turn is skipped: activePlayer remains 'white'!
    expect(nextState.activePlayer).toBe('white');

    // The horse has used its skip ability
    const horseAfter = nextState.pieces.find((p) => p.id === horse.id)!;
    expect(horseAfter.specialAbilityState?.hasUsedSkipTurn).toBe(true);

    // On this bonus turn, the horse rests and cannot move
    const nextMoves = generateLegalMoves(nextState.pieces, 'white', { turnNumber: nextState.turnNumber });
    const horseNextMoves = nextMoves.filter((m) => m.pieceId === horse.id);
    expect(horseNextMoves.length).toBe(0); // Horse is resting!
  });

  it('Bishop (Active): can transform into any piece it captures once, replaced at opponent position', () => {
    const bishop = createPiece('oracle', 'white', { row: 4, col: 4 });
    const enemyQueen = createPiece('champion', 'blue', { row: 2, col: 2 });
    const whiteKing = createPiece('regent', 'white', { row: 7, col: 7 });
    const blueKing = createPiece('regent', 'blue', { row: 0, col: 7 });

    const state = createInitialGameState({ customPieces: [bishop, enemyQueen, whiteKing, blueKing] });
    const moves = generateLegalMoves(state.pieces, 'white');

    // Find transform capture move
    const transformMove = moves.find(
      (m) => m.pieceId === bishop.id && m.isBishopTransform && m.targetPieceId === enemyQueen.id
    );
    expect(transformMove).toBeDefined();

    const { nextState } = applyMove(state, transformMove!);

    // Enemy Queen is captured and removed
    expect(nextState.pieces.find((p) => p.id === enemyQueen.id)).toBeUndefined();

    // Bishop is now transformed into a Queen on (2, 2) (the opponent's position)
    const transformedUnit = nextState.pieces.find((p) => p.id === bishop.id)!;
    expect(transformedUnit.type).toBe('champion'); // Now a Queen!
    expect(transformedUnit.position).toEqual({ row: 2, col: 2 });
    expect(transformedUnit.specialAbilityState?.hasUsedTransform).toBe(true);
  });

  it('Rook (Passive): can jump over a nearby piece by one square along orthogonal lines', () => {
    const rook = createPiece('bastion', 'white', { row: 4, col: 4 });
    // Adjacent friendly piece at (3, 4) (1 step North)
    const blockerNorth = createPiece('soldier', 'white', { row: 3, col: 4 });
    // Adjacent enemy piece at (4, 5) (1 step East)
    const enemyEast = createPiece('soldier', 'blue', { row: 4, col: 5 });
    const whiteKing = createPiece('regent', 'white', { row: 7, col: 7 });
    const blueKing = createPiece('regent', 'blue', { row: 0, col: 0 });

    const state = createInitialGameState({
      customPieces: [rook, blockerNorth, enemyEast, whiteKing, blueKing],
    });
    const moves = generateLegalMoves(state.pieces, 'white');
    const rookMoves = moves.filter((m) => m.pieceId === rook.id);
    const dests = rookMoves.map((m) => `${m.to!.row},${m.to!.col}`);

    // Can jump over blockerNorth (3, 4) to land at (2, 4)!
    expect(dests).toContain('2,4');

    // Can capture enemyEast at (4, 5) AND also jump over it to land at (4, 6)!
    expect(dests).toContain('4,5'); // direct capture
    expect(dests).toContain('4,6'); // jump over enemy by 1 square
  });

  it('Pawn Promotion: Reaching 8th rank promotes into chosen piece', () => {
    const soldier = createPiece('soldier', 'white', { row: 1, col: 4 });
    const whiteKing = createPiece('regent', 'white', { row: 7, col: 7 });
    const blueKing = createPiece('regent', 'blue', { row: 0, col: 0 });
    const state = createInitialGameState({ customPieces: [soldier, whiteKing, blueKing] });

    const moves = generateLegalMoves(state.pieces, 'white');
    const promoMoves = moves.filter((m) => m.to?.row === 0 && m.promotionChoice);
    expect(promoMoves.length).toBe(4);

    const queenPromo = promoMoves.find((m) => m.promotionChoice === 'champion')!;
    const { nextState } = applyMove(state, queenPromo);
    expect(nextState.pieces.find((p) => p.id === soldier.id)?.type).toBe('champion');
  });

  it('Checkmate triggers immediate victory', () => {
    const blueKing = createPiece('regent', 'blue', { row: 0, col: 0 });
    const blueSoldier1 = createPiece('soldier', 'blue', { row: 1, col: 0 });
    const blueSoldier2 = createPiece('soldier', 'blue', { row: 1, col: 1 });
    const whiteQueen = createPiece('champion', 'white', { row: 0, col: 7 });
    const whiteRook = createPiece('bastion', 'white', { row: 7, col: 2 }); // Protects Queen at (0, 2) along col 2
    const whiteKing = createPiece('regent', 'white', { row: 7, col: 7 });

    const state = createInitialGameState({
      customPieces: [blueKing, blueSoldier1, blueSoldier2, whiteQueen, whiteRook, whiteKing],
    });

    const mateMove = {
      type: 'move' as const,
      pieceId: whiteQueen.id,
      from: { row: 0, col: 7 },
      to: { row: 0, col: 2 },
    };

    const { nextState } = applyMove(state, mateMove);
    expect(nextState.statusReason).toContain('CHECKMATE');
    expect(nextState.winner).toBe('white');
  });
});
