import { ActionConfig } from '../context/WizardContext';
import { RecipeStep, RecipeStepType } from '../worker/types';

export function compilePipelineHistory(history: ActionConfig[]): RecipeStep[] {
  const steps: RecipeStep[] = [];

  for (const action of history) {
    if (action.skipped || !action.config) continue;

    // Step 1 is Data Cleaning
    if (action.stepIndex === 1) {
      const { method, targetColumn, constantValue } = action.config;
      if (!targetColumn) continue;

      let type: RecipeStepType | null = null;
      switch (method) {
        case 'mean': type = 'impute_mean'; break;
        case 'median': type = 'impute_median'; break;
        case 'mode': type = 'impute_mode'; break;
        case 'constant': type = 'impute_constant'; break;
        case 'remove_rows': type = 'remove_rows_null'; break;
        default: throw new Error(`This transformation (${method}) is not currently supported.`);
      }

      if (type) {
        steps.push({
          id: `step_cleaning_${Date.now()}_${targetColumn}`,
          type,
          targetColumns: [targetColumn],
          parameters: type === 'impute_constant' ? { value: constantValue } : undefined
        });
      }
    }

    // Step 2 is Data Type Conversion
    else if (action.stepIndex === 2) {
      const { method, targetColumn, targetType } = action.config;
      if (method === 'cast' && targetColumn && targetType) {
        steps.push({
          id: `step_cast_${Date.now()}_${targetColumn}`,
          type: 'cast_type',
          targetColumns: [targetColumn],
          parameters: { targetType }
        });
      } else {
        throw new Error(`This transformation (${method}) is not currently supported.`);
      }
    }

    // Step 4 is Feature Scaling
    else if (action.stepIndex === 4) {
      const { method, targetColumn } = action.config;
      if (targetColumn && (method === 'standard' || method === 'minmax')) {
        steps.push({
          id: `step_scale_${Date.now()}_${targetColumn}`,
          type: 'scale_feature',
          targetColumns: [targetColumn],
          parameters: { method }
        });
      } else {
        throw new Error(`This transformation (${method}) is not currently supported.`);
      }
    }

    // Step 6 is Data Transformation
    else if (action.stepIndex === 6) {
      const { method, targetColumn } = action.config;
      if (targetColumn && method === 'log') {
        steps.push({
          id: `step_transform_${Date.now()}_${targetColumn}`,
          type: 'log_transform',
          targetColumns: [targetColumn]
        });
      } else {
        throw new Error(`This transformation (${method}) is not currently supported.`);
      }
    }
    
    // Any unimplemented/demo step > 2 is explicitly rejected
    else if (action.stepIndex === 3 || action.stepIndex === 5 || action.stepIndex > 6) {
      throw new Error("This transformation is not currently supported.");
    }
  }

  return steps;
}
