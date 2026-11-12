import { describe, it, expect } from 'vitest';
import { createPiece } from '../engine/pieces';
import { createInitialGameState, applyMove } from '../engine/gameState';
import { runMinimax } from '../algorithms/minimax';
import { runAlphaBeta } from '../algorithms/alphaBeta';
import { runAStar } from '../algorithms/astar';
import { runAOStar } from '../algorithms/aostar';
import { chooseAIMove } from '../ai/opponent';

describe('AI Algorithms Suite', () => {
  it('Minimax selects best winning move when Regent is immediately capturable', () => {
    const goldChampion = createPiece('champion', 'gold', { row: 4, col: 0 });
    const silverRegent = createPiece('regent', 'silver', { row: 4, col: 6 });
    const goldRegent = createPiece('regent', 'gold', { row: 7, col: 7 });
    const state = createInitialGameState({ customPieces: [goldChampion, silverRegent, goldRegent] });

    const result = runMinimax(state, 1, true);
    expect(result.bestMove).toBeDefined();
    expect(result.bestMove?.to).toEqual({ row: 4, col: 6 });
    expect(result.bestMove?.targetPieceId).toBe(silverRegent.id);
  });

  it('Alpha-Beta pruning yields equivalent evaluation to Minimax at equal depth', () => {
    const goldChampion = createPiece('champion', 'gold', { row: 4, col: 0 });
    const silverSoldier = createPiece('soldier', 'silver', { row: 4, col: 3 });
    const silverRegent = createPiece('regent', 'silver', { row: 2, col: 2 });
    const goldRegent = createPiece('regent', 'gold', { row: 7, col: 7 });

    const state = createInitialGameState({
      customPieces: [goldChampion, silverSoldier, silverRegent, goldRegent],
    });

    const mm = runMinimax(state, 2, true);
    const ab = runAlphaBeta(state, 2, true, false);

    expect(mm.bestValue).toBe(ab.bestValue);
    // Alpha-Beta should evaluate less than or equal nodes compared to pure Minimax
    expect(ab.nodesEvaluated).toBeLessThanOrEqual(mm.nodesEvaluated);
  });

  it('A* pathfinding computes optimal path from start to goal', () => {
    const soldier = createPiece('soldier', 'gold', { row: 7, col: 4 });
    const pieces = [soldier];
    const target = { row: 4, col: 4 };

    const astar = runAStar(soldier, target, pieces);
    expect(astar.success).toBe(true);
    expect(astar.cost).toBe(3); // 3 steps: 6,4 -> 5,4 -> 4,4
    expect(astar.path.length).toBe(4); // Includes start + 3 steps
    expect(astar.path[0]).toEqual({ row: 7, col: 4 });
    expect(astar.path[3]).toEqual({ row: 4, col: 4 });
  });

  it('A* accounts for Rider Knight L-jump movement', () => {
    // Rider on (4, 4)
    const rider = createPiece('rider', 'gold', { row: 4, col: 4 });
    const pieces = [rider];
    // (2, 5) is 1 jump away (2 up, 1 right)
    const jumpTarget = { row: 2, col: 5 };
    const astarJump = runAStar(rider, jumpTarget, pieces);
    expect(astarJump.success).toBe(true);
    expect(astarJump.cost).toBe(1);
    expect(astarJump.path).toEqual([{ row: 4, col: 4 }, { row: 2, col: 5 }]);
  });

  it('AO* evaluates genuine AND-OR graph and selects optimal compound strategy', () => {
    const goldRegent = createPiece('regent', 'gold', { row: 7, col: 4 });
    const goldChampion = createPiece('champion', 'gold', { row: 6, col: 4 });
    const silverRegent = createPiece('regent', 'silver', { row: 0, col: 4 });
    const silverBastion = createPiece('bastion', 'silver', { row: 1, col: 4 });

    const state = createInitialGameState({
      customPieces: [goldRegent, goldChampion, silverRegent, silverBastion],
    });

    const aoGraph = runAOStar(state, 'assassinate_regent');
    expect(aoGraph.rootId).toBe('GOAL_ROOT');
    expect(aoGraph.nodes[aoGraph.rootId].isSolved).toBe(true);
    expect(aoGraph.nodes[aoGraph.rootId].bestBranchId).toBeDefined();
    expect(aoGraph.optimalPlanSummary.length).toBeGreaterThan(1);
  });

  it('AI Opponent works across Beginner, Intermediate, and Expert presets without errors', () => {
    const state = createInitialGameState();

    const beg = chooseAIMove(state, 'beginner');
    expect(beg.move).toBeDefined();
    expect(beg.algorithm).toBe('minimax');

    const mid = chooseAIMove(state, 'intermediate');
    expect(mid.move).toBeDefined();
    expect(mid.algorithm).toBe('alpha_beta');

    const exp = chooseAIMove(state, 'expert');
    expect(exp.move).toBeDefined();
    expect(exp.algorithm).toBe('alpha_beta');
  });

  it('AI generates 100% legal moves across sequential turns with zero illegal moves', () => {
    let state = createInitialGameState();
    // Simulate 6 turns (3 by Gold, 3 by Silver)
    for (let step = 0; step < 6; step++) {
      if (state.status !== 'in_progress') break;
      const aiResponse = chooseAIMove(state, 'intermediate');
      expect(aiResponse.move).toBeDefined();
      const { nextState } = applyMove(state, aiResponse.move);
      expect(nextState).toBeDefined();
      state = nextState;
    }
    expect(state.history.length).toBeGreaterThanOrEqual(4);
  });
});
