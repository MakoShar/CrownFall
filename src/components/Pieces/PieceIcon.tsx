import React from 'react';
import { PieceType, PlayerColor, Direction } from '../../engine/pieces';

interface PieceIconProps {
  type: PieceType;
  owner: PlayerColor;
  orientation?: Direction;
  isSiegeMode?: boolean;
  size?: number | string;
  className?: string;
}

// Map type to image file
const PIECE_IMAGE: Record<PieceType, string> = {
  regent: '/pieces/regent.png',
  champion: '/pieces/champion.png',
  rider: '/pieces/rider.png',
  oracle: '/pieces/oracle.png',
  bastion: '/pieces/bastion.png',
  soldier: '/pieces/soldier.png',
};

// Rider orientation label for compass indicator (bi-directional arrows along movement axis)
const ORIENTATION_ARROWS: Record<Direction, string> = {
  N: '↕',
  S: '↕',
  E: '↔',
  W: '↔',
};

export const PieceIcon: React.FC<PieceIconProps> = ({
  type,
  owner,
  orientation = 'N',
  isSiegeMode = false,
  size = '100%',
  className = '',
}) => {
  const isGold = owner === 'gold';
  const imgSrc = PIECE_IMAGE[type];

  // Kingdom color tint via CSS filter + border
  const goldFilter = 'sepia(0.6) saturate(2.5) hue-rotate(5deg) brightness(1.1)';
  const silverFilter = 'sepia(0.2) saturate(0.5) brightness(1.05) contrast(1.1)';
  const filter = isGold ? goldFilter : silverFilter;

  // Siege mode extra treatment
  const siegeFilter = 'sepia(1) saturate(3) hue-rotate(330deg) brightness(1.2)';

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div style={containerStyle} className={`group ${className}`}>
      {/* Piece image with kingdom tint */}
      <img
        src={imgSrc}
        alt={type}
        draggable={false}
        style={{
          width: '95%',
          height: '95%',
          objectFit: 'cover',
          objectPosition: 'top',
          filter: isSiegeMode ? siegeFilter : filter,
          borderRadius: '12%',
          transition: 'filter 0.3s ease',
          display: 'block',
        }}
      />

      {/* Kingdom indicator border glow overlay */}
      <div
        style={{
          position: 'absolute',
          inset: '2%',
          borderRadius: '14%',
          border: `2px solid ${isGold ? 'rgba(245,158,11,0.5)' : 'rgba(148,163,184,0.4)'}`,
          boxShadow: isGold
            ? '0 0 8px rgba(245,158,11,0.4), inset 0 0 4px rgba(245,158,11,0.1)'
            : '0 0 8px rgba(148,163,184,0.3), inset 0 0 4px rgba(148,163,184,0.1)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
