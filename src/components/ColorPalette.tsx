import React from 'react';
import { DEFAULT_COLORS } from '../logic/presets';
import type { RegionColor, EditTool } from '../types/game';
import { Paintbrush, PaintBucket, RotateCcw, Undo2, Redo2 } from 'lucide-react';
import { useI18n } from '../i18n';

interface ColorPaletteProps {
  gridSize: number;
  selectedColorId: number;
  colors?: RegionColor[];
  editTool: EditTool;
  colorCounts?: Record<number, number>;
  onSelectColor: (colorId: number) => void;
  onChangeEditTool: (tool: EditTool) => void;
  onResetBoard?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const ColorPalette: React.FC<ColorPaletteProps> = ({
  gridSize,
  selectedColorId,
  colors = DEFAULT_COLORS,
  editTool,
  colorCounts = {},
  onSelectColor,
  onChangeEditTool,
  onResetBoard,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}) => {
  const { lang, t, interpolate } = useI18n();

  // 優先使用自訂真實色彩，不足則用預設色彩補足
  const activeColors =
    colors && colors.length >= gridSize
      ? colors.slice(0, gridSize)
      : DEFAULT_COLORS.slice(0, gridSize);

  const getColorName = (color: RegionColor) => {
    if (lang === 'en') {
      return color.nameEn || t.colors[color.id] || color.name;
    }
    return color.name;
  };

  return (
    <div className="palette-toolbar">
      <div className="palette-header">
        <div className="palette-header-left">
          <Paintbrush size={16} className="palette-icon" />
          <span className="palette-title">
            {interpolate(t.editMode.paletteTitle, { n: gridSize })}
          </span>
        </div>

        {/* 筆刷工具與歷史動作 */}
        <div className="palette-actions">
          {/* 筆刷 / 油漆桶切換 */}
          <div className="edit-tool-toggle-group">
            <button
              type="button"
              className={`tool-toggle-btn ${editTool === 'BRUSH' ? 'active' : ''}`}
              onClick={() => onChangeEditTool('BRUSH')}
              title={t.editMode.toolBrush}
            >
              <Paintbrush size={15} />
              <span className="tool-text">{t.editMode.toolBrush}</span>
            </button>
            <button
              type="button"
              className={`tool-toggle-btn ${editTool === 'BUCKET' ? 'active' : ''}`}
              onClick={() => onChangeEditTool('BUCKET')}
              title={t.editMode.toolBucket}
            >
              <PaintBucket size={15} />
              <span className="tool-text">{t.editMode.toolBucket}</span>
            </button>
          </div>

          {/* 復原 / 重做 */}
          {(onUndo || onRedo) && (
            <div className="palette-history-btns">
              {onUndo && (
                <button
                  type="button"
                  className="btn-icon history-btn"
                  onClick={onUndo}
                  disabled={!canUndo}
                  title={t.editMode.undo}
                  aria-label={t.editMode.undo}
                >
                  <Undo2 size={15} />
                </button>
              )}
              {onRedo && (
                <button
                  type="button"
                  className="btn-icon history-btn"
                  onClick={onRedo}
                  disabled={!canRedo}
                  title={t.editMode.redo}
                  aria-label={t.editMode.redo}
                >
                  <Redo2 size={15} />
                </button>
              )}
            </div>
          )}

          {/* 清空重設 */}
          {onResetBoard && (
            <button
              type="button"
              className="btn-icon palette-reset-btn"
              onClick={onResetBoard}
              title={t.editMode.btnResetBoardTitle}
              aria-label={t.editMode.btnResetBoardTitle}
            >
              <RotateCcw size={15} />
            </button>
          )}
        </div>
      </div>

      {/* 色彩選擇膠囊列表 */}
      <div className="color-pills-row" role="radiogroup" aria-label="Region Colors">
        {activeColors.map((color) => {
          const isSelected = selectedColorId === color.id;
          const colorName = getColorName(color);
          const count = colorCounts[color.id] || 0;
          const isZero = count === 0;

          return (
            <button
              key={color.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`color-pill ${isSelected ? 'active' : ''} ${isZero ? 'pill-empty' : ''}`}
              onClick={() => onSelectColor(color.id)}
              title={`${colorName} (${count} ${t.editMode.cellCountUnit})`}
              style={isSelected ? { borderColor: color.borderHex || color.hex } : undefined}
            >
              <span
                className="color-dot"
                style={{
                  backgroundColor: color.hex,
                  boxShadow: isSelected ? `0 0 8px ${color.hex}` : 'none',
                }}
              />
              <span className="color-pill-name">{colorName}</span>
              <span className={`color-pill-count ${isZero ? 'count-zero' : ''}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
