import React from 'react';
import { Camera, HelpCircle, Gamepad2, BrainCircuit, FileText, Languages } from 'lucide-react';
import { CatIcon } from './icons';
import type { AppMode } from '../types/game';
import { useI18n } from '../i18n';

interface HeaderProps {
  currentMode: AppMode;
  onChangeMode: (mode: AppMode) => void;
  onOpenUploadModal: () => void;
  onOpenExportModal: () => void;
  onOpenHelpModal: () => void;
  onTriggerSolve: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onChangeMode,
  onOpenUploadModal,
  onOpenExportModal,
  onOpenHelpModal,
  onTriggerSolve,
}) => {
  const { lang, toggleLang, t } = useI18n();

  return (
    <header className="app-header">
      <div className="brand-wrapper">
        <div className="brand-icon">
          <CatIcon size={26} />
        </div>
        <div>
          <div className="brand-title">Meowdoku Solver</div>
          <div className="brand-subtitle">{t.brand.subtitle}</div>
        </div>
      </div>

      {/* 核心模式切換頁籤 */}
      <div className="header-mode-nav">
        <button
          className={`mode-tab-btn ${currentMode === 'SOLVE' ? 'active' : ''}`}
          onClick={() => {
            onChangeMode('SOLVE');
            onTriggerSolve();
          }}
          title={t.brand.modeSolveTitle}
        >
          <BrainCircuit size={17} />
          <span>{t.brand.modeSolve}</span>
        </button>
        <button
          className={`mode-tab-btn ${currentMode === 'PLAY' ? 'active' : ''}`}
          onClick={() => onChangeMode('PLAY')}
          title={t.brand.modePlayTitle}
        >
          <Gamepad2 size={17} />
          <span>{t.brand.modePlay}</span>
        </button>
      </div>

      <div className="header-actions">
        <button className="btn-secondary header-action-btn" onClick={onOpenExportModal} title={t.brand.btnExportTitle}>
          <FileText size={16} /> <span className="btn-text-responsive">{t.brand.btnExport}</span>
        </button>

        <button className="btn-secondary header-action-btn" onClick={onOpenUploadModal} title={t.brand.btnScreenshotTitle}>
          <Camera size={16} /> <span className="btn-text-responsive">{t.brand.btnScreenshot}</span>
        </button>

        <button className="btn-icon header-action-btn" onClick={onOpenHelpModal} title={t.brand.btnHelpTitle}>
          <HelpCircle size={18} />
        </button>

        <button
          className="btn-secondary header-action-btn lang-toggle-btn"
          onClick={toggleLang}
          title={t.brand.switchLangTitle}
          style={{ gap: 5 }}
        >
          <Languages size={16} />
          <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{lang === 'zh-TW' ? 'EN' : '繁中'}</span>
        </button>
      </div>
    </header>
  );
};

