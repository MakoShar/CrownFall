import React from 'react';
import { PieceType, PlayerColor } from '../../engine/pieces';
import { PieceIcon } from '../Pieces/PieceIcon';
import { VALID_PROMOTION_CHOICES } from '../../engine/promotionHandler';
import { Shield, Sparkles, Swords } from 'lucide-react';

interface PromotionDialogProps {
  owner: PlayerColor;
  onSelect: (choice: PieceType) => void;
  onCancel?: () => void;
}

export const PromotionDialog: React.FC<PromotionDialogProps> = ({
  owner,
  onSelect,
}) => {
  const descriptions: Record<string, { title: string; desc: string; icon: any }> = {
    champion: {
      title: 'Champion',
      desc: 'Supreme battlefield dominance. Moves and strikes across all files and diagonals.',
      icon: Swords,
    },
    rider: {
      title: 'Rider',
      desc: 'Rapid directional charges. Commands long-range linear files with facing axis.',
      icon: Sparkles,
    },
    bastion: {
      title: 'Siege Bastion',
      desc: 'Immediate Siege Mode! Gains Enhanced 2-Target BASH and Soldier Leap abilities.',
      icon: Shield,
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative max-w-lg w-full bg-gradient-to-b from-slate-900 to-kingdom-obsidian border-2 border-kingdom-gold rounded-2xl p-6 shadow-regal-gold text-center">
        <div className="inline-block px-4 py-1 rounded-full bg-kingdom-gold/20 border border-kingdom-gold text-kingdom-goldLight text-xs tracking-widest uppercase font-semibold mb-2">
          Infantry Ascendance
        </div>
        <h2 className="text-2xl font-fantasy text-amber-100 font-bold mb-1">
          Soldier Promotion — The Last Hope
        </h2>
        <p className="text-sm text-slate-300 mb-6">
          Your infantry has breached the opponent baseline. Bestow high rank upon your warrior:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {VALID_PROMOTION_CHOICES.map((type) => {
            const info = descriptions[type];
            const Icon = info.icon;
            return (
              <button
                key={type}
                onClick={() => onSelect(type)}
                className="group relative flex flex-col items-center p-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 hover:border-kingdom-gold transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-kingdom-gold/20"
              >
                <div className="w-16 h-16 flex items-center justify-center mb-2 bg-slate-900/60 rounded-lg group-hover:scale-110 transition-transform">
                  <PieceIcon
                    type={type}
                    owner={owner}
                    isSiegeMode={type === 'bastion'}
                    size={52}
                  />
                </div>
                <div className="flex items-center gap-1.5 text-base font-bold text-amber-200 mb-1">
                  <Icon className="w-4 h-4 text-kingdom-gold" />
                  {info.title}
                </div>
                <p className="text-xs text-slate-400 leading-snug">
                  {info.desc}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-5 text-xs text-slate-500 italic">
          * Oracle and Regent cannot be chosen for promotion.
        </div>
      </div>
    </div>
  );
};
