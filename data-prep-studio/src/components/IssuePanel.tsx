import React, { useState } from 'react';
import { DataIssue, RecipeStepType } from '../worker/types';

interface IssuePanelProps {
  issues: DataIssue[];
  onApplyFix: (type: RecipeStepType, column: string, parameters?: any) => void;
}

export const IssuePanel: React.FC<IssuePanelProps> = ({ issues, onApplyFix }) => {
  if (issues.length === 0) {
    return <div style={{ padding: '1rem', color: '#555' }}>No issues found! Your data looks healthy.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
      {issues.map(issue => (
        <IssueCard key={issue.id} issue={issue} onApplyFix={onApplyFix} />
      ))}
    </div>
  );
};

const IssueCard: React.FC<{ issue: DataIssue, onApplyFix: (type: RecipeStepType, column: string, parameters?: any) => void }> = ({ issue, onApplyFix }) => {
  const [showFixDialog, setShowFixDialog] = useState(false);
  const [fillValue, setFillValue] = useState('');

  const handleFixClick = () => {
    if (issue.suggestedFix === 'fill_nulls') {
      setShowFixDialog(true);
    } else if (issue.suggestedFix === 'remove_duplicates') {
      onApplyFix('remove_duplicates', '*');
    } else if (issue.suggestedFix === 'trim_whitespace' && issue.column) {
      onApplyFix('trim_whitespace', issue.column);
    }
  };

  const submitFix = () => {
    if (issue.suggestedFix === 'fill_nulls' && issue.column) {
      onApplyFix('fill_nulls', issue.column, { value: fillValue });
      setShowFixDialog(false);
    }
  };

  const borderColor = issue.severity === 'critical' ? 'red' : issue.severity === 'warning' ? 'orange' : 'blue';

  return (
    <div style={{ border: '1px solid #e0e0e0', borderLeft: `4px solid ${borderColor}`, borderRadius: '6px', padding: '1rem', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{issue.description}</div>
      {issue.column && <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>Affected Column: {issue.column}</div>}
      
      {!showFixDialog && issue.suggestedFix && (
        <button 
          onClick={handleFixClick}
          style={{ padding: '0.4rem 0.8rem', backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          Fix: {issue.suggestedFix.replace('_', ' ')}
        </button>
      )}

      {showFixDialog && (
        <div style={{ marginTop: '0.5rem', padding: '0.5rem', border: '1px dashed #ccc', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>What should missing values be replaced with?</div>
          <input 
            type="text" 
            value={fillValue} 
            onChange={e => setFillValue(e.target.value)} 
            placeholder="e.g. 0 or Unknown" 
            style={{ padding: '0.3rem', width: '100%', marginBottom: '0.5rem' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={submitFix} style={{ padding: '0.3rem 0.8rem', backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Apply</button>
            <button onClick={() => setShowFixDialog(false)} style={{ padding: '0.3rem 0.8rem', backgroundColor: '#eee', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};
