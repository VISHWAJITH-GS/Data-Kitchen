import React from 'react';
import { useWizard } from '../../context/WizardContext';
import { UnderstandDatasetStep } from './Steps/UnderstandDatasetStep';
import { DataCleaningStep } from './Steps/DataCleaningStep';
import { 
  DataTypeConversionStep, 
  EncodingStep, 
  FeatureScalingStep, 
  OutlierDetectionStep, 
  DataTransformationStep, 
  FeatureEngineeringStep, 
  FeatureSelectionStep, 
  DimensionalityReductionStep, 
  ImbalancedDataStep, 
  TargetVariableStep, 
  SplitStep, 
  FinalPipelineStep 
} from './Steps/AdditionalSteps';
import { StepWrapper } from './StepWrapper';
import { SchemaMetadata, ProfileResult } from '../../worker/types';

interface WizardContainerProps {
  schema: SchemaMetadata | null;
  profileData: ProfileResult | null;
}

export function WizardContainer({ schema, profileData }: WizardContainerProps) {
  const { state } = useWizard();
  
  // Render the appropriate step based on index
  const renderStep = () => {
    switch(state.currentStepIndex) {
      case 0:
        return <UnderstandDatasetStep schema={schema} profileData={profileData} />;
      case 1:
        return <DataCleaningStep schema={schema} />;
      case 2:
        return <DataTypeConversionStep schema={schema} />;
      case 3:
        return <EncodingStep schema={schema} />;
      case 4:
        return <FeatureScalingStep schema={schema} />;
      case 5:
        return <OutlierDetectionStep schema={schema} />;
      case 6:
        return <DataTransformationStep schema={schema} />;
      case 7:
        return <FeatureEngineeringStep />;
      case 8:
        return <FeatureSelectionStep />;
      case 9:
        return <DimensionalityReductionStep />;
      case 10:
        return <ImbalancedDataStep />;
      case 11:
        return <TargetVariableStep schema={schema} />;
      case 12:
        return <SplitStep />;
      case 13:
        return <FinalPipelineStep schema={schema} />;
      default:
        return (
          <StepWrapper 
            title={`Step ${state.currentStepIndex + 1}`}
            description="This step is under construction."
          >
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              Placeholder for future preprocessing steps.
            </div>
          </StepWrapper>
        );
    }
  };

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      {renderStep()}
    </div>
  );
}
