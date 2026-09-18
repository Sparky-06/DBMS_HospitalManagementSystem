-- Hospital Patient Management System (HPMS) Seed Data
-- Fictional data satisfying minimum roadmap thresholds
USE hospital_pms;

-- Clean existing data in reverse order of foreign key dependency
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE test_report;
TRUNCATE TABLE bills;
TRUNCATE TABLE governs;
TRUNCATE TABLE assigned;
TRUNCATE TABLE consults;
TRUNCATE TABLE room;
TRUNCATE TABLE patient_allergy;
TRUNCATE TABLE patient_phone;
TRUNCATE TABLE patient;
TRUNCATE TABLE nurse;
TRUNCATE TABLE doctor;
TRUNCATE TABLE employee_phone;
TRUNCATE TABLE employee;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. EMPLOYEES (12 total: 6 Doctors, 5 Nurses, 1 Administrative)
INSERT INTO employee (Emp_ID, FName, MName, LName, City, State, DOB, Salary) VALUES
('E001', 'Arun', 'K', 'Kumar', 'Chennai', 'Tamil Nadu', '1980-04-12', 125000.00),
('E002', 'Priya', 'R', 'Nair', 'Kochi', 'Kerala', '1985-08-23', 115000.00),
('E003', 'Rajesh', 'V', 'Sharma', 'Mumbai', 'Maharashtra', '1978-11-05', 140000.00),
('E004', 'Sneha', 'M', 'Patel', 'Ahmedabad', 'Gujarat', '1982-01-30', 130000.00),
('E005', 'Vikram', 'S', 'Sengupta', 'Kolkata', 'West Bengal', '1975-06-18', 155000.00),
('E006', 'Ananya', 'D', 'Deshmukh', 'Pune', 'Maharashtra', '1988-09-14', 110000.00),
('E007', 'Mary', 'T', 'Joseph', 'Kottayam', 'Kerala', '1990-03-22', 65000.00),
('E008', 'Kavita', 'B', 'Rao', 'Bengaluru', 'Karnataka', '1992-07-11', 62000.00),
('E009', 'Suman', 'L', 'Gupta', 'Lucknow', 'Uttar Pradesh', '1991-12-04', 60000.00),
('E010', 'Deepa', 'N', 'Iyer', 'Chennai', 'Tamil Nadu', '1994-05-19', 58000.00),
('E011', 'Sunil', 'P', 'Verma', 'Delhi', 'Delhi', '1989-10-27', 63000.00),
('E012', 'Gopal', 'C', 'Mehta', 'Jaipur', 'Rajasthan', '1986-02-14', 50000.00);

-- 2. EMPLOYEE PHONES (Multivalued phones)
INSERT INTO employee_phone (Emp_ID, Mob_No) VALUES
('E001', '9876543210'),
('E001', '9876543211'),
('E002', '9876543212'),
('E003', '9876543213'),
('E003', '9876543214'),
('E004', '9876543215'),
('E005', '9876543216'),
('E006', '9876543217'),
('E007', '9876543218'),
('E007', '9876543219'),
('E008', '9876543220'),
('E009', '9876543221'),
('E010', '9876543222'),
('E011', '9876543223');

-- 3. DOCTORS (Inherits Emp_ID: E001 - E006)
INSERT INTO doctor (Emp_ID, Department, Qualification) VALUES
('E001', 'Cardiology', 'MBBS, MD, DM (Cardiology)'),
('E002', 'Neurology', 'MBBS, MD, DM (Neurology)'),
('E003', 'Orthopedics', 'MBBS, MS (Orthopedics), MCh'),
('E004', 'Pediatrics', 'MBBS, MD (Pediatrics)'),
('E005', 'General Surgery', 'MBBS, MS (General Surgery), FRCS'),
('E006', 'General Medicine', 'MBBS, MD (General Medicine)');

-- 4. NURSES (Inherits Emp_ID: E007 - E011)
INSERT INTO nurse (Emp_ID) VALUES
('E007'),
('E008'),
('E009'),
('E010'),
('E011');

