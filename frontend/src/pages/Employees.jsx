import React, { useState, useEffect } from 'react';
import { Plus, Briefcase, Phone, MapPin, DollarSign } from 'lucide-react';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../api/employees';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import { useDemo } from '../context/DemoContext';
import { useToast } from '../context/ToastContext';
import { calculateAge } from './Patients';

const Employees = () => {
  const { isDemoMode, mockData, setMockData } = useDemo();
  const { showSuccess, showError } = useToast();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    emp_id: '', fname: '', mname: '', lname: '', city: '', state: 'Tamil Nadu', dob: '1990-01-01', salary: 50000, mob_no: ''
  });

  const fetchData = async () => {
    setLoading(true);
    if (isDemoMode) {
      setEmployees(mockData.employees || []);
      setLoading(false);
      return;
    }

    try {
      const res = await getEmployees();
      setEmployees(res.data || []);
    } catch (err) {
      console.error(err);
      showError('Failed to fetch employees from backend.');
      setEmployees(mockData.employees || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isDemoMode, mockData.employees]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openAdd = () => {
    setIsEditing(false);
    setFormData({
      emp_id: `E0${employees.length + 1 < 10 ? '0' : ''}${employees.length + 1}`,
      fname: '',
      mname: '',
      lname: '',
      city: 'Chennai',
      state: 'Tamil Nadu',
      dob: '1992-05-15',
      salary: 55000,
      mob_no: ''
    });
    setIsModalOpen(true);
  };

  const openEdit = (row) => {
    setIsEditing(true);
    setSelectedItem(row);
    setFormData({
      emp_id: row.emp_id,
      fname: row.fname,
      mname: row.mname || '',
      lname: row.lname,
      city: row.city,
      state: row.state,
      dob: row.dob ? row.dob.split('T')[0] : '',
      salary: row.salary,
      mob_no: Array.isArray(row.mob_no) ? row.mob_no.join(', ') : ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      salary: Number(formData.salary),
      mob_no: formData.mob_no ? formData.mob_no.split(',').map(s => s.trim()).filter(Boolean) : []
    };

    if (isDemoMode) {
      if (isEditing) {
        setMockData(prev => ({
          ...prev,
          employees: prev.employees.map(emp => emp.emp_id === formData.emp_id ? payload : emp)
        }));
        showSuccess(`Employee ${payload.fname} ${payload.lname} updated`);
      } else {
        setMockData(prev => ({
          ...prev,
          employees: [payload, ...prev.employees]
        }));
        showSuccess(`Employee ${payload.fname} added`);
      }
      setIsModalOpen(false);
      return;
    }

    try {
      if (isEditing) {
        await updateEmployee(formData.emp_id, payload);
        showSuccess('Employee updated');
      } else {
        await createEmployee(payload);
        showSuccess('Employee created');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      showError(err.error?.message || 'Error saving employee');
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    if (isDemoMode) {
      setMockData(prev => ({
        ...prev,
        employees: prev.employees.filter(emp => emp.emp_id !== selectedItem.emp_id)
      }));
      showSuccess(`Employee ${selectedItem.emp_id} deleted`);
      return;
    }

    try {
      await deleteEmployee(selectedItem.emp_id);
      showSuccess('Employee deleted');
      fetchData();
    } catch (err) {
      showError(err.error?.message || 'Error deleting employee');
    }
  };

  const columns = [
    { 
      label: 'Emp ID', 
      width: '95px',
      render: (row) => (
        <span className="badge badge-primary font-mono font-bold">
          {row.emp_id}
        </span>
      )
    },
    { 
      label: 'Employee Name', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#e0f2fe',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.8rem'
          }}>
            {row.fname[0]}{(row.lname ? row.lname[0] : '')}
          </div>
          <div>
            <strong>{row.fname} {row.mname ? row.mname + ' ' : ''}{row.lname}</strong>
          </div>
        </div>
      )
    },
    { 
      label: 'Address (City, State)', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={14} color="#64748b" />
          <span>{row.city}, {row.state}</span>
        </div>
      )
    },
    { 
      label: 'DOB & Derived Age', 
      render: (row) => {
        const age = calculateAge(row.dob);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{row.dob ? new Date(row.dob).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
            {age !== '' && <span className="badge badge-primary">{age} yrs</span>}
          </div>
        );
      }
    },
    { 
      label: 'Monthly Salary', 
      render: (row) => (
        <span className="badge badge-teal" style={{ fontWeight: 700 }}>
          ₹{Number(row.salary).toLocaleString('en-IN')}
        </span>
      )
    },
    {
      label: 'Mobile No (Multivalued)',
      render: (row) => (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {row.mob_no && row.mob_no.length > 0 ? (
            row.mob_no.map((m, i) => (
              <span key={i} className="badge badge-outline" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                <Phone size={11} style={{ marginRight: '3px' }} />
                {m}
              </span>
            ))
          ) : (
            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>None</span>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div className="header-titles">
          <h1>Hospital Employees & Workforce</h1>
          <p>Core EMPLOYEE entity with composite Name/Address, multivalued mobile numbers, and derived Age</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> Add Employee
        </button>
      </div>

      <div className="card">
        {loading ? <p>Loading employee directory...</p> : (
          <DataTable 
            columns={columns} 
            data={employees} 
            keyField="emp_id"
            searchPlaceholder="Search employees by name, ID, city, or phone..."
            onEdit={openEdit}
            onDelete={(row) => { setSelectedItem(row); setIsDeleteOpen(true); }}
          />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Edit Employee Details' : 'Register New Employee'}>
        <form onSubmit={handleSave}>
          <FormField 
            label="Employee ID (Emp_ID)" 
            name="emp_id" 
            value={formData.emp_id} 
            onChange={handleInputChange} 
            required 
            disabled={isEditing}
          />
          <div className="flex-row">
            <FormField label="First Name" name="fname" value={formData.fname} onChange={handleInputChange} required />
            <FormField label="Middle Name" name="mname" value={formData.mname} onChange={handleInputChange} />
            <FormField label="Last Name" name="lname" value={formData.lname} onChange={handleInputChange} required />
          </div>
          <div className="flex-row">
            <FormField label="City" name="city" value={formData.city} onChange={handleInputChange} required />
            <FormField label="State" name="state" value={formData.state} onChange={handleInputChange} required />
          </div>
          <div className="flex-row">
            <FormField label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleInputChange} required />
            <FormField label="Monthly Salary (₹)" name="salary" type="number" value={formData.salary} onChange={handleInputChange} required />
          </div>
          <FormField 
            label="Mobile Numbers (Multivalued, comma separated)" 
            name="mob_no" 
            value={formData.mob_no} 
            onChange={handleInputChange} 
            placeholder="e.g. 9876543210, 9876543211"
          />
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{isEditing ? 'Save Changes' : 'Register Employee'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Employee"
        message={`Are you sure you want to delete employee ${selectedItem?.fname} ${selectedItem?.lname}? This may affect linked Doctor or Nurse roles.`}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Employees;
