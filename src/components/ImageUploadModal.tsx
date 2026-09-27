import React, { useState, useRef, useEffect } from 'react';
import {
  sampleGridFromImage,
  autoDetectBoardBounds,
  detectBoardAndDimension,
} from '../logic/imageRecognizer';
import type { CropBox } from '../logic/imageRecognizer';
import {
  Upload,
  X,
  Check,
  RefreshCw,
  Maximize2,
  Target,
  Palette,
  ClipboardPaste,
  Camera,
  Laptop,
  Sparkles,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DEFAULT_COLORS } from '../logic/presets';
import type { RegionColor } from '../types/game';
import { useI18n } from '../i18n';


interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyGrid: (grid: number[][], size: number, detectedColors?: RegionColor[]) => void;
  initialSize: number;
}

type DragAction =
  | 'move'
  | 'resize-nw'
  | 'resize-ne'
  | 'resize-sw'
  | 'resize-se'
  | 'resize-n'
  | 'resize-s'
  | 'resize-w'
  | 'resize-e'
  | null;

const ALLOWED_GRID_SIZES = [4, 5, 6, 7, 8, 9, 10, 11, 12];

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
  onApplyGrid,
  initialSize,
}) => {
  const { lang, t, interpolate } = useI18n();
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const [gridSize, setGridSize] = useState<number>(() => {
    return Math.max(4, Math.min(12, initialSize || 8));
  });
  const [cropBox, setCropBox] = useState<CropBox>({
    x: 3.5,
    y: 25.5,
    width: 93,
    height: 71,
  });

  // 當彈窗開啟或外部傳入 initialSize 變更時，確保維持在 4~12 範圍內
  useEffect(() => {
    if (isOpen) {
      setGridSize((prev) => {
        const validInitial = Math.max(4, Math.min(12, initialSize || 8));
        return prev >= 4 && prev <= 12 ? prev : validInitial;
      });
    }
  }, [isOpen, initialSize]);

  const [recognizedGrid, setRecognizedGrid] = useState<number[][] | null>(null);
  const [detectedColors, setDetectedColors] = useState<RegionColor[]>([]);
  const [selectedCorrectionColorId, setSelectedCorrectionColorId] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectionNotice, setDetectionNotice] = useState<{ text: string; dimension: number } | null>(null);
  const [isFineTuneOpen, setIsFineTuneOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });

  const getDisplayColorName = (color?: RegionColor, defaultIdx = 0) => {
    if (!color) return interpolate(t.uploadModal.defaultPaletteName, { n: defaultIdx + 1 });
    if (lang === 'en') {
      return color.nameEn || t.colors[color.id] || color.name;
    }
    return color.name;
  };
  const processNewImageBlobRef = useRef<(blob: Blob) => void>(() => {});
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 拖曳狀態管理
  const [dragAction, setDragAction] = useState<DragAction>(null);
  const dragActionRef = useRef<DragAction>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const cropStartRef = useRef<CropBox | null>(null);
  const cropBoxRef = useRef<CropBox>(cropBox);
  cropBoxRef.current = cropBox;

  // 監聽剪貼簿貼上事件 (Ctrl+V)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      // 1. 優先從 items 提取圖片
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              e.preventDefault();
              processNewImageBlobRef.current(file);
              return;
            }
          }
        }
      }
      // 2. 備用：從 files 提取圖片
      const files = e.clipboardData?.files;
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          if (files[i].type.startsWith('image/')) {
            e.preventDefault();
            processNewImageBlobRef.current(files[i]);
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [isOpen]);

  // 防抖自動重新辨識 (非拖曳中且非初次全自動偵測中才觸發，避免覆蓋自動偵測維度)
  useEffect(() => {
    if (isOpen && imageSrc && !dragAction && !isProcessing) {
      const timer = setTimeout(() => {
        handleRecognize();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, imageSrc, gridSize, cropBox.width, cropBox.height, cropBox.x, cropBox.y, dragAction, isProcessing]);

  // 開啟彈窗時重置滾動位置
  useEffect(() => {
    if (isOpen) {
      const bodyEl = document.querySelector('.image-upload-modal-body');
      if (bodyEl) {
        bodyEl.scrollTop = 0;
      }
    }
  }, [isOpen]);

  // 全域 Pointer Events 拖曳監聽 (完美支援手機觸控與桌面滑鼠，滑出邊界也不丟失)
  useEffect(() => {
    if (!dragAction) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!dragActionRef.current || !dragStartRef.current || !cropStartRef.current || !containerRef.current) return;
      e.preventDefault();

      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const dxPercent = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
      const dyPercent = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;

      const start = cropStartRef.current;
      let newX = start.x;
      let newY = start.y;
      let newW = start.width;
      let newH = start.height;

      switch (dragActionRef.current) {
        case 'move':
          newX = Math.max(0, Math.min(100 - start.width, start.x + dxPercent));
          newY = Math.max(0, Math.min(100 - start.height, start.y + dyPercent));
          break;
        case 'resize-se':
          newW = Math.max(8, Math.min(100 - start.x, start.width + dxPercent));
          newH = Math.max(8, Math.min(100 - start.y, start.height + dyPercent));
          break;
        case 'resize-sw':
          newX = Math.max(0, Math.min(start.x + start.width - 8, start.x + dxPercent));
          newW = start.width - (newX - start.x);
          newH = Math.max(8, Math.min(100 - start.y, start.height + dyPercent));
          break;
        case 'resize-ne':
          newW = Math.max(8, Math.min(100 - start.x, start.width + dxPercent));
          newY = Math.max(0, Math.min(start.y + start.height - 8, start.y + dyPercent));
          newH = start.height - (newY - start.y);
          break;
        case 'resize-nw':
          newX = Math.max(0, Math.min(start.x + start.width - 8, start.x + dxPercent));
          newY = Math.max(0, Math.min(start.y + start.height - 8, start.y + dyPercent));
          newW = start.width - (newX - start.x);
          newH = start.height - (newY - start.y);
          break;
        case 'resize-n':
          newY = Math.max(0, Math.min(start.y + start.height - 8, start.y + dyPercent));
          newH = start.height - (newY - start.y);
          break;
        case 'resize-s':
          newH = Math.max(8, Math.min(100 - start.y, start.height + dyPercent));
          break;
        case 'resize-w':
          newX = Math.max(0, Math.min(start.x + start.width - 8, start.x + dxPercent));
          newW = start.width - (newX - start.x);
          break;
        case 'resize-e':
          newW = Math.max(8, Math.min(100 - start.x, start.width + dxPercent));
          break;
      }

      setCropBox({
        x: Math.round(newX * 10) / 10,
        y: Math.round(newY * 10) / 10,
        width: Math.round(newW * 10) / 10,
        height: Math.round(newH * 10) / 10,
      });
    };

    const handlePointerUp = () => {
      dragActionRef.current = null;
      dragStartRef.current = null;
      cropStartRef.current = null;
      setDragAction(null);
      // 放開手柄後立即辨識
      handleRecognize();
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [dragAction]);

  if (!isOpen) return null;

  const handleRecognize = () => {
    if (!imgRef.current) return;
    setIsProcessing(true);
    try {
      const { grid, detectedColors: colors } = sampleGridFromImage(imgRef.current, cropBoxRef.current, gridSize);
      setRecognizedGrid(grid);
      setDetectedColors(colors);
    } catch (err) {
      console.error('辨識失敗:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // 電腦視覺辨識管線 (Computer Vision Pipeline)：一鍵全自動偵測棋盤外框與網格維度
  const handleAutoDetectAll = (customImg?: HTMLImageElement) => {
    const targetImg = customImg || imgRef.current;
    if (!targetImg) return;
    setIsProcessing(true);
    try {
      const result = detectBoardAndDimension(targetImg, gridSize);
      setCropBox(result.cropBox);
      cropBoxRef.current = result.cropBox;
      setGridSize(result.dimension);

      const { grid, detectedColors: colors } = sampleGridFromImage(
        targetImg,
        result.cropBox,
        result.dimension
      );
      setRecognizedGrid(grid);
      setDetectedColors(colors);

      setDetectionNotice({
        text: `${t.uploadModal.detectNoticePrefix}${result.dimension}×${result.dimension}${t.uploadModal.detectNoticeSuffix}`,
        dimension: result.dimension,
      });
    } catch (err) {
      console.error('全自動辨識失敗:', err);
      handleRecognize();
    } finally {
      setIsProcessing(false);
    }
  };

  // 統一處理載入新圖片 (包含：檔案選取、剪貼簿貼上 Ctrl+V、拖曳 Drop)
  // 使用原生 Image 物件預先解析，確保 100% 觸發「全自動棋盤與維度偵測」，不受 DOM 快取或生命週期競爭影響
  const processNewImageBlob = (blob: Blob) => {
    setIsProcessing(true);
    setDetectionNotice(null);
    setRecognizedGrid(null);
    setDetectedColors([]);

    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      setImageSrc(url);
      handleAutoDetectAll(img);
    };

    img.onerror = (err) => {
      console.error('圖片載入失敗:', err);
      setIsProcessing(false);
      alert(
        lang === 'en'
          ? 'Failed to load image. Please verify the image file format.'
          : '圖片載入失敗，請確認檔案格式是否正確。'
      );
    };

    img.src = url;
  };
  processNewImageBlobRef.current = processNewImageBlob;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processNewImageBlob(file);
    }
    e.target.value = '';
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        alert(
          lang === 'en'
            ? 'Your browser does not support direct clipboard reading. Please click "Select Photo / File"!'
            : '您的瀏覽器不支援直接讀取剪貼簿圖片，請直接點擊「從相簿 / 檔案選取」！'
        );
        return;
      }
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((type) => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          processNewImageBlob(blob);
          return;
        }
      }
      alert(
        lang === 'en'
          ? 'No image found in clipboard! Please copy a screenshot or pick a photo from your files.'
          : '剪貼簿中未偵測到圖片！若剛才已截圖，可直接點擊「從相簿 / 檔案選取」。'
      );
    } catch (err) {
      console.warn('讀取剪貼簿失敗或權限被拒:', err);
      alert(
        lang === 'en'
          ? 'Unable to access clipboard (permission might be required).\nYou can directly click "Select Photo / File"!'
          : '無法存取剪貼簿（可能需要允許貼上權限）。\n您也可以直接點擊「從相簿 / 檔案選取」快速選取截圖！'
      );
    }
  };

  const handleImageLoaded = () => {
    // DOM 圖片載入完成，若尚未有辨識結果則執行預設採樣
    if (!recognizedGrid && imgRef.current) {
      handleRecognize();
    }
  };

  // 開始拖曳 (本體移動或 8 個手柄縮放)
  const handleStartDrag = (action: DragAction, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragActionRef.current = action;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    cropStartRef.current = { ...cropBoxRef.current };
    setDragAction(action);
  };

  // 步進微調按鈕
  const adjustCrop = (field: 'x' | 'y' | 'width' | 'height', delta: number) => {
    setCropBox((prev) => {
      const next = { ...prev };
      if (field === 'x') {
        const val = Math.max(0, Math.min(100 - prev.width, prev.x + delta));
        next.x = Math.round(val * 10) / 10;
      } else if (field === 'y') {
        const val = Math.max(0, Math.min(100 - prev.height, prev.y + delta));
        next.y = Math.round(val * 10) / 10;
      } else if (field === 'width') {
        const val = Math.max(8, Math.min(100 - prev.x, prev.width + delta));
        next.width = Math.round(val * 10) / 10;
      } else if (field === 'height') {
        const val = Math.max(8, Math.min(100 - prev.y, prev.height + delta));
        next.height = Math.round(val * 10) / 10;
      }
      return next;
    });
  };

  // 一鍵自動偵測去除白邊，貼齊棋盤外框
  const handleAutoFit = () => {
    if (!imgRef.current) return;
    const fitted = autoDetectBoardBounds(imgRef.current, cropBox);
    setCropBox(fitted);
  };

  // 手動單格點擊校正顏色
  const handleCorrectCell = (r: number, c: number) => {
    if (!recognizedGrid) return;
    const next = recognizedGrid.map((row, ri) =>
      row.map((cell, ci) => (ri === r && ci === c ? selectedCorrectionColorId : cell))
    );
    setRecognizedGrid(next);
  };

  const handleApply = () => {
    if (recognizedGrid) {
      onApplyGrid(recognizedGrid, gridSize, detectedColors);
      onClose();
    }
  };

  return (
    <div className="modal-overlay image-upload-modal-overlay">
      <div className="modal-content image-upload-modal-content">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="brand-icon" style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Camera size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, lineHeight: 1.2 }}>{t.uploadModal.title}</h3>
              <p className="modal-header-desc">
                {t.uploadModal.subtitle}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="關閉彈窗">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body image-upload-modal-body">
          {!imageSrc ? (
            /* 狀態 A: 尚未載入截圖 — 專注於選取維度與匯入圖片 */
            <div className="upload-initial-view">
              <div className="tools-dimension-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <span className="dimension-title">{t.uploadModal.dimensionLabel}</span>
                  <div className="matrix-size-selector">
                    {ALLOWED_GRID_SIZES.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        className={`size-btn ${gridSize === sz ? 'active' : ''}`}
                        onClick={() => setGridSize(sz)}
                        title={`${sz}×${sz}`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div
                className="cropper-container cropper-empty-dropzone"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.startsWith('image/')) {
                    processNewImageBlob(file);
                  }
                }}
              >
                <div className="dropzone-icon">
                  <Upload size={32} />
                </div>

                <div className="dropzone-text">
                  <div className="dropzone-title">
                    {t.uploadModal.dropzoneTitle}
                  </div>
                  <div className="dropzone-sub">
                    {t.uploadModal.dropzoneSub}
                  </div>
                </div>

                <div className="dropzone-btn-group">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handlePasteFromClipboard}
                    style={{ padding: '10px 18px', fontSize: '0.92rem' }}
                  >
                    <ClipboardPaste size={17} /> {t.uploadModal.btnPaste}
                  </button>

                  <label className="btn-secondary" style={{ cursor: 'pointer', padding: '10px 18px', fontSize: '0.92rem' }}>
                    <Upload size={17} /> {t.uploadModal.btnSelectFile}
                    <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>
                </div>

                <div className="dropzone-hint" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Laptop size={15} style={{ flexShrink: 0 }} />
                  <span>{t.uploadModal.dropzoneHint}</span>
                </div>
              </div>
            </div>
          ) : (
            /* 狀態 B: 已載入截圖 — 展開裁切舞台、微調控制項與辨識結果 */
            <>
              {/* 控制工具列 */}
              <div className="modal-tools-bar">
                <div className="tools-upload-group">
                  <label className="btn-secondary" style={{ cursor: 'pointer' }}>
                    <Upload size={15} style={{ flexShrink: 0 }} />
                    <span className="btn-upload-text">{t.uploadModal.btnChangeImg}</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handlePasteFromClipboard}
                    title={t.uploadModal.btnPasteToolbar}
                  >
                    <ClipboardPaste size={15} style={{ flexShrink: 0 }} />
                    <span className="btn-upload-text">{t.uploadModal.btnPasteToolbar}</span>
                  </button>

                  <button
                    type="button"
                    className="btn-secondary btn-clear-img"
                    onClick={() => {
                      setImageSrc(null);
                      setRecognizedGrid(null);
                      setDetectedColors([]);
                      setDetectionNotice(null);
                    }}
                    title={t.uploadModal.btnClearImg}
                  >
                    <X size={15} style={{ flexShrink: 0 }} />
                    <span className="btn-upload-text">{t.uploadModal.btnClearImg}</span>
                  </button>
                </div>

                <div className="tools-dimension-group">
                  <span className="dimension-label">{t.uploadModal.dimensionLabel}</span>
                  <div className="matrix-size-selector">
                    {ALLOWED_GRID_SIZES.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        className={`size-btn ${gridSize === sz ? 'active' : ''}`}
                        onClick={() => setGridSize(sz)}
                        title={`${sz}×${sz}`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 圖片預覽與裁切區 */}
              <div className="modal-image-grid">
                <div className="cropper-column">
                  <div className="cropper-column-header">
                    <span className="cropper-step-title">
                      {t.uploadModal.step1Title}
                    </span>
                    <div className="cropper-quick-actions">
                      <button
                        type="button"
                        className="btn-secondary btn-quick-autodetect"
                        onClick={() => handleAutoDetectAll()}
                        title={t.uploadModal.btnAutoDetectAll}
                        style={{
                          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.12) 100%)',
                          color: '#4f46e5',
                          borderColor: '#c7d2fe',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <Sparkles size={13} style={{ color: '#6366f1' }} /> {t.uploadModal.btnAutoDetectAll}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary btn-quick-fit"
                        onClick={handleAutoFit}
                        title={t.uploadModal.btnAutoFit}
                      >
                        <Target size={13} /> {t.uploadModal.btnAutoFit}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary btn-quick-full"
                        onClick={() => setCropBox({ x: 1.5, y: 1.5, width: 97, height: 97 })}
                        title={t.uploadModal.btnFullCover}
                      >
                        <Maximize2 size={13} /> {t.uploadModal.btnFullCover}
                      </button>
                    </div>
                  </div>

                  {detectionNotice && (
                    <div
                      style={{
                        padding: '6px 12px',
                        marginBottom: 10,
                        borderRadius: 8,
                        background: '#e0e7ff',
                        color: '#3730a3',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Sparkles size={14} style={{ color: '#4f46e5', flexShrink: 0 }} />
                        <span>{detectionNotice.text}</span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#6366f1', opacity: 0.9 }}>{t.uploadModal.canFineTuneTip}</span>
                    </div>
                  )}

                  <div className="cropper-container">
                    <div
                      className="cropper-stage"
                      ref={containerRef}
                    >
                      <img
                        ref={imgRef}
                        src={imageSrc}
                        alt={t.uploadModal.previewImgAlt}
                        className="cropper-img"
                        onLoad={handleImageLoaded}
                        crossOrigin="anonymous"
                      />

                      {/* 裁切框本體 (支援手指/滑鼠拖曳平移) */}
                      <div
                        className={`crop-rect ${dragAction ? 'is-dragging' : ''}`}
                        style={{
                          left: `${cropBox.x}%`,
                          top: `${cropBox.y}%`,
                          width: `${cropBox.width}%`,
                          height: `${cropBox.height}%`,
                        }}
                        onPointerDown={(e) => handleStartDrag('move', e)}
                      >
                        {/* 8 個 Resize Handles (全支援 Pointer Events 與超大觸控熱區) */}
                        <div
                          className={`crop-handle crop-handle-nw ${dragAction === 'resize-nw' ? 'active' : ''}`}
                          onPointerDown={(e) => handleStartDrag('resize-nw', e)}
                          title={t.uploadModal.cropHandleNW}
                        />
                        <div
                          className={`crop-handle crop-handle-n ${dragAction === 'resize-n' ? 'active' : ''}`}
                          onPointerDown={(e) => handleStartDrag('resize-n', e)}
                          title={t.uploadModal.cropHandleN}
                        />
                        <div
                          className={`crop-handle crop-handle-ne ${dragAction === 'resize-ne' ? 'active' : ''}`}
                          onPointerDown={(e) => handleStartDrag('resize-ne', e)}
                          title={t.uploadModal.cropHandleNE}
                        />
                        <div
                          className={`crop-handle crop-handle-w ${dragAction === 'resize-w' ? 'active' : ''}`}
                          onPointerDown={(e) => handleStartDrag('resize-w', e)}
                          title={t.uploadModal.cropHandleW}
                        />
                        <div
                          className={`crop-handle crop-handle-e ${dragAction === 'resize-e' ? 'active' : ''}`}
                          onPointerDown={(e) => handleStartDrag('resize-e', e)}
                          title={t.uploadModal.cropHandleE}
                        />
                        <div
                          className={`crop-handle crop-handle-sw ${dragAction === 'resize-sw' ? 'active' : ''}`}
                          onPointerDown={(e) => handleStartDrag('resize-sw', e)}
                          title={t.uploadModal.cropHandleSW}
                        />
                        <div
                          className={`crop-handle crop-handle-s ${dragAction === 'resize-s' ? 'active' : ''}`}
                          onPointerDown={(e) => handleStartDrag('resize-s', e)}
                          title={t.uploadModal.cropHandleS}
                        />
                        <div
                          className={`crop-handle crop-handle-se ${dragAction === 'resize-se' ? 'active' : ''}`}
                          onPointerDown={(e) => handleStartDrag('resize-se', e)}
                          title={t.uploadModal.cropHandleSE}
                        />

                        <div
                          className="crop-grid-overlay"
                          style={{
                            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                            gridTemplateRows: `repeat(${gridSize}, 1fr)`,
                          }}
                        >
                          {Array.from({ length: gridSize * gridSize }).map((_, i) => (
                            <div key={i} className="crop-grid-cell" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 滑桿精確微調控制區 (含步進按鈕) */}
                  <div className={`crop-controls-card ${!isFineTuneOpen ? 'is-collapsed' : ''}`}>
                    <div
                      className="slider-card-header"
                      onClick={() => setIsFineTuneOpen((prev) => !prev)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setIsFineTuneOpen((prev) => !prev);
                        }
                      }}
                    >
                      <div className="slider-card-title-wrap">
                        <Sliders size={13} style={{ color: 'var(--accent-orange)' }} />
                        <span className="slider-card-title">
                          {t.uploadModal.sliderCardTitle}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn-toggle-sliders"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsFineTuneOpen((prev) => !prev);
                        }}
                        title={isFineTuneOpen ? t.uploadModal.hideFineTune : t.uploadModal.showFineTune}
                      >
                        <span>{isFineTuneOpen ? t.uploadModal.hideFineTune : t.uploadModal.showFineTune}</span>
                        {isFineTuneOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </div>

                    {isFineTuneOpen && (
                      <div className="slider-control-group">
                      <div className="slider-item">
                        <div className="slider-item-header">
                          <span>{interpolate(t.uploadModal.sliderX, { val: cropBox.x })}</span>
                          <div className="slider-step-btns">
                            <button type="button" className="btn-step" onClick={() => adjustCrop('x', -0.5)} title="-0.5%">-</button>
                            <button type="button" className="btn-step" onClick={() => adjustCrop('x', 0.5)} title="+0.5%">+</button>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100 - cropBox.width}
                          step={0.5}
                          value={cropBox.x}
                          onChange={(e) => setCropBox({ ...cropBox, x: parseFloat(e.target.value) })}
                        />
                      </div>

                      <div className="slider-item">
                        <div className="slider-item-header">
                          <span>{interpolate(t.uploadModal.sliderY, { val: cropBox.y })}</span>
                          <div className="slider-step-btns">
                            <button type="button" className="btn-step" onClick={() => adjustCrop('y', -0.5)} title="-0.5%">-</button>
                            <button type="button" className="btn-step" onClick={() => adjustCrop('y', 0.5)} title="+0.5%">+</button>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100 - cropBox.height}
                          step={0.5}
                          value={cropBox.y}
                          onChange={(e) => setCropBox({ ...cropBox, y: parseFloat(e.target.value) })}
                        />
                      </div>

                      <div className="slider-item">
                        <div className="slider-item-header">
                          <span>{interpolate(t.uploadModal.sliderW, { val: cropBox.width })}</span>
                          <div className="slider-step-btns">
                            <button type="button" className="btn-step" onClick={() => adjustCrop('width', -0.5)} title="-0.5%">-</button>
                            <button type="button" className="btn-step" onClick={() => adjustCrop('width', 0.5)} title="+0.5%">+</button>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={8}
                          max={100 - cropBox.x}
                          step={0.5}
                          value={cropBox.width}
                          onChange={(e) => setCropBox({ ...cropBox, width: parseFloat(e.target.value) })}
                        />
                      </div>

                      <div className="slider-item">
                        <div className="slider-item-header">
                          <span>{interpolate(t.uploadModal.sliderH, { val: cropBox.height })}</span>
                          <div className="slider-step-btns">
                            <button type="button" className="btn-step" onClick={() => adjustCrop('height', -0.5)} title="-0.5%">-</button>
                            <button type="button" className="btn-step" onClick={() => adjustCrop('height', 0.5)} title="+0.5%">+</button>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={8}
                          max={100 - cropBox.y}
                          step={0.5}
                          value={cropBox.height}
                          onChange={(e) => setCropBox({ ...cropBox, height: parseFloat(e.target.value) })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

                {/* 即時辨識預覽結果 */}
                <div className="preview-column">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                      {interpolate(t.uploadModal.step2Title, { size: gridSize })}
                    </span>
                    <button
                      className="btn-secondary"
                      onClick={handleRecognize}
                      style={{
                        padding: '3px 9px',
                        fontSize: '0.75rem',
                      }}
                    >
                      <RefreshCw size={12} className={isProcessing ? 'spin' : ''} /> {t.uploadModal.btnReanalyze}
                    </button>
                  </div>

                  {/* 微調色票列 */}
                  {detectedColors.length > 0 && (
                    <div className="preview-correction-bar">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', fontWeight: 800 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-main)' }}>
                          <Palette size={12} color="var(--accent-orange)" /> {t.uploadModal.colorFixPrompt}
                        </span>
                        <span style={{ color: 'var(--accent-orange)', fontWeight: 800 }}>
                          {getDisplayColorName(detectedColors[selectedCorrectionColorId], selectedCorrectionColorId)}
                        </span>
                      </div>
                      <div className="preview-colors-list">
                        {detectedColors.map((color, idx) => {
                          const cName = getDisplayColorName(color, idx);
                          return (
                            <button
                              key={idx}
                              className={`preview-color-btn ${selectedCorrectionColorId === idx ? 'selected' : ''}`}
                              style={{ backgroundColor: color.bgHex }}
                              onClick={() => setSelectedCorrectionColorId(idx)}
                              title={cName}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {recognizedGrid ? (
                    <div
                      className="preview-grid-board"
                      style={{
                        display: 'grid',
                        gap: 3,
                        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                      }}
                    >
                      {recognizedGrid.map((row, r) =>
                        row.map((colorId, c) => {
                          const color =
                            detectedColors[colorId] || DEFAULT_COLORS[colorId % DEFAULT_COLORS.length];
                          const cName = getDisplayColorName(color, colorId);
                          return (
                            <div
                              key={`${r}-${c}`}
                              className="preview-cell-interactive"
                              style={{
                                backgroundColor: color.bgHex,
                                borderRadius: 4,
                                border: `1px solid ${color.borderHex}`,
                              }}
                              onClick={() => handleCorrectCell(r, c)}
                              title={`(${r + 1}, ${c + 1}) - ${cName}`}
                            />
                          );
                        })
                      )}
                    </div>
                  ) : (
                    <div className="preview-empty-state">
                      {isProcessing ? t.uploadModal.analyzingColors : t.uploadModal.emptyPreview}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            {t.uploadModal.btnCancel}
          </button>
          <button
            className="btn-primary btn-apply-board"
            onClick={handleApply}
            disabled={!recognizedGrid || !imageSrc}
          >
            <Check size={16} /> {t.uploadModal.btnApply}
          </button>
        </div>
      </div>
    </div>
  );
};

