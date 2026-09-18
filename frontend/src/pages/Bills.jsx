import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { getBills, createBill, deleteBill } from '../api/bills';
import { getPatients } from '../api/patients';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';

const Bills = () => {
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [formData, setFormData] = useState({ p_id: '', b_id: '', amount: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, pRes] = await Promise.all([getBills(), getPatients()]);
      setBills(bRes.data || []);
      setPatients(pRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createBill(formData.p_id, formData);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.error?.message || 'Error creating bill');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBill(selectedItem.p_id, selectedItem.b_id);
      fetchData();
    } catch (err) {
      alert(err.error?.message || 'Error deleting bill');
    }
  };

  const columns = [
    { field: 'b_id', label: 'Bill ID' },
    { field: 'p_id', label: 'Patient ID' },
    { label: 'Amount', render: (row) => `₹${row.amount}` }
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Bills</h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Add Bill
        </button>
      </div>

      <div className="card">
        {loading ? <p>Loading...</p> : (
          <DataTable 
            columns={columns} 
            data={bills} 
            keyField={(row) => `${row.p_id}-${row.b_id}`}
            onDelete={(row) => { setSelectedItem(row); setIsDeleteOpen(true); }}
          />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Bill">
        <form onSubmit={handleCreate}>
          <FormField 
            label="Patient" 
            name="p_id" 
            type="select"
            options={patients.map(p => ({ value: p.p_id, label: `${p.p_id} - ${p.fname} ${p.lname}` }))}
            value={formData.p_id} 
            onChange={handleInputChange} 
            required 
          />
          <FormField label="Bill ID" name="b_id" value={formData.b_id} onChange={handleInputChange} required />
          <FormField label="Amount (₹)" name="amount" type="number" value={formData.amount} onChange={handleInputChange} required />
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Bill</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Bill"
        message="Are you sure you want to delete this bill?"
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Bills;
