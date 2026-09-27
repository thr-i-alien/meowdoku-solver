import type { CellStatus, RegionColor } from '../types/game';
import type { Language } from '../i18n/types';
import { en } from '../i18n/locales/en';

export interface ExportTextOptions {
  includeProgress?: boolean;
  playerGrid?: CellStatus[][];
  colors?: RegionColor[];
  lang?: Language;
}

/**
 * 將目前盤面題目與配置轉換成結構清晰的純文字，便於向其他人發問或分享
 */
export function generateBoardText(
  regionGrid: number[][],
  options: ExportTextOptions = {}
): string {
  const size = regionGrid.length;
  if (size === 0) return '';

  const { includeProgress = false, playerGrid, colors = [], lang = 'zh-TW' } = options;
  const isEn = lang === 'en';

  // 取得顏色名稱對照表
  const colorMap = new Map<number, string>();
  colors.forEach((c) => colorMap.set(c.id, c.name));

  const lines: string[] = [];

  // 1. 標題與盤面大小
  lines.push(isEn ? `[Meowdoku Cat Sudoku Puzzle]` : `【Meowdoku 貓咪數獨題目】`);
  lines.push(isEn ? `Board Size: ${size} × ${size}` : `盤面大小：${size} × ${size}`);
  lines.push('');

  // 2. 遊戲規則
  lines.push(isEn ? `[Basic Rules]` : `【基本規則】`);
  lines.push(
    isEn
      ? `1. Exactly one cat must be placed in each row, column, and colored region.`
      : `1. 每行（橫列）、每列（直欄）與每個「顏色區塊」內，恰好只能放置 1 隻貓咪。`
  );
  lines.push(
    isEn
      ? `2. No two cats may be adjacent, including horizontally, vertically, and diagonally (King's move restriction).`
      : `2. 任何兩隻貓咪不可相鄰，包括九宮格內的上下左右及四個斜對角方向（國王步距離不可碰觸）。`
  );
  lines.push('');

  // 3. 盤面區塊分佈矩陣
  lines.push(
    isEn
      ? `[Region Matrix (Numbers 0~${size - 1} represent colored regions)]`
      : `【盤面區塊矩陣 (數字 0~${size - 1} 代表各顏色區塊編號)】`
  );
  const maxDigits = String(size - 1).length;
  for (let r = 0; r < size; r++) {
    const rowStr = regionGrid[r]
      .map((val) => String(val).padStart(maxDigits, ' '))
      .join(' ');
    lines.push(rowStr);
  }
  lines.push('');

  // 4. 各顏色區塊包含的 (列, 欄) 座標清單 (1-indexed)
  const regionCellsMap = new Map<number, { r: number; c: number }[]>();
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const regionId = regionGrid[r][c];
      if (!regionCellsMap.has(regionId)) {
        regionCellsMap.set(regionId, []);
      }
      regionCellsMap.get(regionId)!.push({ r: r + 1, c: c + 1 });
    }
  }

  const sortedRegionIds = Array.from(regionCellsMap.keys()).sort((a, b) => a - b);
  lines.push(
    isEn
      ? `[Region Coordinates (Format: (Row, Col), 1-indexed)]`
      : `【各顏色區塊包含座標 (格式: (列, 欄)，1-indexed)】`
  );
  for (const regId of sortedRegionIds) {
    const cells = regionCellsMap.get(regId) || [];
    const rawColor = isEn ? (en.colors[regId] || colorMap.get(regId)) : colorMap.get(regId);
    const colorName = rawColor ? ` (${rawColor})` : '';
    const coordsStr = cells.map((cell) => `(${cell.r}, ${cell.c})`).join(', ');
    lines.push(
      isEn
        ? `- Region ${regId}${colorName} [${cells.length} cells]: ${coordsStr}`
        : `・區塊 ${regId}${colorName} [共 ${cells.length} 格]：${coordsStr}`
    );
  }

  // 5. 選擇性附加：目前玩家標記進度
  if (includeProgress && playerGrid && playerGrid.length === size) {
    const cats: string[] = [];
    const crosses: string[] = [];

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const status = playerGrid[r]?.[c];
        if (status === 'CAT') {
          cats.push(`(${r + 1}, ${c + 1})`);
        } else if (status === 'CROSS') {
          crosses.push(`(${r + 1}, ${c + 1})`);
        }
      }
    }

    lines.push('');
    lines.push(isEn ? `[Current Solving Progress]` : `【目前解題標記進度】`);
    lines.push(
      isEn
        ? `- Placed Cats (${cats.length}): ${cats.length > 0 ? cats.join(', ') : 'None'}`
        : `・已放置貓咪 (${cats.length} 隻)：${cats.length > 0 ? cats.join(', ') : '尚未放置'}`
    );
    lines.push(
      isEn
        ? `- Marked ✕ (${crosses.length}): ${crosses.length > 0 ? crosses.join(', ') : 'None'}`
        : `・已標記 ✕ 格 (${crosses.length} 格)：${crosses.length > 0 ? crosses.join(', ') : '無'}`
    );
  }

  return lines.join('\n');
}

