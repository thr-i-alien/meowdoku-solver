import React from 'react';
import { DEFAULT_COLORS } from '../logic/presets';
import type { RegionColor } from '../types/game';
import { Paintbrush, RotateCcw } from 'lucide-react';
import { useI18n } from '../i18n';

interface ColorPaletteProps {
  gridSize: number;
  selectedColorId: number;
  colors?: RegionColor[];
  onSelectColor: (colorId: number) => void;
  onResetBoard: () => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
}

export const ColorPalette: React.FC<ColorPaletteProps> = ({
  gridSize,
  selectedColorId,
  colors = DEFAULT_COLORS,
  onSelectColor,
  onResetBoard,
  isEditMode,
  onToggleEditMode,
}) => {
  const { lang, t, interpolate } = useI18n();

  // 優先使用自訂真實色彩，不足則用預設色彩補足
  const activeColors = colors && colors.length >= gridSize ? colors.slice(0, gridSize) : DEFAULT_COLORS.slice(0, gridSize);

  const getColorName = (color: RegionColor) => {
    if (lang === 'en') {
      return color.nameEn || t.colors[color.id] || color.name;
    }
    return color.name;
  };

  return (
    <div className="palette-toolbar">
      <div className="palette-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Paintbrush size={16} />
          <span>{interpolate(t.editMode.paletteTitle, { n: gridSize })}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn-secondary ${isEditMode ? 'active' : ''}`}
            onClick={onToggleEditMode}
            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
          >
            {isEditMode ? t.editMode.btnFinish : t.editMode.btnEdit}
          </button>
          <button
            className="btn-icon"
            onClick={onResetBoard}
            title={t.editMode.btnResetBoardTitle}
            style={{ width: 28, height: 28 }}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="color-pills-row">
        {activeColors.map((color) => {
          const isSelected = selectedColorId === color.id;
          const colorName = getColorName(color);
          return (
            <button
              key={color.id}
              className={`color-pill ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectColor(color.id)}
              title={colorName}
            >
              <span className="color-dot" style={{ backgroundColor: color.hex }} />
              <span>{colorName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

