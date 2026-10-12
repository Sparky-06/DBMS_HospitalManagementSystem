import React, { useState, useEffect } from 'react';
import { Plus, Clock, UserRound, Building2 } from 'lucide-react';
import { getGoverns, createGovern, deleteGovern } from '../api/governs';
import { getNurses } from '../api/nurses';
import { getEmployees } from '../api/employees';
import { getRooms } from '../api/rooms';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import { useDemo } from '../context/DemoContext';
import { useToast } from '../context/ToastContext';

const Governs = () => {
  const { isDemoMode, mockData, setMockData } = useDemo();
  const { showSuccess, showError } = useToast();

  const [governs, setGoverns] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [formData, setFormData] = useState({ emp_id: '', r_id: '', shift: 'Morning' });

  const fetchData = async () => {
    setLoading(true);
    if (isDemoMode) {
      const nurseList = mockData.nurses.map(n => {
        const emp = mockData.employees.find(e => e.emp_id === n.emp_id);
        return {
          ...n,
          name: emp ? `${emp.fname} ${emp.lname}` : n.emp_id
        };
      });

      const enriched = mockData.governs.map(g => {
        const n = nurseList.find(nurse => nurse.emp_id === g.emp_id);
        const r = mockData.rooms.find(rm => rm.r_id === g.r_id);
        return {
          ...g,
          nurse_name: n ? n.name : g.emp_id,
          room_type: r ? r.type : 'General'
        };
      });

      setGoverns(enriched);
      setNurses(nurseList);
      setRooms(mockData.rooms);
      setLoading(false);
      return;
    }

    try {
      const [govRes, nursRes, empRes, rmsRes] = await Promise.all([
        getGoverns(), 
        getNurses().catch(() => ({ data: [] })), 
        getEmployees().catch(() => ({ data: [] })), 
        getRooms().catch(() => ({ data: [] }))
      ]);

      const empMap = {};
      (empRes.data || []).forEach(e => { empMap[e.emp_id] = e; });

      const nurseList = (nursRes.data || []).map(n => ({
        ...n,
        name: empMap[n.emp_id] ? `${empMap[n.emp_id].fname} ${empMap[n.emp_id].lname}` : n.emp_id
      }));

      const rmMap = {};
      (rmsRes.data || []).forEach(r => { rmMap[r.r_id] = r; });

      const enriched = (govRes.data || []).map(g => {
        const n = nurseList.find(nurse => nurse.emp_id === g.emp_id);
        return {
          ...g,
          nurse_name: n ? n.name : g.emp_id,
          room_type: rmMap[g.r_id]?.type || 'General'
        };
      });

      setGoverns(enriched);
      setNurses(nurseList);
      setRooms(rmsRes.data || []);
    } catch (err) {
      console.error(err);
      showError('Failed to fetch nurse-room shifts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isDemoMode, mockData.governs]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (isDemoMode) {
      setMockData(prev => ({
        ...prev,
        governs: [formData, ...prev.governs]
      }));
      showSuccess(`Shift assigned to Nurse ${formData.emp_id}`);
      setIsModalOpen(false);
      setFormData({ emp_id: '', r_id: '', shift: 'Morning' });
      return;
    }

    try {
      await createGovern(formData);
      showSuccess('Nurse shift schedule saved');
      setIsModalOpen(false);
      setFormData({ emp_id: '', r_id: '', shift: 'Morning' });
      fetchData();
    } catch (err) {
      showError(err.error?.message || 'Error scheduling nurse shift');
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    if (isDemoMode) {
      setMockData(prev => ({
        ...prev,
        governs: prev.governs.filter(g => !(
          g.emp_id === selectedItem.emp_id && 
          g.r_id === selectedItem.r_id && 
          g.shift === selectedItem.shift
        ))
      }));
      showSuccess('Shift assignment removed');
      return;
    }

    try {
      await deleteGovern(selectedItem.emp_id, selectedItem.r_id, selectedItem.shift);
      showSuccess('Shift assignment removed');
      fetchData();
    } catch (err) {
      showError(err.error?.message || 'Error deleting shift');
    }
  };

  const columns = [
    { 
      label: 'Staff Nurse', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#fce7f3',
            color: '#db2777',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.8rem'
          }}>
            RN
          </div>
          <div>
            <strong>{row.nurse_name}</strong>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Emp ID: {row.emp_id}</div>
          </div>
        </div>
      )
    },
    { 
      label: 'Governed Ward / Room', 
      render: (row) => (
        <div>
          <strong className="font-mono">Room {row.r_id}</strong>
          <span className="badge badge-primary" style={{ marginLeft: '6px' }}>{row.room_type}</span>
        </div>
      )
    },
    { 
      label: 'Scheduled Shift', 
      render: (row) => {
        let badgeClass = 'badge-teal';
        if (row.shift === 'Evening') badgeClass = 'badge-warning';
        if (row.shift === 'Night') badgeClass = 'badge-purple';

        return (
          <span className={`badge ${badgeClass}`}>
            <Clock size={13} style={{ marginRight: '4px' }} />
            {row.shift} Shift
          </span>
        );
      }
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div className="header-titles">
          <h1>Nurse-Room Duty Shifts</h1>
          <p>Governs relationship (Nurse M:N Room with atomic Shift attribute)</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Schedule Duty Shift
        </button>
      </div>

      <div className="card">
        {loading ? <p>Loading duty schedules...</p> : (
          <DataTable 
            columns={columns} 
            data={governs} 
            keyField={(row) => `${row.emp_id}-${row.r_id}-${row.shift}`}
            searchPlaceholder="Search shifts by nurse, room, or shift type..."
            onDelete={(row) => { setSelectedItem(row); setIsDeleteOpen(true); }}
          />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Assign Nurse Duty Shift">
        <form onSubmit={handleCreate}>
          <FormField 
            label="Staff Nurse" 
            name="emp_id" 
            type="select"
            options={nurses.map(n => ({ value: n.emp_id, label: `${n.name} (${n.emp_id})` }))}
            value={formData.emp_id} 
            onChange={(e) => setFormData({ ...formData, emp_id: e.target.value })} 
            required 
          />
          <FormField 
            label="Ward / Hospital Room" 
            name="r_id" 
            type="select"
            options={rooms.map(r => ({ value: r.r_id, label: `${r.r_id} (${r.type})` }))}
            value={formData.r_id} 
            onChange={(e) => setFormData({ ...formData, r_id: e.target.value })} 
            required 
          />
          <FormField 
            label="Work Shift" 
            name="shift" 
            type="select"
            options={[
              { value: 'Morning', label: 'Morning Shift (06:00 - 14:00)' },
              { value: 'Evening', label: 'Evening Shift (14:00 - 22:00)' },
              { value: 'Night', label: 'Night Shift (22:00 - 06:00)' }
            ]}
            value={formData.shift} 
            onChange={(e) => setFormData({ ...formData, shift: e.target.value })} 
            required 
          />
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Assign Shift</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Remove Duty Shift"
        message={`Remove ${selectedItem?.shift} shift duty for Nurse ${selectedItem?.nurse_name} on Room ${selectedItem?.r_id}?`}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Governs;
