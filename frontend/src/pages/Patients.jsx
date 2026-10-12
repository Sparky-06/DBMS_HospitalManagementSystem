import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, User, Phone, AlertTriangle, ArrowRight, Eye, ShieldAlert } from 'lucide-react';
import { getPatients, createPatient, updatePatient, deletePatient } from '../api/patients';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import { useDemo } from '../context/DemoContext';
import { useToast } from '../context/ToastContext';

// Helper to calculate age from DOB dynamically (Age is derived, never stored!)
export const calculateAge = (dobString) => {
  if (!dobString) return '';
  const dob = new Date(dobString);
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

const Patients = () => {
  const navigate = useNavigate();
  const { isDemoMode, mockData, setMockData } = useDemo();
  const { showSuccess, showError } = useToast();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    p_id: '',
    fname: '',
    mname: '',
    lname: '',
    gender: 'Male',
    dob: '',
    phones: '',
    allergies: ''
  });

  const fetchPatients = async () => {
    setLoading(true);
    if (isDemoMode) {
      setPatients(mockData.patients || []);
      setLoading(false);
      return;
    }

    try {
      const res = await getPatients();
      setPatients(res.data || []);
    } catch (err) {
      console.error(err);
      showError(err.error?.message || 'Failed to connect to backend. Showing fallback records.');
      setPatients(mockData.patients || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [isDemoMode, mockData.patients]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAdd = () => {
    setIsEditing(false);
    setFormData({
      p_id: `P00${(patients.length + 1)}`,
      fname: '',
      mname: '',
      lname: '',
      gender: 'Male',
      dob: '2000-01-01',
      phones: '',
      allergies: ''
    });
    setIsModalOpen(true);
  };

  const openEdit = (row) => {
    setIsEditing(true);
    setSelectedPatient(row);
    setFormData({
      p_id: row.p_id,
      fname: row.fname,
      mname: row.mname || '',
      lname: row.lname,
      gender: row.gender,
      dob: row.dob ? row.dob.split('T')[0] : '',
      phones: Array.isArray(row.phones) ? row.phones.join(', ') : '',
      allergies: Array.isArray(row.allergies) ? row.allergies.join(', ') : ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      phones: formData.phones ? formData.phones.split(',').map(s => s.trim()).filter(Boolean) : [],
      allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()).filter(Boolean) : []
    };

    if (isDemoMode) {
      if (isEditing) {
        setMockData(prev => ({
          ...prev,
          patients: prev.patients.map(p => p.p_id === formData.p_id ? payload : p)
        }));
        showSuccess(`Patient ${payload.fname} ${payload.lname} updated`);
      } else {
        setMockData(prev => ({
          ...prev,
          patients: [payload, ...prev.patients]
        }));
        showSuccess(`Patient ${payload.fname} registered successfully`);
      }
      setIsModalOpen(false);
      return;
    }

    try {
      if (isEditing) {
        await updatePatient(formData.p_id, payload);
        showSuccess('Patient updated successfully');
      } else {
        await createPatient(payload);
        showSuccess('Patient registered successfully');
      }
      setIsModalOpen(false);
      fetchPatients();
    } catch (err) {
      showError(err.error?.message || 'Error processing request');
    }
  };

  const handleDelete = async () => {
    if (!selectedPatient) return;

    if (isDemoMode) {
      setMockData(prev => ({
        ...prev,
        patients: prev.patients.filter(p => p.p_id !== selectedPatient.p_id)
      }));
      showSuccess(`Patient record ${selectedPatient.p_id} removed`);
      return;
    }

    try {
      await deletePatient(selectedPatient.p_id);
      showSuccess('Patient deleted successfully');
      fetchPatients();
    } catch (err) {
      showError(err.error?.message || 'Error deleting patient');
    }
  };

  const columns = [
    { 
      label: 'ID', 
      width: '100px',
      render: (row) => (
        <span className="badge badge-primary font-mono font-bold">
          {row.p_id}
        </span>
      )
    },
    { 
      label: 'Patient Name', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: row.gender === 'Female' ? '#fce7f3' : '#e0f2fe',
            color: row.gender === 'Female' ? '#db2777' : '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
            fontWeight: 700
          }}>
            {row.fname[0]}{(row.lname ? row.lname[0] : '')}
          </div>
          <div>
            <Link 
              to={`/patients/${row.p_id}`} 
              style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="View Complete Clinical Details"
            >
              <span>{row.fname} {row.mname ? row.mname + ' ' : ''}{row.lname}</span>
              <Eye size={14} color="#0284c7" />
            </Link>
          </div>
        </div>
      )
    },
    { 
      label: 'Gender', 
      width: '110px',
      render: (row) => (
        <span className={`badge ${row.gender === 'Female' ? 'badge-purple' : 'badge-teal'}`}>
          {row.gender}
        </span>
      )
    },
    { 
      label: 'DOB & Derived Age', 
      render: (row) => {
        const age = calculateAge(row.dob);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{row.dob ? new Date(row.dob).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
            {age !== '' && <span className="badge badge-primary" title="Derived dynamically from DOB (3NF normalisation)">{age} yrs</span>}
          </div>
        );
      }
    },
    {
      label: 'Phones (Multivalued)',
      render: (row) => (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {row.phones && row.phones.length > 0 ? (
            row.phones.map((phone, i) => (
              <span key={i} className="badge badge-outline" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                <Phone size={11} style={{ marginRight: '3px' }} />
                {phone}
              </span>
            ))
          ) : (
            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>None</span>
          )}
        </div>
      )
    },
    {
      label: 'Allergies',
      render: (row) => (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {row.allergies && row.allergies.length > 0 ? (
            row.allergies.map((allergy, i) => (
              <span key={i} className="badge badge-danger">
                <ShieldAlert size={11} style={{ marginRight: '3px' }} />
                {allergy}
              </span>
            ))
          ) : (
            <span className="badge badge-success">No Known Allergies</span>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div className="header-titles">
          <h1>Patients Directory</h1>
          <p>Register, track, and manage all outpatient and inpatient hospital records</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> Register Patient
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p>Loading patient records...</p>
        ) : (
          <DataTable 
            columns={columns} 
            data={patients} 
            keyField="p_id"
            searchPlaceholder="Search by name, ID, phone, or allergy..."
            onEdit={openEdit}
            onDelete={(row) => {
              setSelectedPatient(row);
              setIsDeleteOpen(true);
            }}
          />
        )}
      </div>

      {/* Patient Add / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Edit Patient Record' : 'Register New Patient'}>
        <form onSubmit={handleSave}>
          <FormField 
            label="Patient ID (P_ID)" 
            name="p_id" 
            value={formData.p_id} 
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
            <FormField 
              label="Gender" 
              name="gender" 
              type="select" 
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' }
              ]}
              value={formData.gender} 
              onChange={handleInputChange} 
              required 
            />
            <FormField 
              label="Date of Birth" 
              name="dob" 
              type="date" 
              value={formData.dob} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          <FormField 
            label="Phone Numbers (Multivalued, comma separated)" 
            name="phones" 
            value={formData.phones} 
            onChange={handleInputChange} 
            placeholder="e.g. 9876543210, 9876543211"
          />
          <FormField 
            label="Known Allergies (Multivalued, comma separated)" 
            name="allergies" 
            value={formData.allergies} 
            onChange={handleInputChange} 
            placeholder="e.g. Penicillin, Dust, Sulfa"
          />
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{isEditing ? 'Save Changes' : 'Register Patient'}</button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Patient Record"
        message={`Are you sure you want to permanently delete patient ${selectedPatient?.fname} ${selectedPatient?.lname} (${selectedPatient?.p_id})? This will also remove associated phones and allergies per database constraints.`}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Patients;
