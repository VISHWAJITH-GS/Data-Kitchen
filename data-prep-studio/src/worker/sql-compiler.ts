import { RecipeStep } from './types';
import { escapeIdentifier as escapeId } from '../utils/sql-escape';

export function compileRecipe(steps: RecipeStep[], baseTableName: string): string {
  const activeSteps = steps.filter(s => !s.isDisabled);
  
  if (activeSteps.length === 0) {
    return `SELECT * FROM ${baseTableName}`;
  }

  let sql = 'WITH ';
  let previousStepName = baseTableName;

  for (let i = 0; i < activeSteps.length; i++) {
    const step = activeSteps[i];
    const stepName = `step_${i}`;
    
    let stepQuery = '';

    switch (step.type) {
      case 'remove_duplicates':
        stepQuery = `SELECT DISTINCT * FROM ${previousStepName}`;
        break;
      
      case 'fill_nulls': {
        const targetCol = step.targetColumns?.[0];
        const fillValue = step.parameters?.value;
        if (!targetCol || fillValue === undefined) {
           stepQuery = `SELECT * FROM ${previousStepName}`; // no-op if malformed
        } else {
           // DuckDB replace syntax: SELECT * REPLACE (COALESCE(col, 'val') AS col)
           const safeValue = typeof fillValue === 'string' ? `'${fillValue.replace(/'/g, "''")}'` : fillValue;
           stepQuery = `SELECT * REPLACE (COALESCE(${escapeId(targetCol)}, ${safeValue}) AS ${escapeId(targetCol)}) FROM ${previousStepName}`;
        }
        break;
      }
      
      case 'trim_whitespace': {
        const targetCol = step.targetColumns?.[0];
        if (!targetCol) {
           stepQuery = `SELECT * FROM ${previousStepName}`; // no-op
        } else {
           stepQuery = `SELECT * REPLACE (TRIM(${escapeId(targetCol)}) AS ${escapeId(targetCol)}) FROM ${previousStepName}`;
        }
        break;
      }
      
      case 'rename_column': {
        const targetCol = step.targetColumns?.[0];
        const newName = step.parameters?.newName;
        if (!targetCol || !newName) {
           stepQuery = `SELECT * FROM ${previousStepName}`; // no-op
        } else {
           stepQuery = `SELECT * EXCLUDE (${escapeId(targetCol)}), ${escapeId(targetCol)} AS ${escapeId(newName)} FROM ${previousStepName}`;
        }
        break;
      }

      case 'remove_rows_null': {
        const targetCol = step.targetColumns?.[0];
        if (!targetCol) {
           stepQuery = `SELECT * FROM ${previousStepName}`; // no-op
        } else {
           stepQuery = `SELECT * FROM ${previousStepName} WHERE ${escapeId(targetCol)} IS NOT NULL`;
        }
        break;
      }

      case 'impute_mean': {
        const targetCol = step.targetColumns?.[0];
        if (!targetCol) {
           stepQuery = `SELECT * FROM ${previousStepName}`;
        } else {
           stepQuery = `SELECT * REPLACE (COALESCE(${escapeId(targetCol)}, (SELECT AVG(${escapeId(targetCol)}) FROM ${previousStepName})) AS ${escapeId(targetCol)}) FROM ${previousStepName}`;
        }
        break;
      }

      case 'impute_median': {
        const targetCol = step.targetColumns?.[0];
        if (!targetCol) {
           stepQuery = `SELECT * FROM ${previousStepName}`;
        } else {
           stepQuery = `SELECT * REPLACE (COALESCE(${escapeId(targetCol)}, (SELECT median(${escapeId(targetCol)}) FROM ${previousStepName})) AS ${escapeId(targetCol)}) FROM ${previousStepName}`;
        }
        break;
      }

      case 'impute_mode': {
        const targetCol = step.targetColumns?.[0];
        if (!targetCol) {
           stepQuery = `SELECT * FROM ${previousStepName}`;
        } else {
           stepQuery = `SELECT * REPLACE (COALESCE(${escapeId(targetCol)}, (SELECT mode(${escapeId(targetCol)}) FROM ${previousStepName})) AS ${escapeId(targetCol)}) FROM ${previousStepName}`;
        }
        break;
      }

      case 'impute_constant': {
        const targetCol = step.targetColumns?.[0];
        const fillValue = step.parameters?.value;
        if (!targetCol || fillValue === undefined) {
           stepQuery = `SELECT * FROM ${previousStepName}`;
        } else {
           const safeValue = typeof fillValue === 'string' ? `'${fillValue.replace(/'/g, "''")}'` : fillValue;
           stepQuery = `SELECT * REPLACE (COALESCE(${escapeId(targetCol)}, ${safeValue}) AS ${escapeId(targetCol)}) FROM ${previousStepName}`;
        }
        break;
      }

      case 'cast_type': {
        const targetCol = step.targetColumns?.[0];
        const targetType = step.parameters?.targetType;
        if (!targetCol || !targetType) {
           stepQuery = `SELECT * FROM ${previousStepName}`;
        } else {
           let duckDbType = 'VARCHAR';
           if (targetType === 'integer') duckDbType = 'BIGINT';
           if (targetType === 'float') duckDbType = 'DOUBLE';
           if (targetType === 'boolean') duckDbType = 'BOOLEAN';
           if (targetType === 'date') duckDbType = 'DATE';
           stepQuery = `SELECT * REPLACE (TRY_CAST(${escapeId(targetCol)} AS ${duckDbType}) AS ${escapeId(targetCol)}) FROM ${previousStepName}`;
        }
        break;
      }

      case 'scale_feature': {
        const targetCol = step.targetColumns?.[0];
        const method = step.parameters?.method;
        if (!targetCol) {
           stepQuery = `SELECT * FROM ${previousStepName}`;
        } else if (method === 'standard') {
           // Fallback to 0 if stddev is 0
           stepQuery = `SELECT * REPLACE (COALESCE((TRY_CAST(${escapeId(targetCol)} AS DOUBLE) - (SELECT AVG(TRY_CAST(${escapeId(targetCol)} AS DOUBLE)) FROM ${previousStepName})) / NULLIF((SELECT STDDEV(TRY_CAST(${escapeId(targetCol)} AS DOUBLE)) FROM ${previousStepName}), 0), 0) AS ${escapeId(targetCol)}) FROM ${previousStepName}`;
        } else if (method === 'minmax') {
           // Fallback to 0 if max = min
           stepQuery = `SELECT * REPLACE (COALESCE((TRY_CAST(${escapeId(targetCol)} AS DOUBLE) - (SELECT MIN(TRY_CAST(${escapeId(targetCol)} AS DOUBLE)) FROM ${previousStepName})) / NULLIF((SELECT MAX(TRY_CAST(${escapeId(targetCol)} AS DOUBLE)) - MIN(TRY_CAST(${escapeId(targetCol)} AS DOUBLE)) FROM ${previousStepName}), 0), 0) AS ${escapeId(targetCol)}) FROM ${previousStepName}`;
        } else {
           stepQuery = `SELECT * FROM ${previousStepName}`;
        }
        break;
      }

      case 'log_transform': {
        const targetCol = step.targetColumns?.[0];
        if (!targetCol) {
           stepQuery = `SELECT * FROM ${previousStepName}`;
        } else {
           // CASE WHEN x > 0 THEN LN(x) ELSE NULL END
           stepQuery = `SELECT * REPLACE (CASE WHEN TRY_CAST(${escapeId(targetCol)} AS DOUBLE) > 0 THEN LN(TRY_CAST(${escapeId(targetCol)} AS DOUBLE)) ELSE NULL END AS ${escapeId(targetCol)}) FROM ${previousStepName}`;
        }
        break;
      }

      default:
        stepQuery = `SELECT * FROM ${previousStepName}`;
        break;
    }

    sql += `${stepName} AS (${stepQuery})`;
    if (i < activeSteps.length - 1) {
      sql += ', \n';
    } else {
      sql += '\n';
    }
    
    previousStepName = stepName;
  }

  sql += `SELECT * FROM ${previousStepName}`;
  return sql;
}
