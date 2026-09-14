import React, { useState } from 'react';
import { StepWrapper } from '../StepWrapper';
import { useWizard } from '../../../context/WizardContext';
import { SchemaMetadata } from '../../../worker/types';

export function DataCleaningStep({ schema }: { schema?: SchemaMetadata | null }) {
  const { state, dispatch } = useWizard();
  const [selectedMethod, setSelectedMethod] = useState<string>('mean');
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [constantValue, setConstantValue] = useState<string>('');

  const methods = [
    { id: 'remove_rows', title: 'Remove Rows', desc: 'Drop any row containing missing values.' },
    { id: 'mean', title: 'Mean Imputation', desc: 'Replace missing numeric values with the column mean.' },
    { id: 'median', title: 'Median Imputation', desc: 'Replace missing numeric values with the column median.' },
    { id: 'mode', title: 'Mode Imputation', desc: 'Replace missing values with the most frequent value.' },
    { id: 'constant', title: 'Constant Value', desc: 'Replace missing values with a specific constant.' },
  ];

  const handleDo = () => {
    dispatch({ 
      type: 'SAVE_STEP_CONFIG', 
      payload: { stepIndex: state.currentStepIndex, skipped: false, config: { method: selectedMethod, targetColumn: selectedColumn, constantValue } } 
    });
  };

  const columnsWithNulls = schema?.columns.filter(c => c.nullCount > 0) || [];

  return (
    <StepWrapper
      title="Data Cleaning (Missing Values)"
      description="Select a column and how you want to handle missing or null values in it."
      onDo={handleDo}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1e293b' }}>Select Column with Missing Values</label>
        <select 
          value={selectedColumn} 
          onChange={(e) => setSelectedColumn(e.target.value)}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
        >
          <option value="" disabled>Select a column...</option>
          {columnsWithNulls.map(c => (
            <option key={c.name} value={c.name}>{c.name} ({c.nullCount} missing)</option>
          ))}
          {columnsWithNulls.length === 0 && <option value="" disabled>No columns with missing values found.</option>}
        </select>
      </div>

      <div className="method-options">
        {methods.map(m => (
          <div 
            key={m.id} 
            className={`method-card ${selectedMethod === m.id ? 'selected' : ''}`}
            onClick={() => setSelectedMethod(m.id)}
          >
            <div className="method-title">{m.title}</div>
            <div className="method-desc">{m.desc}</div>
            {selectedMethod === 'constant' && m.id === 'constant' && (
              <input 
                type="text" 
                placeholder="Enter constant value" 
                value={constantValue}
                onChange={e => setConstantValue(e.target.value)}
                onClick={e => e.stopPropagation()}
                style={{ marginTop: '0.5rem', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
              />
            )}
          </div>
        ))}
      </div>
    </StepWrapper>
  );
}
