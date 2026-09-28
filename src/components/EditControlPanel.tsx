import React, { useState, useEffect } from 'react';
import type { RegionColor } from '../types/game';
import type { MapIntegrityInfo } from '../logic/mapEditor';
import { solveMeowdoku } from '../logic/solver';
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Gamepad2,
  Dices,
  RotateCcw,
  Eraser,
  HelpCircle,
  BrainCircuit,
  Sliders,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { useI18n } from '../i18n';

interface EditControlPanelProps {
  gridSize: number;
  regionGrid: number[][];
  colors: RegionColor[];
  integrity: MapIntegrityInfo;
  onChangeGridSize: (newSize: number) => void;
  onGenerateRandomBoard: () => void;
  onLoadPresetBoard: () => void;
  onClearBoardToSingleColor: () => void;
  onStartPlaying: () => void;
  onStartSolving: () => void;
}

export const EditControlPanel: React.FC<EditControlPanelProps> = ({
  gridSize,
  regionGrid,
  colors,
  integrity,
  onChangeGridSize,
  onGenerateRandomBoard,
  onLoadPresetBoard,
  onClearBoardToSingleColor,
  onStartPlaying,
  onStartSolving,
}) => {
  const { lang, t, interpolate } = useI18n();

  // 檢查可行性狀態
  const [solvabilityStatus, setSolvabilityStatus] = useState<{
    tested: boolean;
    isChecking: boolean;
    success?: boolean;
    hasMultipleSolutions?: boolean;
    solutionCount?: number;
    message?: string;
  }>({ tested: false, isChecking: false });

  // 當棋盤內容改變時，重設可行性狀態為「待驗證」，避免拿過期的檢查結果誤導
  useEffect(() => {
    setSolvabilityStatus({ tested: false, isChecking: false });
  }, [regionGrid]);

  // 執行可解性診斷
  const handleCheckSolvability = () => {
    setSolvabilityStatus({ tested: false, isChecking: true });
    // 非同步讓 UI 能有即時 loading 感受
    setTimeout(() => {
      try {
        const result = solveMeowdoku(regionGrid, colors);
        setSolvabilityStatus({
          tested: true,
          isChecking: false,
          success: result.success,
          hasMultipleSolutions: result.hasMultipleSolutions,
          solutionCount: result.solutionCount,
          message: result.errorMessage,
        });
      } catch (err) {
        setSolvabilityStatus({
          tested: true,
          isChecking: false,
          success: false,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }, 60);
  };

  const availableSizes = [4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <div className="edit-control-panel">
      {/* 1. 盤面維度快速切換 */}
      <div className="edit-card dimension-card">
        <div className="edit-card-header">
          <div className="edit-card-title-row">
            <Sliders size={18} className="card-header-icon" />
            <span className="card-title">{t.editMode.gridSizeLabel}</span>
          </div>
          <span className="badge badge-accent">
            {gridSize}
          </span>
        </div>

        <div className="dimension-buttons-row">
          {availableSizes.map((sz) => (
            <button
              key={sz}
              type="button"
              className={`dim-btn ${gridSize === sz ? 'active' : ''}`}
              onClick={() => {
                if (gridSize !== sz) {
                  onChangeGridSize(sz);
                  setSolvabilityStatus({ tested: false, isChecking: false });
                }
              }}
              title={`${sz} × ${sz}`}
            >
              {sz}
            </button>
          ))}
        </div>
      </div>

      {/* 2. 地圖完整度與合法性儀表板 */}
      <div className="edit-card integrity-card">
        <div className="edit-card-header">
          <div className="edit-card-title-row">
            <ShieldCheck size={18} className="card-header-icon" />
            <span className="card-title">{lang === 'en' ? 'Map Analysis' : '地圖完整度分析'}</span>
          </div>

          <div className="header-badges-row">
            {/* 徽章 1：區域劃分合格性 */}
            {integrity.isValidCount ? (
              <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={13} /> {t.editMode.regionValidBadge}
              </span>
            ) : (
              <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <AlertTriangle size={13} /> {interpolate(t.editMode.regionInvalidBadge, { n: gridSize })}
              </span>
            )}

            {/* 徽章 2：題目可行性驗證 */}
            {!solvabilityStatus.tested ? (
              <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <HelpCircle size={13} /> {t.editMode.feasibilityPendingBadge}
              </span>
            ) : solvabilityStatus.isChecking ? (
              <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Loader2 size={13} className="spin-icon" /> {t.editMode.feasibilityCheckingBadge}
              </span>
            ) : solvabilityStatus.success ? (
              solvabilityStatus.hasMultipleSolutions ? (
                <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <AlertTriangle size={13} /> {t.editMode.feasibilityMultiBadge}
                </span>
              ) : (
                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Sparkles size={13} /> {t.editMode.feasibilityUniqueBadge}
                </span>
              )
            ) : (
              <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <AlertTriangle size={13} /> {t.editMode.feasibilityNoneBadge}
              </span>
            )}
          </div>
        </div>

        <div className="integrity-status-content">
          <div className="integrity-stat-row">
            <span className="stat-label">{t.board.currentRegions}</span>
            <span className={`stat-value ${integrity.isValidCount ? 'text-success' : 'text-warning'}`}>
              <strong>{integrity.uniqueCount}</strong> / {gridSize} 色
            </span>
          </div>

          {/* 警告標籤：同色不連通 */}
          {integrity.disconnectedColors.length > 0 && (
            <div className="integrity-warning-box">
              <AlertTriangle size={15} className="warning-icon" />
              <span>{t.editMode.statusDisconnectedWarning}</span>
            </div>
          )}

          {/* 可解性驗證診斷區塊 */}
          <div className="solvability-section">
            <button
              type="button"
              className="btn-secondary btn-full check-solvable-btn"
              onClick={handleCheckSolvability}
              disabled={solvabilityStatus.isChecking}
            >
              <BrainCircuit size={15} />
              <span>{solvabilityStatus.isChecking ? t.editMode.solvableChecking : t.editMode.btnCheckSolvable}</span>
            </button>

            {solvabilityStatus.tested && (
              <div
                className={`solvability-result-box ${
                  solvabilityStatus.success
                    ? solvabilityStatus.hasMultipleSolutions
                      ? 'result-multi'
                      : 'result-unique'
                    : 'result-none'
                }`}
              >
                {solvabilityStatus.success ? (
                  solvabilityStatus.hasMultipleSolutions ? (
                    <>
                      <AlertTriangle size={16} color="#d97706" />
                      <span>{interpolate(t.editMode.solvableMultiple, { n: solvabilityStatus.solutionCount || 2 })}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} color="#059669" />
                      <span>{t.editMode.solvableUnique}</span>
                    </>
                  )
                ) : (
                  <>
                    <AlertTriangle size={16} color="#dc2626" />
                    <span>{t.editMode.solvableNone}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. 快捷地圖工具箱 */}
      <div className="edit-card actions-card">
        <div className="edit-card-header">
          <div className="edit-card-title-row">
            <Sparkles size={18} className="card-header-icon" />
            <span className="card-title">{lang === 'en' ? 'Quick Tools' : '地圖快捷工具'}</span>
          </div>
        </div>

        <div className="edit-actions-grid">
          <button
            type="button"
            className="edit-tool-action-btn"
            onClick={() => {
              onGenerateRandomBoard();
              setSolvabilityStatus({ tested: false, isChecking: false });
            }}
            title={t.editMode.btnRandomBoard}
          >
            <Dices size={16} className="action-icon" />
            <span className="action-label">{t.editMode.btnRandomBoard}</span>
          </button>

          <button
            type="button"
            className="edit-tool-action-btn"
            onClick={() => {
              onLoadPresetBoard();
              setSolvabilityStatus({ tested: false, isChecking: false });
            }}
            title={t.editMode.btnLoadPreset}
          >
            <RotateCcw size={16} className="action-icon" />
            <span className="action-label">{t.editMode.btnLoadPreset}</span>
          </button>

          <button
            type="button"
            className="edit-tool-action-btn action-danger"
            onClick={() => {
              onClearBoardToSingleColor();
              setSolvabilityStatus({ tested: false, isChecking: false });
            }}
            title={t.editMode.btnClearAll}
          >
            <Eraser size={16} className="action-icon" />
            <span className="action-label">{t.editMode.btnClearAll}</span>
          </button>
        </div>
      </div>

      {/* 4. 規則指引 */}
      <div className="edit-card guide-card">
        <div className="guide-header">
          <HelpCircle size={15} color="var(--accent-orange)" />
          <span className="guide-title">{t.editMode.guideTitle}</span>
        </div>
        <p className="guide-text">{t.editMode.guideDesc}</p>
        <p className="guide-rule">
          <strong>{t.editMode.guideRuleTitle}</strong>{' '}
          {interpolate(t.editMode.guideRuleDesc, { n: gridSize })}
        </p>
      </div>

      {/* 5. 核心跳轉與完成動作按鈕 */}
      <div className="edit-cta-buttons">
        <button
          type="button"
          className="btn-primary cta-btn start-play-btn"
          onClick={onStartPlaying}
          title={t.editMode.btnStartPlay}
        >
          <Gamepad2 size={18} />
          <span>{t.editMode.btnStartPlay}</span>
        </button>

        <button
          type="button"
          className="btn-secondary cta-btn start-solve-btn"
          onClick={onStartSolving}
          title={t.editMode.btnStartSolve}
        >
          <BrainCircuit size={18} />
          <span>{t.editMode.btnStartSolve}</span>
        </button>
      </div>
    </div>
  );
};
