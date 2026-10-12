import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetails from './pages/PatientDetails';
import Doctors from './pages/Doctors';
import Nurses from './pages/Nurses';
import Employees from './pages/Employees';
import Rooms from './pages/Rooms';
import Consultations from './pages/Consultations';
import Assignments from './pages/Assignments';
import Governs from './pages/Governs';
import Bills from './pages/Bills';
import TestReports from './pages/TestReports';
import { ToastProvider } from './context/ToastContext';
import { DemoProvider } from './context/DemoContext';

function App() {
  return (
    <ToastProvider>
      <DemoProvider>
        <BrowserRouter>
          <div className="app-container">
            <Sidebar />
            <div className="content-wrapper">
              <Navbar />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/patients" element={<Patients />} />
                  <Route path="/patients/:id" element={<PatientDetails />} />
                  <Route path="/appointments" element={<Consultations />} />
                  <Route path="/doctors" element={<Doctors />} />
                  <Route path="/nurses" element={<Nurses />} />
                  <Route path="/employees" element={<Employees />} />
                  <Route path="/rooms" element={<Rooms />} />
                  <Route path="/assignments" element={<Assignments />} />
                  <Route path="/governs" element={<Governs />} />
                  <Route path="/bills" element={<Bills />} />
                  <Route path="/test-reports" element={<TestReports />} />
                </Routes>
              </main>
            </div>
          </div>
        </BrowserRouter>
      </DemoProvider>
    </ToastProvider>
  );
}

export default App;
