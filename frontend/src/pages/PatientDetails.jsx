import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPatient } from '../api/patients';
import { getPatientBills } from '../api/bills';
import { getPatientTestReports } from '../api/testReports';
import { ArrowLeft, Phone, User, Activity, FileText } from 'lucide-react';
import './PatientDetails.css';

const PatientDetails = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [bills, setBills] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [ptRes, billsRes, reportsRes] = await Promise.all([
          getPatient(id),
          getPatientBills(id).catch(() => ({ data: [] })),
          getPatientTestReports(id).catch(() => ({ data: [] }))
        ]);
        
        setPatient(ptRes.data || ptRes); // depending on how backend returns
        setBills(billsRes.data || []);
        setReports(reportsRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDetails();
  }, [id]);

  if (loading) return <div>Loading patient details...</div>;
  if (!patient) return <div>Patient not found</div>;

  return (
    <div className="patient-details">
      <div className="page-header">
        <div className="header-left">
          <Link to="/patients" className="btn btn-secondary">
            <ArrowLeft size={18} /> Back
          </Link>
          <h1>{patient.fname} {patient.mname} {patient.lname}</h1>
        </div>
      </div>

      <div className="details-grid">
        <div className="card info-card">
          <div className="card-header">
            <User size={20} className="text-primary" />
            <h3>Basic Info</h3>
          </div>
          <div className="card-body">
            <p><strong>ID:</strong> {patient.p_id}</p>
            <p><strong>Gender:</strong> {patient.gender}</p>
            <p><strong>DOB:</strong> {new Date(patient.dob).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="card info-card">
          <div className="card-header">
            <Phone size={20} className="text-primary" />
            <h3>Contact & Allergies</h3>
          </div>
          <div className="card-body">
            <p><strong>Phones:</strong> {patient.phones?.join(', ') || 'None'}</p>
            <p><strong>Allergies:</strong> {patient.allergies?.join(', ') || 'None'}</p>
          </div>
        </div>
      </div>

      <div className="details-sections">
        <div className="card section-card">
          <div className="card-header">
            <FileText size={20} className="text-success" />
            <h3>Bills</h3>
          </div>
          <div className="card-body">
            {bills.length === 0 ? <p className="text-muted">No bills found.</p> : (
              <table className="data-table">
                <thead><tr><th>Bill ID</th><th>Amount</th></tr></thead>
                <tbody>
                  {bills.map(b => (
                    <tr key={b.b_id}><td>{b.b_id}</td><td>₹{b.amount}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card section-card">
          <div className="card-header">
            <Activity size={20} className="text-warning" />
            <h3>Test Reports</h3>
          </div>
          <div className="card-body">
            {reports.length === 0 ? <p className="text-muted">No test reports found.</p> : (
              <table className="data-table">
                <thead><tr><th>Test ID</th><th>Type</th><th>Result</th></tr></thead>
                <tbody>
                  {reports.map(r => (
                    <tr key={r.test_id}><td>{r.test_id}</td><td>{r.test_type}</td><td>{r.result}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetails;
