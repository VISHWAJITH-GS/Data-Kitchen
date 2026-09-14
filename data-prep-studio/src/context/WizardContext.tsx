import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Define the steps based on the roadmap
export const WIZARD_STEPS = [
  'Understand Dataset',
  'Data Cleaning',
  'Data Type Conversion',
  'Encoding Categorical Data',
  'Feature Scaling',
  'Outlier Detection & Treatment',
  'Data Transformation',
  'Feature Engineering',
  'Feature Selection',
  'Dimensionality Reduction',
  'Handle Imbalanced Data',
  'Target Variable Processing',
  'Train/Val/Test Split',
  'Final Pipeline & Export'
];

export type ActionConfig = {
  stepIndex: number;
  skipped: boolean;
  config: any; // specific config for that step
};

interface WizardState {
  currentStepIndex: number;
  history: ActionConfig[];
  datasetStatus: 'idle' | 'ingesting' | 'ready' | 'error';
  errorMessage: string | null;
}

type WizardAction = 
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GOTO_STEP'; payload: number }
  | { type: 'SAVE_STEP_CONFIG'; payload: ActionConfig }
  | { type: 'SET_STATUS'; payload: WizardState['datasetStatus'] }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: WizardState = {
  currentStepIndex: 0,
  history: [],
  datasetStatus: 'idle',
  errorMessage: null,
};

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'NEXT_STEP':
      return { ...state, currentStepIndex: Math.min(state.currentStepIndex + 1, WIZARD_STEPS.length - 1) };
    case 'PREV_STEP':
      return { ...state, currentStepIndex: Math.max(state.currentStepIndex - 1, 0) };
    case 'GOTO_STEP':
      return { ...state, currentStepIndex: action.payload };
    case 'SAVE_STEP_CONFIG': {
      // Allow multiple operations per step category
      const newHistory = [...state.history, action.payload];
      return { ...state, history: newHistory };
    }
    case 'SET_STATUS':
      return { ...state, datasetStatus: action.payload };
    case 'SET_ERROR':
      return { ...state, errorMessage: action.payload };
    default:
      return state;
  }
}

const WizardContext = createContext<{
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
} | undefined>(undefined);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  return (
    <WizardContext.Provider value={{ state, dispatch }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
}
