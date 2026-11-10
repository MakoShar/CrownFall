import { Move } from '../engine/moveGenerator';
import { GameState } from '../engine/gameState';
import { PIECE_VALUES } from './evaluation';

export function orderMoves(moves: Move[], state: GameState): Move[] {
  return [...moves].sort((a, b) => {
    return scoreMovePriority(b, state) - scoreMovePriority(a, state);
  });
}

function scoreMovePriority(move: Move, state: GameState): number {
  let score = 0;

  // 1. Target captured piece value
  if (move.targetPieceId) {
    const target = state.pieces.find((p) => p.id === move.targetPieceId);
    if (target) {
      if (target.type === 'regent') score += 100000;
      else score += (PIECE_VALUES[target.type] || 100) * 10;
    }
  }

  // 2. Second target in siege bash
  if (move.secondTargetPieceId) {
    const target2 = state.pieces.find((p) => p.id === move.secondTargetPieceId);
    if (target2) {
      if (target2.type === 'regent') score += 100000;
      else score += (PIECE_VALUES[target2.type] || 100) * 10;
    }
  }

  // 3. Oracle conversion
  if (move.oracleAction === 'convert') {
    score += 500;
  }

  // 4. Promotions
  if (move.promotionChoice) {
    score += move.promotionChoice === 'champion' ? 800 : 400;
  }

  // 5. Special tactical moves
  if (move.type === 'siege_bash_two') score += 600;
  if (move.type === 'bastion_bash') score += 300;
  if (move.isSoldierLeap) score += 200;

  // 6. Prefer moving towards center or opponent side
  if (move.to) {
    const movingPiece = state.pieces.find((p) => p.id === move.pieceId);
    if (movingPiece) {
      const forwardDelta = movingPiece.owner === 'gold'
        ? (movingPiece.position.row - move.to.row)
        : (move.to.row - movingPiece.position.row);
      score += forwardDelta * 10;
    }
  }

  return score;
}

