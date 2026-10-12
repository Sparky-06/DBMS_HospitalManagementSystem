import React, { useState, useEffect } from 'react';
import { Plus, BedDouble, User, Building2 } from 'lucide-react';
import { getAssignments, createAssignment, deleteAssignment } from '../api/assignments';
import { getPatients } from '../api/patients';
import { getRooms } from '../api/rooms';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import { useDemo } from '../context/DemoContext';
import { useToast } from '../context/ToastContext';

const Assignments = () => {
  const { isDemoMode, mockData, setMockData } = useDemo();
  const { showSuccess, showError } = useToast();

  const [assignments, setAssignments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [formData, setFormData] = useState({ p_id: '', r_id: '' });

  const fetchData = async () => {
    setLoading(true);
    if (isDemoMode) {
      const enriched = mockData.assignments.map(a => {
        const p = mockData.patients.find(pt => pt.p_id === a.p_id);
        const r = mockData.rooms.find(rm => rm.r_id === a.r_id);
        return {
          ...a,
          patient_name: p ? `${p.fname} ${p.lname}` : a.p_id,
          room_type: r ? r.type : 'General',
          capacity: r ? r.capacity : 'N/A'
        };
      });
      setAssignments(enriched);
      setPatients(mockData.patients);
      setRooms(mockData.rooms);
      setLoading(false);
      return;
    }

    try {
      const [asnRes, ptsRes, rmsRes] = await Promise.all([
        getAssignments(), 
        getPatients().catch(() => ({ data: [] })), 
        getRooms().catch(() => ({ data: [] }))
      ]);

      const ptMap = {};
      (ptsRes.data || []).forEach(p => { ptMap[p.p_id] = p; });
      const rmMap = {};
      (rmsRes.data || []).forEach(r => { rmMap[r.r_id] = r; });

      const enriched = (asnRes.data || []).map(a => ({
        ...a,
        patient_name: ptMap[a.p_id] ? `${ptMap[a.p_id].fname} ${ptMap[a.p_id].lname}` : a.p_id,
        room_type: rmMap[a.r_id]?.type || 'General',
        capacity: rmMap[a.r_id]?.capacity || 'N/A'
      }));

      setAssignments(enriched);
      setPatients(ptsRes.data || []);
      setRooms(rmsRes.data || []);
    } catch (err) {
      console.error(err);
      showError('Failed to fetch room assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isDemoMode, mockData.assignments]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (isDemoMode) {
      setMockData(prev => ({
        ...prev,
        assignments: [formData, ...prev.assignments]
      }));
      showSuccess(`Patient ${formData.p_id} assigned to Room ${formData.r_id}`);
      setIsModalOpen(false);
      setFormData({ p_id: '', r_id: '' });
      return;
    }

    try {
      await createAssignment(formData);
      showSuccess('Room assigned successfully');
      setIsModalOpen(false);
      setFormData({ p_id: '', r_id: '' });
      fetchData();
    } catch (err) {
      showError(err.error?.message || 'Error assigning room');
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    if (isDemoMode) {
      setMockData(prev => ({
        ...prev,
        assignments: prev.assignments.filter(a => !(a.p_id === selectedItem.p_id && a.r_id === selectedItem.r_id))
      }));
      showSuccess('Patient discharged from room');
      return;
    }

    try {
      await deleteAssignment(selectedItem.p_id, selectedItem.r_id);
      showSuccess('Room allocation removed');
      fetchData();
    } catch (err) {
      showError(err.error?.message || 'Error deleting assignment');
    }
  };

  const columns = [
    { 
      label: 'Patient', 
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
            PT
          </div>
          <div>
            <strong>{row.patient_name}</strong>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {row.p_id}</div>
          </div>
        </div>
      )
    },
    { 
      label: 'Assigned Ward & Room', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BedDouble size={18} color="#0284c7" />
          <div>
            <strong className="font-mono">Room {row.r_id}</strong>
            <span className="badge badge-primary" style={{ marginLeft: '6px' }}>{row.room_type}</span>
          </div>
        </div>
      )
    },
    { 
      label: 'Capacity', 
      render: (row) => <span>{row.capacity} Bed(s)</span>
    },
    {
      label: 'Status',
      render: () => <span className="badge badge-success">Currently Admitted</span>
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div className="header-titles">
          <h1>Inpatient Room Assignments</h1>
          <p>N:1 relationship allocating patients to designated hospital rooms</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Allocate Room
        </button>
      </div>

      <div className="card">
        {loading ? <p>Loading room allocations...</p> : (
          <DataTable 
            columns={columns} 
            data={assignments} 
            keyField={(row) => `${row.p_id}-${row.r_id}`}
            searchPlaceholder="Search by patient name, ID, or room..."
            onDelete={(row) => { setSelectedItem(row); setIsDeleteOpen(true); }}
          />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Assign Room to Patient">
        <form onSubmit={handleCreate}>
          <FormField 
            label="Inpatient" 
            name="p_id" 
            type="select"
            options={patients.map(p => ({ value: p.p_id, label: `${p.p_id} - ${p.fname} ${p.lname}` }))}
            value={formData.p_id} 
            onChange={(e) => setFormData({ ...formData, p_id: e.target.value })} 
            required 
          />
          <FormField 
            label="Target Hospital Room" 
            name="r_id" 
            type="select"
            options={rooms.map(r => ({ value: r.r_id, label: `${r.r_id} (${r.type} - Cap: ${r.capacity})` }))}
            value={formData.r_id} 
            onChange={(e) => setFormData({ ...formData, r_id: e.target.value })} 
            required 
          />
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Confirm Allocation</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Discharge / Remove Allocation"
        message={`Are you sure you want to remove patient ${selectedItem?.patient_name} from Room ${selectedItem?.r_id}?`}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Assignments;
