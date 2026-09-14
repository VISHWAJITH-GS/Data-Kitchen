import { RecipeStep } from './types';

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
           stepQuery = `SELECT * REPLACE (COALESCE("${targetCol}", ${safeValue}) AS "${targetCol}") FROM ${previousStepName}`;
        }
        break;
      }
      
      case 'trim_whitespace': {
        const targetCol = step.targetColumns?.[0];
        if (!targetCol) {
           stepQuery = `SELECT * FROM ${previousStepName}`; // no-op
        } else {
           stepQuery = `SELECT * REPLACE (TRIM("${targetCol}") AS "${targetCol}") FROM ${previousStepName}`;
        }
        break;
      }
      
      case 'rename_column': {
        const targetCol = step.targetColumns?.[0];
        const newName = step.parameters?.newName;
        if (!targetCol || !newName) {
           stepQuery = `SELECT * FROM ${previousStepName}`; // no-op
        } else {
           stepQuery = `SELECT * EXCLUDE ("${targetCol}"), "${targetCol}" AS "${newName}" FROM ${previousStepName}`;
        }
        break;
      }

      case 'remove_rows_null': {
        const targetCol = step.targetColumns?.[0];
        if (!targetCol) {
           stepQuery = `SELECT * FROM ${previousStepName}`; // no-op
        } else {
           stepQuery = `SELECT * FROM ${previousStepName} WHERE "${targetCol}" IS NOT NULL`;
        }
        break;
      }

      case 'impute_mean': {
        const targetCol = step.targetColumns?.[0];
        if (!targetCol) {
           stepQuery = `SELECT * FROM ${previousStepName}`;
        } else {
           stepQuery = `SELECT * REPLACE (COALESCE("${targetCol}", (SELECT AVG("${targetCol}") FROM ${previousStepName})) AS "${targetCol}") FROM ${previousStepName}`;
        }
        break;
      }

      case 'impute_median': {
        const targetCol = step.targetColumns?.[0];
        if (!targetCol) {
           stepQuery = `SELECT * FROM ${previousStepName}`;
        } else {
           stepQuery = `SELECT * REPLACE (COALESCE("${targetCol}", (SELECT median("${targetCol}") FROM ${previousStepName})) AS "${targetCol}") FROM ${previousStepName}`;
        }
        break;
      }

      case 'impute_mode': {
        const targetCol = step.targetColumns?.[0];
        if (!targetCol) {
           stepQuery = `SELECT * FROM ${previousStepName}`;
        } else {
           stepQuery = `SELECT * REPLACE (COALESCE("${targetCol}", (SELECT mode("${targetCol}") FROM ${previousStepName})) AS "${targetCol}") FROM ${previousStepName}`;
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
           stepQuery = `SELECT * REPLACE (COALESCE("${targetCol}", ${safeValue}) AS "${targetCol}") FROM ${previousStepName}`;
        }
        break;
      }

      case 'mock_operation': {
        // Just passes data through for UI demo purposes for unsupported DuckDB ops (PCA, SMOTE)
        stepQuery = `SELECT * FROM ${previousStepName}`;
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
