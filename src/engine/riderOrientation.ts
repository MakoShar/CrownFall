import { Direction } from '../config/boardConfig';
import { Piece, clonePiece } from './pieces';

export const CARDINAL_DIRECTIONS: Direction[] = ['N', 'S', 'E', 'W'];

export function getLegalRotations(rider: Piece): Direction[] {
  if (rider.type !== 'rider') return [];
  return CARDINAL_DIRECTIONS.filter((dir) => dir !== rider.orientation);
}

export function executeRiderRotation(
  riderId: string,
  newOrientation: Direction,
  pieces: Piece[]
): Piece[] {
  return pieces.map((p) => {
    if (p.id === riderId) {
      if (p.type !== 'rider') {
        throw new Error('Only Riders can rotate orientation');
      }
      const rotated = clonePiece(p);
      rotated.orientation = newOrientation;
      return rotated;
    }
    return clonePiece(p);
  });
}
