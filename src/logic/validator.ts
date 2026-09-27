import type { CellCoord, CellStatus, ConflictDetail, ConflictInfo, HintInfo, RegionColor } from '../types/game';
import { solveMeowdoku } from './solver';
import { DEFAULT_COLORS } from './presets';
import type { Language } from '../i18n/types';
import { en } from '../i18n/locales/en';

/**
 * 檢查兩格是否在周圍 8 格範圍內相鄰（含對角線）
 */
export function isAdjacent8(r1: number, c1: number, r2: number, c2: number): boolean {
  return Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2)) === 1;
}

/**
 * 檢查當前盤面中貓咪之間的規則衝突，以及與正解是否有衝突（若有提供 solutionGrid）
 */
export function checkConflicts(
  playerGrid: CellStatus[][],
  regionGrid: number[][],
  solutionGrid?: CellStatus[][] | null,
  lang: Language = 'zh-TW'
): ConflictInfo {
  const isEn = lang === 'en';

  const N = regionGrid.length;
  const conflictCells = new Set<string>();
  const conflictRows = new Set<number>();
  const conflictCols = new Set<number>();
  const conflictRegions = new Set<number>();
  const details: Record<string, ConflictDetail> = {};
  let hasSolutionConflict = false;

  // 收集所有已放貓咪的座標
  const catCoords: CellCoord[] = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (playerGrid[r]?.[c] === 'CAT') {
        catCoords.push({ r, c });
      }
    }
  }

  // 1. 檢查行衝突（同一行有多隻貓）
  for (let r = 0; r < N; r++) {
    const catsInRow = catCoords.filter((coord) => coord.r === r);
    if (catsInRow.length > 1) {
      conflictRows.add(r);
      catsInRow.forEach((coord) => {
        const key = `${coord.r},${coord.c}`;
        conflictCells.add(key);
        details[key] = {
          r: coord.r,
          c: coord.c,
          type: 'RULE_ROW',
          message: isEn
            ? `Multiple cats in Row ${r + 1}, violating the 1 cat per row rule!`
            : `第 ${r + 1} 列已有其他貓咪，違反每列恰好 1 隻貓規則！`,
        };
      });
    }
  }

  // 2. 檢查列衝突（同一列有多隻貓）
  for (let c = 0; c < N; c++) {
    const catsInCol = catCoords.filter((coord) => coord.c === c);
    if (catsInCol.length > 1) {
      conflictCols.add(c);
      catsInCol.forEach((coord) => {
        const key = `${coord.r},${coord.c}`;
        conflictCells.add(key);
        details[key] = {
          r: coord.r,
          c: coord.c,
          type: 'RULE_COL',
          message: isEn
            ? `Multiple cats in Column ${c + 1}, violating the 1 cat per column rule!`
            : `第 ${c + 1} 行已有其他貓咪，違反每行恰好 1 隻貓規則！`,
        };
      });
    }
  }

  // 3. 檢查同色區域衝突（同一區域有多隻貓）
  const regionMap = new Map<number, CellCoord[]>();
  for (const coord of catCoords) {
    const regId = regionGrid[coord.r][coord.c];
    if (!regionMap.has(regId)) {
      regionMap.set(regId, []);
    }
    regionMap.get(regId)!.push(coord);
  }
  for (const [regId, catsInReg] of regionMap.entries()) {
    if (catsInReg.length > 1) {
      conflictRegions.add(regId);
      catsInReg.forEach((coord) => {
        const key = `${coord.r},${coord.c}`;
        conflictCells.add(key);
        details[key] = {
          r: coord.r,
          c: coord.c,
          type: 'RULE_REGION',
          message: isEn
            ? `Multiple cats placed in the same color region!`
            : `同一個顏色區域內不可放置多隻貓咪！`,
        };
      });
    }
  }

  // 4. 檢查 8 方向相鄰（任兩隻貓相鄰即違規）
  for (let i = 0; i < catCoords.length; i++) {
    for (let j = i + 1; j < catCoords.length; j++) {
      const c1 = catCoords[i];
      const c2 = catCoords[j];
      if (isAdjacent8(c1.r, c1.c, c2.r, c2.c)) {
        const k1 = `${c1.r},${c1.c}`;
        const k2 = `${c2.r},${c2.c}`;
        conflictCells.add(k1);
        conflictCells.add(k2);
        const adjMsg = isEn
          ? `Cats are touching each other or diagonals (King's move restriction)!`
          : `貓咪彼此相鄰或在對角線上接觸，違反相隔規則！`;
        details[k1] = {
          r: c1.r,
          c: c1.c,
          type: 'RULE_ADJACENT',
          message: adjMsg,
        };
        details[k2] = {
          r: c2.r,
          c: c2.c,
          type: 'RULE_ADJACENT',
          message: adjMsg,
        };
      }
    }
  }

  // 5. 檢查與正解衝突（若有提供正解）
  if (solutionGrid && solutionGrid.length === N) {
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const playerStatus = playerGrid[r]?.[c];
        const solutionStatus = solutionGrid[r]?.[c];
        const key = `${r},${c}`;

        // 玩家在此格放貓，但正解此處不是貓
        if (playerStatus === 'CAT' && solutionStatus !== 'CAT') {
          conflictCells.add(key);
          details[key] = {
            r,
            c,
            type: 'WRONG_CAT',
            message: isEn
              ? `Solution conflict: Row ${r + 1}, Col ${c + 1} is not a valid cat position!`
              : `與正解衝突：第 ${r + 1} 列、第 ${c + 1} 行並非貓咪的正確位置！`,
          };
          hasSolutionConflict = true;
        }

        // 玩家在此格標記 ✕，但正解此處必須是貓
        if (playerStatus === 'CROSS' && solutionStatus === 'CAT') {
          conflictCells.add(key);
          details[key] = {
            r,
            c,
            type: 'WRONG_CROSS',
            message: isEn
              ? `Solution conflict: Row ${r + 1}, Col ${c + 1} is actually a cat, cannot mark ✕!`
              : `與正解衝突：第 ${r + 1} 列、第 ${c + 1} 行實際上應為貓咪，不可劃記 ✕！`,
          };
          hasSolutionConflict = true;
        }
      }
    }
  }


  const cells: CellCoord[] = Array.from(conflictCells).map((key) => {
    const [r, c] = key.split(',').map(Number);
    return { r, c };
  });

  return {
    cells,
    rows: Array.from(conflictRows),
    cols: Array.from(conflictCols),
    regions: Array.from(conflictRegions),
    details,
    hasSolutionConflict,
  };
}

