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
      <defs>
        {/* 紫色霓虹外輪廓漸層 (鮮明亮紫至深紫) */}
        <linearGradient id="catPurpleRim" x1="15" y1="8" x2="85" y2="94" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A76BFF" />
          <stop offset="45%" stopColor="#8944FC" />
          <stop offset="100%" stopColor="#7022EA" />
        </linearGradient>

        {/* 黑色毛皮主體立體漸層 (黑曜墨黑帶柔和光澤) */}
        <linearGradient id="catBlackFur" x1="50" y1="10" x2="50" y2="94" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#36323F" />
          <stop offset="35%" stopColor="#211F29" />
          <stop offset="75%" stopColor="#15141B" />
          <stop offset="100%" stopColor="#0D0C11" />
        </linearGradient>

        {/* 內耳深粉漸層 */}
        <linearGradient id="catInnerEar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF85A5" />
          <stop offset="45%" stopColor="#EB5782" />
          <stop offset="100%" stopColor="#A8284B" />
        </linearGradient>

        {/* 白色面斑與包子臉頰立體漸層 */}
        <linearGradient id="catWhiteFace" x1="50" y1="36" x2="50" y2="94" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="65%" stopColor="#F9F8FC" />
          <stop offset="100%" stopColor="#DDD8E8" />
        </linearGradient>

        {/* 立體粉嫩鼻子漸層 */}
        <linearGradient id="catNoseGrad" x1="50" y1="62" x2="50" y2="67.5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFAEC2" />
          <stop offset="40%" stopColor="#FF6992" />
          <stop offset="100%" stopColor="#D93664" />
        </linearGradient>

        {/* 瞳孔深邃感漸層 */}
        <radialGradient id="catPupilGrad" cx="38%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#1F1D24" />
          <stop offset="80%" stopColor="#0B0A0E" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>

        {/* 眼睛下緣半透明水晶反光 */}
        <linearGradient id="catEyeReflect" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="100%" stopColor="#6E6285" stopOpacity="0.45" />
        </linearGradient>

        {/* 紫色外光暈微濾鏡 */}
        <filter id="catPurpleGlow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="1.8" stdDeviation="2.2" floodColor="#5B21B6" floodOpacity="0.4" />
        </filter>
      </defs>

      <g filter="url(#catPurpleGlow)">
        {/* 1. 紫色外邊框光輪廓（底層完整外形） */}
        <path
          d="M 20 10
             C 14 26, 12 46, 11 60
             C 10 76, 18 92, 50 94
             C 82 92, 90 76, 89 60
             C 88 46, 86 26, 80 10
             C 74 15, 67 24, 62 29
             C 57 26.5, 43 26.5, 38 29
             C 33 24, 26 15, 20 10 Z"
          fill="none"
          stroke="url(#catPurpleRim)"
          strokeWidth="3.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* 2. 貓頭外形與黑色毛皮層 */}
        <path
          d="M 20 10
             C 14 26, 12 46, 11 60
             C 10 76, 18 92, 50 94
             C 82 92, 90 76, 89 60
             C 88 46, 86 26, 80 10
             C 74 15, 67 24, 62 29
             C 57 26.5, 43 26.5, 38 29
             C 33 24, 26 15, 20 10 Z"
          fill="url(#catBlackFur)"
        />

        {/* 3. 內耳粉嫩大耳窩 */}
        {/* 左內耳 */}
        <path
          d="M 21.5 15.5
             C 19 28, 18 39, 21.5 46
             C 26 43, 33 37, 35.5 31
             C 31 23, 25 17, 21.5 15.5 Z"
          fill="url(#catInnerEar)"
        />
        {/* 左耳骨陰影線 */}
        <path
          d="M 22 21 C 21 29, 21 39, 24.5 44"
          stroke="#7E1D3B"
          strokeWidth="1.3"
          strokeLinecap="round"
          opacity="0.55"
        />

        {/* 右內耳 */}
        <path
          d="M 78.5 15.5
             C 81 28, 82 39, 78.5 46
             C 74 43, 67 37, 64.5 31
             C 69 23, 75 17, 78.5 15.5 Z"
          fill="url(#catInnerEar)"
        />
        {/* 右耳骨陰影線 */}
        <path
          d="M 78 21 C 79 29, 79 39, 75.5 44"
          stroke="#7E1D3B"
          strokeWidth="1.3"
          strokeLinecap="round"
          opacity="0.55"
        />

        {/* 4. 頭頂黑色毛皮柔和光暈 */}
        <ellipse cx="50" cy="30" rx="14" ry="3.5" fill="#FFFFFF" opacity="0.1" />

        {/* 5. 兩側小眉毛 (好奇生動的小月牙) */}
        <path
          d="M 28 39.5 C 31.5 37.5, 36.5 37.5, 39.5 39.5"
          stroke="#0B0A0E"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M 29 39 C 32 37.2, 36 37.2, 38.5 39"
          stroke="#383344"
          strokeWidth="1.3"
          strokeLinecap="round"
          opacity="0.65"
        />

        <path
          d="M 60.5 39.5 C 63.5 37.5, 68.5 37.5, 72 39.5"
          stroke="#0B0A0E"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M 61.5 39 C 64 37.2, 68 37.2, 71 39"
          stroke="#383344"
          strokeWidth="1.3"
          strokeLinecap="round"
          opacity="0.65"
        />

        {/* 6. 白色面斑與豐滿包子臉頰 (賓士貓 White Blaze & Muzzle) */}
        <path
          d="M 50 37
             C 44.5 37, 43.5 45, 42.5 56
             C 37 58, 23 62, 17 71
             C 13 77, 16 85, 26 90.5
             C 34 93.5, 43 94, 50 94
             C 57 94, 66 93.5, 74 90.5
             C 84 85, 87 77, 83 71
             C 77 62, 63 58, 57.5 56
             C 56.5 45, 55.5 37, 50 37 Z"
          fill="url(#catWhiteFace)"
        />

        {/* 下巴下緣圓潤立體灰影 (塑造球形 3D 毛感) */}
        <path
          d="M 24 89 C 35 94, 65 94, 76 89 C 67 93, 33 93, 24 89 Z"
          fill="#C6C1D6"
          opacity="0.8"
        />

        {/* 7. 水汪汪萌感大眼睛 */}
        {/* 左眼 */}
        <g id="catLeftEye">
          {/* 眼窩柔和底影 */}
          <ellipse cx="34.5" cy="54" rx="8" ry="8.4" fill="#E6E4EE" />
          {/* 眼白 */}
          <ellipse cx="34.5" cy="53.8" rx="7.6" ry="8" fill="#FFFFFF" />
          {/* 大黑曜石瞳孔 */}
          <ellipse cx="34.5" cy="54" rx="6.7" ry="7.1" fill="url(#catPupilGrad)" />
          {/* 瞳孔底部反光 */}
          <ellipse cx="34.5" cy="54" rx="6.7" ry="7.1" fill="url(#catEyeReflect)" />
          {/* 左上純白主高光 */}
          <circle cx="32.4" cy="51.2" r="2.35" fill="#FFFFFF" />
          {/* 右下純白副高光 */}
          <circle cx="36.8" cy="56" r="1.15" fill="#FFFFFF" />
        </g>

        {/* 右眼 */}
        <g id="catRightEye">
          {/* 眼窩柔和底影 */}
          <ellipse cx="65.5" cy="54" rx="8" ry="8.4" fill="#E6E4EE" />
          {/* 眼白 */}
          <ellipse cx="65.5" cy="53.8" rx="7.6" ry="8" fill="#FFFFFF" />
          {/* 大黑曜石瞳孔 */}
          <ellipse cx="65.5" cy="54" rx="6.7" ry="7.1" fill="url(#catPupilGrad)" />
          {/* 瞳孔底部反光 */}
          <ellipse cx="65.5" cy="54" rx="6.7" ry="7.1" fill="url(#catEyeReflect)" />
          {/* 左上純白主高光 */}
          <circle cx="63.4" cy="51.2" r="2.35" fill="#FFFFFF" />
          {/* 右下純白副高光 */}
          <circle cx="67.8" cy="56" r="1.15" fill="#FFFFFF" />
        </g>

        {/* 8. 嘟嘟嘴吻部肉墊弧光 */}
        <path
          d="M 43.5 68 C 40 68, 38 71.5, 41 74.5 C 45 76.5, 49.5 74.5, 50 72"
          fill="#FFFFFF"
          opacity="0.45"
        />
        <path
          d="M 56.5 68 C 60 68, 62 71.5, 59 74.5 C 55 76.5, 50.5 74.5, 50 72"
          fill="#FFFFFF"
          opacity="0.45"
        />

        {/* 9. 嘴巴（微張軟萌小嘴與粉嫩小舌尖） */}
        <g id="catMouth">
          {/* 人中中縫線 */}
          <path
            d="M 50 65.5 L 50 68"
            stroke="#BD7E92"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* 微開嘴腔暗部 */}
          <path
            d="M 46.2 68.2
               Q 50 70.4 53.8 68.2
               Q 50 75 46.2 68.2 Z"
            fill="#501222"
          />
          {/* 粉嫩小舌尖 */}
          <path
            d="M 47.8 71.2
               Q 50 70 52.2 71.2
               Q 50 74.4 47.8 71.2 Z"
            fill="#FF8DA4"
          />
          {/* 上唇柔和微笑線 */}
          <path
            d="M 44.5 67.6 Q 47.5 69.3 50 68.2 Q 52.5 69.3 55.5 67.6"
            stroke="#945369"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>

        {/* 10. 立體心形粉紅小鼻子 */}
        <g id="catNose">
          <path
            d="M 45.8 62.6
               C 47.3 61.3, 52.7 61.3, 54.2 62.6
               C 55.1 63.5, 52.2 66.5, 50 66.5
               C 47.8 66.5, 44.9 63.5, 45.8 62.6 Z"
            fill="url(#catNoseGrad)"
          />
          {/* 鼻子立體高光 */}
          <ellipse cx="50" cy="62.5" rx="2.1" ry="0.65" fill="#FFFFFF" opacity="0.65" />
        </g>

        {/* 11. 兩側細白優雅鬍鬚（左 3 根，右 3 根） */}
        <g id="catWhiskers" stroke="#FFFFFF" strokeWidth="1.15" strokeLinecap="round" opacity="0.95">
          {/* 左側鬍鬚 (向外向下輕柔伸展) */}
          <path d="M 23 66 C 16 65.5, 10 66.5, 4 69" />
          <path d="M 22 71 C 15 72, 9 75.5, 5 78.5" />
          <path d="M 23 75.5 C 16 78, 11 82.5, 7 85.5" />

          {/* 右側鬍鬚 */}
          <path d="M 77 66 C 84 65.5, 90 66.5, 96 69" />
          <path d="M 78 71 C 85 72, 91 75.5, 95 78.5" />
          <path d="M 77 75.5 C 84 78, 89 82.5, 93 85.5" />
        </g>
      </g>
    </svg>
  );
};
