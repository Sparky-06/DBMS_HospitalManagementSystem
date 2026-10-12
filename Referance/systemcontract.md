# Hospital Patient Management System (HPMS)
## System Contract v1.0

This is the canonical contract for a functional Hospital Patient Management System. Use it with the project-roadmap PDF. Follow it unless a later explicit instruction changes the design.

## 1. Goal

Build a local web application with:
- React + Vite frontend
- Node.js + Express backend
- MySQL 8 database
- REST APIs using JSON
- CRUD for all major records
- MySQL foreign keys and transactions
- Frontend/backend validation and consistent errors
- Optional patient PDF report generation
- GitHub-ready structure

This is an academic project, not a production medical-record system.

## 2. Architecture

Browser -> React/Vite (:5173) -> HTTP/JSON -> Express backend (:5000) -> mysql2/promise -> MySQL (:3306)

The frontend MUST NOT connect directly to MySQL.

## 3. Final EER interpretation

Employee:
- Emp_ID
- Name = FName, MName, LName
- Address = City, State
- Mob_No is multivalued
- DOB
- Salary
- Age is derived and is NOT stored

Employee specialization:
- Employee ISA Doctor/Nurse
- Disjoint (`d`)
- Partial specialization
- Doctor and Nurse inherit Emp_ID

Doctor:
- Emp_ID
- Department
- Qualification

Nurse:
- Emp_ID

Patient:
- P_ID
- Name = FName, MName, LName
- Gender
- DOB
- Phone is multivalued
- Allergies is multivalued
- Age is derived and is NOT stored

Room:
- R_ID
- Availability
- Capacity
- Type

Consults:
- Doctor M:N Patient
- Consultation Date and Time
- Key: (Emp_ID, P_ID, Consultation_Date, Consultation_Time)

Assigned:
- Patient N:1 Room
- Key: (P_ID, R_ID)
- No admission/discharge dates in v1

Governs:
- Nurse M:N Room
- Shift is an atomic relationship attribute
- Key: (Emp_ID, R_ID, Shift)

Bills:
- Weak entity
- B_ID is a partial key
- Full PK: (P_ID, B_ID)

TestReport:
- Weak entity
- Test_ID is a partial key
- Full PK: (P_ID, Test_ID)

Department stays an attribute because it has no other attributes in this project.

## 4. Relational schema

```text
EMPLOYEE(Emp_ID PK, FName, MName, LName, City, State, DOB, Salary)

EMPLOYEE_PHONE(Emp_ID PK/FK, Mob_No PK)

DOCTOR(Emp_ID PK/FK, Department, Qualification)

NURSE(Emp_ID PK/FK)

PATIENT(P_ID PK, FName, MName, LName, Gender, DOB)

PATIENT_PHONE(P_ID PK/FK, Phone PK)

PATIENT_ALLERGY(P_ID PK/FK, Allergy PK)

ROOM(R_ID PK, Availability, Capacity, Type)

CONSULTS(Emp_ID PK/FK, P_ID PK/FK,
         Consultation_Date PK, Consultation_Time PK)

ASSIGNED(P_ID PK/FK, R_ID PK/FK)

GOVERNS(Emp_ID PK/FK, R_ID PK/FK, Shift PK)

BILLS(P_ID PK/FK, B_ID PK, Amount)

TEST_REPORT(P_ID PK/FK, Test_ID PK, Test_Type, Result)
```

Foreign keys reference the corresponding parent table IDs.

## 5. Normalization contract

1NF:
- Composite attributes are decomposed.
- Multivalued attributes are separate relations.
- Derived Age is not stored.

2NF:
- No partial dependency remains under the stated keys.
- No further decomposition required.

3NF:
- No transitive dependency remains under the stated dependencies.
- Do not store Age because DOB -> Age.

BCNF:
- Every determinant in the stated dependencies is a superkey.
- No further decomposition required.

Do not invent additional FDs without a domain requirement.

## 6. Technology

Frontend:
- React
- Vite
- React Router
- Axios or fetch
- CSS/component library as desired

Backend:
- Node.js
- Express
- mysql2/promise
- dotenv
- cors
- express-validator or equivalent
- PDFKit or equivalent for PDF export

Database:
- MySQL 8.x
- InnoDB
- Explicit PKs/FKs
- Useful indexes

## 7. MySQL environment

