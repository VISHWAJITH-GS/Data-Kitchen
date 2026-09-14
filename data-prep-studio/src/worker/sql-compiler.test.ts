import { describe, it, expect } from 'vitest';
import { compileRecipe } from './sql-compiler';
import { RecipeStep } from './types';

describe('SQL Compiler', () => {
  it('should handle no steps gracefully', () => {
    const steps: RecipeStep[] = [];
    const sql = compileRecipe(steps, 'base_data');
    expect(sql).toBe('SELECT * FROM base_data');
  });

  it('should correctly escape column names with spaces and reserved words', () => {
    const steps: RecipeStep[] = [
      { id: '1', type: 'rename_column', targetColumns: ['My Column'], parameters: { newName: 'SELECT' } }
    ];
    const sql = compileRecipe(steps, 'base_data');
    expect(sql).toContain('WITH step_0 AS (SELECT * EXCLUDE ("My Column"), "My Column" AS "SELECT" FROM base_data)');
  });

  it('should compile median and mode imputation properly', () => {
    const steps: RecipeStep[] = [
      { id: '1', type: 'impute_median', targetColumns: ['col_a'] },
      { id: '2', type: 'impute_mode', targetColumns: ['col_b'] }
    ];
    const sql = compileRecipe(steps, 'base_data');
    expect(sql).toContain('SELECT median("col_a") FROM base_data');
    expect(sql).toContain('SELECT mode("col_b") FROM step_0');
  });

  it('should compile log transformation safeguarding against negative/zero', () => {
    const steps: RecipeStep[] = [{ id: '1', type: 'log_transform', targetColumns: ['col_a'] }];
    const sql = compileRecipe(steps, 'base_data');
    expect(sql).toContain('CASE WHEN TRY_CAST("col_a" AS DOUBLE) > 0 THEN LN(TRY_CAST("col_a" AS DOUBLE)) ELSE NULL END');
  });

  it('should compile standard scaling guarding against constant columns', () => {
    const steps: RecipeStep[] = [{ id: '1', type: 'scale_feature', targetColumns: ['col_a'], parameters: { method: 'standard' } }];
    const sql = compileRecipe(steps, 'base_data');
    expect(sql).toContain('NULLIF((SELECT STDDEV(TRY_CAST("col_a" AS DOUBLE)) FROM base_data), 0)');
    expect(sql).toContain('COALESCE(');
  });
});
