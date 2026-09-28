import type { RegionColor } from '../types/game';
import { DEFAULT_COLORS } from './presets';

/**
 * 檢查相鄰座標是否在邊界內
 */
function isValidCoord(r: number, c: number, size: number): boolean {
  return r >= 0 && r < size && c >= 0 && c < size;
}

/**
 * 油漆桶填色演算法 (Flood Fill)
 * 將與 (startR, startC) 相鄰且顏色相同的連通區域一次性替換為 newColor
 */
export function floodFill(
  grid: number[][],
  startR: number,
  startC: number,
  newColor: number
): number[][] {
  const size = grid.length;
  if (!isValidCoord(startR, startC, size)) return grid;

  const originalColor = grid[startR][startC];
  if (originalColor === newColor) return grid;

  // 深度複製盤面
  const nextGrid = grid.map((row) => [...row]);
  const queue: [number, number][] = [[startR, startC]];
  const visited = new Set<string>();
  visited.add(`${startR},${startC}`);

  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    nextGrid[r][c] = newColor;

    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;

      if (
        isValidCoord(nr, nc, size) &&
        !visited.has(key) &&
        nextGrid[nr][nc] === originalColor
      ) {
        visited.add(key);
        queue.push([nr, nc]);
      }
    }
  }

  return nextGrid;
}

/**
 * 地圖完整度與連通性分析結果
 */
export interface MapIntegrityInfo {
  uniqueCount: number;
  targetCount: number;
  isValidCount: boolean;
  colorCounts: Record<number, number>;
  emptyCellsCount: number;
  // 各顏色是否分為多個互不相連的孤立分塊
  disconnectedColors: number[];
  colorComponents: Record<number, number>;
}

/**
 * 檢查地圖區域數量與連通分量
 */
export function checkMapIntegrity(grid: number[][], targetSize: number): MapIntegrityInfo {
  const size = grid.length;
  const colorCounts: Record<number, number> = {};
  let emptyCellsCount = 0;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const color = grid[r][c];
      if (color === undefined || color === null || color < 0) {
        emptyCellsCount++;
      } else {
        colorCounts[color] = (colorCounts[color] || 0) + 1;
      }
    }
  }

  const uniqueColors = Object.keys(colorCounts).map(Number);
  const uniqueCount = uniqueColors.length;

  // 計算每個顏色的連通分量數 (BFS)
  const visited = new Set<string>();
  const colorComponents: Record<number, number> = {};
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const key = `${r},${c}`;
      if (visited.has(key)) continue;

      const color = grid[r][c];
      if (color === undefined || color === null || color < 0) continue;

      // 展開一個連通塊
      colorComponents[color] = (colorComponents[color] || 0) + 1;
      const queue: [number, number][] = [[r, c]];
      visited.add(key);

      while (queue.length > 0) {
        const [cr, cc] = queue.shift()!;
        for (const [dr, dc] of directions) {
          const nr = cr + dr;
          const nc = cc + dc;
          const nKey = `${nr},${nc}`;
          if (
            isValidCoord(nr, nc, size) &&
            !visited.has(nKey) &&
            grid[nr][nc] === color
          ) {
            visited.add(nKey);
            queue.push([nr, nc]);
          }
        }
      }
    }
  }

  const disconnectedColors = uniqueColors.filter(
    (color) => (colorComponents[color] || 0) > 1
  );

  return {
    uniqueCount,
    targetCount: targetSize,
    isValidCount: uniqueCount === targetSize && emptyCellsCount === 0,
    colorCounts,
    emptyCellsCount,
    disconnectedColors,
    colorComponents,
  };
}

/**
 * 建立全為指定單一顏色的全新盤面
 */
export function createUniformBoard(size: number, defaultColor = 0): number[][] {
  return Array.from({ length: size }, () => Array(size).fill(defaultColor));
}

/**
 * 動態調整盤面維度 (截取或延伸補齊)
 */
export function resizeBoard(grid: number[][], newSize: number): number[][] {
  const currentSize = grid.length;
  if (currentSize === newSize) return grid;

  const nextGrid: number[][] = [];
  for (let r = 0; r < newSize; r++) {
    const row: number[] = [];
    for (let c = 0; c < newSize; c++) {
      if (r < currentSize && c < currentSize) {
        // 保留原格顏色（若顏色編號超過新尺寸，則映射至合法範圍）
        const originalColor = grid[r][c];
        row.push(originalColor < newSize ? originalColor : originalColor % newSize);
      } else {
        // 新增格預設指派合適的區域
        const fallbackColor = Math.min(newSize - 1, Math.floor((r / newSize) * newSize));
        row.push(fallbackColor);
      }
    }
    nextGrid.push(row);
  }

  return nextGrid;
}

/**
 * 隨機生成由 size 個相鄰連通塊組成的合法地圖
 * 採用擴展種子生長法 (Multi-source Voronoi / Region Growth)
 */
export function generateRandomValidBoard(size: number): number[][] {
  const grid = Array.from({ length: size }, () => Array(size).fill(-1));

  // 1. 隨機選取 size 個不同的種子格子，各賦予 0 ~ size-1 顏色
  const allCoords: [number, number][] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      allCoords.push([r, c]);
    }
  }

  // Fisher-Yates 洗牌挑選種子
  for (let i = allCoords.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allCoords[i], allCoords[j]] = [allCoords[j], allCoords[i]];
  }

  // 選擇前 size 個種子
  const seeds = allCoords.slice(0, size);
  // 記錄邊界待擴展佇列
  const frontiers: [number, number, number][] = []; // [r, c, color]

  seeds.forEach(([r, c], colorId) => {
    grid[r][c] = colorId;
    frontiers.push([r, c, colorId]);
  });

  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  // 2. 隨機擴展直到所有格子皆有顏色
  while (frontiers.length > 0) {
    const randIdx = Math.floor(Math.random() * frontiers.length);
    const [r, c, colorId] = frontiers[randIdx];
    frontiers.splice(randIdx, 1);

    // 隨機打亂擴展方向
    const shuffledDirs = [...directions].sort(() => Math.random() - 0.5);

    for (const [dr, dc] of shuffledDirs) {
      const nr = r + dr;
      const nc = c + dc;

      if (isValidCoord(nr, nc, size) && grid[nr][nc] === -1) {
        grid[nr][nc] = colorId;
        frontiers.push([nr, nc, colorId]);
      }
    }
  }

  return grid;
}

/**
 * 根據尺寸確保有足夠的色彩定義
 */
export function ensureColorsForSize(colors: RegionColor[], size: number): RegionColor[] {
  if (colors.length >= size) return colors.slice(0, size);

  const result = [...colors];
  for (let i = colors.length; i < size; i++) {
    const fallback = DEFAULT_COLORS[i % DEFAULT_COLORS.length];
    result.push({
      ...fallback,
      id: i,
      name: `${fallback.name} (${i + 1})`,
      nameEn: `${fallback.nameEn || fallback.name} (${i + 1})`,
    });
  }
  return result;
}
