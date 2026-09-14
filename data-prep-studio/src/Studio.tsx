import React, { useState, useEffect, DragEvent, Suspense, useRef } from 'react'
import { dbClient } from './lib/db-client'
import { SchemaMetadata, ProfileResult, RecipeStep, RecipeStepType } from './worker/types'
import { ErrorBoundary } from './components/ErrorBoundary'
import { mapEngineError, MappedError } from './lib/error-mapper'

const DataGrid = React.lazy(() => import('./components/DataGrid').then(module => ({ default: module.DataGrid })))
const IssuePanel = React.lazy(() => import('./components/IssuePanel').then(module => ({ default: module.IssuePanel })))
const RecipePanel = React.lazy(() => import('./components/RecipePanel').then(module => ({ default: module.RecipePanel })))
const ExportPanel = React.lazy(() => import('./components/ExportPanel').then(module => ({ default: module.ExportPanel })))

export default function Studio() {
  const [status, setStatus] = useState<string>('Initializing...')
  const [error, setError] = useState<MappedError | null>(null)
  const [schema, setSchema] = useState<SchemaMetadata | null>(null)
  const [profileData, setProfileData] = useState<ProfileResult | null>(null)
  const [recipes, setRecipes] = useState<RecipeStep[]>([])
  
  // 100MB threshold
  const FILE_SIZE_WARNING_THRESHOLD = 100 * 1024 * 1024;
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dbClient.onWorkerCrashed = () => {
      setStatus('Engine Terminated.');
      setError(mapEngineError('worker crashed'));
      setSchema(null);
      setProfileData(null);
      setRecipes([]);
    };
    
    dbClient.init()
      .then(() => setStatus('Worker Initialized. Ready for data.'))
      .catch(err => {
        setStatus('Initialization Failed')
        setError(mapEngineError(err))
      })
  }, [])

  const processFile = async (file: File) => {
    if (file.size > FILE_SIZE_WARNING_THRESHOLD) {
      alert(`Warning: The file "${file.name}" is larger than 100MB. This might cause memory issues or slow performance.`);
    }

    try {
      setStatus(`Ingesting ${file.name}...`);
      const result = await dbClient.ingest(file);
      setStatus(`Successfully ingested base table: ${result.tableName} (${result.rowCount} rows)`);
      setSchema(result);
      setProfileData(null); // Reset profile on new ingestion
      setRecipes([]); // Reset recipes
      setError(null);
    } catch (err: any) {
      setError(mapEngineError(err));
      setStatus('Ready for data.');
    }
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    await processFile(file);
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }

  const handleProfile = async () => {
    try {
      setStatus('Running profiling engine...');
      const res = await dbClient.profile();
      setProfileData(res);
      setStatus('Profiling complete.');
    } catch (err: any) {
      setError(mapEngineError(err));
      setStatus('Profiling failed.');
    }
  }

  const handleRenameColumn = async (oldName: string, newName: string) => {
    await applyRecipeStep({
      id: `step_${Date.now()}`,
      type: 'rename_column',
      targetColumns: [oldName],
      parameters: { newName }
    });
  };

  const applyRecipeStep = async (step: RecipeStep) => {
    try {
      const newRecipes = [...recipes, step];
      setStatus('Applying recipe...');
      await dbClient.applyRecipe(newRecipes);
      setRecipes(newRecipes);
      
      // Auto-profile after recipe change
      setStatus('Re-profiling...');
      const res = await dbClient.profile();
      setProfileData(res);
      setStatus('Recipe applied and grid updated.');
    } catch (err: any) {
      setError(mapEngineError(err));
      setStatus('Failed to apply recipe.');
    }
  };

  const handleApplyFix = (type: RecipeStepType, column: string, parameters?: any) => {
    applyRecipeStep({
      id: `step_${Date.now()}`,
      type,
      targetColumns: [column],
      parameters
    });
  };

  const handleUndo = async () => {
    if (recipes.length === 0) return;
    const newRecipes = recipes.slice(0, -1);
    await updateRecipesList(newRecipes);
  };

  const handleRemoveStep = async (id: string) => {
    const newRecipes = recipes.filter(r => r.id !== id);
    await updateRecipesList(newRecipes);
  };

  const updateRecipesList = async (newRecipes: RecipeStep[]) => {
    try {
      setStatus('Updating recipes...');
      await dbClient.applyRecipe(newRecipes);
      setRecipes(newRecipes);
      const res = await dbClient.profile();
      setProfileData(res);
      setStatus('Grid updated.');
    } catch (err: any) {
      setError(mapEngineError(err));
      setStatus('Failed to update recipe.');
    }
  };

  return (
    <div className="studio-root" style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'sans-serif', padding: '1rem' }}>
      <h1 style={{ margin: '0 0 1rem 0' }}>Data Preparation Studio</h1>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <p style={{ margin: 0 }}>Status: <strong>{status}</strong></p>
        {schema && !profileData && (
          <button onClick={handleProfile} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
            Run Initial Profiling
          </button>
        )}
      </div>
      
      {error && (
        <div style={{ color: '#d32f2f', margin: '1rem 0', padding: '1rem', border: '1px solid #d32f2f', borderRadius: '8px', backgroundColor: '#fff5f5' }}>
          <strong>Error:</strong> {error.message}
          <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>{error.action}</div>
        </div>
      )}

      <ErrorBoundary>
        <div style={{ display: 'flex', flex: 1, gap: '1rem', overflow: 'hidden' }}>
        
        {/* Left Sidebar: Diagnosis & Action */}
        <div style={{ width: '300px', flexShrink: 0, overflowY: 'auto', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fafafa' }}>
          <h2 style={{ padding: '1rem', margin: 0, borderBottom: '1px solid #ddd', fontSize: '1.2rem', backgroundColor: '#fff', position: 'sticky', top: 0 }}>Diagnosis & Action</h2>
          {profileData ? (
            <Suspense fallback={<div style={{ padding: '1rem' }}>Loading panel...</div>}>
              <IssuePanel issues={profileData.issues} onApplyFix={handleApplyFix} />
            </Suspense>
          ) : (
            <div style={{ padding: '1rem', color: '#777' }}>Run profiling to see issues here.</div>
          )}
        </div>

        {/* Center: Grid and Health */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {profileData && (
            <div style={{ display: 'flex', gap: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '1rem', backgroundColor: '#f0f7ff' }}>
              <div><strong>Health Score:</strong> <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{profileData.healthScore.overall}/100</span></div>
              <div style={{ fontSize: '0.9rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div>Completeness: {profileData.healthScore.completeness}</div>
                <div>Uniqueness: {profileData.healthScore.uniqueness}</div>
                <div>Consistency: {profileData.healthScore.consistency}</div>
                <div>Validity: {profileData.healthScore.validity}</div>
              </div>
            </div>
          )}

          {!schema ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              style={{
                flex: 1,
                border: '2px dashed #ccc',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fafafa',
                cursor: 'pointer'
              }}
            >
              <p>Drop a CSV or Parquet file here, or click to select a file.</p>
              <input 
                type="file" 
                accept=".csv,.parquet" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileInput} 
              />
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>Data Preview</h2>
              <div style={{ flex: 1 }}>
                <Suspense fallback={<div style={{ padding: '2rem' }}>Loading Grid...</div>}>
                  <DataGrid 
                    schema={schema} 
                    recipeStepCount={recipes.length} 
                    onRenameColumn={handleRenameColumn} 
                  />
                </Suspense>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Recipe Engine & Export */}
        <div style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fafafa' }}>
            <h2 style={{ padding: '1rem', margin: 0, borderBottom: '1px solid #ddd', fontSize: '1.2rem', backgroundColor: '#fff', position: 'sticky', top: 0 }}>Recipe Engine</h2>
            <Suspense fallback={<div style={{ padding: '1rem' }}>Loading recipes...</div>}>
              <RecipePanel recipes={recipes} onUndo={handleUndo} onRemoveStep={handleRemoveStep} />
            </Suspense>
          </div>
          
          {schema && (
            <div style={{ border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fafafa' }}>
              <h2 style={{ padding: '1rem', margin: 0, borderBottom: '1px solid #ddd', fontSize: '1.2rem', backgroundColor: '#fff' }}>Export</h2>
              <ErrorBoundary>
                <Suspense fallback={<div style={{ padding: '1rem' }}>Loading export...</div>}>
                  <ExportPanel schema={schema} onError={(msg) => setError(mapEngineError(msg))} />
                </Suspense>
              </ErrorBoundary>
            </div>
          )}
        </div>
        </div>
      </ErrorBoundary>

    </div>
  )
}
