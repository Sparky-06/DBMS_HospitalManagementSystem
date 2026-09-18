import React from 'react';
import Modal from './Modal';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p style={{ marginBottom: '1.5rem' }}>{message}</p>
      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-danger" onClick={() => {
          onConfirm();
          onClose();
        }}>Confirm Delete</button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
