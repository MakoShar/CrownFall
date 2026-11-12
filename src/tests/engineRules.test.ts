import { describe, it, expect } from 'vitest';
import { createPiece } from '../engine/pieces';
import { createInitialGameState, applyMove } from '../engine/gameState';
import { generateLegalMoves } from '../engine/moveGenerator';
import { executePromotion, VALID_PROMOTION_CHOICES } from '../engine/promotionHandler';
import { isRegentThreatened } from '../engine/attackDetection';

describe('Standard Chess Movement Rules', () => {
  it('Soldier (Pawn) moves 1 step forward, 2 steps from starting row, and captures diagonally', () => {
    // Gold Soldier at start rank (6, 4)
    const goldSoldier = createPiece('soldier', 'gold', { row: 6, col: 4 });
    const silverRegent = createPiece('regent', 'silver', { row: 0, col: 0 });
    const goldRegent = createPiece('regent', 'gold', { row: 7, col: 7 });
    const enemyTarget = createPiece('soldier', 'silver', { row: 5, col: 5 }); // diagonal target

    const state = createInitialGameState({
      customPieces: [goldSoldier, silverRegent, goldRegent, enemyTarget],
    });
    const moves = generateLegalMoves(state.pieces, 'gold');
    const soldierMoves = moves.filter((m) => m.pieceId === goldSoldier.id);

    const dests = soldierMoves.map((m) => `${m.to!.row},${m.to!.col}`);
    // 1 step forward to (5, 4)
    expect(dests).toContain('5,4');
    // 2 steps forward from rank 6 to (4, 4)
    expect(dests).toContain('4,4');
    // Diagonal capture at (5, 5)
    expect(dests).toContain('5,5');

    // No sideways (6,3 or 6,5) or backward (7,4)
    expect(dests).not.toContain('6,3');
    expect(dests).not.toContain('6,5');
    expect(dests).not.toContain('7,4');
  });

  it('Soldier (Pawn) cannot move forward if blocked by another piece', () => {
    const goldSoldier = createPiece('soldier', 'gold', { row: 6, col: 4 });
    const blocker = createPiece('soldier', 'silver', { row: 5, col: 4 });
    const silverRegent = createPiece('regent', 'silver', { row: 0, col: 0 });
    const goldRegent = createPiece('regent', 'gold', { row: 7, col: 7 });

    const state = createInitialGameState({
      customPieces: [goldSoldier, blocker, silverRegent, goldRegent],
    });
    const moves = generateLegalMoves(state.pieces, 'gold');
    const soldierMoves = moves.filter((m) => m.pieceId === goldSoldier.id);

    // Blocked straight ahead: 0 legal forward moves
    expect(soldierMoves.length).toBe(0);
  });

  it('Bastion (Rook) moves horizontally and vertically any distance', () => {
    const bastion = createPiece('bastion', 'gold', { row: 4, col: 4 });
    const goldRegent = createPiece('regent', 'gold', { row: 7, col: 7 });
    const silverRegent = createPiece('regent', 'silver', { row: 0, col: 0 });
    const state = createInitialGameState({ customPieces: [bastion, goldRegent, silverRegent] });

    const moves = generateLegalMoves(state.pieces, 'gold');
    const bastionMoves = moves.filter((m) => m.pieceId === bastion.id);

    // On (4, 4) of an 8x8 board: 7 vertical + 7 horizontal = 14 moves
    expect(bastionMoves.length).toBe(14);
    for (const m of bastionMoves) {
      expect(m.to!.row === 4 || m.to!.col === 4).toBe(true);
    }
  });

  it('Oracle (Bishop) moves diagonally any distance', () => {
    const oracle = createPiece('oracle', 'gold', { row: 4, col: 4 });
    const goldRegent = createPiece('regent', 'gold', { row: 7, col: 0 }); // away from diagonal
    const silverRegent = createPiece('regent', 'silver', { row: 0, col: 7 }); // away from diagonal
    const state = createInitialGameState({ customPieces: [oracle, goldRegent, silverRegent] });

    const moves = generateLegalMoves(state.pieces, 'gold');
    const oracleMoves = moves.filter((m) => m.pieceId === oracle.id);

    // On (4, 4) on an 8x8 board with clear diagonals: 13 diagonal moves
    expect(oracleMoves.length).toBe(13);
    for (const m of oracleMoves) {
      const dRow = Math.abs(m.to!.row - 4);
      const dCol = Math.abs(m.to!.col - 4);
      expect(dRow).toBe(dCol);
    }
  });

  it('Rider (Knight) jumps in L-shapes and leaps over obstacles', () => {
    const rider = createPiece('rider', 'gold', { row: 4, col: 4 });
    // Surround rider with friendly soldiers
    const s1 = createPiece('soldier', 'gold', { row: 3, col: 4 });
    const s2 = createPiece('soldier', 'gold', { row: 5, col: 4 });
    const s3 = createPiece('soldier', 'gold', { row: 4, col: 3 });
    const s4 = createPiece('soldier', 'gold', { row: 4, col: 5 });
    const goldRegent = createPiece('regent', 'gold', { row: 7, col: 7 });
    const silverRegent = createPiece('regent', 'silver', { row: 0, col: 0 });

    const state = createInitialGameState({
      customPieces: [rider, s1, s2, s3, s4, goldRegent, silverRegent],
    });
    const moves = generateLegalMoves(state.pieces, 'gold');
    const riderMoves = moves.filter((m) => m.pieceId === rider.id);

    // Rider leaps over the surrounding soldiers to all 8 standard Knight jump squares
    expect(riderMoves.length).toBe(8);
  });

  it('Champion (Queen) moves in all 8 directions across ranks, files, and diagonals', () => {
    const champion = createPiece('champion', 'gold', { row: 4, col: 4 });
    const goldRegent = createPiece('regent', 'gold', { row: 7, col: 0 }); // away from lines of (4, 4)
    const silverRegent = createPiece('regent', 'silver', { row: 0, col: 7 }); // away from lines of (4, 4)
    const state = createInitialGameState({ customPieces: [champion, goldRegent, silverRegent] });

    const moves = generateLegalMoves(state.pieces, 'gold');
    const championMoves = moves.filter((m) => m.pieceId === champion.id);

    // 14 orthogonal + 13 diagonal = 27 moves on (4, 4)
    expect(championMoves.length).toBe(27);
  });

  it('Regent (King) moves exactly 1 square in all 8 directions', () => {
    const regent = createPiece('regent', 'gold', { row: 4, col: 4 });
    const silverRegent = createPiece('regent', 'silver', { row: 0, col: 0 });
    const state = createInitialGameState({ customPieces: [regent, silverRegent] });

    const moves = generateLegalMoves(state.pieces, 'gold');
    expect(moves.length).toBe(8);
  });
});

