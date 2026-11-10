import { BoardConfig, DEFAULT_BOARD_CONFIG } from '../config/boardConfig';
import { Piece, Position, isSamePosition, PlayerColor } from './pieces';

export function isWithinBoard(pos: Position, config: BoardConfig = DEFAULT_BOARD_CONFIG): boolean {
  return pos.row >= 0 && pos.row < config.rows && pos.col >= 0 && pos.col < config.cols;
}

export function getPieceAt(pieces: Piece[], pos: Position): Piece | undefined {
  return pieces.find((p) => isSamePosition(p.position, pos));
}

export function getPieceById(pieces: Piece[], id: string): Piece | undefined {
  return pieces.find((p) => p.id === id);
}

export function isSquareEmpty(pieces: Piece[], pos: Position): boolean {
  return !getPieceAt(pieces, pos);
}

export function isOpponentPiece(piece: Piece, targetPiece: Piece): boolean {
  return piece.owner !== targetPiece.owner;
}

export function isOpponentBaseline(pos: Position, owner: PlayerColor, config: BoardConfig = DEFAULT_BOARD_CONFIG): boolean {
  const targetRow = owner === 'gold' ? config.goldBaselineRow : config.silverBaselineRow;
  return pos.row === targetRow;
}

export function formatPosition(pos: Position): string {
  const fileLetter = String.fromCharCode('a'.charCodeAt(0) + pos.col);
  const rankNumber = 8 - pos.row; // chess-like rank notation: row 7 -> 1, row 0 -> 8
  return `${fileLetter}${rankNumber}`;
}

