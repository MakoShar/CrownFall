import { GameState, applyMove, cloneGameState } from '../engine/gameState';
import { Move, generateLegalMoves } from '../engine/moveGenerator';
import { evaluatePosition } from '../ai/evaluation';
import { isChanceMove, getChanceOutcomes } from '../ai/chanceNodes';

export interface MinimaxTreeNode {
  id: string;
  moveDescription?: string;
  depth: number;
  isMaximizing: boolean;
  value: number;
  children: MinimaxTreeNode[];
  isTerminal?: boolean;
  isChanceNode?: boolean;
}

export interface MinimaxResult {
  bestMove: Move | null;
  bestValue: number;
  nodesEvaluated: number;
  searchTree: MinimaxTreeNode;
  depth: number;
}

let nodeIdCounter = 0;

export function runMinimax(
  state: GameState,
  depth: number,
  isMaximizing: boolean = state.activePlayer === 'gold'
): MinimaxResult {
  nodeIdCounter = 0;
  let nodesEvaluated = 0;

  function minimaxRecursive(
    currentState: GameState,
    currentDepth: number,
    maximizing: boolean,
    incomingMoveDesc?: string
  ): { value: number; node: MinimaxTreeNode; move?: Move } {
    nodesEvaluated++;
    const isTerminal = currentState.status !== 'in_progress' && currentState.status !== 'mutual_regent_response';

    if (currentDepth === 0 || isTerminal) {
      const val = evaluatePosition(currentState);
      return {
        value: val,
        node: {
          id: `node_${++nodeIdCounter}`,
          moveDescription: incomingMoveDesc,
          depth: currentDepth,
          isMaximizing: maximizing,
          value: val,
          children: [],
          isTerminal,
        },
      };
    }

    const legalMoves = generateLegalMoves(currentState.pieces, currentState.activePlayer, {
      isMutualResponse: currentState.status === 'mutual_regent_response',
      config: currentState.config,
    });

    if (legalMoves.length === 0) {
      const val = evaluatePosition(currentState);
      return {
        value: val,
        node: {
          id: `node_${++nodeIdCounter}`,
          moveDescription: incomingMoveDesc,
          depth: currentDepth,
          isMaximizing: maximizing,
          value: val,
          children: [],
          isTerminal: true,
        },
      };
    }

    let bestVal = maximizing ? -Infinity : Infinity;
    let selectedMove: Move | undefined = undefined;
    const childNodes: MinimaxTreeNode[] = [];

    for (const move of legalMoves) {
      if (isChanceMove(move)) {
        // Chance node handling via expected value
        const outcomes = getChanceOutcomes(currentState, move);
        let expectedValue = 0;
        const chanceChildren: MinimaxTreeNode[] = [];

        for (const outcome of outcomes) {
          const res = minimaxRecursive(outcome.resultingState, currentDepth - 1, !maximizing, outcome.description);
          expectedValue += outcome.probability * res.value;
          chanceChildren.push(res.node);
        }

        const chanceNode: MinimaxTreeNode = {
          id: `node_chance_${++nodeIdCounter}`,
          moveDescription: `BASH (Chance node)`,
          depth: currentDepth - 1,
          isMaximizing: maximizing,
          value: Math.round(expectedValue),
          children: chanceChildren,
          isChanceNode: true,
        };
        childNodes.push(chanceNode);

        if (maximizing) {
          if (expectedValue > bestVal) {
            bestVal = expectedValue;
            selectedMove = move;
          }
        } else {
          if (expectedValue < bestVal) {
            bestVal = expectedValue;
            selectedMove = move;
          }
        }
      } else {
        const { nextState, log } = applyMove(currentState, move);
        const res = minimaxRecursive(nextState, currentDepth - 1, !maximizing, log);
        childNodes.push(res.node);

        if (maximizing) {
          if (res.value > bestVal) {
            bestVal = res.value;
            selectedMove = move;
          }
        } else {
          if (res.value < bestVal) {
            bestVal = res.value;
            selectedMove = move;
          }
        }
      }
    }

    const rootNode: MinimaxTreeNode = {
      id: `node_${++nodeIdCounter}`,
      moveDescription: incomingMoveDesc ?? 'Root',
      depth: currentDepth,
      isMaximizing: maximizing,
      value: bestVal,
      children: childNodes,
    };

    return { value: bestVal, node: rootNode, move: selectedMove };
  }

  const result = minimaxRecursive(state, depth, isMaximizing);

  return {
    bestMove: result.move ?? null,
    bestValue: result.value,
    nodesEvaluated,
    searchTree: result.node,
    depth,
  };
}

