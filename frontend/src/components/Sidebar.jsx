import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserRound, 
  Stethoscope, 
  Briefcase, 
  Building2, 
  Calendar, 
  Receipt, 
  FlaskConical, 
  BedDouble, 
  Clock, 
  ShieldCheck,
  HeartPulse
} from 'lucide-react';
import './Sidebar.css';

const navGroups = [
  {
    title: 'Clinical Care',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={19} /> },
      { path: '/patients', label: 'Patients', icon: <Users size={19} /> },
      { path: '/appointments', label: 'Consultations', icon: <Calendar size={19} /> },
    ]
  },
  {
    title: 'Medical Staff',
    items: [
      { path: '/doctors', label: 'Doctors', icon: <Stethoscope size={19} /> },
      { path: '/nurses', label: 'Nurses', icon: <UserRound size={19} /> },
      { path: '/employees', label: 'Employees', icon: <Briefcase size={19} /> },
    ]
  },
  {
    title: 'Hospital Logistics',
    items: [
      { path: '/rooms', label: 'Rooms & Beds', icon: <Building2 size={19} /> },
      { path: '/assignments', label: 'Room Allocations', icon: <BedDouble size={19} /> },
      { path: '/governs', label: 'Nurse Shifts', icon: <Clock size={19} /> },
    ]
  },
  {
    title: 'Financial & Labs',
    items: [
      { path: '/bills', label: 'Invoices & Bills', icon: <Receipt size={19} /> },
      { path: '/test-reports', label: 'Test Reports', icon: <FlaskConical size={19} /> },
    ]
  }
];

const Sidebar = () => {
  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon-wrapper">
          <HeartPulse size={24} className="brand-pulse-icon" />
        </div>
        <div className="brand-text">
          <h2>CareFlow PMS</h2>
          <span className="brand-subtext">Hospital Management System</span>
        </div>
      </div>

      {/* Nav List with Sections */}
      <nav className="sidebar-nav">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="nav-group">
            <span className="group-title">{group.title}</span>
            <ul className="group-items">
              {group.items.map((item) => (
                <li key={item.path}>
                  <NavLink 
                    to={item.path} 
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* System Footer Card */}
      <div className="sidebar-footer">
        <div className="system-spec-card">
          <div className="spec-badge">
            <ShieldCheck size={14} />
            <span>DBMS DA2 Handoff</span>
          </div>
          <p className="spec-desc">MySQL 8.x • Relational InnoDB</p>
          <div className="spec-indicator">
            <span className="dot online"></span>
            <span>EER Schema v1.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
