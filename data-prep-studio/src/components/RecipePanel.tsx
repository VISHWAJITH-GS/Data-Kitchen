import React from 'react';
import { RecipeStep } from '../worker/types';

interface RecipePanelProps {
  recipes: RecipeStep[];
  onUndo: () => void;
  onRemoveStep: (id: string) => void;
}

export const RecipePanel: React.FC<RecipePanelProps> = ({ recipes, onUndo, onRemoveStep }) => {
  if (recipes.length === 0) {
    return <div style={{ padding: '1rem', color: '#555' }}>No transformations applied yet.</div>;
  }

  const renderStepDescription = (step: RecipeStep) => {
    switch (step.type) {
      case 'remove_duplicates':
        return 'Removed duplicate rows';
      case 'fill_nulls':
        return `Filled empty values in '${step.targetColumns?.[0]}' with '${step.parameters?.value}'`;
      case 'trim_whitespace':
        return `Trimmed whitespace in '${step.targetColumns?.[0]}'`;
      case 'rename_column':
        return `Renamed column '${step.targetColumns?.[0]}' to '${step.parameters?.newName}'`;
      default:
        return `Applied ${step.type}`;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem' }}>Recipe History</h3>
        <button onClick={onUndo} style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', cursor: 'pointer' }}>Undo Last</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {recipes.map((step, index) => (
          <div key={step.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: '#f9f9f9', border: '1px solid #ddd', borderRadius: '4px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#777', marginBottom: '0.2rem' }}>Step {index + 1}</div>
              <div style={{ fontSize: '0.9rem' }}>{renderStepDescription(step)}</div>
            </div>
            <button 
              onClick={() => onRemoveStep(step.id)} 
              title="Remove Step"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red', fontSize: '1.2rem', padding: '0 0.5rem' }}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
