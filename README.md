# Hospital Management System

A full-stack **Hospital Management System** developed as a Database Management Systems (DBMS) project. The system is designed to manage patients, doctors, nurses, appointments, rooms, bills, consultations, test reports, and other hospital operations through a centralized relational database.

The project demonstrates the practical application of **database design, relational mapping, SQL, normalization, constraints, CRUD operations, and a web-based application layer**.

The system supports **dual backend implementations**:
1. **Local MySQL Backend** (`backend/`): Connects to a standard local MySQL 8.x database instance.
2. **TiDB Cloud Backend** (`tidb_backend/`): Connects to a scalable, distributed cloud database on **TiDB Cloud** (Serverless/Dedicated) with TLS/SSL encryption and cloud keep-alive optimizations.

Both backends adhere to the exact same REST API contract, allowing the **React frontend** to work seamlessly with either backend with **zero code or configuration changes**.

---

## 📌 Project Overview

Managing hospital information manually can lead to data redundancy, inconsistency, and difficulty in retrieving records.

This project provides a centralized system where hospital-related information can be stored and managed using a relational database. The frontend provides the user interface, while the backend exposes REST APIs and communicates with either the local MySQL database or the cloud-hosted TiDB cluster.

### Main Objectives

* Design a structured relational database for hospital management.
* Reduce data redundancy and maintain data consistency.
* Implement relationships between different hospital entities.
* Perform CRUD operations through a web application.
* Provide REST APIs for communication between frontend and database.
* Demonstrate database concepts such as normalization, keys, constraints, and relationships.
* Showcase seamless hybrid deployment (local MySQL vs. distributed cloud TiDB).

---

## 🏗️ System Architecture

```text
                     ┌──────────────────────┐
                     │      Frontend        │
                     │    React 18 + Vite   │
                     │(http://localhost:5173)│
                     └──────────┬───────────┘
                                │
                                │ HTTP / REST API (port 5000)
                                ▼
            ┌────────────────────────────────────────┐
            │   Dual Backend Options (Port 5000)     │
            ├────────────────────┬───────────────────┤
            │  Option A (Local)  │  Option B (Cloud) │
            │      backend/      │   tidb_backend/   │
            │  Node.js + Express │ Node.js + Express │
            └─────────┬──────────┴─────────┬─────────┘
                      │                    │
                      │ Port 3306          │ Port 4000 (TLS/SSL)
                      ▼                    ▼
            ┌──────────────────┐ ┌───────────────────┐
            │   Local MySQL    │ │    TiDB Cloud     │
            │  Database Server │ │ Serverless Cluster│
            │  (hospital_pms)  │ │  (hospital_pms)   │
            └──────────────────┘ └───────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend
* **React 18**
* **Vite**
* **TailwindCSS / Lucide Icons**
* **Axios** (API Client)

### Backend Implementations
* **Node.js & Express.js**
* **mysql2/promise** (MySQL & TiDB compatible driver)
* **Express Validator** (Strict request contract validation)
* **PDFKit** (Dynamic PDF discharge summary generation)
* **Jest & Supertest** (End-to-end automated API suite)

### Databases Supported
* **MySQL 8.x** (Local relational database)
* **TiDB Cloud** (Distributed, MySQL 8.0 wire-compatible Cloud Native HTAP Database)

---

## 📁 Project Structure

```text
DBMS_HospitalManagementSystem/
│
├── backend/                       # Local MySQL Backend Implementation
│   ├── src/
│   │   ├── config/db.js           # Local MySQL connection pool
│   │   ├── controllers/           # API controllers
│   │   ├── middleware/            # Error handler & input validation
│   │   ├── routes/                # Entity REST routes
│   │   ├── services/              # Business logic & transactions
│   │   ├── app.js                 # Express application configuration
│   │   └── server.js              # Server entry point
│   ├── tests/
│   │   └── api.test.js            # Automated test suite
│   ├── .env                       # Local environment variables
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
│
├── tidb_backend/                  # TiDB Cloud Backend Implementation
│   ├── src/
│   │   ├── config/db.js           # TiDB Cloud pool with TLS/SSL & Keep-Alive
│   │   ├── controllers/           # Identical API controllers
│   │   ├── middleware/            # Error handling with TiDB error code support
│   │   ├── routes/                # Identical entity REST routes
│   │   ├── scripts/
│   │   │   ├── testConnection.js  # Connection diagnostics (npm run db:test)
│   │   │   ├── initDb.js          # Auto-creates schema on cloud (npm run db:init)
│   │   │   └── seedDb.js          # Auto-seeds cloud database (npm run db:seed)
│   │   ├── services/
│   │   ├── app.js
│   │   └── server.js              # Server entry point
│   ├── tests/
│   │   └── api.test.js            # Automated test suite
│   ├── .env                       # TiDB Cloud credentials & SSL settings
│   ├── .env.example
│   ├── README.md                  # TiDB backend detailed documentation
│   ├── package.json
│   └── package-lock.json
│
├── frontend/                      # React + Vite Frontend (Works with both backends)
│   ├── src/
│   │   ├── api/                   # API client calling http://localhost:5000/api
│   │   ├── components/            # UI components (Navbar, Sidebar, Tables, Modals)
│   │   ├── pages/                 # Patients, Doctors, Nurses, Rooms, Bills, etc.
│   │   ├── context/               # Global state & demo data fallback
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   ├── index.html
│   └── vite.config.js
│
├── sql/
│   ├── schema.sql                 # Complete DDL relational schema (13 tables)
│   └── seed.sql                   # Sample dataset for all entities
│
├── Reference/                     # Project roadmap, SRS & contract specifications
├── .env.example
├── .gitignore
└── README.md
```

---

## ⚖️ Backend Comparison: Local MySQL vs. TiDB Cloud

Both backend implementations are fully drop-in interchangeable:

| Feature | Local Backend (`backend/`) | Cloud Backend (`tidb_backend/`) |
|---|---|---|
| **Directory** | `backend/` | `tidb_backend/` |
| **Target Database** | Local MySQL 8.x | TiDB Cloud Serverless / Dedicated |
| **Default Port** | `5000` | `5000` |
| **DB Port** | `3306` | `4000` |
| **SSL / TLS** | `DB_SSL=false` (Disabled) | `DB_SSL=true` (TLS v1.2+ mandatory) |
| **TCP Keep-Alive** | Default | `enableKeepAlive: true`, `10000ms` delay |
| **Cloud Automation** | Manual SQL execution | Built-in scripts (`db:test`, `db:init`, `db:seed`) |
| **Frontend Impact** | **None** (`localhost:5000`) | **None** (`localhost:5000`) |

---

## 🔌 Connection Details & Environment Configuration

### 1. Local MySQL Backend (`backend/.env`)
Create or edit `backend/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_local_mysql_password
DB_NAME=hospital_pms

