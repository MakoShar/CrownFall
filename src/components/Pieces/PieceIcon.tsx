import React from 'react';
import { PieceType, PlayerColor, Direction } from '../../engine/pieces';

interface PieceIconProps {
  type: PieceType;
  owner: PlayerColor;
  orientation?: Direction;
  isSiegeMode?: boolean;
  size?: number;
  className?: string;
}

export const PieceIcon: React.FC<PieceIconProps> = ({
  type,
  owner,
  orientation = 'N',
  isSiegeMode = false,
  size = 48,
  className = '',
}) => {
  const isGold = owner === 'gold';
  const primaryColor = isGold ? '#f59e0b' : '#cbd5e1';
  const secondaryColor = isGold ? '#fbbf24' : '#94a3b8';
  const darkAccent = isGold ? '#78350f' : '#1e293b';
  const glowFilter = isGold ? 'url(#gold-glow)' : 'url(#silver-glow)';
  const siegeGlow = 'url(#siege-molten-glow)';

  // Rider orientation rotation angle in degrees
  const orientationAngle: Record<Direction, number> = {
    N: 0,
    E: 90,
    S: 180,
    W: 270,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`drop-shadow-lg transition-transform duration-300 ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gold Kingdom Glow */}
        <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.8" />
        </filter>
        {/* Silver Kingdom Glow */}
        <filter id="silver-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.8" />
        </filter>
        {/* Siege Molten Glow */}
        <filter id="siege-molten-glow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#ef4444" floodOpacity="1" />
        </filter>
        {/* Metallic Linear Gradients */}
        <linearGradient id={`grad-${owner}-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={secondaryColor} />
          <stop offset="50%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={darkAccent} />
        </linearGradient>
      </defs>

      {/* Piece Specific Bespoke Graphics */}
      {type === 'regent' && (
        <g filter={glowFilter}>
          {/* Imperial Sovereign Crown */}
          <path
            d="M20 75 L80 75 L75 85 L25 85 Z"
            fill={`url(#grad-${owner}-${type})`}
            stroke={secondaryColor}
            strokeWidth="2"
          />
          <path
            d="M20 75 L15 38 L35 55 L50 25 L65 55 L85 38 L80 75 Z"
            fill={`url(#grad-${owner}-${type})`}
            stroke={secondaryColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Jewels and Crown Jewels */}
          <circle cx="50" cy="22" r="5" fill="#f43f5e" stroke="#fff" strokeWidth="1" />
          <circle cx="15" cy="36" r="3.5" fill="#38bdf8" stroke="#fff" strokeWidth="1" />
          <circle cx="85" cy="36" r="3.5" fill="#38bdf8" stroke="#fff" strokeWidth="1" />
          <circle cx="50" cy="62" r="6" fill="#10b981" stroke={secondaryColor} strokeWidth="2" />
          <path d="M47 59 L53 65 M53 59 L47 65" stroke="#fff" strokeWidth="1.5" />
        </g>
      )}

      {type === 'champion' && (
        <g filter={glowFilter}>
          {/* Twin Crossed Broadswords with Heavy Wings */}
          {/* Sword 1 */}
          <path
            d="M25 75 L75 25 M75 25 L80 20 M75 25 L70 30"
            stroke={secondaryColor}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path d="M22 78 L28 72 M20 80 L30 70" stroke={darkAccent} strokeWidth="3" />
          {/* Sword 2 */}
          <path
            d="M75 75 L25 25 M25 25 L20 20 M25 25 L30 30"
            stroke={secondaryColor}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path d="M78 78 L72 72 M80 80 L70 70" stroke={darkAccent} strokeWidth="3" />
          {/* Central Warrior Crest & Sigil */}
          <polygon
            points="50,28 66,48 50,68 34,48"
            fill={`url(#grad-${owner}-${type})`}
            stroke="#fff"
            strokeWidth="2"
          />
          <circle cx="50" cy="48" r="4" fill="#ef4444" />
        </g>
      )}

      {type === 'rider' && (
        <g filter={glowFilter}>
          {/* Directional Indicator Compass Ring */}
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke={secondaryColor}
            strokeWidth="2"
            strokeDasharray="4 3"
            opacity="0.8"
          />
          {/* Direction Arrow Head showing Rider's exact Facing */}
          <g transform={`rotate(${orientationAngle[orientation]}, 50, 50)`}>
            <polygon
              points="50,6 42,22 58,22"
              fill={isGold ? '#fbbf24' : '#38bdf8'}
              stroke="#fff"
              strokeWidth="1.5"
            />
            <line x1="50" y1="22" x2="50" y2="35" stroke={secondaryColor} strokeWidth="3" strokeLinecap="round" />
          </g>
          {/* Armored Warbeast Head & Mystical Sphere */}
          <path
            d="M32 72 C32 45, 45 32, 60 32 C68 32, 74 38, 72 46 C68 50, 60 52, 62 60 C64 68, 55 75, 40 75 Z"
            fill={`url(#grad-${owner}-${type})`}
            stroke={secondaryColor}
            strokeWidth="2.5"
          />
          {/* Warbeast Eye & Horn/Armor */}
          <circle cx="56" cy="42" r="3" fill="#ef4444" />
          <path d="M60 32 L70 20 L66 34" fill={secondaryColor} />
          {/* Mystic Floating Sphere */}
          <circle
            cx="32"
            cy="42"
            r="9"
            fill="#38bdf8"
            stroke="#fff"
            strokeWidth="2"
            className="animate-pulse"
          />
        </g>
      )}

      {type === 'oracle' && (
        <g filter={glowFilter}>
          {/* Divine Halo Rays */}
          <circle cx="50" cy="50" r="38" stroke={secondaryColor} strokeWidth="1.5" opacity="0.6" />
          <line x1="50" y1="8" x2="50" y2="18" stroke={secondaryColor} strokeWidth="2.5" />
          <line x1="50" y1="82" x2="50" y2="92" stroke={secondaryColor} strokeWidth="2.5" />
          <line x1="8" y1="50" x2="18" y2="50" stroke={secondaryColor} strokeWidth="2.5" />
          <line x1="82" y1="50" x2="92" y2="50" stroke={secondaryColor} strokeWidth="2.5" />
          {/* Diagonal Divine Runes */}
          <line x1="20" y1="20" x2="28" y2="28" stroke="#a855f7" strokeWidth="2" />
          <line x1="80" y1="20" x2="72" y2="28" stroke="#a855f7" strokeWidth="2" />
          <line x1="20" y1="80" x2="28" y2="72" stroke="#a855f7" strokeWidth="2" />
          <line x1="80" y1="80" x2="72" y2="72" stroke="#a855f7" strokeWidth="2" />
          {/* Divine Mystic Eye */}
          <path
            d="M20 50 Q50 20 80 50 Q50 80 20 50 Z"
            fill={`url(#grad-${owner}-${type})`}
            stroke={secondaryColor}
            strokeWidth="2.5"
          />
          <circle cx="50" cy="50" r="14" fill="#a855f7" stroke="#fff" strokeWidth="2" />
          <circle cx="50" cy="50" r="6" fill="#fff" />
        </g>
      )}

      {type === 'bastion' && !isSiegeMode && (
        <g filter={glowFilter}>
          {/* Fortress Keep and Spiked Battlements */}
          <path
            d="M25 80 L75 80 L72 45 L65 45 L65 30 L57 30 L57 38 L50 38 L50 30 L43 30 L43 38 L35 38 L35 30 L28 30 L28 45 L25 80 Z"
            fill={`url(#grad-${owner}-${type})`}
            stroke={secondaryColor}
            strokeWidth="2.5"
          />
          {/* Portcullis Spikes */}
          <rect x="42" y="60" width="16" height="20" rx="3" fill={darkAccent} stroke={secondaryColor} strokeWidth="1.5" />
          <line x1="46" y1="60" x2="46" y2="80" stroke="#fff" strokeWidth="1" />
          <line x1="50" y1="60" x2="50" y2="80" stroke="#fff" strokeWidth="1" />
          <line x1="54" y1="60" x2="54" y2="80" stroke="#fff" strokeWidth="1" />
        </g>
      )}

      {type === 'bastion' && isSiegeMode && (
        <g filter={siegeGlow}>
          {/* SIEGE MODE: Reinforced Juggernaut Citadel with Molten Spikes */}
          <path
            d="M18 85 L82 85 L76 40 L88 28 L72 32 L66 22 L58 32 L50 20 L42 32 L34 22 L28 32 L12 28 L24 40 L18 85 Z"
            fill="#b91c1c"
            stroke="#ef4444"
            strokeWidth="3"
            className="animate-pulse"
          />
          {/* Molten Magma Cracks */}
          <path d="M30 65 L45 55 L55 68 L70 58" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
          <path d="M40 78 L52 70 L62 80" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
          {/* Heavy Ramming Spikes */}
          <polygon points="50,45 60,60 40,60" fill="#f59e0b" stroke="#fff" strokeWidth="1.5" />
          {/* Siege Banner Emblem */}
          <circle cx="50" cy="72" r="5" fill="#fef08a" stroke="#b91c1c" strokeWidth="1.5" />
        </g>
      )}

      {type === 'soldier' && (
        <g filter={glowFilter}>
          {/* Infantry Kite Shield and Spear */}
          {/* Upright Spear */}
          <line x1="50" y1="12" x2="50" y2="86" stroke={secondaryColor} strokeWidth="3.5" strokeLinecap="round" />
          <polygon points="50,8 44,22 56,22" fill="#e2e8f0" stroke={secondaryColor} strokeWidth="1" />
          {/* Kite Shield */}
          <path
            d="M32 35 C32 35, 50 30, 68 35 C68 62, 50 82, 50 82 C50 82, 32 62, 32 35 Z"
            fill={`url(#grad-${owner}-${type})`}
            stroke={secondaryColor}
            strokeWidth="2.5"
          />
          {/* Shield Cross Emblem */}
          <path d="M50 42 L50 68 M38 52 L62 52" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
        </g>
      )}
    </svg>
  );
};
