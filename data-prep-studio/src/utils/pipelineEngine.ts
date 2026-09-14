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

      let type: RecipeStepType;
      switch (method) {
        case 'mean': type = 'impute_mean'; break;
        case 'median': type = 'impute_median'; break;
        case 'mode': type = 'impute_mode'; break;
        case 'constant': type = 'impute_constant'; break;
        case 'remove_rows': type = 'remove_rows_null'; break;
        default: type = 'mock_operation'; break;
      }

      steps.push({
        id: `step_cleaning_${Date.now()}_${targetColumn}`,
        type,
        targetColumns: [targetColumn],
        parameters: type === 'impute_constant' ? { value: constantValue } : undefined
      });
    }

    // For demo purposes, we will mock the advanced steps
    else if (action.stepIndex > 1) {
      steps.push({
        id: `step_advanced_${action.stepIndex}_${Date.now()}`,
        type: 'mock_operation'
      });
    }
  }

  return steps;
}
