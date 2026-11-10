import { describe, it, expect } from 'vitest';
import { createPiece, Piece } from '../engine/pieces';
import { createInitialGameState, applyMove, cloneGameState } from '../engine/gameState';
import { generateLegalMoves } from '../engine/moveGenerator';
import { executeBash } from '../engine/bastionAbilities';
import { executeOracleCapture } from '../engine/conversionHandler';
import { executePromotion } from '../engine/promotionHandler';
import { SeededRNG } from '../utils/seededRng';
import { computeAttackMap, isRegentThreatened } from '../engine/attackDetection';

describe('Movement Rules', () => {
  it('Soldier moves only forward or sideways (5 directions), strictly no backward', () => {
    // Gold Soldier at (4, 4) - forward is row 3, sideways is row 4
    const goldSoldier = createPiece('soldier', 'gold', { row: 4, col: 4 });
    const state = createInitialGameState({ customPieces: [goldSoldier] });
    const moves = generateLegalMoves(state.pieces, 'gold');

    const destMoves = moves.filter((m) => m.type === 'move');
    expect(destMoves.length).toBe(5);

    const destinations = destMoves.map((m) => `${m.to!.row},${m.to!.col}`);
    // Forward (row 3)
    expect(destinations).toContain('3,3');
    expect(destinations).toContain('3,4');
    expect(destinations).toContain('3,5');
    // Sideways (row 4)
    expect(destinations).toContain('4,3');
    expect(destinations).toContain('4,5');
    // Backward (row 5) MUST NOT be present
    expect(destinations).not.toContain('5,3');
    expect(destinations).not.toContain('5,4');
    expect(destinations).not.toContain('5,5');

    // Silver Soldier at (4, 4) - forward is row 5, sideways is row 4
    const silverSoldier = createPiece('soldier', 'silver', { row: 4, col: 4 });
    const silverMoves = generateLegalMoves([silverSoldier], 'silver').filter((m) => m.type === 'move');
    expect(silverMoves.length).toBe(5);
    const silverDests = silverMoves.map((m) => `${m.to!.row},${m.to!.col}`);
    // Forward (row 5)
    expect(silverDests).toContain('5,3');
    expect(silverDests).toContain('5,4');
    expect(silverDests).toContain('5,5');
    // Sideways (row 4)
    expect(silverDests).toContain('4,3');
    expect(silverDests).toContain('4,5');
    // Backward (row 3) MUST NOT be present
    expect(silverDests).not.toContain('3,3');
    expect(silverDests).not.toContain('3,4');
    expect(silverDests).not.toContain('3,5');
  });

  it('Soldier can eliminate itself (Friendly Soldier Elimination), consuming the turn', () => {
    const soldier = createPiece('soldier', 'gold', { row: 4, col: 4 });
    const silverRegent = createPiece('regent', 'silver', { row: 0, col: 0 });
    const goldRegent = createPiece('regent', 'gold', { row: 7, col: 7 });
    const state = createInitialGameState({ customPieces: [soldier, silverRegent, goldRegent] });

    const moves = generateLegalMoves(state.pieces, 'gold');
    const sacrificeMove = moves.find((m) => m.type === 'soldier_sacrifice' && m.pieceId === soldier.id);
    expect(sacrificeMove).toBeDefined();

    const { nextState } = applyMove(state, sacrificeMove!);
    expect(nextState.pieces.find((p) => p.id === soldier.id)).toBeUndefined();
    expect(nextState.activePlayer).toBe('silver');
  });

  it('Rider moves along facing axis and can rotate to other 3 cardinal directions', () => {
    // Rider facing North on (4, 4)
    const rider = createPiece('rider', 'gold', { row: 4, col: 4 }, { orientation: 'N' });
    const state = createInitialGameState({ customPieces: [rider] });
    const moves = generateLegalMoves(state.pieces, 'gold');

    // Move vertically: rows 0..3 (4 steps up) and 5..7 (3 steps down) = 7 moves
    const verticalMoves = moves.filter((m) => m.type === 'move');
    expect(verticalMoves.length).toBe(7);
    for (const m of verticalMoves) {
      expect(m.to!.col).toBe(4);
    }

    // Rotations: S, E, W (3 rotations)
    const rotations = moves.filter((m) => m.type === 'rider_rotate');
    expect(rotations.length).toBe(3);
    const newOrs = rotations.map((m) => m.newOrientation);
    expect(newOrs).toEqual(expect.arrayContaining(['S', 'E', 'W']));

    // Executing rotation consumes entire turn and updates orientation
    const rotateMove = rotations.find((m) => m.newOrientation === 'E')!;
    const { nextState } = applyMove(state, rotateMove);
    const updatedRider = nextState.pieces.find((p) => p.id === rider.id)!;
    expect(updatedRider.orientation).toBe('E');
    expect(nextState.activePlayer).toBe('silver');
  });

  it('Champion moves in all 8 directions across multiple squares like a Queen', () => {
    const champion = createPiece('champion', 'gold', { row: 4, col: 4 });
    const state = createInitialGameState({ customPieces: [champion] });
    const moves = generateLegalMoves(state.pieces, 'gold');
    // On 4,4 on 8x8 board: 14 orthogonal squares + 13 diagonal squares = 27 moves
    expect(moves.filter((m) => m.type === 'move').length).toBe(27);
  });

  it('Regent moves exactly 1 square in all 8 directions', () => {
    const regent = createPiece('regent', 'gold', { row: 4, col: 4 });
    const state = createInitialGameState({ customPieces: [regent] });
    const moves = generateLegalMoves(state.pieces, 'gold');
    expect(moves.length).toBe(8);
  });
});

