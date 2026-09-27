import React, { useState, useMemo } from 'react';
import { X, Copy, Check, FileText } from 'lucide-react';
import { CatIcon } from './icons';
import { generateBoardText } from '../logic/exportText';
import type { CellStatus, RegionColor } from '../types/game';
import { useI18n } from '../i18n';

interface ExportTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  regionGrid: number[][];
  playerGrid: CellStatus[][];
  colors: RegionColor[];
}

export const ExportTextModal: React.FC<ExportTextModalProps> = ({
  isOpen,
  onClose,
  regionGrid,
  playerGrid,
  colors,
}) => {
  const { lang, t } = useI18n();
  const [includeProgress, setIncludeProgress] = useState(false);
  const [copied, setCopied] = useState(false);

  // 動態生成匯出文字
  const exportedText = useMemo(() => {
    if (!isOpen) return '';
    return generateBoardText(regionGrid, {
      includeProgress,
      playerGrid,
      colors,
      lang,
    });
  }, [isOpen, regionGrid, playerGrid, colors, includeProgress, lang]);

  if (!isOpen) return null;

  // 處理複製至剪貼簿
  const handleCopy = async () => {
    let success = false;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(exportedText);
        success = true;
      }
    } catch (err) {
      console.warn('navigator.clipboard 寫入受阻，嘗試 fallback 複製方式', err);
    }

    if (!success) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = exportedText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (fallbackErr) {
        console.error('備用複製失敗:', fallbackErr);
      }
    }

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 680, width: '92%' }}>
        {/* Modal 頂部標題列 */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="brand-icon" style={{ width: 36, height: 36, fontSize: 18 }}>
              <FileText size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>{t.exportModal.title}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {t.exportModal.subtitle}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} title={t.exportModal.btnClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal 內容區 */}
        <div className="modal-body" style={{ gap: 14 }}>
          {/* 選項開關 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-panel)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={includeProgress}
                onChange={(e) => setIncludeProgress(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#e47535' }}
              />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {t.exportModal.includeProgressLabel} <CatIcon size={16} />
              </span>
            </label>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {includeProgress ? t.exportModal.includeProgressStatusTrue : t.exportModal.includeProgressStatusFalse}
            </span>
          </div>

          {/* 文字預覽區 */}
          <div style={{ position: 'relative' }}>
            <textarea
              readOnly
              value={exportedText}
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              style={{
                width: '100%',
                height: 280,
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-app)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-light)',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '0.86rem',
                lineHeight: '1.55',
                resize: 'vertical',
                boxSizing: 'border-box',
                outline: 'none',
                whiteSpace: 'pre',
                overflowX: 'auto',
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: 12,
                top: 10,
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                background: 'var(--bg-card)',
                padding: '2px 8px',
                borderRadius: 4,
                border: '1px solid var(--border-light)',
                pointerEvents: 'none',
              }}
            >
              {t.exportModal.selectAllTip}
            </div>
          </div>

          {/* 底部操作按鈕 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 12,
              paddingTop: 8,
            }}
          >
            <button className="btn-secondary" onClick={onClose} style={{ padding: '8px 16px' }}>
              {t.exportModal.btnClose}
            </button>
            <button
              className="btn-primary"
              onClick={handleCopy}
              style={{
                padding: '8px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: copied ? '#2e7d32' : undefined,
                borderColor: copied ? '#2e7d32' : undefined,
                transition: 'all 0.2s ease',
              }}
            >
              {copied ? (
                <>
                  <Check size={16} />
                  <span>{t.exportModal.copiedText}</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>{t.exportModal.btnCopy}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