# SSL Configuration
DB_SSL=false
DB_SSL_REJECT_UNAUTHORIZED=true

# Frontend Client URL for CORS
CLIENT_URL=http://localhost:5173
```

---

### 2. TiDB Cloud Backend (`tidb_backend/.env`)
Create or edit `tidb_backend/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# TiDB Cloud Database Configuration
# Obtain these from https://tidbcloud.com -> Cluster -> Connect
DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=your_prefix.root
DB_PASSWORD=your_tidb_password
DB_NAME=hospital_pms

# Mandatory SSL for TiDB Cloud
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true

# Frontend Client URL for CORS
CLIENT_URL=http://localhost:5173
```

> [!IMPORTANT]
> **Understanding the TiDB Cloud Username Prefix:**  
> On **TiDB Cloud Serverless**, your username is **NOT** just `root`. It includes a cluster-specific prefix, for example `4N11eXuAaoDrgrt.root`. This prefix is mandatory for the TiDB Cloud gateway to route queries to your tenant cluster.
> 
> **Alternative Connection URI:**  
> You can also set a single `DATABASE_URL` line if copied directly from the TiDB Cloud console:
> ```env
> DATABASE_URL=mysql://<prefix>.root:<password>@gateway01.<region>.prod.aws.tidbcloud.com:4000/hospital_pms?ssl={"rejectUnauthorized":true}
> ```

---

## 🚀 Step-by-Step Installation & Setup

### Prerequisites
* **Node.js** (v18.x or later)
* **npm** (v9.x or later)
* **Git**
* Either **MySQL Server 8.x** (local) OR a free account on **[TiDB Cloud](https://tidbcloud.com)**.

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/Sparky-06/DBMS_HospitalManagementSystem.git
cd DBMS_HospitalManagementSystem
```

---

### Step 2: Choose and Run Your Preferred Backend

#### Option A: Running with Local MySQL
1. Open your MySQL client (CLI, Workbench, or DBeaver) and run the SQL scripts:
   ```bash
   mysql -u root -p < sql/schema.sql
   mysql -u root -p < sql/seed.sql
   ```
2. Configure `backend/.env` with your MySQL root password.
3. Start the backend:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