-- 5. PATIENTS (16 patients)
INSERT INTO patient (P_ID, FName, MName, LName, Gender, DOB) VALUES
('P001', 'Rahul', 'K', 'Sharma', 'Male', '1995-08-10'),
('P002', 'Anita', 'S', 'Patil', 'Female', '1989-12-03'),
('P003', 'Amit', 'J', 'Verma', 'Male', '1968-04-25'),
('P004', 'Meera', 'R', 'Nambiar', 'Female', '2001-02-14'),
('P005', 'Rohan', 'A', 'Kulkarni', 'Male', '1977-10-19'),
('P006', 'Divya', 'P', 'Reddy', 'Female', '1992-06-30'),
('P007', 'Suresh', 'B', 'Menon', 'Male', '1955-09-08'),
('P008', 'Pooja', 'M', 'Bose', 'Female', '1998-11-22'),
('P009', 'Karthik', 'S', 'Sundaram', 'Male', '2003-01-17'),
('P010', 'Geeta', 'L', 'Chauhan', 'Female', '1962-07-05'),
('P011', 'Vivek', 'N', 'Pandey', 'Male', '1984-03-12'),
('P012', 'Lakshmi', 'K', 'Narayanan', 'Female', '1973-05-28'),
('P013', 'Arjun', 'V', 'Das', 'Male', '1999-09-15'),
('P014', 'Fatima', 'Z', 'Khan', 'Female', '1991-08-04'),
('P015', 'Manoj', 'T', 'Gowda', 'Male', '1966-10-31'),
('P016', 'Sunita', 'D', 'Mishra', 'Female', '1980-12-16');

-- 6. PATIENT PHONES (Multivalued phones: 20 rows)
INSERT INTO patient_phone (P_ID, Phone) VALUES
('P001', '9123456780'),
('P001', '9123456781'),
('P002', '9123456782'),
('P003', '9123456783'),
('P003', '9123456784'),
('P004', '9123456785'),
('P005', '9123456786'),
('P006', '9123456787'),
('P006', '9123456788'),
('P007', '9123456789'),
('P008', '9123456790'),
('P009', '9123456791'),
('P010', '9123456792'),
('P011', '9123456793'),
('P012', '9123456794'),
('P012', '9123456795'),
('P013', '9123456796'),
('P014', '9123456797'),
('P015', '9123456798'),
('P016', '9123456799');

-- 7. PATIENT ALLERGIES (Multivalued allergies: 18 rows)
INSERT INTO patient_allergy (P_ID, Allergy) VALUES
('P001', 'Penicillin'),
('P001', 'Dust'),
('P002', 'Sulfa Drugs'),
('P003', 'Aspirin'),
('P003', 'Latex'),
('P004', 'Peanuts'),
('P005', 'Ibuprofen'),
('P006', 'Pollen'),
('P007', 'Contrast Dye'),
('P007', 'Morphine'),
('P008', 'Shellfish'),
('P010', 'Amoxicillin'),
('P011', 'Codeine'),
('P012', 'Penicillin'),
('P013', 'Gluten'),
('P014', 'Eggs'),
('P015', 'NSAIDs'),
('P016', 'Ciprofloxacin');

-- 8. ROOMS (8 rooms of various types)
INSERT INTO room (R_ID, Availability, Capacity, Type) VALUES
('R101', TRUE, 4, 'General Ward'),
('R102', TRUE, 4, 'General Ward'),
('R201', FALSE, 2, 'Semi-Private'),
('R202', TRUE, 2, 'Semi-Private'),
('R301', FALSE, 1, 'Private Deluxe'),
('R302', TRUE, 1, 'Private Deluxe'),
('R401', FALSE, 2, 'ICU'),
('R402', TRUE, 2, 'ICU');

