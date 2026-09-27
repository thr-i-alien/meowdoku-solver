import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Timer, RotateCcw, Eye, X, Sparkles } from 'lucide-react';
import { CatIcon } from './icons';
import { useI18n } from '../i18n';

interface VictoryModalProps {
  isOpen: boolean;
  gridSize: number;
  elapsedSeconds: number;
  onClose: () => void;
  onPlayAgain: () => void;
  onViewAISolution: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  gridSize,
  elapsedSeconds,
  onClose,
  onPlayAgain,
  onViewAISolution,
}) => {
  const { t, interpolate } = useI18n();

  useEffect(() => {
    if (isOpen) {
      // 觸發彩帶動畫
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });

        // 雙側禮炮效果
        setTimeout(() => {
          confetti({
            particleCount: 60,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
          });
          confetti({
            particleCount: 60,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
          });
        }, 250);
      } catch (e) {
        console.warn('Confetti effect failed', e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const timeFormatted = t.victoryModal.timeFormat(mins, secs);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content victory-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="victory-icon-wrapper">
          <Trophy size={48} color="#e47535" />
        </div>

        <h2 className="victory-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Sparkles size={24} color="#e47535" /> {t.victoryModal.title}
        </h2>
        <p className="victory-subtitle">
          {interpolate(t.victoryModal.subtitle, { size: gridSize })}
        </p>

        <div className="victory-stats-box">
          <div className="stat-card">
            <Timer size={22} color="var(--accent-orange)" />
            <div className="stat-val">{timeFormatted}</div>
            <div className="stat-lbl">{t.victoryModal.timeLabel}</div>
          </div>
          <div className="stat-card">
            <CatIcon size={26} />
            <div className="stat-val">{gridSize} / {gridSize}</div>
            <div className="stat-lbl">{t.victoryModal.successConfigLabel}</div>
          </div>
        </div>

        <div className="victory-buttons">
          <button className="btn-primary" onClick={onPlayAgain}>
            <RotateCcw size={18} />
            <span>{t.victoryModal.btnPlayAgain}</span>
          </button>
          <button className="btn-secondary" onClick={onViewAISolution}>
            <Eye size={18} />
            <span>{t.victoryModal.btnViewAI}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

