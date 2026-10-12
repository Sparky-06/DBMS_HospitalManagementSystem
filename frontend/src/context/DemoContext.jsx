import React, { createContext, useContext, useState, useEffect } from 'react';

// Realistic sample seed data directly following the MySQL database schema & contract
export const initialDemoData = {
  patients: [
    { p_id: 'P001', fname: 'Rahul', mname: 'K', lname: 'Sharma', gender: 'Male', dob: '1998-08-10', phones: ['9876543210', '9876543211'], allergies: ['Penicillin', 'Dust'] },
    { p_id: 'P002', fname: 'Priya', mname: 'R', lname: 'Patel', gender: 'Female', dob: '2001-04-15', phones: ['9822334455'], allergies: ['Sulfa drugs'] },
    { p_id: 'P003', fname: 'Amit', mname: 'V', lname: 'Verma', gender: 'Male', dob: '1985-11-20', phones: ['9911223344'], allergies: ['Pollen'] },
    { p_id: 'P004', fname: 'Sneha', mname: 'M', lname: 'Reddy', gender: 'Female', dob: '1992-02-28', phones: ['9844556677'], allergies: ['Aspirin', 'Latex'] },
    { p_id: 'P005', fname: 'Vikram', mname: 'S', lname: 'Singh', gender: 'Male', dob: '1976-07-04', phones: ['9755443322'], allergies: [] },
    { p_id: 'P006', fname: 'Ananya', mname: '', lname: 'Iyer', gender: 'Female', dob: '2003-09-12', phones: ['9644332211'], allergies: ['Peanuts'] },
    { p_id: 'P007', fname: 'Karthik', mname: 'N', lname: 'Menon', gender: 'Male', dob: '1990-12-05', phones: ['9533221100'], allergies: ['Seafood'] }
  ],
  employees: [
    { emp_id: 'E001', fname: 'Arun', mname: 'K', lname: 'Kumar', city: 'Chennai', state: 'Tamil Nadu', dob: '1982-05-15', salary: 145000, mob_no: ['9876543210'] },
    { emp_id: 'E002', fname: 'Deepa', mname: 'S', lname: 'Nair', city: 'Coimbatore', state: 'Tamil Nadu', dob: '1986-09-22', salary: 130000, mob_no: ['9876543212'] },
    { emp_id: 'E003', fname: 'Rajesh', mname: 'B', lname: 'Gupta', city: 'Madurai', state: 'Tamil Nadu', dob: '1979-01-18', salary: 160000, mob_no: ['9876543213'] },
    { emp_id: 'E004', fname: 'Meera', mname: 'P', lname: 'Sundaram', city: 'Chennai', state: 'Tamil Nadu', dob: '1988-11-30', salary: 120000, mob_no: ['9876543214'] },
    { emp_id: 'E005', fname: 'Suresh', mname: 'T', lname: 'Rao', city: 'Salem', state: 'Tamil Nadu', dob: '1994-03-12', salary: 52000, mob_no: ['9876543215'] },
    { emp_id: 'E006', fname: 'Kavitha', mname: 'R', lname: 'Balaji', city: 'Chennai', state: 'Tamil Nadu', dob: '1995-07-25', salary: 48000, mob_no: ['9876543216'] },
    { emp_id: 'E007', fname: 'Pooja', mname: 'N', lname: 'Dhar', city: 'Tiruchirappalli', state: 'Tamil Nadu', dob: '1996-10-08', salary: 50000, mob_no: ['9876543217'] },
    { emp_id: 'E008', fname: 'Divya', mname: '', lname: 'Rajan', city: 'Chennai', state: 'Tamil Nadu', dob: '1993-12-19', salary: 51000, mob_no: ['9876543218'] },
    { emp_id: 'E009', fname: 'Ganesh', mname: 'M', lname: 'Prasad', city: 'Vellore', state: 'Tamil Nadu', dob: '1990-06-14', salary: 38000, mob_no: ['9876543219'] },
    { emp_id: 'E010', fname: 'Lakshmi', mname: 'V', lname: 'Kannan', city: 'Chennai', state: 'Tamil Nadu', dob: '1992-08-01', salary: 40000, mob_no: ['9876543220'] }
  ],
  doctors: [
    { emp_id: 'E001', department: 'Cardiology', qualification: 'MBBS, MD (Cardio)' },
    { emp_id: 'E002', department: 'Neurology', qualification: 'MBBS, DM (Neuro)' },
    { emp_id: 'E003', department: 'Orthopedics', qualification: 'MBBS, MS (Ortho)' },
    { emp_id: 'E004', department: 'Pediatrics', qualification: 'MBBS, DCH, MD' }
  ],
  nurses: [
    { emp_id: 'E005' },
    { emp_id: 'E006' },
    { emp_id: 'E007' },
    { emp_id: 'E008' }
  ],
  rooms: [
    { r_id: 'R101', availability: 1, capacity: 4, type: 'General' },
    { r_id: 'R102', availability: 1, capacity: 2, type: 'General' },
    { r_id: 'R201', availability: 0, capacity: 1, type: 'Private' },
    { r_id: 'R202', availability: 1, capacity: 1, type: 'Private' },
    { r_id: 'R301', availability: 0, capacity: 2, type: 'ICU' },
    { r_id: 'R302', availability: 1, capacity: 2, type: 'ICU' },
    { r_id: 'R401', availability: 1, capacity: 1, type: 'Operation Theater' },
    { r_id: 'R402', availability: 0, capacity: 1, type: 'Operation Theater' }
  ],
  consultations: [
    { emp_id: 'E001', p_id: 'P001', consultation_date: '2026-10-12', consultation_time: '09:30:00' },
    { emp_id: 'E002', p_id: 'P002', consultation_date: '2026-10-12', consultation_time: '10:15:00' },
    { emp_id: 'E003', p_id: 'P003', consultation_date: '2026-10-12', consultation_time: '11:00:00' },
    { emp_id: 'E004', p_id: 'P004', consultation_date: '2026-10-13', consultation_time: '14:30:00' },
    { emp_id: 'E001', p_id: 'P005', consultation_date: '2026-10-13', consultation_time: '15:45:00' },
    { emp_id: 'E002', p_id: 'P006', consultation_date: '2026-10-14', consultation_time: '10:00:00' },
    { emp_id: 'E003', p_id: 'P007', consultation_date: '2026-10-14', consultation_time: '11:30:00' }
  ],
  assignments: [
    { p_id: 'P001', r_id: 'R101' },
    { p_id: 'P003', r_id: 'R201' },
    { p_id: 'P005', r_id: 'R301' }
  ],
  governs: [
    { emp_id: 'E005', r_id: 'R101', shift: 'Morning' },
    { emp_id: 'E006', r_id: 'R101', shift: 'Evening' },
    { emp_id: 'E007', r_id: 'R201', shift: 'Night' },
    { emp_id: 'E008', r_id: 'R301', shift: 'Morning' }
  ],
  bills: [
    { p_id: 'P001', b_id: 'B101', amount: 18500, status: 'Paid' },
    { p_id: 'P001', b_id: 'B102', amount: 4200, status: 'Pending' },
    { p_id: 'P002', b_id: 'B103', amount: 2500, status: 'Paid' },
    { p_id: 'P003', b_id: 'B104', amount: 34000, status: 'Pending' },
    { p_id: 'P004', b_id: 'B105', amount: 6500, status: 'Paid' },
    { p_id: 'P005', b_id: 'B106', amount: 52000, status: 'Pending' }
  ],
  testReports: [
    { p_id: 'P001', test_id: 'T101', test_type: 'Complete Blood Count (CBC)', result: 'Normal hemoglobin 14.2 g/dL' },
    { p_id: 'P001', test_id: 'T102', test_type: 'Chest X-Ray', result: 'Clear lung fields, no consolidation' },
    { p_id: 'P002', test_id: 'T103', test_type: 'Lipid Profile', result: 'Slightly elevated LDL (138 mg/dL)' },
    { p_id: 'P003', test_id: 'T104', test_type: 'MRI Brain', result: 'Mild non-specific ischemic changes' },
    { p_id: 'P004', test_id: 'T105', test_type: 'Knee X-Ray AP/Lat', result: 'Early osteoarthritis grade 1' },
    { p_id: 'P005', test_id: 'T106', test_type: 'ECG 12-Lead', result: 'Normal sinus rhythm, HR 72 bpm' }
  ]
};

