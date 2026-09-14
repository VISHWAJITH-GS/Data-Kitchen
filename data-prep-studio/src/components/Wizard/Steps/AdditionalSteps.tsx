import React, { useState } from 'react';
import { StepWrapper } from '../StepWrapper';
import { useWizard } from '../../../context/WizardContext';
import { SchemaMetadata } from '../../../worker/types';
import { dbClient } from '../../../lib/db-client';

// Helper component for creating generic option-based steps
function GenericOptionStep({ title, description, options, onDo, stepIndex, schema, colFilter }: { title: string, description: string, options: {id: string, title: string, desc: string}[], onDo: (selectedMethod: string, selectedColumn: string) => void, stepIndex: number, schema?: SchemaMetadata | null, colFilter?: (col: any) => boolean }) {
  const [selectedMethod, setSelectedMethod] = useState<string>(options[0]?.id || '');
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  
  const columns = schema ? (colFilter ? schema.columns.filter(colFilter) : schema.columns) : [];

  return (
    <StepWrapper
      title={title}
      description={description}
      onDo={() => onDo(selectedMethod, selectedColumn)}
    >
      {schema && (
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1e293b' }}>Select Target Column</label>
          <select 
            value={selectedColumn} 
            onChange={(e) => setSelectedColumn(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          >
            <option value="" disabled>Select a column...</option>
            {columns.map(c => (
              <option key={c.name} value={c.name}>{c.name} ({c.type})</option>
            ))}
            {columns.length === 0 && <option value="" disabled>No applicable columns found.</option>}
          </select>
        </div>
      )}

      <div className="method-options">
        {options.map(m => (
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

// 3. Data Type Conversion
export function DataTypeConversionStep({ schema }: { schema?: SchemaMetadata | null }) {
  const { state, dispatch } = useWizard();
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [targetType, setTargetType] = useState<string>('string');
  const handleDo = () => dispatch({ type: 'SAVE_STEP_CONFIG', payload: { stepIndex: state.currentStepIndex, skipped: false, config: { method: 'cast', targetColumn: selectedColumn, targetType } }});
  
  const columns = schema ? schema.columns : [];

  return (
    <StepWrapper title="Data Type Conversion" description="Manually correct any misidentified data types (e.g. converting a numeric ID column to a string type)." onDo={handleDo}>
      {schema && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1e293b' }}>Select Target Column</label>
            <select 
              value={selectedColumn} 
              onChange={(e) => setSelectedColumn(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            >
              <option value="" disabled>Select a column...</option>
              {columns.map(c => (
                <option key={c.name} value={c.name}>{c.name} ({c.type})</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1e293b' }}>Select New Type</label>
            <select 
              value={targetType} 
              onChange={(e) => setTargetType(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            >
              <option value="string">String (VARCHAR)</option>
              <option value="integer">Integer</option>
              <option value="float">Float (DOUBLE)</option>
              <option value="boolean">Boolean</option>
              <option value="date">Date</option>
            </select>
          </div>
        </div>
      )}
      <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#475569' }}>
        <p>Select a column and choose the correct data type to apply a conversion.</p>
        <p>Click "Skip" if types look correct, or "Do" to apply the type conversion.</p>
      </div>
    </StepWrapper>
  );
}

// 4. Encoding Categorical Data
export function EncodingStep({ schema }: { schema?: SchemaMetadata | null }) {
  const { state, dispatch } = useWizard();
  const options = [
    { id: 'onehot', title: 'One-Hot Encoding', desc: '[DEMO ONLY] Best for nominal categories with no inherent order.' },
    { id: 'label', title: 'Label / Ordinal Encoding', desc: '[DEMO ONLY] Best for ordinal categories with meaningful order.' },
    { id: 'target', title: 'Target Encoding', desc: '[DEMO ONLY] Replaces categories with the mean target value.' },
  ];
  return <GenericOptionStep title="Encoding Categorical Data" description="Machine learning algorithms require numerical input. Select an encoding strategy for your categorical columns." options={options} onDo={(sel, col) => dispatch({ type: 'SAVE_STEP_CONFIG', payload: { stepIndex: state.currentStepIndex, skipped: false, config: { method: sel, targetColumn: col } }})} stepIndex={state.currentStepIndex} schema={schema} colFilter={(c: any) => c.type === 'string'} />;
}

// 5. Feature Scaling
export function FeatureScalingStep({ schema }: { schema?: SchemaMetadata | null }) {
  const { state, dispatch } = useWizard();
  const options = [
    { id: 'standard', title: 'Standardization (Z-score)', desc: 'Centers data around mean 0 with SD 1. Best for many algorithms like Neural Networks and SVMs.' },
    { id: 'minmax', title: 'Min-Max Normalization', desc: 'Scales values to a fixed 0-1 range.' },
    { id: 'robust', title: 'Robust Scaling', desc: '[DEMO ONLY] Uses median and IQR. Less sensitive to outliers than standard scaling.' },
  ];
  return <GenericOptionStep title="Feature Scaling" description="Numerical features often have different scales which can harm model performance. Select a scaling technique." options={options} onDo={(sel, col) => dispatch({ type: 'SAVE_STEP_CONFIG', payload: { stepIndex: state.currentStepIndex, skipped: false, config: { method: sel, targetColumn: col } }})} stepIndex={state.currentStepIndex} schema={schema} colFilter={(c: any) => c.type === 'integer' || c.type === 'float'} />;
}

// 6. Outlier Detection
export function OutlierDetectionStep({ schema }: { schema?: SchemaMetadata | null }) {
  const { state, dispatch } = useWizard();
  const options = [
    { id: 'remove', title: 'Remove Outliers', desc: '[DEMO ONLY] Simply drop rows that contain statistical outliers.' },
    { id: 'cap', title: 'Capping / Winsorization', desc: '[DEMO ONLY] Cap extreme values to a specific percentile threshold.' },
    { id: 'keep', title: 'Keep Outliers', desc: 'Do nothing if the outliers represent legitimate observations.' },
  ];
  return <GenericOptionStep title="Outlier Detection & Treatment" description="Choose how to handle data points that deviate significantly from the rest of the observations." options={options} onDo={(sel, col) => dispatch({ type: 'SAVE_STEP_CONFIG', payload: { stepIndex: state.currentStepIndex, skipped: false, config: { method: sel, targetColumn: col } }})} stepIndex={state.currentStepIndex} schema={schema} colFilter={(c: any) => c.type === 'integer' || c.type === 'float'} />;
}

// 7. Data Transformation
export function DataTransformationStep({ schema }: { schema?: SchemaMetadata | null }) {
  const { state, dispatch } = useWizard();
  const options = [
    { id: 'log', title: 'Log Transformation', desc: 'Useful for highly skewed data distributions.' },
    { id: 'yeo-johnson', title: 'Yeo-Johnson / Box-Cox', desc: '[DEMO ONLY] Power transformations that make the distribution more Gaussian-like.' },
    { id: 'quantile', title: 'Quantile Transformation', desc: '[DEMO ONLY] Maps data to a uniform or normal distribution robustly.' },
  ];
  return <GenericOptionStep title="Data Transformation" description="Apply mathematical transformations to features to make them more suitable for ML assumptions." options={options} onDo={(sel, col) => dispatch({ type: 'SAVE_STEP_CONFIG', payload: { stepIndex: state.currentStepIndex, skipped: false, config: { method: sel, targetColumn: col } }})} stepIndex={state.currentStepIndex} schema={schema} colFilter={(c: any) => c.type === 'integer' || c.type === 'float'} />;
}

// 8. Feature Engineering
export function FeatureEngineeringStep() {
  const { state, dispatch } = useWizard();
  const handleDo = (selected: string) => dispatch({ type: 'SAVE_STEP_CONFIG', payload: { stepIndex: state.currentStepIndex, skipped: false, config: { method: selected } }});
  return (
    <StepWrapper title="Feature Engineering" description="Create new useful features from existing data (e.g., extracting Year from Date, binning Ages, calculating BMI)." onDo={() => handleDo('manual')}>
      <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#475569' }}>
        <p>In a full implementation, you would define custom math formulas, date extractions, or binning rules here.</p>
        <p>Click "Skip" to proceed without adding engineered features.</p>
      </div>
    </StepWrapper>
  );
}

// 9. Feature Selection
export function FeatureSelectionStep() {
  const { state, dispatch } = useWizard();
  const options = [
    { id: 'variance', title: 'Variance Threshold', desc: '[DEMO ONLY] Remove features with zero or very low variance (constants).' },
    { id: 'correlation', title: 'Correlation Filter', desc: '[DEMO ONLY] Remove one of pairs of highly correlated features to prevent multicollinearity.' },
    { id: 'importance', title: 'Model-Based Selection', desc: '[DEMO ONLY] Use Random Forest or Lasso to automatically select the top N most important features.' },
  ];
  return <GenericOptionStep title="Feature Selection" description="Remove redundant or irrelevant features to simplify your model and prevent overfitting." options={options} onDo={(sel) => dispatch({ type: 'SAVE_STEP_CONFIG', payload: { stepIndex: state.currentStepIndex, skipped: false, config: { method: sel } }})} stepIndex={state.currentStepIndex} />;
}

// 10. Dimensionality Reduction
export function DimensionalityReductionStep() {
  const { state, dispatch } = useWizard();
  const options = [
    { id: 'pca', title: 'PCA (Principal Component Analysis)', desc: '[DEMO ONLY] Linear dimensionality reduction.' },
    { id: 'tsne', title: 't-SNE / UMAP', desc: '[DEMO ONLY] Non-linear reduction, generally better for visualization.' },
  ];
  return <GenericOptionStep title="Dimensionality Reduction" description="Compress the feature space into fewer dense features while preserving information." options={options} onDo={(sel) => dispatch({ type: 'SAVE_STEP_CONFIG', payload: { stepIndex: state.currentStepIndex, skipped: false, config: { method: sel } }})} stepIndex={state.currentStepIndex} />;
}

// 11. Handle Imbalanced Data
export function ImbalancedDataStep() {
  const { state, dispatch } = useWizard();
  const options = [
    { id: 'smote', title: 'SMOTE (Oversampling)', desc: '[DEMO ONLY] Synthetically generates new minority class instances.' },
    { id: 'undersample', title: 'Random Undersampling', desc: '[DEMO ONLY] Randomly drops majority class instances.' },
    { id: 'class_weights', title: 'Algorithm Class Weights', desc: '[DEMO ONLY] Keep dataset as-is, but rely on cost-sensitive learning.' },
  ];
  return <GenericOptionStep title="Handle Imbalanced Data" description="Crucial for classification tasks where one target class heavily outnumbers the others (e.g. Fraud Detection)." options={options} onDo={(sel) => dispatch({ type: 'SAVE_STEP_CONFIG', payload: { stepIndex: state.currentStepIndex, skipped: false, config: { method: sel } }})} stepIndex={state.currentStepIndex} />;
}

// 12. Target Variable Processing
export function TargetVariableStep({ schema }: { schema?: SchemaMetadata | null }) {
  const { state, dispatch } = useWizard();
  const options = [
    { id: 'label_encode', title: 'Label Encode Target', desc: '[DEMO ONLY] Convert string class labels to integers.' },
    { id: 'log_transform', title: 'Log Transform Target', desc: 'Useful for highly skewed continuous targets for Regression.' },
  ];
  return <GenericOptionStep title="Target Variable Processing" description="Preprocess the column you are actually trying to predict." options={options} onDo={(sel, col) => dispatch({ type: 'SAVE_STEP_CONFIG', payload: { stepIndex: state.currentStepIndex, skipped: false, config: { method: sel, targetColumn: col } }})} stepIndex={state.currentStepIndex} schema={schema} />;
}

// 13. Train / Validation / Test Split
export function SplitStep() {
  const { state, dispatch } = useWizard();
  const options = [
    { id: '80_20', title: '80% Train / 20% Test', desc: '[DEMO ONLY] Standard random split for general machine learning tasks.' },
    { id: '70_15_15', title: '70% Train / 15% Val / 15% Test', desc: '[DEMO ONLY] Includes a validation set for hyperparameter tuning.' },
    { id: 'stratified', title: 'Stratified Split', desc: '[DEMO ONLY] Ensures the target class distribution is preserved across splits.' },
  ];
  return <GenericOptionStep title="Train / Validation / Test Split" description="Separate the data before model training to prevent data leakage." options={options} onDo={(sel) => dispatch({ type: 'SAVE_STEP_CONFIG', payload: { stepIndex: state.currentStepIndex, skipped: false, config: { method: sel } }})} stepIndex={state.currentStepIndex} />;
}

// 14. Final Pipeline
export function FinalPipelineStep({ schema }: { schema?: SchemaMetadata | null }) {
  const { state } = useWizard();
  
  const handleExportConfig = () => {
    const configStr = JSON.stringify(state.history, null, 2);
    const blob = new Blob([configStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pipeline_config.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleExportCSV = async () => {
    if (!schema) return;
    try {
      const result = await dbClient.exportData('csv');
      const blob = new Blob([result.buffer], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cleaned_data.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(`Export failed: ${e.message}`);
    }
  };

  return (
    <StepWrapper title="Final Preprocessing Pipeline" description="Review your selected preprocessing steps and export the results." isActionable={false}>
      <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#1e293b' }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>Pipeline Configuration Complete!</h3>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>You have successfully navigated through the 14-step ML preprocessing wizard.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button className="btn-secondary" onClick={handleExportConfig}>Export JSON Config</button>
          <button className="btn-primary" onClick={handleExportCSV}>Apply Pipeline & Export CSV</button>
        </div>
      </div>
    </StepWrapper>
  );
}
