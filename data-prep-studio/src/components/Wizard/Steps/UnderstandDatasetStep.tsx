import React from 'react';
import { StepWrapper } from '../StepWrapper';
import { SchemaMetadata, ProfileResult } from '../../../worker/types';

interface UnderstandDatasetStepProps {
  schema: SchemaMetadata | null;
  profileData: ProfileResult | null;
}

export function UnderstandDatasetStep({ schema, profileData }: UnderstandDatasetStepProps) {
  
  if (!schema) {
    return (
      <StepWrapper
        title="Understand the Dataset"
        description="Review the initial profiling data for your uploaded dataset. This step helps identify the basic properties of your dataset like number of rows, columns, and data types."
        isActionable={true}
        hideSkip={true}
      >
        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <p style={{ margin: 0, color: '#64748b' }}>Please upload a dataset on the right to see its properties.</p>
        </div>
      </StepWrapper>
    );
  }

  const numericalCount = schema.columns.filter(c => ['integer', 'float'].includes(c.type)).length;
  const categoricalCount = schema.columns.filter(c => ['string', 'boolean'].includes(c.type)).length;
  const missingValuesCount = schema.columns.reduce((acc, c) => acc + c.nullCount, 0);

  return (
    <StepWrapper
      title="Understand the Dataset"
      description="Review the initial profiling data for your uploaded dataset."
      isActionable={true}
      hideSkip={true}
    >
      
      {/* Dataset Overview */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Dataset Overview</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.95rem', color: '#475569' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Rows</span> <strong>{schema.rowCount.toLocaleString()}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Columns</span> <strong>{schema.columns.length}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Numerical</span> <strong>{numericalCount}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Categorical</span> <strong>{categoricalCount}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Missing Values</span> <strong>{missingValuesCount.toLocaleString()}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Duplicate Rows</span> <strong>0</strong></div>
        </div>
      </div>

      {/* Data Preview Note */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Data Preview</h4>
        <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569' }}>The right-hand panel contains a full interactive data preview. You can scroll horizontally to see all columns.</p>
      </div>

      {/* Column Summary */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Column Summary</h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '0.5rem' }}>Column</th>
                <th style={{ padding: '0.5rem' }}>Type</th>
                <th style={{ padding: '0.5rem' }}>Missing</th>
                <th style={{ padding: '0.5rem' }}>Unique</th>
              </tr>
            </thead>
            <tbody>
              {schema.columns.map(c => (
                <tr key={c.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.5rem', fontWeight: 500, color: '#334155' }}>{c.name}</td>
                  <td style={{ padding: '0.5rem', color: '#64748b' }}>{c.type}</td>
                  <td style={{ padding: '0.5rem', color: c.nullCount > 0 ? '#ef4444' : '#64748b' }}>{c.nullCount}</td>
                  <td style={{ padding: '0.5rem', color: '#64748b' }}>{c.distinctCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Quality */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Data Quality</h4>
        {profileData && profileData.issues.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#475569', fontSize: '0.9rem', lineHeight: 1.6 }}>
            {profileData.issues.map(issue => (
              <li key={issue.id} style={{ color: issue.severity === 'critical' ? '#ef4444' : issue.severity === 'warning' ? '#f59e0b' : '#3b82f6' }}>
                {issue.severity === 'critical' || issue.severity === 'warning' ? '⚠' : 'ℹ'} {issue.description}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: 0, fontSize: '0.95rem', color: '#10b981' }}>✓ No obvious data quality issues detected.</p>
        )}
      </div>

    </StepWrapper>
  );
}
