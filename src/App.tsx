import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DEFAULT_INITIAL_GRID, DEFAULT_COLORS } from './logic/presets';
import { solveMeowdoku } from './logic/solver';
import { checkConflicts, checkVictory, autoFillCrosses, getSmartHint } from './logic/validator';
import {
  floodFill,
  checkMapIntegrity,
  generateRandomValidBoard,
  createUniformBoard,
  resizeBoard,
  ensureColorsForSize,
} from './logic/mapEditor';
import type { SolveResult, CellStatus, RegionColor, AppMode, PlayTool, EditTool, HintInfo, CellCoord } from './types/game';
import { Header } from './components/Header';
import { Board } from './components/Board';
import { StepExplanation } from './components/StepExplanation';
import { TimelinePlayer } from './components/TimelinePlayer';
import { PlayControlPanel } from './components/PlayControlPanel';
import { EditControlPanel } from './components/EditControlPanel';
import { ColorPalette } from './components/ColorPalette';
import { HintCard } from './components/HintCard';
import { VictoryModal } from './components/VictoryModal';
import { ImageUploadModal } from './components/ImageUploadModal';
import { HelpModal } from './components/HelpModal';
import { ExportTextModal } from './components/ExportTextModal';
import { AnnouncementModal, ANNOUNCEMENT_STORAGE_KEY } from './components/AnnouncementModal';
import { Footer } from './components/Footer';
import { useI18n } from './i18n';
import {
  AlertCircle,
  Info,
  Timer,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Zap,
  Gamepad2,
  AlertTriangle,
  Paintbrush,
  PaintBucket,
  Dices,
} from 'lucide-react';
import { CatIcon } from './components/icons';

