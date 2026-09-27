import React from 'react';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Zap,
} from 'lucide-react';
import { useI18n } from '../i18n';

interface TimelinePlayerProps {
  totalSteps: number;
  currentStepIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  onTogglePlay: () => void;
  onStepPrev: () => void;
  onStepNext: () => void;
  onJumpToStart: () => void;
  onJumpToEnd: () => void;
  onSeek: (stepIndex: number) => void;
  onChangeSpeed: (speed: number) => void;
  onTriggerSolve: () => void;
  hasSolution: boolean;
}

export const TimelinePlayer: React.FC<TimelinePlayerProps> = ({
  totalSteps,
  currentStepIndex,
  isPlaying,
  playbackSpeed,
  onTogglePlay,
  onStepPrev,
  onStepNext,
  onJumpToStart,
  onJumpToEnd,
  onSeek,
  onChangeSpeed,
  onTriggerSolve,
  hasSolution,
}) => {
  const { t } = useI18n();

  if (!hasSolution) {
    return (
      <div className="player-controller" style={{ textAlign: 'center', padding: '24px' }}>
        <button className="btn-primary" onClick={onTriggerSolve} style={{ margin: '0 auto' }}>
          <Zap size={18} />
          {t.solverPanel.btnSolveNow}
        </button>
      </div>
    );
  }

  return (
    <div className="player-controller">
      <div className="timeline-slider-row">
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-faint)' }}>01</span>
        <input
          type="range"
          min={0}
          max={Math.max(0, totalSteps - 1)}
          value={currentStepIndex}
          onChange={(e) => onSeek(parseInt(e.target.value, 10))}
          className="timeline-slider"
        />
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-faint)' }}>
          {totalSteps.toString().padStart(2, '0')}
        </span>
      </div>

      <div className="player-buttons-row">
        <button
          className="btn-icon"
          onClick={onJumpToStart}
          disabled={currentStepIndex === 0}
          title={t.solverPanel.jumpToStart}
        >
          <ChevronsLeft size={18} />
        </button>

        <button
          className="btn-icon"
          onClick={onStepPrev}
          disabled={currentStepIndex === 0}
          title={t.solverPanel.prevStep}
        >
          <ChevronLeft size={18} />
        </button>

        <button
          className="btn-player-main"
          onClick={onTogglePlay}
          title={isPlaying ? t.solverPanel.pause : t.solverPanel.play}
        >
          {isPlaying ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: 2 }} />}
        </button>

        <button
          className="btn-icon"
          onClick={onStepNext}
          disabled={currentStepIndex >= totalSteps - 1}
          title={t.solverPanel.nextStep}
        >
          <ChevronRight size={18} />
        </button>

        <button
          className="btn-icon"
          onClick={onJumpToEnd}
          disabled={currentStepIndex >= totalSteps - 1}
          title={t.solverPanel.jumpToEnd}
        >
          <ChevronsRight size={18} />
        </button>

        <select
          className="speed-select"
          value={playbackSpeed}
          onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
          title={t.solverPanel.speedTitle}
        >
          <option value={0.5}>{t.solverPanel.speedHalf}</option>
          <option value={1}>{t.solverPanel.speed1x}</option>
          <option value={2}>{t.solverPanel.speed2x}</option>
          <option value={4}>{t.solverPanel.speed4x}</option>
        </select>
      </div>
    </div>
  );
};

