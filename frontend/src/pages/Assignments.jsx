import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { getAssignments, createAssignment, deleteAssignment } from '../api/assignments';
import { getPatients } from '../api/patients';
import { getRooms } from '../api/rooms';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';

const Assignments = () => {
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
    try {
      const [asnRes, ptsRes, rmsRes] = await Promise.all([
        getAssignments(), getPatients(), getRooms()
      ]);
      setAssignments(asnRes.data || []);
      setPatients(ptsRes.data || []);
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
      await createAssignment(formData);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.error?.message || 'Error assigning room');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAssignment(selectedItem.p_id, selectedItem.r_id);
      fetchData();
    } catch (err) {
      alert(err.error?.message || 'Error deleting assignment');
    }
  };

  const columns = [
    { field: 'p_id', label: 'Patient ID' },
    { field: 'r_id', label: 'Room ID' }
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Room Assignments</h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Assign Room
        </button>
      </div>

      <div className="card">
        {loading ? <p>Loading...</p> : (
          <DataTable 
            columns={columns} 
            data={assignments} 
            keyField={(row) => `${row.p_id}-${row.r_id}`}
            onDelete={(row) => { setSelectedItem(row); setIsDeleteOpen(true); }}
          />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Assign Room">
        <form onSubmit={handleCreate}>
          <FormField 
            label="Patient" 
            name="p_id" 
            type="select"
            options={patients.map(p => ({ value: p.p_id, label: `${p.p_id} - ${p.fname} ${p.lname}` }))}
            value={formData.p_id} 
            onChange={(e) => setFormData({ ...formData, p_id: e.target.value })} 
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
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Assignment</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Assignment"
        message="Are you sure you want to remove this assignment?"
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Assignments;
