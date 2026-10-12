import React, { useState, useEffect } from 'react';
import { Plus, FlaskConical, FileText, CheckCircle } from 'lucide-react';
import { getTestReports, createTestReport, deleteTestReport } from '../api/testReports';
import { getPatients } from '../api/patients';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import { useDemo } from '../context/DemoContext';
import { useToast } from '../context/ToastContext';

const TestReports = () => {
  const { isDemoMode, mockData, setMockData } = useDemo();
  const { showSuccess, showError } = useToast();

  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [formData, setFormData] = useState({ p_id: '', test_id: '', test_type: 'Complete Blood Count (CBC)', result: '' });

  const fetchData = async () => {
    setLoading(true);
    if (isDemoMode) {
      const enriched = mockData.testReports.map(r => {
        const p = mockData.patients.find(pt => pt.p_id === r.p_id);
        return {
          ...r,
          patient_name: p ? `${p.fname} ${p.lname}` : r.p_id
        };
      });
      setReports(enriched);
      setPatients(mockData.patients);
      setLoading(false);
      return;
    }

    try {
      const [rRes, pRes] = await Promise.all([
        getTestReports(), 
        getPatients().catch(() => ({ data: [] }))
      ]);

      const ptMap = {};
      (pRes.data || []).forEach(p => { ptMap[p.p_id] = p; });

      const enriched = (rRes.data || []).map(r => ({
        ...r,
        patient_name: ptMap[r.p_id] ? `${ptMap[r.p_id].fname} ${ptMap[r.p_id].lname}` : r.p_id
      }));

      setReports(enriched);
      setPatients(pRes.data || []);
    } catch (err) {
      console.error(err);
      showError('Failed to fetch test reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isDemoMode, mockData.testReports]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openAdd = () => {
    setFormData({
      p_id: patients[0]?.p_id || '',
      test_id: `T${Math.floor(100 + Math.random() * 900)}`,
      test_type: 'Complete Blood Count (CBC)',
      result: 'Normal physiological parameters.'
    });
    setIsModalOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (isDemoMode) {
      setMockData(prev => ({
        ...prev,
        testReports: [formData, ...prev.testReports]
      }));
      showSuccess(`Diagnostic Test ${formData.test_id} saved`);
      setIsModalOpen(false);
      return;
    }

    try {
      await createTestReport(formData.p_id, formData);
      showSuccess('Diagnostic report registered');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      showError(err.error?.message || 'Error creating test report');
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    if (isDemoMode) {
      setMockData(prev => ({
        ...prev,
        testReports: prev.testReports.filter(r => !(r.p_id === selectedItem.p_id && r.test_id === selectedItem.test_id))
      }));
      showSuccess('Diagnostic report removed');
      return;
    }

    try {
      await deleteTestReport(selectedItem.p_id, selectedItem.test_id);
      showSuccess('Test report deleted');
      fetchData();
    } catch (err) {
      showError(err.error?.message || 'Error deleting test report');
    }
  };

  const columns = [
    { 
      label: 'Test ID (Partial Key)', 
      render: (row) => (
        <span className="badge badge-primary font-mono font-bold">
          {row.test_id}
        </span>
      )
    },
    { 
      label: 'Patient', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: '#e0f2fe',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.75rem'
          }}>
            PT
          </div>
          <div>
            <strong>{row.patient_name}</strong>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>P_ID: {row.p_id}</div>
          </div>
        </div>
      )
    },
    { 
      label: 'Diagnostic Test Type', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FlaskConical size={15} color="#6366f1" />
          <span className="badge badge-purple">{row.test_type}</span>
        </div>
      )
    },
    { 
      label: 'Diagnostic Result & Findings', 
      render: (row) => <span>{row.result}</span>
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div className="header-titles">
          <h1>Diagnostic & Laboratory Reports</h1>
          <p>Weak entity: Identified by composite key (P_ID, Test_ID) where Test_ID is a partial key</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> Add Lab Report
        </button>
      </div>

      <div className="card">
        {loading ? <p>Loading laboratory reports...</p> : (
          <DataTable 
            columns={columns} 
            data={reports} 
            keyField={(row) => `${row.p_id}-${row.test_id}`}
            searchPlaceholder="Search diagnostic reports by patient, test ID, type, or findings..."
            onDelete={(row) => { setSelectedItem(row); setIsDeleteOpen(true); }}
          />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Diagnostic Lab Report">
        <form onSubmit={handleCreate}>
          <FormField 
            label="Patient (Parent Entity)" 
            name="p_id" 
            type="select"
            options={patients.map(p => ({ value: p.p_id, label: `${p.p_id} - ${p.fname} ${p.lname}` }))}
            value={formData.p_id} 
            onChange={handleInputChange} 
            required 
          />
          <FormField 
            label="Test ID (Test_ID Partial Key)" 
            name="test_id" 
            value={formData.test_id} 
            onChange={handleInputChange} 
            required 
          />
          <FormField 
            label="Diagnostic Test Type" 
            name="test_type" 
            type="select"
            options={[
              { value: 'Complete Blood Count (CBC)', label: 'Complete Blood Count (CBC)' },
              { value: 'Chest X-Ray', label: 'Chest X-Ray' },
              { value: 'MRI Brain', label: 'MRI Brain' },
              { value: 'Lipid Profile', label: 'Lipid Profile' },
              { value: 'Knee X-Ray AP/Lat', label: 'Knee X-Ray AP/Lat' },
              { value: 'ECG 12-Lead', label: 'ECG 12-Lead' },
              { value: 'Ultrasound Abdomen', label: 'Ultrasound Abdomen' }
            ]}
            value={formData.test_type} 
            onChange={handleInputChange} 
            required 
          />
          <FormField 
            label="Diagnostic Findings & Result" 
            name="result" 
            type="textarea" 
            value={formData.result} 
            onChange={handleInputChange} 
            placeholder="Clinical diagnosis and laboratory findings..."
            required 
          />
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Lab Report</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Test Report"
        message={`Delete Diagnostic Report ${selectedItem?.test_id} (${selectedItem?.test_type}) for Patient ${selectedItem?.patient_name}?`}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default TestReports;
