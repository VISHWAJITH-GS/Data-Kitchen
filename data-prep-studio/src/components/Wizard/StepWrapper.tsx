import React, { ReactNode } from 'react';
import './WizardSteps.css';
import { useWizard, WIZARD_STEPS } from '../../context/WizardContext';

interface StepWrapperProps {
  title: string;
  description: string;
  children: ReactNode;
  onSkip?: () => void;
  onDo?: () => void;
  isActionable?: boolean;
  hideSkip?: boolean;
}

export function StepWrapper({ title, description, children, onSkip, onDo, isActionable = true, hideSkip = false }: StepWrapperProps) {
  const { state, dispatch } = useWizard();
  
  const handleNext = () => {
    dispatch({ type: 'NEXT_STEP' });
  };
  
  const handleDo = () => {
    if (onDo) onDo();
    // Do not advance step here, just process
  };

  const goBack = () => dispatch({ type: 'PREV_STEP' });
  
  return (
    <div className="step-wrapper">
      <div className="step-header">
        <div className="step-progress">Step {state.currentStepIndex + 1} of {WIZARD_STEPS.length}</div>
        <h2>{title}</h2>
        <p className="step-description">{description}</p>
      </div>
      
      <div className="step-content">
        {children}
      </div>
      
      {isActionable && (
        <div className="step-actions">
          <div>
            {state.currentStepIndex > 0 && (
              <button className="btn-secondary" onClick={goBack}>
                Back
              </button>
            )}
          </div>
          <div className="step-actions-right">
            <button className="btn-primary" onClick={handleDo}>
              Process
            </button>
            <button className="btn-secondary" onClick={handleNext}>
              Next
            </button>
          </div>
        </div>
      )}
      {!isActionable && (
        <div className="step-actions">
           <button className="btn-secondary" onClick={goBack} disabled={state.currentStepIndex === 0}>
            Back
          </button>
        </div>
      )}
    </div>
  );
}
