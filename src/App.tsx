import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DEFAULT_INITIAL_GRID, DEFAULT_COLORS } from './logic/presets';
import { solveMeowdoku } from './logic/solver';
import { checkConflicts, checkVictory, autoFillCrosses, getSmartHint } from './logic/validator';
import type { SolveResult, CellStatus, RegionColor, AppMode, PlayTool, HintInfo, CellCoord } from './types/game';
import { Header } from './components/Header';
import { Board } from './components/Board';
import { StepExplanation } from './components/StepExplanation';
import { TimelinePlayer } from './components/TimelinePlayer';
import { PlayControlPanel } from './components/PlayControlPanel';
import { HintCard } from './components/HintCard';
import { VictoryModal } from './components/VictoryModal';
import { ImageUploadModal } from './components/ImageUploadModal';
import { HelpModal } from './components/HelpModal';
import { ExportTextModal } from './components/ExportTextModal';
import { useI18n } from './i18n';
import {
  AlertCircle,
  CheckCircle,
  Info,
  Timer,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  AlertTriangle,
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

  // 核心模式管理：'PLAY' (手動解題) | 'SOLVE' (AI 逐步推導)
  const [mode, setMode] = useState<AppMode>('SOLVE');

  // 盤面與顏色配置
  const [gridSize, setGridSize] = useState<number>(10);
  const [regionGrid, setRegionGrid] = useState<number[][]>(DEFAULT_INITIAL_GRID);
  const [activeColors, setActiveColors] = useState<RegionColor[]>(DEFAULT_COLORS);

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  // 檢查目前盤面
  const handleValidateBoard = () => {
    const isVictorious = checkVictory(playerGrid, regionGrid, currentSolution);
    if (isVictorious) {
      setIsVictoryModalOpen(true);
      setIsTimerRunning(false);
      return;
    }

    const conflicts = checkConflicts(playerGrid, regionGrid, currentSolution, lang);
    if (conflicts.cells.length > 0) {
      triggerNotice(
        t.toasts.conflictsFound(conflicts.cells.length, !!conflicts.hasSolutionConflict),
        4500
      );
    } else {
      let catCount = 0;
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          if (playerGrid[r][c] === 'CAT') catCount++;
        }
      }
      triggerNotice(
        t.toasts.validCatsPlaced(catCount, gridSize - catCount),
        4500
      );
    }
  };


  // 從截圖辨識套用網格
  const handleApplyRecognizedGrid = (grid: number[][], size: number, detectedColors?: RegionColor[]) => {
    setGridSize(size);
    setRegionGrid(grid);
    setPlayerGrid(
      Array.from({ length: size }, () =>
        Array.from({ length: size }, () => 'EMPTY' as CellStatus)
      )
    );
    setElapsedSeconds(0);
    setIsTimerRunning(true);
    setHintInfo(null);

    const colorsToUse = detectedColors && detectedColors.length >= size ? detectedColors : DEFAULT_COLORS.slice(0, size);
    setActiveColors(colorsToUse);

    if (mode === 'SOLVE') {
      handleRunSolver(grid, colorsToUse);
    } else {
      setMode('PLAY');
    }
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

  // 驗證區域數量
  const uniqueRegionsCount = new Set(regionGrid.flat()).size;
  const isRegionCountValid = uniqueRegionsCount === gridSize;

  return (
    <div className="app-container">
      {/* 頂部 Header 與三大模式切換導航 */}
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
                ) : (
                  <>
                    <Sparkles size={18} color="var(--accent-orange)" /> {t.board.titleSolve}
                  </>
                )}
              </span>
              <span className="card-desc">
                {t.board.dimension} {gridSize} · {t.board.currentRegions}
                <span
                  style={{
                    color: isRegionCountValid ? '#2e7d32' : '#e47535',
                    fontWeight: 800,
                  }}
                >
                  {uniqueRegionsCount} / {gridSize}
                </span>{' '}
                {isRegionCountValid ? t.board.validRegion : interpolate(t.board.invalidRegion, { n: gridSize })}
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
            activePlayTool={playTool}
            conflictCells={showConflicts ? conflicts.cells : []}
            conflictDetails={showConflicts ? conflicts.details : {}}
            hintCoord={hintInfo?.coord}
            hintInfo={hintInfo}
            onPlayerToggleCross={handlePlayerToggleCross}
            onPlayerToggleCat={handlePlayerToggleCat}
            onPlayerBatchCross={handlePlayerBatchCross}
          />

          {/* 手動解題模式：手機與窄螢幕緊鄰棋盤正下方的提示說明卡片（免滑動即可見） */}
          {mode === 'PLAY' && hintInfo && (
            <div className="board-inline-hint-wrapper">
              <HintCard
                hintInfo={hintInfo}
                onApplyHint={handleApplyHint}
                onClose={() => setHintInfo(null)}
              />
            </div>
          )}
        </div>

        {/* 右側：依模式切換面板 */}
        <div className="solver-panel">
          {mode === 'PLAY' ? (
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
              onToggleTimer={() => setIsTimerRunning(!isTimerRunning)}
              onResetTimer={() => setElapsedSeconds(0)}
              onToggleShowConflicts={() => setShowConflicts(!showConflicts)}
              onToggleAutoCross={() => setAutoCrossOnCat(!autoCrossOnCat)}
              onRequestHint={handleRequestHint}
              onApplyHint={handleApplyHint}
              onDismissHint={() => setHintInfo(null)}
              onClearBoardMarks={handleClearBoardMarks}
              onValidateBoard={handleValidateBoard}
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
              />

              <div
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '18px 20px',
                  border: '1px solid var(--border-light)',
                  boxShadow: 'var(--shadow-soft)',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <CheckCircle size={16} color="var(--accent-orange)" /> {t.solverPanel.systemGuaranteeTitle}
                </div>
                <p>
                  {t.solverPanel.systemGuaranteeDesc}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 手機版常駐浮動底欄 (Mobile Sticky Bottom Bar) */}
      <div className="mobile-bottom-bar" role="toolbar" aria-label="Mobile Navigation Toolbar">
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
              onClick={handleValidateBoard}
              aria-label={t.mobileBar.check}
            >
              <CheckCircle2 size={18} />
              <span className="btn-text">{t.mobileBar.check}</span>
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
          <div className="mobile-bar-actions solve-bar">
            <button
              className="mobile-bar-btn"
              onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentStepIndex === 0}
              aria-label={t.mobileBar.prev}
            >
              <ChevronLeft size={20} />
              <span className="btn-text">{t.mobileBar.prev}</span>
            </button>

            <button
              className={`mobile-bar-btn play-btn ${isPlaying ? 'active' : ''}`}
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? t.mobileBar.pause : t.mobileBar.play}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              <span className="btn-text">{isPlaying ? t.mobileBar.pause : t.mobileBar.play}</span>
            </button>

            <button
              className="mobile-bar-btn"
              onClick={() =>
                setCurrentStepIndex((prev) =>
                  Math.min((solveResult?.steps.length || 1) - 1, prev + 1)
                )
              }
              disabled={currentStepIndex >= (solveResult?.steps.length || 1) - 1}
              aria-label={t.mobileBar.next}
            >
              <ChevronRight size={20} />
              <span className="btn-text">{t.mobileBar.next}</span>
            </button>

            <div className="mobile-step-indicator">
              {interpolate(t.mobileBar.stepIndicator, {
                current: currentStepIndex + 1,
                total: solveResult?.steps.length || 1,
              })}
            </div>
          </div>
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
    </div>
  );
};

export default App;