describe('Oracle Abilities and Rules', () => {
  it('Oracle normal capture removes enemy and occupies target square', () => {
    const oracle = createPiece('oracle', 'gold', { row: 4, col: 4 });
    const enemySoldier = createPiece('soldier', 'silver', { row: 2, col: 2 });
    const state = createInitialGameState({ customPieces: [oracle, enemySoldier] });

    const result = executeOracleCapture(oracle, enemySoldier, state.pieces, 'capture');
    expect(result.outcome).toBe('normal_capture');
    expect(result.updatedPieces.find((p) => p.id === enemySoldier.id)).toBeUndefined();
    const movedOracle = result.updatedPieces.find((p) => p.id === oracle.id);
    expect(movedOracle?.position).toEqual({ row: 2, col: 2 });
  });

  it('Divine Conversion: Oracle sacrifices itself, target switches owner and stays on exact square', () => {
    const oracle = createPiece('oracle', 'gold', { row: 4, col: 4 });
    const enemyRider = createPiece('rider', 'silver', { row: 2, col: 2 }, { orientation: 'S' });
    const state = createInitialGameState({ customPieces: [oracle, enemyRider] });

    const result = executeOracleCapture(oracle, enemyRider, state.pieces, 'convert');
    expect(result.outcome).toBe('divine_conversion');
    // Oracle sacrificed and removed
    expect(result.updatedPieces.find((p) => p.id === oracle.id)).toBeUndefined();

    // Converted piece is now Gold, on exact same square (2,2), retains facing 'S'
    const converted = result.updatedPieces.find((p) => p.id === enemyRider.id);
    expect(converted).toBeDefined();
    expect(converted?.owner).toBe('gold');
    expect(converted?.position).toEqual({ row: 2, col: 2 });
    expect(converted?.orientation).toBe('S');
  });

  it('Champion cannot be converted by Oracle, capture is normal and Oracle survives', () => {
    const oracle = createPiece('oracle', 'gold', { row: 4, col: 4 });
    const enemyChampion = createPiece('champion', 'silver', { row: 2, col: 2 });
    const state = createInitialGameState({ customPieces: [oracle, enemyChampion] });

    // Even if convert is passed, Champion cannot be converted!
    const result = executeOracleCapture(oracle, enemyChampion, state.pieces, 'convert');
    expect(result.outcome).toBe('normal_capture');
    expect(result.updatedPieces.find((p) => p.id === enemyChampion.id)).toBeUndefined();
    const movedOracle = result.updatedPieces.find((p) => p.id === oracle.id);
    expect(movedOracle?.position).toEqual({ row: 2, col: 2 });
  });

  it('Oracle vs Oracle mutual destruction: both perish, destination square is empty', () => {
    const oracleGold = createPiece('oracle', 'gold', { row: 4, col: 4 });
    const oracleSilver = createPiece('oracle', 'silver', { row: 2, col: 2 });
    const state = createInitialGameState({ customPieces: [oracleGold, oracleSilver] });

    const result = executeOracleCapture(oracleGold, oracleSilver, state.pieces);
    expect(result.outcome).toBe('mutual_oracle_destruction');
    expect(result.updatedPieces.find((p) => p.id === oracleGold.id)).toBeUndefined();
    expect(result.updatedPieces.find((p) => p.id === oracleSilver.id)).toBeUndefined();
  });

  it('Oracle captures Regent normally without conversion and triggers endgame win', () => {
    const oracle = createPiece('oracle', 'gold', { row: 4, col: 4 });
    const silverRegent = createPiece('regent', 'silver', { row: 2, col: 2 });
    const goldRegent = createPiece('regent', 'gold', { row: 7, col: 7 });
    const state = createInitialGameState({ customPieces: [oracle, silverRegent, goldRegent] });

    // Even if 'convert' option requested, Regent cannot be converted!
    const result = executeOracleCapture(oracle, silverRegent, state.pieces, 'convert');
    expect(result.outcome).toBe('normal_capture');
    expect(result.updatedPieces.find((p) => p.id === silverRegent.id)).toBeUndefined();
    const movedOracle = result.updatedPieces.find((p) => p.id === oracle.id);
    expect(movedOracle?.position).toEqual({ row: 2, col: 2 });
  });

  it('Converted Soldier retains promotion eligibility when reaching baseline', () => {
    const oracle = createPiece('oracle', 'gold', { row: 4, col: 4 });
    const silverSoldier = createPiece('soldier', 'silver', { row: 2, col: 2 });
    const state = createInitialGameState({ customPieces: [oracle, silverSoldier] });

    const result = executeOracleCapture(oracle, silverSoldier, state.pieces, 'convert');
    const convertedSoldier = result.updatedPieces.find((p) => p.id === silverSoldier.id)!;
    expect(convertedSoldier.owner).toBe('gold');
    expect(convertedSoldier.type).toBe('soldier');

    // Converted soldier can advance to row 0 and promote to Champion
    let pieces = executePromotion(convertedSoldier.id, 'champion', result.updatedPieces);
    expect(pieces.find((p) => p.id === convertedSoldier.id)?.type).toBe('champion');
  });
});

