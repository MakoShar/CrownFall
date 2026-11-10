import { GameState, cloneGameState } from '../engine/gameState';
import { Move } from '../engine/moveGenerator';
import { getSurroundingEmptySquares } from '../engine/bastionAbilities';
import { clonePiece, clonePosition, Position } from '../engine/pieces';
import { handleRegentCapture } from '../engine/endgameHandler';

export interface ChanceOutcome {
  probability: number;
  resultingState: GameState;
  description: string;
}

export function isChanceMove(move: Move): boolean {
  return move.type === 'bastion_bash';
}

export function getChanceOutcomes(state: GameState, move: Move): ChanceOutcome[] {
  if (move.type !== 'bastion_bash' || !move.targetPieceId) {
    throw new Error('Not a chance move');
  }

  const target = state.pieces.find((p) => p.id === move.targetPieceId);
  if (!target) return [];

  const surroundingEmpty = getSurroundingEmptySquares(target.position, state.pieces, state.config);
  const player = state.activePlayer;
  const opponent = player === 'gold' ? 'silver' : 'gold';

  if (surroundingEmpty.length === 0) {
    // 100% probability: target destroyed
    const next = cloneGameState(state);
    next.pieces = next.pieces.filter((p) => p.id !== target.id);
    if (target.type === 'regent') {
      const eg = handleRegentCapture(player, next.pieces, next.config);
      next.status = eg.newStatus;
      next.winner = eg.winner;
      next.statusReason = eg.reason;
    }
    next.activePlayer = opponent;
    return [{
      probability: 1.0,
      resultingState: next,
      description: 'Target trapped and destroyed (100%)',
    }];
  }

  // Uniform probability across all empty squares
  const prob = 1.0 / surroundingEmpty.length;
  const outcomes: ChanceOutcome[] = [];

  for (const emptySq of surroundingEmpty) {
    const next = cloneGameState(state);
    next.pieces = next.pieces.map((p) => {
      if (p.id === target.id) {
        const updated = clonePiece(p);
        updated.position = clonePosition(emptySq);
        return updated;
      }
      return clonePiece(p);
    });
    next.activePlayer = opponent;
    outcomes.push({
      probability: prob,
      resultingState: next,
      description: `Displaced to (${emptySq.row},${emptySq.col}) (${Math.round(prob * 100)}%)`,
    });
  }

  return outcomes;
}

