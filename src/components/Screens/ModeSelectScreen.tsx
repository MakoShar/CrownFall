import React from 'react';
import { Users, Bot, Eye, ChevronLeft, ChevronRight, Swords } from 'lucide-react';
import type { GameMode } from '../../App';

interface ModeSelectScreenProps {
  onSelectMode: (mode: GameMode) => void;
  onBack: () => void;
}

const MODES: { id: GameMode; icon: React.ReactNode; title: string; subtitle: string; desc: string; color: string; border: string; shadow: string }[] = [
  {
    id: 'human_vs_human',
    icon: <Users className="w-10 h-10" />,
    title: 'BATTLE',
    subtitle: 'Human vs Human',
    desc: 'Challenge a friend on the same device. Two kingdoms, one board, no mercy.',
    color: 'from-sky-500/20 to-blue-700/20',
    border: 'border-sky-500/40 hover:border-sky-400',
    shadow: 'hover:shadow-[0_0_30px_rgba(14,165,233,0.3)]',
  },
  {
    id: 'human_vs_ai',
    icon: <Bot className="w-10 h-10" />,
    title: 'CAMPAIGN',
    subtitle: 'Human vs AI',
    desc: 'Prove your strategic mastery against the AI. Choose your difficulty and forge your legend.',
    color: 'from-amber-500/20 to-orange-700/20',
    border: 'border-kingdom-gold/40 hover:border-kingdom-gold',
    shadow: 'hover:shadow-regal-gold',
  },
  {
    id: 'ai_vs_ai',
    icon: <Eye className="w-10 h-10" />,
    title: 'SPECTATE',
    subtitle: 'AI vs AI',
    desc: 'Watch two AI kingdoms clash. Observe strategy, learn patterns, and discover secrets.',
    color: 'from-purple-500/20 to-violet-700/20',
    border: 'border-purple-500/40 hover:border-purple-400',
    shadow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]',
  },
];

export const ModeSelectScreen: React.FC<ModeSelectScreenProps> = ({ onSelectMode, onBack }) => {
  return (
    <div className="min-h-screen bg-kingdom-obsidian flex flex-col items-center justify-center p-4 sm:p-6"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.08) 0%, #090d16 60%)' }}
    >
      {/* Back button */}
      <div className="w-full max-w-3xl mb-4 sm:mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-xs sm:text-sm font-semibold transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Main Menu
        </button>
      </div>

      {/* Header */}
      <div className="text-center mb-6 sm:mb-10">
        <div className="flex justify-center mb-2 sm:mb-3">
          <Swords className="w-8 h-8 sm:w-10 sm:h-10 text-kingdom-gold" />
        </div>
        <h2 className="font-fantasy text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-kingdom-goldLight to-kingdom-gold tracking-widest">
          CHOOSE YOUR WAR
        </h2>
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 mt-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] sm:text-xs font-semibold tracking-wider uppercase">
          Classic Chess Edition
        </div>
        <p className="text-slate-500 mt-2 text-xs sm:text-sm tracking-widest uppercase">Select a game mode to begin</p>
      </div>

      {/* Mode cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 w-full max-w-3xl">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onSelectMode(mode.id)}
            className={`group relative flex flex-col items-center text-center p-5 sm:p-8 rounded-2xl bg-gradient-to-br ${mode.color} border ${mode.border} ${mode.shadow} transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer`}
          >
            {/* Icon */}
            <div className="text-white mb-5 opacity-80 group-hover:opacity-100 transition-opacity">
              {mode.icon}
            </div>
            {/* Title */}
            <h3 className="font-fantasy text-2xl font-bold text-white tracking-widest mb-1">
              {mode.title}
            </h3>
            <p className="text-xs text-slate-400 tracking-wider uppercase mb-4">{mode.subtitle}</p>
            {/* Divider */}
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-slate-500 to-transparent mb-4" />
            {/* Description */}
            <p className="text-sm text-slate-300 leading-relaxed">{mode.desc}</p>
            {/* Arrow */}
            <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-slate-400 group-hover:text-white transition-colors">
              Select <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>
        ))}
      </div>

      {/* Piece row decoration */}
      <div className="flex gap-4 mt-14 opacity-25">
        {['regent', 'champion', 'rider', 'oracle', 'bastion', 'soldier'].map((p) => (
          <img key={p} src={`/pieces/${p}.png`} alt={p} className="w-10 h-10 object-cover object-top rounded" />
        ))}
      </div>
    </div>
  );
};