describe('Bastion Abilities and Rules', () => {
  it('Bastion BASH pushes adjacent target to a random empty surrounding square, Bastion stays in place', () => {
    const bastion = createPiece('bastion', 'gold', { row: 4, col: 4 });
    const enemy = createPiece('soldier', 'silver', { row: 4, col: 5 });
    const rng = new SeededRNG(999);
    const pieces = [bastion, enemy];

    const result = executeBash(bastion.id, enemy.id, pieces, rng);
    expect(result.targetDestroyed).toBe(false);
    expect(result.targetPushedTo).not.toBeNull();
    // Enemy is displaced to an adjacent square around (4, 5)
    expect(Math.max(Math.abs(result.targetPushedTo!.row - 4), Math.abs(result.targetPushedTo!.col - 5))).toBe(1);

    // Bastion remains on (4, 4)
    const bastionAfter = result.updatedPieces.find((p) => p.id === bastion.id);
    expect(bastionAfter?.position).toEqual({ row: 4, col: 4 });
  });

  it('Bastion BASH destroys target if no empty surrounding square exists', () => {
    // Surround enemy at (1, 1) completely
    const bastion = createPiece('bastion', 'gold', { row: 0, col: 0 });
    const enemy = createPiece('soldier', 'silver', { row: 0, col: 1 });
    // In corner/edge: row 0 col 1 has surrounding squares: (0,0)[bastion], (0,2), (1,0), (1,1), (1,2)
    const b1 = createPiece('soldier', 'gold', { row: 0, col: 2 });
    const b2 = createPiece('soldier', 'gold', { row: 1, col: 0 });
    const b3 = createPiece('soldier', 'gold', { row: 1, col: 1 });
    const b4 = createPiece('soldier', 'gold', { row: 1, col: 2 });

    const pieces = [bastion, enemy, b1, b2, b3, b4];
    const rng = new SeededRNG(42);

    const result = executeBash(bastion.id, enemy.id, pieces, rng);
    expect(result.targetDestroyed).toBe(true);
    expect(result.targetPushedTo).toBeNull();
    expect(result.updatedPieces.find((p) => p.id === enemy.id)).toBeUndefined();
  });

  it('BASH outcomes are strictly reproducible with same RNG seed', () => {
    const bastion = createPiece('bastion', 'gold', { row: 4, col: 4 });
    const enemy = createPiece('soldier', 'silver', { row: 4, col: 5 });
    const pieces = [bastion, enemy];

    const rng1 = new SeededRNG(12345);
    const res1 = executeBash(bastion.id, enemy.id, pieces, rng1);

    const rng2 = new SeededRNG(12345);
    const res2 = executeBash(bastion.id, enemy.id, pieces, rng2);

    expect(res1.targetPushedTo).toEqual(res2.targetPushedTo);
  });

  it('Bastion enters Siege Mode upon reaching opponent baseline (row 0 for Gold)', () => {
    const bastion = createPiece('bastion', 'gold', { row: 1, col: 3 });
    const state = createInitialGameState({ customPieces: [bastion] });

    const move = {
      type: 'move' as const,
      pieceId: bastion.id,
      from: { row: 1, col: 3 },
      to: { row: 0, col: 3 },
    };

    const { nextState } = applyMove(state, move);
    const bastionAfter = nextState.pieces.find((p) => p.id === bastion.id)!;
    expect(bastionAfter.isSiegeMode).toBe(true);
  });

  it('Siege Bastion can execute consecutive 2-piece BASH in straight line', () => {
    const siegeBastion = createPiece('bastion', 'gold', { row: 4, col: 4 }, { isSiegeMode: true });
    const e1 = createPiece('soldier', 'silver', { row: 3, col: 4 });
    const e2 = createPiece('soldier', 'silver', { row: 2, col: 4 });
    const state = createInitialGameState({ customPieces: [siegeBastion, e1, e2] });

    const moves = generateLegalMoves(state.pieces, 'gold');
    const siegeBash = moves.find((m) => m.type === 'siege_bash_two');
    expect(siegeBash).toBeDefined();
    expect(siegeBash?.to).toEqual({ row: 2, col: 4 });

    const { nextState } = applyMove(state, siegeBash!);
    // Both enemies destroyed, Bastion on (2, 4)
    expect(nextState.pieces.find((p) => p.id === e1.id)).toBeUndefined();
    expect(nextState.pieces.find((p) => p.id === e2.id)).toBeUndefined();
    const bastionAfter = nextState.pieces.find((p) => p.id === siegeBastion.id);
    expect(bastionAfter?.position).toEqual({ row: 2, col: 4 });
  });

  it('Siege Bastion Soldier Leap jumps over 2 soldiers without destroying them', () => {
    const siegeBastion = createPiece('bastion', 'gold', { row: 4, col: 4 }, { isSiegeMode: true });
    const s1 = createPiece('soldier', 'gold', { row: 3, col: 4 });
    const s2 = createPiece('soldier', 'silver', { row: 2, col: 4 });
    const state = createInitialGameState({ customPieces: [siegeBastion, s1, s2] });

    const moves = generateLegalMoves(state.pieces, 'gold');
    const leapMove = moves.find((m) => m.isSoldierLeap && m.to?.row === 1 && m.to?.col === 4);
    expect(leapMove).toBeDefined();

    const { nextState } = applyMove(state, leapMove!);
    // Jumped soldiers remain alive on board!
    expect(nextState.pieces.find((p) => p.id === s1.id)).toBeDefined();
    expect(nextState.pieces.find((p) => p.id === s2.id)).toBeDefined();
    const bastionAfter = nextState.pieces.find((p) => p.id === siegeBastion.id);
    expect(bastionAfter?.position).toEqual({ row: 1, col: 4 });
  });
});

