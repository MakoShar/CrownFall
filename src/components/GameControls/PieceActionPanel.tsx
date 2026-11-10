import React from 'react';
import { Piece, Direction } from '../../engine/pieces';
import { Move } from '../../engine/moveGenerator';
import { Compass, Flame, Shield, Skull, Sparkles, Swords } from 'lucide-react';

interface PieceActionPanelProps {
  selectedPiece: Piece | null;
  legalMoves: Move[];
  onExecuteMove: (move: Move) => void;
  disabled?: boolean;
}

export const PieceActionPanel: React.FC<PieceActionPanelProps> = ({
  selectedPiece,
  legalMoves,
  onExecuteMove,
  disabled = false,
}) => {
  if (!selectedPiece) return null;

  // Filter specific move types
  const rotationMoves = legalMoves.filter((m) => m.type === 'rider_rotate');
  const bashMoves = legalMoves.filter((m) => m.type === 'bastion_bash');
  const siegeBashMoves = legalMoves.filter((m) => m.type === 'siege_bash_two');
  const leapMoves = legalMoves.filter((m) => m.isSoldierLeap);
  const sacrificeMove = legalMoves.find((m) => m.type === 'soldier_sacrifice');

  const hasSpecialActions =
    rotationMoves.length > 0 ||
    bashMoves.length > 0 ||
    siegeBashMoves.length > 0 ||
    leapMoves.length > 0 ||
    !!sacrificeMove;

  if (!hasSpecialActions) return null;

  return (
    <div className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 shadow-lg my-2">
      <div className="text-xs font-semibold uppercase tracking-wider text-amber-300 mb-2 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-kingdom-gold" />
        Special Abilities — {selectedPiece.type.toUpperCase()}
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Rider Rotations */}
        {rotationMoves.length > 0 && (
          <div className="flex items-center gap-1 bg-slate-800/90 p-1.5 rounded-lg border border-slate-700">
            <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              Rotate:
            </span>
            {rotationMoves.map((m) => (
              <button
                key={m.newOrientation}
                disabled={disabled}
                onClick={() => onExecuteMove(m)}
                className="px-2 py-1 rounded bg-slate-700 hover:bg-kingdom-gold hover:text-black text-xs font-bold font-mono transition-colors text-amber-200"
              >
                {m.newOrientation}
              </button>
            ))}
          </div>
        )}

        {/* Bastion BASH */}
        {bashMoves.length > 0 && (
          <div className="flex items-center gap-1">
            {bashMoves.map((m, idx) => (
              <button
                key={idx}
                disabled={disabled}
                onClick={() => onExecuteMove(m)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-700 hover:bg-orange-600 text-white text-xs font-bold shadow-md transition-all active:scale-95 border border-orange-500"
              >
                <Flame className="w-3.5 h-3.5 text-yellow-300" />
                BASH Adjacent Target
              </button>
            ))}
          </div>
        )}

        {/* Siege Bastion Enhanced BASH */}
        {siegeBashMoves.length > 0 && (
          <div className="flex items-center gap-1">
            {siegeBashMoves.map((m, idx) => (
              <button
                key={idx}
                disabled={disabled}
                onClick={() => onExecuteMove(m)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-800 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-900/50 transition-all active:scale-95 border border-red-500 animate-pulse"
              >
                <Swords className="w-3.5 h-3.5 text-yellow-300" />
                Enhanced BASH (Destroy 2 Units)
              </button>
            ))}
          </div>
        )}

        {/* Soldier Self-Sacrifice */}
        {sacrificeMove && (
          <button
            disabled={disabled}
            onClick={() => onExecuteMove(sacrificeMove)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-300 border border-red-800/80 text-xs font-semibold transition-all"
            title="Permanently remove this friendly Soldier to clear lines"
          >
            <Skull className="w-3.5 h-3.5 text-red-400" />
            Friendly Elimination
          </button>
        )}
      </div>
    </div>
  );
};

