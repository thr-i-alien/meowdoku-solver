import React from 'react';
import type { HintInfo } from '../types/game';
import { useI18n } from '../i18n';
import { Sparkles, XCircle, Check, X } from 'lucide-react';

export interface HintCardProps {
  hintInfo: HintInfo;
  onApplyHint?: () => void;
  onClose?: () => void;
  className?: string;
}

/**
 * 智能提示說明卡片元件
 * 供手機版棋盤下方緊鄰顯示，或桌面版側邊欄顯示
 */
export const HintCard: React.FC<HintCardProps> = ({
  hintInfo,
  onApplyHint,
  onClose,
  className = '',
}) => {
  const { lang, t } = useI18n();

  const isCat = hintInfo.suggestedStatus === 'CAT';
  const targets =
    hintInfo.targetCells && hintInfo.targetCells.length > 0
      ? hintInfo.targetCells
      : [hintInfo.coord];
  const isMulti = targets.length > 1;

  const displayReason = lang === 'en' && hintInfo.reasonEn ? hintInfo.reasonEn : hintInfo.reason;
  const displayMessage = lang === 'en' && hintInfo.messageEn ? hintInfo.messageEn : hintInfo.message;

  return (
    <div
      className={`hint-card ${isCat ? 'hint-card-cat' : 'hint-card-cross'} ${className}`}
      role="region"
      aria-label={t.playPanel.hintCardTitle}
    >
      <div className="hint-header">
        <div className="hint-header-main">
          {isCat ? (
            <Sparkles size={18} color="#e59819" className="hint-icon" />
          ) : (
            <XCircle size={18} color="#ef476f" className="hint-icon" />
          )}
          <span className={`hint-tag ${isCat ? 'hint-tag-cat' : 'hint-tag-cross'}`}>
            {displayReason}
          </span>
          <span className={`hint-type-badge ${isCat ? 'badge-cat' : 'badge-cross'}`}>
            {isCat
              ? (lang === 'en' ? '🐱 Place Cat' : '🐱 建議放貓')
              : (lang === 'en' ? '✕ Eliminate' : '✕ 建議排除')}
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            className="hint-close-btn"
            onClick={onClose}
            title={lang === 'en' ? 'Dismiss hint' : '關閉提示'}
            aria-label={lang === 'en' ? 'Dismiss hint' : '關閉提示'}
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="hint-body">{displayMessage}</div>

      <div className="hint-target">
        {isMulti ? (
          lang === 'en' ? (
            <>
              Target: <strong>{targets.length}</strong> cells (
              {targets.slice(0, 3).map((pt) => `R${pt.r + 1}C${pt.c + 1}`).join(', ')}
              {targets.length > 3 ? '...' : ''})
            </>
          ) : (
            <>
              目標座標：共 <strong>{targets.length}</strong> 處空格（
              {targets.slice(0, 3).map((pt) => `第 ${pt.r + 1} 列第 ${pt.c + 1} 欄`).join('、')}
              {targets.length > 3 ? ' 等' : ''}）
            </>
          )
        ) : (
          lang === 'en' ? (
            <>Target: Row {hintInfo.coord.r + 1}, Col {hintInfo.coord.c + 1}</>
          ) : (
            <>目標座標：第 {hintInfo.coord.r + 1} 列、第 {hintInfo.coord.c + 1} 欄</>
          )
        )}
      </div>

      {onApplyHint && (
        <button
          type="button"
          className={`hint-apply-btn ${isCat ? 'apply-cat' : 'apply-cross'}`}
          onClick={onApplyHint}
        >
          <Check size={14} />
          <span>
            {isCat
              ? (lang === 'en' ? 'Place Cat Here' : '一鍵放置此處貓咪')
              : (lang === 'en' ? `Mark ${targets.length} cell(s) as ✕` : `一鍵劃記此 ${targets.length} 格為 ✕`)}
          </span>
        </button>
      )}
    </div>
  );
};
