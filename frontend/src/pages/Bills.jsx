import React, { useState, useEffect } from 'react';
import { Plus, Receipt, CheckCircle2, AlertCircle, DollarSign, User } from 'lucide-react';
import { getBills, createBill, deleteBill } from '../api/bills';
import { getPatients } from '../api/patients';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import { useDemo } from '../context/DemoContext';
import { useToast } from '../context/ToastContext';

const Bills = () => {
  const { isDemoMode, mockData, setMockData } = useDemo();
  const { showSuccess, showError } = useToast();

  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [formData, setFormData] = useState({ p_id: '', b_id: '', amount: '', status: 'Pending' });

  const fetchData = async () => {
    setLoading(true);
    if (isDemoMode) {
      const enriched = mockData.bills.map(b => {
        const p = mockData.patients.find(pt => pt.p_id === b.p_id);
        return {
          ...b,
          patient_name: p ? `${p.fname} ${p.lname}` : b.p_id
        };
      });
      setBills(enriched);
      setPatients(mockData.patients);
      setLoading(false);
      return;
    }

    try {
      const [bRes, pRes] = await Promise.all([
        getBills(), 
        getPatients().catch(() => ({ data: [] }))
      ]);

      const ptMap = {};
      (pRes.data || []).forEach(p => { ptMap[p.p_id] = p; });

      const enriched = (bRes.data || []).map(b => ({
        ...b,
        patient_name: ptMap[b.p_id] ? `${ptMap[b.p_id].fname} ${ptMap[b.p_id].lname}` : b.p_id
      }));

      setBills(enriched);
      setPatients(pRes.data || []);
    } catch (err) {
      console.error(err);
      showError('Failed to fetch patient bills.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isDemoMode, mockData.bills]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openAdd = () => {
    setFormData({
      p_id: patients[0]?.p_id || '',
      b_id: `B${Math.floor(100 + Math.random() * 900)}`,
      amount: '',
      status: 'Pending'
    });
    setIsModalOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const payload = { ...formData, amount: Number(formData.amount) };

    if (isDemoMode) {
      setMockData(prev => ({
        ...prev,
        bills: [payload, ...prev.bills]
      }));
      showSuccess(`Bill ${payload.b_id} created`);
      setIsModalOpen(false);
      return;
    }

    try {
      await createBill(formData.p_id, payload);
      showSuccess('Bill created successfully');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      showError(err.error?.message || 'Error creating bill');
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    if (isDemoMode) {
      setMockData(prev => ({
        ...prev,
        bills: prev.bills.filter(b => !(b.p_id === selectedItem.p_id && b.b_id === selectedItem.b_id))
      }));
      showSuccess('Bill invoice removed');
      return;
    }

    try {
      await deleteBill(selectedItem.p_id, selectedItem.b_id);
      showSuccess('Bill deleted successfully');
      fetchData();
    } catch (err) {
      showError(err.error?.message || 'Error deleting bill');
    }
  };

  const totalRevenue = bills.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
  const totalPaid = bills.filter(b => b.status === 'Paid').reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
  const totalPending = totalRevenue - totalPaid;

  const columns = [
    { 
      label: 'Bill ID (Partial Key)', 
      render: (row) => (
        <span className="badge badge-primary font-mono font-bold">
          {row.b_id}
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
      label: 'Amount (₹)', 
      render: (row) => (
        <strong style={{ fontSize: '0.95rem' }}>
          ₹{Number(row.amount).toLocaleString('en-IN')}
        </strong>
      )
    },
    { 
      label: 'Status', 
      render: (row) => (
        <span className={`badge ${row.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
          {row.status === 'Paid' ? <CheckCircle2 size={13} style={{ marginRight: '4px' }} /> : <AlertCircle size={13} style={{ marginRight: '4px' }} />}
          {row.status || 'Active'}
        </span>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div className="header-titles">
          <h1>Patient Invoices & Bills</h1>
          <p>Weak entity: Identified by composite key (P_ID, B_ID) where B_ID is a partial key</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> Create Invoice
        </button>
      </div>

      {/* Financial Health Mini Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #0284c7' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Invoiced</span>
          <h3 style={{ margin: '4px 0 0', fontSize: '1.4rem' }}>₹{totalRevenue.toLocaleString('en-IN')}</h3>
        </div>
        <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #16a34a' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Collected / Paid</span>
          <h3 style={{ margin: '4px 0 0', fontSize: '1.4rem', color: '#16a34a' }}>₹{totalPaid.toLocaleString('en-IN')}</h3>
        </div>
        <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #d97706' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Pending Receivables</span>
          <h3 style={{ margin: '4px 0 0', fontSize: '1.4rem', color: '#d97706' }}>₹{totalPending.toLocaleString('en-IN')}</h3>
        </div>
      </div>

      <div className="card">
        {loading ? <p>Loading billing records...</p> : (
          <DataTable 
            columns={columns} 
            data={bills} 
            keyField={(row) => `${row.p_id}-${row.b_id}`}
            searchPlaceholder="Search invoices by patient, bill ID, amount, status..."
            onDelete={(row) => { setSelectedItem(row); setIsDeleteOpen(true); }}
          />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Generate Patient Invoice">
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
            label="Bill ID (B_ID Partial Key)" 
            name="b_id" 
            value={formData.b_id} 
            onChange={handleInputChange} 
            required 
          />
          <FormField 
            label="Billing Amount (₹)" 
            name="amount" 
            type="number" 
            value={formData.amount} 
            onChange={handleInputChange} 
            required 
          />
          <FormField 
            label="Payment Status" 
            name="status" 
            type="select"
            options={[
              { value: 'Pending', label: 'Pending Payment' },
              { value: 'Paid', label: 'Paid in Full' }
            ]}
            value={formData.status} 
            onChange={handleInputChange} 
            required 
          />
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Generate Bill</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Bill"
        message={`Delete Bill ${selectedItem?.b_id} for Patient ${selectedItem?.patient_name} (Amount: ₹${selectedItem?.amount})?`}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Bills;
