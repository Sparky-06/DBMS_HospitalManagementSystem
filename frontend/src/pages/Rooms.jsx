import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { getRooms, createRoom, updateRoom, deleteRoom } from '../api/rooms';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    r_id: '',
    availability: true,
    capacity: '',
    type: 'General'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getRooms();
      setRooms(res.data || []);
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
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const openAdd = () => {
    setIsEditing(false);
    setFormData({ r_id: '', availability: true, capacity: '', type: 'General' });
    setIsModalOpen(true);
  };

  const openEdit = (row) => {
    setIsEditing(true);
    setFormData({ ...row, availability: row.availability === 1 || row.availability === true });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, availability: formData.availability ? 1 : 0 };
      if (isEditing) {
        await updateRoom(formData.r_id, payload);
      } else {
        await createRoom(payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.error?.message || 'Error saving room');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRoom(selectedItem.r_id);
      fetchData();
    } catch (err) {
      alert(err.error?.message || 'Error deleting room');
    }
  };

  const columns = [
    { field: 'r_id', label: 'Room ID' },
    { field: 'type', label: 'Type' },
    { field: 'capacity', label: 'Capacity' },
    { 
      label: 'Availability', 
      render: (row) => (
        <span className={`badge ${row.availability ? 'badge-success' : 'badge-danger'}`}>
          {row.availability ? 'Available' : 'Occupied'}
        </span>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Rooms</h1>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> Add Room
        </button>
      </div>

      <div className="card">
        {loading ? <p>Loading...</p> : (
          <DataTable 
            columns={columns} 
            data={rooms} 
            keyField="r_id"
            onEdit={openEdit}
            onDelete={(row) => { setSelectedItem(row); setIsDeleteOpen(true); }}
          />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Edit Room' : 'Add Room'}>
        <form onSubmit={handleSave}>
          <FormField label="Room ID" name="r_id" value={formData.r_id} onChange={handleInputChange} required />
          <FormField 
            label="Type" 
            name="type" 
            type="select"
            options={[
              { value: 'General', label: 'General' },
              { value: 'Private', label: 'Private' },
              { value: 'ICU', label: 'ICU' },
              { value: 'Operation Theater', label: 'Operation Theater' }
            ]}
            value={formData.type} 
            onChange={handleInputChange} 
            required 
          />
          <FormField label="Capacity" name="capacity" type="number" value={formData.capacity} onChange={handleInputChange} required />
          
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="checkbox" 
              id="availability" 
              name="availability" 
              checked={formData.availability} 
              onChange={handleInputChange} 
            />
            <label htmlFor="availability" style={{ margin: 0 }}>Available</label>
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Room</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Room"
        message="Are you sure you want to delete this room?"
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Rooms;
