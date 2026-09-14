import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import duckdb from 'duckdb';
import { compileRecipe } from './sql-compiler';
import { RecipeStep } from './types';

describe('DuckDB Integration Tests', () => {
  let db: duckdb.Database;
  let conn: duckdb.Connection;

  beforeAll((done) => {
    db = new duckdb.Database(':memory:');
    conn = db.connect();
    // Setup test data
    conn.exec(`
      CREATE TABLE test_data (
        id INTEGER,
        col_a DOUBLE,
        col_b VARCHAR,
        col_c VARCHAR,
        const_col DOUBLE
      );
      INSERT INTO test_data VALUES 
        (1, 10.0, 'A', '10', 5.0),
        (2, NULL, 'B', '20', 5.0),
        (3, 30.0, 'A', '30', 5.0),
        (4, 0.0, 'A', 'invalid', 5.0),
        (5, -5.0, NULL, NULL, 5.0);
    `, done);
  });

  afterAll((done) => {
    conn.close(done);
  });

  const query = (sql: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      conn.all(sql, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
  };

  it('A. Median imputation', async () => {
    const steps: RecipeStep[] = [{ id: '1', type: 'impute_median', targetColumns: ['col_a'] }];
    const sql = compileRecipe(steps, 'test_data');
    const res = await query(sql);
    const row2 = res.find(r => r.id === 2);
    // Values: 10, 30, 0, -5 -> Median is 5 (Wait: -5, 0, 10, 30. Middle are 0 and 10 -> (0+10)/2 = 5)
    expect(row2.col_a).toBe(5);
  });

  it('B. Mode imputation', async () => {
    const steps: RecipeStep[] = [{ id: '1', type: 'impute_mode', targetColumns: ['col_b'] }];
    const sql = compileRecipe(steps, 'test_data');
    const res = await query(sql);
    const row5 = res.find(r => r.id === 5);
    // Mode of A, B, A, A is A
    expect(row5.col_b).toBe('A');
  });

  it('C. Type conversion (TRY_CAST)', async () => {
    const steps: RecipeStep[] = [{ id: '1', type: 'cast_type', targetColumns: ['col_c'], parameters: { targetType: 'integer' } }];
    const sql = compileRecipe(steps, 'test_data');
    const res = await query(sql);
    expect(res.find(r => r.id === 1).col_c).toBe(10);
    expect(res.find(r => r.id === 4).col_c).toBeNull(); // 'invalid' cast to int
  });

  it('D. Standard scaling (including constant column)', async () => {
    const steps: RecipeStep[] = [
      { id: '1', type: 'scale_feature', targetColumns: ['col_a'], parameters: { method: 'standard' } },
      { id: '2', type: 'scale_feature', targetColumns: ['const_col'], parameters: { method: 'standard' } }
    ];
    const sql = compileRecipe(steps, 'test_data');
    const res = await query(sql);
    // Constant column stddev is 0, so it should fallback to 0
    expect(res.find(r => r.id === 1).const_col).toBe(0);
  });

  it('E. Min-Max scaling', async () => {
    const steps: RecipeStep[] = [
      { id: '1', type: 'scale_feature', targetColumns: ['col_a'], parameters: { method: 'minmax' } },
      { id: '2', type: 'scale_feature', targetColumns: ['const_col'], parameters: { method: 'minmax' } }
    ];
    const sql = compileRecipe(steps, 'test_data');
    const res = await query(sql);
    
    // minmax for constant column should fallback to 0
    expect(res.find(r => r.id === 1).const_col).toBe(0);
    
    // minmax for col_a: min = -5, max = 30. range = 35. 
    // id=3 -> col_a=30. (30 - (-5)) / 35 = 1
    // id=5 -> col_a=-5. (-5 - (-5)) / 35 = 0
    expect(res.find(r => r.id === 3).col_a).toBe(1);
    expect(res.find(r => r.id === 5).col_a).toBe(0);
  });

  it('F. Log transformation', async () => {
    const steps: RecipeStep[] = [{ id: '1', type: 'log_transform', targetColumns: ['col_a'] }];
    const sql = compileRecipe(steps, 'test_data');
    const res = await query(sql);
    // id 1: 10 -> > 0
    expect(res.find(r => r.id === 1).col_a).toBeCloseTo(Math.log(10));
    // id 4: 0 -> <= 0 -> NULL
    expect(res.find(r => r.id === 4).col_a).toBeNull();
    // id 5: -5 -> <= 0 -> NULL
    expect(res.find(r => r.id === 5).col_a).toBeNull();
  });

  it('G. Multiple transformations', async () => {
    const steps: RecipeStep[] = [
      { id: '1', type: 'impute_median', targetColumns: ['col_a'] },
      { id: '2', type: 'scale_feature', targetColumns: ['col_a'], parameters: { method: 'minmax' } },
    ];
    const sql = compileRecipe(steps, 'test_data');
    const res = await query(sql);
    expect(res.length).toBe(5);
    // ID 2 was NULL, imputed to 5. Min = -5, Max = 30. 
    // imputed value scaled: (5 - (-5)) / 35 = 10 / 35
    expect(res.find(r => r.id === 2).col_a).toBeCloseTo(10 / 35);
  });
});