describe('Standard Pawn Promotion', () => {
  it('Soldier promotes to Champion, Bastion, Oracle, or Rider upon reaching baseline', () => {
    const soldier = createPiece('soldier', 'gold', { row: 1, col: 4 });
    const goldRegent = createPiece('regent', 'gold', { row: 7, col: 7 });
    const silverRegent = createPiece('regent', 'silver', { row: 0, col: 0 });
    const state = createInitialGameState({ customPieces: [soldier, goldRegent, silverRegent] });

    const moves = generateLegalMoves(state.pieces, 'gold');
    const promoMoves = moves.filter((m) => m.to?.row === 0 && m.promotionChoice);

    // 4 choices: champion, bastion, oracle, rider
    expect(promoMoves.length).toBe(4);
    const choices = promoMoves.map((m) => m.promotionChoice);
    expect(choices).toEqual(expect.arrayContaining(['champion', 'bastion', 'oracle', 'rider']));

    // Applying promotion sets the new piece type
    const queenPromo = promoMoves.find((m) => m.promotionChoice === 'champion')!;
    const { nextState } = applyMove(state, queenPromo);
    const promotedPiece = nextState.pieces.find((p) => p.id === soldier.id)!;
    expect(promotedPiece.type).toBe('champion');
  });
});

describe('Chess Check, Checkmate, and King Safety', () => {
  it('Regent cannot move into an attacked square (cannot step into check)', () => {
    const goldRegent = createPiece('regent', 'gold', { row: 4, col: 4 });
    const silverChampion = createPiece('champion', 'silver', { row: 0, col: 5 });
    const silverRegent = createPiece('regent', 'silver', { row: 0, col: 0 });

    const state = createInitialGameState({ customPieces: [goldRegent, silverChampion, silverRegent] });
    const moves = generateLegalMoves(state.pieces, 'gold');

    // Column 5 is attacked by Silver Queen: (3,5), (4,5), (5,5) are illegal for Gold King
    const illegalCol5Moves = moves.filter((m) => m.to && m.to.col === 5);
    expect(illegalCol5Moves.length).toBe(0);

    // Other safe adjacent squares remain legal
    const safeMoves = moves.filter((m) => m.to && m.to.col !== 5);
    expect(safeMoves.length).toBeGreaterThan(0);
  });

  it('When in check, player must resolve check; moves that do not escape check are illegal', () => {
    const goldRegent = createPiece('regent', 'gold', { row: 7, col: 4 });
    const silverChampion = createPiece('champion', 'silver', { row: 0, col: 4 }); // Checks Regent
    const goldSoldier = createPiece('soldier', 'gold', { row: 6, col: 0 }); // Away on column 0
    const silverRegent = createPiece('regent', 'silver', { row: 0, col: 0 });

    const state = createInitialGameState({
      customPieces: [goldRegent, silverChampion, goldSoldier, silverRegent],
    });

    const moves = generateLegalMoves(state.pieces, 'gold');

    // The soldier at (6,0) cannot move because it doesn't resolve check
    const soldierMoves = moves.filter((m) => m.pieceId === goldSoldier.id);
    expect(soldierMoves.length).toBe(0);

    // Only King can move, stepping off the attacked column 4
    expect(moves.every((m) => m.pieceId === goldRegent.id)).toBe(true);
    expect(moves.every((m) => m.to && m.to.col !== 4)).toBe(true);
  });

  it('Pinned piece cannot move away if moving it exposes Regent to check', () => {
    const goldRegent = createPiece('regent', 'gold', { row: 7, col: 4 });
    const goldBastion = createPiece('bastion', 'gold', { row: 5, col: 4 }); // Blocks ray
    const silverChampion = createPiece('champion', 'silver', { row: 0, col: 4 }); // Pins bastion
    const silverRegent = createPiece('regent', 'silver', { row: 0, col: 0 });

    const state = createInitialGameState({
      customPieces: [goldRegent, goldBastion, silverChampion, silverRegent],
    });

    const moves = generateLegalMoves(state.pieces, 'gold');

    // Bastion moving horizontally (e.g. 5,3 or 5,5) exposes Regent on column 4, so horizontal moves are illegal
    const bastionHoriz = moves.filter((m) => m.pieceId === goldBastion.id && m.to && m.to.col !== 4);
    expect(bastionHoriz.length).toBe(0);
  });

  it('Checkmate: delivering check with no possible escape triggers immediate victory', () => {
    // Cornered Silver Regent at (0, 0)
    // Blocked by own soldiers at (1, 0) and (1, 1)
    const silverRegent = createPiece('regent', 'silver', { row: 0, col: 0 });
    const silverSoldier1 = createPiece('soldier', 'silver', { row: 1, col: 0 });
    const silverSoldier2 = createPiece('soldier', 'silver', { row: 1, col: 1 });
    const goldChampion = createPiece('champion', 'gold', { row: 0, col: 7 });
    const goldRegent = createPiece('regent', 'gold', { row: 7, col: 7 });

    const state = createInitialGameState({
      customPieces: [silverRegent, silverSoldier1, silverSoldier2, goldChampion, goldRegent],
    });

    // Gold Queen slides along rank 0 to (0, 2), delivering direct checkmate
    const mateMove = {
      type: 'move' as const,
      pieceId: goldChampion.id,
      from: { row: 0, col: 7 },
      to: { row: 0, col: 2 },
    };

    const { nextState } = applyMove(state, mateMove);

    expect(nextState.status).toBe('gold_victory');
    expect(nextState.winner).toBe('gold');
    expect(nextState.statusReason).toContain('CHECKMATE');
  });

  it('Stalemate: player with no legal moves and not in check results in a DRAW', () => {
    // King trapped on (0, 0) with no attackers checking it, but all surrounding squares attacked
    const silverRegent = createPiece('regent', 'silver', { row: 0, col: 0 });
    const goldChampion = createPiece('champion', 'gold', { row: 1, col: 2 }); // attacks (1,0), (1,1), (0,1), but not (0,0)
    const goldRegent = createPiece('regent', 'gold', { row: 2, col: 2 }); // defends champion

    const state = createInitialGameState({
      customPieces: [silverRegent, goldChampion, goldRegent],
    });
    // It's silver's turn
    state.activePlayer = 'silver';

    const moves = generateLegalMoves(state.pieces, 'silver');
    expect(moves.length).toBe(0);
    expect(isRegentThreatened(state.pieces, 'silver', state.config)).toBe(false);
  });
});