-- 9. CONSULTS (Doctor M:N Patient: 22 consultations)
INSERT INTO consults (Emp_ID, P_ID, Consultation_Date, Consultation_Time, Notes) VALUES
('E001', 'P001', '2026-09-10', '10:00:00', 'Routine cardiac evaluation. ECG recommended.'),
('E001', 'P003', '2026-09-10', '11:30:00', 'Hypertension follow-up. Medication dosage revised.'),
('E002', 'P002', '2026-09-11', '09:15:00', 'Chronic migraine symptoms assessed.'),
('E003', 'P005', '2026-09-11', '14:00:00', 'Post-fracture rehab inspection. Healing properly.'),
('E004', 'P004', '2026-09-12', '10:45:00', 'Pediatric viral fever follow-up.'),
('E005', 'P007', '2026-09-12', '16:00:00', 'Pre-operative evaluation for laparoscopic cholecystectomy.'),
('E006', 'P006', '2026-09-13', '11:00:00', 'Severe seasonal allergies and respiratory wheezing.'),
('E001', 'P009', '2026-09-13', '15:30:00', 'Pre-athletic sports heart screening.'),
('E002', 'P008', '2026-09-14', '09:45:00', 'Dizziness and vestibular nerve examination.'),
('E003', 'P011', '2026-09-14', '11:15:00', 'Acute lumbar pain and sciatica consultation.'),
('E006', 'P010', '2026-09-14', '14:30:00', 'Type 2 Diabetes quarterly metabolic review.'),
('E005', 'P012', '2026-09-15', '10:30:00', 'Appendicitis post-surgical checkup.'),
('E004', 'P013', '2026-09-15', '15:00:00', 'Adolescent growth and nutritional guidance.'),
('E001', 'P015', '2026-09-16', '11:00:00', 'Angina episodes monitoring. Stress test scheduled.'),
('E002', 'P014', '2026-09-16', '16:15:00', 'Tension headache assessment.'),
('E006', 'P016', '2026-09-17', '10:00:00', 'Hypothyroidism treatment adjustment.'),
('E003', 'P001', '2026-09-17', '12:00:00', 'Secondary consultation for knee stiffness.'),
('E001', 'P007', '2026-09-17', '14:30:00', 'Cardiac clearance for surgery.'),
('E005', 'P003', '2026-09-17', '16:00:00', 'Abdominal hernia assessment.'),
('E002', 'P011', '2026-09-18', '09:30:00', 'Nerve conduction study recommendation.'),
('E004', 'P009', '2026-09-18', '11:00:00', 'Asthma inhaler technique review.'),
('E006', 'P002', '2026-09-18', '14:00:00', 'Iron deficiency anemia dietary planning.');

-- 10. ASSIGNED (Patient N:1 Room: 10 active/recent assignments)
INSERT INTO assigned (P_ID, R_ID) VALUES
('P001', 'R101'),
('P002', 'R101'),
('P003', 'R201'),
('P005', 'R201'),
('P007', 'R401'),
('P008', 'R102'),
('P010', 'R301'),
('P012', 'R202'),
('P015', 'R401'),
('P016', 'R102');

-- 11. GOVERNS (Nurse M:N Room with Shift: 12 assignments)
INSERT INTO governs (Emp_ID, R_ID, Shift) VALUES
('E007', 'R101', 'Morning'),
('E008', 'R101', 'Evening'),
('E009', 'R101', 'Night'),
('E010', 'R201', 'Morning'),
('E011', 'R201', 'Evening'),
('E007', 'R202', 'Night'),
('E008', 'R301', 'Morning'),
('E009', 'R302', 'Evening'),
('E010', 'R401', 'Night'),
('E011', 'R401', 'Morning'),
('E007', 'R402', 'Evening'),
('E008', 'R102', 'Night');

