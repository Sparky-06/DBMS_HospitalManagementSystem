-- Hospital Patient Management System (HPMS) Database Schema
-- MySQL 8.x Compatible (InnoDB Engine)
-- Character Set: utf8mb4, Collation: utf8mb4_unicode_ci

CREATE DATABASE IF NOT EXISTS hospital_pms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hospital_pms;

-- Disable foreign key checks during schema creation / drop
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS test_report;
DROP TABLE IF EXISTS bills;
DROP TABLE IF EXISTS governs;
DROP TABLE IF EXISTS assigned;
DROP TABLE IF EXISTS consults;
DROP TABLE IF EXISTS room;
DROP TABLE IF EXISTS patient_allergy;
DROP TABLE IF EXISTS patient_phone;
DROP TABLE IF EXISTS patient;
DROP TABLE IF EXISTS nurse;
DROP TABLE IF EXISTS doctor;
DROP TABLE IF EXISTS employee_phone;
DROP TABLE IF EXISTS employee;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. EMPLOYEE: Base entity for hospital staff
-- Note: Age is derived (from DOB) and is strictly NOT stored in the table.
CREATE TABLE employee (
    Emp_ID VARCHAR(20) NOT NULL,
    FName VARCHAR(50) NOT NULL,
    MName VARCHAR(50) DEFAULT NULL,
    LName VARCHAR(50) NOT NULL,
    City VARCHAR(100) NOT NULL,
    State VARCHAR(100) NOT NULL,
    DOB DATE NOT NULL,
    Salary DECIMAL(12, 2) NOT NULL CHECK (Salary >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (Emp_ID),
    INDEX idx_emp_name (LName, FName)
) ENGINE=InnoDB;

-- 2. EMPLOYEE_PHONE: Multivalued phone numbers for employees
CREATE TABLE employee_phone (
    Emp_ID VARCHAR(20) NOT NULL,
    Mob_No VARCHAR(20) NOT NULL,
    PRIMARY KEY (Emp_ID, Mob_No),
    CONSTRAINT fk_employee_phone_emp
        FOREIGN KEY (Emp_ID) REFERENCES employee(Emp_ID)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 3. DOCTOR: Specialization of employee (Disjoint ISA)
CREATE TABLE doctor (
    Emp_ID VARCHAR(20) NOT NULL,
    Department VARCHAR(100) NOT NULL,
    Qualification VARCHAR(150) NOT NULL,
    PRIMARY KEY (Emp_ID),
    INDEX idx_doc_dept (Department),
    CONSTRAINT fk_doctor_emp
        FOREIGN KEY (Emp_ID) REFERENCES employee(Emp_ID)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 4. NURSE: Specialization of employee (Disjoint ISA)
CREATE TABLE nurse (
    Emp_ID VARCHAR(20) NOT NULL,
    PRIMARY KEY (Emp_ID),
    CONSTRAINT fk_nurse_emp
        FOREIGN KEY (Emp_ID) REFERENCES employee(Emp_ID)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 5. PATIENT: Core patient entity
-- Note: Age is derived (from DOB) and is strictly NOT stored in the table.
CREATE TABLE patient (
    P_ID VARCHAR(20) NOT NULL,
    FName VARCHAR(50) NOT NULL,
    MName VARCHAR(50) DEFAULT NULL,
    LName VARCHAR(50) NOT NULL,
    Gender ENUM('Male', 'Female', 'Other') NOT NULL,
    DOB DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (P_ID),
    INDEX idx_patient_name (LName, FName),
    INDEX idx_patient_dob (DOB)
) ENGINE=InnoDB;

-- 6. PATIENT_PHONE: Multivalued phone numbers for patients
CREATE TABLE patient_phone (
    P_ID VARCHAR(20) NOT NULL,
    Phone VARCHAR(20) NOT NULL,
    PRIMARY KEY (P_ID, Phone),
    CONSTRAINT fk_patient_phone_patient
        FOREIGN KEY (P_ID) REFERENCES patient(P_ID)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 7. PATIENT_ALLERGY: Multivalued allergies for patients
CREATE TABLE patient_allergy (
    P_ID VARCHAR(20) NOT NULL,
    Allergy VARCHAR(100) NOT NULL,
    PRIMARY KEY (P_ID, Allergy),
    CONSTRAINT fk_patient_allergy_patient
        FOREIGN KEY (P_ID) REFERENCES patient(P_ID)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 8. ROOM: Hospital rooms
CREATE TABLE room (
    R_ID VARCHAR(20) NOT NULL,
    Availability BOOLEAN NOT NULL DEFAULT TRUE,
    Capacity INT NOT NULL CHECK (Capacity > 0),
    Type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (R_ID),
    INDEX idx_room_type (Type),
    INDEX idx_room_availability (Availability)
) ENGINE=InnoDB;

-- 9. CONSULTS: Doctor M:N Patient with Date and Time
CREATE TABLE consults (
    Emp_ID VARCHAR(20) NOT NULL,
    P_ID VARCHAR(20) NOT NULL,
    Consultation_Date DATE NOT NULL,
    Consultation_Time TIME NOT NULL,
    Notes TEXT DEFAULT NULL,
    PRIMARY KEY (Emp_ID, P_ID, Consultation_Date, Consultation_Time),
    INDEX idx_consults_date (Consultation_Date),
    INDEX idx_consults_patient (P_ID),
    CONSTRAINT fk_consults_doctor
        FOREIGN KEY (Emp_ID) REFERENCES doctor(Emp_ID)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_consults_patient
        FOREIGN KEY (P_ID) REFERENCES patient(P_ID)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 10. ASSIGNED: Patient N:1 Room relationship
CREATE TABLE assigned (
    P_ID VARCHAR(20) NOT NULL,
    R_ID VARCHAR(20) NOT NULL,
    Assigned_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (P_ID, R_ID),
    INDEX idx_assigned_room (R_ID),
    CONSTRAINT fk_assigned_patient
        FOREIGN KEY (P_ID) REFERENCES patient(P_ID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_assigned_room
        FOREIGN KEY (R_ID) REFERENCES room(R_ID)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 11. GOVERNS: Nurse M:N Room with Shift attribute
CREATE TABLE governs (
    Emp_ID VARCHAR(20) NOT NULL,
    R_ID VARCHAR(20) NOT NULL,
    Shift ENUM('Morning', 'Evening', 'Night') NOT NULL,
    PRIMARY KEY (Emp_ID, R_ID, Shift),
    INDEX idx_governs_shift (Shift),
    INDEX idx_governs_room (R_ID),
    CONSTRAINT fk_governs_nurse
        FOREIGN KEY (Emp_ID) REFERENCES nurse(Emp_ID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_governs_room
        FOREIGN KEY (R_ID) REFERENCES room(R_ID)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 12. BILLS: Weak entity with partial key B_ID (composite PK: P_ID, B_ID)
CREATE TABLE bills (
    P_ID VARCHAR(20) NOT NULL,
    B_ID VARCHAR(20) NOT NULL,
    Amount DECIMAL(12, 2) NOT NULL CHECK (Amount >= 0),
    Status ENUM('Pending', 'Paid', 'Cancelled') NOT NULL DEFAULT 'Pending',
    Bill_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (P_ID, B_ID),
    INDEX idx_bills_status (Status),
    CONSTRAINT fk_bills_patient
        FOREIGN KEY (P_ID) REFERENCES patient(P_ID)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 13. TEST_REPORT: Weak entity with partial key Test_ID (composite PK: P_ID, Test_ID)
CREATE TABLE test_report (
    P_ID VARCHAR(20) NOT NULL,
    Test_ID VARCHAR(20) NOT NULL,
    Test_Type VARCHAR(100) NOT NULL,
    Result TEXT NOT NULL,
    Report_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (P_ID, Test_ID),
    INDEX idx_test_report_type (Test_Type),
    CONSTRAINT fk_test_report_patient
        FOREIGN KEY (P_ID) REFERENCES patient(P_ID)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
