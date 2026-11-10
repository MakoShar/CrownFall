import React from 'react';
import { ChevronLeft, ChevronRight, Zap, Shield, Brain } from 'lucide-react';
import { AIDifficulty, DIFFICULTY_PRESETS } from '../../ai/difficulty';
import type { GameMode } from '../../App';

interface DifficultySelectScreenProps {
  mode: GameMode;
  onSelectDifficulty: (difficulty: AIDifficulty) => void;
  onBack: () => void;
}

const DIFFICULTY_CONFIG: {
  id: AIDifficulty;
  label: string;
  tagline: string;
  icon: React.ReactNode;
  color: string;
  border: string;
  glow: string;
  textColor: string;
  pieceName: string;
}[] = [
  {
    id: 'beginner',
    label: 'BEGINNER',
    tagline: 'The Apprentice',
    icon: <Shield className="w-9 h-9" />,
    color: 'from-emerald-500/15 to-green-700/15',
    border: 'border-emerald-500/40 hover:border-emerald-400',
    glow: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]',
    textColor: 'text-emerald-400',
    pieceName: 'soldier',
  },
  {
    id: 'intermediate',
    label: 'INTERMEDIATE',
    tagline: 'The Strategist',
    icon: <Brain className="w-9 h-9" />,
    color: 'from-amber-500/15 to-orange-700/15',
    border: 'border-kingdom-gold/40 hover:border-kingdom-gold',
    glow: 'hover:shadow-regal-gold',
    textColor: 'text-kingdom-gold',
    pieceName: 'champion',
  },
  {
    id: 'expert',
    label: 'EXPERT',
    tagline: 'The Grand Regent',
    icon: <Zap className="w-9 h-9" />,
    color: 'from-red-700/15 to-rose-900/15',
    border: 'border-red-500/40 hover:border-red-400',
    glow: 'hover:shadow-[0_0_30px_rgba(220,38,38,0.4)]',
    textColor: 'text-red-400',
    pieceName: 'regent',
  },
];

export const DifficultySelectScreen: React.FC<DifficultySelectScreenProps> = ({
  mode,
  onSelectDifficulty,
  onBack,
}) => {
  const isSpectate = mode === 'ai_vs_ai';

  return (
    <div
      className="min-h-screen bg-kingdom-obsidian flex flex-col items-center justify-center p-6"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(220,38,38,0.07) 0%, #090d16 60%)' }}
    >
      {/* Back */}
      <div className="w-full max-w-3xl mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="font-fantasy text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-kingdom-silverLight to-kingdom-silver tracking-widest">
          {isSpectate ? 'AI BATTLE TIER' : 'CHOOSE YOUR FOE'}
        </h2>
        <p className="text-slate-500 mt-2 text-sm tracking-widest uppercase">
          {isSpectate ? 'Select the AI difficulty tier for spectator mode' : 'How fierce is the enemy commander?'}
        </p>
      </div>

      {/* Difficulty cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
        {DIFFICULTY_CONFIG.map((diff) => {
          const preset = DIFFICULTY_PRESETS[diff.id];
          return (
            <button
              key={diff.id}
              onClick={() => onSelectDifficulty(diff.id)}
              className={`group relative flex flex-col items-center text-center p-8 rounded-2xl bg-gradient-to-br ${diff.color} border ${diff.border} ${diff.glow} transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer`}
            >
              {/* Piece image */}
              <div className="w-20 h-20 rounded-xl overflow-hidden mb-4 border border-white/10 bg-black/20">
                <img
                  src={`/pieces/${diff.pieceName}.png`}
                  alt={diff.label}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              {/* Label */}
              <h3 className={`font-fantasy text-2xl font-bold tracking-widest mb-1 ${diff.textColor}`}>
                {diff.label}
              </h3>
              <p className="text-xs text-slate-400 tracking-wider uppercase mb-4">{diff.tagline}</p>
              <div className="w-12 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent mb-4" />
              {/* Stats */}
              <div className="w-full space-y-2 text-left text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Algorithm</span>
                  <span className="font-semibold capitalize text-slate-200">
                    {preset.useAlphaBeta ? 'Alpha-Beta' : 'Minimax'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Search Depth</span>
                  <span className="font-semibold text-slate-200">{preset.depth} plies</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Move Ordering</span>
                  <span className="font-semibold text-slate-200">{preset.useMoveOrdering ? 'Yes' : 'No'}</span>
                </div>
              </div>
              {/* CTA */}
              <div className={`mt-6 flex items-center gap-1 text-xs font-semibold transition-colors text-slate-400 group-hover:${diff.textColor}`}>
                Start Battle <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Kingdom vs Kingdom tagline */}
      <p className="mt-10 text-slate-600 text-xs italic text-center">
        "Every great victory begins with the courage to begin."
      </p>
    </div>
  );
};
