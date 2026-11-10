import { GameState } from '../engine/gameState';
import { Move } from '../engine/moveGenerator';
import { AIDifficulty, DIFFICULTY_PRESETS } from './difficulty';
import { runMinimax, MinimaxResult } from '../algorithms/minimax';
import { runAlphaBeta, AlphaBetaResult } from '../algorithms/alphaBeta';

export interface AIResponse {
  move: Move;
  algorithm: 'minimax' | 'alpha_beta';
  depth: number;
  evaluatedNodes: number;
  prunedBranches: number;
  executionTimeMs: number;
  evaluationScore: number;
  minimaxResult?: MinimaxResult;
  alphaBetaResult?: AlphaBetaResult;
}

export function chooseAIMove(
  state: GameState,
  difficulty: AIDifficulty = 'intermediate'
): AIResponse {
  const config = DIFFICULTY_PRESETS[difficulty];
  const startTime = performance.now();
  const isMaximizing = state.activePlayer === 'gold';

  if (!config.useAlphaBeta) {
    // Beginner: Run Minimax
    const minimaxRes = runMinimax(state, config.depth, isMaximizing);
    const endTime = performance.now();

    if (!minimaxRes.bestMove) {
      throw new Error('AI could not find a legal move');
    }

    return {
      move: minimaxRes.bestMove,
      algorithm: 'minimax',
      depth: config.depth,
      evaluatedNodes: minimaxRes.nodesEvaluated,
      prunedBranches: 0,
      executionTimeMs: Math.round(endTime - startTime),
      evaluationScore: minimaxRes.bestValue,
      minimaxResult: minimaxRes,
    };
  } else {
    // Intermediate / Expert: Run Alpha-Beta
    const abRes = runAlphaBeta(state, config.depth, isMaximizing, config.useMoveOrdering);
    const endTime = performance.now();

    if (!abRes.bestMove) {
      throw new Error('AI could not find a legal move');
    }

    return {
      move: abRes.bestMove,
      algorithm: 'alpha_beta',
      depth: config.depth,
      evaluatedNodes: abRes.nodesEvaluated,
      prunedBranches: abRes.branchesPruned,
      executionTimeMs: Math.round(endTime - startTime),
      evaluationScore: abRes.bestValue,
      alphaBetaResult: abRes,
    };
  }
}
