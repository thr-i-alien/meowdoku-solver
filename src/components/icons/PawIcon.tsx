import React from 'react';

interface PawIconProps {
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
  color?: string;
}

export const PawIcon: React.FC<PawIconProps> = ({
  size = 20,
  className = '',
  style = {},
  color = 'currentColor',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      className={`paw-icon-svg ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      {/* 4 個小肉球腳趾 */}
      <circle cx="5.5" cy="8.5" r="2.2" />
      <circle cx="9.8" cy="5.2" r="2.3" />
      <circle cx="14.2" cy="5.2" r="2.3" />
      <circle cx="18.5" cy="8.5" r="2.2" />
      {/* 主肉墊 (心型掌印) */}
      <path d="M12 11.5 C8.5 11.5 6 14.5 7.2 18 C8.2 20.8 11.2 21.5 12 21.5 C12.8 21.5 15.8 20.8 16.8 18 C18 14.5 15.5 11.5 12 11.5 Z" />
    </svg>
  );
};
