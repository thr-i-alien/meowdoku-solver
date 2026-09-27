import React, { useState, useRef, useEffect } from 'react';
import type { CellCoord, CellStatus, DeductionStep, RegionColor, AppMode, PlayTool, ConflictDetail, HintInfo } from '../types/game';
import { DEFAULT_COLORS } from '../logic/presets';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { CatIcon, PawIcon, CrossIcon } from './icons';
import { useI18n } from '../i18n';


interface BoardProps {
  gridSize: number;
  regionGrid: number[][];
  statusGrid: CellStatus[][];
  colors?: RegionColor[];
  currentStep?: DeductionStep;
  mode: AppMode;
  selectedColorId?: number;
  activePlayTool?: PlayTool;
  conflictCells?: CellCoord[];
  conflictDetails?: Record<string, ConflictDetail>;
  hintCoord?: CellCoord | null;
  hintInfo?: HintInfo | null;
  onCellPaint?: (r: number, c: number, colorId: number) => void;
  onPlayerToggleCross?: (r: number, c: number) => void;
  onPlayerToggleCat?: (r: number, c: number) => void;
  onPlayerBatchCross?: (cells: CellCoord[], targetStatus: CellStatus) => void;
}

export const Board: React.FC<BoardProps> = ({
  gridSize,
  regionGrid,
  statusGrid,
  colors = DEFAULT_COLORS,
  currentStep,
  mode,
  activePlayTool = 'CROSS',
  conflictCells = [],
  conflictDetails = {},
  hintCoord = null,
  hintInfo = null,
  onPlayerToggleCross,
  onPlayerToggleCat,
  onPlayerBatchCross,
}) => {
  const { lang, t, interpolate } = useI18n();

  // 拖曳狀態管理

  const [isMouseDown, setIsMouseDown] = useState(false);
  const dragPaintActionRef = useRef<CellStatus | null>(null);
  const touchedCellsRef = useRef<Set<string>>(new Set());

  // 懸停格子（用於聯動高亮對應的列號與行號數字標記）
  const [hoveredCell, setHoveredCell] = useState<CellCoord | null>(null);

  // 記錄最後一次觸控時間，用於過濾行動裝置瀏覽器自動派發的合成滑鼠事件（防穿透 Ghost Clicks）
  const lastTouchTimeRef = useRef<number>(0);

  // 雙擊與單擊計時器管理（用於手機端雙擊放貓）
  const lastTapRef = useRef<{ r: number; c: number; time: number } | null>(null);
  const pendingTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 當前手指觸控軌跡狀態
  const touchStateRef = useRef<{
    startX: number;
    startY: number;
    r: number;
    c: number;
    isDragging: boolean;
    moved: boolean;
  } | null>(null);

  // 組件卸載時清理計時器
  useEffect(() => {
    return () => {
      if (pendingTapTimerRef.current) {
        clearTimeout(pendingTapTimerRef.current);
      }
    };
  }, []);

  // 檢查是否為衝突格
  const isConflict = (r: number, c: number) =>
    conflictCells.some((cell) => cell.r === r && cell.c === c);

  // 檢查是否為提示目標格
  const isHintTarget = (r: number, c: number) => {
    if (hintInfo) {
      if (hintInfo.targetCells && hintInfo.targetCells.length > 0) {
        return hintInfo.targetCells.some((cell) => cell.r === r && cell.c === c);
      }
      return hintInfo.coord.r === r && hintInfo.coord.c === c;
    }
    return hintCoord !== null && hintCoord.r === r && hintCoord.c === c;
  };

  // 檢查是否為提示推導來源格
  const isHintSource = (r: number, c: number) => {
    return Boolean(hintInfo?.sourceCells?.some((cell) => cell.r === r && cell.c === c));
  };

  // 提示類型（放置貓咪 CAT 或排除 CROSS）
  const currentHintStatus = hintInfo?.suggestedStatus || 'CAT';

  // 通用格點互動處理器 (滑鼠與觸控共用)
  const triggerCellAction = (r: number, c: number, isInitial = false) => {
    if (mode === 'PLAY') {
      const currentStatus = statusGrid[r]?.[c] || 'EMPTY';
      if (activePlayTool === 'CAT') {
        if (isInitial && onPlayerToggleCat) {
          onPlayerToggleCat(r, c);
        }
      } else {
        // CROSS 工具
        if (currentStatus === 'CAT') return;
        if (isInitial) {
          const nextStatus: CellStatus = currentStatus === 'CROSS' ? 'EMPTY' : 'CROSS';
          dragPaintActionRef.current = nextStatus;
          if (onPlayerToggleCross) onPlayerToggleCross(r, c);
        } else {
          const targetStatus = dragPaintActionRef.current;
          if (targetStatus && currentStatus !== targetStatus && onPlayerBatchCross) {
            onPlayerBatchCross([{ r, c }], targetStatus);
          }
        }
      }
    }
  };

  // 滑鼠按下（左鍵）
  const handleMouseDown = (e: React.MouseEvent, r: number, c: number) => {
    // 若在 600ms 內剛發生過觸控事件，忽略 iOS/Android 瀏覽器合成的幽靈滑鼠點擊
    if (Date.now() - lastTouchTimeRef.current < 600) return;
    if (e.button !== 0) return;

    setIsMouseDown(true);
    touchedCellsRef.current = new Set([`${r},${c}`]);
    triggerCellAction(r, c, true);
  };

  // 滑鼠右鍵按下：放置或清除貓咪
  const handleContextMenu = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault(); // 阻止原生右鍵選單
    if (Date.now() - lastTouchTimeRef.current < 600) return;
    if (mode === 'PLAY' && onPlayerToggleCat) {
      onPlayerToggleCat(r, c);
    }
  };

  // 雙擊事件（桌機滑鼠左鍵雙擊也支援放置/收回貓咪）
  const handleDoubleClick = (_e: React.MouseEvent, r: number, c: number) => {
    if (Date.now() - lastTouchTimeRef.current < 600) return;
    if (mode === 'PLAY' && onPlayerToggleCat) {
      onPlayerToggleCat(r, c);
    }
  };

  // 滑鼠滑入
  const handleMouseEnter = (r: number, c: number) => {
    if (Date.now() - lastTouchTimeRef.current < 600) return;
    setHoveredCell({ r, c });

    if (!isMouseDown) return;

    const key = `${r},${c}`;
    if (touchedCellsRef.current.has(key)) return;
    touchedCellsRef.current.add(key);

    triggerCellAction(r, c, false);
  };

  // 滑鼠/觸控釋放
  const handleMouseUp = () => {
    setIsMouseDown(false);
    dragPaintActionRef.current = null;
    touchedCellsRef.current.clear();
  };

  // 手機觸控事件支援：手指按下
  const handleTouchStart = (e: React.TouchEvent) => {
    lastTouchTimeRef.current = Date.now();
    const touch = e.touches[0];
    if (!touch) return;

    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.grid-cell') as HTMLElement | null;
    if (!targetEl || targetEl.dataset.r === undefined || targetEl.dataset.c === undefined) {
      touchStateRef.current = null;
      return;
    }

    const r = parseInt(targetEl.dataset.r, 10);
    const c = parseInt(targetEl.dataset.c, 10);
    setHoveredCell({ r, c });

    // 若有尚未結算的單擊計時器，且點擊了不同的格子，立即結算上一個格子的單擊
    if (pendingTapTimerRef.current) {
      if (lastTapRef.current && (lastTapRef.current.r !== r || lastTapRef.current.c !== c)) {
        clearTimeout(pendingTapTimerRef.current);
        pendingTapTimerRef.current = null;
        triggerCellAction(lastTapRef.current.r, lastTapRef.current.c, true);
        lastTapRef.current = null;
      }
    }

    touchStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      r,
      c,
      isDragging: false,
      moved: false,
    };
  };

  // 手機觸控事件支援：手指滑動劃記
  const handleTouchMove = (e: React.TouchEvent) => {
    lastTouchTimeRef.current = Date.now();
    const state = touchStateRef.current;
    if (!state) return;

    const touch = e.touches[0];
    if (!touch) return;

    const dx = touch.clientX - state.startX;
    const dy = touch.clientY - state.startY;
    const distSq = dx * dx + dy * dy;

    // 滑動距離大於 8 像素，判定進入拖曳劃記模式
    if (!state.isDragging && distSq > 64) {
      state.isDragging = true;
      state.moved = true;

      // 清除待處理的單擊計時器
      if (pendingTapTimerRef.current) {
        clearTimeout(pendingTapTimerRef.current);
        pendingTapTimerRef.current = null;
        lastTapRef.current = null;
      }

      if (mode === 'PLAY') {
        setIsMouseDown(true);
        touchedCellsRef.current = new Set([`${state.r},${state.c}`]);
        triggerCellAction(state.r, state.c, true);
      }
    }

    if (state.isDragging) {
      const targetEl = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.grid-cell') as HTMLElement | null;
      if (targetEl && targetEl.dataset.r !== undefined && targetEl.dataset.c !== undefined) {
        const curR = parseInt(targetEl.dataset.r, 10);
        const curC = parseInt(targetEl.dataset.c, 10);
        setHoveredCell({ r: curR, c: curC });

        const key = `${curR},${curC}`;
        if (!touchedCellsRef.current.has(key)) {
          touchedCellsRef.current.add(key);
          triggerCellAction(curR, curC, false);
        }
      }

      if (e.cancelable && activePlayTool === 'CROSS') {
        e.preventDefault();
      }
    }
  };

  // 手機觸控事件支援：手指抬起（判定單擊與雙擊）
  const handleTouchEnd = (_e: React.TouchEvent) => {
    lastTouchTimeRef.current = Date.now();
    const state = touchStateRef.current;
    touchStateRef.current = null;

    if (!state) {
      handleMouseUp();
      return;
    }

    // 若剛剛為滑動拖曳劃記結束
    if (state.isDragging) {
      handleMouseUp();
      return;
    }

    const { r, c } = state;
    handleMouseUp();

    if (mode === 'PLAY') {
      const now = Date.now();
      const DOUBLE_TAP_THRESHOLD = 260; // 260ms 雙擊間隔閾值

      // 檢查是否為同一格子的雙擊 (Double Tap)
      if (
        lastTapRef.current &&
        lastTapRef.current.r === r &&
        lastTapRef.current.c === c &&
        now - lastTapRef.current.time < DOUBLE_TAP_THRESHOLD
      ) {
        // 成功判定雙擊：清除單擊排程，執行放貓 / 收貓！
        if (pendingTapTimerRef.current) {
          clearTimeout(pendingTapTimerRef.current);
          pendingTapTimerRef.current = null;
        }
        lastTapRef.current = null;

        if (onPlayerToggleCat) {
          onPlayerToggleCat(r, c);
        }
      } else {
        // 第一次點擊該格子
        if (activePlayTool === 'CAT') {
          // 若工具本就是 CAT，單擊直接放貓
          if (onPlayerToggleCat) {
            onPlayerToggleCat(r, c);
          }
        } else {
          // CROSS 工具模式：排程單擊等待，檢查是否有後續雙擊
          lastTapRef.current = { r, c, time: now };
          pendingTapTimerRef.current = setTimeout(() => {
            triggerCellAction(r, c, true);
            pendingTapTimerRef.current = null;
            lastTapRef.current = null;
          }, DOUBLE_TAP_THRESHOLD);
        }
      }
    }
  };

  // 手勢取消
  const handleTouchCancel = () => {
    lastTouchTimeRef.current = Date.now();
    touchStateRef.current = null;
    if (pendingTapTimerRef.current) {
      clearTimeout(pendingTapTimerRef.current);
      pendingTapTimerRef.current = null;
      lastTapRef.current = null;
    }
    handleMouseUp();
  };

  const dynamicGap = gridSize >= 15 ? 2 : gridSize >= 10 ? 4 : 6;
  const dynamicPadding = gridSize >= 15 ? 6 : gridSize >= 10 ? 8 : 12;
  const coordFontSize = gridSize >= 15 ? '0.64rem' : gridSize >= 11 ? '0.72rem' : '0.78rem';
  const cellBorderRadius = gridSize >= 15 ? 4 : gridSize >= 10 ? 6 : 10;

  return (
    <div
      className="board-wrapper"
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        handleMouseUp();
        setHoveredCell(null);
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="board-coordinate-container">
        {/* 上方直欄數字標記列 (1 ~ N) */}
        <div className="coord-top-row">
          <div className="coord-corner" title="Meowdoku 座標系統 (列/欄)">
            <PawIcon size={gridSize >= 15 ? 12 : 15} color="var(--text-muted)" />
          </div>
          <div
            className="coord-col-headers"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
              gap: dynamicGap,
              padding: `0 ${dynamicPadding}px`,
            }}
          >
            {Array.from({ length: gridSize }, (_, c) => {
              const isHovered = hoveredCell?.c === c;
              const isHighlighted =
                (mode === 'SOLVE' && currentStep?.highlightCols?.includes(c)) ||
                (mode === 'PLAY' && Boolean(hintInfo?.highlightCols?.includes(c)));
              return (
                <div
                  key={c}
                  className={`coord-header col-header ${isHovered ? 'active-hover' : ''} ${
                    isHighlighted ? 'active-highlight' : ''
                  }`}
                  style={{ fontSize: coordFontSize }}
                  title={`第 ${c + 1} 欄`}
                >
                  {c + 1}
                </div>
              );
            })}
          </div>
        </div>

        {/* 下方主區域：左側橫列數字標記 (1 ~ N) + 棋盤主體 */}
        <div className="coord-main-row">
          {/* 左側橫列標籤欄 */}
          <div
            className="coord-row-headers"
            style={{
              gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
              gap: dynamicGap,
              padding: `${dynamicPadding}px 0`,
            }}
          >
            {Array.from({ length: gridSize }, (_, r) => {
              const isHovered = hoveredCell?.r === r;
              const isHighlighted =
                (mode === 'SOLVE' && currentStep?.highlightRows?.includes(r)) ||
                (mode === 'PLAY' && Boolean(hintInfo?.highlightRows?.includes(r)));
              return (
                <div
                  key={r}
                  className={`coord-header row-header ${isHovered ? 'active-hover' : ''} ${
                    isHighlighted ? 'active-highlight' : ''
                  }`}
                  style={{ fontSize: coordFontSize }}
                  title={`第 ${r + 1} 列`}
                >
                  {r + 1}
                </div>
              );
            })}
          </div>

          {/* 棋盤格子主體 */}
          <div
            className="meow-grid"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
              gap: dynamicGap,
              padding: dynamicPadding,
              userSelect: 'none',
            }}
          >
            {regionGrid.map((row, r) =>
              row.map((regionId, c) => {
                const colorDef =
                  (colors && colors[regionId]) ||
                  DEFAULT_COLORS.find((clr) => clr.id === regionId) ||
                  DEFAULT_COLORS[regionId % DEFAULT_COLORS.length];
                const status = statusGrid[r] ? statusGrid[r][c] : 'EMPTY';

                // SOLVE 模式推導高亮
                const isCatPlacedHere =
                  mode === 'SOLVE' && currentStep?.catPlaced?.r === r && currentStep?.catPlaced?.c === c;
                const isEliminatedHere =
                  mode === 'SOLVE' && currentStep?.eliminatedCells?.some((cell) => cell.r === r && cell.c === c);
                const isFocused = isCatPlacedHere || isEliminatedHere;
                const isRowHighlighted = mode === 'SOLVE' && currentStep?.highlightRows?.includes(r);
                const isColHighlighted = mode === 'SOLVE' && currentStep?.highlightCols?.includes(c);
                const isRegionHighlighted = mode === 'SOLVE' && currentStep?.highlightRegions?.includes(regionId);

                // PLAY 模式的即時衝突與提示
                const hasConflict = mode === 'PLAY' && isConflict(r, c);
                const isTarget = mode === 'PLAY' && isHintTarget(r, c);
                const isSource = mode === 'PLAY' && isHintSource(r, c);
                const isHintCat = isTarget && currentHintStatus === 'CAT';
                const isHintCross = isTarget && currentHintStatus === 'CROSS';
                const conflictDetail = conflictDetails[`${r},${c}`];
                const isWrongCross = status === 'CROSS' && hasConflict;

                const colorName = lang === 'en' ? (colorDef.nameEn || t.colors[colorDef.id] || colorDef.name) : colorDef.name;

                let cellTitle =
                  mode === 'PLAY'
                    ? interpolate(t.board.cellTooltipPlay, { r: r + 1, c: c + 1 })
                    : interpolate(t.board.cellTooltipColor, { r: r + 1, c: c + 1, color: colorName });

                if (hasConflict && conflictDetail) {
                  cellTitle = `[${lang === 'en' ? `Row ${r + 1}, Col ${c + 1}` : `列 ${r + 1}, 欄 ${c + 1}`}] ${conflictDetail.message}`;
                } else if (isHintCat) {
                  cellTitle = interpolate(t.board.cellHintCat, { r: r + 1, c: c + 1 });
                } else if (isHintCross) {
                  cellTitle = interpolate(t.board.cellHintCross, { r: r + 1, c: c + 1 });
                }

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`grid-cell ${isFocused ? 'highlight-focus' : ''} ${
                      isRowHighlighted || isColHighlighted || isRegionHighlighted ? 'highlight-rowcol' : ''
                    } ${hasConflict ? 'cell-conflict' : ''} ${isWrongCross ? 'cell-conflict-cross' : ''} ${
                      isHintCat ? 'cell-hint cell-hint-cat' : ''
                    } ${isHintCross ? 'cell-hint cell-hint-cross' : ''} ${
                      isSource ? 'cell-hint-source' : ''
                    } ${mode === 'PLAY' ? 'cell-interactive' : ''}`}
                    style={{
                      backgroundColor: colorDef.bgHex,
                      border: `${gridSize >= 15 ? 1.5 : 2}px solid ${colorDef.borderHex}`,
                      borderRadius: cellBorderRadius,
                    }}
                    data-r={r}
                    data-c={c}
                    onMouseDown={(e) => handleMouseDown(e, r, c)}
                    onMouseEnter={() => handleMouseEnter(r, c)}
                    onDoubleClick={(e) => handleDoubleClick(e, r, c)}
                    onContextMenu={(e) => handleContextMenu(e, r, c)}
                    title={cellTitle}
                  >
                    {status === 'CAT' && (
                      <span className="cell-cat">
                        <CatIcon size="80%" />
                      </span>
                    )}
                    {status === 'CROSS' && (
                      <span className={`cell-cross ${isWrongCross ? 'cross-wrong' : ''}`}>
                        <CrossIcon />
                      </span>
                    )}

                    {/* 衝突警示圖標 */}
                    {hasConflict && (
                      <span
                        className="conflict-badge"
                        title={conflictDetail?.message || (lang === 'en' ? 'Conflict: Check position and rules!' : '衝突違規：請檢查位置或正解關係！')}
                      >
                        <AlertTriangle size={14} color="#ffffff" />
                      </span>
                    )}

                    {/* 智能提示：放貓半透明陰影/虛影預覽 */}
                    {isHintCat && status !== 'CAT' && (
                      <span className="cell-cat-ghost" aria-hidden="true">
                        <CatIcon size="80%" />
                      </span>
                    )}

                    {/* 智能提示標記：放貓 (CAT) */}
                    {isHintCat && (
                      <span className="hint-indicator hint-indicator-cat" title={lang === 'en' ? 'Hint: Place cat' : '提示放置貓咪'}>
                        <Sparkles size={16} color="#e59819" />
                      </span>
                    )}

                    {/* 智能提示標記：放 ✕ (CROSS) */}
                    {isHintCross && (
                      <span className="hint-indicator hint-indicator-cross" title={lang === 'en' ? 'Hint: Eliminate ✕' : '提示排除劃記 ✕'}>
                        <CrossIcon size={16} strokeWidth={4} color="#ef476f" />
                      </span>
                    )}
                  </div>
                );
              })
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
