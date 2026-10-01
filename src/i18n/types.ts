export type Language = 'zh-TW' | 'en';

export interface Translations {
  // 品牌與 Header
  brand: {
    badge: string;
    subtitle: string;
    modeSolve: string;
    modeSolveTitle: string;
    modePlay: string;
    modePlayTitle: string;
    modeEdit: string;
    modeEditTitle: string;
    btnExport: string;
    btnExportTitle: string;
    btnScreenshot: string;
    btnScreenshotTitle: string;
    btnHelpTitle: string;
    btnAnnouncementTitle: string;
    switchLangTitle: string;
  };

  // 棋盤卡片
  board: {
    titlePlay: string;
    titleEdit: string;
    titleSolve: string;
    dimension: string;
    currentRegions: string;
    validRegion: string;
    invalidRegion: string;
    customSize: string;
    customSizeTitle: string;
    statusInPlay: string;
    statusReady: string;
    conflictsCount: string;
    catsPlacedTooltip: string;
    timerTooltip: string;
    cellTooltipPlay: string;
    cellTooltipColor: string;
    cellHintCat: string;
    cellHintCross: string;
  };

  // 編輯模式
  editMode: {
    paletteTitle: string;
    btnFinish: string;
    btnEdit: string;
    btnResetBoardTitle: string;
    guideTitle: string;
    guideDesc: string;
    guideRuleTitle: string;
    guideRuleDesc: string;
    btnStartPlay: string;
    btnStartSolve: string;
    toolBrush: string;
    toolBucket: string;
    gridSizeLabel: string;
    statusValid: string;
    statusInvalid: string;
    statusDisconnectedWarning: string;
    btnRandomBoard: string;
    btnClearAll: string;
    btnLoadPreset: string;
    btnCheckSolvable: string;
    solvableUnique: string;
    solvableMultiple: string;
    solvableNone: string;
    solvableChecking: string;
    cellCountUnit: string;
    colorCountTag: string;
    undo: string;
    redo: string;
    regionValidBadge: string;
    regionInvalidBadge: string;
    feasibilityPendingBadge: string;
    feasibilityCheckingBadge: string;
    feasibilityUniqueBadge: string;
    feasibilityMultiBadge: string;
    feasibilityNoneBadge: string;
  };

  // 顏色名稱
  colors: Record<number, string>;

  // 手動控制面板
  playPanel: {
    timerTooltip: string;
    resetTimerTitle: string;
    badgeConflict: string;
    badgeSuccess: string;
    badgePlaying: string;
    progressTitle: string;
    progressCatsUnit: string;
    toolsTitle: string;
    toolCross: string;
    toolCat: string;
    shortcutTipsTitle: string;
    shortcutTipsDesc: string;
    helperAutoCross: string;
    helperAutoCrossSub: string;
    helperConflicts: string;
    helperConflictsSub: string;
    hintCardTitle: string;
    hintSuggestCat: string;
    hintSuggestCross: string;
    btnApplyHint: string;
    btnRequestHint: string;
    btnValidateBoard: string;
    btnClearBoard: string;
    btnClearBoardTitle: string;
    btnSwitchSolver: string;
  };

  // AI 播放控制台與步驟解析
  solverPanel: {
    btnSolveNow: string;
    jumpToStart: string;
    prevStep: string;
    play: string;
    pause: string;
    nextStep: string;
    jumpToEnd: string;
    speedHalf: string;
    speed1x: string;
    speed2x: string;
    speed4x: string;
    speedTitle: string;

    stepReadyBadge: string;
    stepReadyTitle: string;
    stepReadyDesc: string;
    stepCounter: string;
    catsPlacedCount: string;
    catsTargetUnit: string;
    logicQuality: string;
    pureLogic: string;
    heuristicLogic: string;
    systemGuaranteeTitle?: string;
    systemGuaranteeDesc?: string;
    multipleSolutionsTitle: string;
    multipleSolutionsDesc: string;
    solutionUniqueness: string;
    singleSolution: string;
    multipleSolutions: string;

    rules: {
      INITIAL: string;
      NAKED_SINGLE_REGION: string;
      NAKED_SINGLE_ROW: string;
      NAKED_SINGLE_COL: string;
      LINE_REGION_INTERSECTION: string;
      REGION_LINE_INTERSECTION: string;
      SUBSET_COUNTING: string;
      SHARED_ADJACENCY_ELIMINATION: string;
      BACKTRACK_SEARCH: string;
      COMPLETED: string;
    };
  };

