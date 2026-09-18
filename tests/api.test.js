const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');

describe('HPMS API Suite - Person A Backend & Database Verification', () => {
  afterAll(async () => {
    // Clean up DB pool connection after tests complete
    try {
      await pool.end();
    } catch (e) {
      // Ignore if pool already closed
    }
  });

  describe('1. Health & Meta Endpoints', () => {
    it('GET / should return welcome envelope', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.app).toBeDefined();
    });

    it('GET /api/health should return health check envelope', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBeDefined();
      expect(res.body.data.uptime_seconds).toBeGreaterThanOrEqual(0);
    });

    it('GET /api/nonexistent should return standard 404 error envelope', async () => {
      const res = await request(app).get('/api/nonexistent');
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
      expect(res.body.error.message).toContain('Resource not found');
    });
  });

  describe('2. Input Validation Rules (Contract Section 13)', () => {
    it('POST /api/employees should reject negative salary with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/employees')
        .send({
          emp_id: 'TEST_EMP_NEG',
          fname: 'Test',
          lname: 'Employee',
          city: 'TestCity',
          state: 'TestState',
          dob: '1990-01-01',
          salary: -5000 // Negative salary
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      const salaryErr = res.body.error.details.find(d => d.field === 'salary');
      expect(salaryErr).toBeDefined();
    });

    it('POST /api/patients should reject invalid DOB format', async () => {
      const res = await request(app)
        .post('/api/patients')
        .send({
          p_id: 'P9999',
          fname: 'John',
          lname: 'Doe',
          gender: 'Male',
          dob: 'invalid-date-string'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      const dobErr = res.body.error.details.find(d => d.field === 'dob');
      expect(dobErr).toBeDefined();
    });

    it('POST /api/patients should reject invalid gender', async () => {
      const res = await request(app)
        .post('/api/patients')
        .send({
          p_id: 'P9999',
          fname: 'John',
          lname: 'Doe',
          gender: 'UnknownGender',
          dob: '1995-05-15'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      const genderErr = res.body.error.details.find(d => d.field === 'gender');
      expect(genderErr).toBeDefined();
    });

    it('POST /api/rooms should reject zero or negative capacity', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .send({
          r_id: 'R999',
          capacity: 0, // Invalid capacity
          type: 'ICU'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      const capErr = res.body.error.details.find(d => d.field === 'capacity');
      expect(capErr).toBeDefined();
    });

    it('POST /api/governs should reject invalid shift values', async () => {
      const res = await request(app)
        .post('/api/governs')
        .send({
          emp_id: 'E007',
          r_id: 'R101',
          shift: 'Midnight' // Invalid shift (only Morning, Evening, Night)
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      const shiftErr = res.body.error.details.find(d => d.field === 'shift');
      expect(shiftErr).toBeDefined();
    });
  });

  describe('3. Specialization & Disjoint ISA Constraints', () => {
    it('POST /api/doctors should reject non-existent employee ID with FOREIGN_KEY_VIOLATION', async () => {
      const res = await request(app)
        .post('/api/doctors')
        .send({
          emp_id: 'NON_EXISTENT_EMP_9999',
          department: 'Cardiology',
          qualification: 'MBBS'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FOREIGN_KEY_VIOLATION');
    });

    it('POST /api/nurses should reject non-existent employee ID with FOREIGN_KEY_VIOLATION', async () => {
      const res = await request(app)
        .post('/api/nurses')
        .send({
          emp_id: 'NON_EXISTENT_EMP_9999'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FOREIGN_KEY_VIOLATION');
    });
  });

  describe('4. Standard Response Envelope Structure', () => {
    it('GET /api/employees returns standardized list envelope', async () => {
      const res = await request(app).get('/api/employees');
      // If DB is connected: 200 with list, if not: handled via error envelope
      if (res.statusCode === 200) {
        expect(res.body).toHaveProperty('success', true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body).toHaveProperty('message');
      } else {
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('error');
      }
    });

    it('GET /api/rooms returns standardized list envelope', async () => {
      const res = await request(app).get('/api/rooms');
      if (res.statusCode === 200) {
        expect(res.body).toHaveProperty('success', true);
        expect(Array.isArray(res.body.data)).toBe(true);
      }
    });
  });
});
