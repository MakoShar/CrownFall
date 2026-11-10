import { Piece, PlayerColor, clonePiece, clonePosition } from './pieces';

export type OracleCaptureOutcome =
  | 'normal_capture'
  | 'divine_conversion'
  | 'mutual_oracle_destruction';

export function isConvertibleByOracle(targetPiece: Piece): boolean {
  // Champion and Regent cannot be converted
  // Oracle has special mutual destruction
  if (targetPiece.type === 'champion' || targetPiece.type === 'regent' || targetPiece.type === 'oracle') {
    return false;
  }
  return true;
}

export interface OracleCaptureResult {
  outcome: OracleCaptureOutcome;
  updatedPieces: Piece[];
  message: string;
  convertedPiece?: Piece;
}

export function executeOracleCapture(
  oracle: Piece,
  targetPiece: Piece,
  allPieces: Piece[],
  actionChoice: 'capture' | 'convert' = 'capture'
): OracleCaptureResult {
  if (oracle.type !== 'oracle') {
    throw new Error('Executing unit must be an Oracle');
  }

  // 1. Oracle vs Oracle: Mutual destruction!
  if (targetPiece.type === 'oracle') {
    const updated = allPieces
      .filter((p) => p.id !== oracle.id && p.id !== targetPiece.id)
      .map(clonePiece);
    return {
      outcome: 'mutual_oracle_destruction',
      updatedPieces: updated,
      message: 'Mutual Oracle Destruction: Both Oracles perish in divine collision!',
    };
  }

  // 2. Champion or Regent: Cannot be converted, always normal capture
  if (targetPiece.type === 'champion' || targetPiece.type === 'regent' || !isConvertibleByOracle(targetPiece)) {
    // Normal capture: enemy removed, Oracle occupies target's square
    const updated = allPieces
      .filter((p) => p.id !== targetPiece.id)
      .map((p) => {
        if (p.id === oracle.id) {
          const moved = clonePiece(p);
          moved.position = clonePosition(targetPiece.position);
          return moved;
        }
        return clonePiece(p);
      });
    return {
      outcome: 'normal_capture',
      updatedPieces: updated,
      message: `Oracle vanquished ${targetPiece.type} through standard capture.`,
    };
  }

  // 3. Eligible unit (Soldier, Rider, Bastion): Player's choice
  if (actionChoice === 'convert') {
    // Divine Conversion:
    // Oracle sacrifices itself and disappears
    // Captured enemy changes allegiance, remains on EXACTLY the same square
    // Retains identity, orientation, promotion eligibility, siege mode
    let convertedPieceRef: Piece | undefined;
    const updated = allPieces
      .filter((p) => p.id !== oracle.id)
      .map((p) => {
        if (p.id === targetPiece.id) {
          const converted = clonePiece(p);
          converted.owner = oracle.owner; // Swaps allegiance to oracle's owner
          // Keeps same position, keeps orientation (Rider), keeps isSiegeMode (Bastion), keeps promotionEligible
          convertedPieceRef = converted;
          return converted;
        }
        return clonePiece(p);
      });
    return {
      outcome: 'divine_conversion',
      updatedPieces: updated,
      convertedPiece: convertedPieceRef,
      message: `Divine Conversion! Oracle sacrificed to convert enemy ${targetPiece.type}!`,
    };
  } else {
    // Option 1: Normal capture
    const updated = allPieces
      .filter((p) => p.id !== targetPiece.id)
      .map((p) => {
        if (p.id === oracle.id) {
          const moved = clonePiece(p);
          moved.position = clonePosition(targetPiece.position);
          return moved;
        }
        return clonePiece(p);
      });
    return {
      outcome: 'normal_capture',
      updatedPieces: updated,
      message: `Oracle captured enemy ${targetPiece.type}.`,
    };
  }
}