#### Option B: Running with TiDB Cloud
1. Sign up at [TiDB Cloud](https://tidbcloud.com/) and create a free **TiDB Serverless** cluster.
2. In TiDB Cloud, click **Connect** → choose **Node.js** or **SQL Client** → copy Host, User (with prefix), and Password.
3. Configure `tidb_backend/.env` with your credentials.
4. Verify connection and run automated cloud database migrations:
   ```bash
   cd tidb_backend
   npm install

   # Test connection to TiDB Cloud
   npm run db:test

   # Create all 13 schema tables in TiDB Cloud
   npm run db:init

   # Seed sample hospital records in TiDB Cloud
   npm run db:seed
   ```
5. Start the backend:
   ```bash
   npm run dev
   ```

---

### Step 3: Start the Frontend (Zero Changes Needed)
Open a new terminal window:

```bash
cd frontend
npm install
npm run dev
```

Open **`http://localhost:5173`** in your browser.  
The frontend connects to `http://localhost:5000/api` and works identically with whichever backend is running!

---

## 🧪 Automated Testing

Both backend folders have independent, zero-dependency Jest test suites verifying input validation, business logic, foreign key constraints, and contract envelopes:

```bash
# To test the Local MySQL Backend:
cd backend
npm test

# To test the TiDB Cloud Backend:
cd tidb_backend
npm test
```

All 12 test suites execute across health endpoints, employee salaries, patient dates of birth, room capacities, and specialized disjoint ISA constraints.

---

## 🗄️ Database Design & Schema Entities

The relational database models the complete hospital operational workflow across 13 normalized tables:

```text
┌──────────────┐       1:N       ┌───────────────┐
│   employee   │────────────────<│employee_phone │
└──────┬───────┘                 └───────────────┘
       │ (Disjoint ISA)
       ├─────────────────────────────────┐
       ▼                                 ▼
┌──────────────┐                 ┌───────────────┐
│    doctor    │                 │     nurse     │
└──────┬───────┘                 └───────┬───────┘
       │                                 │
       │ M:N (consults)                  │ M:N (governs)
       ▼                                 ▼
┌──────────────┐                 ┌───────────────┐
│   patient    │                 │     room      │
└──────┬───────┘                 └───────┬───────┘
       │                                 │
       ├────────────── 1:N ──────────────┘ (assigned)
       │
       ├────────────── 1:N ──────────────> patient_phone
       ├────────────── 1:N ──────────────> patient_allergy
       ├────────────── 1:N ──────────────> bills
       └────────────── 1:N ──────────────> test_report
```

### Table Summary
1. **`employee`**: Base staff entity (`Emp_ID`, names, address, DOB, salary).
2. **`employee_phone`**: Multivalued phone numbers for employees.
3. **`doctor`**: Specialization of employee (`Department`, `Qualification`).
4. **`nurse`**: Specialization of employee.
5. **`patient`**: Patient records with derived age computed dynamically on retrieval.
6. **`patient_phone`**: Multivalued contact numbers for patients.
7. **`patient_allergy`**: Multivalued allergy tracking (e.g. Penicillin, Peanuts).
8. **`room`**: Hospital wards and rooms with capacity and availability constraints.
9. **`consults`**: Many-to-many relationship linking doctors and patients with appointment date and time.
10. **`assigned`**: Patient-to-room inpatient admissions.
11. **`governs`**: Nurse room supervision with shift tracking (`Morning`, `Evening`, `Night`).
12. **`bills`**: Weak billing entity linked to patient with payment statuses (`Pending`, `Paid`, `Cancelled`).
13. **`test_report`**: Laboratory and clinical diagnostics linked to patient.

---

## 🔐 Data Integrity & Normalization

* **Entity Integrity**: Primary keys enforced on all tables (e.g. `Emp_ID`, `P_ID`, `R_ID`).
* **Referential Integrity**: Cascading and restrictive foreign key constraints across all relationships.
* **Domain & Check Constraints**: `Salary >= 0`, `Capacity > 0`, `Amount >= 0`, and ENUM validations.
* **Derived Attribute Integrity**: Patient and employee age is dynamically calculated using `TIMESTAMPDIFF(YEAR, DOB, CURDATE())` and never redundantly stored.
* **Normalization**: Decomposed to **BCNF (Boyce-Codd Normal Form)** to eliminate update, insertion, and deletion anomalies.

---

## 🛠️ Common Troubleshooting

### 1. `Access denied ... See user-name-prefix` (TiDB Cloud)
* **Cause**: On TiDB Cloud Serverless, your username must include the cluster prefix (e.g. `4N11eXuAaoDrgrt.root`).
* **Fix**: Check `tidb_backend/.env` and ensure `DB_USER` contains your full username prefix from the TiDB Cloud console.

### 2. Frontend shows `Network Error`
* **Cause**: The backend server is not running on port 5000.
* **Fix**: Ensure `npm run dev` is active in either `backend/` or `tidb_backend/`.

### 3. Frontend shows `No matching records found`
* **Cause**: The database tables exist, but no seed data has been loaded.
* **Fix**: Run `npm run db:seed` in `tidb_backend/` (or run `sql/seed.sql` on your local MySQL).

---

## 👥 Course & Project Information

* **Project Title:** CareFlow Hospital Patient Management System (HPMS)
* **Course:** Database Management Systems (DBMS)
* **Repository:** [Sparky-06/DBMS_HospitalManagementSystem](https://github.com/Sparky-06/DBMS_HospitalManagementSystem)
* **License:** Developed for academic and educational purposes.