Use backend/.env:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hospital_pms
CLIENT_URL=http://localhost:5173
```

Never commit .env. Commit .env.example.

Use a MySQL connection pool. Never expose credentials to the frontend.

## 8. Backend structure

```text
backend/
├── src/
│   ├── config/db.js
│   ├── controllers/
│   │   ├── employeeController.js
│   │   ├── doctorController.js
│   │   ├── nurseController.js
│   │   ├── patientController.js
│   │   ├── roomController.js
│   │   ├── consultationController.js
│   │   ├── assignmentController.js
│   │   ├── governsController.js
│   │   ├── billController.js
│   │   └── testReportController.js
│   ├── routes/
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── validate.js
│   ├── services/
│   │   ├── patientService.js
│   │   └── pdfService.js
│   ├── app.js
│   └── server.js
├── sql/
│   ├── schema.sql
│   └── seed.sql
├── tests/
├── .env.example
├── .gitignore
└── package.json
```

Use route -> controller -> service -> DB pool. Do not put large SQL blocks in route files.

## 9. Frontend structure

```text
frontend/
├── src/
│   ├── api/
│   │   ├── client.js
│   │   ├── employees.js
│   │   ├── doctors.js
│   │   ├── nurses.js
│   │   ├── patients.js
│   │   ├── rooms.js
│   │   ├── consultations.js
│   │   ├── assignments.js
│   │   ├── governs.js
│   │   ├── bills.js
│   │   └── testReports.js
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── DataTable.jsx
│   │   ├── Modal.jsx
│   │   ├── ConfirmDialog.jsx
│   │   └── FormField.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Employees.jsx
│   │   ├── Doctors.jsx
│   │   ├── Nurses.jsx
│   │   ├── Patients.jsx
│   │   ├── PatientDetails.jsx
│   │   ├── Rooms.jsx
│   │   ├── Consultations.jsx
│   │   ├── Assignments.jsx
│   │   ├── Governs.jsx
│   │   ├── Bills.jsx
│   │   └── TestReports.jsx
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── .gitignore
└── package.json
```

## 10. REST API

Base URL: `/api`

Employees:
```text
GET    /employees
GET    /employees/:empId
POST   /employees
PUT    /employees/:empId
DELETE /employees/:empId
```

Doctors:
```text
GET    /doctors
GET    /doctors/:empId
POST   /doctors
PUT    /doctors/:empId
DELETE /doctors/:empId
```

Nurses:
```text
GET    /nurses
GET    /nurses/:empId
POST   /nurses
PUT    /nurses/:empId
DELETE /nurses/:empId
```

Patients:
```text
GET    /patients
GET    /patients/:pId
POST   /patients
PUT    /patients/:pId
DELETE /patients/:pId
```

Patient phones:
```text
GET    /patients/:pId/phones
POST   /patients/:pId/phones
DELETE /patients/:pId/phones/:phone
```

Patient allergies:
```text
GET    /patients/:pId/allergies
POST   /patients/:pId/allergies
DELETE /patients/:pId/allergies/:allergy
```

Rooms:
```text
GET    /rooms
GET    /rooms/:rId
POST   /rooms
PUT    /rooms/:rId
DELETE /rooms/:rId
```

Consultations:
```text
GET    /consultations
POST   /consultations
PUT    /consultations
DELETE /consultations
```

Assignments:
```text
GET    /assignments
POST   /assignments
DELETE /assignments
```

Governs:
```text
GET    /governs
POST   /governs
DELETE /governs
```

Bills:
```text
GET    /bills
GET    /patients/:pId/bills
POST   /patients/:pId/bills
PUT    /patients/:pId/bills/:bId
DELETE /patients/:pId/bills/:bId
```

Test reports:
```text
GET    /test-reports
GET    /patients/:pId/test-reports
POST   /patients/:pId/test-reports
PUT    /patients/:pId/test-reports/:testId
DELETE /patients/:pId/test-reports/:testId
```

Health:
```text
GET /health
```

## 11. JSON contract

Success:
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

List:
```json
{
  "success": true,
  "data": [],
  "message": "Records fetched successfully"
}
```

Error:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": []
  }
}
```

Never return raw MySQL errors.

Patient create:
```json
{
  "p_id": "P001",
  "fname": "Rahul",
  "mname": "K",
  "lname": "Sharma",
  "gender": "Male",
  "dob": "2002-08-10",
  "phones": ["9876543210"],
  "allergies": ["Penicillin", "Dust"]
}
```