const DemoContext = createContext(null);

export const DemoProvider = ({ children }) => {
  // Enabled by default so the demo is never empty, but auto-detects or switches
  const [isDemoMode, setIsDemoMode] = useState(() => {
    const saved = localStorage.getItem('hpms_demo_mode');
    return saved !== null ? saved === 'true' : true;
  });

  const [backendAvailable, setBackendAvailable] = useState(false);
  const [mockData, setMockData] = useState(() => {
    const saved = localStorage.getItem('hpms_mock_data');
    return saved ? JSON.parse(saved) : initialDemoData;
  });

  useEffect(() => {
    localStorage.setItem('hpms_demo_mode', isDemoMode);
  }, [isDemoMode]);

  useEffect(() => {
    localStorage.setItem('hpms_mock_data', JSON.stringify(mockData));
  }, [mockData]);

  // Check if live backend is online
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/health');
        if (res.ok) {
          setBackendAvailable(true);
        } else {
          setBackendAvailable(false);
        }
      } catch (e) {
        setBackendAvailable(false);
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  const toggleDemoMode = () => {
    setIsDemoMode((prev) => !prev);
  };

  const resetMockData = () => {
    setMockData(initialDemoData);
  };

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        toggleDemoMode,
        backendAvailable,
        mockData,
        setMockData,
        resetMockData
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};