  // 行動端底欄
  mobileBar: {
    markCross: string;
    placeCat: string;
    hint: string;
    check: string;
    clear: string;
    prev: string;
    play: string;
    pause: string;
    next: string;
    stepIndicator: string;
    finishEdit: string;
    resetBoard: string;
  };

  // 規則說明彈窗
  helpModal: {
    title: string;
    subtitle: string;
    rule1Title: string;
    rule1Desc: string;
    rule2Title: string;
    rule2Desc: string;
    rule3Title: string;
    rule3Desc: string;
    rule4Title: string;
    rule4Desc: string;
    guideTitle: string;
    guide1: string;
    guide2: string;
    guide3: string;
    guide4: string;
    guide5: string;
    btnUnderstood: string;
  };

  // 匯出彈窗
  exportModal: {
    title: string;
    subtitle: string;
    includeProgressLabel: string;
    includeProgressStatusTrue: string;
    includeProgressStatusFalse: string;
    selectAllTip: string;
    btnClose: string;
    btnCopy: string;
    copiedText: string;
  };

  // 勝利彈窗
  victoryModal: {
    title: string;
    subtitle: string;
    timeLabel: string;
    successConfigLabel: string;
    btnPlayAgain: string;
    btnViewAI: string;
    timeFormat: (mins: number, secs: number) => string;
  };

  // 截圖辨識彈窗
  uploadModal: {
    title: string;
    subtitle: string;
    dimensionLabel: string;
    dropzoneTitle: string;
    dropzoneSub: string;
    btnPaste: string;
    btnSelectFile: string;
    dropzoneHint: string;
    btnChangeImg: string;
    btnPasteToolbar: string;
    btnClearImg: string;
    step1Title: string;
    btnAutoDetectAll: string;
    btnAutoFit: string;
    btnFullCover: string;
    detectNoticePrefix: string;
    detectNoticeSuffix: string;
    canFineTuneTip: string;
    previewImgAlt: string;
    cropHandleNW: string;
    cropHandleN: string;
    cropHandleNE: string;
    cropHandleW: string;
    cropHandleE: string;
    cropHandleSW: string;
    cropHandleS: string;
    cropHandleSE: string;
    sliderCardTitle: string;
    sliderX: string;
    sliderY: string;
    sliderW: string;
    sliderH: string;
    toggleFineTune: string;
    hideFineTune: string;
    showFineTune: string;
    step2Title: string;
    btnReanalyze: string;
    importProgressLabel: string;
    tabRegions: string;
    tabProgress: string;
    progressTip: string;
    progressCatsCount: string;
    progressCrossesCount: string;
    colorFixPrompt: string;
    defaultPaletteName: string;
    analyzingColors: string;
    emptyPreview: string;
    btnCancel: string;
    btnApply: string;
  };

  // 更新公告彈窗
  announcementModal: {
    badge: string;
    title: string;
    subtitle: string;
    feature1Title: string;
    feature1Desc: string;
    feature2Title: string;
    feature2Desc: string;
    feature3Title: string;
    feature3Desc: string;
    feature4Title: string;
    feature4Desc: string;
    btnTryNow: string;
    btnGotIt: string;
  };

  // Toast 與警告訊息
  toasts: {
    crossConflictOnCat: (r: number, c: number) => string;
    catConflictWrongPos: (r: number, c: number) => string;
    batchCrossConflict: (r: number, c: number) => string;
    noHintFound: string;
    boardVictory: string;
    conflictsFound: (count: number, hasSolution: boolean) => string;
    validCatsPlaced: (catCount: number, remaining: number) => string;
    solverFailed: string;
  };

  // 頁腳 Footer
  footer: {
    githubRepo: string;
    madeWithLove: string;
  };
}
