# Hospital Management System

A full-stack **Hospital Management System** developed as a Database Management Systems (DBMS) project. The system is designed to manage patients, doctors, nurses, appointments, rooms, bills, consultations, test reports, and other hospital operations through a centralized relational database.

The project demonstrates the practical application of **database design, relational mapping, SQL, normalization, constraints, CRUD operations, and a web-based application layer**.

---

## 📌 Project Overview

Managing hospital information manually can lead to data redundancy, inconsistency, and difficulty in retrieving records.

This project provides a centralized system where hospital-related information can be stored and managed using a relational database. The frontend provides the user interface, while the backend exposes REST APIs and communicates with the MySQL database.

### Main Objectives

* Design a structured relational database for hospital management.
* Reduce data redundancy and maintain data consistency.
* Implement relationships between different hospital entities.
* Perform CRUD operations through a web application.
* Provide REST APIs for communication between frontend and database.
* Demonstrate database concepts such as normalization, keys, constraints, and relationships.

---

## 🏗️ System Architecture

```text
┌──────────────────────┐
│      Frontend        │
│      React + Vite    │
└──────────┬───────────┘
           │
           │ HTTP / REST API
           ▼
┌──────────────────────┐
│       Backend        │
│    Node.js + Express │
└──────────┬───────────┘
           │
           │ SQL Queries
           ▼
┌──────────────────────┐
│     MySQL Database   │
│                      │
│  Hospital Database   │
└──────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend

* React
* Vite
* JavaScript
* HTML
* CSS

### Backend

* Node.js
* Express.js
* REST APIs
* Jest / Supertest for testing

### Database

* MySQL
* SQL

### Development Tools

* Git
* GitHub
* npm

---

## 📁 Project Structure

```text
DA2_project/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── tests/
│   │   └── api.test.js
│   │
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── package-lock.json
│   ├── index.html
│   └── vite.config.js
│
├── sql/
│   ├── schema.sql
│   └── seed.sql
│
├── Reference/
│
├── .env.example
├── .gitignore
└── README.md
```

---

## 🗄️ Database

The database is designed as a relational database using MySQL.

The database contains entities representing different aspects of hospital operations, including:

* Patients
* Doctors
* Nurses
* Employees
* Departments
* Rooms
* Consultations
* Appointments
* Bills
* Assignments
* Test Reports

The database uses appropriate:

* Primary Keys
* Foreign Keys
* Candidate/Alternate Keys where applicable
* `NOT NULL` constraints
* `UNIQUE` constraints
* Referential integrity
* Relationship constraints

The database schema is available in:

```text
sql/schema.sql
```

Sample/initial data is provided in:

```text
sql/seed.sql
```

---

## 🔄 Backend

The backend is implemented using **Node.js and Express.js**.

The backend follows a layered structure consisting of:

```text
Routes
   ↓
Controllers
   ↓
Services
   ↓
Database
```

### Controllers

Controllers handle incoming API requests and return appropriate responses.

Examples include controllers for:

* Patients
* Doctors
* Nurses
* Employees
* Bills
* Assignments
* Consultations
* Dashboard
* Rooms
* Test Reports

### Routes

The API routes provide endpoints for interacting with the different entities in the system.

Example structure:

```text
/api/patients
/api/doctors
/api/nurses
/api/rooms
/api/bills
/api/consultations
/api/appointments
```

---

## 🖥️ Frontend

The frontend is built using **React with Vite**.

It provides the user interface for interacting with the hospital management system and communicates with the backend through REST APIs.

The frontend is maintained separately inside:

```text
frontend/
```

---

## 🧪 Testing

The backend contains automated API tests using:

* Jest
* Supertest

Tests are located in:

```text
backend/tests/
```

Run backend tests using:

```bash
npm test
```

---

## ⚙️ Installation & Setup

### Prerequisites

Make sure the following are installed:

* Node.js
* npm
* MySQL
* Git

---

### 1. Clone the Repository

```bash
git clone https://github.com/Sparky-06/DBMS_HospitalManagementSystem.git
cd DBMS_HospitalManagementSystem
```

---

### 2. Set Up the Database

Create a MySQL database and execute the schema:

```text
sql/schema.sql
```

Then populate the database using:

```text
sql/seed.sql
```

---

### 3. Configure Environment Variables

Create a `.env` file using the provided example:

```bash
cp .env.example .env
```

Update the database configuration according to your local MySQL setup.

---

### 4. Start the Backend

```bash
cd backend
npm install
npm start
```

For development:

```bash
npm run dev
```

---

### 5. Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server will provide the local URL in the terminal.

---

## 🔐 Data Integrity & Database Design

The project focuses on maintaining data integrity through relational database principles.

The database design considers:

### Entity Integrity

Each major entity has a primary key that uniquely identifies its records.

### Referential Integrity

Foreign keys are used to maintain valid relationships between related tables.

### Domain Integrity

Appropriate data types and constraints are used to ensure that attributes contain valid values.

### Normalization

The database design was analyzed through:

```text
1NF
 ↓
2NF
 ↓
3NF
 ↓
BCNF
```

The purpose of normalization is to reduce:

* Data redundancy
* Update anomalies
* Insert anomalies
* Delete anomalies

while maintaining meaningful relationships between entities.

---

## 🔗 Database Relationships

The system models relationships between major hospital entities such as:

```text
Patient ─────── Appointment ─────── Doctor
   │                                   │
   │                                   │
   └────── Consultation ───────────────┘

Patient ───────── Bill

Patient ───────── Test Report

Doctor ────────── Department

Patient ───────── Room / Assignment
```

The exact relationships and constraints are defined in the database schema.

---

## 📊 DBMS Concepts Demonstrated

This project demonstrates practical implementation of several DBMS concepts:

* Entity-Relationship modeling
* EER diagram
* Relational schema
* Primary keys
* Foreign keys
* Candidate keys
* Functional dependencies
* Normalization
* 1NF
* 2NF
* 3NF
* BCNF
* Referential integrity
* Domain constraints
* SQL DDL
* SQL DML
* CRUD operations
* Joins
* Relational mapping
* Database-driven application development
* API-based database interaction

---

## 🚀 Key Features

* Patient management
* Doctor management
* Nurse and employee management
* Appointment management
* Consultation management
* Room management
* Assignment management
* Billing management
* Test report management
* Hospital dashboard
* REST API backend
* MySQL database integration
* Relational data management
* Automated backend API testing

---

## 👥 Project

**Project:** Hospital Management System

**Course:** Database Management Systems (DBMS)

**Repository:**
Sparky-06/DBMS_HospitalManagementSystem

The project was developed as an academic DBMS application to demonstrate how database concepts can be integrated into a functional full-stack system.

---

## 📚 References

The `Reference/` directory contains supporting material and references used during the development of the project.

---

## 📄 License

This project was developed for **academic and educational purposes** as part of a Database Management Systems course.

