# Data Kitchen 🍳

Data Kitchen is an in-browser Data Preparation and Preprocessing tool.
Powered by DuckDB-WASM, all data transformations happen entirely in your browser using SQL!

## Features

### IMPLEMENTED (Working Features)
- **Data Ingestion**: Fast ingestion of CSV and Parquet files up to 100MB.
- **Automated Data Profiling**: Intelligent schema parsing, null counting, and metric generation.
- **Data Quality Scoring**: Health scores mapped by completeness, uniqueness, consistency, and validity.
- **Data Cleaning**:
  - Remove duplicate rows
  - Remove rows with missing values
  - Trim whitespace in strings
  - Rename columns
  - Mathematical Imputation (Mean, Median, Mode, Constant values)
- **Data Type Conversion**: Cast string columns safely to integer, float, boolean, or date.
- **Feature Scaling**: 
  - Standardization (Z-score)
  - Min-Max Scaling
- **Transformations**: 
  - Log Transformation (handling negatives safely)
- **Export**: Export pipeline recipes as JSON, and the fully processed dataset back to CSV.

### NOT IMPLEMENTED (Coming Soon / Demo UI Only)
The UI currently displays several advanced ML and algorithmic prep steps to showcase the wizard flow. These are explicitly tagged with `[DEMO ONLY]` in the UI and are not supported by the underlying DuckDB engine currently:
- One-hot / Label / Target encoding
- Advanced Imputation (KNN, Iterative)
- Robust Scaling / Outlier removal models
- Transformations (Yeo-Johnson, Box-Cox)
- PCA, t-SNE, UMAP
- SMOTE, undersampling
- Train/Val/Test data splits

## Architecture
- **React + Vite Frontend**: The wizard UI.
- **DuckDB Web Worker**: Offloads all data manipulation and schema tracking to a background worker to prevent UI freezes.
- **SQL Compiler**: Converts wizard operations into a chained `WITH` SQL pipeline executed safely against the dataset.

## Setup & Running

```bash
npm install
npm run dev
```

To run the type checker and linter:
```bash
npm run lint
npm run build
```

To run the automated tests:
```bash
npm run test
```
