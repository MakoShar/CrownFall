import { Piece, PieceType, clonePiece, clonePosition } from './pieces';
import { BoardConfig, DEFAULT_BOARD_CONFIG } from '../config/boardConfig';
import { isOpponentBaseline } from './board';

export const VALID_PROMOTION_CHOICES: PieceType[] = ['champion', 'rider', 'bastion'];

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
    throw new Error(`Invalid promotion type: ${chosenType}. Must be Champion, Rider, or Bastion.`);
  }

  return pieces.map((p) => {
    if (p.id === soldierId) {
      const promoted = clonePiece(p);
      promoted.type = chosenType;
      promoted.promotionEligible = false;
      if (chosenType === 'rider') {
        // Promoted rider faces opponent
        promoted.orientation = promoted.owner === 'gold' ? 'N' : 'S';
      }
      if (chosenType === 'bastion') {
        // Since it promoted at the baseline, is Bastion in Siege Mode immediately?
        // "Siege Mode activates when the Bastion reaches the opponent's baseline"
        // Yes, it is already on the baseline!
        promoted.isSiegeMode = true;
      }
      return promoted;
    }
    return clonePiece(p);
  });
}

