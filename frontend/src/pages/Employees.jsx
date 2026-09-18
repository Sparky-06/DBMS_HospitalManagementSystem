import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../api/employees';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    emp_id: '', fname: '', mname: '', lname: '', city: '', state: '', dob: '', salary: '', mob_no: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getEmployees();
      setEmployees(res.data || []);
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
    setFormData({ emp_id: '', fname: '', mname: '', lname: '', city: '', state: '', dob: '', salary: '', mob_no: '' });
    setIsModalOpen(true);
  };

  const openEdit = (row) => {
    setIsEditing(true);
    setFormData({
      ...row,
      mob_no: row.mob_no?.join(', ') || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        mob_no: formData.mob_no ? formData.mob_no.split(',').map(s => s.trim()) : []
      };
      if (isEditing) {
        await updateEmployee(formData.emp_id, payload);
      } else {
        await createEmployee(payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.error?.message || 'Error saving employee');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEmployee(selectedItem.emp_id);
      fetchData();
    } catch (err) {
      alert(err.error?.message || 'Error deleting employee');
    }
  };

  const columns = [
    { field: 'emp_id', label: 'ID' },
    { label: 'Name', render: (row) => `${row.fname} ${row.mname ? row.mname + ' ' : ''}${row.lname}` },
    { label: 'Address', render: (row) => `${row.city}, ${row.state}` },
    { field: 'salary', label: 'Salary (₹)' }
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Employees</h1>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> Add Employee
        </button>
      </div>

      <div className="card">
        {loading ? <p>Loading...</p> : (
          <DataTable 
            columns={columns} 
            data={employees} 
            keyField="emp_id"
            onEdit={openEdit}
            onDelete={(row) => { setSelectedItem(row); setIsDeleteOpen(true); }}
          />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Edit Employee' : 'Add Employee'}>
        <form onSubmit={handleSave}>
          <FormField label="Employee ID" name="emp_id" value={formData.emp_id} onChange={handleInputChange} required />
          <div className="flex-row">
            <FormField label="First Name" name="fname" value={formData.fname} onChange={handleInputChange} required />
            <FormField label="Last Name" name="lname" value={formData.lname} onChange={handleInputChange} required />
          </div>
          <div className="flex-row">
            <FormField label="City" name="city" value={formData.city} onChange={handleInputChange} required />
            <FormField label="State" name="state" value={formData.state} onChange={handleInputChange} required />
          </div>
          <div className="flex-row">
            <FormField label="DOB" name="dob" type="date" value={formData.dob} onChange={handleInputChange} required />
            <FormField label="Salary" name="salary" type="number" value={formData.salary} onChange={handleInputChange} required />
          </div>
          <FormField label="Mobile No (comma separated)" name="mob_no" value={formData.mob_no} onChange={handleInputChange} />
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Employee</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Employee"
        message="Are you sure you want to delete this employee?"
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Employees;
