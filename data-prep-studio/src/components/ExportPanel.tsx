import React, { useState } from 'react';
import { dbClient } from '../lib/db-client';
import { SchemaMetadata } from '../worker/types';

interface ExportPanelProps {
  schema: SchemaMetadata;
  onError: (msg: string) => void;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ schema, onError }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'parquet') => {
    setIsExporting(true);
    try {
      const result = await dbClient.exportData(format, schema.rowCount, schema.columns.length);
      
      // Trigger browser download
      const blob = new Blob([result.buffer], { type: format === 'csv' ? 'text/csv' : 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      onError(err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '1rem' }}>
        Download your cleaned dataset. This creates a new file and will not overwrite your original data.
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button 
          onClick={() => handleExport('csv')} 
          disabled={isExporting}
          style={{ padding: '0.5rem 1rem', cursor: isExporting ? 'wait' : 'pointer', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px' }}
        >
          {isExporting ? 'Exporting...' : 'Export to CSV'}
        </button>
        <button 
          onClick={() => handleExport('parquet')} 
          disabled={isExporting}
          style={{ padding: '0.5rem 1rem', cursor: isExporting ? 'wait' : 'pointer', backgroundColor: '#17a2b8', color: '#fff', border: 'none', borderRadius: '4px' }}
        >
          {isExporting ? 'Exporting...' : 'Export to Parquet'}
        </button>
      </div>
    </div>
  );
};
