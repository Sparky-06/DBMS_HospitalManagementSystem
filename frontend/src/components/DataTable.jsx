import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import './DataTable.css';

const DataTable = ({ columns, data, onEdit, onDelete, keyField = 'id' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <p>No records found.</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx}>{col.label}</th>
            ))}
            {(onEdit || onDelete) && <th className="actions-col">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row[keyField]}>
              {columns.map((col, idx) => (
                <td key={idx}>
                  {col.render ? col.render(row) : row[col.field]}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="actions-col">
                  <div className="action-buttons">
                    {onEdit && (
                      <button 
                        className="btn-icon text-primary" 
                        onClick={() => onEdit(row)}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    {onDelete && (
                      <button 
                        className="btn-icon text-danger" 
                        onClick={() => onDelete(row)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
