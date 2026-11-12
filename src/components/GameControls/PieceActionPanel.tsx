import React from 'react';
import { Piece, PieceType } from '../../engine/pieces';
import { Move } from '../../engine/moveGenerator';
import { Crown, Swords, Zap, Sparkles, Shield, User, Skull, FastForward } from 'lucide-react';

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
    specialAbilityTitle: string;
    abilityType: 'Passive' | 'Active' | 'None';
    specialSummary: string;
    badgeColor: string;
  }
> = {
  regent: {
    chessName: 'KING',
    unitTitle: 'The Regent',
    icon: <Crown className="w-4 h-4 text-amber-300" />,
    specialAbilityTitle: 'Royal Surge',
    abilityType: 'Passive',
    specialSummary: 'Can move up to two spaces at a time in all 8 directions (cannot jump over pieces). Defend against Check & Mate!',
    badgeColor: 'border-amber-500/60 bg-amber-950/40 text-amber-300',
  },
  champion: {
    chessName: 'QUEEN',
    unitTitle: 'The Champion',
    icon: <Swords className="w-4 h-4 text-purple-400" />,
    specialAbilityTitle: 'Overpowered',
    abilityType: 'Passive',
    specialSummary: 'Already overpowered. Moves any distance in all 8 directions with supreme dominance.',
    badgeColor: 'border-purple-500/60 bg-purple-950/40 text-purple-300',
  },
  bastion: {
    chessName: 'ROOK',
    unitTitle: 'The Bastion',
    icon: <Shield className="w-4 h-4 text-orange-400" />,
    specialAbilityTitle: 'Rampart Leap',
    abilityType: 'Passive',
    specialSummary: 'Can jump over a nearby (adjacent) piece by one square. Cannot move across empty squares and jump at the same time.',
    badgeColor: 'border-orange-500/60 bg-orange-950/40 text-orange-300',
  },
  oracle: {
    chessName: 'BISHOP',
    unitTitle: 'The Oracle',
    icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
    specialAbilityTitle: 'Soul Transmutation',
    abilityType: 'Active',
    specialSummary: 'Can transform into any piece it captures (usable once per game). The bishop is replaced by the captured piece at the opponent\'s position.',
    badgeColor: 'border-indigo-500/60 bg-indigo-950/40 text-indigo-300',
  },
  rider: {
    chessName: 'HORSE (KNIGHT)',
    unitTitle: 'The Rider',
    icon: <Zap className="w-4 h-4 text-sky-400" />,
    specialAbilityTitle: 'Temporal Gallop',
    abilityType: 'Active',
    specialSummary: 'Option to skip opponent\'s turn once! (After use, this horse cannot move on the next turn).',
    badgeColor: 'border-sky-500/60 bg-sky-950/40 text-sky-300',
  },
  soldier: {
    chessName: 'SOLDIER (PAWN)',
    unitTitle: 'The Soldier',
    icon: <User className="w-4 h-4 text-emerald-400" />,
    specialAbilityTitle: 'Lateral Advance',
    abilityType: 'Passive',
    specialSummary: 'Passive ability allows it to move forward, left, and right (and capture diagonally forward or sideways). Reaching 8th rank promotes!',
    badgeColor: 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300',
  },
};

export const PieceActionPanel: React.FC<PieceActionPanelProps> = ({
  selectedPiece,
  legalMoves,
  onExecuteMove,
  disabled = false,
}) => {
  if (!selectedPiece) {
    return (
      <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 sm:p-3 text-center text-xs text-slate-400">
        <span className="text-white font-semibold">Special Ability Chess:</span> Tap any piece on the board to view its movement, active abilities, and passive bonuses.
      </div>
    );
  }

  const profile = CHESS_PIECE_PROFILES[selectedPiece.type];
  const pieceMoves = legalMoves.filter((m) => m.pieceId === selectedPiece.id);

  // Active ability moves
  const skipMove = legalMoves.find((m) => m.type === 'horse_skip_turn' && m.pieceId === selectedPiece.id);
  const sacrificeMove = legalMoves.find((m) => m.type === 'soldier_sacrifice' && m.pieceId === selectedPiece.id);

  return (
    <div className="w-full bg-slate-900/95 border border-slate-700/80 rounded-xl p-2.5 sm:p-3 shadow-xl">
      {/* Header: Chess Type + Piece Name */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest border uppercase flex items-center gap-1 ${profile.badgeColor}`}>
            {profile.icon}
            {profile.chessName}
          </span>
          <span className="text-xs font-fantasy font-bold text-slate-200 truncate">
            {profile.unitTitle}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {profile.abilityType}: {profile.specialAbilityTitle}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono shrink-0">
            {pieceMoves.length} moves
          </span>
        </div>
      </div>

      {/* Active Ability Buttons */}
      <div className="flex flex-wrap items-center gap-2 mb-1.5">
        {/* Horse Skip Turn Button */}
        {selectedPiece.type === 'rider' && (
          skipMove ? (
            <button
              disabled={disabled}
              onClick={() => onExecuteMove(skipMove)}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white text-xs font-bold shadow-lg shadow-sky-950/80 transition-all active:scale-95 border border-sky-400 cursor-pointer animate-pulse"
              title="Skip the opponent's turn immediately! (Horse cannot move on the next turn)"
            >
              <FastForward className="w-4 h-4 text-sky-200" />
              <span>Activate: Skip Opponent's Turn (1 Available)</span>
            </button>
          ) : (
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {selectedPiece.specialAbilityState?.hasUsedSkipTurn ? 'Skip Ability Used (1/1)' : 'Skip Ability Unavailable in Check'}
            </span>
          )
        )}

        {/* Soldier Friendly Elimination Button */}
        {selectedPiece.type === 'soldier' && sacrificeMove && (
          <button
            disabled={disabled}
            onClick={() => onExecuteMove(sacrificeMove)}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800 text-xs font-semibold transition-all cursor-pointer"
            title="Voluntarily remove this Soldier to clear files and open attack rays"
          >
            <Skull className="w-3.5 h-3.5 text-red-400" />
            <span>Friendly Elimination (Sacrifice)</span>
          </button>
        )}

        {/* Bishop Transformation Status */}
        {selectedPiece.type === 'oracle' && (
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-indigo-950/70 text-indigo-300 border border-indigo-700">
            {selectedPiece.specialAbilityState?.hasUsedTransform
              ? 'Transformation Used (Transformed from Bishop)'
              : 'Active Ability Ready: Transforms into any piece it captures (1/1)'}
          </span>
        )}
      </div>

      {/* Ability Summary Description */}
      <p className="text-[11px] text-slate-300 leading-snug">
        {profile.specialSummary}
      </p>
    </div>
  );
};
