import React from 'react';

const FormField = ({ label, name, type = 'text', value, onChange, options, required = false, multiple = false }) => {
  return (
    <div className="form-group">
      <label htmlFor={name}>
        {label} {required && <span style={{ color: 'var(--danger-color)' }}>*</span>}
      </label>
      {type === 'select' ? (
        <select
          id={name}
          name={name}
          className="form-control"
          value={value}
          onChange={onChange}
          required={required}
          multiple={multiple}
        >
          <option value="">Select...</option>
          {options?.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          className="form-control"
          value={value}
          onChange={onChange}
          required={required}
          rows="3"
        />
      ) : (
        <input
          type={type}
          id={name}
          name={name}
          className="form-control"
          value={value}
          onChange={onChange}
          required={required}
        />
      )}
    </div>
  );
};

export default FormField;
