import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { getGoverns, createGovern, deleteGovern } from '../api/governs';
import { getNurses } from '../api/nurses';
import { getRooms } from '../api/rooms';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';

const Governs = () => {
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
    try {
      const [govRes, nursRes, rmsRes] = await Promise.all([
        getGoverns(), getNurses(), getRooms()
      ]);
      setGoverns(govRes.data || []);
      setNurses(nursRes.data || []);
      setRooms(rmsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createGovern(formData);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.error?.message || 'Error assigning nurse shift');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGovern(selectedItem.emp_id, selectedItem.r_id, selectedItem.shift);
      fetchData();
    } catch (err) {
      alert(err.error?.message || 'Error deleting shift');
    }
  };

  const columns = [
    { field: 'emp_id', label: 'Nurse ID' },
    { field: 'r_id', label: 'Room ID' },
    { field: 'shift', label: 'Shift' }
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Nurse-Room Shifts</h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Assign Shift
        </button>
      </div>

      <div className="card">
        {loading ? <p>Loading...</p> : (
          <DataTable 
            columns={columns} 
            data={governs} 
            keyField={(row) => `${row.emp_id}-${row.r_id}-${row.shift}`}
            onDelete={(row) => { setSelectedItem(row); setIsDeleteOpen(true); }}
          />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Assign Nurse Shift">
        <form onSubmit={handleCreate}>
          <FormField 
            label="Nurse" 
            name="emp_id" 
            type="select"
            options={nurses.map(n => ({ value: n.emp_id, label: n.emp_id }))}
            value={formData.emp_id} 
            onChange={(e) => setFormData({ ...formData, emp_id: e.target.value })} 
            required 
          />
          <FormField 
            label="Room" 
            name="r_id" 
            type="select"
            options={rooms.map(r => ({ value: r.r_id, label: `${r.r_id} (${r.type})` }))}
            value={formData.r_id} 
            onChange={(e) => setFormData({ ...formData, r_id: e.target.value })} 
            required 
          />
          <FormField 
            label="Shift" 
            name="shift" 
            type="select"
            options={[
              { value: 'Morning', label: 'Morning' },
              { value: 'Evening', label: 'Evening' },
              { value: 'Night', label: 'Night' }
            ]}
            value={formData.shift} 
            onChange={(e) => setFormData({ ...formData, shift: e.target.value })} 
            required 
          />
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Shift</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Shift"
        message="Are you sure you want to remove this shift?"
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Governs;
