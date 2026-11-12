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
  const isWhiteSide = owner === 'white' || owner === 'gold';
  const imgSrc = PIECE_IMAGE[type];

  // Side colors: White side and Blue side
  const whiteFilter = 'brightness(1.15) contrast(1.1) drop-shadow(0 2px 4px rgba(0,0,0,0.6))';
  const blueFilter = 'hue-rotate(185deg) saturate(2.8) brightness(1.05) drop-shadow(0 2px 4px rgba(0,0,0,0.7))';
  const filter = isWhiteSide ? whiteFilter : blueFilter;

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
      {/* Piece image with side tint */}
      <img
        src={imgSrc}
        alt={type}
        draggable={false}
        style={{
          width: '95%',
          height: '95%',
          objectFit: 'cover',
          objectPosition: 'top',
          filter,
          borderRadius: '12%',
          transition: 'filter 0.3s ease',
          display: 'block',
        }}
      />

      {/* Side indicator border glow overlay */}
      <div
        style={{
          position: 'absolute',
          inset: '2%',
          borderRadius: '14%',
          border: `2px solid ${isWhiteSide ? 'rgba(255,255,255,0.85)' : 'rgba(56,189,248,0.9)'}`,
          boxShadow: isWhiteSide
            ? '0 0 8px rgba(255,255,255,0.6), inset 0 0 4px rgba(255,255,255,0.2)'
            : '0 0 8px rgba(14,165,233,0.7), inset 0 0 4px rgba(56,189,248,0.3)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