/**
 * 檢查是否已達到通關條件：
 * 恰好放置了 N 隻貓咪，且沒有任何衝突，每行、每列、每區各 1 隻
 */
export function checkVictory(
  playerGrid: CellStatus[][],
  regionGrid: number[][],
  solutionGrid?: CellStatus[][] | null
): boolean {
  const N = regionGrid.length;
  let catCount = 0;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (playerGrid[r]?.[c] === 'CAT') catCount++;
    }
  }

  if (catCount !== N) return false;

  const conflicts = checkConflicts(playerGrid, regionGrid, solutionGrid);
  return conflicts.cells.length === 0;
}

/**
 * 放貓咪時的輔助功能：自動將同行、同列、同色區域及周圍 8 格的空白處填上 X
 */
export function autoFillCrosses(
  playerGrid: CellStatus[][],
  regionGrid: number[][],
  catR: number,
  catC: number
): CellStatus[][] {
  const N = regionGrid.length;
  const newGrid = playerGrid.map((row) => [...row]);
  const catRegion = regionGrid[catR][catC];

  // 1. 同行
  for (let c = 0; c < N; c++) {
    if (c !== catC && newGrid[catR][c] === 'EMPTY') {
      newGrid[catR][c] = 'CROSS';
    }
  }

  // 2. 同列
  for (let r = 0; r < N; r++) {
    if (r !== catR && newGrid[r][catC] === 'EMPTY') {
      newGrid[r][catC] = 'CROSS';
    }
  }

  // 3. 同色區域
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if ((r !== catR || c !== catC) && regionGrid[r][c] === catRegion && newGrid[r][c] === 'EMPTY') {
        newGrid[r][c] = 'CROSS';
      }
    }
  }

  // 4. 周圍 8 格
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = catR + dr;
      const nc = catC + dc;
      if (nr >= 0 && nr < N && nc >= 0 && nc < N) {
        if (newGrid[nr][nc] === 'EMPTY') {
          newGrid[nr][nc] = 'CROSS';
        }
      }
    }
  }

  return newGrid;
}

