export type MessageType = 'INGEST' | 'PROFILE' | 'TRANSFORM' | 'PREVIEW' | 'EXPORT' | 'INIT';

export type ColumnType = 'string' | 'integer' | 'float' | 'boolean' | 'date' | 'unknown';
export type SemanticHint = 'date' | 'email' | 'none';

export interface ColumnMetadata {
  name: string;
  position: number;
  type: ColumnType;
  nullCount: number;
  distinctCount: number;
  semanticHint: SemanticHint;
}

export interface SchemaMetadata {
  tableName: string;
  rowCount: number;
  columns: ColumnMetadata[];
}

export type RecipeStepType = 'remove_duplicates' | 'fill_nulls' | 'trim_whitespace' | 'rename_column' 
  | 'impute_mean' | 'impute_median' | 'impute_mode' | 'impute_constant' | 'remove_rows_null'
  | 'mock_operation';

export interface RecipeStep {
  id: string;
  type: RecipeStepType;
  targetColumns?: string[];
  parameters?: Record<string, any>;
  isDisabled?: boolean;
}

export type IssueSeverity = 'critical' | 'warning' | 'info';

export interface DataIssue {
  id: string;
  type: string;
  column?: string;
  severity: IssueSeverity;
  description: string;
  suggestedFix?: RecipeStepType;
}

export interface HealthScore {
  overall: number;
  completeness: number;
  uniqueness: number;
  consistency: number;
  validity: number;
}

export interface ProfileResult {
  issues: DataIssue[];
  healthScore: HealthScore;
}

export interface PreviewResult {
  rows: any[];
  lastRow: number;
}

export interface ExportResult {
  buffer: Uint8Array;
  fileName: string;
}

export interface WorkerRequest {
  id: string;
  type: MessageType;
  payload?: any;
}

export interface WorkerResponse {
  id: string;
  type: MessageType;
  success: boolean;
  payload?: any;
  error?: string;
}
