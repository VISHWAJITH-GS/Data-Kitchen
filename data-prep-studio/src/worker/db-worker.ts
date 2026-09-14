import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_wasm_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';
import { WorkerRequest, WorkerResponse, ColumnType, SemanticHint, ColumnMetadata, SchemaMetadata, RecipeStep } from './types';
import { compileRecipe } from './sql-compiler';
import { runProfiling } from './profiler';

function mapDuckDBType(duckType: string): ColumnType {
  const upperType = duckType.toUpperCase();
  if (upperType.includes('VARCHAR') || upperType.includes('TEXT') || upperType.includes('STRING')) return 'string';
  if (upperType.includes('INT') || upperType.includes('HUGEINT')) return 'integer';
  if (upperType.includes('FLOAT') || upperType.includes('DOUBLE') || upperType.includes('DECIMAL')) return 'float';
  if (upperType.includes('BOOL')) return 'boolean';
  if (upperType.includes('DATE') || upperType.includes('TIMESTAMP') || upperType.includes('TIME')) return 'date';
  return 'unknown';
}

function inferSemanticHint(values: any[]): SemanticHint {
  const validValues = values.filter(v => v !== null && v !== undefined && v !== '');
  if (validValues.length === 0) return 'none';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const dateRegex = /^(?:\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})/;

  let emailCount = 0;
  let dateCount = 0;

  for (const v of validValues) {
    const str = String(v);
    if (emailRegex.test(str)) emailCount++;
    if (dateRegex.test(str)) dateCount++;
  }

  const threshold = validValues.length * 0.5;
  if (emailCount > threshold) return 'email';
  if (dateCount > threshold) return 'date';

  return 'none';
}

const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
  mvp: {
    mainModule: duckdb_wasm,
    mainWorker: mvp_worker,
  },
  eh: {
    mainModule: duckdb_wasm_eh,
    mainWorker: eh_worker,
  },
};

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;

