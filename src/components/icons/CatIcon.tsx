import React from 'react';

interface CatIconProps {
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export const CatIcon: React.FC<CatIconProps> = ({
  size = 24,
  className = '',
  style = {},
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`cat-icon-svg ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      {/* 1. 貓頭黑曜主體與外邊框 (深黑毛色 + 乾淨俐落深色描邊) */}
      <path
        d="M 20 10
           C 14 26, 12 46, 11 60
           C 10 76, 18 92, 50 94
           C 82 92, 90 76, 89 60
           C 88 46, 86 26, 80 10
           C 74 15, 67 24, 62 29
           C 57 26.5, 43 26.5, 38 29
           C 33 24, 26 15, 20 10 Z"
        fill="#211F29"
        stroke="#121016"
        strokeWidth="3.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* 2. 簡約內耳粉色塊 */}
      {/* 左內耳 */}
      <path
        d="M 22 17
           C 19.5 28, 18.5 38, 22 45
           C 26.5 42, 33 36, 35 30
           C 31 23, 25 18, 22 17 Z"
        fill="#FF8FA3"
      />
      {/* 右內耳 */}
      <path
        d="M 78 17
           C 80.5 28, 81.5 38, 78 45
           C 73.5 42, 67 36, 65 30
           C 69 23, 75 18, 78 17 Z"
        fill="#FF8FA3"
      />

      {/* 3. 白色面斑與圓潤包子臉頰 (賓士貓經典特徵) */}
      <path
        d="M 50 38
           C 44.5 38, 43.5 46, 42.5 56
           C 36.5 58, 22.5 62, 17 71
           C 13 77, 16 85, 26 90.5
           C 34 93.5, 43 94, 50 94
           C 57 94, 66 93.5, 74 90.5
           C 84 85, 87 77, 83 71
           C 77.5 62, 63.5 58, 57.5 56
           C 56.5 46, 55.5 38, 50 38 Z"
        fill="#FFFFFF"
      />

      {/* 4. 靈動大黑圓眼 + 單點高光 */}
      {/* 左眼 */}
      <circle cx="34.5" cy="54" r="6.8" fill="#15141B" />
      <circle cx="32.5" cy="51.8" r="2.2" fill="#FFFFFF" />

      {/* 右眼 */}
      <circle cx="65.5" cy="54" r="6.8" fill="#15141B" />
      <circle cx="63.5" cy="51.8" r="2.2" fill="#FFFFFF" />

      {/* 5. 圓角倒三角粉紅小鼻 */}
      <path
        d="M 46.5 63.8
           C 47.5 62.6, 52.5 62.6, 53.5 63.8
           C 54.6 65, 51.5 68, 50 68
           C 48.5 68, 45.4 65, 46.5 63.8 Z"
        fill="#FF5C8A"
      />

      {/* 6. 萌感微笑嘴線 */}
      <path
        d="M 44.2 70.2 Q 47.1 72.6 50 71 Q 52.9 72.6 55.8 70.2"
        fill="none"
        stroke="#423C4F"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
