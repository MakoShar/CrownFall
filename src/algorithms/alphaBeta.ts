import { GameState, applyMove } from '../engine/gameState';
import { Move, generateLegalMoves } from '../engine/moveGenerator';
import { evaluatePosition } from '../ai/evaluation';
import { orderMoves } from '../ai/moveOrdering';
import { isChanceMove, getChanceOutcomes } from '../ai/chanceNodes';

export interface AlphaBetaTreeNode {
  id: string;
  moveDescription?: string;
  depth: number;
  isMaximizing: boolean;
  value: number;
  alpha: number;
  beta: number;
  children: AlphaBetaTreeNode[];
  isPruned?: boolean;
  isTerminal?: boolean;
  isChanceNode?: boolean;
}

export interface AlphaBetaResult {
  bestMove: Move | null;
  bestValue: number;
  nodesEvaluated: number;
  branchesPruned: number;
  searchTree: AlphaBetaTreeNode;
  depth: number;
}

let abNodeCounter = 0;

export function runAlphaBeta(
  state: GameState,
  depth: number,
  isMaximizing: boolean = state.activePlayer === 'gold',
  useMoveOrdering: boolean = true
): AlphaBetaResult {
  abNodeCounter = 0;
  let nodesEvaluated = 0;
  let branchesPruned = 0;

  function abRecursive(
    currentState: GameState,
    currentDepth: number,
    alpha: number,
    beta: number,
    maximizing: boolean,
    incomingMoveDesc?: string
  ): { value: number; node: AlphaBetaTreeNode; move?: Move } {
    nodesEvaluated++;
    const isTerminal = currentState.status !== 'in_progress' && currentState.status !== 'mutual_regent_response';

    if (currentDepth === 0 || isTerminal) {
      const val = evaluatePosition(currentState);
      return {
        value: val,
        node: {
          id: `ab_node_${++abNodeCounter}`,
          moveDescription: incomingMoveDesc,
          depth: currentDepth,
          isMaximizing: maximizing,
          value: val,
          alpha,
          beta,
          children: [],
          isTerminal,
        },
      };
    }

    let legalMoves = generateLegalMoves(currentState.pieces, currentState.activePlayer, {
      isMutualResponse: currentState.status === 'mutual_regent_response',
      config: currentState.config,
    });

    if (useMoveOrdering) {
      legalMoves = orderMoves(legalMoves, currentState);
    }

    if (legalMoves.length === 0) {
      const val = evaluatePosition(currentState);
      return {
        value: val,
        node: {
          id: `ab_node_${++abNodeCounter}`,
          moveDescription: incomingMoveDesc,
          depth: currentDepth,
          isMaximizing: maximizing,
          value: val,
          alpha,
          beta,
          children: [],
          isTerminal: true,
        },
      };
    }

    let currentAlpha = alpha;
    let currentBeta = beta;
    let bestVal = maximizing ? -Infinity : Infinity;
    let selectedMove: Move | undefined = undefined;
    const childNodes: AlphaBetaTreeNode[] = [];

    for (let i = 0; i < legalMoves.length; i++) {
      const move = legalMoves[i];

      if (isChanceMove(move)) {
        // Stochastic BASH chance node: compute expected value without invalid alpha-beta cutoff across chance distributions
        const outcomes = getChanceOutcomes(currentState, move);
        let expectedValue = 0;
        const chanceChildren: AlphaBetaTreeNode[] = [];

        for (const outcome of outcomes) {
          const res = abRecursive(outcome.resultingState, currentDepth - 1, currentAlpha, currentBeta, !maximizing, outcome.description);
          expectedValue += outcome.probability * res.value;
          chanceChildren.push(res.node);
        }

        const chanceNode: AlphaBetaTreeNode = {
          id: `ab_chance_${++abNodeCounter}`,
          moveDescription: 'BASH (Chance node)',
          depth: currentDepth - 1,
          isMaximizing: maximizing,
          value: Math.round(expectedValue),
          alpha: currentAlpha,
          beta: currentBeta,
          children: chanceChildren,
          isChanceNode: true,
        };
        childNodes.push(chanceNode);

        if (maximizing) {
          if (expectedValue > bestVal) {
            bestVal = expectedValue;
            selectedMove = move;
          }
          currentAlpha = Math.max(currentAlpha, bestVal);
        } else {
          if (expectedValue < bestVal) {
            bestVal = expectedValue;
            selectedMove = move;
          }
          currentBeta = Math.min(currentBeta, bestVal);
        }

        if (currentBeta <= currentAlpha) {
          branchesPruned += (legalMoves.length - 1 - i);
          break;
        }
      } else {
        const { nextState, log } = applyMove(currentState, move);
        const res = abRecursive(nextState, currentDepth - 1, currentAlpha, currentBeta, !maximizing, log);
        childNodes.push(res.node);

        if (maximizing) {
          if (res.value > bestVal) {
            bestVal = res.value;
            selectedMove = move;
          }
          currentAlpha = Math.max(currentAlpha, bestVal);
        } else {
          if (res.value < bestVal) {
            bestVal = res.value;
            selectedMove = move;
          }
          currentBeta = Math.min(currentBeta, bestVal);
        }

        // Alpha-Beta Pruning Cutoff
        if (currentBeta <= currentAlpha) {
          branchesPruned += (legalMoves.length - 1 - i);
          // Mark remaining unsearched sibling indicator
          if (i < legalMoves.length - 1) {
            childNodes.push({
              id: `ab_pruned_${++abNodeCounter}`,
              moveDescription: `[${legalMoves.length - 1 - i} branches pruned: β (${currentBeta}) ≤ α (${currentAlpha})]`,
              depth: currentDepth - 1,
              isMaximizing: !maximizing,
              value: bestVal,
              alpha: currentAlpha,
              beta: currentBeta,
              children: [],
              isPruned: true,
            });
          }
          break;
        }
      }
    }

    const node: AlphaBetaTreeNode = {
      id: `ab_node_${++abNodeCounter}`,
      moveDescription: incomingMoveDesc ?? 'Root',
      depth: currentDepth,
      isMaximizing: maximizing,
      value: bestVal,
      alpha: currentAlpha,
      beta: currentBeta,
      children: childNodes,
    };

    return { value: bestVal, node, move: selectedMove };
  }

  const result = abRecursive(state, depth, -Infinity, Infinity, isMaximizing);

  return {
    bestMove: result.move ?? null,
    bestValue: result.value,
    nodesEvaluated,
    branchesPruned,
    searchTree: result.node,
    depth,
  };
}

