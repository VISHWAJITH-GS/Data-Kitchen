import * as duckdb from '@duckdb/duckdb-wasm';
import { ProfileResult, DataIssue, HealthScore } from './types';

export async function runProfiling(conn: duckdb.AsyncDuckDBConnection, tableName: string): Promise<ProfileResult> {
  const issues: DataIssue[] = [];
  let issueIdCounter = 1;

  // PASS 1: Aggregate stats
  const countQuery = await conn.query(`SELECT COUNT(*) as count FROM ${tableName}`);
  const rowCount = Number(countQuery.toArray()[0].count);

  if (rowCount === 0) {
    return {
      issues: [{
        id: `issue_${issueIdCounter++}`,
        type: 'empty_table',
        severity: 'critical',
        description: 'The table contains no rows.',
      }],
      healthScore: { overall: 0, completeness: 0, uniqueness: 0, consistency: 0, validity: 0 }
    };
  }

  // Duplicate rows
  const dupQuery = await conn.query(`SELECT COUNT(*) as dupes FROM (SELECT * FROM ${tableName} GROUP BY ALL HAVING COUNT(*) > 1)`);
  const dupCount = Number(dupQuery.toArray()[0].dupes);
  
  if (dupCount > 0) {
    issues.push({
      id: `issue_${issueIdCounter++}`,
      type: 'duplicate_rows',
      severity: 'warning',
      description: `Found ${dupCount} duplicate rows.`,
      suggestedFix: 'remove_duplicates'
    });
  }

  // Column stats
  const describeRes = await conn.query(`DESCRIBE ${tableName}`);
  const columns = describeRes.toArray();
  
  let totalCells = rowCount * columns.length;
  let totalNulls = 0;
  let totalWhitespaceAnomalies = 0;
  let totalTypeAnomalies = 0;

  for (const col of columns) {
    const colName = col.column_name;
    const colType = col.column_type;
    const upperType = colType.toUpperCase();
    const isString = upperType.includes('VARCHAR') || upperType.includes('TEXT') || upperType.includes('STRING');

    // PASS 2: Targeted heuristics
    // Nulls
    const statsQuery = await conn.query(`SELECT COUNT(*) as non_nulls FROM ${tableName} WHERE "${colName}" IS NOT NULL`);
    const nonNulls = Number(statsQuery.toArray()[0].non_nulls);
    const nulls = rowCount - nonNulls;
    totalNulls += nulls;

    if (nulls > 0) {
      issues.push({
        id: `issue_${issueIdCounter++}`,
        type: 'missing_values',
        column: colName,
        severity: nulls === rowCount ? 'critical' : 'warning',
        description: `${nulls} empty values found in column '${colName}'.`,
        suggestedFix: 'fill_nulls'
      });
    }

    if (isString && nonNulls > 0) {
      // Whitespace anomalies
      const wsQuery = await conn.query(`
        SELECT SUM(CASE WHEN "${colName}" != TRIM("${colName}") THEN 1 ELSE 0 END) as ws_count 
        FROM ${tableName} 
        WHERE "${colName}" IS NOT NULL
      `);
      const wsCount = Number(wsQuery.toArray()[0].ws_count);
      totalWhitespaceAnomalies += wsCount;

      if (wsCount > 0) {
        issues.push({
          id: `issue_${issueIdCounter++}`,
          type: 'whitespace_anomaly',
          column: colName,
          severity: 'info',
          description: `Found ${wsCount} values with leading or trailing whitespace in '${colName}'.`,
          suggestedFix: 'trim_whitespace'
        });
      }

      // Inconsistent types (e.g., numbers stored as strings but with some text mixed in)
      const numericCastQuery = await conn.query(`
        SELECT COUNT(*) as valid_nums 
        FROM ${tableName} 
        WHERE TRY_CAST("${colName}" AS DOUBLE) IS NOT NULL
      `);
      const validNums = Number(numericCastQuery.toArray()[0].valid_nums);
      
      // If majority is numeric, but not all (and we exclude whitespace only or empty)
      if (validNums > 0 && validNums > (nonNulls * 0.5) && validNums < nonNulls) {
        const anomalies = nonNulls - validNums;
        totalTypeAnomalies += anomalies;
        issues.push({
          id: `issue_${issueIdCounter++}`,
          type: 'inconsistent_type',
          column: colName,
          severity: 'warning',
          description: `Found ${anomalies} non-numeric values in a mostly numeric column '${colName}'.`,
        });
      }
    }
  }

  // Calculate Health Score
  const completeness = Math.max(0, 100 - (totalNulls / totalCells) * 100);
  const uniqueness = Math.max(0, 100 - (dupCount / rowCount) * 100);
  
  // Consistency penalized by whitespace and type anomalies
  const consistencyPenalty = ((totalWhitespaceAnomalies + totalTypeAnomalies) / totalCells) * 100;
  const consistency = Math.max(0, 100 - consistencyPenalty);
  
  // For V1, structural validity is assumed 100 unless specific critical structural errors exist
  let validity = 100;
  const criticalIssuesCount = issues.filter(i => i.severity === 'critical').length;
  validity = Math.max(0, 100 - (criticalIssuesCount * 10));

  // Weights: Completeness (30%), Uniqueness (20%), Consistency (30%), Validity (20%)
  const overall = Math.round((completeness * 0.3) + (uniqueness * 0.2) + (consistency * 0.3) + (validity * 0.2));

  return {
    issues,
    healthScore: {
      overall,
      completeness: Math.round(completeness),
      uniqueness: Math.round(uniqueness),
      consistency: Math.round(consistency),
      validity: Math.round(validity)
    }
  };
}
