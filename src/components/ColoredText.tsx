import React, { useMemo } from 'react';
import type { RegionColor } from '../types/game';
import { DEFAULT_COLORS } from '../logic/presets';
import { en } from '../i18n/locales/en';

export interface ColoredTextProps {
  text: string;
  colors?: RegionColor[];
  className?: string;
}

/**
 * 依據背景色彩計算高對比度文字顏色（純白或深墨黑），確保在深淺色區域下皆有最佳閱讀性
 */
export function getContrastTextColor(hexColor: string): string {
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  // YIQ 亮度加權公式
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 165 ? '#1a202c' : '#ffffff';
}

interface MatchEntry {
  name: string;
  color: RegionColor;
}

/**
 * 彙整全部已知顏色與區域對應名稱（含中、英文名與通用區域名稱）
 */
function buildColorEntries(colors: RegionColor[] = DEFAULT_COLORS): {
  entries: MatchEntry[];
  regex: RegExp | null;
} {
  const colorMap = new Map<number, RegionColor>();
  DEFAULT_COLORS.forEach((c) => colorMap.set(c.id, c));
  if (colors && colors.length > 0) {
    colors.forEach((c) => colorMap.set(c.id, c));
  }

  const entries: MatchEntry[] = [];
  const seenNames = new Set<string>();

  colorMap.forEach((color, id) => {
    const candidateNames: string[] = [];
    if (color.name) candidateNames.push(color.name);
    if (color.nameEn) candidateNames.push(color.nameEn);
    const enName = en.colors[id as unknown as keyof typeof en.colors];
    if (enName) candidateNames.push(enName);

    // 支援通用區域名稱
    candidateNames.push(`區域 ${id + 1}`, `區域${id + 1}`);
    candidateNames.push(`Region ${id + 1}`, `Region${id + 1}`);

    for (const name of candidateNames) {
      const trimmed = name.trim();
      const lower = trimmed.toLowerCase();
      if (trimmed && !seenNames.has(lower)) {
        seenNames.add(lower);
        entries.push({ name: trimmed, color });
      }
    }
  });

  // 按長度由長至短排序，避免子字串提前比對
  entries.sort((a, b) => b.name.length - a.name.length);

  if (entries.length === 0) {
    return { entries: [], regex: null };
  }

  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patternList = entries.map((e) => {
    const escaped = escapeRegExp(e.name);
    if (/^[a-zA-Z0-9\s]+$/.test(e.name)) {
      return `\\b${escaped}\\b`;
    }
    return escaped;
  });

  const regex = new RegExp(`(${patternList.join('|')})`, 'gi');
  return { entries, regex };
}

/**
 * 將包含顏色名稱的字串轉為帶有該顏色底色標籤的 ReactNode
 */
export function renderColoredText(
  text: string,
  colors: RegionColor[] = DEFAULT_COLORS
): React.ReactNode {
  if (!text) return text;

  const { entries, regex } = buildColorEntries(colors);
  if (!regex) return text;

  const parts = text.split(regex);
  if (parts.length <= 1) return text;

  return parts.map((part, index) => {
    if (!part) return null;
    const lower = part.toLowerCase();
    const matched = entries.find((e) => e.name.toLowerCase() === lower);

    if (matched) {
      const color = matched.color;
      const bg = color.bgHex || color.hex;
      const border = color.borderHex || color.hex;
      const textColor = getContrastTextColor(bg);

      return (
        <span
          key={index}
          className="color-pill-tag"
          style={{
            backgroundColor: bg,
            color: textColor,
            borderColor: border,
          }}
          title={matched.name}
        >
          {part}
        </span>
      );
    }

    return part;
  });
}

/**
 * 顏色高亮文字元件
 */
export const ColoredText: React.FC<ColoredTextProps> = ({
  text,
  colors = DEFAULT_COLORS,
  className,
}) => {
  const content = useMemo(() => renderColoredText(text, colors), [text, colors]);

  if (className) {
    return <span className={className}>{content}</span>;
  }
  return <>{content}</>;
};
