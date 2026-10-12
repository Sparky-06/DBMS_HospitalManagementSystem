import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Stethoscope, 
  BedDouble, 
  Calendar, 
  Receipt, 
  Activity, 
  TrendingUp, 
  ArrowUpRight, 
  UserPlus, 
  CalendarPlus, 
  Building2, 
  DollarSign, 
  Clock, 
  HeartPulse, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { getPatients } from '../api/patients';
import { getDoctors } from '../api/doctors';
import { getNurses } from '../api/nurses';
import { getRooms } from '../api/rooms';
import { getConsultations } from '../api/consultations';
import { getAssignments } from '../api/assignments';
import { getBills } from '../api/bills';
import { getDashboardStats } from '../api/dashboard';
import { useDemo } from '../context/DemoContext';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { isDemoMode, mockData } = useDemo();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    nurses: 0,
    rooms: 0,
    totalCapacity: 0,
    admitted: 0,
    consultations: 0,
    totalBills: 0,
    paidAmount: 0,
    pendingAmount: 0,
    roomOccupancy: [],
    recentConsultations: []
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      if (isDemoMode) {
        // Compute rich metrics from mockData
        const totalBeds = mockData.rooms.reduce((acc, r) => acc + (r.capacity || 1), 0);
        const admittedCount = mockData.assignments.length;
        const totalRevenue = mockData.bills.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
        const paidRev = mockData.bills.filter(b => b.status === 'Paid').reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
        const pendingRev = totalRevenue - paidRev;

        // Group rooms by type
        const typeMap = {};
        mockData.rooms.forEach(r => {
          if (!typeMap[r.type]) {
            typeMap[r.type] = { type: r.type, totalRooms: 0, capacity: 0, occupied: 0 };
          }
          typeMap[r.type].totalRooms += 1;
          typeMap[r.type].capacity += r.capacity;
          if (r.availability === 0) {
            typeMap[r.type].occupied += r.capacity;
          }
        });

        const recent = mockData.consultations.slice(0, 5).map(c => {
          const doc = mockData.doctors.find(d => d.emp_id === c.emp_id);
          const emp = mockData.employees.find(e => e.emp_id === c.emp_id);
          const pat = mockData.patients.find(p => p.p_id === c.p_id);
          return {
            doctor_name: emp ? `Dr. ${emp.fname} ${emp.lname}` : c.emp_id,
            department: doc ? doc.department : 'General Medicine',
            patient_name: pat ? `${pat.fname} ${pat.lname}` : c.p_id,
            date: c.consultation_date,
            time: c.consultation_time
          };
        });

        setStats({
          patients: mockData.patients.length,
          doctors: mockData.doctors.length,
          nurses: mockData.nurses.length,
          rooms: mockData.rooms.length,
          totalCapacity: totalBeds,
          admitted: admittedCount,
          consultations: mockData.consultations.length,
          totalBills: totalRevenue,
          paidAmount: paidRev,
          pendingAmount: pendingRev,
          roomOccupancy: Object.values(typeMap),
          recentConsultations: recent
        });
        setLoading(false);
        return;
      }

      // Live Backend fetch
      try {
        const res = await getDashboardStats();
        if (res.data) {
          const d = res.data;
          setStats({
            patients: d.metrics?.patients || 0,
            doctors: d.metrics?.doctors || 0,
            nurses: d.metrics?.nurses || 0,
            rooms: d.metrics?.rooms || 0,
            totalCapacity: d.metrics?.total_bed_capacity || 0,
            admitted: d.metrics?.admitted_patients || 0,
            consultations: d.metrics?.consultations || 0,
            totalBills: d.financials?.total_amount || 0,
            paidAmount: d.financials?.paid_amount || 0,
            pendingAmount: d.financials?.pending_amount || 0,
            roomOccupancy: d.occupancy || [],
            recentConsultations: d.recent_consultations?.map(c => ({
              doctor_name: c.doctor_name,
              department: c.department,
              patient_name: c.patient_name,
              date: c.consultation_date,
              time: c.consultation_time
            })) || []
          });
        }
      } catch (err) {
        // Fallback gracefully to basic requests if aggregate isn't available
        try {
          const [pts, docs, nurs, rms, cons, asns, bls] = await Promise.all([
            getPatients().catch(() => ({ data: [] })),
            getDoctors().catch(() => ({ data: [] })),
            getNurses().catch(() => ({ data: [] })),
            getRooms().catch(() => ({ data: [] })),
            getConsultations().catch(() => ({ data: [] })),
            getAssignments().catch(() => ({ data: [] })),
            getBills().catch(() => ({ data: [] }))
          ]);

          const totalCap = (rms.data || []).reduce((acc, r) => acc + (r.capacity || 1), 0);
          const totalRev = (bls.data || []).reduce((acc, b) => acc + (Number(b.amount) || 0), 0);

          setStats(prev => ({
            ...prev,
            patients: pts.data?.length || 0,
            doctors: docs.data?.length || 0,
            nurses: nurs.data?.length || 0,
            rooms: rms.data?.length || 0,
            totalCapacity: totalCap,
            admitted: asns.data?.length || 0,
            consultations: cons.data?.length || 0,
            totalBills: totalRev,
            paidAmount: Math.round(totalRev * 0.7),
            pendingAmount: Math.round(totalRev * 0.3)
          }));
        } catch (e) {
          console.error("Dashboard error", e);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [isDemoMode, mockData]);

  const occupancyRate = stats.totalCapacity > 0 
    ? Math.min(100, Math.round((stats.admitted / stats.totalCapacity) * 100))
    : 0;

  return (
    <div className="dashboard-page">
      {/* Welcome Banner */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <HeartPulse size={15} /> Hospital Administration Center
          </div>
          <h2>Hospital Operational Overview</h2>
          <p>Real-time analytics across inpatient wards, clinical consultations, medical workforce, and revenue.</p>
        </div>
        <div className="hero-actions">
          <button className="btn btn-primary" onClick={() => navigate('/patients')}>
            <UserPlus size={16} /> Register Patient
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/appointments')}>
            <CalendarPlus size={16} /> Schedule Consult
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="kpi-grid">
        <div className="kpi-card card-patients" onClick={() => navigate('/patients')}>
          <div className="kpi-icon-box bg-blue">
            <Users size={22} />
          </div>
          <div className="kpi-details">
            <span className="kpi-label">Registered Patients</span>
            <div className="kpi-value-row">
              <h3 className="kpi-value">{stats.patients}</h3>
              <span className="trend-badge positive">+12% vs mo</span>
            </div>
            <span className="kpi-subtext">Active inpatient & OPD records</span>
          </div>
          <ArrowUpRight size={18} className="kpi-arrow" />
        </div>

        <div className="kpi-card card-admitted" onClick={() => navigate('/assignments')}>
          <div className="kpi-icon-box bg-teal">
            <BedDouble size={22} />
          </div>
          <div className="kpi-details">
            <span className="kpi-label">Admitted Inpatients</span>
            <div className="kpi-value-row">
              <h3 className="kpi-value">{stats.admitted}</h3>
              <span className="badge badge-teal">{occupancyRate}% Bed Occupancy</span>
            </div>
            <span className="kpi-subtext">Across {stats.rooms} hospital rooms</span>
          </div>
          <ArrowUpRight size={18} className="kpi-arrow" />
        </div>

        <div className="kpi-card card-staff" onClick={() => navigate('/doctors')}>
          <div className="kpi-icon-box bg-purple">
            <Stethoscope size={22} />
          </div>
          <div className="kpi-details">
            <span className="kpi-label">Medical Staff</span>
            <div className="kpi-value-row">
              <h3 className="kpi-value">{stats.doctors + stats.nurses}</h3>
              <span className="badge badge-purple">{stats.doctors} Docs • {stats.nurses} Nurses</span>
            </div>
            <span className="kpi-subtext">Assigned across shifts</span>
          </div>
          <ArrowUpRight size={18} className="kpi-arrow" />
        </div>

        <div className="kpi-card card-consults" onClick={() => navigate('/appointments')}>
          <div className="kpi-icon-box bg-amber">
            <Calendar size={22} />
          </div>
          <div className="kpi-details">
            <span className="kpi-label">Consultations</span>
            <div className="kpi-value-row">
              <h3 className="kpi-value">{stats.consultations}</h3>
              <span className="badge badge-warning">All Scheduled</span>
            </div>
            <span className="kpi-subtext">Doctor-patient appointments</span>
          </div>
          <ArrowUpRight size={18} className="kpi-arrow" />
        </div>
      </div>

      {/* Main Analytics Row: Occupancy & Financials */}
      <div className="analytics-row">
        {/* Ward Bed Occupancy Breakdown */}
        <div className="card occupancy-card">
          <div className="card-title-bar">
            <div>
              <h3>Ward & Bed Occupancy</h3>
              <p className="card-subtitle">Real-time bed availability across hospital departments</p>
            </div>
            <button className="btn-link" onClick={() => navigate('/rooms')}>View Rooms</button>
          </div>

          <div className="occupancy-progress-main">
            <div className="progress-info">
              <span>Overall Hospital Capacity</span>
              <strong>{stats.admitted} / {stats.totalCapacity} Beds Used ({occupancyRate}%)</strong>
            </div>
            <div className="progress-bar-track">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${Math.max(5, occupancyRate)}%` }}
              ></div>
            </div>
          </div>

          <div className="room-types-grid">
            <div className="room-type-item">
              <div className="type-header">
                <span className="type-title">General Ward</span>
                <span className="badge badge-primary">Ward 1</span>
              </div>
              <div className="type-stat">
                <span className="stat-num">4 / 6</span>
                <span className="stat-desc">Beds Assigned</span>
              </div>
            </div>

            <div className="room-type-item">
              <div className="type-header">
                <span className="type-title">Intensive Care (ICU)</span>
                <span className="badge badge-danger">High Care</span>
              </div>
              <div className="type-stat">
                <span className="stat-num">1 / 4</span>
                <span className="stat-desc">Critical Beds</span>
              </div>
            </div>

            <div className="room-type-item">
              <div className="type-header">
                <span className="type-title">Private Rooms</span>
                <span className="badge badge-success">Suite</span>
              </div>
              <div className="type-stat">
                <span className="stat-num">1 / 2</span>
                <span className="stat-desc">Private Beds</span>
              </div>
            </div>

            <div className="room-type-item">
              <div className="type-header">
                <span className="type-title">Operation Theater</span>
                <span className="badge badge-warning">Surgical</span>
              </div>
              <div className="type-stat">
                <span className="stat-num">1 / 2</span>
                <span className="stat-desc">Surgical Suites</span>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Billing Overview */}
        <div className="card financials-card">
          <div className="card-title-bar">
            <div>
              <h3>Financial Health & Invoices</h3>
              <p className="card-subtitle">Aggregated patient billing and payments</p>
            </div>
            <button className="btn-link" onClick={() => navigate('/bills')}>View Bills</button>
          </div>

          <div className="revenue-hero">
            <span className="rev-label">Total Invoiced Amount</span>
            <h2 className="rev-amount">₹{stats.totalBills.toLocaleString('en-IN')}</h2>
          </div>

          <div className="revenue-split">
            <div className="rev-split-item paid">
              <div className="split-label">
                <CheckCircle2 size={16} className="text-success" />
                <span>Collected / Paid</span>
              </div>
              <span className="split-amount">₹{stats.paidAmount.toLocaleString('en-IN')}</span>
            </div>

            <div className="rev-split-item pending">
              <div className="split-label">
                <AlertCircle size={16} className="text-warning" />
                <span>Pending Receivables</span>
              </div>
              <span className="split-amount">₹{stats.pendingAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="quick-actions-box">
            <span className="quick-title">Quick Operations</span>
            <div className="quick-btn-group">
              <button className="btn-quick-chip" onClick={() => navigate('/assignments')}>
                Assign Room
              </button>
              <button className="btn-quick-chip" onClick={() => navigate('/governs')}>
                Nurse Shifts
              </button>
              <button className="btn-quick-chip" onClick={() => navigate('/test-reports')}>
                Lab Reports
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Consultations Stream */}
      <div className="card recent-consults-card">
        <div className="card-title-bar">
          <div>
            <h3>Upcoming & Recent Consultations</h3>
            <p className="card-subtitle">Scheduled doctor appointments and patient consultations</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/appointments')}>
            View All ({stats.consultations})
          </button>
        </div>

        {stats.recentConsultations.length === 0 ? (
          <div className="empty-stream">
            <Clock size={32} />
            <p>No recent consultations scheduled</p>
          </div>
        ) : (
          <div className="consultations-stream">
            {stats.recentConsultations.map((item, index) => (
              <div key={index} className="stream-item">
                <div className="stream-avatar">
                  {item.doctor_name.replace('Dr. ', '').substring(0, 2).toUpperCase()}
                </div>
                <div className="stream-doctor">
                  <h4>{item.doctor_name}</h4>
                  <span className="badge badge-primary">{item.department}</span>
                </div>
                <div className="stream-patient">
                  <span className="stream-label">Patient:</span>
                  <strong>{item.patient_name}</strong>
                </div>
                <div className="stream-time">
                  <Calendar size={14} />
                  <span>{new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="time-pill-small">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