-- 12. BILLS (Weak entity (P_ID, B_ID): 16 bills)
INSERT INTO bills (P_ID, B_ID, Amount, Status) VALUES
('P001', 'B001', 12500.00, 'Paid'),
('P001', 'B002', 3500.00, 'Pending'),
('P002', 'B001', 8200.00, 'Paid'),
('P003', 'B001', 45000.00, 'Pending'),
('P004', 'B001', 1500.00, 'Paid'),
('P005', 'B001', 18900.00, 'Paid'),
('P006', 'B001', 4200.00, 'Paid'),
('P007', 'B001', 65000.00, 'Pending'),
('P007', 'B002', 12000.00, 'Pending'),
('P008', 'B001', 9400.00, 'Paid'),
('P009', 'B001', 2800.00, 'Paid'),
('P010', 'B001', 32000.00, 'Pending'),
('P011', 'B001', 6700.00, 'Paid'),
('P012', 'B001', 21500.00, 'Paid'),
('P015', 'B001', 78000.00, 'Pending'),
('P016', 'B001', 5400.00, 'Paid');

-- 13. TEST REPORTS (Weak entity (P_ID, Test_ID): 21 reports)
INSERT INTO test_report (P_ID, Test_ID, Test_Type, Result) VALUES
('P001', 'T001', 'Complete Blood Count (CBC)', 'Hemoglobin 14.2 g/dL, WBC 6800 /mcL, Platelets 240,000 /mcL. Normal range.'),
('P001', 'T002', '12-Lead Electrocardiogram (ECG)', 'Normal sinus rhythm, HR 72 bpm, no ST segment elevation.'),
('P002', 'T001', 'Brain MRI Scan', 'No acute intracranial hemorrhage or mass effect. Mild sinus mucosal thickening.'),
('P003', 'T001', 'Lipid Panel', 'Total Cholesterol 245 mg/dL (Elevated), LDL 160 mg/dL, HDL 42 mg/dL.'),
('P003', 'T002', 'Renal Function Test (RFT)', 'Serum Creatinine 1.1 mg/dL, BUN 18 mg/dL. Normal filtration.'),
('P004', 'T001', 'Rapid Influenza Diagnostic Test', 'Negative for Influenza A and B antigens.'),
('P005', 'T001', 'X-Ray Right Tibia/Fibula', 'Callus formation observed at fracture site. Stable alignment.'),
('P006', 'T001', 'Total Serum IgE', 'Elevated at 420 IU/mL. Consistent with severe allergic response.'),
('P007', 'T001', 'Abdominal Ultrasound', 'Multiple gallstones identified in gallbladder neck. Mild wall thickening.'),
('P007', 'T002', 'Echocardiogram', 'LVEF 60%. Mild concentric left ventricular hypertrophy.'),
('P008', 'T001', 'Audiometry & Vestibular Test', 'Normal bilateral hearing thresholds. Positional nystagmus absent.'),
('P009', 'T001', 'Echocardiography (Sports Screening)', 'Normal biventricular size and function. No structural abnormalities.'),
('P010', 'T001', 'HbA1c Glycated Hemoglobin', '7.8% (Indicates suboptimal glycemic control).'),
('P010', 'T002', 'Microalbuminuria Test', 'Urinary albumin/creatinine ratio 45 mg/g (Mild microalbuminuria).'),
('P011', 'T001', 'Lumbar Spine MRI', 'L4-L5 posterior disc protrusion abutting the L5 nerve root.'),
('P012', 'T001', 'Histopathology Biopsy', 'Acute suppurative appendicitis, negative for malignancy.'),
('P013', 'T001', 'Serum Ferritin & Iron', 'Ferritin 28 ng/mL, Serum Iron 45 mcg/dL. Borderline low.'),
('P014', 'T001', 'ESR & CRP Inflammation Markers', 'ESR 12 mm/hr, CRP 2.1 mg/L. Within normal limits.'),
('P015', 'T001', 'Coronary CT Angiography', '70% luminal narrowing in proximal LAD artery.'),
('P015', 'T002', 'Troponin-I High Sensitivity', '0.02 ng/mL (Normal, acute MI ruled out).'),
('P016', 'T001', 'Thyroid Profile (TSH, FT3, FT4)', 'TSH 6.4 uIU/mL (Mildly elevated), FT4 0.95 ng/dL.');