/**
 * 智能提示系統：
 * 優先依據當前玩家盤面中顯著的邏輯規則找出建議：
 * 1. 某區域/行/列只剩 1 格空白，且該區域/行/列尚未放貓 ➔ 提示放置貓咪
 * 2. 已有貓咪的周圍/同行/同列/同區尚有空白格 ➔ 提示排除 X
 * 3. 結合 solver 推導步驟找出正確位置
 */
export function getSmartHint(
  playerGrid: CellStatus[][],
  regionGrid: number[][],
  colors: RegionColor[],
  lang: Language = 'zh-TW'
): HintInfo | null {
  const N = regionGrid.length;
  const isEn = lang === 'en';

  const getRegionName = (id: number, useEn = isEn): string => {
    if (useEn) {
      return en.colors[id] || `Region ${id + 1}`;
    }
    const color = colors[id] || DEFAULT_COLORS.find((c: RegionColor) => c.id === id);
    return color ? color.name : `區域 ${id + 1}`;
  };

  // 1. 檢查是否有已放置貓咪但周圍/同行/同列/同區尚未標記 ✕ 的格子
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (playerGrid[r][c] === 'CAT') {
        const toEliminate: CellCoord[] = [];
        const seen = new Set<string>();

        const addCoord = (nr: number, nc: number) => {
          const key = `${nr},${nc}`;
          if (!seen.has(key) && playerGrid[nr][nc] === 'EMPTY') {
            seen.add(key);
            toEliminate.push({ r: nr, c: nc });
          }
        };

        // 同行
        for (let tc = 0; tc < N; tc++) {
          if (tc !== c) addCoord(r, tc);
        }
        // 同列
        for (let tr = 0; tr < N; tr++) {
          if (tr !== r) addCoord(tr, c);
        }
        // 同區域
        const reg = regionGrid[r][c];
        for (let row = 0; row < N; row++) {
          for (let col = 0; col < N; col++) {
            if ((row !== r || col !== c) && regionGrid[row][col] === reg) {
              addCoord(row, col);
            }
          }
        }
        // 八方位
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < N && nc >= 0 && nc < N) {
              addCoord(nr, nc);
            }
          }
        }

        if (toEliminate.length > 0) {
          const msgZh = `第 ${r + 1} 列、第 ${c + 1} 欄已有貓咪，其同行、同列、同區域及周圍八方的 ${toEliminate.length} 處空格應標記為 ✕`;
          const msgEn = `Cat placed at Row ${r + 1}, Col ${c + 1}. Its row, column, region, and surrounding ${toEliminate.length} empty cells should be marked ✕.`;
          const reasonZh = '貓咪周圍與行列排他';
          const reasonEn = 'Placed Cat Exclusion';
          return {
            coord: toEliminate[0],
            targetCells: toEliminate,
            sourceCells: [{ r, c }],
            suggestedStatus: 'CROSS',
            message: isEn ? msgEn : msgZh,
            messageEn: msgEn,
            reason: isEn ? reasonEn : reasonZh,
            reasonEn: reasonEn,
          };
        }
      }
    }
  }

  // 2. 檢查是否有某個區域、橫列、直欄只剩下唯一一個空格可放貓咪
  // 檢查區域
  for (let reg = 0; reg < N; reg++) {
    let catInReg = false;
    const emptiesInReg: CellCoord[] = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (regionGrid[r][c] === reg) {
          if (playerGrid[r][c] === 'CAT') catInReg = true;
          if (playerGrid[r][c] === 'EMPTY') emptiesInReg.push({ r, c });
        }
      }
    }
    if (!catInReg && emptiesInReg.length === 1) {
      const target = emptiesInReg[0];
      const zhReg = getRegionName(reg, false);
      const enReg = getRegionName(reg, true);
      const msgZh = `【${zhReg}】僅剩最後 1 個未排除的空格，必須在此放置貓咪`;
      const msgEn = `[${enReg}] has only 1 remaining uneliminated cell, a cat must be placed here.`;
      const reasonZh = '區域唯一候選';
      const reasonEn = 'Region Single Candidate';
      return {
        coord: target,
        targetCells: [target],
        highlightRegions: [reg],
        suggestedStatus: 'CAT',
        message: isEn ? msgEn : msgZh,
        messageEn: msgEn,
        reason: isEn ? reasonEn : reasonZh,
        reasonEn: reasonEn,
      };
    }
  }

  // 檢查橫列
  for (let r = 0; r < N; r++) {
    const hasCat = playerGrid[r].includes('CAT');
    const empties = playerGrid[r]
      .map((status, c) => (status === 'EMPTY' ? { r, c } : null))
      .filter((v): v is CellCoord => v !== null);

    if (!hasCat && empties.length === 1) {
      const msgZh = `第 ${r + 1} 列僅剩最後 1 個空格，必定是貓咪`;
      const msgEn = `Row ${r + 1} has only 1 empty cell left, it must contain a cat.`;
      const reasonZh = '橫列唯一候選';
      const reasonEn = 'Row Single Candidate';
      return {
        coord: empties[0],
        targetCells: [empties[0]],
        highlightRows: [r],
        suggestedStatus: 'CAT',
        message: isEn ? msgEn : msgZh,
        messageEn: msgEn,
        reason: isEn ? reasonEn : reasonZh,
        reasonEn: reasonEn,
      };
    }
  }

  // 檢查直欄
  for (let c = 0; c < N; c++) {
    let hasCat = false;
    const empties: CellCoord[] = [];
    for (let r = 0; r < N; r++) {
      if (playerGrid[r][c] === 'CAT') hasCat = true;
      if (playerGrid[r][c] === 'EMPTY') empties.push({ r, c });
    }
    if (!hasCat && empties.length === 1) {
      const msgZh = `第 ${c + 1} 欄僅剩最後 1 個空格，必定是貓咪`;
      const msgEn = `Column ${c + 1} has only 1 empty cell left, it must contain a cat.`;
      const reasonZh = '直欄唯一候選';
      const reasonEn = 'Column Single Candidate';
      return {
        coord: empties[0],
        targetCells: [empties[0]],
        highlightCols: [c],
        suggestedStatus: 'CAT',
        message: isEn ? msgEn : msgZh,
        messageEn: msgEn,
        reason: isEn ? reasonEn : reasonZh,
        reasonEn: reasonEn,
      };
    }
  }

  // 3. 鎖定區域推導 (Intersection / Pointing)
  // A. 直欄鎖定區域：第 c 欄可放貓的空格全在某顏色 reg，故該顏色在其他直欄的空格全標記為 ✕
  for (let c = 0; c < N; c++) {
    let hasCat = false;
    const empties: CellCoord[] = [];
    for (let r = 0; r < N; r++) {
      if (playerGrid[r][c] === 'CAT') hasCat = true;
      if (playerGrid[r][c] === 'EMPTY') empties.push({ r, c });
    }
    if (!hasCat && empties.length >= 2) {
      const firstReg = regionGrid[empties[0].r][c];
      if (empties.every((pt) => regionGrid[pt.r][c] === firstReg)) {
        const toEliminate: CellCoord[] = [];
        for (let row = 0; row < N; row++) {
          for (let otherC = 0; otherC < N; otherC++) {
            if (otherC === c) continue;
            if (regionGrid[row][otherC] === firstReg && playerGrid[row][otherC] === 'EMPTY') {
              toEliminate.push({ r: row, c: otherC });
            }
          }
        }
        if (toEliminate.length > 0) {
          const zhReg = getRegionName(firstReg, false);
          const enReg = getRegionName(firstReg, true);
          const msgZh = `第 ${c + 1} 欄可放貓的空格全在【${zhReg}】，故該顏色在其他直欄的 ${toEliminate.length} 處空格應標記為 ✕`;
          const msgEn = `Column ${c + 1} candidates all lie in [${enReg}]. Other ${toEliminate.length} cells of this region should be marked ✕.`;
          const reasonZh = '直欄鎖定區域';
          const reasonEn = 'Column Pointing Region';
          return {
            coord: toEliminate[0],
            targetCells: toEliminate,
            sourceCells: empties,
            highlightCols: [c],
            highlightRegions: [firstReg],
            suggestedStatus: 'CROSS',
            message: isEn ? msgEn : msgZh,
            messageEn: msgEn,
            reason: isEn ? reasonEn : reasonZh,
            reasonEn: reasonEn,
          };
        }
      }
    }
  }

  // B. 橫列鎖定區域：第 r 列可放貓的空格全在某顏色 reg，故該顏色在其他橫列的空格全標記為 ✕
  for (let r = 0; r < N; r++) {
    if (playerGrid[r].includes('CAT')) continue;
    const empties = playerGrid[r]
      .map((status, c) => (status === 'EMPTY' ? { r, c } : null))
      .filter((v): v is CellCoord => v !== null);
    if (empties.length >= 2) {
      const firstReg = regionGrid[r][empties[0].c];
      if (empties.every((pt) => regionGrid[r][pt.c] === firstReg)) {
        const toEliminate: CellCoord[] = [];
        for (let otherR = 0; otherR < N; otherR++) {
          if (otherR === r) continue;
          for (let col = 0; col < N; col++) {
            if (regionGrid[otherR][col] === firstReg && playerGrid[otherR][col] === 'EMPTY') {
              toEliminate.push({ r: otherR, c: col });
            }
          }
        }
        if (toEliminate.length > 0) {
          const zhReg = getRegionName(firstReg, false);
          const enReg = getRegionName(firstReg, true);
          const msgZh = `第 ${r + 1} 列可放貓的空格全在【${zhReg}】，故該顏色在其他橫列的 ${toEliminate.length} 處空格應標記為 ✕`;
          const msgEn = `Row ${r + 1} candidates all lie in [${enReg}]. Other ${toEliminate.length} cells of this region should be marked ✕.`;
          const reasonZh = '橫列鎖定區域';
          const reasonEn = 'Row Pointing Region';
          return {
            coord: toEliminate[0],
            targetCells: toEliminate,
            sourceCells: empties,
            highlightRows: [r],
            highlightRegions: [firstReg],
            suggestedStatus: 'CROSS',
            message: isEn ? msgEn : msgZh,
            messageEn: msgEn,
            reason: isEn ? reasonEn : reasonZh,
            reasonEn: reasonEn,
          };
        }
      }
    }
  }

  // C. 區域鎖定行列 (Pointing Line)：某區域的剩餘空格全部落在同一橫列或同一直欄
  for (let reg = 0; reg < N; reg++) {
    let hasCat = false;
    const emptiesInReg: CellCoord[] = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (regionGrid[r][c] === reg) {
          if (playerGrid[r][c] === 'CAT') hasCat = true;
          if (playerGrid[r][c] === 'EMPTY') emptiesInReg.push({ r, c });
        }
      }
    }
    if (!hasCat && emptiesInReg.length >= 2) {
      const firstRow = emptiesInReg[0].r;
      const firstCol = emptiesInReg[0].c;

      // 全部在同一橫列
      if (emptiesInReg.every((pt) => pt.r === firstRow)) {
        const toEliminate: CellCoord[] = [];
        for (let col = 0; col < N; col++) {
          if (regionGrid[firstRow][col] !== reg && playerGrid[firstRow][col] === 'EMPTY') {
            toEliminate.push({ r: firstRow, c: col });
          }
        }
        if (toEliminate.length > 0) {
          const zhReg = getRegionName(reg, false);
          const enReg = getRegionName(reg, true);
          const msgZh = `【${zhReg}】所有剩餘空格皆在第 ${firstRow + 1} 列，故該列其餘區域的 ${toEliminate.length} 處空格應標記為 ✕`;
          const msgEn = `All remaining empty cells of [${enReg}] are in Row ${firstRow + 1}. Other ${toEliminate.length} cells in this row should be marked ✕.`;
          const reasonZh = '區域鎖定橫列';
          const reasonEn = 'Region Pointing Row';
          return {
            coord: toEliminate[0],
            targetCells: toEliminate,
            sourceCells: emptiesInReg,
            highlightRows: [firstRow],
            highlightRegions: [reg],
            suggestedStatus: 'CROSS',
            message: isEn ? msgEn : msgZh,
            messageEn: msgEn,
            reason: isEn ? reasonEn : reasonZh,
            reasonEn: reasonEn,
          };
        }
      }

      // 全部在同一直欄
      if (emptiesInReg.every((pt) => pt.c === firstCol)) {
        const toEliminate: CellCoord[] = [];
        for (let row = 0; row < N; row++) {
          if (regionGrid[row][firstCol] !== reg && playerGrid[row][firstCol] === 'EMPTY') {
            toEliminate.push({ r: row, c: firstCol });
          }
        }
        if (toEliminate.length > 0) {
          const zhReg = getRegionName(reg, false);
          const enReg = getRegionName(reg, true);
          const msgZh = `【${zhReg}】所有剩餘空格皆在第 ${firstCol + 1} 欄，故該欄其餘區域的 ${toEliminate.length} 處空格應標記為 ✕`;
          const msgEn = `All remaining empty cells of [${enReg}] are in Column ${firstCol + 1}. Other ${toEliminate.length} cells in this column should be marked ✕.`;
          const reasonZh = '區域鎖定直欄';
          const reasonEn = 'Region Pointing Column';
          return {
            coord: toEliminate[0],
            targetCells: toEliminate,
            sourceCells: emptiesInReg,
            highlightCols: [firstCol],
            highlightRegions: [reg],
            suggestedStatus: 'CROSS',
            message: isEn ? msgEn : msgZh,
            messageEn: msgEn,
            reason: isEn ? reasonEn : reasonZh,
            reasonEn: reasonEn,
          };
        }
      }
    }
  }

  // 4. 若無顯而易見的一步，調用完整的 solver 求解解答，找出下一個解答格
  const solverRes = solveMeowdoku(regionGrid, colors);
  if (solverRes.success && solverRes.solutionGrid) {
    // 優先檢查 solver 的推導步驟是否有尚未完成的步驟
    for (const step of solverRes.steps) {
      if (step.ruleType === 'INITIAL') continue;

      if (step.catPlaced && playerGrid[step.catPlaced.r][step.catPlaced.c] !== 'CAT') {
        const msgZh = step.explanation;
        const msgEn = step.explanationEn || step.explanation;
        const reasonZh = step.title;
        const reasonEn = step.titleEn || step.title;
        return {
          coord: step.catPlaced,
          targetCells: [step.catPlaced],
          highlightRows: step.highlightRows,
          highlightCols: step.highlightCols,
          highlightRegions: step.highlightRegions,
          suggestedStatus: 'CAT',
          message: isEn ? msgEn : msgZh,
          messageEn: msgEn,
          reason: isEn ? reasonEn : reasonZh,
          reasonEn: reasonEn,
        };
      }

      if (step.eliminatedCells && step.eliminatedCells.length > 0) {
        const remainingElim = step.eliminatedCells.filter(
          (pt) => playerGrid[pt.r][pt.c] === 'EMPTY'
        );
        if (remainingElim.length > 0) {
          const msgZh = step.explanation;
          const msgEn = step.explanationEn || step.explanation;
          const reasonZh = step.title;
          const reasonEn = step.titleEn || step.title;
          return {
            coord: remainingElim[0],
            targetCells: remainingElim,
            highlightRows: step.highlightRows,
            highlightCols: step.highlightCols,
            highlightRegions: step.highlightRegions,
            suggestedStatus: 'CROSS',
            message: isEn ? msgEn : msgZh,
            messageEn: msgEn,
            reason: isEn ? reasonEn : reasonZh,
            reasonEn: reasonEn,
          };
        }
      }
    }

    // 若步驟對齊找不到，直接由正解提供提示
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        // 如果玩家還沒填，而正解是 CAT
        if (playerGrid[r][c] !== 'CAT' && solverRes.solutionGrid[r][c] === 'CAT') {
          const msgZh = `根據深層交叉邏輯推導，第 ${r + 1} 列、第 ${c + 1} 欄應為貓咪`;
          const msgEn = `Based on deep cross-deduction, Row ${r + 1}, Col ${c + 1} must contain a cat.`;
          const reasonZh = '進階邏輯交叉推導';
          const reasonEn = 'Advanced Logic Deduction';
          return {
            coord: { r, c },
            targetCells: [{ r, c }],
            suggestedStatus: 'CAT',
            message: isEn ? msgEn : msgZh,
            messageEn: msgEn,
            reason: isEn ? reasonEn : reasonZh,
            reasonEn: reasonEn,
          };
        }
      }
    }
  }

  return null;
}
