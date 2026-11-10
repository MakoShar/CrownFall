import React from 'react';
import { Piece, PlayerColor } from '../../engine/pieces';
import { PieceIcon } from '../Pieces/PieceIcon';
import { Skull, Sparkles } from 'lucide-react';

interface ConversionDialogProps {
  oraclePiece: Piece;
  targetPiece: Piece;
  onChoice: (choice: 'capture' | 'convert') => void;
}

export const ConversionDialog: React.FC<ConversionDialogProps> = ({
  oraclePiece,
  targetPiece,
  onChoice,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative max-w-lg w-full bg-gradient-to-b from-purple-950/90 to-kingdom-obsidian border-2 border-purple-500 rounded-2xl p-6 shadow-2xl shadow-purple-900/50 text-center">
        <div className="inline-block px-4 py-1 rounded-full bg-purple-500/20 border border-purple-400 text-purple-300 text-xs tracking-widest uppercase font-semibold mb-2">
          Divine Revelation
        </div>
        <h2 className="text-2xl font-fantasy text-purple-100 font-bold mb-1">
          Oracle Divine Intervention
        </h2>
        <p className="text-sm text-slate-300 mb-6">
          Your Oracle has struck an enemy <span className="text-purple-300 font-semibold uppercase">{targetPiece.type}</span>. Choose how divine power will resolve:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Option 1: Normal Capture */}
          <button
            onClick={() => onChoice('capture')}
            className="group flex flex-col items-center p-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 transition-all duration-200 hover:scale-105 hover:shadow-lg"
          >
            <div className="w-16 h-16 flex items-center justify-center mb-2 bg-slate-950/60 rounded-lg">
              <PieceIcon
                type="oracle"
                owner={oraclePiece.owner}
                size={48}
              />
            </div>
            <div className="flex items-center gap-1.5 text-base font-bold text-amber-200 mb-1">
              <Skull className="w-4 h-4 text-amber-400" />
              Normal Capture
            </div>
            <p className="text-xs text-slate-400 leading-snug">
              Destroy the enemy unit. Your Oracle survives and occupies the tile.
            </p>
          </button>

          {/* Option 2: Divine Conversion */}
          <button
            onClick={() => onChoice('convert')}
            className="group flex flex-col items-center p-4 rounded-xl bg-purple-900/40 hover:bg-purple-900/70 border border-purple-500 hover:border-purple-300 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30"
          >
            <div className="w-16 h-16 flex items-center justify-center mb-2 bg-slate-950/60 rounded-lg relative">
              <PieceIcon
                type={targetPiece.type}
                owner={oraclePiece.owner} // Displayed in friendly colors
                orientation={targetPiece.orientation}
                isSiegeMode={targetPiece.isSiegeMode}
                size={48}
              />
              <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-purple-300 animate-spin" />
            </div>
            <div className="flex items-center gap-1.5 text-base font-bold text-purple-200 mb-1">
              <Sparkles className="w-4 h-4 text-purple-300" />
              Divine Conversion
            </div>
            <p className="text-xs text-slate-300 leading-snug">
              Sacrifice your Oracle. The enemy unit converts to your side on this exact tile!
            </p>
          </button>
        </div>

        <div className="mt-5 text-xs text-slate-400 italic">
          * Converted pieces retain their identity, orientation, and abilities on the battlefield.
        </div>
      </div>
    </div>
  );
};
