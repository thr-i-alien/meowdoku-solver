import type { CellCoord, CellStatus, DeductionStep, SolveResult, RegionColor } from '../types/game';
import { DEFAULT_COLORS } from './presets';
import { en } from '../i18n/locales/en';

function isAdjacent8(r1: number, c1: number, r2: number, c2: number): boolean {
  return Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2)) === 1;
}

function cloneGrid<T>(grid: T[][]): T[][] {
  return grid.map((row) => [...row]);
}

function getCombinations(arr: number[], k: number): number[][] {
  const result: number[][] = [];
  const helper = (start: number, combo: number[]) => {
    if (combo.length === k) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      helper(i + 1, combo);
      combo.pop();
    }
  };
  helper(0, []);
  return result;
}

function isContiguous(arr: number[]): boolean {
  if (arr.length <= 1) return true;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] !== arr[i - 1] + 1) return false;
  }
  return true;
}

export function solveMeowdoku(regionGrid: number[][], colors: RegionColor[] = DEFAULT_COLORS): SolveResult {
  const N = regionGrid.length;

  const getRegionName = (id: number): string => {
    const color = colors[id] || DEFAULT_COLORS.find((c) => c.id === id);
    return color ? color.name : `區域 ${id + 1}`;
  };

  const getRegionNameEn = (id: number): string => {
    const enName = en.colors[id];
    return enName ? enName : `Region ${id + 1}`;
  };

  if (N === 0 || regionGrid[0].length !== N) {
    return {
      success: false,
      isPureLogic: false,
      steps: [],
      errorMessage: '棋盤必須為正方形矩陣 (N×N)',
    };
  }

  // 驗證區域數量
  const uniqueRegions = Array.from(new Set(regionGrid.flat()));
  if (uniqueRegions.length !== N) {
    return {
      success: false,
      isPureLogic: false,
      steps: [],
      errorMessage: `當前盤面維度為 ${N}×${N}，但顏色區域數為 ${uniqueRegions.length} 個（必須恰好有 ${N} 個區域）`,
    };
  }

  const statusGrid: CellStatus[][] = Array.from({ length: N }, () =>
    Array.from({ length: N }, () => 'EMPTY' as CellStatus)
  );

  const steps: DeductionStep[] = [];
  let stepCount = 0;
  let catsPlacedCount = 0;

  steps.push({
    stepNumber: ++stepCount,
    ruleType: 'INITIAL',
    title: '初始化棋盤與候選範圍',
    titleEn: 'Initialize Board & Candidates',
    explanation: `棋盤維度 ${N}×${N}，共包含 ${N} 個獨立彩色區域。目標是在每個區域、橫列、直欄各安排 1 隻貓咪，且任兩隻貓周圍八格互不接觸。開始依序檢查候選格。`,
    explanationEn: `Grid dimension is ${N}×${N} with ${N} distinct color regions. The goal is to place 1 cat in each region, row, and column, with no two cats touching within 8 adjacent cells. Starting candidate inspection.`,
    boardSnapshot: cloneGrid(statusGrid),
    catsCount: 0,
  });

  const getNeighbors8 = (r: number, c: number): CellCoord[] => {
    const list: CellCoord[] = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < N && nc >= 0 && nc < N) {
          list.push({ r: nr, c: nc });
        }
      }
    }
    return list;
  };

  const getCandidatesInRegion = (reg: number, grid = statusGrid): CellCoord[] => {
    const list: CellCoord[] = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (regionGrid[r][c] === reg && grid[r][c] === 'EMPTY') {
          list.push({ r, c });
        }
      }
    }
    return list;
  };

  const getCandidatesInRow = (r: number, grid = statusGrid): CellCoord[] => {
    const list: CellCoord[] = [];
    for (let c = 0; c < N; c++) {
      if (grid[r][c] === 'EMPTY') {
        list.push({ r, c });
      }
    }
    return list;
  };

  const getCandidatesInCol = (c: number, grid = statusGrid): CellCoord[] => {
    const list: CellCoord[] = [];
    for (let r = 0; r < N; r++) {
      if (grid[r][c] === 'EMPTY') {
        list.push({ r, c });
      }
    }
    return list;
  };

  const regionHasCat = (reg: number, grid = statusGrid): boolean => {
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (regionGrid[r][c] === reg && grid[r][c] === 'CAT') return true;
      }
    }
    return false;
  };

  const rowHasCat = (r: number, grid = statusGrid): boolean => {
    return grid[r].some((s) => s === 'CAT');
  };

  const colHasCat = (c: number, grid = statusGrid): boolean => {
    for (let r = 0; r < N; r++) {
      if (grid[r][c] === 'CAT') return true;
    }
    return false;
  };

  // 放置貓咪並產出獨立落子與排除步驟
  const placeCat = (
    r: number,
    c: number,
    ruleType: any,
    reasonTitle: string,
    reasonDetails: string,
    reasonTitleEn?: string,
    reasonDetailsEn?: string
  ) => {
    statusGrid[r][c] = 'CAT';
    catsPlacedCount++;

    const placedRegion = regionGrid[r][c];
    const eliminated: CellCoord[] = [];

    // 同列
    for (let col = 0; col < N; col++) {
      if (col !== c && statusGrid[r][col] === 'EMPTY') {
        statusGrid[r][col] = 'CROSS';
        eliminated.push({ r, c: col });
      }
    }
    // 同行
    for (let row = 0; row < N; row++) {
      if (row !== r && statusGrid[row][c] === 'EMPTY') {
        statusGrid[row][c] = 'CROSS';
        eliminated.push({ r: row, c });
      }
    }
    // 同區
    for (let row = 0; row < N; row++) {
      for (let col = 0; col < N; col++) {
        if ((row !== r || col !== c) && regionGrid[row][col] === placedRegion && statusGrid[row][col] === 'EMPTY') {
          statusGrid[row][col] = 'CROSS';
          eliminated.push({ r: row, c: col });
        }
      }
    }
    // 周圍 8 格
    const neighbors = getNeighbors8(r, c);
    for (const nb of neighbors) {
      if (statusGrid[nb.r][nb.c] === 'EMPTY') {
        statusGrid[nb.r][nb.c] = 'CROSS';
        eliminated.push(nb);
      }
    }

    steps.push({
      stepNumber: ++stepCount,
      ruleType,
      title: reasonTitle,
      titleEn: reasonTitleEn || reasonTitle,
      explanation: `${reasonDetails}。依規則在 (${r + 1}, ${c + 1}) 放置貓咪，並將其所在橫列、直欄、${getRegionName(
        placedRegion
      )}及周圍八格共 ${eliminated.length} 處空格標記排除（✕）。`,
      explanationEn: `${reasonDetailsEn || reasonDetails}. Placed a cat at (${r + 1}, ${c + 1}) according to rules, eliminating ${eliminated.length} cells (✕) across its row, column, ${getRegionNameEn(placedRegion)}, and 8 surrounding neighbors.`,
      catPlaced: { r, c },
      eliminatedCells: eliminated,
      highlightCells: [{ r, c }],
      highlightRegions: [placedRegion],
      highlightRows: [r],
      highlightCols: [c],
      boardSnapshot: cloneGrid(statusGrid),
      catsCount: catsPlacedCount,
    });
  };

  // 模擬在 (r, c) 放貓是否會導致盤面死棋（產生餓死區域或空列/欄）
  const testPlacementContradiction = (
    r: number,
    c: number
  ): { hasContradiction: boolean; causeMsg: string; causeMsgEn: string } => {
    const testGrid = cloneGrid(statusGrid);
    testGrid[r][c] = 'CAT';
    const reg = regionGrid[r][c];

    // 排除同列
    for (let col = 0; col < N; col++) {
      if (col !== c && testGrid[r][col] === 'EMPTY') testGrid[r][col] = 'CROSS';
    }
    // 排除同行
    for (let row = 0; row < N; row++) {
      if (row !== r && testGrid[row][c] === 'EMPTY') testGrid[row][c] = 'CROSS';
    }
    // 排除同區
    for (let row = 0; row < N; row++) {
      for (let col = 0; col < N; col++) {
        if (regionGrid[row][col] === reg && testGrid[row][col] === 'EMPTY') {
          testGrid[row][col] = 'CROSS';
        }
      }
    }
    // 排除周圍 8 格
    for (const nb of getNeighbors8(r, c)) {
      if (testGrid[nb.r][nb.c] === 'EMPTY') testGrid[nb.r][nb.c] = 'CROSS';
    }

    // 檢視是否有其他未放貓的區域餓死
    for (const otherReg of uniqueRegions) {
      if (!regionHasCat(otherReg, testGrid)) {
        const cands = getCandidatesInRegion(otherReg, testGrid);
        if (cands.length === 0) {
          return {
            hasContradiction: true,
            causeMsg: `若在此格放貓，將導致 ${getRegionName(otherReg)} 失去所有可能位置（區域死鎖）`,
            causeMsgEn: `Placing a cat here leaves ${getRegionNameEn(otherReg)} with zero valid cells (region deadlock)`,
          };
        }
      }
    }

    // 檢視是否有橫列餓死
    for (let row = 0; row < N; row++) {
      if (!rowHasCat(row, testGrid)) {
        const cands = getCandidatesInRow(row, testGrid);
        if (cands.length === 0) {
          return {
            hasContradiction: true,
            causeMsg: `若在此格放貓，將導致第 ${row + 1} 列完全無合法空格可放貓`,
            causeMsgEn: `Placing a cat here leaves Row ${row + 1} with zero valid cells for a cat`,
          };
        }
      }
    }

    // 檢視是否有直欄餓死
    for (let col = 0; col < N; col++) {
      if (!colHasCat(col, testGrid)) {
        const cands = getCandidatesInCol(col, testGrid);
        if (cands.length === 0) {
          return {
            hasContradiction: true,
            causeMsg: `若在此格放貓，將導致第 ${col + 1} 欄完全無合法空格可放貓`,
            causeMsgEn: `Placing a cat here leaves Column ${col + 1} with zero valid cells for a cat`,
          };
        }
      }
    }

    return { hasContradiction: false, causeMsg: '', causeMsgEn: '' };
  };

  // 逐步推導主迴圈
  let loopRunning = true;
  let isPureLogic = true;

  while (catsPlacedCount < N && loopRunning) {
    let stepMade = false;

    // 策略 1: 區域唯一殘格 (Naked Single Region)
    for (const reg of uniqueRegions) {
      if (regionHasCat(reg)) continue;
      const cands = getCandidatesInRegion(reg);
      if (cands.length === 1) {
        const { r, c } = cands[0];
        placeCat(
          r,
          c,
          'NAKED_SINGLE_REGION',
          `【區域唯一殘格】${getRegionName(reg)} 落子`,
          `觀察發現 ${getRegionName(reg)} 僅剩餘唯一的合法空格 (${r + 1}, ${c + 1})，依據規則 1 此格必放貓咪`,
          `[Single Candidate] Place Cat in ${getRegionNameEn(reg)}`,
          `${getRegionNameEn(reg)} has only one remaining valid empty cell at (${r + 1}, ${c + 1}), which must contain a cat by Rule 1`
        );
        stepMade = true;
        break;
      }
    }
    if (stepMade) continue;

    // 策略 2: 橫列唯一殘格 (Naked Single Row)
    for (let r = 0; r < N; r++) {
      if (rowHasCat(r)) continue;
      const cands = getCandidatesInRow(r);
      if (cands.length === 1) {
        const { c } = cands[0];
        placeCat(
          r,
          c,
          'NAKED_SINGLE_ROW',
          `【橫列唯一殘格】第 ${r + 1} 列落子`,
          `第 ${r + 1} 列僅剩唯一候選位置 (${r + 1}, ${c + 1})，依據規則 2 該橫列必放一隻貓`,
          `[Single Candidate] Place Cat in Row ${r + 1}`,
          `Row ${r + 1} has only one remaining candidate at (${r + 1}, ${c + 1}), which must contain a cat by Rule 2`
        );
        stepMade = true;
        break;
      }
    }
    if (stepMade) continue;

    // 策略 3: 直欄唯一殘格 (Naked Single Col)
    for (let c = 0; c < N; c++) {
      if (colHasCat(c)) continue;
      const cands = getCandidatesInCol(c);
      if (cands.length === 1) {
        const { r } = cands[0];
        placeCat(
          r,
          c,
          'NAKED_SINGLE_COL',
          `【直欄唯一殘格】第 ${c + 1} 欄落子`,
          `第 ${c + 1} 欄僅剩唯一候選位置 (${r + 1}, ${c + 1})，依據規則 2 該直欄必放一隻貓`,
          `[Single Candidate] Place Cat in Column ${c + 1}`,
          `Column ${c + 1} has only one remaining candidate at (${r + 1}, ${c + 1}), which must contain a cat by Rule 2`
        );
        stepMade = true;
        break;
      }
    }
    if (stepMade) continue;

    // 策略 4: 區域指向行列排除 (Line-Region Intersection)
    for (const reg of uniqueRegions) {
      if (regionHasCat(reg)) continue;
      const cands = getCandidatesInRegion(reg);
      if (cands.length < 2) continue;

      const firstR = cands[0].r;
      if (cands.every((cd) => cd.r === firstR)) {
        const toEliminate: CellCoord[] = [];
        for (let col = 0; col < N; col++) {
          if (regionGrid[firstR][col] !== reg && statusGrid[firstR][col] === 'EMPTY') {
            toEliminate.push({ r: firstR, c: col });
          }
        }
        if (toEliminate.length > 0) {
          toEliminate.forEach(({ r, c }) => {
            statusGrid[r][c] = 'CROSS';
          });
          steps.push({
            stepNumber: ++stepCount,
            ruleType: 'LINE_REGION_INTERSECTION',
            title: `【區域鎖定橫列】排除第 ${firstR + 1} 列其他位置`,
            titleEn: `[Region Pointing Line] Eliminate other cells in Row ${firstR + 1}`,
            explanation: `${getRegionName(reg)} 的所有剩餘候選格全落在第 ${
              firstR + 1
            } 列。因此該橫列唯一的貓咪必定出自該區域，此列其他區域的空格皆無法放貓，劃叉排除。`,
            explanationEn: `All remaining candidates in ${getRegionNameEn(reg)} are aligned in Row ${
              firstR + 1
            }. The row's cat must come from this region, eliminating empty cells belonging to other regions in this row (✕).`,
            eliminatedCells: toEliminate,
            highlightRegions: [reg],
            highlightRows: [firstR],
            boardSnapshot: cloneGrid(statusGrid),
            catsCount: catsPlacedCount,
          });
          stepMade = true;
          break;
        }
      }

      const firstC = cands[0].c;
      if (cands.every((cd) => cd.c === firstC)) {
        const toEliminate: CellCoord[] = [];
        for (let row = 0; row < N; row++) {
          if (regionGrid[row][firstC] !== reg && statusGrid[row][firstC] === 'EMPTY') {
            toEliminate.push({ r: row, c: firstC });
          }
        }
        if (toEliminate.length > 0) {
          toEliminate.forEach(({ r, c }) => {
            statusGrid[r][c] = 'CROSS';
          });
          steps.push({
            stepNumber: ++stepCount,
            ruleType: 'LINE_REGION_INTERSECTION',
            title: `【區域鎖定直欄】排除第 ${firstC + 1} 欄其他位置`,
            titleEn: `[Region Pointing Line] Eliminate other cells in Column ${firstC + 1}`,
            explanation: `${getRegionName(reg)} 的所有剩餘候選格全落在第 ${
              firstC + 1
            } 欄。因此該直欄唯一的貓咪必定出自該區域，此欄其他區域的空格皆無法放貓，劃叉排除。`,
            explanationEn: `All remaining candidates in ${getRegionNameEn(reg)} are aligned in Column ${
              firstC + 1
            }. The column's cat must come from this region, eliminating empty cells belonging to other regions in this column (✕).`,
            eliminatedCells: toEliminate,
            highlightRegions: [reg],
            highlightCols: [firstC],
            boardSnapshot: cloneGrid(statusGrid),
            catsCount: catsPlacedCount,
          });
          stepMade = true;
          break;
        }
      }
    }
    if (stepMade) continue;

    // 策略 4b: 行列鎖定區域排除 (Region-Line Intersection / Claiming)
    // 當整個橫列或直欄只剩下一種顏色可以放貓時，則該顏色在其他橫列或直欄就可以畫 X
    // 1. 檢查橫列：某橫列的所有候選格全屬於同一區域，則該區域在其他橫列的空格必不能放貓
    for (let r = 0; r < N; r++) {
      if (rowHasCat(r)) continue;
      const cands = getCandidatesInRow(r);
      if (cands.length === 0) continue;

      const firstReg = regionGrid[r][cands[0].c];
      if (cands.every((cd) => regionGrid[r][cd.c] === firstReg)) {
        const toEliminate: CellCoord[] = [];
        for (let otherR = 0; otherR < N; otherR++) {
          if (otherR === r) continue;
          for (let col = 0; col < N; col++) {
            if (regionGrid[otherR][col] === firstReg && statusGrid[otherR][col] === 'EMPTY') {
              toEliminate.push({ r: otherR, c: col });
            }
          }
        }

        if (toEliminate.length > 0) {
          toEliminate.forEach(({ r: er, c: ec }) => {
            statusGrid[er][ec] = 'CROSS';
          });
          steps.push({
            stepNumber: ++stepCount,
            ruleType: 'REGION_LINE_INTERSECTION',
            title: `【橫列鎖定區域】第 ${r + 1} 列僅剩 ${getRegionName(firstReg)}`,
            titleEn: `[Line Pointing Region] Row ${r + 1} candidates confined to ${getRegionNameEn(firstReg)}`,
            explanation: `第 ${r + 1} 列目前所有可放貓的候選格全屬於【${getRegionName(
              firstReg
            )}】。因為第 ${r + 1} 列必定要有一隻貓，所以該區域的貓咪必定落在第 ${r + 1} 列。因此，【${getRegionName(
              firstReg
            )}】在其他橫列的 ${toEliminate.length} 處空格皆無法放貓，劃記排除（✕）。`,
            explanationEn: `All candidates in Row ${r + 1} belong to [${getRegionNameEn(
              firstReg
            )}]. Since Row ${r + 1} requires a cat, that region's cat must be in this row. Therefore, ${toEliminate.length} empty cells in [${getRegionNameEn(
              firstReg
            )}] in other rows are eliminated (✕).`,
            eliminatedCells: toEliminate,
            highlightRegions: [firstReg],
            highlightRows: [r],
            boardSnapshot: cloneGrid(statusGrid),
            catsCount: catsPlacedCount,
          });
          stepMade = true;
          break;
        }
      }
    }
    if (stepMade) continue;

    // 2. 檢查直欄：某直欄的所有候選格全屬於同一區域，則該區域在其他直欄的空格必不能放貓
    for (let c = 0; c < N; c++) {
      if (colHasCat(c)) continue;
      const cands = getCandidatesInCol(c);
      if (cands.length === 0) continue;

      const firstReg = regionGrid[cands[0].r][c];
      if (cands.every((cd) => regionGrid[cd.r][c] === firstReg)) {
        const toEliminate: CellCoord[] = [];
        for (let row = 0; row < N; row++) {
          for (let otherC = 0; otherC < N; otherC++) {
            if (otherC === c) continue;
            if (regionGrid[row][otherC] === firstReg && statusGrid[row][otherC] === 'EMPTY') {
              toEliminate.push({ r: row, c: otherC });
            }
          }
        }

        if (toEliminate.length > 0) {
          toEliminate.forEach(({ r: er, c: ec }) => {
            statusGrid[er][ec] = 'CROSS';
          });
          steps.push({
            stepNumber: ++stepCount,
            ruleType: 'REGION_LINE_INTERSECTION',
            title: `【直欄鎖定區域】第 ${c + 1} 欄僅剩 ${getRegionName(firstReg)}`,
            titleEn: `[Line Pointing Region] Column ${c + 1} candidates confined to ${getRegionNameEn(firstReg)}`,
            explanation: `第 ${c + 1} 欄目前所有可放貓的候選格全屬於【${getRegionName(
              firstReg
            )}】。因為第 ${c + 1} 欄必定要有一隻貓，所以該區域的貓咪必定落在第 ${c + 1} 欄。因此，【${getRegionName(
              firstReg
            )}】在其他直欄的 ${toEliminate.length} 處空格皆無法放貓，劃記排除（✕）。`,
            explanationEn: `All candidates in Column ${c + 1} belong to [${getRegionNameEn(
              firstReg
            )}]. Since Column ${c + 1} requires a cat, that region's cat must be in this column. Therefore, ${toEliminate.length} empty cells in [${getRegionNameEn(
              firstReg
            )}] in other columns are eliminated (✕).`,
            eliminatedCells: toEliminate,
            highlightRegions: [firstReg],
            highlightCols: [c],
            boardSnapshot: cloneGrid(statusGrid),
            catsCount: catsPlacedCount,
          });
          stepMade = true;
          break;
        }
      }
    }
    if (stepMade) continue;

    // 策略 5: 區域集合計數鎖定 (Subset Locked Regions / Counting Principle)
    // 依據鴿籠原理：若 k 條直欄（或橫列）中，完整包含了 k 個未放貓區域的所有剩餘候選格，
    // 則該 k 條直欄（或橫列）的所有貓咪配額已被這 k 個區域完全佔滿，
    // 該範圍內所有屬於其他區域的空格皆無法放貓，劃記排除（✕）。
    const allIndices = Array.from({ length: N }, (_, i) => i);

    // 檢查直欄子集
    const checkColSubsets = (): boolean => {
      // 1. 優先檢查連續直欄區間 (k = 2 到 N - 1)
      const colGroups: number[][] = [];
      for (let k = 2; k <= N - 1; k++) {
        for (let start = 0; start <= N - k; start++) {
          const group: number[] = [];
          for (let i = 0; i < k; i++) group.push(start + i);
          colGroups.push(group);
        }
      }

      // 2. 隨後檢查非連續任意組合 (k = 2 到 4，避免組合過多)
      for (let k = 2; k <= Math.min(4, N - 1); k++) {
        const combos = getCombinations(allIndices, k);
        for (const combo of combos) {
          if (!isContiguous(combo)) {
            colGroups.push(combo);
          }
        }
      }

      for (const cols of colGroups) {
        const k = cols.length;
        const containedRegs: number[] = [];
        for (const reg of uniqueRegions) {
          if (regionHasCat(reg)) continue;
          const cands = getCandidatesInRegion(reg);
          if (cands.length > 0 && cands.every((pt) => cols.includes(pt.c))) {
            containedRegs.push(reg);
          }
        }

        if (containedRegs.length === k) {
          const toEliminate: CellCoord[] = [];
          for (const c of cols) {
            for (let r = 0; r < N; r++) {
              if (statusGrid[r][c] === 'EMPTY' && !containedRegs.includes(regionGrid[r][c])) {
                toEliminate.push({ r, c });
              }
            }
          }

          if (toEliminate.length > 0) {
            toEliminate.forEach(({ r, c }) => {
              statusGrid[r][c] = 'CROSS';
            });

            const colDesc = isContiguous(cols)
              ? `第 ${cols[0] + 1} 至 ${cols[cols.length - 1] + 1} 欄`
              : `直欄 [${cols.map((c) => c + 1).join(', ')}]`;

            const colDescEn = isContiguous(cols)
              ? `Columns ${cols[0] + 1} to ${cols[cols.length - 1] + 1}`
              : `Columns [${cols.map((c) => c + 1).join(', ')}]`;

            const regionNames = containedRegs.map((reg) => getRegionName(reg)).join('、');
            const regionNamesEn = containedRegs.map((reg) => getRegionNameEn(reg)).join(', ');

            steps.push({
              stepNumber: ++stepCount,
              ruleType: 'SUBSET_COUNTING',
              title: `【區域集合鎖定】${colDesc} 包含 ${k} 個顏色區域`,
              titleEn: `[Subset Counting] ${colDescEn} contain ${k} regions`,
              explanation: `觀察 ${colDesc}（共 ${k} 欄），目前完整包含了【${regionNames}】共 ${k} 個顏色區域的全部候選格。依據鴿籠原理，這 ${k} 個區域的貓咪必定全部分布在這 ${k} 欄內，佔滿了該範圍的所有貓咪配額。因此，其餘區域在此範圍內的 ${toEliminate.length} 處空格皆無法放貓，劃記排除（✕）。`,
              explanationEn: `Observing ${colDescEn} (${k} columns), all candidates for [${regionNamesEn}] (${k} regions) are completely contained within them. By the Pigeonhole Principle, cats for these ${k} regions must reside entirely in these ${k} columns. All ${toEliminate.length} empty cells belonging to other regions within this range are eliminated (✕).`,
              eliminatedCells: toEliminate,
              highlightRegions: containedRegs,
              highlightCols: cols,
              boardSnapshot: cloneGrid(statusGrid),
              catsCount: catsPlacedCount,
            });
            return true;
          }
        }
      }
      return false;
    };

    // 檢查橫列子集
    const checkRowSubsets = (): boolean => {
      // 1. 優先檢查連續橫列區間 (k = 2 到 N - 1)
      const rowGroups: number[][] = [];
      for (let k = 2; k <= N - 1; k++) {
        for (let start = 0; start <= N - k; start++) {
          const group: number[] = [];
          for (let i = 0; i < k; i++) group.push(start + i);
          rowGroups.push(group);
        }
      }

      // 2. 隨後檢查非連續任意組合 (k = 2 到 4)
      for (let k = 2; k <= Math.min(4, N - 1); k++) {
        const combos = getCombinations(allIndices, k);
        for (const combo of combos) {
          if (!isContiguous(combo)) {
            rowGroups.push(combo);
          }
        }
      }

      for (const rows of rowGroups) {
        const k = rows.length;
        const containedRegs: number[] = [];
        for (const reg of uniqueRegions) {
          if (regionHasCat(reg)) continue;
          const cands = getCandidatesInRegion(reg);
          if (cands.length > 0 && cands.every((pt) => rows.includes(pt.r))) {
            containedRegs.push(reg);
          }
        }

        if (containedRegs.length === k) {
          const toEliminate: CellCoord[] = [];
          for (const r of rows) {
            for (let c = 0; c < N; c++) {
              if (statusGrid[r][c] === 'EMPTY' && !containedRegs.includes(regionGrid[r][c])) {
                toEliminate.push({ r, c });
              }
            }
          }

          if (toEliminate.length > 0) {
            toEliminate.forEach(({ r, c }) => {
              statusGrid[r][c] = 'CROSS';
            });

            const rowDesc = isContiguous(rows)
              ? `第 ${rows[0] + 1} 至 ${rows[rows.length - 1] + 1} 列`
              : `橫列 [${rows.map((r) => r + 1).join(', ')}]`;

            const rowDescEn = isContiguous(rows)
              ? `Rows ${rows[0] + 1} to ${rows[rows.length - 1] + 1}`
              : `Rows [${rows.map((r) => r + 1).join(', ')}]`;

            const regionNames = containedRegs.map((reg) => getRegionName(reg)).join('、');
            const regionNamesEn = containedRegs.map((reg) => getRegionNameEn(reg)).join(', ');

            steps.push({
              stepNumber: ++stepCount,
              ruleType: 'SUBSET_COUNTING',
              title: `【區域集合鎖定】${rowDesc} 包含 ${k} 個顏色區域`,
              titleEn: `[Subset Counting] ${rowDescEn} contain ${k} regions`,
              explanation: `觀察 ${rowDesc}（共 ${k} 列），目前完整包含了【${regionNames}】共 ${k} 個顏色區域的全部候選格。依據鴿籠原理，這 ${k} 個區域的貓咪必定全部分布在這 ${k} 列內，佔滿了該範圍的所有貓咪配額。因此，其餘區域在此範圍內的 ${toEliminate.length} 處空格皆無法放貓，劃記排除（✕）。`,
              explanationEn: `Observing ${rowDescEn} (${k} rows), all candidates for [${regionNamesEn}] (${k} regions) are completely contained within them. By the Pigeonhole Principle, cats for these ${k} regions must reside entirely in these ${k} rows. All ${toEliminate.length} empty cells belonging to other regions within this range are eliminated (✕).`,
              eliminatedCells: toEliminate,
              highlightRegions: containedRegs,
              highlightRows: rows,
              boardSnapshot: cloneGrid(statusGrid),
              catsCount: catsPlacedCount,
            });
            return true;
          }
        }
      }
      return false;
    };

    if (checkColSubsets()) {
      stepMade = true;
      continue;
    }

    if (checkRowSubsets()) {
      stepMade = true;
      continue;
    }

    // 策略 6: 假想矛盾消去法 (Region Starvation / Proof by Contradiction)
    // 依序檢查每個候選格，若在此格放貓會導致死棋，則此格必為 ✕
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (statusGrid[r][c] === 'EMPTY') {
          const test = testPlacementContradiction(r, c);
          if (test.hasContradiction) {
            statusGrid[r][c] = 'CROSS';
            steps.push({
              stepNumber: ++stepCount,
              ruleType: 'LINE_REGION_INTERSECTION',
              title: `【消去推理】排除 (${r + 1}, ${c + 1})`,
              titleEn: `[Contradiction Elimination] Eliminate (${r + 1}, ${c + 1})`,
              explanation: `推導分析：${test.causeMsg}。依據消去法，(${r + 1}, ${c + 1}) 絕對不可能放貓，劃記排除（✕）。`,
              explanationEn: `Deduction analysis: ${test.causeMsgEn} By elimination, (${r + 1}, ${c + 1}) cannot hold a cat and is marked eliminated (✕).`,
              eliminatedCells: [{ r, c }],
              highlightCells: [{ r, c }],
              boardSnapshot: cloneGrid(statusGrid),
              catsCount: catsPlacedCount,
            });
            stepMade = true;
            break;
          }
        }
      }
      if (stepMade) break;
    }
    if (stepMade) continue;

    // 策略 6: 國王步雙重封鎖排除 (Shared King-Move Adjacency)
    for (const reg of uniqueRegions) {
      if (regionHasCat(reg)) continue;
      const cands = getCandidatesInRegion(reg);
      if (cands.length === 2) {
        const [p1, p2] = cands;
        const toEliminate: CellCoord[] = [];
        for (let r = 0; r < N; r++) {
          for (let c = 0; c < N; c++) {
            if (statusGrid[r][c] === 'EMPTY' && (r !== p1.r || c !== p1.c) && (r !== p2.r || c !== p2.c)) {
              if (isAdjacent8(r, c, p1.r, p1.c) && isAdjacent8(r, c, p2.r, p2.c)) {
                toEliminate.push({ r, c });
              }
            }
          }
        }
        if (toEliminate.length > 0) {
          toEliminate.forEach(({ r, c }) => {
            statusGrid[r][c] = 'CROSS';
          });
          steps.push({
            stepNumber: ++stepCount,
            ruleType: 'SHARED_ADJACENCY_ELIMINATION',
            title: `【相鄰封鎖】排除 (${toEliminate[0].r + 1}, ${toEliminate[0].c + 1})`,
            titleEn: `[Shared Adjacency] Eliminate (${toEliminate[0].r + 1}, ${toEliminate[0].c + 1})`,
            explanation: `${getRegionName(reg)} 僅剩兩處候選格，標記位置同時與這兩格八方位相鄰。無論貓咪落在哪一格，該格皆會違反不相鄰規則，故提前劃叉排除。`,
            explanationEn: `${getRegionNameEn(reg)} has only two candidates left. The marked cell is adjacent to both. Regardless of which candidate receives the cat, this cell would violate the adjacency rule, so it is eliminated (✕) in advance.`,
            eliminatedCells: toEliminate,
            highlightCells: [p1, p2],
            boardSnapshot: cloneGrid(statusGrid),
            catsCount: catsPlacedCount,
          });
          stepMade = true;
          break;
        }
      }
    }
    if (stepMade) continue;

    // 若常規消去法停滯，尋找最少候選分支進行假說逐步引導
    if (!stepMade && catsPlacedCount < N) {
      isPureLogic = false;
      const sortedRegions = uniqueRegions
        .filter((reg) => !regionHasCat(reg))
        .map((reg) => ({ reg, cands: getCandidatesInRegion(reg) }))
        .filter((item) => item.cands.length > 0)
        .sort((a, b) => a.cands.length - b.cands.length);

      if (sortedRegions.length > 0) {
        const branchTarget = sortedRegions[0];
        // 挑選其中一格做探索
        for (const candidate of branchTarget.cands) {
          const testRes = solveFromCurrent(regionGrid, statusGrid, candidate);
          if (testRes) {
            steps.push({
              stepNumber: ++stepCount,
              ruleType: 'BACKTRACK_SEARCH',
              title: `【分支假設驗證】試放 (${candidate.r + 1}, ${candidate.c + 1})`,
              titleEn: `[Hypothesis Branching] Test Placement at (${candidate.r + 1}, ${candidate.c + 1})`,
              explanation: `當前常規消去已達極限，針對候選最少（共 ${branchTarget.cands.length} 格）的 ${getRegionName(
                branchTarget.reg
              )}，假定於 (${candidate.r + 1}, ${candidate.c + 1}) 落子並繼續推進後續推理。`,
              explanationEn: `Standard elimination reached a plateau. Testing the region with minimum candidates (${branchTarget.cands.length} cells: ${getRegionNameEn(
                branchTarget.reg
              )}) by assuming a cat at (${candidate.r + 1}, ${candidate.c + 1}) to advance deduction.`,
              catPlaced: candidate,
              highlightCells: [candidate],
              boardSnapshot: cloneGrid(statusGrid),
              catsCount: catsPlacedCount,
            });
            // 依序填入後續每一步
            placeCat(
              candidate.r,
              candidate.c,
              'BACKTRACK_SEARCH',
              `【驗證落子】${getRegionName(branchTarget.reg)} 安排貓咪`,
              `經過全域相容性驗證，(${candidate.r + 1}, ${candidate.c + 1}) 能順利推展完整解答`,
              `[Verified Placement] Place Cat in ${getRegionNameEn(branchTarget.reg)}`,
              `After global compatibility verification, (${candidate.r + 1}, ${candidate.c + 1}) successfully advances to a complete solution`
            );
            stepMade = true;
            break;
          }
        }
      }

      if (!stepMade) {
        loopRunning = false;
      }
    }
  }

  if (catsPlacedCount === N) {
    steps.push({
      stepNumber: ++stepCount,
      ruleType: 'COMPLETED',
      title: '解題成功！',
      titleEn: 'Puzzle Solved!',
      explanation: `全部 ${N} 隻貓咪皆已安置完畢！每橫列、直欄與彩色區域均恰好有一隻貓，且任兩隻貓周圍八格互不接觸！`,
      explanationEn: `All ${N} cats placed successfully! Each row, column, and color region contains exactly 1 cat, and no two cats touch within 8 adjacent cells!`,
      boardSnapshot: cloneGrid(statusGrid),
      catsCount: N,
    });
    return {
      success: true,
      isPureLogic,
      steps,
      solutionGrid: statusGrid,
    };
  }

  return {
    success: false,
    isPureLogic: false,
    steps,
    errorMessage: '推導停滯：此盤面在給定規則下無解，請確認區域顏色與連通劃分是否正確。',
  };
}

