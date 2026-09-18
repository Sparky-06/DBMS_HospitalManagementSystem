import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { getConsultations, createConsultation, deleteConsultation } from '../api/consultations';
import { getPatients } from '../api/patients';
import { getDoctors } from '../api/doctors';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';

const Consultations = () => {
  const [consultations, setConsultations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [formData, setFormData] = useState({
    emp_id: '',
    p_id: '',
    consultation_date: '',
    consultation_time: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [consRes, ptsRes, docsRes] = await Promise.all([
        getConsultations(),
        getPatients(),
        getDoctors()
      ]);
      setConsultations(consRes.data || []);
      setPatients(ptsRes.data || []);
      setDoctors(docsRes.data || []);
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
      // time might need seconds added depending on how user inputs it
      let time = formData.consultation_time;
      if (time.length === 5) time += ':00';
      
      await createConsultation({ ...formData, consultation_time: time });
      setIsModalOpen(false);
      setFormData({ emp_id: '', p_id: '', consultation_date: '', consultation_time: '' });
      fetchData();
    } catch (err) {
      alert(err.error?.message || 'Error creating consultation');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteConsultation(selectedItem.emp_id, selectedItem.p_id, selectedItem.consultation_date.split('T')[0], selectedItem.consultation_time);
      fetchData();
    } catch (err) {
      alert(err.error?.message || 'Error deleting consultation');
    }
  };

  const columns = [
    { field: 'emp_id', label: 'Doctor ID' },
    { field: 'p_id', label: 'Patient ID' },
    { label: 'Date', render: (row) => new Date(row.consultation_date).toLocaleDateString() },
    { field: 'consultation_time', label: 'Time' }
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Appointments & Consultations</h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Schedule Appointment
        </button>
      </div>

      <div className="card">
        {loading ? <p>Loading...</p> : (
          <DataTable 
            columns={columns} 
            data={consultations} 
            keyField={(row) => `${row.emp_id}-${row.p_id}-${row.consultation_date}-${row.consultation_time}`}
            onDelete={(row) => { setSelectedItem(row); setIsDeleteOpen(true); }}
          />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Appointment">
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
          <FormField 
            label="Doctor" 
            name="emp_id" 
            type="select"
            options={doctors.map(d => ({ value: d.emp_id, label: `${d.emp_id} - ${d.department}` }))}
            value={formData.emp_id} 
            onChange={handleInputChange} 
            required 
          />
          <div className="flex-row">
            <FormField label="Date" name="consultation_date" type="date" value={formData.consultation_date} onChange={handleInputChange} required />
            <FormField label="Time" name="consultation_time" type="time" value={formData.consultation_time} onChange={handleInputChange} required />
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Schedule</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment?"
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Consultations;
