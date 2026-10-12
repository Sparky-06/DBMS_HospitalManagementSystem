import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, Stethoscope, User, Search, Filter } from 'lucide-react';
import { getConsultations, createConsultation, deleteConsultation } from '../api/consultations';
import { getPatients } from '../api/patients';
import { getDoctors } from '../api/doctors';
import { getEmployees } from '../api/employees';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import { useDemo } from '../context/DemoContext';
import { useToast } from '../context/ToastContext';

const Consultations = () => {
  const { isDemoMode, mockData, setMockData } = useDemo();
  const { showSuccess, showError } = useToast();

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
    consultation_time: '10:00:00'
  });

  const fetchData = async () => {
    setLoading(true);
    if (isDemoMode) {
      const docList = mockData.doctors.map(d => {
        const emp = mockData.employees.find(e => e.emp_id === d.emp_id);
        return {
          ...d,
          doctor_name: emp ? `Dr. ${emp.fname} ${emp.lname}` : d.emp_id
        };
      });

      const consList = mockData.consultations.map(c => {
        const doc = docList.find(d => d.emp_id === c.emp_id);
        const pat = mockData.patients.find(p => p.p_id === c.p_id);
        return {
          ...c,
          doctor_name: doc ? doc.doctor_name : c.emp_id,
          department: doc ? doc.department : 'General',
          patient_name: pat ? `${pat.fname} ${pat.lname}` : c.p_id
        };
      });

      setDoctors(docList);
      setPatients(mockData.patients);
      setConsultations(consList);
      setLoading(false);
      return;
    }

    try {
      const [consRes, ptsRes, docsRes, empRes] = await Promise.all([
        getConsultations(),
        getPatients().catch(() => ({ data: [] })),
        getDoctors().catch(() => ({ data: [] })),
        getEmployees().catch(() => ({ data: [] }))
      ]);

      const empMap = {};
      (empRes.data || []).forEach(e => { empMap[e.emp_id] = e; });

      const docList = (docsRes.data || []).map(d => ({
        ...d,
        doctor_name: empMap[d.emp_id] ? `Dr. ${empMap[d.emp_id].fname} ${empMap[d.emp_id].lname}` : d.emp_id
      }));

      const patMap = {};
      (ptsRes.data || []).forEach(p => { patMap[p.p_id] = p; });

      const consList = (consRes.data || []).map(c => {
        const doc = docList.find(d => d.emp_id === c.emp_id);
        const pat = patMap[c.p_id];
        return {
          ...c,
          doctor_name: doc ? doc.doctor_name : c.emp_id,
          department: doc ? doc.department : 'General',
          patient_name: pat ? `${pat.fname} ${pat.lname}` : c.p_id
        };
      });

      setDoctors(docList);
      setPatients(ptsRes.data || []);
      setConsultations(consList);
    } catch (err) {
      console.error(err);
      showError('Failed to fetch consultations from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isDemoMode, mockData.consultations]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    let time = formData.consultation_time;
    if (time.length === 5) time += ':00';

    const payload = { ...formData, consultation_time: time };

    if (isDemoMode) {
      setMockData(prev => ({
        ...prev,
        consultations: [payload, ...prev.consultations]
      }));
      showSuccess('Consultation appointment successfully scheduled');
      setIsModalOpen(false);
      setFormData({ emp_id: '', p_id: '', consultation_date: '', consultation_time: '10:00:00' });
      return;
    }

    try {
      await createConsultation(payload);
      showSuccess('Appointment scheduled successfully');
      setIsModalOpen(false);
      setFormData({ emp_id: '', p_id: '', consultation_date: '', consultation_time: '10:00:00' });
      fetchData();
    } catch (err) {
      showError(err.error?.message || 'Error booking consultation');
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    const dateStr = selectedItem.consultation_date.includes('T') 
      ? selectedItem.consultation_date.split('T')[0] 
      : selectedItem.consultation_date;

    if (isDemoMode) {
      setMockData(prev => ({
        ...prev,
        consultations: prev.consultations.filter(c => !(
          c.emp_id === selectedItem.emp_id &&
          c.p_id === selectedItem.p_id &&
          c.consultation_date === dateStr &&
          c.consultation_time === selectedItem.consultation_time
        ))
      }));
      showSuccess('Appointment cancelled');
      return;
    }

    try {
      await deleteConsultation(selectedItem.emp_id, selectedItem.p_id, dateStr, selectedItem.consultation_time);
      showSuccess('Appointment cancelled');
      fetchData();
    } catch (err) {
      showError(err.error?.message || 'Error cancelling appointment');
    }
  };

  const columns = [
    { 
      label: 'Doctor Specialist', 
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
            DR
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
      label: 'Patient', 
      render: (row) => (
        <div>
          <strong>{row.patient_name}</strong>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>P_ID: {row.p_id}</div>
        </div>
      )
    },
    { 
      label: 'Date', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={14} color="#0284c7" />
          <span>{new Date(row.consultation_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      )
    },
    { 
      label: 'Time Slot', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={14} color="#d97706" />
          <span className="badge badge-warning">{row.consultation_time}</span>
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div className="header-titles">
          <h1>Consultation & Appointments</h1>
          <p>M:N Relationship between Doctors and Patients with scheduled date and time</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Schedule Appointment
        </button>
      </div>

      <div className="card">
        {loading ? <p>Loading appointments...</p> : (
          <DataTable 
            columns={columns} 
            data={consultations} 
            keyField={(row) => `${row.emp_id}-${row.p_id}-${row.consultation_date}-${row.consultation_time}`}
            searchPlaceholder="Search by doctor, patient, date, or department..."
            onDelete={(row) => { setSelectedItem(row); setIsDeleteOpen(true); }}
          />
        )}
      </div>

      {/* Schedule Consultation Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Doctor Consultation">
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
            label="Doctor Specialist" 
            name="emp_id" 
            type="select"
            options={doctors.map(d => ({ value: d.emp_id, label: `${d.doctor_name || d.emp_id} (${d.department})` }))}
            value={formData.emp_id} 
            onChange={handleInputChange} 
            required 
          />
          <div className="flex-row">
            <FormField 
              label="Consultation Date" 
              name="consultation_date" 
              type="date" 
              value={formData.consultation_date} 
              onChange={handleInputChange} 
              required 
            />
            <FormField 
              label="Consultation Time" 
              name="consultation_time" 
              type="time" 
              value={formData.consultation_time} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Book Consultation</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Cancel Appointment"
        message={`Are you sure you want to cancel the appointment with ${selectedItem?.doctor_name} for ${selectedItem?.patient_name}?`}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Consultations;