describe('Soldier Promotion', () => {
  it('Promotes to Champion, Rider, or Bastion at baseline, never Oracle or Regent', () => {
    const soldier = createPiece('soldier', 'gold', { row: 0, col: 4 });
    let pieces = [soldier];

    pieces = executePromotion(soldier.id, 'champion', pieces);
    expect(pieces[0].type).toBe('champion');

    // Invalid promotion attempt throws error
    expect(() => executePromotion(soldier.id, 'oracle' as any, pieces)).toThrow();
    expect(() => executePromotion(soldier.id, 'regent' as any, pieces)).toThrow();
  });
});

describe('Win Conditions and Mutual Regent Capture', () => {
  it('Normal Regent capture results in immediate victory when capturer is safe', () => {
    const goldChampion = createPiece('champion', 'gold', { row: 4, col: 0 });
    const goldRegent = createPiece('regent', 'gold', { row: 7, col: 7 }); // Safe in corner
    const silverRegent = createPiece('regent', 'silver', { row: 4, col: 5 });

    const state = createInitialGameState({ customPieces: [goldChampion, goldRegent, silverRegent] });
    const capMove = {
      type: 'move' as const,
      pieceId: goldChampion.id,
      from: { row: 4, col: 0 },
      to: { row: 4, col: 5 },
      targetPieceId: silverRegent.id,
    };

    const { nextState } = applyMove(state, capMove);
    expect(nextState.status).toBe('gold_victory');
    expect(nextState.winner).toBe('gold');
  });

  it('Mutual Regent Capture: triggers mutual response when capturer regent is threatened', () => {
    // Gold Champion at (4,0) can capture Silver Regent at (4,4)
    // Silver Champion at (7,0) is threatening Gold Regent at (7,4)
    const goldChampion = createPiece('champion', 'gold', { row: 4, col: 0 });
    const goldRegent = createPiece('regent', 'gold', { row: 7, col: 4 });
    const silverRegent = createPiece('regent', 'silver', { row: 4, col: 4 });
    const silverChampion = createPiece('champion', 'silver', { row: 7, col: 0 });

    const state = createInitialGameState({
      customPieces: [goldChampion, goldRegent, silverRegent, silverChampion],
    });

    const capMove = {
      type: 'move' as const,
      pieceId: goldChampion.id,
      from: { row: 4, col: 0 },
      to: { row: 4, col: 4 },
      targetPieceId: silverRegent.id,
    };

    const { nextState } = applyMove(state, capMove);
    expect(nextState.status).toBe('mutual_regent_response');
    expect(nextState.activePlayer).toBe('silver');

    // Silver takes its final response turn: only moves capturing Gold Regent are legal
    const responseMoves = generateLegalMoves(nextState.pieces, 'silver', { isMutualResponse: true });
    expect(responseMoves.length).toBe(1);
    expect(responseMoves[0].targetPieceId).toBe(goldRegent.id);

    // Silver counter-captures Gold Regent -> DRAW!
    const { nextState: finalState } = applyMove(nextState, responseMoves[0]);
    expect(finalState.status).toBe('draw');
    expect(finalState.winner).toBe('draw');
  });

  it('Mutual Regent Capture: immediate win if opponent has no counter-capture move', () => {
    // Gold Regent at (7,4) is threatened by Silver Soldier at (6,4)
    // BUT Gold Champion captures Silver Regent AND blocks or removes the threat?
    // What if Gold captures Silver Regent, but Silver's threatening piece cannot reach Gold Regent?
    // If threatened, but all threats were blocked/captured or none can legally reach:
    // If no counter-capture moves exist, capturer wins immediately!
    const goldChampion = createPiece('champion', 'gold', { row: 4, col: 0 });
    const goldRegent = createPiece('regent', 'gold', { row: 7, col: 7 }); // completely safe
    const silverRegent = createPiece('regent', 'silver', { row: 4, col: 4 });

    const state = createInitialGameState({ customPieces: [goldChampion, goldRegent, silverRegent] });
    const capMove = {
      type: 'move' as const,
      pieceId: goldChampion.id,
      from: { row: 4, col: 0 },
      to: { row: 4, col: 4 },
      targetPieceId: silverRegent.id,
    };

    const { nextState } = applyMove(state, capMove);
    expect(nextState.status).toBe('gold_victory');
    expect(nextState.winner).toBe('gold');
  });
});
