import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { getNurses, createNurse, deleteNurse } from '../api/nurses';
import { getEmployees } from '../api/employees';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';

const Nurses = () => {
  const [nurses, setNurses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [formData, setFormData] = useState({ emp_id: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [nursRes, empRes] = await Promise.all([getNurses(), getEmployees()]);
      setNurses(nursRes.data || []);
      setEmployees(empRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createNurse(formData);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.error?.message || 'Error saving nurse');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteNurse(selectedItem.emp_id);
      fetchData();
    } catch (err) {
      alert(err.error?.message || 'Error deleting nurse');
    }
  };

  const columns = [
    { field: 'emp_id', label: 'Employee ID' }
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Nurses</h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Add Nurse
        </button>
      </div>

      <div className="card">
        {loading ? <p>Loading...</p> : (
          <DataTable 
            columns={columns} 
            data={nurses} 
            keyField="emp_id"
            onDelete={(row) => { setSelectedItem(row); setIsDeleteOpen(true); }}
          />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Nurse">
        <form onSubmit={handleCreate}>
          <FormField 
            label="Employee" 
            name="emp_id" 
            type="select"
            options={employees.map(e => ({ value: e.emp_id, label: `${e.emp_id} - ${e.fname} ${e.lname}` }))}
            value={formData.emp_id} 
            onChange={(e) => setFormData({ emp_id: e.target.value })} 
            required 
          />
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Nurse</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Nurse"
        message="Are you sure you want to remove this employee from nurses?"
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Nurses;
