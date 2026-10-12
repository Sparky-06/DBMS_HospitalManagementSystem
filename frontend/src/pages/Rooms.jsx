import React, { useState, useEffect } from 'react';
import { Plus, Building2, BedDouble, CheckCircle2, XCircle } from 'lucide-react';
import { getRooms, createRoom, updateRoom, deleteRoom } from '../api/rooms';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import { useDemo } from '../context/DemoContext';
import { useToast } from '../context/ToastContext';

const Rooms = () => {
  const { isDemoMode, mockData, setMockData } = useDemo();
  const { showSuccess, showError } = useToast();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    r_id: '',
    availability: true,
    capacity: 2,
    type: 'General'
  });

  const fetchData = async () => {
    setLoading(true);
    if (isDemoMode) {
      setRooms(mockData.rooms || []);
      setLoading(false);
      return;
    }

    try {
      const res = await getRooms();
      setRooms(res.data || []);
    } catch (err) {
      console.error(err);
      showError('Failed to connect to backend rooms.');
      setRooms(mockData.rooms || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isDemoMode, mockData.rooms]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const openAdd = () => {
    setIsEditing(false);
    setFormData({ r_id: `R${Math.floor(100 + Math.random() * 900)}`, availability: true, capacity: 2, type: 'General' });
    setIsModalOpen(true);
  };

  const openEdit = (row) => {
    setIsEditing(true);
    setFormData({ 
      ...row, 
      availability: row.availability === 1 || row.availability === true || row.availability === '1' 
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { 
      ...formData, 
      capacity: Number(formData.capacity),
      availability: formData.availability ? 1 : 0 
    };

    if (isDemoMode) {
      if (isEditing) {
        setMockData(prev => ({
          ...prev,
          rooms: prev.rooms.map(r => r.r_id === formData.r_id ? payload : r)
        }));
        showSuccess(`Room ${formData.r_id} updated`);
      } else {
        setMockData(prev => ({
          ...prev,
          rooms: [payload, ...prev.rooms]
        }));
        showSuccess(`Room ${formData.r_id} created`);
      }
      setIsModalOpen(false);
      return;
    }

    try {
      if (isEditing) {
        await updateRoom(formData.r_id, payload);
        showSuccess('Room updated');
      } else {
        await createRoom(payload);
        showSuccess('Room created');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      showError(err.error?.message || 'Error saving room');
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    if (isDemoMode) {
      setMockData(prev => ({
        ...prev,
        rooms: prev.rooms.filter(r => r.r_id !== selectedItem.r_id)
      }));
      showSuccess(`Room ${selectedItem.r_id} deleted`);
      return;
    }

    try {
      await deleteRoom(selectedItem.r_id);
      showSuccess('Room deleted');
      fetchData();
    } catch (err) {
      showError(err.error?.message || 'Error deleting room');
    }
  };

  const columns = [
    { 
      label: 'Room ID (R_ID)', 
      render: (row) => (
        <span className="badge badge-primary font-mono font-bold">
          {row.r_id}
        </span>
      )
    },
    { 
      label: 'Room Type', 
      render: (row) => {
        let badgeClass = 'badge-primary';
        if (row.type === 'ICU') badgeClass = 'badge-danger';
        else if (row.type === 'Private') badgeClass = 'badge-purple';
        else if (row.type === 'Operation Theater') badgeClass = 'badge-warning';
        return <span className={`badge ${badgeClass}`}>{row.type}</span>;
      }
    },
    { 
      label: 'Bed Capacity', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BedDouble size={16} color="#0284c7" />
          <strong>{row.capacity} Beds</strong>
        </div>
      )
    },
    { 
      label: 'Status / Availability', 
      render: (row) => {
        const isAvail = row.availability === 1 || row.availability === true || row.availability === '1';
        return (
          <span className={`badge ${isAvail ? 'badge-success' : 'badge-danger'}`}>
            {isAvail ? <CheckCircle2 size={13} style={{ marginRight: '4px' }} /> : <XCircle size={13} style={{ marginRight: '4px' }} />}
            {isAvail ? 'Vacant / Available' : 'Occupied / In Use'}
          </span>
        );
      }
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div className="header-titles">
          <h1>Rooms & Bed Capacity</h1>
          <p>Manage hospital wards, intensive care units, private rooms, and operating theaters</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> Add Room
        </button>
      </div>

      <div className="card">
        {loading ? <p>Loading rooms...</p> : (
          <DataTable 
            columns={columns} 
            data={rooms} 
            keyField="r_id"
            searchPlaceholder="Search rooms by ID, type, or capacity..."
            onEdit={openEdit}
            onDelete={(row) => { setSelectedItem(row); setIsDeleteOpen(true); }}
          />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Edit Room' : 'Add Hospital Room'}>
        <form onSubmit={handleSave}>
          <FormField 
            label="Room ID (R_ID)" 
            name="r_id" 
            value={formData.r_id} 
            onChange={handleInputChange} 
            required 
            disabled={isEditing}
          />
          <FormField 
            label="Room Classification" 
            name="type" 
            type="select"
            options={[
              { value: 'General', label: 'General Ward' },
              { value: 'Private', label: 'Private Suite' },
              { value: 'ICU', label: 'Intensive Care Unit (ICU)' },
              { value: 'Operation Theater', label: 'Operation Theater' }
            ]}
            value={formData.type} 
            onChange={handleInputChange} 
            required 
          />
          <FormField 
            label="Bed Capacity" 
            name="capacity" 
            type="number" 
            value={formData.capacity} 
            onChange={handleInputChange} 
            required 
          />
          
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
            <input 
              type="checkbox" 
              id="availability" 
              name="availability" 
              checked={formData.availability} 
              onChange={handleInputChange} 
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="availability" style={{ margin: 0, cursor: 'pointer', fontWeight: 600 }}>
              Mark as Vacant & Available for Inpatients
            </label>
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{isEditing ? 'Save Changes' : 'Create Room'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Room"
        message={`Are you sure you want to delete Room ${selectedItem?.r_id}? This will fail if there are active patient assignments.`}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Rooms;