Employee create:
```json
{
  "emp_id": "E001",
  "fname": "Arun",
  "mname": "K",
  "lname": "Kumar",
  "city": "Chennai",
  "state": "Tamil Nadu",
  "dob": "2000-05-15",
  "salary": 55000,
  "mob_no": ["9876543210"]
}
```

Doctor:
```json
{
  "emp_id": "E001",
  "department": "Cardiology",
  "qualification": "MBBS, MD"
}
```

Room:
```json
{
  "r_id": "R101",
  "availability": true,
  "capacity": 4,
  "type": "General"
}
```

Consultation:
```json
{
  "emp_id": "E001",
  "p_id": "P001",
  "consultation_date": "2026-09-17",
  "consultation_time": "14:30:00"
}
```

Assignment:
```json
{
  "p_id": "P001",
  "r_id": "R101"
}
```

Governs:
```json
{
  "emp_id": "N001",
  "r_id": "R101",
  "shift": "Night"
}
```

Bill:
```json
{
  "p_id": "P001",
  "b_id": "B001",
  "amount": 18500
}
```

Test report:
```json
{
  "p_id": "P001",
  "test_id": "T001",
  "test_type": "CBC",
  "result": "Hemoglobin normal"
}
```

## 12. CRUD and database rules

Every create/update/delete must:
1. Validate input.
2. Use parameterized SQL.
3. Respect foreign keys.
4. Handle duplicate keys.
5. Handle missing parent records.
6. Return the standard JSON format.
7. Update frontend state after success.

Use transactions for operations that change multiple tables. Example patient creation:
BEGIN -> insert patient -> insert phone rows -> insert allergy rows -> COMMIT; otherwise ROLLBACK.

Do not concatenate user input into SQL.

## 13. Validation

At minimum:
- salary >= 0
- bill amount >= 0
- capacity is positive integer
- DOB is a valid date
- phone values are validated
- IDs are non-empty
- availability is boolean
- shift uses controlled values such as Morning/Evening/Night

## 14. SQL setup

Create database and tables from backend/sql/schema.sql, then seed with backend/sql/seed.sql.

Suggested creation order:
employee -> employee_phone -> doctor -> nurse -> patient -> patient_phone -> patient_allergy -> room -> consults -> assigned -> governs -> bills -> test_report

Use InnoDB.

## 15. Seed data

Use fictional data only. Suggested minimum:
- 10 employees
- 4 doctors
- 4 nurses
- 15 patients
- 10+ patient phone rows
- 10+ allergy rows
- 8 rooms
- 20 consultations
- 10 assignments
- 10 nurse-room-shift rows
- 15 bills
- 20 test reports

## 16. UI requirements

Pages:
- Dashboard
- Employees
- Doctors
- Nurses
- Patients
- Patient Details
- Rooms
- Consultations
- Assignments
- Governs
- Bills
- Test Reports

Major management pages must support Create, Read/List, Update and Delete.

Patient Details should show basic information, phones, allergies, assigned room, consultations, bills and test reports.

Confirm destructive deletes.

## 17. PDF report

Optional but recommended endpoint:
```text
GET /api/patients/:pId/report.pdf
```

Generate a patient summary from live MySQL data containing patient details, phones, allergies, room, consultations, bills and test reports. Frontend should have a "Download Patient Report" action.

## 18. GitHub

Recommended root:
```text
hospital-pms/
├── frontend/
├── backend/
├── docs/
│   ├── systemcontract.md
│   └── project-roadmap.pdf
├── README.md
└── .gitignore
```

Never commit:
- .env
- node_modules
- real patient data
- passwords/secrets

## 19. Local execution

Terminal 1:
```bash
cd backend
npm install
npm run dev
```

Terminal 2:
```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:5000
API: http://localhost:5000/api

## 20. Definition of done

The system is complete when:
- MySQL schema builds
- seed data loads
- backend connects to MySQL
- frontend and backend run separately
- health endpoint works
- core entities have CRUD
- phones/allergies work
- Doctor/Nurse specialization works
- consultations work
- room assignment works
- nurse-room shifts work
- bills work
- test reports work
- validation/errors work
- foreign-key integrity works
- dashboard uses live API data
- PDF report works if included
- clean GitHub clone can be installed and run

## 21. AI coding-agent rules

Treat this contract as the source of truth. Do not redesign the schema without explicit instruction. Do not store Age. Do not merge multivalued attributes back into parent tables. Do not connect frontend directly to MySQL. Do not hardcode credentials. Use parameterized SQL. Keep frontend/backend separate. Keep API JSON shapes consistent. When changing an API, update all affected files and this contract.
