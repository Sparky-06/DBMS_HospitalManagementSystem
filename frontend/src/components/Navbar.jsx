import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Clock, 
  Calendar, 
  Database, 
  Sparkles, 
  UserCircle, 
  PlusCircle, 
  CheckCircle,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import { useToast } from '../context/ToastContext';
import './Navbar.css';

const Navbar = ({ onQuickAction }) => {
  const { isDemoMode, toggleDemoMode, backendAvailable, resetMockData } = useDemo();
  const { showSuccess, showInfo } = useToast();
  const [time, setTime] = useState(new Date());
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleMode = () => {
    toggleDemoMode();
    if (!isDemoMode) {
      showInfo('Switched to Demo Showcase Data (Perfect for presentation demo!)');
    } else {
      showSuccess('Switched to Live Backend API mode (localhost:5000)');
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/patients/')) return 'Patient Clinical Profile';
    switch (path) {
      case '/dashboard': return 'Hospital Executive Dashboard';
      case '/patients': return 'Patient Directory & Registration';
      case '/appointments': return 'Consultation & Appointments';
      case '/doctors': return 'Medical Specialists & Doctors';
      case '/nurses': return 'Nursing Staff Registry';
      case '/employees': return 'Hospital Workforce & Employees';
      case '/rooms': return 'Ward & Bed Capacity Management';
      case '/assignments': return 'Inpatient Room Allocations';
      case '/governs': return 'Nurse Shift Schedules';
      case '/bills': return 'Patient Billing & Invoices';
      case '/test-reports': return 'Diagnostic & Laboratory Reports';
      default: return 'Hospital PMS';
    }
  };

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <div className="current-context">
          <span className="context-badge">CareFlow PMS</span>
          <h2 className="current-page-title">{getPageTitle()}</h2>
        </div>
      </div>

      <div className="navbar-right">
        {/* Real-time Clock & Date Pill */}
        <div className="time-pill">
          <Clock size={15} className="time-icon" />
          <span className="live-time">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          <span className="time-separator">•</span>
          <Calendar size={14} className="date-icon" />
          <span className="live-date">{time.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>

        {/* Database Status Pill */}
        <div className={`status-pill ${backendAvailable ? 'status-live' : 'status-demo'}`}>
          <span className="status-dot"></span>
          <Database size={14} />
          <span className="status-text">
            {backendAvailable ? 'MySQL 8 Live' : 'Demo Mode Active'}
          </span>
        </div>

        {/* Demo Mode Toggle Switch */}
        <button 
          className={`demo-toggle-btn ${isDemoMode ? 'active' : ''}`}
          onClick={handleToggleMode}
          title={isDemoMode ? "Currently using rich pre-populated demo data. Click to use Live API." : "Currently using Live Backend API. Click to use Demo Data."}
        >
          <Sparkles size={15} />
          <span>{isDemoMode ? 'Demo Data' : 'Live API'}</span>
        </button>

        {/* Reset Demo Data if in Demo mode */}
        {isDemoMode && (
          <button 
            className="icon-action-btn"
            onClick={() => {
              resetMockData();
              showSuccess('Demo data reset to fresh state');
            }}
            title="Reset demo records to initial dataset"
          >
            <RefreshCw size={15} />
          </button>
        )}

        {/* Quick Patient Registration */}
        <button 
          className="btn-quick-action"
          onClick={() => navigate('/patients')}
        >
          <PlusCircle size={16} />
          <span>New Patient</span>
        </button>

        {/* User Desk Profile */}
        <div className="user-profile-badge">
          <div className="avatar-circle">AD</div>
          <div className="user-info">
            <span className="user-name">Admin Desk</span>
            <span className="user-role">Super Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
