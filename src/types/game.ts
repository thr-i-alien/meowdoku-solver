export interface CellCoord {
  r: number;
  c: number;
}

export type CellStatus = 'EMPTY' | 'CAT' | 'CROSS';

export type RuleType =
  | 'INITIAL'
  | 'ELIMINATE_SURROUNDINGS'
  | 'NAKED_SINGLE_REGION'
  | 'NAKED_SINGLE_ROW'
  | 'NAKED_SINGLE_COL'
  | 'LINE_REGION_INTERSECTION'
  | 'REGION_LINE_INTERSECTION'
  | 'SUBSET_COUNTING'
  | 'SHARED_ADJACENCY_ELIMINATION'
  | 'BACKTRACK_SEARCH'
  | 'COMPLETED'
  | 'IMPOSSIBLE';

export interface DeductionStep {
  stepNumber: number;
  ruleType: RuleType;
  title: string;
  titleEn?: string;
  explanation: string;
  explanationEn?: string;
  catPlaced?: CellCoord;
  eliminatedCells?: CellCoord[];
  highlightCells?: CellCoord[];
  highlightRegions?: number[];
  highlightRows?: number[];
  highlightCols?: number[];
  boardSnapshot: CellStatus[][];
  catsCount: number;
}

export interface RegionColor {
  id: number;
  name: string;
  nameEn?: string;
  hex: string;
  bgHex: string;
  borderHex: string;
}

export interface SolveResult {
  success: boolean;
  isPureLogic: boolean;
  steps: DeductionStep[];
  solutionGrid?: CellStatus[][];
  errorMessage?: string;
  hasMultipleSolutions?: boolean;
  solutionCount?: number;
}

export type AppMode = 'PLAY' | 'SOLVE' | 'EDIT';

export type PlayTool = 'CROSS' | 'CAT';

export type EditTool = 'BRUSH' | 'BUCKET';

export interface ConflictDetail {
  r: number;
  c: number;
  type: 'RULE_ROW' | 'RULE_COL' | 'RULE_REGION' | 'RULE_ADJACENT' | 'WRONG_CAT' | 'WRONG_CROSS';
  message: string;
}

export interface ConflictInfo {
  cells: CellCoord[];
  rows: number[];
  cols: number[];
  regions: number[];
  details?: Record<string, ConflictDetail>;
  hasSolutionConflict?: boolean;
}

export interface HintInfo {
  coord: CellCoord;
  targetCells?: CellCoord[];
  sourceCells?: CellCoord[];
  highlightCols?: number[];
  highlightRows?: number[];
  highlightRegions?: number[];
  suggestedStatus: CellStatus;
  message: string;
  messageEn?: string;
  reason: string;
  reasonEn?: string;
}