function solveFromCurrent(regionGrid: number[][], currentGrid: CellStatus[][], testCat: CellCoord): boolean {
  const N = regionGrid.length;
  const grid = cloneGrid(currentGrid);
  grid[testCat.r][testCat.c] = 'CAT';

  const isSafe = (r: number, c: number): boolean => {
    for (let i = 0; i < N; i++) {
      if ((i !== c && grid[r][i] === 'CAT') || (i !== r && grid[i][c] === 'CAT')) return false;
    }
    const reg = regionGrid[r][c];
    for (let row = 0; row < N; row++) {
      for (let col = 0; col < N; col++) {
        if ((row !== r || col !== c) && regionGrid[row][col] === reg && grid[row][col] === 'CAT') return false;
      }
    }
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < N && nc >= 0 && nc < N) {
          if (grid[nr][nc] === 'CAT') return false;
        }
      }
    }
    return true;
  };

  const dfs = (row: number): boolean => {
    if (row === N) return true;
    if (grid[row].some((s) => s === 'CAT')) return dfs(row + 1);

    for (let col = 0; col < N; col++) {
      if (grid[row][col] !== 'CROSS' && isSafe(row, col)) {
        grid[row][col] = 'CAT';
        if (dfs(row + 1)) return true;
        grid[row][col] = 'EMPTY';
      }
    }
    return false;
  };

  return dfs(0);
}