async function initDB() {
  if (db) return;
  const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
  const worker = new Worker(bundle.mainWorker!);
  const logger = new duckdb.ConsoleLogger();
  db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  conn = await db.connect();
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { id, type, payload } = e.data;
  
  try {
    if (!db && type !== 'INIT') {
      await initDB();
    }

    let resultPayload = null;

    switch (type) {
      case 'INIT':
        await initDB();
        resultPayload = { status: 'initialized' };
        break;
      case 'INGEST': {
        const file: File = payload.file;
        if (db && conn) {
           await db.registerFileHandle(file.name, file, duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, true);
           
           const ext = file.name.split('.').pop()?.toLowerCase();
           await conn.query(`DROP TABLE IF EXISTS base_data`);

           if (ext === 'csv') {
             await conn.query(`CREATE TABLE base_data AS SELECT * FROM read_csv_auto('${file.name}')`);
           } else if (ext === 'parquet') {
             await conn.query(`CREATE TABLE base_data AS SELECT * FROM read_parquet('${file.name}')`);
           } else {
             throw new Error('Unsupported file format. Please use CSV or Parquet.');
           }

           const countRes = await conn.query(`SELECT COUNT(*) as count FROM base_data`);
           const rowCount = Number(countRes.toArray()[0].count);

           const describeRes = await conn.query(`DESCRIBE base_data`);
           const describeRows = describeRes.toArray();
           
           const columns: ColumnMetadata[] = [];
           
           for (let i = 0; i < describeRows.length; i++) {
             const row = describeRows[i];
             const colName = row.column_name;
             const colType = row.column_type;
             
             const statsQuery = await conn.query(`SELECT COUNT(*) as non_null_count, COUNT(DISTINCT "${colName}") as distinct_count FROM base_data`);
             const stats = statsQuery.toArray()[0];
             const nullCount = rowCount - Number(stats.non_null_count);
             const distinctCount = Number(stats.distinct_count);
             
             const sampleQuery = await conn.query(`SELECT "${colName}" FROM base_data LIMIT 100`);
             const sampleVals = sampleQuery.toArray().map(r => r[colName]);
             
             const mappedType = mapDuckDBType(colType);
             const hint = mappedType === 'string' ? inferSemanticHint(sampleVals) : 'none';

             columns.push({
               name: colName,
               position: i,
               type: mappedType,
               nullCount,
               distinctCount,
               semanticHint: hint
             });
           }

           const schema: SchemaMetadata = {
             tableName: 'base_data',
             rowCount,
             columns
           };

           resultPayload = schema;
        }
        break;
      }
      case 'PREVIEW': {
        if (db && conn) {
          const { offset, limit } = payload;
          const hasCurrentViewQuery = await conn.query(`SELECT count(*) as count FROM information_schema.tables WHERE table_name = 'current_view'`);
          const count = Number(hasCurrentViewQuery.toArray()[0].count);
          const targetTable = count > 0 ? 'current_view' : 'base_data';

          const dataRes = await conn.query(`SELECT * FROM ${targetTable} LIMIT ${limit} OFFSET ${offset}`);
          
          const countRes = await conn.query(`SELECT COUNT(*) as count FROM ${targetTable}`);
          const totalCount = Number(countRes.toArray()[0].count);

          resultPayload = {
            rows: dataRes.toArray().map(r => r.toJSON()),
            lastRow: totalCount
          };
        } else {
          throw new Error('Database not initialized');
        }
        break;
      }
      case 'PROFILE': {
        if (db && conn) {
          // If recipes exist, profile current_view, else base_data
          const hasCurrentViewQuery = await conn.query(`SELECT count(*) as count FROM information_schema.tables WHERE table_name = 'current_view'`);
          const count = Number(hasCurrentViewQuery.toArray()[0].count);
          const targetTable = count > 0 ? 'current_view' : 'base_data';
          
          const profileRes = await runProfiling(conn, targetTable);
          resultPayload = profileRes;
        } else {
          throw new Error('Database not initialized');
        }
        break;
      }
      case 'TRANSFORM': {
        const steps: RecipeStep[] = payload.steps;
        if (db && conn) {
          const compiledSql = compileRecipe(steps, 'base_data');
          await conn.query(`CREATE OR REPLACE VIEW current_view AS ${compiledSql}`);
          
          // Return a 10-row preview
          const previewRes = await conn.query(`SELECT * FROM current_view LIMIT 10`);
          resultPayload = { preview: previewRes.toArray().map(r => r.toJSON()) };
        } else {
          throw new Error('Database not initialized');
        }
        break;
      }
      case 'EXPORT': {
        const { format, expectedRows, expectedCols } = payload;
        if (db && conn) {
          const hasCurrentViewQuery = await conn.query(`SELECT count(*) as count FROM information_schema.tables WHERE table_name = 'current_view'`);
          const count = Number(hasCurrentViewQuery.toArray()[0].count);
          const targetTable = count > 0 ? 'current_view' : 'base_data';

          // Integrity Check
          const countRes = await conn.query(`SELECT COUNT(*) as count FROM ${targetTable}`);
          const actualRows = Number(countRes.toArray()[0].count);
          
          const describeRes = await conn.query(`DESCRIBE ${targetTable}`);
          const actualCols = describeRes.toArray().length;

          if (actualRows !== expectedRows || actualCols !== expectedCols) {
             throw new Error(`Data integrity mismatch: Expected ${expectedRows}x${expectedCols}, but view has ${actualRows}x${actualCols}. Please wait for the recipe to finish applying.`);
          }

          // Memory Safeguard Check (~50 bytes per cell rough estimate)
          const estimatedSize = actualRows * actualCols * 50; 
          const MEMORY_LIMIT = 200 * 1024 * 1024; // 200MB
          if (estimatedSize > MEMORY_LIMIT) {
             console.warn(`Export size estimated at ${Math.round(estimatedSize / 1024 / 1024)}MB. Continuing, but memory may be constrained.`);
          }

          const exportFileName = `export.${format}`;
          
          if (format === 'csv') {
             await conn.query(`COPY ${targetTable} TO '${exportFileName}' (HEADER, DELIMITER ',')`);
          } else if (format === 'parquet') {
             await conn.query(`COPY ${targetTable} TO '${exportFileName}' (FORMAT PARQUET)`);
          } else {
             throw new Error(`Unsupported export format: ${format}`);
          }

          const buffer = await db.copyFileToBuffer(exportFileName);
          
          resultPayload = {
             buffer,
             fileName: `transformed_data.${format}`
          };
        } else {
          throw new Error('Database not initialized');
        }
        break;
      }
      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    const response: WorkerResponse = {
      id,
      type,
      success: true,
      payload: resultPayload
    };
    self.postMessage(response);
  } catch (error: any) {
    console.error(`Worker error [${type}]:`, error);
    // Graceful error message posted back to UI, especially for Out-Of-Memory
    const response: WorkerResponse = {
      id,
      type,
      success: false,
      error: error?.message || 'An unknown error occurred in the worker'
    };
    self.postMessage(response);
  }
};
