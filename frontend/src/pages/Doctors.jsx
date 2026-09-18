import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { getDoctors, createDoctor, updateDoctor, deleteDoctor } from '../api/doctors';
import { getEmployees } from '../api/employees';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    emp_id: '', department: '', qualification: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docsRes, empRes] = await Promise.all([getDoctors(), getEmployees()]);
      setDoctors(docsRes.data || []);
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

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openAdd = () => {
    setIsEditing(false);
    setFormData({ emp_id: '', department: '', qualification: '' });
    setIsModalOpen(true);
  };

  const openEdit = (row) => {
    setIsEditing(true);
    setFormData(row);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateDoctor(formData.emp_id, formData);
      } else {
        await createDoctor(formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.error?.message || 'Error saving doctor');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoctor(selectedItem.emp_id);
      fetchData();
    } catch (err) {
      alert(err.error?.message || 'Error deleting doctor');
    }
  };

  const columns = [
    { field: 'emp_id', label: 'Employee ID' },
    { field: 'department', label: 'Department' },
    { field: 'qualification', label: 'Qualification' }
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Doctors</h1>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> Add Doctor
        </button>
      </div>

      <div className="card">
        {loading ? <p>Loading...</p> : (
          <DataTable 
            columns={columns} 
            data={doctors} 
            keyField="emp_id"
            onEdit={openEdit}
            onDelete={(row) => { setSelectedItem(row); setIsDeleteOpen(true); }}
          />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Edit Doctor' : 'Add Doctor'}>
        <form onSubmit={handleSave}>
          <FormField 
            label="Employee" 
            name="emp_id" 
            type="select"
            options={employees.map(e => ({ value: e.emp_id, label: `${e.emp_id} - ${e.fname} ${e.lname}` }))}
            value={formData.emp_id} 
            onChange={handleInputChange} 
            required 
            disabled={isEditing}
          />
          <FormField label="Department" name="department" value={formData.department} onChange={handleInputChange} required />
          <FormField label="Qualification" name="qualification" value={formData.qualification} onChange={handleInputChange} required />
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Doctor</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Doctor"
        message="Are you sure you want to remove this employee from doctors?"
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Doctors;
