import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { getPatients, createPatient, deletePatient } from '../api/patients';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
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
    try {
      const res = await getPatients();
      setPatients(res.data || []);
    } catch (err) {
      console.error(err);
      alert('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        phones: formData.phones ? formData.phones.split(',').map(s => s.trim()) : [],
        allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()) : []
      };
      await createPatient(payload);
      setIsModalOpen(false);
      setFormData({
        p_id: '', fname: '', mname: '', lname: '', gender: 'Male', dob: '', phones: '', allergies: ''
      });
      fetchPatients();
    } catch (err) {
      alert(err.error?.message || 'Error creating patient');
    }
  };

  const handleDelete = async () => {
    try {
      await deletePatient(selectedPatient.p_id);
      fetchPatients();
    } catch (err) {
      alert(err.error?.message || 'Error deleting patient');
    }
  };

  const columns = [
    { field: 'p_id', label: 'Patient ID' },
    { 
      label: 'Name', 
      render: (row) => (
        <Link to={`/patients/${row.p_id}`} className="text-primary font-medium">
          {`${row.fname} ${row.mname ? row.mname + ' ' : ''}${row.lname}`}
        </Link>
      )
    },
    { field: 'gender', label: 'Gender' },
    { 
      label: 'DOB', 
      render: (row) => new Date(row.dob).toLocaleDateString()
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Patients</h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Add Patient
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <DataTable 
            columns={columns} 
            data={patients} 
            keyField="p_id"
            onDelete={(row) => {
              setSelectedPatient(row);
              setIsDeleteOpen(true);
            }}
          />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Patient">
        <form onSubmit={handleCreate}>
          <FormField label="Patient ID" name="p_id" value={formData.p_id} onChange={handleInputChange} required />
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
            <FormField label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleInputChange} required />
          </div>
          <FormField label="Phones (comma separated)" name="phones" value={formData.phones} onChange={handleInputChange} />
          <FormField label="Allergies (comma separated)" name="allergies" value={formData.allergies} onChange={handleInputChange} />
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Patient</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Patient"
        message={`Are you sure you want to delete ${selectedPatient?.fname} ${selectedPatient?.lname}? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Patients;
