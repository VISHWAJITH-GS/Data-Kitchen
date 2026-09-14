import React, { useState } from 'react';
import { StepWrapper } from '../StepWrapper';
import { useWizard } from '../../../context/WizardContext';

// Helper component for creating generic option-based steps
function GenericOptionStep({ title, description, options, onDo, stepIndex }: { title: string, description: string, options: {id: string, title: string, desc: string}[], onDo: (selected: string) => void, stepIndex: number }) {
  const [selectedMethod, setSelectedMethod] = useState<string>(options[0]?.id || '');
  
  return (
    <StepWrapper
      title={title}
      description={description}
      onDo={() => onDo(selectedMethod)}
    >
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
export function DataTypeConversionStep() {
  const { state, dispatch } = useWizard();
  const handleDo = (selected: string) => dispatch({ type: 'SAVE_STEP_CONFIG', payload: { stepIndex: state.currentStepIndex, skipped: false, config: { method: selected } }});
  return (
    <StepWrapper title="Data Type Conversion" description="Manually correct any misidentified data types (e.g. converting a numeric ID column to a string type)." onDo={() => handleDo('manual')}>
      <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#475569' }}>
        <p>In a full implementation, this step would present a table allowing you to override the automatically detected types for each column.</p>
        <p>Click "Skip" if types look correct, or "Do" to flag them for review.</p>
      </div>
    </StepWrapper>
  );
}

// 4. Encoding Categorical Data
export function EncodingStep() {
  const { state, dispatch } = useWizard();
  const options = [
    { id: 'onehot', title: 'One-Hot Encoding', desc: 'Best for nominal categories with no inherent order (e.g., Red, Blue, Green).' },
    { id: 'label', title: 'Label / Ordinal Encoding', desc: 'Best for ordinal categories with meaningful order (e.g., Low, Medium, High).' },
    { id: 'target', title: 'Target Encoding', desc: 'Replaces categories with the mean target value. Good for high-cardinality nominals.' },
  ];
  return <GenericOptionStep title="Encoding Categorical Data" description="Machine learning algorithms require numerical input. Select an encoding strategy for your categorical columns." options={options} onDo={(sel) => dispatch({ type: 'SAVE_STEP_CONFIG', payload: { stepIndex: state.currentStepIndex, skipped: false, config: { method: sel } }})} stepIndex={state.currentStepIndex} />;
}

// 5. Feature Scaling
export function FeatureScalingStep() {
  const { state, dispatch } = useWizard();
  const options = [
    { id: 'standard', title: 'Standardization (Z-score)', desc: 'Centers data around mean 0 with SD 1. Best for many algorithms like Neural Networks and SVMs.' },
    { id: 'minmax', title: 'Min-Max Normalization', desc: 'Scales values to a fixed 0-1 range. Useful when exact bounds are known or distance-based algorithms are used.' },
    { id: 'robust', title: 'Robust Scaling', desc: 'Uses median and IQR. Less sensitive to outliers than standard scaling.' },
  ];
  return <GenericOptionStep title="Feature Scaling" description="Numerical features often have different scales which can harm model performance. Select a scaling technique." options={options} onDo={(sel) => dispatch({ type: 'SAVE_STEP_CONFIG', payload: { stepIndex: state.currentStepIndex, skipped: false, config: { method: sel } }})} stepIndex={state.currentStepIndex} />;
}

// 6. Outlier Detection
export function OutlierDetectionStep() {
  const { state, dispatch } = useWizard();
  const options = [
    { id: 'remove', title: 'Remove Outliers', desc: 'Simply drop rows that contain statistical outliers (e.g., using Z-score > 3 or IQR method).' },
    { id: 'cap', title: 'Capping / Winsorization', desc: 'Cap extreme values to a specific percentile threshold instead of removing the row.' },
    { id: 'keep', title: 'Keep Outliers', desc: 'Do nothing if the outliers represent legitimate observations.' },
  ];
  return <GenericOptionStep title="Outlier Detection & Treatment" description="Choose how to handle data points that deviate significantly from the rest of the observations." options={options} onDo={(sel) => dispatch({ type: 'SAVE_STEP_CONFIG', payload: { stepIndex: state.currentStepIndex, skipped: false, config: { method: sel } }})} stepIndex={state.currentStepIndex} />;
}

// 7. Data Transformation
export function DataTransformationStep() {
  const { state, dispatch } = useWizard();
  const options = [
    { id: 'log', title: 'Log Transformation', desc: 'Useful for highly skewed data distributions.' },
    { id: 'yeo-johnson', title: 'Yeo-Johnson / Box-Cox', desc: 'Power transformations that make the distribution more Gaussian-like.' },
    { id: 'quantile', title: 'Quantile Transformation', desc: 'Maps data to a uniform or normal distribution robustly.' },
  ];
  return <GenericOptionStep title="Data Transformation" description="Apply mathematical transformations to features to make them more suitable for ML assumptions." options={options} onDo={(sel) => dispatch({ type: 'SAVE_STEP_CONFIG', payload: { stepIndex: state.currentStepIndex, skipped: false, config: { method: sel } }})} stepIndex={state.currentStepIndex} />;
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
    { id: 'variance', title: 'Variance Threshold', desc: 'Remove features with zero or very low variance (constants).' },
    { id: 'correlation', title: 'Correlation Filter', desc: 'Remove one of pairs of highly correlated features to prevent multicollinearity.' },
    { id: 'importance', title: 'Model-Based Selection', desc: 'Use Random Forest or Lasso to automatically select the top N most important features.' },
  ];
  return <GenericOptionStep title="Feature Selection" description="Remove redundant or irrelevant features to simplify your model and prevent overfitting." options={options} onDo={(sel) => dispatch({ type: 'SAVE_STEP_CONFIG', payload: { stepIndex: state.currentStepIndex, skipped: false, config: { method: sel } }})} stepIndex={state.currentStepIndex} />;
}

// 10. Dimensionality Reduction
export function DimensionalityReductionStep() {
  const { state, dispatch } = useWizard();
  const options = [
    { id: 'pca', title: 'PCA (Principal Component Analysis)', desc: 'Linear dimensionality reduction. Good for preserving global variance.' },
    { id: 'tsne', title: 't-SNE / UMAP', desc: 'Non-linear reduction, generally better for visualization rather than preprocessing.' },
  ];
  return <GenericOptionStep title="Dimensionality Reduction" description="Compress the feature space into fewer dense features while preserving information." options={options} onDo={(sel) => dispatch({ type: 'SAVE_STEP_CONFIG', payload: { stepIndex: state.currentStepIndex, skipped: false, config: { method: sel } }})} stepIndex={state.currentStepIndex} />;
}

// 11. Handle Imbalanced Data
export function ImbalancedDataStep() {
  const { state, dispatch } = useWizard();
  const options = [
    { id: 'smote', title: 'SMOTE (Oversampling)', desc: 'Synthetically generates new minority class instances.' },
    { id: 'undersample', title: 'Random Undersampling', desc: 'Randomly drops majority class instances to match minority count.' },
    { id: 'class_weights', title: 'Algorithm Class Weights', desc: 'Keep dataset as-is, but rely on cost-sensitive learning in the ML model.' },
  ];
  return <GenericOptionStep title="Handle Imbalanced Data" description="Crucial for classification tasks where one target class heavily outnumbers the others (e.g. Fraud Detection)." options={options} onDo={(sel) => dispatch({ type: 'SAVE_STEP_CONFIG', payload: { stepIndex: state.currentStepIndex, skipped: false, config: { method: sel } }})} stepIndex={state.currentStepIndex} />;
}

// 12. Target Variable Processing
export function TargetVariableStep() {
  const { state, dispatch } = useWizard();
  const options = [
    { id: 'label_encode', title: 'Label Encode Target', desc: 'Convert string class labels to integers (0, 1, 2) for Classification.' },
    { id: 'log_transform', title: 'Log Transform Target', desc: 'Useful for highly skewed continuous targets (like Price/Salary) for Regression.' },
  ];
  return <GenericOptionStep title="Target Variable Processing" description="Preprocess the column you are actually trying to predict." options={options} onDo={(sel) => dispatch({ type: 'SAVE_STEP_CONFIG', payload: { stepIndex: state.currentStepIndex, skipped: false, config: { method: sel } }})} stepIndex={state.currentStepIndex} />;
}

// 13. Train / Validation / Test Split
export function SplitStep() {
  const { state, dispatch } = useWizard();
  const options = [
    { id: '80_20', title: '80% Train / 20% Test', desc: 'Standard random split for general machine learning tasks.' },
    { id: '70_15_15', title: '70% Train / 15% Val / 15% Test', desc: 'Includes a validation set for hyperparameter tuning.' },
    { id: 'stratified', title: 'Stratified Split', desc: 'Ensures the target class distribution is preserved across splits.' },
  ];
  return <GenericOptionStep title="Train / Validation / Test Split" description="Separate the data before model training to prevent data leakage." options={options} onDo={(sel) => dispatch({ type: 'SAVE_STEP_CONFIG', payload: { stepIndex: state.currentStepIndex, skipped: false, config: { method: sel } }})} stepIndex={state.currentStepIndex} />;
}

// 14. Final Pipeline
export function FinalPipelineStep() {
  return (
    <StepWrapper title="Final Preprocessing Pipeline" description="Review your selected preprocessing steps and export the results." isActionable={false}>
      <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#1e293b' }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>Pipeline Configuration Complete!</h3>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>You have successfully navigated through the 14-step ML preprocessing wizard.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button className="btn-secondary">Export JSON Config</button>
          <button className="btn-primary">Apply Pipeline & Export CSV</button>
        </div>
      </div>
    </StepWrapper>
  );
}
