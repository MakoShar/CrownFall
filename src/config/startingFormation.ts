import { PieceType, Piece, createPiece } from '../engine/pieces';
import { BoardConfig, DEFAULT_BOARD_CONFIG } from './boardConfig';

export type BackRankLayout = PieceType[];

export const STANDARD_BACK_RANK_PRESET: BackRankLayout = [
  'bastion',  // col 0 (a): Rook
  'rider',    // col 1 (b): Knight
  'oracle',   // col 2 (c): Bishop
  'champion', // col 3 (d): Queen
  'regent',   // col 4 (e): King
  'oracle',   // col 5 (f): Bishop
  'rider',    // col 6 (g): Knight
  'bastion',  // col 7 (h): Rook
];

export const ALTERNATIVE_BACK_RANK_PRESET: BackRankLayout = [
  'bastion',
  'rider',
  'oracle',
  'champion',
  'regent',
  'oracle',
  'rider',
  'bastion',
];

export function createInitialPieces(
  config: BoardConfig = DEFAULT_BOARD_CONFIG,
  backRankPreset: BackRankLayout = STANDARD_BACK_RANK_PRESET
): Piece[] {
  const pieces: Piece[] = [];

  // Silver Army (Top)
  // Back rank (row 0 by default)
  for (let col = 0; col < config.cols; col++) {
    const type = backRankPreset[col] || 'soldier';
    pieces.push(
      createPiece(type, 'silver', { row: config.silverBackRow, col }, {
        orientation: type === 'rider' ? 'S' : undefined,
      })
    );
  }
  // Front rank / Soldiers (row 1 by default)
  for (let col = 0; col < config.cols; col++) {
    pieces.push(
      createPiece('soldier', 'silver', { row: config.silverSoldierRow, col })
    );
  }

  // Gold Army (Bottom)
  // Front rank / Soldiers (row 6 by default)
  for (let col = 0; col < config.cols; col++) {
    pieces.push(
      createPiece('soldier', 'gold', { row: config.goldSoldierRow, col })
    );
  }
  // Back rank (row 7 by default)
  for (let col = 0; col < config.cols; col++) {
    const type = backRankPreset[col] || 'soldier';
    pieces.push(
      createPiece(type, 'gold', { row: config.goldBackRow, col }, {
        orientation: type === 'rider' ? 'N' : undefined,
      })
    );
  }

  return pieces;
}

