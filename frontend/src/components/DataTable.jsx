import React, { useState, useMemo } from 'react';
import { Edit2, Trash2, Search, Filter, Layers, ChevronRight, Inbox } from 'lucide-react';
import './DataTable.css';

const DataTable = ({ 
  columns, 
  data = [], 
  onEdit, 
  onDelete, 
  keyField = 'id',
  searchPlaceholder = 'Search records...',
  filterComponent
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Extract key helper
  const getRowKey = (row) => {
    if (typeof keyField === 'function') return keyField(row);
    return row[keyField];
  };

  // Multi-column filter
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter((item) => {
      return Object.values(item).some((val) => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') {
          return JSON.stringify(val).toLowerCase().includes(term);
        }
        return String(val).toLowerCase().includes(term);
      });
    });
  }, [data, searchTerm]);

  return (
    <div className="datatable-container">
      {/* Table Toolbar */}
      <div className="datatable-toolbar">
        <div className="search-box-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
            >
              ×
            </button>
          )}
        </div>

        <div className="toolbar-stats">
          <span className="stats-pill">
            <Layers size={13} />
            Showing {filteredData.length} of {data.length} records
          </span>
          {filterComponent}
        </div>
      </div>

      {/* Table Content */}
      {filteredData.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon-box">
            <Inbox size={32} />
          </div>
          <h4>No matching records found</h4>
          <p>{searchTerm ? 'Try adjusting your search query' : 'No records exist in the database yet'}</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} style={col.width ? { width: col.width } : {}}>
                    {col.label}
                  </th>
                ))}
                {(onEdit || onDelete) && <th className="actions-col">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row) => (
                <tr key={getRowKey(row)}>
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
                            className="btn-action btn-action-edit" 
                            onClick={() => onEdit(row)}
                            title="Edit Record"
                          >
                            <Edit2 size={15} />
                          </button>
                        )}
                        {onDelete && (
                          <button 
                            className="btn-action btn-action-delete" 
                            onClick={() => onDelete(row)}
                            title="Delete Record"
                          >
                            <Trash2 size={15} />
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
      )}
    </div>
  );
};

export default DataTable;
