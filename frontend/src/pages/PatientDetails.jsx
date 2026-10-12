import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  ShieldAlert, 
  Calendar, 
  Receipt, 
  FlaskConical, 
  BedDouble, 
  FileDown, 
  Plus, 
  Trash2, 
  CreditCard, 
  Activity, 
  CheckCircle,
  Clock,
  Printer
} from 'lucide-react';
import { 
  getPatient, 
  addPatientPhone, 
  deletePatientPhone, 
  addPatientAllergy, 
  deletePatientAllergy,
  getPatientReportUrl,
  downloadPatientReport 
} from '../api/patients';
import { getPatientBills, createBill, deleteBill } from '../api/bills';
import { getPatientTestReports, createTestReport, deleteTestReport } from '../api/testReports';
import { getConsultations } from '../api/consultations';
import { getAssignments } from '../api/assignments';
import { getRooms } from '../api/rooms';
import { getDoctors } from '../api/doctors';
import { getEmployees } from '../api/employees';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import { useDemo } from '../context/DemoContext';
import { useToast } from '../context/ToastContext';
import { calculateAge } from './Patients';
import './PatientDetails.css';

const PatientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDemoMode, mockData, setMockData } = useDemo();
  const { showSuccess, showError, showInfo } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [patient, setPatient] = useState(null);
  const [bills, setBills] = useState([]);
  const [reports, setReports] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [roomAssignment, setRoomAssignment] = useState(null);
  const [roomInfo, setRoomInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quick modals for adding phone, allergy, bill, test report
  const [isPhoneModal, setIsPhoneModal] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  
  const [isAllergyModal, setIsAllergyModal] = useState(false);
  const [newAllergy, setNewAllergy] = useState('');

  const [isBillModal, setIsBillModal] = useState(false);
  const [billForm, setBillForm] = useState({ b_id: '', amount: '' });

  const [isReportModal, setIsReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({ test_id: '', test_type: '', result: '' });

  const fetchAllDetails = async () => {
    setLoading(true);

    if (isDemoMode) {
      const p = mockData.patients.find(item => item.p_id === id);
      if (p) {
        setPatient(p);
        const pBills = mockData.bills.filter(b => b.p_id === id);
        const pReports = mockData.testReports.filter(r => r.p_id === id);
        const pConsults = mockData.consultations.filter(c => c.p_id === id).map(c => {
          const doc = mockData.doctors.find(d => d.emp_id === c.emp_id);
          const emp = mockData.employees.find(e => e.emp_id === c.emp_id);
          return {
            ...c,
            doctor_name: emp ? `Dr. ${emp.fname} ${emp.lname}` : c.emp_id,
            department: doc ? doc.department : 'General'
          };
        });
        const assign = mockData.assignments.find(a => a.p_id === id);
        const room = assign ? mockData.rooms.find(r => r.r_id === assign.r_id) : null;

        setBills(pBills);
        setReports(pReports);
        setConsultations(pConsults);
        setRoomAssignment(assign);
        setRoomInfo(room);
      }
      setLoading(false);
      return;
    }

    try {
      const [ptRes, billsRes, reportsRes, consRes, assignRes, roomsRes, docRes, empRes] = await Promise.all([
        getPatient(id),
        getPatientBills(id).catch(() => ({ data: [] })),
        getPatientTestReports(id).catch(() => ({ data: [] })),
        getConsultations().catch(() => ({ data: [] })),
        getAssignments().catch(() => ({ data: [] })),
        getRooms().catch(() => ({ data: [] })),
        getDoctors().catch(() => ({ data: [] })),
        getEmployees().catch(() => ({ data: [] }))
      ]);

      const ptData = ptRes.data || ptRes;
      setPatient(ptData);
      setBills(billsRes.data || []);
      setReports(reportsRes.data || []);

      // Filter consultations for this patient
      const docMap = {};
      (docRes.data || []).forEach(d => { docMap[d.emp_id] = d; });
      const empMap = {};
      (empRes.data || []).forEach(e => { empMap[e.emp_id] = e; });

      const filteredCons = (consRes.data || [])
        .filter(c => c.p_id === id)
        .map(c => ({
          ...c,
          doctor_name: empMap[c.emp_id] ? `Dr. ${empMap[c.emp_id].fname} ${empMap[c.emp_id].lname}` : c.emp_id,
          department: docMap[c.emp_id]?.department || 'General'
        }));
      setConsultations(filteredCons);

      // Find room assignment
      const foundAssign = (assignRes.data || []).find(a => a.p_id === id);
      setRoomAssignment(foundAssign || null);
      if (foundAssign) {
        const foundRoom = (roomsRes.data || []).find(r => r.r_id === foundAssign.r_id);
        setRoomInfo(foundRoom || null);
      }
    } catch (err) {
      console.error(err);
      showError('Failed to load patient records from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDetails();
  }, [id, isDemoMode, mockData]);

  // Handle PDF Export
  const handleDownloadPdf = async () => {
    if (isDemoMode) {
      showInfo('Opening printable patient summary report...');
      window.print();
      return;
    }

    try {
      showInfo('Generating official patient report from live MySQL database...');
      const url = getPatientReportUrl(id);
      window.open(url, '_blank');
    } catch (err) {
      showError('Error downloading PDF report');
    }
  };

  // Add Phone
  const handleAddPhone = async (e) => {
    e.preventDefault();
    if (!newPhone.trim()) return;

    if (isDemoMode) {
      const updatedPhones = [...(patient.phones || []), newPhone.trim()];
      setMockData(prev => ({
        ...prev,
        patients: prev.patients.map(p => p.p_id === id ? { ...p, phones: updatedPhones } : p)
      }));
      showSuccess(`Phone ${newPhone} added`);
      setIsPhoneModal(false);
      setNewPhone('');
      return;
    }

    try {
      await addPatientPhone(id, { phone: newPhone.trim() });
      showSuccess('Phone added successfully');
      setIsPhoneModal(false);
      setNewPhone('');
      fetchAllDetails();
    } catch (err) {
      showError(err.error?.message || 'Error adding phone');
    }
  };

  // Delete Phone
  const handleDeletePhone = async (phoneToDelete) => {
    if (isDemoMode) {
      const updatedPhones = (patient.phones || []).filter(ph => ph !== phoneToDelete);
      setMockData(prev => ({
        ...prev,
        patients: prev.patients.map(p => p.p_id === id ? { ...p, phones: updatedPhones } : p)
      }));
      showSuccess(`Phone ${phoneToDelete} removed`);
      return;
    }

    try {
      await deletePatientPhone(id, phoneToDelete);
      showSuccess('Phone removed');
      fetchAllDetails();
    } catch (err) {
      showError(err.error?.message || 'Error removing phone');
    }
  };

  // Add Allergy
  const handleAddAllergy = async (e) => {
    e.preventDefault();
    if (!newAllergy.trim()) return;

    if (isDemoMode) {
      const updatedAllergies = [...(patient.allergies || []), newAllergy.trim()];
      setMockData(prev => ({
        ...prev,
        patients: prev.patients.map(p => p.p_id === id ? { ...p, allergies: updatedAllergies } : p)
      }));
      showSuccess(`Allergy ${newAllergy} recorded`);
      setIsAllergyModal(false);
      setNewAllergy('');
      return;
    }

    try {
      await addPatientAllergy(id, { allergy: newAllergy.trim() });
      showSuccess('Allergy added successfully');
      setIsAllergyModal(false);
      setNewAllergy('');
      fetchAllDetails();
    } catch (err) {
      showError(err.error?.message || 'Error adding allergy');
    }
  };

  // Delete Allergy
  const handleDeleteAllergy = async (allergyToDelete) => {
    if (isDemoMode) {
      const updatedAllergies = (patient.allergies || []).filter(al => al !== allergyToDelete);
      setMockData(prev => ({
        ...prev,
        patients: prev.patients.map(p => p.p_id === id ? { ...p, allergies: updatedAllergies } : p)
      }));
      showSuccess(`Allergy ${allergyToDelete} removed`);
      return;
    }

    try {
      await deletePatientAllergy(id, allergyToDelete);
      showSuccess('Allergy removed');
      fetchAllDetails();
    } catch (err) {
      showError(err.error?.message || 'Error removing allergy');
    }
  };

  // Create Bill
  const handleCreateBill = async (e) => {
    e.preventDefault();
    const payload = { p_id: id, b_id: billForm.b_id, amount: Number(billForm.amount), status: 'Pending' };

    if (isDemoMode) {
      setMockData(prev => ({
        ...prev,
        bills: [...prev.bills, payload]
      }));
      showSuccess(`Bill ${payload.b_id} created`);
      setIsBillModal(false);
      setBillForm({ b_id: '', amount: '' });
      return;
    }

    try {
      await createBill(id, payload);
      showSuccess('Bill created successfully');
      setIsBillModal(false);
      setBillForm({ b_id: '', amount: '' });
      fetchAllDetails();
    } catch (err) {
      showError(err.error?.message || 'Error generating bill');
    }
  };

  // Delete Bill
  const handleDeleteBill = async (bId) => {
    if (isDemoMode) {
      setMockData(prev => ({
        ...prev,
        bills: prev.bills.filter(b => !(b.p_id === id && b.b_id === bId))
      }));
      showSuccess('Bill deleted');
      return;
    }

    try {
      await deleteBill(id, bId);
      showSuccess('Bill deleted');
      fetchAllDetails();
    } catch (err) {
      showError(err.error?.message || 'Error deleting bill');
    }
  };

  // Create Test Report
  const handleCreateReport = async (e) => {
    e.preventDefault();
    const payload = { p_id: id, ...reportForm };

    if (isDemoMode) {
      setMockData(prev => ({
        ...prev,
        testReports: [...prev.testReports, payload]
      }));
      showSuccess(`Test Report ${payload.test_id} added`);
      setIsReportModal(false);
      setReportForm({ test_id: '', test_type: '', result: '' });
      return;
    }

    try {
      await createTestReport(id, payload);
      showSuccess('Test report saved');
      setIsReportModal(false);
      setReportForm({ test_id: '', test_type: '', result: '' });
      fetchAllDetails();
    } catch (err) {
      showError(err.error?.message || 'Error saving report');
    }
  };

  // Delete Test Report
  const handleDeleteReport = async (testId) => {
    if (isDemoMode) {
      setMockData(prev => ({
        ...prev,
        testReports: prev.testReports.filter(r => !(r.p_id === id && r.test_id === testId))
      }));
      showSuccess('Test report deleted');
      return;
    }

    try {
      await deleteTestReport(id, testId);
      showSuccess('Test report deleted');
      fetchAllDetails();
    } catch (err) {
      showError(err.error?.message || 'Error deleting report');
    }
  };

  if (loading) {
    return <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>Loading patient profile...</div>;
  }

  if (!patient) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
        <h3>Patient Not Found</h3>
        <p>Could not locate patient with ID: {id}</p>
        <Link to="/patients" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Patients Directory
        </Link>
      </div>
    );
  }

  const calculatedAge = calculateAge(patient.dob);
  const totalBilled = bills.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);

  return (
    <div className="patient-profile-page">
      {/* Top Back Action Bar */}
      <div className="profile-top-bar">
        <Link to="/patients" className="btn btn-outline">
          <ArrowLeft size={16} /> Back to Patients
        </Link>
        <div className="profile-action-buttons">
          <button className="btn btn-outline" onClick={handleDownloadPdf}>
            <FileDown size={16} /> Download Summary Report
          </button>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={16} /> Print Record
          </button>
        </div>
      </div>

      {/* Patient Hero Profile Card */}
      <div className="card patient-hero-card">
        <div className="hero-avatar">
          {patient.fname[0]}{(patient.lname ? patient.lname[0] : '')}
        </div>

        <div className="hero-main-info">
          <div className="hero-name-row">
            <h2>{patient.fname} {patient.mname ? patient.mname + ' ' : ''}{patient.lname}</h2>
            <span className="badge badge-primary font-mono">{patient.p_id}</span>
            <span className={`badge ${patient.gender === 'Female' ? 'badge-purple' : 'badge-teal'}`}>
              {patient.gender}
            </span>
            {calculatedAge !== '' && (
              <span className="badge badge-primary" title="Derived dynamically from DOB (3NF normalisation)">
                {calculatedAge} Years Old
              </span>
            )}
          </div>

          <div className="hero-details-row">
            <span className="detail-item">
              <Calendar size={14} className="icon-detail" />
              DOB: {new Date(patient.dob).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="detail-item">
              <BedDouble size={14} className="icon-detail" />
              Room Status: {roomAssignment ? (
                <span className="badge badge-success">Admitted: Room {roomAssignment.r_id} ({roomInfo?.type || 'General'})</span>
              ) : (
                <span className="badge badge-outline">Outpatient (No Ward Assigned)</span>
              )}
            </span>
            <span className="detail-item">
              <Receipt size={14} className="icon-detail" />
              Total Invoiced: ₹{totalBilled.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="profile-tabs-header">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <User size={16} /> Clinical Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'consultations' ? 'active' : ''}`}
          onClick={() => setActiveTab('consultations')}
        >
          <Clock size={16} /> Consultations ({consultations.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'bills' ? 'active' : ''}`}
          onClick={() => setActiveTab('bills')}
        >
          <CreditCard size={16} /> Invoices & Bills ({bills.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <FlaskConical size={16} /> Diagnostic Reports ({reports.length})
        </button>
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === 'overview' && (
        <div className="tab-pane overview-pane">
          <div className="overview-grid">
            {/* Multivalued Phones Card */}
            <div className="card section-card">
              <div className="section-header">
                <div className="section-title-wrap">
                  <Phone size={18} className="text-primary" />
                  <h4>Emergency Contact Numbers</h4>
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => setIsPhoneModal(true)}>
                  <Plus size={14} /> Add Phone
                </button>
              </div>

              <div className="section-body">
                {patient.phones && patient.phones.length > 0 ? (
                  <div className="pills-list">
                    {patient.phones.map((phone, i) => (
                      <div key={i} className="contact-pill">
                        <Phone size={14} color="#0284c7" />
                        <span className="phone-text">{phone}</span>
                        <button 
                          className="btn-pill-delete"
                          onClick={() => handleDeletePhone(phone)}
                          title="Remove phone number"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No contact numbers recorded for this patient.</p>
                )}
              </div>
            </div>

            {/* Multivalued Allergies Card */}
            <div className="card section-card">
              <div className="section-header">
                <div className="section-title-wrap">
                  <ShieldAlert size={18} className="text-danger" />
                  <h4>Documented Drug & Food Allergies</h4>
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => setIsAllergyModal(true)}>
                  <Plus size={14} /> Add Allergy
                </button>
              </div>

              <div className="section-body">
                {patient.allergies && patient.allergies.length > 0 ? (
                  <div className="pills-list">
                    {patient.allergies.map((allergy, i) => (
                      <div key={i} className="allergy-pill">
                        <ShieldAlert size={14} color="#dc2626" />
                        <span className="allergy-text">{allergy}</span>
                        <button 
                          className="btn-pill-delete"
                          onClick={() => handleDeleteAllergy(allergy)}
                          title="Remove allergy"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="safe-badge-box">
                    <CheckCircle size={16} color="#16a34a" />
                    <span>No known drug or food allergies on record</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Current Inpatient Room Card */}
          <div className="card section-card">
            <div className="section-header">
              <div className="section-title-wrap">
                <BedDouble size={18} className="text-teal" />
                <h4>Inpatient Bed & Room Assignment</h4>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/assignments')}>
                Manage Assignments
              </button>
            </div>

            <div className="section-body">
              {roomAssignment ? (
                <div className="room-assignment-box">
                  <div className="room-badge-large">
                    Room {roomAssignment.r_id}
                  </div>
                  <div className="room-specs">
                    <h4>Assigned Ward: {roomInfo?.type || 'Standard Care'}</h4>
                    <p>Total Room Bed Capacity: {roomInfo?.capacity || 2} Beds</p>
                    <span className="badge badge-success">Patient Currently Admitted</span>
                  </div>
                </div>
              ) : (
                <div className="empty-assignment">
                  <BedDouble size={28} className="text-muted" />
                  <div>
                    <h5>Patient is currently an Outpatient</h5>
                    <p>No active bed assignment in hospital wards.</p>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate('/assignments')}>
                    Assign Room Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Consultations */}
      {activeTab === 'consultations' && (
        <div className="tab-pane">
          <div className="card section-card">
            <div className="section-header">
              <h4>Consultation & Appointment History</h4>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/appointments')}>
                <Plus size={15} /> Book Consultation
              </button>
            </div>

            <div className="section-body">
              {consultations.length === 0 ? (
                <p className="text-muted">No consultations scheduled for this patient.</p>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Doctor</th>
                        <th>Department</th>
                        <th>Consultation Date</th>
                        <th>Time Slot</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consultations.map((c, i) => (
                        <tr key={i}>
                          <td><strong>{c.doctor_name}</strong></td>
                          <td><span className="badge badge-primary">{c.department}</span></td>
                          <td>{new Date(c.consultation_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                          <td><span className="badge badge-outline">{c.consultation_time}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Bills */}
      {activeTab === 'bills' && (
        <div className="tab-pane">
          <div className="card section-card">
            <div className="section-header">
              <div>
                <h4>Billing Statements & Invoices</h4>
                <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem' }}>Weak entity: Primary Key is composite (P_ID, B_ID)</p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => {
                setBillForm({ b_id: `B${Math.floor(100 + Math.random() * 900)}`, amount: '' });
                setIsBillModal(true);
              }}>
                <Plus size={15} /> Generate Bill
              </button>
            </div>

            <div className="section-body">
              {bills.length === 0 ? (
                <p className="text-muted">No invoices generated for this patient.</p>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Bill ID (Partial Key)</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bills.map((b) => (
                        <tr key={b.b_id}>
                          <td><strong className="font-mono">{b.b_id}</strong></td>
                          <td><strong>₹{Number(b.amount).toLocaleString('en-IN')}</strong></td>
                          <td>
                            <span className={`badge ${b.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                              {b.status || 'Active'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              className="btn-action btn-action-delete"
                              onClick={() => handleDeleteBill(b.b_id)}
                              title="Delete invoice"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Test Reports */}
      {activeTab === 'reports' && (
        <div className="tab-pane">
          <div className="card section-card">
            <div className="section-header">
              <div>
                <h4>Laboratory & Diagnostic Test Reports</h4>
                <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem' }}>Weak entity: Primary Key is composite (P_ID, Test_ID)</p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => {
                setReportForm({ test_id: `T${Math.floor(100 + Math.random() * 900)}`, test_type: '', result: '' });
                setIsReportModal(true);
              }}>
                <Plus size={15} /> Add Test Report
              </button>
            </div>

            <div className="section-body">
              {reports.length === 0 ? (
                <p className="text-muted">No diagnostic reports found for this patient.</p>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Test ID (Partial Key)</th>
                        <th>Diagnostic Test Type</th>
                        <th>Clinical Findings & Result</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((r) => (
                        <tr key={r.test_id}>
                          <td><strong className="font-mono">{r.test_id}</strong></td>
                          <td><span className="badge badge-purple">{r.test_type}</span></td>
                          <td>{r.result}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              className="btn-action btn-action-delete"
                              onClick={() => handleDeleteReport(r.test_id)}
                              title="Delete report"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Phone */}
      <Modal isOpen={isPhoneModal} onClose={() => setIsPhoneModal(false)} title="Add Phone Number">
        <form onSubmit={handleAddPhone}>
          <FormField 
            label="Phone Number" 
            name="newPhone" 
            value={newPhone} 
            onChange={(e) => setNewPhone(e.target.value)} 
            placeholder="e.g. 9876543210"
            required 
          />
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsPhoneModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Phone</button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Allergy */}
      <Modal isOpen={isAllergyModal} onClose={() => setIsAllergyModal(false)} title="Record Known Allergy">
        <form onSubmit={handleAddAllergy}>
          <FormField 
            label="Allergy Name" 
            name="newAllergy" 
            value={newAllergy} 
            onChange={(e) => setNewAllergy(e.target.value)} 
            placeholder="e.g. Penicillin, Pollen, NSAIDs"
            required 
          />
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsAllergyModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Record Allergy</button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Bill */}
      <Modal isOpen={isBillModal} onClose={() => setIsBillModal(false)} title="Generate Patient Bill">
        <form onSubmit={handleCreateBill}>
          <FormField 
            label="Bill ID (Partial Key)" 
            name="b_id" 
            value={billForm.b_id} 
            onChange={(e) => setBillForm({ ...billForm, b_id: e.target.value })} 
            required 
          />
          <FormField 
            label="Invoice Amount (₹)" 
            name="amount" 
            type="number" 
            value={billForm.amount} 
            onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })} 
            required 
          />
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsBillModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Invoice</button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Test Report */}
      <Modal isOpen={isReportModal} onClose={() => setIsReportModal(false)} title="Add Diagnostic Test Report">
        <form onSubmit={handleCreateReport}>
          <FormField 
            label="Test ID (Partial Key)" 
            name="test_id" 
            value={reportForm.test_id} 
            onChange={(e) => setReportForm({ ...reportForm, test_id: e.target.value })} 
            required 
          />
          <FormField 
            label="Test Type" 
            name="test_type" 
            value={reportForm.test_type} 
            onChange={(e) => setReportForm({ ...reportForm, test_type: e.target.value })} 
            placeholder="e.g. Complete Blood Count, Chest X-Ray"
            required 
          />
          <FormField 
            label="Diagnostic Finding / Result" 
            name="result" 
            type="textarea" 
            value={reportForm.result} 
            onChange={(e) => setReportForm({ ...reportForm, result: e.target.value })} 
            placeholder="Enter clinical findings..."
            required 
          />
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsReportModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Report</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PatientDetails;
