import React from 'react';

interface CrossIconProps {
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
  color?: string;
  strokeWidth?: number;
}

export const CrossIcon: React.FC<CrossIconProps> = ({
  size = '100%',
  className = '',
  style = {},
  color = 'currentColor',
  strokeWidth = 4,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      shapeRendering="geometricPrecision"
      xmlns="http://www.w3.org/2000/svg"
      className={`cross-icon-svg ${className}`}
      style={{
        display: 'block',
        margin: 'auto',
        flexShrink: 0,
        ...style,
      }}
    >
      <line x1="3.5" y1="3.5" x2="20.5" y2="20.5" />
      <line x1="20.5" y1="3.5" x2="3.5" y2="20.5" />
    </svg>
  );
};
