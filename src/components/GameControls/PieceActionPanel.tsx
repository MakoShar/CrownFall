import React from 'react';
import { Piece, PieceType } from '../../engine/pieces';
import { Move } from '../../engine/moveGenerator';
import { Crown, Swords, Zap, Sparkles, Shield, User } from 'lucide-react';

interface PieceActionPanelProps {
  selectedPiece: Piece | null;
  legalMoves: Move[];
  onExecuteMove: (move: Move) => void;
  disabled?: boolean;
}

const CHESS_PIECE_PROFILES: Record<
  PieceType,
  {
    chessName: string;
    unitTitle: string;
    icon: React.ReactNode;
    movementSummary: string;
    badgeColor: string;
  }
> = {
  regent: {
    chessName: 'KING',
    unitTitle: 'The Regent',
    icon: <Crown className="w-4 h-4 text-amber-300" />,
    movementSummary: 'Moves 1 square in any direction. Defend against Check & Checkmate!',
    badgeColor: 'border-amber-500/60 bg-amber-950/40 text-amber-300',
  },
  champion: {
    chessName: 'QUEEN',
    unitTitle: 'The Champion',
    icon: <Swords className="w-4 h-4 text-amber-300" />,
    movementSummary: 'Moves any distance horizontally, vertically, or diagonally.',
    badgeColor: 'border-amber-400/60 bg-amber-950/40 text-amber-200',
  },
  bastion: {
    chessName: 'ROOK',
    unitTitle: 'The Bastion',
    icon: <Shield className="w-4 h-4 text-orange-400" />,
    movementSummary: 'Moves any distance horizontally or vertically along ranks and files.',
    badgeColor: 'border-orange-500/60 bg-orange-950/40 text-orange-300',
  },
  oracle: {
    chessName: 'BISHOP',
    unitTitle: 'The Oracle',
    icon: <Sparkles className="w-4 h-4 text-purple-400" />,
    movementSummary: 'Moves any distance diagonally across squares of the same color.',
    badgeColor: 'border-purple-500/60 bg-purple-950/40 text-purple-300',
  },
  rider: {
    chessName: 'KNIGHT',
    unitTitle: 'The Rider',
    icon: <Zap className="w-4 h-4 text-sky-400" />,
    movementSummary: 'Jumps in an L-shape (2 squares in one direction, 1 square perpendicular). Can leap over pieces.',
    badgeColor: 'border-sky-500/60 bg-sky-950/40 text-sky-300',
  },
  soldier: {
    chessName: 'PAWN',
    unitTitle: 'The Soldier',
    icon: <User className="w-4 h-4 text-emerald-400" />,
    movementSummary: 'Advances 1 square forward (or 2 squares from starting rank). Captures diagonally forward. Promotes at opponent baseline.',
    badgeColor: 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300',
  },
};

export const PieceActionPanel: React.FC<PieceActionPanelProps> = ({
  selectedPiece,
  legalMoves,
}) => {
  if (!selectedPiece) {
    return (
      <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 sm:p-3 text-center text-xs text-slate-400">
        <span className="text-kingdom-gold font-semibold">Standard Chess:</span> Tap any piece on the board to view its movement and legal destination squares.
      </div>
    );
  }

  const profile = CHESS_PIECE_PROFILES[selectedPiece.type];
  const pieceMoves = legalMoves.filter((m) => m.pieceId === selectedPiece.id);

  return (
    <div className="w-full bg-slate-900/95 border border-slate-700/80 rounded-xl p-2.5 sm:p-3 shadow-xl">
      {/* Header: Chess Type + Piece Name */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest border uppercase flex items-center gap-1 ${profile.badgeColor}`}>
            {profile.icon}
            {profile.chessName}
          </span>
          <span className="text-xs font-fantasy font-bold text-slate-200 truncate">
            {profile.unitTitle}
          </span>
        </div>

        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono shrink-0">
          {pieceMoves.length} legal {pieceMoves.length === 1 ? 'move' : 'moves'}
        </span>
      </div>

      {/* Movement instruction description */}
      <p className="text-[11px] text-slate-300 leading-snug">
        {profile.movementSummary}
      </p>
    </div>
  );
};
