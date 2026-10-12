import React, { useState, useEffect } from 'react';
import { Plus, Stethoscope, Award, Building, User } from 'lucide-react';
import { getDoctors, createDoctor, updateDoctor, deleteDoctor } from '../api/doctors';
import { getEmployees } from '../api/employees';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import { useDemo } from '../context/DemoContext';
import { useToast } from '../context/ToastContext';

const Doctors = () => {
  const { isDemoMode, mockData, setMockData } = useDemo();
  const { showSuccess, showError } = useToast();

  const [doctors, setDoctors] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    emp_id: '', department: 'Cardiology', qualification: ''
  });

  const fetchData = async () => {
    setLoading(true);
    if (isDemoMode) {
      const enriched = mockData.doctors.map(d => {
        const emp = mockData.employees.find(e => e.emp_id === d.emp_id);
        return {
          ...d,
          doctor_name: emp ? `Dr. ${emp.fname} ${emp.lname}` : d.emp_id,
          city: emp ? emp.city : '',
          state: emp ? emp.state : '',
          salary: emp ? emp.salary : ''
        };
      });
      setDoctors(enriched);
      setEmployees(mockData.employees);
      setLoading(false);
      return;
    }

    try {
      const [docsRes, empRes] = await Promise.all([
        getDoctors(), 
        getEmployees().catch(() => ({ data: [] }))
      ]);

      const empMap = {};
      (empRes.data || []).forEach(e => { empMap[e.emp_id] = e; });

      const enriched = (docsRes.data || []).map(d => {
        const emp = empMap[d.emp_id];
        return {
          ...d,
          doctor_name: emp ? `Dr. ${emp.fname} ${emp.lname}` : d.emp_id,
          city: emp ? emp.city : '',
          state: emp ? emp.state : '',
          salary: emp ? emp.salary : ''
        };
      });

      setDoctors(enriched);
      setEmployees(empRes.data || []);
    } catch (err) {
      console.error(err);
      showError('Failed to fetch doctor specialists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isDemoMode, mockData.doctors]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openAdd = () => {
    setIsEditing(false);
    // Suggest first unassigned employee if available
    const assignedIds = new Set(doctors.map(d => d.emp_id));
    const unassigned = employees.find(e => !assignedIds.has(e.emp_id));
    setFormData({ emp_id: unassigned ? unassigned.emp_id : '', department: 'Cardiology', qualification: 'MBBS, MD' });
    setIsModalOpen(true);
  };

  const openEdit = (row) => {
    setIsEditing(true);
    setFormData({
      emp_id: row.emp_id,
      department: row.department,
      qualification: row.qualification
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isDemoMode) {
      if (isEditing) {
        setMockData(prev => ({
          ...prev,
          doctors: prev.doctors.map(d => d.emp_id === formData.emp_id ? formData : d)
        }));
        showSuccess('Doctor credentials updated');
      } else {
        setMockData(prev => ({
          ...prev,
          doctors: [formData, ...prev.doctors]
        }));
        showSuccess('Doctor registered successfully');
      }
      setIsModalOpen(false);
      return;
    }

    try {
      if (isEditing) {
        await updateDoctor(formData.emp_id, formData);
        showSuccess('Doctor updated');
      } else {
        await createDoctor(formData);
        showSuccess('Doctor created');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      showError(err.error?.message || 'Error saving doctor');
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    if (isDemoMode) {
      setMockData(prev => ({
        ...prev,
        doctors: prev.doctors.filter(d => d.emp_id !== selectedItem.emp_id)
      }));
      showSuccess('Doctor removed');
      return;
    }

    try {
      await deleteDoctor(selectedItem.emp_id);
      showSuccess('Doctor removed');
      fetchData();
    } catch (err) {
      showError(err.error?.message || 'Error deleting doctor');
    }
  };

  const columns = [
    { 
      label: 'Doctor Specialist', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: '#e0f2fe',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.825rem'
          }}>
            MD
          </div>
          <div>
            <strong>{row.doctor_name}</strong>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Emp ID: {row.emp_id}</div>
          </div>
        </div>
      )
    },
    { 
      label: 'Department', 
      render: (row) => <span className="badge badge-primary">{row.department}</span>
    },
    { 
      label: 'Medical Qualification', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Award size={15} color="#0d9488" />
          <span>{row.qualification}</span>
        </div>
      )
    },
    {
      label: 'Specialization Model',
      render: () => (
        <span className="badge badge-outline" title="Inherits Emp_ID from EMPLOYEE (Disjoint/Partial Specialization)">
          ISA Employee
        </span>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div className="header-titles">
          <h1>Medical Doctors & Specialists</h1>
          <p>Employee specialization (Employee ISA Doctor with Department and Qualification)</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> Add Doctor
        </button>
      </div>

      <div className="card">
        {loading ? <p>Loading doctor specialists...</p> : (
          <DataTable 
            columns={columns} 
            data={doctors} 
            keyField="emp_id"
            searchPlaceholder="Search doctors by name, ID, department, qualification..."
            onEdit={openEdit}
            onDelete={(row) => { setSelectedItem(row); setIsDeleteOpen(true); }}
          />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Edit Doctor Details' : 'Designate Doctor from Employee'}>
        <form onSubmit={handleSave}>
          <FormField 
            label="Select Hospital Employee (Inherits Emp_ID)" 
            name="emp_id" 
            type="select"
            options={employees.map(e => ({ value: e.emp_id, label: `${e.fname} ${e.lname} (${e.emp_id})` }))}
            value={formData.emp_id} 
            onChange={handleInputChange} 
            required 
            disabled={isEditing}
          />
          <FormField 
            label="Department" 
            name="department" 
            type="select"
            options={[
              { value: 'Cardiology', label: 'Cardiology' },
              { value: 'Neurology', label: 'Neurology' },
              { value: 'Orthopedics', label: 'Orthopedics' },
              { value: 'Pediatrics', label: 'Pediatrics' },
              { value: 'General Medicine', label: 'General Medicine' },
              { value: 'Oncology', label: 'Oncology' }
            ]}
            value={formData.department} 
            onChange={handleInputChange} 
            required 
          />
          <FormField 
            label="Medical Qualification" 
            name="qualification" 
            value={formData.qualification} 
            onChange={handleInputChange} 
            placeholder="e.g. MBBS, MD (Cardiology), FRCS"
            required 
          />
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{isEditing ? 'Save Changes' : 'Designate Doctor'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Remove Doctor Specialization"
        message={`Are you sure you want to remove Doctor specialization for ${selectedItem?.doctor_name}? The base employee record will be retained.`}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Doctors;
