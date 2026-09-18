import React, { useState, useEffect } from 'react';
import { getPatients } from '../api/patients';
import { getDoctors } from '../api/doctors';
import { getNurses } from '../api/nurses';
import { getRooms } from '../api/rooms';
import { getConsultations } from '../api/consultations';
import { Users, Stethoscope, Building2, Calendar } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    nurses: 0,
    rooms: 0,
    appointments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [ptsRes, docsRes, nursRes, roomsRes, consRes] = await Promise.all([
          getPatients().catch(() => ({ data: [] })),
          getDoctors().catch(() => ({ data: [] })),
          getNurses().catch(() => ({ data: [] })),
          getRooms().catch(() => ({ data: [] })),
          getConsultations().catch(() => ({ data: [] }))
        ]);

        setStats({
          patients: ptsRes.data?.length || 0,
          doctors: docsRes.data?.length || 0,
          nurses: nursRes.data?.length || 0,
          rooms: roomsRes.data?.length || 0,
          appointments: consRes.data?.length || 0
        });
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>
      
      {loading ? (
        <p>Loading dashboard...</p>
      ) : (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon bg-primary-light">
              <Users size={24} className="text-primary" />
            </div>
            <div className="stat-info">
              <h3>{stats.patients}</h3>
              <p>Total Patients</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon bg-success-light">
              <Stethoscope size={24} className="text-success" />
            </div>
            <div className="stat-info">
              <h3>{stats.doctors + stats.nurses}</h3>
              <p>Medical Staff</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon bg-warning-light">
              <Building2 size={24} className="text-warning" />
            </div>
            <div className="stat-info">
              <h3>{stats.rooms}</h3>
              <p>Total Rooms</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon bg-danger-light">
              <Calendar size={24} className="text-danger" />
            </div>
            <div className="stat-info">
              <h3>{stats.appointments}</h3>
              <p>Consultations</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
