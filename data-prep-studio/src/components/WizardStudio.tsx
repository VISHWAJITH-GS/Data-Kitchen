import React, { useState, useEffect, Suspense, useRef, DragEvent } from 'react';
import { dbClient } from '../lib/db-client';
import { SchemaMetadata, ProfileResult, RecipeStep } from '../worker/types';
import { ErrorBoundary } from './ErrorBoundary';
import { mapEngineError, MappedError } from '../lib/error-mapper';
import { WizardProvider, useWizard } from '../context/WizardContext';
import { WizardLayout } from './Layout/WizardLayout';
import { WizardContainer } from './Wizard/WizardContainer';

const DataGrid = React.lazy(() => import('./DataGrid').then(module => ({ default: module.DataGrid })));

function WizardStudioInner() {
  const [status, setStatus] = useState<string>('Initializing...');
  const [error, setError] = useState<MappedError | null>(null);
  const [schema, setSchema] = useState<SchemaMetadata | null>(null);
  const [profileData, setProfileData] = useState<ProfileResult | null>(null);
  const { state, dispatch } = useWizard();
  
  const FILE_SIZE_WARNING_THRESHOLD = 100 * 1024 * 1024;
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dbClient.onWorkerCrashed = () => {
      setStatus('Engine Terminated. Please restart.');
      setError(mapEngineError('worker crashed'));
    };
    
    dbClient.init()
      .then(() => setStatus('Worker Initialized. Ready for data.'))
      .catch(err => {
        setStatus('Initialization Failed');
        setError(mapEngineError(err));
      });
  }, []);

  const processFile = async (file: File) => {
    if (file.size > FILE_SIZE_WARNING_THRESHOLD) {
      setError({ message: `The file "${file.name}" is larger than 100MB. To prevent browser memory crashes, files over 100MB are not allowed in this demo.` });
      return;
    }
    dispatch({ type: 'RESET_STATE' });
    try {
      setStatus(`Ingesting ${file.name}...`);
      const result = await dbClient.ingest(file);
      setStatus(`Profiling dataset...`);
      const profile = await dbClient.profile();
      setStatus(`Successfully ingested base table: ${result.tableName} (${result.rowCount} rows)`);
      setSchema(result);
      setProfileData(profile);
      setError(null);
    } catch (err: any) {
      setError(mapEngineError(err));
      setStatus('Ready for data.');
    }
  }

  // Listen for history changes and apply pipeline
  useEffect(() => {
    const applyPipeline = async () => {
      if (!schema || state.history.length === 0) return;
      
      try {
        const { compilePipelineHistory } = await import('../utils/pipelineEngine');
        const steps = compilePipelineHistory(state.history);
        if (steps.length > 0) {
          setStatus('Applying transformations...');
          await dbClient.applyRecipe(steps);
          
          setStatus('Re-profiling dataset...');
          const newProfile = await dbClient.profile();
          setProfileData(newProfile);
          
          setStatus('Updating schema...');
          const newSchema = await dbClient.getSchema();
          setSchema(newSchema);
          
          setStatus('Transformations applied successfully.');
        }
      } catch (err: any) {
        setError(mapEngineError(err));
        setStatus('Failed to apply transformations.');
      }
    };
    
    applyPipeline();
  }, [state.history]); // Removed schema from dependencies to prevent infinite loop after setSchema

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

  const RightContent = () => {
    if (!schema) {
      return (
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{
            flex: 1,
            border: '2px dashed #cbd5e1',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8fafc',
            cursor: 'pointer',
            margin: '2rem',
            color: '#64748b'
          }}
        >
          <svg style={{ width: '64px', height: '64px', marginBottom: '1rem', color: '#94a3b8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
          <p style={{ fontSize: '1.25rem', fontWeight: 500, color: '#334155', margin: '0 0 0.5rem 0' }}>Drop a CSV or Parquet file here</p>
          <p style={{ margin: 0 }}>or click to browse</p>
          <input 
            type="file" 
            accept=".csv,.parquet" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileInput} 
          />
        </div>
      );
    }

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>Data Preview</h2>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Status: {status}</div>
        </div>
        <div style={{ flex: 1, background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading Grid...</div>}>
            <DataGrid 
              schema={schema} 
              recipeStepCount={state.history.length} 
              onRenameColumn={async () => {}} 
            />
          </Suspense>
        </div>
        {error && (
          <div style={{ color: '#ef4444', marginTop: '1rem', padding: '1rem', border: '1px solid #fca5a5', borderRadius: '8px', backgroundColor: '#fef2f2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><strong>Error:</strong> {error.message}</div>
            {error.message.includes('worker crashed') && (
              <button 
                onClick={() => {
                  dbClient.restartWorker();
                  dbClient.init().then(() => {
                    setStatus('Worker Restarted.');
                    setError(null);
                  });
                }}
                style={{ padding: '0.5rem 1rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Restart Engine
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <WizardLayout 
      sidebar={<WizardContainer schema={schema} profileData={profileData} />}
      content={<RightContent />}
    />
  );
}

export default function WizardStudio() {
  return (
    <ErrorBoundary>
      <WizardProvider>
        <WizardStudioInner />
      </WizardProvider>
    </ErrorBoundary>
  );
}
