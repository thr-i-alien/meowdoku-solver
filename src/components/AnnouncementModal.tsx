import React from 'react';
import { X, Sparkles, Camera, ArrowRight, Check, Paintbrush } from 'lucide-react';
import { PawIcon, CrossIcon } from './icons';
import { useI18n } from '../i18n';

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenScreenshotUpload: () => void;
}

export const ANNOUNCEMENT_STORAGE_KEY = 'meowdoku_update_announcement_seen_v2';

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  isOpen,
  onClose,
  onOpenScreenshotUpload,
}) => {
  const { t } = useI18n();

  if (!isOpen) return null;

  const markAsSeenAndClose = () => {
    try {
      localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, 'true');
    } catch {
      // 避免某些無痕模式下 localStorage 拋出錯誤
    }
    onClose();
  };

  const handleTryScreenshot = () => {
    markAsSeenAndClose();
    onOpenScreenshotUpload();
  };

  return (
    <div className="modal-overlay announcement-modal-overlay" onClick={markAsSeenAndClose}>
      <div
        className="modal-content announcement-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 頂部裝飾背景微光 */}
        <div className="announcement-glow-header" />

        <div className="modal-header announcement-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="announcement-badge">
              <Sparkles size={14} className="sparkle-spin" />
              <span>{t.announcementModal.badge}</span>
            </div>
            <h3 className="announcement-title">{t.announcementModal.title}</h3>
            <p className="announcement-subtitle">{t.announcementModal.subtitle}</p>
          </div>
          <button
            className="btn-icon"
            onClick={markAsSeenAndClose}
            aria-label="關閉公告"
            style={{ alignSelf: 'flex-start' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body announcement-body">
          {/* 特色 1：遊戲進度智慧還原 */}
          <div className="announcement-card card-progress">
            <div className="card-icon-wrapper icon-paw">
              <PawIcon size={22} color="#e47535" />
            </div>
            <div className="card-text-wrapper">
              <h4 className="card-title">
                {t.announcementModal.feature1Title}
                <span className="card-tag">NEW</span>
              </h4>
              <p className="card-desc">{t.announcementModal.feature1Desc}</p>
            </div>
          </div>

          {/* 特色 2：自訂地圖編輯器 */}
          <div className="announcement-card card-editor">
            <div className="card-icon-wrapper icon-editor">
              <Paintbrush size={20} color="#8a5cd6" />
            </div>
            <div className="card-text-wrapper">
              <h4 className="card-title">
                {t.announcementModal.feature2Title}
                <span className="card-tag">NEW</span>
              </h4>
              <p className="card-desc">{t.announcementModal.feature2Desc}</p>
            </div>
          </div>

          {/* 特色 3：全尺寸截圖智慧適配 */}
          <div className="announcement-card card-vision">
            <div className="card-icon-wrapper icon-camera">
              <Camera size={22} color="#4ea1b8" />
            </div>
            <div className="card-text-wrapper">
              <h4 className="card-title">{t.announcementModal.feature3Title}</h4>
              <p className="card-desc">{t.announcementModal.feature3Desc}</p>
            </div>
          </div>

          {/* 特色 4：預覽微調與純白標記 */}
          <div className="announcement-card card-marks">
            <div className="card-icon-wrapper icon-cross">
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: '#b36a81',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CrossIcon size={16} color="#ffffff" strokeWidth={4} />
              </div>
            </div>
            <div className="card-text-wrapper">
              <h4 className="card-title">{t.announcementModal.feature4Title}</h4>
              <p className="card-desc">{t.announcementModal.feature4Desc}</p>
            </div>
          </div>
        </div>

        <div className="modal-footer announcement-footer">
          <button className="btn-secondary announcement-btn-secondary" onClick={markAsSeenAndClose}>
            <Check size={16} />
            <span>{t.announcementModal.btnGotIt}</span>
          </button>
          <button className="btn-primary announcement-btn-primary" onClick={handleTryScreenshot}>
            <Camera size={16} />
            <span>{t.announcementModal.btnTryNow}</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
