import React, { useState, useEffect } from 'react';
import { Plus, UserRound, Clock, ShieldCheck } from 'lucide-react';
import { getNurses, createNurse, deleteNurse } from '../api/nurses';
import { getEmployees } from '../api/employees';
import { getGoverns } from '../api/governs';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import { useDemo } from '../context/DemoContext';
import { useToast } from '../context/ToastContext';

const Nurses = () => {
  const { isDemoMode, mockData, setMockData } = useDemo();
  const { showSuccess, showError } = useToast();

  const [nurses, setNurses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [formData, setFormData] = useState({ emp_id: '' });

  const fetchData = async () => {
    setLoading(true);
    if (isDemoMode) {
      const enriched = mockData.nurses.map(n => {
        const emp = mockData.employees.find(e => e.emp_id === n.emp_id);
        const shiftCount = mockData.governs.filter(g => g.emp_id === n.emp_id).length;
        return {
          ...n,
          name: emp ? `${emp.fname} ${emp.lname}` : n.emp_id,
          city: emp ? emp.city : '',
          state: emp ? emp.state : '',
          shiftCount
        };
      });
      setNurses(enriched);
      setEmployees(mockData.employees);
      setLoading(false);
      return;
    }

    try {
      const [nursRes, empRes, govRes] = await Promise.all([
        getNurses(), 
        getEmployees().catch(() => ({ data: [] })),
        getGoverns().catch(() => ({ data: [] }))
      ]);

      const empMap = {};
      (empRes.data || []).forEach(e => { empMap[e.emp_id] = e; });

      const enriched = (nursRes.data || []).map(n => {
        const emp = empMap[n.emp_id];
        const shiftCount = (govRes.data || []).filter(g => g.emp_id === n.emp_id).length;
        return {
          ...n,
          name: emp ? `${emp.fname} ${emp.lname}` : n.emp_id,
          city: emp ? emp.city : '',
          state: emp ? emp.state : '',
          shiftCount
        };
      });

      setNurses(enriched);
      setEmployees(empRes.data || []);
    } catch (err) {
      console.error(err);
      showError('Failed to fetch nursing staff.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isDemoMode, mockData.nurses]);

  const openAdd = () => {
    const assigned = new Set(nurses.map(n => n.emp_id));
    const available = employees.find(e => !assigned.has(e.emp_id));
    setFormData({ emp_id: available ? available.emp_id : '' });
    setIsModalOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (isDemoMode) {
      setMockData(prev => ({
        ...prev,
        nurses: [formData, ...prev.nurses]
      }));
      showSuccess(`Nurse specialization added for ${formData.emp_id}`);
      setIsModalOpen(false);
      return;
    }

    try {
      await createNurse(formData);
      showSuccess('Nurse added successfully');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      showError(err.error?.message || 'Error saving nurse');
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    if (isDemoMode) {
      setMockData(prev => ({
        ...prev,
        nurses: prev.nurses.filter(n => n.emp_id !== selectedItem.emp_id)
      }));
      showSuccess('Nurse specialization removed');
      return;
    }

    try {
      await deleteNurse(selectedItem.emp_id);
      showSuccess('Nurse removed');
      fetchData();
    } catch (err) {
      showError(err.error?.message || 'Error deleting nurse');
    }
  };

  const columns = [
    { 
      label: 'Staff Nurse', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: '#fce7f3',
            color: '#db2777',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.825rem'
          }}>
            RN
          </div>
          <div>
            <strong>{row.name}</strong>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Emp ID: {row.emp_id}</div>
          </div>
        </div>
      )
    },
    { 
      label: 'Specialization Model', 
      render: () => (
        <span className="badge badge-purple" title="Disjoint/Partial Specialization (Nurse inherits Emp_ID)">
          Employee ISA Nurse
        </span>
      )
    },
    { 
      label: 'Ward Shifts', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={14} color="#0d9488" />
          <span>{row.shiftCount || 0} Scheduled Duty Shift(s)</span>
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div className="header-titles">
          <h1>Nursing Staff Registry</h1>
          <p>Employee specialization (Employee ISA Nurse inheriting Emp_ID)</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> Add Nurse
        </button>
      </div>

      <div className="card">
        {loading ? <p>Loading nursing staff...</p> : (
          <DataTable 
            columns={columns} 
            data={nurses} 
            keyField="emp_id"
            searchPlaceholder="Search nurses by name or ID..."
            onDelete={(row) => { setSelectedItem(row); setIsDeleteOpen(true); }}
          />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Designate Nurse from Employee">
        <form onSubmit={handleCreate}>
          <FormField 
            label="Select Hospital Employee" 
            name="emp_id" 
            type="select"
            options={employees.map(e => ({ value: e.emp_id, label: `${e.fname} ${e.lname} (${e.emp_id})` }))}
            value={formData.emp_id} 
            onChange={(e) => setFormData({ emp_id: e.target.value })} 
            required 
          />
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Designate Nurse</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Remove Nurse Specialization"
        message={`Remove Nurse specialization for ${selectedItem?.name}? The employee record will remain in the database.`}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Nurses;
