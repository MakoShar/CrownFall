import { Piece, PieceType, clonePiece, clonePosition } from './pieces';
import { BoardConfig, DEFAULT_BOARD_CONFIG } from '../config/boardConfig';
import { isOpponentBaseline } from './board';

export const VALID_PROMOTION_CHOICES: PieceType[] = ['champion', 'bastion', 'oracle', 'rider'];

export function canSoldierPromote(
  piece: Piece,
  config: BoardConfig = DEFAULT_BOARD_CONFIG
): boolean {
  return piece.type === 'soldier' && isOpponentBaseline(piece.position, piece.owner, config);
}

export function executePromotion(
  soldierId: string,
  chosenType: PieceType,
  pieces: Piece[]
): Piece[] {
  if (!VALID_PROMOTION_CHOICES.includes(chosenType)) {
    throw new Error(`Invalid promotion type: ${chosenType}. Must be Champion, Bastion, Oracle, or Rider.`);
  }

  return pieces.map((p) => {
    if (p.id === soldierId) {
      const promoted = clonePiece(p);
      promoted.type = chosenType;
      promoted.promotionEligible = false;
      return promoted;
    }
    return clonePiece(p);
  });
}

