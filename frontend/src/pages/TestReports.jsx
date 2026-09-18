import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { getTestReports, createTestReport, deleteTestReport } from '../api/testReports';
import { getPatients } from '../api/patients';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';

const TestReports = () => {
  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [formData, setFormData] = useState({ p_id: '', test_id: '', test_type: '', result: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, pRes] = await Promise.all([getTestReports(), getPatients()]);
      setReports(rRes.data || []);
      setPatients(pRes.data || []);
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
      await createTestReport(formData.p_id, formData);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.error?.message || 'Error creating test report');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTestReport(selectedItem.p_id, selectedItem.test_id);
      fetchData();
    } catch (err) {
      alert(err.error?.message || 'Error deleting test report');
    }
  };

  const columns = [
    { field: 'test_id', label: 'Test ID' },
    { field: 'p_id', label: 'Patient ID' },
    { field: 'test_type', label: 'Test Type' },
    { field: 'result', label: 'Result' }
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Test Reports</h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Add Report
        </button>
      </div>

      <div className="card">
        {loading ? <p>Loading...</p> : (
          <DataTable 
            columns={columns} 
            data={reports} 
            keyField={(row) => `${row.p_id}-${row.test_id}`}
            onDelete={(row) => { setSelectedItem(row); setIsDeleteOpen(true); }}
          />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Test Report">
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
          <FormField label="Test ID" name="test_id" value={formData.test_id} onChange={handleInputChange} required />
          <FormField label="Test Type" name="test_type" value={formData.test_type} onChange={handleInputChange} required />
          <FormField label="Result" name="result" type="textarea" value={formData.result} onChange={handleInputChange} required />
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Report</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Test Report"
        message="Are you sure you want to delete this report?"
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default TestReports;
