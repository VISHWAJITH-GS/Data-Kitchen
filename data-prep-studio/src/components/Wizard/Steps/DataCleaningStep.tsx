import React, { useState } from 'react';
import { StepWrapper } from '../StepWrapper';
import { useWizard } from '../../../context/WizardContext';

export function DataCleaningStep() {
  const { state, dispatch } = useWizard();
  const [selectedMethod, setSelectedMethod] = useState<string>('mean');

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
      payload: { stepIndex: state.currentStepIndex, skipped: false, config: { method: selectedMethod } } 
    });
  };

  return (
    <StepWrapper
      title="Data Cleaning (Missing Values)"
      description="Select how you want to handle missing or null values in your dataset."
      onDo={handleDo}
    >
      <div className="method-options">
        {methods.map(m => (
          <div 
            key={m.id} 
            className={`method-card ${selectedMethod === m.id ? 'selected' : ''}`}
            onClick={() => setSelectedMethod(m.id)}
          >
            <div className="method-title">{m.title}</div>
            <div className="method-desc">{m.desc}</div>
          </div>
        ))}
      </div>
    </StepWrapper>
  );
}
