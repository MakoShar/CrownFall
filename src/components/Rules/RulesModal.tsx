import React from 'react';
import { PieceIcon } from '../Pieces/PieceIcon';
import { X, Shield, Swords, Compass, Sparkles, Crown, Users } from 'lucide-react';

interface RulesModalProps {
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-hidden">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-kingdom-gold/20 border border-kingdom-gold text-kingdom-gold">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-fantasy font-bold text-amber-100">
                Codex of Crownfall — Comprehensive Rules & Disciplines
              </h2>
              <p className="text-xs text-slate-400">
                Easy to understand. Difficult to master. Never surrender until the Regent falls.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs leading-relaxed">
          {/* Section: Philosophy */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <h3 className="text-sm font-fantasy font-bold text-kingdom-gold uppercase tracking-wider">
              1. Fundamental Principles
            </h3>
            <p className="text-slate-300">
              CROWNFALL is an original turn-based strategy game. Unlike chess, there is <strong>no mandatory check or checkmate</strong>. A player is not forced to flee when under attack. The kingdom falls only when its Regent is captured, subject to the sacred <strong>Mutual Regent Capture</strong> rule.
            </p>
          </div>

          {/* Section: The Six Pieces */}
          <div className="space-y-4">
            <h3 className="text-sm font-fantasy font-bold text-kingdom-gold uppercase tracking-wider">
              2. Unit Roster & Special Disciplines
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Regent */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-amber-500/40">
                    <PieceIcon type="regent" owner="gold" size={38} />
                  </div>
                  <div>
                    <div className="font-bold text-amber-200 text-sm">Regent (Commander)</div>
                    <div className="text-[11px] text-slate-400">The crown of the army</div>
                  </div>
                </div>
                <p className="text-slate-300">
                  • <strong>Movement:</strong> 1 square in any of the 8 directions.<br />
                  • <strong>Capture:</strong> Captures normally. Cannot be converted by Oracle.<br />
                  • <strong>Victory:</strong> Its capture ends the match unless counter-captured during Mutual Regent Response.
                </p>
              </div>

              {/* Champion */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-amber-500/40">
                    <PieceIcon type="champion" owner="gold" size={38} />
                  </div>
                  <div>
                    <div className="font-bold text-amber-200 text-sm">Champion (Supreme Warrior)</div>
                    <div className="text-[11px] text-slate-400">Supreme battlefield dominance</div>
                  </div>
                </div>
                <p className="text-slate-300">
                  • <strong>Movement:</strong> Any number of squares horizontally, vertically, and diagonally (like a Queen).<br />
                  • <strong>Divine Immunity:</strong> Cannot be converted by an Oracle. If an Oracle captures a Champion, Champion dies and Oracle survives.
                </p>
              </div>

              {/* Rider */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-amber-500/40">
                    <PieceIcon type="rider" owner="gold" orientation="N" size={38} />
                  </div>
                  <div>
                    <div className="font-bold text-amber-200 text-sm">Rider (Directional Warrior)</div>
                    <div className="text-[11px] text-slate-400">Facing axis dictates movement</div>
                  </div>
                </div>
                <p className="text-slate-300">
                  • <strong>Movement:</strong> Facing N/S moves vertically any distance. Facing E/W moves horizontally any distance.<br />
                  • <strong>Rotation:</strong> Changing orientation consumes the entire turn.<br />
                  • <strong>Preservation:</strong> Retains facing direction if converted.
                </p>
              </div>

              {/* Oracle */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-amber-500/40">
                    <PieceIcon type="oracle" owner="gold" size={38} />
                  </div>
                  <div>
                    <div className="font-bold text-amber-200 text-sm">Oracle (Divine Messenger)</div>
                    <div className="text-[11px] text-slate-400">Allegiance transfer & sacrifice</div>
                  </div>
                </div>
                <p className="text-slate-300">
                  • <strong>Movement:</strong> Diagonally any distance.<br />
                  • <strong>Divine Conversion:</strong> Oracle sacrifices itself to convert the captured enemy unit on its exact tile!<br />
                  • <strong>Oracle vs Oracle:</strong> Mutual destruction — both perish!
                </p>
              </div>

              {/* Bastion */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-amber-500/40">
                    <PieceIcon type="bastion" owner="gold" isSiegeMode size={38} />
                  </div>
                  <div>
                    <div className="font-bold text-amber-200 text-sm">Bastion (Siege Guardian)</div>
                    <div className="text-[11px] text-slate-400">Seismic BASH & Siege Mode</div>
                  </div>
                </div>
                <p className="text-slate-300">
                  • <strong>Movement:</strong> 1 square in 8 directions.<br />
                  • <strong>BASH:</strong> Pushes adjacent enemy into random empty surrounding square. If surrounded, enemy is crushed!<br />
                  • <strong>Siege Mode:</strong> Permanently unlocked at baseline. Gains Enhanced 2-Target BASH and Soldier Leap!
                </p>
              </div>

              {/* Soldier */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-amber-500/40">
                    <PieceIcon type="soldier" owner="gold" size={38} />
                  </div>
                  <div>
                    <div className="font-bold text-amber-200 text-sm">Soldier (Infantry)</div>
                    <div className="text-[11px] text-slate-400">8-directional infantry & promotion</div>
                  </div>
                </div>
                <p className="text-slate-300">
                  • <strong>Movement:</strong> 1 square in all 8 directions.<br />
                  • <strong>Friendly Elimination:</strong> Can sacrifice itself to clear paths.<br />
                  • <strong>Promotion:</strong> Promotes at baseline to Champion, Rider, or Bastion.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Mutual Regent Capture */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-red-500/30 space-y-2">
            <h3 className="text-sm font-fantasy font-bold text-red-400 uppercase tracking-wider">
              3. Mutual Regent Capture — The Sacred Comeback Law
            </h3>
            <p className="text-slate-300">
              When Player A captures Player B's Regent:
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-slate-300">
              <li>If Player A's own Regent is completely safe, Player A wins immediately.</li>
              <li>If Player A's Regent is simultaneously threatened, Player B receives <strong>exactly one final response turn</strong>.</li>
              <li>During this final response, only legal moves that capture Player A's Regent are allowed.</li>
              <li>If Player B counter-captures Player A's Regent, the match ends in an honorable <strong>DRAW</strong>.</li>
              <li>If no legal counter-capture is available, Player A wins immediately.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