export const App: React.FC = () => {
  const { lang, t, interpolate } = useI18n();

  // 格式化秒數為 mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // 核心模式管理：'PLAY' (手動解題) | 'SOLVE' (AI 逐步推導) | 'EDIT' (地圖編輯)
  const [mode, setMode] = useState<AppMode>('SOLVE');

  // 盤面與顏色配置
  const [gridSize, setGridSize] = useState<number>(10);
  const [regionGrid, setRegionGrid] = useState<number[][]>(DEFAULT_INITIAL_GRID);
  const [activeColors, setActiveColors] = useState<RegionColor[]>(DEFAULT_COLORS);

  // 地圖編輯專屬狀態：選取顏色、筆刷工具、歷史復原/重做
  const [selectedColorId, setSelectedColorId] = useState<number>(0);
  const [editTool, setEditTool] = useState<EditTool>('BRUSH');
  const [history, setHistory] = useState<number[][][]>([DEFAULT_INITIAL_GRID]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // 地圖合法性與連通性分析
  const mapIntegrity = useMemo(() => {
    return checkMapIntegrity(regionGrid, gridSize);
  }, [regionGrid, gridSize]);

  // 即時計算當前題目的正解盤面 (供手動挑戰解題時即時比對與檢查衝突)
  const currentSolution = useMemo(() => {
    const uniqueRegs = new Set(regionGrid.flat()).size;
    if (uniqueRegs !== gridSize) return null;
    const res = solveMeowdoku(regionGrid, activeColors);
    return res.success && res.solutionGrid ? res.solutionGrid : null;
  }, [regionGrid, activeColors, gridSize]);

  // 玩家手動解題狀態
  const [playerGrid, setPlayerGrid] = useState<CellStatus[][]>(() =>
    Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => 'EMPTY' as CellStatus))
  );
  const playTool: PlayTool = 'CROSS';
  const [showConflicts, setShowConflicts] = useState<boolean>(true);
  const [autoCrossOnCat, setAutoCrossOnCat] = useState<boolean>(false);
  const [hintInfo, setHintInfo] = useState<HintInfo | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState<boolean>(false);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerNotice = (msg: string, duration = 3500) => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    setInfoNotice(msg);
    noticeTimerRef.current = setTimeout(() => {
      setInfoNotice(null);
    }, duration);
  };

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, []);

  // AI 求解與時間軸狀態
  const [solveResult, setSolveResult] = useState<SolveResult | null>(() => {
    return solveMeowdoku(DEFAULT_INITIAL_GRID, DEFAULT_COLORS);
  });
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // 彈窗與全域錯誤橫幅
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 檢查是否已閱讀過本次功能重大更新公告
  useEffect(() => {
    try {
      const hasSeen = localStorage.getItem(ANNOUNCEMENT_STORAGE_KEY);
      if (!hasSeen) {
        setIsAnnouncementOpen(true);
      }
    } catch {
      // 避免無痕模式下 localStorage 存取異常
    }
  }, []);

  // 計時器
  const solveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const boardCardRef = useRef<HTMLDivElement>(null);

  // 遊戲進行計時器
  useEffect(() => {
    if (mode === 'PLAY' && isTimerRunning && !isVictoryModalOpen) {
      const timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [mode, isTimerRunning, isVictoryModalOpen]);

  // 求解器自動播放邏輯
  useEffect(() => {
    if (mode === 'SOLVE' && isPlaying && solveResult && solveResult.steps.length > 0) {
      const intervalMs = Math.round(1000 / playbackSpeed);
      solveTimerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev < solveResult.steps.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, intervalMs);
    } else {
      if (solveTimerRef.current) clearInterval(solveTimerRef.current);
    }
    return () => {
      if (solveTimerRef.current) clearInterval(solveTimerRef.current);
    };
  }, [mode, isPlaying, solveResult, playbackSpeed]);

  // 執行 AI 求解推導
  const handleRunSolver = (gridToSolve = regionGrid, colorsToUse = activeColors) => {
    setIsPlaying(false);
    setErrorMessage(null);
    const result = solveMeowdoku(gridToSolve, colorsToUse);
    setSolveResult(result);
    if (!result.success) {
      setErrorMessage(result.errorMessage || t.toasts.solverFailed);
      setCurrentStepIndex(0);
    } else {
      setCurrentStepIndex(0);
    }
  };

  // 玩家操作：左鍵切換 ✕
  const handlePlayerToggleCross = (r: number, c: number) => {
    const current = playerGrid[r]?.[c] || 'EMPTY';
    if (current === 'CAT') return; // 不誤消已放置的貓咪

    // 動態更新提示目標
    if (hintInfo && hintInfo.suggestedStatus === 'CROSS') {
      const remaining = hintInfo.targetCells?.filter((pt) => !(pt.r === r && pt.c === c));
      if (remaining && remaining.length > 0) {
        setHintInfo({
          ...hintInfo,
          coord: remaining[0],
          targetCells: remaining,
        });
      } else {
        setHintInfo(null);
      }
    } else {
      setHintInfo(null);
    }

    const nextStatus: CellStatus = current === 'CROSS' ? 'EMPTY' : 'CROSS';

    // 若放下 ✕，立即檢查與正解是否有衝突
    if (nextStatus === 'CROSS' && currentSolution && currentSolution[r]?.[c] === 'CAT') {
      triggerNotice(t.toasts.crossConflictOnCat(r + 1, c + 1), 3500);
    }

    setPlayerGrid((prev) => {
      return prev.map((row, ri) =>
        row.map((cell, ci) => (ri === r && ci === c ? nextStatus : cell))
      );
    });
  };

  // 玩家操作：右鍵或選中貓咪工具放置 / 移除貓咪
  const handlePlayerToggleCat = (r: number, c: number) => {
    setHintInfo(null);
    const current = playerGrid[r]?.[c] || 'EMPTY';

    // 若放下貓咪，立即檢查與正解是否有衝突
    if (current !== 'CAT' && currentSolution) {
      if (currentSolution[r]?.[c] !== 'CAT') {
        triggerNotice(t.toasts.catConflictWrongPos(r + 1, c + 1), 3500);
      } else {
        if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
        setInfoNotice(null);
      }
    }

    setPlayerGrid((prev) => {
      let nextGrid: CellStatus[][];

      if (current === 'CAT') {
        // 取消貓咪變為空白
        nextGrid = prev.map((row, ri) =>
          row.map((cell, ci) => (ri === r && ci === c ? 'EMPTY' : cell))
        );
      } else {
        // 放置貓咪
        nextGrid = prev.map((row, ri) =>
          row.map((cell, ci) => (ri === r && ci === c ? 'CAT' : cell))
        );

        // 若啟用「放貓自動填 ✕」輔助
        if (autoCrossOnCat) {
          nextGrid = autoFillCrosses(nextGrid, regionGrid, r, c);
        }
      }

      // 檢查是否達成通關勝利
      if (checkVictory(nextGrid, regionGrid, currentSolution)) {
        setIsVictoryModalOpen(true);
        setIsTimerRunning(false);
      }

      return nextGrid;
    });
  };

  // 玩家操作：拖曳批次畫 ✕ 或批次清除 ✕
  const handlePlayerBatchCross = (cells: CellCoord[], targetStatus: CellStatus) => {
    // 動態更新提示目標
    if (hintInfo && hintInfo.suggestedStatus === 'CROSS') {
      const touchedKeys = new Set(cells.map((pt) => `${pt.r},${pt.c}`));
      const remaining = hintInfo.targetCells?.filter((pt) => !touchedKeys.has(`${pt.r},${pt.c}`));
      if (remaining && remaining.length > 0) {
        setHintInfo({
          ...hintInfo,
          coord: remaining[0],
          targetCells: remaining,
        });
      } else {
        setHintInfo(null);
      }
    } else {
      setHintInfo(null);
    }

    // 若批次劃 ✕，檢查是否誤劃正解貓咪位置
    if (targetStatus === 'CROSS' && currentSolution) {
      const conflictOnSolution = cells.find(
        ({ r, c }) => currentSolution[r]?.[c] === 'CAT' && playerGrid[r]?.[c] !== 'CAT'
      );
      if (conflictOnSolution) {
        triggerNotice(
          t.toasts.batchCrossConflict(conflictOnSolution.r + 1, conflictOnSolution.c + 1),
          3500
        );
      }
    }


    setPlayerGrid((prev) => {
      const nextGrid = prev.map((row) => [...row]);
      for (const { r, c } of cells) {
        if (nextGrid[r][c] !== 'CAT') {
          nextGrid[r][c] = targetStatus;
        }
      }
      return nextGrid;
    });
  };

  // 一鍵套用當前提示
  const handleApplyHint = () => {
    if (!hintInfo) return;
    const { suggestedStatus, coord, targetCells } = hintInfo;
    const targets = targetCells && targetCells.length > 0 ? targetCells : [coord];

    if (suggestedStatus === 'CAT') {
      const { r, c } = targets[0];
      handlePlayerToggleCat(r, c);
      setHintInfo(null);
    } else if (suggestedStatus === 'CROSS') {
      handlePlayerBatchCross(targets, 'CROSS');
      setHintInfo(null);
    }
  };

  // 取得智能提示
  const handleRequestHint = () => {
    const hint = getSmartHint(playerGrid, regionGrid, activeColors, lang);
    if (hint) {
      setHintInfo(hint);
      // 手機端視窗若已往下滑動，平滑捲動確保棋盤與緊鄰下方的提示說明卡片都在視野中
      if (typeof window !== 'undefined' && window.innerWidth <= 980) {
        setTimeout(() => {
          boardCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 50);
      }
    } else {
      triggerNotice(t.toasts.noHintFound, 4000);
    }
  };

  // 清空手動盤面
  const handleClearBoardMarks = () => {
    const emptyGrid = Array.from({ length: gridSize }, () =>
      Array.from({ length: gridSize }, () => 'EMPTY' as CellStatus)
    );
    setPlayerGrid(emptyGrid);
    setHintInfo(null);
  };

  // 地圖編輯：歷史步進推入
  const pushGridHistory = (newGrid: number[][]) => {
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, newGrid].slice(-30);
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 29));
    setRegionGrid(newGrid);
  };

  // 地圖編輯：復原
  const handleUndoGrid = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setRegionGrid(history[prevIdx]);
    }
  };

  // 地圖編輯：重做
  const handleRedoGrid = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setRegionGrid(history[nextIdx]);
    }
  };

  // 地圖編輯：單格筆刷塗色
  const handleCellPaint = (r: number, c: number, colorId: number) => {
    if (regionGrid[r]?.[c] === colorId) return;
    const nextGrid = regionGrid.map((row, ri) =>
      row.map((val, ci) => (ri === r && ci === c ? colorId : val))
    );
    pushGridHistory(nextGrid);
  };

  // 地圖編輯：油漆桶填色
  const handleBucketFill = (r: number, c: number, colorId: number) => {
    if (regionGrid[r]?.[c] === colorId) return;
    const nextGrid = floodFill(regionGrid, r, c, colorId);
    pushGridHistory(nextGrid);
  };

  // 地圖編輯：動態調整盤面維度
  const handleChangeGridSize = (newSize: number) => {
    const resized = resizeBoard(regionGrid, newSize);
    const newColors = ensureColorsForSize(activeColors, newSize);
    setGridSize(newSize);
    setActiveColors(newColors);
    if (selectedColorId >= newSize) {
      setSelectedColorId(0);
    }
    pushGridHistory(resized);
    setPlayerGrid(
      Array.from({ length: newSize }, () =>
        Array.from({ length: newSize }, () => 'EMPTY' as CellStatus)
      )
    );
    setHintInfo(null);
  };

  // 地圖編輯：隨機生成連通合法地圖
  const handleGenerateRandomBoard = () => {
    const randomGrid = generateRandomValidBoard(gridSize);
    pushGridHistory(randomGrid);
    triggerNotice(t.editMode.btnRandomBoard + ' ✓', 2000);
  };

  // 地圖編輯：載入經典預設題目
  const handleLoadPresetBoard = () => {
    if (gridSize === 10) {
      pushGridHistory(DEFAULT_INITIAL_GRID);
    } else {
      setGridSize(10);
      setActiveColors(DEFAULT_COLORS.slice(0, 10));
      pushGridHistory(DEFAULT_INITIAL_GRID);
    }
    triggerNotice(t.editMode.btnLoadPreset + ' ✓', 2000);
  };

  // 地圖編輯：清空盤面為單一顏色
  const handleClearBoardToSingleColor = () => {
    const uniformGrid = createUniformBoard(gridSize, selectedColorId);
    pushGridHistory(uniformGrid);
    triggerNotice(t.editMode.btnClearAll + ' ✓', 2000);
  };

  // 地圖編輯：開始手動挑戰
  const handleStartPlaying = () => {
    if (!mapIntegrity.isValidCount) {
      triggerNotice(interpolate(t.board.invalidRegion, { n: gridSize }), 3500);
    }
    setPlayerGrid(
      Array.from({ length: gridSize }, () =>
        Array.from({ length: gridSize }, () => 'EMPTY' as CellStatus)
      )
    );
    setElapsedSeconds(0);
    setIsTimerRunning(true);
    setHintInfo(null);
    setMode('PLAY');
  };

  // 地圖編輯：AI 邏輯推導
  const handleStartSolving = () => {
    if (!mapIntegrity.isValidCount) {
      triggerNotice(interpolate(t.board.invalidRegion, { n: gridSize }), 3500);
    }
    setMode('SOLVE');
    handleRunSolver(regionGrid, activeColors);
  };



  // 從截圖辨識套用網格與進行中進度
  const handleApplyRecognizedGrid = (
    grid: number[][],
    size: number,
    detectedColors?: RegionColor[],
    cellStatuses?: CellStatus[][]
  ) => {
    setGridSize(size);
    setRegionGrid(grid);

    // 若有辨識出的進度（貓咪與 ✕），直接套入玩家棋盤
    if (cellStatuses && cellStatuses.length === size) {
      setPlayerGrid(cellStatuses.map((row) => [...row]));
    } else {
      setPlayerGrid(
        Array.from({ length: size }, () =>
          Array.from({ length: size }, () => 'EMPTY' as CellStatus)
        )
      );
    }

    setElapsedSeconds(0);
    setIsTimerRunning(true);
    setHintInfo(null);

    const colorsToUse =
      detectedColors && detectedColors.length >= size
        ? detectedColors
        : DEFAULT_COLORS.slice(0, size);
    setActiveColors(colorsToUse);

    // 依約定進入 PLAY 手動挑戰模式，並背景求解以供提示與衝突即時比對
    setMode('PLAY');
    handleRunSolver(grid, colorsToUse);
  };

  // 目前已放置貓咪數與衝突計算
  let catsPlacedCount = 0;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (playerGrid[r]?.[c] === 'CAT') catsPlacedCount++;
    }
  }
  const conflicts = checkConflicts(playerGrid, regionGrid, currentSolution, lang);

  // 目前步的盤面狀態 (供 SOLVE 模式展示)
  const currentStep = solveResult?.steps[currentStepIndex];
  const solveStatusGrid: CellStatus[][] =
    currentStep?.boardSnapshot ||
    Array.from({ length: gridSize }, () =>
      Array.from({ length: gridSize }, () => 'EMPTY' as CellStatus)
    );

  // 決定棋盤顯示的格態
  const activeStatusGrid = mode === 'SOLVE' ? solveStatusGrid : playerGrid;

  return (
    <div className="app-container">
      {/* 頂部 Header 與模式切換導航 */}
      <Header
        currentMode={mode}
        onChangeMode={(newMode) => {
          setMode(newMode);
          if (newMode === 'SOLVE' && !solveResult) {
            handleRunSolver();
          }
        }}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenHelpModal={() => setIsHelpModalOpen(true)}
        onOpenAnnouncementModal={() => setIsAnnouncementOpen(true)}
        onTriggerSolve={() => {
          setMode('SOLVE');
          handleRunSolver();
        }}
      />

      {/* 全域浮動通知 (fixed 懸浮層，完全不佔據文檔流高度，徹底消除排版推擠跳動) */}
      <div className="floating-toast-container" aria-live="polite">
        {errorMessage && (
          <div className="floating-toast toast-error">
            <AlertCircle size={18} className="toast-icon" />
            <span>{errorMessage}</span>
          </div>
        )}
        {infoNotice && (
          <div
            className={`floating-toast ${
              infoNotice.includes('衝突') || infoNotice.toLowerCase().includes('conflict')
                ? 'toast-warning'
                : 'toast-info'
            }`}
          >
            {infoNotice.includes('衝突') || infoNotice.toLowerCase().includes('conflict') ? (
              <AlertCircle size={18} className="toast-icon" />
            ) : (
              <Info size={18} className="toast-icon" />
            )}
            <span>{infoNotice}</span>
          </div>
        )}
      </div>

      {/* 核心工作區 */}
      <div className="workspace-grid">
        {/* 左側：棋盤卡片 */}
        <div className="board-card" ref={boardCardRef}>
          <div className="board-card-header">
            <div className="card-title-group">
              <span className="card-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {mode === 'PLAY' ? (
                  <>
                    <Gamepad2 size={18} color="var(--accent-orange)" /> {t.board.titlePlay}
                  </>
                ) : mode === 'EDIT' ? (
                  <>
                    <Paintbrush size={18} color="var(--accent-orange)" /> {t.board.titleEdit}
                  </>
                ) : (
                  <>
                    <Sparkles size={18} color="var(--accent-orange)" /> {t.board.titleSolve}
                  </>
                )}
              </span>
            </div>
          </div>

          {/* 手機專屬頂部即時挑戰狀態膠囊 (手機螢幕時精巧常駐棋盤正上方) */}
          {mode === 'PLAY' && (
            <div className="mobile-quick-status">
              <div className="status-pill cat-pill" title={t.board.catsPlacedTooltip}>
                <span className="pill-icon" style={{ display: 'flex', alignItems: 'center' }}>
                  <CatIcon size={16} />
                </span>
                <span className="pill-val">
                  <strong>{catsPlacedCount}</strong> / {gridSize}
                </span>
              </div>

              <div
                className="status-pill timer-pill"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                title={t.board.timerTooltip}
              >
                <Timer size={14} className={isTimerRunning ? 'timer-icon-active' : ''} />
                <span className="pill-val">{formatTime(elapsedSeconds)}</span>
              </div>

              <div className="status-pill alert-pill">
                {conflicts.cells.length > 0 && showConflicts ? (
                  <span className="pill-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <AlertTriangle size={13} /> {interpolate(t.board.conflictsCount, { n: conflicts.cells.length })}
                  </span>
                ) : catsPlacedCount === gridSize ? (
                  <span className="pill-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={13} /> {t.board.statusReady}
                  </span>
                ) : (
                  <span className="pill-neutral">{t.board.statusInPlay}</span>
                )}
              </div>
            </div>
          )}


          {/* 棋盤主體 */}
          <Board
            gridSize={gridSize}
            regionGrid={regionGrid}
            statusGrid={activeStatusGrid}
            colors={activeColors}
            currentStep={currentStep}
            mode={mode}
            selectedColorId={selectedColorId}
            editTool={editTool}
            activePlayTool={playTool}
            conflictCells={showConflicts ? conflicts.cells : []}
            conflictDetails={showConflicts ? conflicts.details : {}}
            hintCoord={hintInfo?.coord}
            hintInfo={hintInfo}
            onCellPaint={handleCellPaint}
            onBucketFill={handleBucketFill}
            onPlayerToggleCross={handlePlayerToggleCross}
            onPlayerToggleCat={handlePlayerToggleCat}
            onPlayerBatchCross={handlePlayerBatchCross}
          />

          {/* 地圖編輯模式：緊接在棋盤下方的區域調色盤與塗色工具 */}
          {mode === 'EDIT' && (
            <div className="board-palette-wrapper" style={{ marginTop: 14 }}>
              <ColorPalette
                gridSize={gridSize}
                selectedColorId={selectedColorId}
                colors={activeColors}
                editTool={editTool}
                colorCounts={mapIntegrity.colorCounts}
                onSelectColor={setSelectedColorId}
                onChangeEditTool={setEditTool}
                onResetBoard={handleClearBoardToSingleColor}
                onUndo={handleUndoGrid}
                onRedo={handleRedoGrid}
                canUndo={historyIndex > 0}
                canRedo={historyIndex < history.length - 1}
              />
            </div>
          )}

          {/* 手動解題模式：手機與窄螢幕緊鄰棋盤正下方的提示說明卡片（免滑動即可見） */}
          {mode === 'PLAY' && hintInfo && (
            <div className="board-inline-hint-wrapper">
              <HintCard
                hintInfo={hintInfo}
                colors={activeColors}
                onApplyHint={handleApplyHint}
                onClose={() => setHintInfo(null)}
              />
            </div>
          )}
        </div>

        {/* 右側：依模式切換面板 */}
        <div className="solver-panel">
          {mode === 'EDIT' ? (
            /* 地圖編輯控制面板 */
            <EditControlPanel
              gridSize={gridSize}
              regionGrid={regionGrid}
              colors={activeColors}
              integrity={mapIntegrity}
              onChangeGridSize={handleChangeGridSize}
              onGenerateRandomBoard={handleGenerateRandomBoard}
              onLoadPresetBoard={handleLoadPresetBoard}
              onClearBoardToSingleColor={handleClearBoardToSingleColor}
              onStartPlaying={handleStartPlaying}
              onStartSolving={handleStartSolving}
            />
          ) : mode === 'PLAY' ? (
            /* 手動模式面板 */
            <PlayControlPanel
              gridSize={gridSize}
              catsPlacedCount={catsPlacedCount}
              elapsedSeconds={elapsedSeconds}
              isTimerRunning={isTimerRunning}
              showConflicts={showConflicts}
              autoCrossOnCat={autoCrossOnCat}
              hintInfo={hintInfo}
              hasConflicts={conflicts.cells.length > 0}
              colors={activeColors}
              onToggleTimer={() => setIsTimerRunning(!isTimerRunning)}
              onResetTimer={() => setElapsedSeconds(0)}
              onToggleShowConflicts={() => setShowConflicts(!showConflicts)}
              onToggleAutoCross={() => setAutoCrossOnCat(!autoCrossOnCat)}
              onRequestHint={handleRequestHint}
              onApplyHint={handleApplyHint}
              onDismissHint={() => setHintInfo(null)}
              onClearBoardMarks={handleClearBoardMarks}
              onSwitchToSolver={() => {
                setMode('SOLVE');
                handleRunSolver();
              }}
            />
          ) : (
            /* AI 推導與時間軸面板 */
            <>
              <TimelinePlayer
                totalSteps={solveResult?.steps.length || 0}
                currentStepIndex={currentStepIndex}
                isPlaying={isPlaying}
                playbackSpeed={playbackSpeed}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
                onStepPrev={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                onStepNext={() =>
                  setCurrentStepIndex((prev) =>
                    Math.min((solveResult?.steps.length || 1) - 1, prev + 1)
                  )
                }
                onJumpToStart={() => setCurrentStepIndex(0)}
                onJumpToEnd={() =>
                  setCurrentStepIndex((solveResult?.steps.length || 1) - 1)
                }
                onSeek={setCurrentStepIndex}
                onChangeSpeed={setPlaybackSpeed}
                onTriggerSolve={() => handleRunSolver()}
                hasSolution={!!solveResult?.success}
              />

              <StepExplanation
                currentStep={currentStep}
                totalSteps={solveResult?.steps.length || 0}
                currentStepIndex={currentStepIndex}
                totalCatsTarget={gridSize}
                isPureLogic={solveResult?.isPureLogic ?? true}
                hasMultipleSolutions={solveResult?.hasMultipleSolutions}
                colors={activeColors}
              />

              {solveResult?.hasMultipleSolutions && (
                <div className="multiple-solutions-alert-card" role="status">
                  <div className="multiple-solutions-alert-header">
                    <AlertTriangle size={18} className="alert-icon" />
                    <span>{t.solverPanel.multipleSolutionsTitle}</span>
                  </div>
                  <p className="multiple-solutions-alert-desc">
                    {t.solverPanel.multipleSolutionsDesc}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 頁面頁腳 Footer */}
      <Footer />

      {/* 手機版常駐浮動底欄 (Mobile Sticky Bottom Bar) */}
      <div className="mobile-bottom-bar" role="toolbar" aria-label="Mobile Navigation Toolbar">
        {mode === 'EDIT' && (
          <div className="mobile-bar-actions mobile-edit-bar">
            <button
              className={`mobile-bar-btn ${editTool === 'BRUSH' ? 'active-tool' : ''}`}
              onClick={() => setEditTool('BRUSH')}
              title={t.editMode.toolBrush}
            >
              <Paintbrush size={16} />
              <span className="btn-text">{t.editMode.toolBrush}</span>
            </button>

            <button
              className={`mobile-bar-btn ${editTool === 'BUCKET' ? 'active-tool' : ''}`}
              onClick={() => setEditTool('BUCKET')}
              title={t.editMode.toolBucket}
            >
              <PaintBucket size={16} />
              <span className="btn-text">{t.editMode.toolBucket}</span>
            </button>

            <button
              className="mobile-bar-btn"
              onClick={handleGenerateRandomBoard}
              title={t.editMode.btnRandomBoard}
            >
              <Dices size={16} />
              <span className="btn-text">{lang === 'en' ? 'Random' : '隨機'}</span>
            </button>

            <button
              className="mobile-bar-btn hint-btn"
              onClick={handleStartPlaying}
              title={t.editMode.btnStartPlay}
            >
              <Gamepad2 size={16} />
              <span className="btn-text">{lang === 'en' ? 'Play' : '去挑戰'}</span>
            </button>
          </div>
        )}

        {mode === 'PLAY' && (
          <div className="mobile-bar-actions">
            <button
              className="mobile-bar-btn hint-btn"
              onClick={handleRequestHint}
              aria-label={t.mobileBar.hint}
            >
              <Sparkles size={18} />
              <span className="btn-text">{t.mobileBar.hint}</span>
            </button>

            <button
              className="mobile-bar-btn"
              onClick={handleClearBoardMarks}
              aria-label={t.mobileBar.clear}
              title={t.playPanel.btnClearBoardTitle}
            >
              <RotateCcw size={16} />
              <span className="btn-text">{t.mobileBar.clear}</span>
            </button>
          </div>
        )}

        {mode === 'SOLVE' && (
          <>
            {!solveResult?.success ? (
              <div className="mobile-bar-actions solve-empty-bar">
                <button
                  className="mobile-bar-btn solve-now-mobile-btn"
                  onClick={() => handleRunSolver()}
                  aria-label={t.solverPanel.btnSolveNow}
                >
                  <Zap size={18} />
                  <span>{t.solverPanel.btnSolveNow}</span>
                </button>
              </div>
            ) : (
              <div className="mobile-solve-player">
                {/* 步驟時間軸滑桿 */}
                <div className="mobile-player-slider-row">
                  <span className="mobile-slider-step current">
                    {String(currentStepIndex + 1).padStart(2, '0')}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, (solveResult?.steps.length || 1) - 1)}
                    value={currentStepIndex}
                    onChange={(e) => setCurrentStepIndex(parseInt(e.target.value, 10))}
                    className="mobile-player-slider"
                    aria-label={interpolate(t.mobileBar.stepIndicator, {
                      current: currentStepIndex + 1,
                      total: solveResult?.steps.length || 1,
                    })}
                  />
                  <span className="mobile-slider-step total">
                    {String(solveResult?.steps.length || 1).padStart(2, '0')}
                  </span>
                </div>

                {/* 控制器按鈕列 (整合 TimelinePlayer 功能) */}
                <div className="mobile-player-controls-row">
                  <button
                    className="mobile-control-btn icon-btn"
                    onClick={() => setCurrentStepIndex(0)}
                    disabled={currentStepIndex === 0}
                    title={t.solverPanel.jumpToStart}
                    aria-label={t.solverPanel.jumpToStart}
                  >
                    <ChevronsLeft size={18} />
                  </button>

                  <button
                    className="mobile-control-btn icon-btn"
                    onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentStepIndex === 0}
                    title={t.solverPanel.prevStep}
                    aria-label={t.solverPanel.prevStep}
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <button
                    className={`mobile-control-btn play-main-btn ${isPlaying ? 'playing' : ''}`}
                    onClick={() => setIsPlaying(!isPlaying)}
                    title={isPlaying ? t.solverPanel.pause : t.solverPanel.play}
                    aria-label={isPlaying ? t.solverPanel.pause : t.solverPanel.play}
                  >
                    {isPlaying ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: 2 }} />}
                  </button>

                  <button
                    className="mobile-control-btn icon-btn"
                    onClick={() =>
                      setCurrentStepIndex((prev) =>
                        Math.min((solveResult?.steps.length || 1) - 1, prev + 1)
                      )
                    }
                    disabled={currentStepIndex >= (solveResult?.steps.length || 1) - 1}
                    title={t.solverPanel.nextStep}
                    aria-label={t.solverPanel.nextStep}
                  >
                    <ChevronRight size={20} />
                  </button>

                  <button
                    className="mobile-control-btn icon-btn"
                    onClick={() =>
                      setCurrentStepIndex((solveResult?.steps.length || 1) - 1)
                    }
                    disabled={currentStepIndex >= (solveResult?.steps.length || 1) - 1}
                    title={t.solverPanel.jumpToEnd}
                    aria-label={t.solverPanel.jumpToEnd}
                  >
                    <ChevronsRight size={18} />
                  </button>

                  <button
                    className="mobile-control-btn speed-btn"
                    onClick={() => {
                      const speeds = [0.5, 1, 2, 4];
                      const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
                      setPlaybackSpeed(speeds[nextIdx]);
                    }}
                    title={`${t.solverPanel.speedTitle}: ${playbackSpeed}×`}
                    aria-label={`${t.solverPanel.speedTitle}: ${playbackSpeed}×`}
                  >
                    <span>{playbackSpeed}×</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 截圖辨識彈窗 */}
      <ImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onApplyGrid={handleApplyRecognizedGrid}
        initialSize={gridSize}
      />

      {/* 規則說明彈窗 */}
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />

      {/* 匯出題目純文字彈窗 */}
      <ExportTextModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        regionGrid={regionGrid}
        playerGrid={playerGrid}
        colors={activeColors}
      />

      {/* 勝利通關彈窗 */}
      <VictoryModal
        isOpen={isVictoryModalOpen}
        gridSize={gridSize}
        elapsedSeconds={elapsedSeconds}
        onClose={() => setIsVictoryModalOpen(false)}
        onPlayAgain={() => {
          setIsVictoryModalOpen(false);
          handleClearBoardMarks();
          setElapsedSeconds(0);
          setIsTimerRunning(true);
        }}
        onViewAISolution={() => {
          setIsVictoryModalOpen(false);
          setMode('SOLVE');
          handleRunSolver();
        }}
      />

      {/* 更新公告說明彈窗 */}
      <AnnouncementModal
        isOpen={isAnnouncementOpen}
        onClose={() => setIsAnnouncementOpen(false)}
        onOpenScreenshotUpload={() => {
          setIsUploadModalOpen(true);
        }}
      />
    </div>
  );
};

export default App;
