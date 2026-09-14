# Zero-Leak Privacy Checklist

Data Preparation Studio is designed with a strict "Zero-Leak" privacy policy. All data processing occurs locally within your browser using DuckDB-Wasm. 

**No dataset contents, columns, schemas, or metadata are ever transmitted off your device.**

## Privacy Audit

- [x] **Local Data Ingestion**: The `INGEST` pipeline reads the file directly from the browser's `FileReader` into the in-memory DuckDB virtual filesystem. No network requests are made.
- [x] **Local Processing**: All profiling heuristics, aggregate stats, and transformations (Recipe Engine) are executed locally via DuckDB-Wasm running in a dedicated Web Worker.
- [x] **Local Export**: The `EXPORT` pipeline uses DuckDB's native `COPY` command to serialize the data back into the virtual filesystem, which is then extracted as a `Blob` and downloaded natively by the browser. 
- [x] **No Telemetry**: No third-party analytics (e.g., Google Analytics, Mixpanel, Segment) are embedded in this application.
- [x] **No Remote Logging**: No error tracking software (e.g., Sentry, Datadog) is installed. Worker crashes and UI errors are caught by local React Error Boundaries and logged only to the local browser console.
- [x] **No CDN Data Leaks**: All core dependencies (`react`, `ag-grid`, `@duckdb/duckdb-wasm`) are bundled locally. No external fonts or CDNs are pinged dynamically based on dataset contents.

**Status: 100% Privacy Preserved.**
