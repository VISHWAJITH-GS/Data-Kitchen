import React, { useMemo, useRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { IDatasource, IGetRowsParams, ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { dbClient } from '../lib/db-client';
import { SchemaMetadata } from '../worker/types';

interface DataGridProps {
  schema: SchemaMetadata;
  recipeStepCount: number; // to trigger re-renders on recipe changes
  onRenameColumn: (oldName: string, newName: string) => void;
}

export const DataGrid: React.FC<DataGridProps> = ({ schema, recipeStepCount, onRenameColumn }) => {
  const gridRef = useRef<AgGridReact>(null);

  const columnDefs = useMemo<ColDef[]>(() => {
    return schema.columns.map((col) => ({
      field: col.name,
      headerName: col.name,
      editable: true, // We allow editing the header, but since we can't easily edit headers out of the box in Community without custom components, we'll map cell edits to column renames for this basic demo if they try to edit the first row, or just use a custom header component.
      // Wait, AG grid allows editable *cells*. For header renaming, we need a custom header component.
      headerComponent: CustomHeader,
      headerComponentParams: {
        onRename: (newName: string) => onRenameColumn(col.name, newName)
      },
      minWidth: 150,
    }));
  }, [schema, onRenameColumn]);

  const datasource = useMemo<IDatasource>(() => {
    return {
      getRows: async (params: IGetRowsParams) => {
        try {
          const limit = params.endRow - params.startRow;
          const offset = params.startRow;
          const result = await dbClient.preview(offset, limit);
          params.successCallback(result.rows, result.lastRow);
        } catch (err) {
          console.error("Error fetching rows", err);
          params.failCallback();
        }
      }
    };
  }, [recipeStepCount]); // recreate datasource when recipes change to force refresh

  return (
    <div className="ag-theme-alpine" style={{ height: '100%', width: '100%' }}>
      <AgGridReact
        ref={gridRef}
        columnDefs={columnDefs}
        rowModelType={'infinite'}
        datasource={datasource}
        cacheBlockSize={100}
        maxBlocksInCache={10}
        defaultColDef={{ resizable: true }}
      />
    </div>
  );
};

// Custom header component to support inline renaming
const CustomHeader = (props: any) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [name, setName] = React.useState(props.displayName);

  const handleBlur = () => {
    setIsEditing(false);
    if (name !== props.displayName && name.trim() !== '') {
      props.onRename(name.trim());
    } else {
      setName(props.displayName);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', cursor: 'pointer' }} onDoubleClick={() => setIsEditing(true)}>
      {isEditing ? (
        <input 
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{ width: '100%' }}
        />
      ) : (
        <span style={{ fontWeight: 'bold' }}>{props.displayName}</span>
      )}
    </div>
  );
};
