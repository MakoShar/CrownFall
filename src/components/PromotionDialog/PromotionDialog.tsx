import React from 'react';
import { PieceType, PlayerColor } from '../../engine/pieces';
import { PieceIcon } from '../Pieces/PieceIcon';
import { VALID_PROMOTION_CHOICES } from '../../engine/promotionHandler';
import { Shield, Sparkles, Swords, Zap } from 'lucide-react';

interface PromotionDialogProps {
  owner: PlayerColor;
  onSelect: (choice: PieceType) => void;
  onCancel?: () => void;
}

export const PromotionDialog: React.FC<PromotionDialogProps> = ({
  owner,
  onSelect,
}) => {
  const descriptions: Record<string, { title: string; subtitle: string; desc: string; icon: any }> = {
    champion: {
      title: 'Champion',
      subtitle: 'QUEEN',
      desc: 'Supreme range across all ranks, files, and diagonals.',
      icon: Swords,
    },
    bastion: {
      title: 'Bastion',
      subtitle: 'ROOK',
      desc: 'Controls files and ranks with orthogonal linear power.',
      icon: Shield,
    },
    oracle: {
      title: 'Oracle',
      subtitle: 'BISHOP',
      desc: 'Dominates color complexes with diagonal stride.',
      icon: Sparkles,
    },
    rider: {
      title: 'Rider',
      subtitle: 'KNIGHT',
      desc: 'Leaps over units with agile L-shape jumps.',
      icon: Zap,
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative max-w-xl w-full bg-gradient-to-b from-slate-900 to-kingdom-obsidian border-2 border-kingdom-gold rounded-2xl p-6 shadow-regal-gold text-center">
        <div className="inline-block px-4 py-1 rounded-full bg-kingdom-gold/20 border border-kingdom-gold text-kingdom-goldLight text-xs tracking-widest uppercase font-semibold mb-2">
          Pawn Promotion
        </div>
        <h2 className="text-2xl font-fantasy text-amber-100 font-bold mb-1">
          Promote Your Soldier
        </h2>
        <p className="text-sm text-slate-300 mb-6">
          Your soldier has reached the 8th rank! Choose which chess piece to promote into:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {VALID_PROMOTION_CHOICES.map((type) => {
            const info = descriptions[type];
            if (!info) return null;
            const Icon = info.icon;
            return (
              <button
                key={type}
                onClick={() => onSelect(type)}
                className="group relative flex flex-col items-center p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 hover:border-kingdom-gold transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-kingdom-gold/20 cursor-pointer"
              >
                <div className="w-14 h-14 flex items-center justify-center mb-2 bg-slate-900/60 rounded-lg group-hover:scale-110 transition-transform">
                  <PieceIcon
                    type={type}
                    owner={owner}
                    size={46}
                  />
                </div>
                <div className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase">
                  {info.subtitle}
                </div>
                <div className="flex items-center gap-1 text-sm font-bold text-amber-100 mb-1">
                  <Icon className="w-3.5 h-3.5 text-kingdom-gold" />
                  {info.title}
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {info.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
