import React from 'react';
import type { HintInfo } from '../types/game';
import { CatIcon } from './icons';
import { useI18n } from '../i18n';
import { HintCard } from './HintCard';
import {
  Timer,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  SlidersHorizontal,
} from 'lucide-react';

interface PlayControlPanelProps {
  gridSize: number;
  catsPlacedCount: number;
  elapsedSeconds: number;
  isTimerRunning: boolean;
  showConflicts: boolean;
  autoCrossOnCat: boolean;
  hintInfo: HintInfo | null;
  hasConflicts: boolean;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onToggleShowConflicts: () => void;
  onToggleAutoCross: () => void;
  onRequestHint: () => void;
  onApplyHint?: () => void;
  onDismissHint?: () => void;
  onClearBoardMarks: () => void;
  onValidateBoard: () => void;
  onSwitchToSolver: () => void;
}

export const PlayControlPanel: React.FC<PlayControlPanelProps> = ({
  gridSize,
  catsPlacedCount,
  elapsedSeconds,
  isTimerRunning,
  showConflicts,
  autoCrossOnCat,
  hintInfo,
  hasConflicts,
  onToggleTimer,
  onResetTimer,
  onToggleShowConflicts,
  onToggleAutoCross,
  onRequestHint,
  onApplyHint,
  onDismissHint,
  onClearBoardMarks,
  onValidateBoard,
  onSwitchToSolver,
}) => {
  const { lang, t } = useI18n();

  // 格式化秒數為 mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = Math.min(100, Math.round((catsPlacedCount / gridSize) * 100));

  return (
    <div className="play-panel">
      {/* 頂部狀態列：計時器與重置 */}
      <div className="panel-header-card">
        <div className="panel-header-left">
          <div className="timer-display" onClick={onToggleTimer} title={t.playPanel.timerTooltip}>
            <Timer size={20} className={isTimerRunning ? 'timer-icon-active' : ''} />
            <span className="timer-text">{formatTime(elapsedSeconds)}</span>
          </div>
          <button className="icon-btn-ghost" onClick={onResetTimer} title={t.playPanel.resetTimerTitle}>
            <RotateCcw size={16} />
          </button>
        </div>
        <div className="status-badge-group">
          {hasConflicts && showConflicts ? (
            <span className="badge-danger">
              <AlertTriangle size={14} /> {t.playPanel.badgeConflict}
            </span>
          ) : catsPlacedCount === gridSize ? (
            <span className="badge-success">
              <CheckCircle2 size={14} /> {t.playPanel.badgeSuccess}
            </span>
          ) : (
            <span className="badge-neutral">{t.playPanel.badgePlaying}</span>
          )}
        </div>
      </div>

      {/* 貓咪目標進度卡片 */}
      <div className="progress-card">
        <div className="progress-header">
          <span className="progress-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <CatIcon size={20} /> {t.playPanel.progressTitle}
          </span>
          <span className="progress-count">
            <strong>{catsPlacedCount}</strong> / {gridSize} {t.playPanel.progressCatsUnit}
          </span>
        </div>
        <div className="progress-bar-bg">
          <div
            className="progress-bar-fill"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: catsPlacedCount === gridSize ? 'var(--accent-green)' : 'var(--accent-orange)',
            }}
          />
        </div>
      </div>

      {/* 輔助開關設定 */}
      <div className="helpers-card">
        <div className="helpers-title">
          <SlidersHorizontal size={15} /> {lang === 'en' ? 'Smart Helpers' : '智能解題輔助'}
        </div>
        <div className="helper-toggles">
          <label className="toggle-item">
            <input
              type="checkbox"
              checked={showConflicts}
              onChange={onToggleShowConflicts}
            />
            <span className="toggle-label">{t.playPanel.helperConflicts}</span>
          </label>
          <label className="toggle-item">
            <input
              type="checkbox"
              checked={autoCrossOnCat}
              onChange={onToggleAutoCross}
            />
            <span className="toggle-label">{t.playPanel.helperAutoCross}</span>
          </label>
        </div>
        <div className="shortcut-tips">
          <Lightbulb size={15} style={{ verticalAlign: 'text-bottom', marginRight: 4, color: 'var(--accent-orange)' }} />
          <strong>{t.playPanel.shortcutTipsTitle}</strong>{t.playPanel.shortcutTipsDesc}
        </div>
      </div>

      {/* 智能提示顯示卡片（桌面側邊欄模式） */}
      {hintInfo && (
        <div className="play-panel-hint-wrapper">
          <HintCard
            hintInfo={hintInfo}
            onApplyHint={onApplyHint}
            onClose={onDismissHint}
          />
        </div>
      )}

      {/* 底部操作功能按鈕群 */}
      <div className="play-actions-grid">
        <button className="action-btn-primary" onClick={onRequestHint}>
          <Sparkles size={18} />
          <span>{t.playPanel.btnRequestHint}</span>
        </button>

        <button className="action-btn-secondary" onClick={onValidateBoard}>
          <CheckCircle2 size={18} />
          <span>{t.playPanel.btnValidateBoard}</span>
        </button>

        <button className="action-btn-outline" onClick={onClearBoardMarks} title={t.playPanel.btnClearBoardTitle}>
          <RotateCcw size={16} />
          <span>{t.playPanel.btnClearBoard}</span>
        </button>

        <button className="action-btn-ghost" onClick={onSwitchToSolver}>
          <span>{t.playPanel.btnSwitchSolver}</span>
        </button>
      </div>
    </div>
  );
};

