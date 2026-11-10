import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameStatus } from '../../engine/endgameHandler';
import { PlayerColor } from '../../engine/pieces';
import { Crown, RotateCcw, Swords, Trophy, Activity, Eye } from 'lucide-react';

interface MatchResultModalProps {
  status: GameStatus;
  winner: PlayerColor | 'draw' | null;
  reason?: string;
  turnNumber: number;
  totalActions: number;
  onPlayAgain: () => void;
  onInspectBoard: () => void;
  onOpenAIAnalysis: () => void;
}

export const MatchResultModal: React.FC<MatchResultModalProps> = ({
  status,
  winner,
  reason,
  turnNumber,
  totalActions,
  onPlayAgain,
  onInspectBoard,
  onOpenAIAnalysis,
}) => {
  const isDraw = winner === 'draw';
  const isGoldVictory = winner === 'gold';
  const isSilverVictory = winner === 'silver';

  useEffect(() => {
    if (winner && winner !== 'draw') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: isGoldVictory ? ['#f59e0b', '#fbbf24', '#ffffff'] : ['#38bdf8', '#cbd5e1', '#ffffff'],
      });
    }
  }, [winner, isGoldVictory]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative max-w-md w-full bg-gradient-to-b from-slate-900 via-kingdom-obsidian to-black border-2 border-kingdom-gold rounded-2xl p-6 text-center shadow-regal-gold">
        {/* Crown / Icon Banner */}
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-950 border-2 border-kingdom-gold/80 flex items-center justify-center shadow-lg shadow-kingdom-gold/30">
          {isDraw ? (
            <Swords className="w-10 h-10 text-purple-400" />
          ) : (
            <Trophy className="w-10 h-10 text-kingdom-gold animate-bounce" />
          )}
        </div>

        <div className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-1">
          {isDraw ? 'Honor Preserved' : 'Battle Decided'}
        </div>

        <h2 className="text-3xl font-fantasy font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-kingdom-gold to-yellow-500">
          {isDraw
            ? 'STALEMATE OF HEROES'
            : isGoldVictory
            ? 'GOLD REALM VICTORIOUS'
            : 'SILVER REALM TRIUMPHANT'}
        </h2>

        <p className="text-xs text-slate-300 mb-6 px-3 leading-relaxed">
          {reason || 'The Regent has fallen. The command structure collapses.'}
        </p>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 mb-6 font-mono text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-slate-500 mb-0.5">Turns Elapsed</div>
            <div className="text-lg font-bold text-slate-200">{turnNumber}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-slate-500 mb-0.5">Total Actions</div>
            <div className="text-lg font-bold text-amber-300">{totalActions}</div>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={onPlayAgain}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-kingdom-gold hover:bg-amber-400 text-black font-bold text-sm transition-all shadow-lg shadow-kingdom-gold/30 active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            Engage In New Campaign
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onInspectBoard}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              <Eye className="w-4 h-4" />
              Inspect Board
            </button>
            <button
              onClick={onOpenAIAnalysis}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold transition-colors border border-amber-500/30"
            >
              <Activity className="w-4 h-4" />
              AI Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
