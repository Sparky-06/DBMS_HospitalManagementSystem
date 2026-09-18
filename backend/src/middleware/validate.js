const { validationResult, body, param, query } = require('express-validator');

/**
 * Middleware to check validation result and return standard error envelope
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedDetails = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: formattedDetails
      }
    });
  }
  next();
}

// Reusable Validators
const employeeValidators = {
  create: [
    body('emp_id').trim().notEmpty().withMessage('Employee ID (emp_id) is required'),
    body('fname').trim().notEmpty().withMessage('First name (fname) is required'),
    body('lname').trim().notEmpty().withMessage('Last name (lname) is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('state').trim().notEmpty().withMessage('State is required'),
    body('dob').isISO8601().withMessage('DOB must be a valid date in YYYY-MM-DD format'),
    body('salary').isFloat({ min: 0 }).withMessage('Salary must be a non-negative number (>= 0)'),
    body('mob_no').optional().isArray().withMessage('mob_no must be an array of phone strings'),
    body('mob_no.*').optional().matches(/^[0-9+ -]{7,15}$/).withMessage('Each phone number must contain valid phone characters'),
    handleValidationErrors
  ],
  update: [
    param('empId').trim().notEmpty().withMessage('Employee ID parameter is required'),
    body('fname').optional().trim().notEmpty().withMessage('First name cannot be empty'),
    body('lname').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
    body('city').optional().trim().notEmpty().withMessage('City cannot be empty'),
    body('state').optional().trim().notEmpty().withMessage('State cannot be empty'),
    body('dob').optional().isISO8601().withMessage('DOB must be a valid date in YYYY-MM-DD format'),
    body('salary').optional().isFloat({ min: 0 }).withMessage('Salary must be a non-negative number (>= 0)'),
    handleValidationErrors
  ]
};

const doctorValidators = {
  create: [
    body('emp_id').trim().notEmpty().withMessage('Employee ID (emp_id) is required'),
    body('department').trim().notEmpty().withMessage('Department is required'),
    body('qualification').trim().notEmpty().withMessage('Qualification is required'),
    handleValidationErrors
  ],
  update: [
    param('empId').trim().notEmpty().withMessage('Employee ID parameter is required'),
    body('department').optional().trim().notEmpty().withMessage('Department cannot be empty'),
    body('qualification').optional().trim().notEmpty().withMessage('Qualification cannot be empty'),
    handleValidationErrors
  ]
};

const nurseValidators = {
  create: [
    body('emp_id').trim().notEmpty().withMessage('Employee ID (emp_id) is required'),
    handleValidationErrors
  ]
};

const patientValidators = {
  create: [
    body('p_id').trim().notEmpty().withMessage('Patient ID (p_id) is required'),
    body('fname').trim().notEmpty().withMessage('First name (fname) is required'),
    body('lname').trim().notEmpty().withMessage('Last name (lname) is required'),
    body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other'),
    body('dob').isISO8601().withMessage('DOB must be a valid date in YYYY-MM-DD format'),
    body('phones').optional().isArray().withMessage('phones must be an array of phone strings'),
    body('phones.*').optional().matches(/^[0-9+ -]{7,15}$/).withMessage('Each phone number must contain valid digits'),
    body('allergies').optional().isArray().withMessage('allergies must be an array of strings'),
    handleValidationErrors
  ],
  update: [
    param('pId').trim().notEmpty().withMessage('Patient ID parameter is required'),
    body('fname').optional().trim().notEmpty().withMessage('First name cannot be empty'),
    body('lname').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
    body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other'),
    body('dob').optional().isISO8601().withMessage('DOB must be a valid date in YYYY-MM-DD format'),
    handleValidationErrors
  ]
};

const roomValidators = {
  create: [
    body('r_id').trim().notEmpty().withMessage('Room ID (r_id) is required'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer (> 0)'),
    body('type').trim().notEmpty().withMessage('Room type is required'),
    body('availability').optional().isBoolean().withMessage('Availability must be boolean'),
    handleValidationErrors
  ],
  update: [
    param('rId').trim().notEmpty().withMessage('Room ID parameter is required'),
    body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be a positive integer (> 0)'),
    body('type').optional().trim().notEmpty().withMessage('Room type cannot be empty'),
    body('availability').optional().isBoolean().withMessage('Availability must be boolean'),
    handleValidationErrors
  ]
};

const consultationValidators = {
  create: [
    body('emp_id').trim().notEmpty().withMessage('Doctor Employee ID (emp_id) is required'),
    body('p_id').trim().notEmpty().withMessage('Patient ID (p_id) is required'),
    body('consultation_date').isISO8601().withMessage('Consultation date must be a valid date (YYYY-MM-DD)'),
    body('consultation_time').matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/).withMessage('Consultation time must be HH:MM or HH:MM:SS'),
    body('notes').optional().isString(),
    handleValidationErrors
  ],
  update: [
    body('notes').notEmpty().withMessage('Notes are required for updating consultation'),
    handleValidationErrors
  ]
};

const assignmentValidators = {
  create: [
    body('p_id').trim().notEmpty().withMessage('Patient ID (p_id) is required'),
    body('r_id').trim().notEmpty().withMessage('Room ID (r_id) is required'),
    handleValidationErrors
  ]
};

const governsValidators = {
  create: [
    body('emp_id').trim().notEmpty().withMessage('Nurse Employee ID (emp_id) is required'),
    body('r_id').trim().notEmpty().withMessage('Room ID (r_id) is required'),
    body('shift').isIn(['Morning', 'Evening', 'Night']).withMessage('Shift must be Morning, Evening, or Night'),
    handleValidationErrors
  ]
};

const billValidators = {
  create: [
    body('b_id').trim().notEmpty().withMessage('Bill ID (b_id) is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a non-negative number (>= 0)'),
    body('status').optional().isIn(['Pending', 'Paid', 'Cancelled']).withMessage('Status must be Pending, Paid, or Cancelled'),
    handleValidationErrors
  ],
  update: [
    body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be non-negative'),
    body('status').optional().isIn(['Pending', 'Paid', 'Cancelled']).withMessage('Status must be Pending, Paid, or Cancelled'),
    handleValidationErrors
  ]
};

const testReportValidators = {
  create: [
    body('test_id').trim().notEmpty().withMessage('Test ID (test_id) is required'),
    body('test_type').trim().notEmpty().withMessage('Test type is required'),
    body('result').trim().notEmpty().withMessage('Result is required'),
    handleValidationErrors
  ],
  update: [
    body('test_type').optional().trim().notEmpty().withMessage('Test type cannot be empty'),
    body('result').optional().trim().notEmpty().withMessage('Result cannot be empty'),
    handleValidationErrors
  ]
};

module.exports = {
  handleValidationErrors,
  employeeValidators,
  doctorValidators,
  nurseValidators,
  patientValidators,
  roomValidators,
  consultationValidators,
  assignmentValidators,
  governsValidators,
  billValidators,
  testReportValidators
};
