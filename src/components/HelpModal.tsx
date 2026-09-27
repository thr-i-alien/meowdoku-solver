import React from 'react';
import { X, Check, Ruler, Crown, Lightbulb, Gamepad2 } from 'lucide-react';
import { CatIcon, PawIcon } from './icons';
import { useI18n } from '../i18n';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="brand-icon" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PawIcon size={20} color="var(--accent-orange)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>{t.helpModal.title}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {t.helpModal.subtitle}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: 16 }}>
          <div style={{ background: 'var(--bg-panel)', padding: 14, borderRadius: 'var(--radius-md)', borderLeft: '4px solid #e47535' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 900, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CatIcon size={18} /> {t.helpModal.rule1Title}
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {t.helpModal.rule1Desc}
            </p>
          </div>

          <div style={{ background: 'var(--bg-panel)', padding: 14, borderRadius: 'var(--radius-md)', borderLeft: '4px solid #4ea1b8' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 900, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Ruler size={18} color="#4ea1b8" /> {t.helpModal.rule2Title}
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {t.helpModal.rule2Desc}
            </p>
          </div>

          <div style={{ background: 'var(--bg-panel)', padding: 14, borderRadius: 'var(--radius-md)', borderLeft: '4px solid #b36a81' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 900, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Crown size={18} color="#b36a81" /> {t.helpModal.rule3Title}
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {t.helpModal.rule3Desc}
            </p>
          </div>

          <div style={{ background: 'var(--bg-panel)', padding: 14, borderRadius: 'var(--radius-md)', borderLeft: '4px solid #98c87b' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 900, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lightbulb size={18} color="#7cb85c" /> {t.helpModal.rule4Title}
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {t.helpModal.rule4Desc}
            </p>
          </div>

          <div style={{ background: 'var(--accent-cream)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-border)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 900, marginBottom: 6, color: 'var(--accent-orange)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Gamepad2 size={18} /> {t.helpModal.guideTitle}
            </h4>
            <ul style={{ fontSize: '0.85rem', color: 'var(--text-main)', paddingLeft: 18, margin: 0, lineHeight: 1.6 }}>
              <li>{t.helpModal.guide1}</li>
              <li>{t.helpModal.guide2}</li>
              <li>{t.helpModal.guide3}</li>
              <li>{t.helpModal.guide4}</li>
              <li>{t.helpModal.guide5}</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>
            <Check size={16} /> {t.helpModal.btnUnderstood}
          </button>
        </div>
      </div>
    </div>
  );
};

