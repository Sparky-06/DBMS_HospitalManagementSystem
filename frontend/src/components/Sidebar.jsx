import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, UserRound, Stethoscope, Briefcase, Building2, Calendar, ClipboardList, Activity, BedDouble } from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { path: '/patients', label: 'Patients', icon: <Users size={20} /> },
  { path: '/appointments', label: 'Appointments', icon: <Calendar size={20} /> },
  { path: '/doctors', label: 'Doctors', icon: <Stethoscope size={20} /> },
  { path: '/nurses', label: 'Nurses', icon: <UserRound size={20} /> },
  { path: '/employees', label: 'Employees', icon: <Briefcase size={20} /> },
  { path: '/rooms', label: 'Rooms', icon: <Building2 size={20} /> },
  { path: '/assignments', label: 'Room Assignments', icon: <BedDouble size={20} /> },
  { path: '/governs', label: 'Nurse-Room Shifts', icon: <Activity size={20} /> },
  { path: '/bills', label: 'Bills', icon: <ClipboardList size={20} /> },
  { path: '/test-reports', label: 'Test Reports', icon: <Activity size={20} /> },
];

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Hospital PMS</h2>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink 
                to={item.path} 
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
