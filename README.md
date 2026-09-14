# Data Kitchen 🧑‍🍳

Data Kitchen is a browser-based, interactive data preprocessing and machine learning studio built with React, Vite, and DuckDB-WASM. It allows you to ingest, profile, clean, and transform your data entirely on the client side without needing a backend server, ensuring maximum privacy and blazing-fast performance for datasets up to 100MB.

## Features ✨

- **Client-Side Processing**: Fully private data manipulation using WebAssembly (DuckDB-WASM). Your data never leaves your browser.
- **Automated Profiling**: Instantly view row counts, null distributions, unique values, and semantic type inferences.
- **Interactive Wizard**: A guided, step-by-step pipeline to clean, encode, scale, and feature-engineer your dataset.
- **Real-time Previews**: See the results of your transformations instantly in an AG Grid data preview.
- **Zero-Dependency Export**: Download your fully preprocessed dataset as CSV or Parquet.

## Architecture 🏗️

The application uses a dual-thread architecture to keep the UI smooth during heavy data operations:
- **Main Thread**: React (UI), Wizard Context (State Management), AG Grid (Preview).
- **Web Worker Thread**: DuckDB-WASM engine, SQL generation (`sql-compiler.ts`), Data profiling, and heavy asynchronous operations.

## Setup & Development 🚀

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation
1. Clone the repository
2. Navigate into the UI directory:
   ```bash
   cd data-prep-studio
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally
To start the Vite development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

### Building for Production
To build the application for deployment:
```bash
npm run build
```
The optimized static assets will be output to the `dist/` folder.

## Technologies Used 💻
- React 18 + TypeScript
- Vite
- DuckDB-WASM (Local analytical SQL engine)
- AG Grid (High-performance data tables)
- Vitest (Testing framework)

## License
MIT
