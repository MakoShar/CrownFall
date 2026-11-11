import React from 'react';
import { Piece, PieceType } from '../../engine/pieces';
import { Move } from '../../engine/moveGenerator';
import { Flame, RotateCw, Skull, Sparkles, Swords, Zap, Crown, Shield } from 'lucide-react';

interface PieceActionPanelProps {
  selectedPiece: Piece | null;
  legalMoves: Move[];
  onExecuteMove: (move: Move) => void;
  disabled?: boolean;
}

const CHESS_MOD_PROFILES: Record<
  PieceType,
  {
    chessName: string;
    unitTitle: string;
    icon: React.ReactNode;
    modSummary: string;
    badgeColor: string;
  }
> = {
  regent: {
    chessName: 'KING MOD',
    unitTitle: 'The Regent',
    icon: <Crown className="w-4 h-4 text-amber-300" />,
    modSummary: 'Standard 8-direction King movement. Immune to Oracle conversion. Defend against Check & Checkmate!',
    badgeColor: 'border-amber-500/60 bg-amber-950/40 text-amber-300',
  },
  champion: {
    chessName: 'QUEEN MOD',
    unitTitle: 'The Champion',
    icon: <Swords className="w-4 h-4 text-amber-300" />,
    modSummary: 'Supreme Queen movement. Special Mod: Divine Immunity — cannot be converted by an enemy Oracle.',
    badgeColor: 'border-amber-400/60 bg-amber-950/40 text-amber-200',
  },
  rider: {
    chessName: 'ROOK MOD',
    unitTitle: 'The Rider',
    icon: <Zap className="w-4 h-4 text-sky-400" />,
    modSummary: 'Rook-style linear charge along active axis. Special Mod: Axis Shift — rotate between Vertical (↕) and Horizontal (↔).',
    badgeColor: 'border-sky-500/60 bg-sky-950/40 text-sky-300',
  },
  oracle: {
    chessName: 'BISHOP MOD',
    unitTitle: 'The Oracle',
    icon: <Sparkles className="w-4 h-4 text-purple-400" />,
    modSummary: 'Bishop diagonal range. Special Mod: Divine Conversion — choose to capture normally or sacrifice to convert the enemy on the spot!',
    badgeColor: 'border-purple-500/60 bg-purple-950/40 text-purple-300',
  },
  bastion: {
    chessName: 'CASTLE MOD',
    unitTitle: 'The Bastion',
    icon: <Shield className="w-4 h-4 text-orange-400" />,
    modSummary: '1-step fortress. Special Mod: BASH adjacent enemy (crushes if trapped!). Unlocks Siege Mode at baseline.',
    badgeColor: 'border-orange-500/60 bg-orange-950/40 text-orange-300',
  },
  soldier: {
    chessName: 'PAWN MOD',
    unitTitle: 'The Soldier',
    icon: <Flame className="w-4 h-4 text-emerald-400" />,
    modSummary: 'Pawn infantry. Special Mods: 5-direction flank freedom (no backward), Friendly Elimination, and Baseline Promotion.',
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
        <span className="text-kingdom-gold font-semibold">Chess with Mods:</span> Tap any unit on the board to view its range and trigger special mod abilities.
      </div>
    );
  }

  // Filter specific interactive move types
  const rotationMoves = legalMoves.filter((m) => m.type === 'rider_rotate');
  const bashMoves = legalMoves.filter((m) => m.type === 'bastion_bash');
  const siegeBashMoves = legalMoves.filter((m) => m.type === 'siege_bash_two');
  const sacrificeMove = legalMoves.find((m) => m.type === 'soldier_sacrifice');

  const profile = CHESS_MOD_PROFILES[selectedPiece.type];

  return (
    <div className="w-full bg-slate-900/95 border border-slate-700/80 rounded-xl p-2.5 sm:p-3 shadow-xl">
      {/* Header: Chess Archetype + Piece Name */}
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

        {selectedPiece.type === 'rider' && (
          <span className="px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 text-[10px] font-mono font-bold border border-sky-800 shrink-0">
            Axis: {selectedPiece.orientation === 'N' || selectedPiece.orientation === 'S' ? '↕ Vertical' : '↔ Horizontal'}
          </span>
        )}
        {selectedPiece.isSiegeMode && (
          <span className="px-2 py-0.5 rounded-full bg-red-950 text-yellow-300 text-[10px] font-black border border-red-500 animate-pulse shrink-0">
            SIEGE MODE 🔥
          </span>
        )}
      </div>

      {/* Interactive Ability Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Rider Rotation Button */}
        {rotationMoves.length > 0 && (
          <button
            disabled={disabled}
            onClick={() => {
              const isVertical = selectedPiece.orientation === 'N' || selectedPiece.orientation === 'S';
              const target = isVertical
                ? rotationMoves.find((m) => m.newOrientation === 'E') || rotationMoves[0]
                : rotationMoves.find((m) => m.newOrientation === 'N') || rotationMoves[0];
              if (target) onExecuteMove(target);
            }}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-600 hover:to-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-950/60 transition-all active:scale-95 border border-sky-400"
            title="Consumes turn to rotate movement axis between Vertical (↕) and Horizontal (↔)"
          >
            <RotateCw className="w-4 h-4 text-sky-200" />
            <span>
              Activate Mod: Rotate to {selectedPiece.orientation === 'N' || selectedPiece.orientation === 'S' ? '↔ (Horizontal)' : '↕ (Vertical)'}
            </span>
          </button>
        )}

        {/* Bastion BASH Button */}
        {bashMoves.length > 0 && (
          <div className="w-full sm:w-auto flex-1 flex gap-1.5">
            {bashMoves.map((m, idx) => (
              <button
                key={idx}
                disabled={disabled}
                onClick={() => onExecuteMove(m)}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-orange-950/60 transition-all active:scale-95 border border-orange-400"
              >
                <Flame className="w-4 h-4 text-yellow-200" />
                <span>Activate Mod: BASH Adjacent Target</span>
              </button>
            ))}
          </div>
        )}

        {/* Siege Bastion Enhanced BASH */}
        {siegeBashMoves.length > 0 && (
          <div className="w-full sm:w-auto flex-1 flex gap-1.5">
            {siegeBashMoves.map((m, idx) => (
              <button
                key={idx}
                disabled={disabled}
                onClick={() => onExecuteMove(m)}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-gradient-to-r from-red-700 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-red-950/80 transition-all active:scale-95 border border-red-400 animate-pulse"
              >
                <Swords className="w-4 h-4 text-yellow-300" />
                <span>Siege Mod: Enhanced BASH (Destroy 2 Units)</span>
              </button>
            ))}
          </div>
        )}

        {/* Soldier Self-Sacrifice */}
        {sacrificeMove && (
          <button
            disabled={disabled}
            onClick={() => onExecuteMove(sacrificeMove)}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800 text-xs font-semibold transition-all"
            title="Permanently remove this friendly Soldier to clear files and open attack rays"
          >
            <Skull className="w-3.5 h-3.5 text-red-400" />
            <span>Pawn Mod: Friendly Elimination</span>
          </button>
        )}
      </div>

      {/* Passive Mod description */}
      <p className="text-[11px] text-slate-300 leading-snug mt-1.5">
        {profile.modSummary}
      </p>
    </div>
  );
};
