import Joi from 'joi';

// Common validation patterns
const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\d\s\-\+\(\)]+$/,
  name: /^[a-zA-Z\s\-\.]+$/,
  roomNumber: /^[a-zA-Z0-9\-]+$/,
  idNumber: /^[a-zA-Z0-9\-]+$/
};

// Validation schemas
export const schemas = {
  guest: {
    create: Joi.object({
      name: Joi.string()
        .min(2)
        .max(100)
        .pattern(patterns.name)
        .required()
        .messages({
          'string.pattern.base': 'Name can only contain letters, spaces, hyphens, and dots',
          'string.empty': 'Name is required',
          'string.min': 'Name must be at least 2 characters long'
        }),
      email: Joi.string()
        .email()
        .required()
        .messages({
          'string.email': 'Please provide a valid email address',
          'string.empty': 'Email is required'
        }),
      phone: Joi.string()
        .pattern(patterns.phone)
        .min(10)
        .required()
        .messages({
          'string.pattern.base': 'Phone number can only contain digits, spaces, hyphens, and parentheses',
          'string.min': 'Phone number must be at least 10 digits long'
        }),
      address: Joi.string()
        .max(500)
        .optional()
        .allow(''),
      id_proof: Joi.string()
        .max(100)
        .optional()
        .allow('')
    }),

    update: Joi.object({
      name: Joi.string()
        .min(2)
        .max(100)
        .pattern(patterns.name)
        .optional(),
      email: Joi.string()
        .email()
        .optional(),
      phone: Joi.string()
        .pattern(patterns.phone)
        .min(10)
        .optional(),
      address: Joi.string()
        .max(500)
        .optional()
        .allow(''),
      id_proof: Joi.string()
        .max(100)
        .optional()
        .allow('')
    }).min(1)
  },

  room: {
    create: Joi.object({
      room_number: Joi.string()
        .min(1)
        .max(20)
        .pattern(patterns.roomNumber)
        .required()
        .messages({
          'string.pattern.base': 'Room number can only contain letters, numbers, and hyphens',
          'string.empty': 'Room number is required'
        }),
      room_type: Joi.string()
        .valid('single', 'double', 'suite', 'dorm')
        .required()
        .messages({
          'any.only': 'Room type must be one of: single, double, suite, dorm'
        }),
      capacity: Joi.number()
        .integer()
        .min(1)
        .max(20)
        .required()
        .messages({
          'number.min': 'Capacity must be at least 1',
          'number.max': 'Capacity cannot exceed 20'
        }),
      price_per_night: Joi.number()
        .positive()
        .precision(2)
        .required()
        .messages({
          'number.positive': 'Price per night must be positive',
          'number.precision': 'Price can have maximum 2 decimal places'
        })
    }),

    update: Joi.object({
      room_number: Joi.string()
        .min(1)
        .max(20)
        .pattern(patterns.roomNumber)
        .optional(),
      room_type: Joi.string()
        .valid('single', 'double', 'suite', 'dorm')
        .optional(),
      capacity: Joi.number()
        .integer()
        .min(1)
        .max(20)
        .optional(),
      price_per_night: Joi.number()
        .positive()
        .precision(2)
        .optional(),
      is_available: Joi.boolean()
        .optional()
    }).min(1)
  },

  booking: {
    create: Joi.object({
      guest_id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
          'number.base': 'Guest ID must be a number',
          'number.positive': 'Guest ID must be positive'
        }),
      room_id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
          'number.base': 'Room ID must be a number',
          'number.positive': 'Room ID must be positive'
        }),
      check_in_date: Joi.date()
        .iso()
        .min('now')
        .required()
        .messages({
          'date.min': 'Check-in date cannot be in the past',
          'string.empty': 'Check-in date is required'
        }),
      check_out_date: Joi.date()
        .iso()
        .min(Joi.ref('check_in_date'))
        .required()
        .messages({
          'date.min': 'Check-out date must be after check-in date',
          'string.empty': 'Check-out date is required'
        }),
      total_amount: Joi.number()
        .positive()
        .precision(2)
        .required()
        .messages({
          'number.positive': 'Total amount must be positive',
          'number.precision': 'Amount can have maximum 2 decimal places'
        })
    }),

    update: Joi.object({
      guest_id: Joi.number()
        .integer()
        .positive()
        .optional(),
      room_id: Joi.number()
        .integer()
        .positive()
        .optional(),
      check_in_date: Joi.date()
        .iso()
        .optional(),
      check_out_date: Joi.date()
        .iso()
        .optional(),
      total_amount: Joi.number()
        .positive()
        .precision(2)
        .optional(),
      status: Joi.string()
        .valid('booked', 'checked_in', 'checked_out', 'cancelled')
        .optional()
    }).min(1)
  }
};

// Validation utility functions
export const validate = {
  email: (email) => patterns.email.test(email),
  phone: (phone) => patterns.phone.test(phone) && phone.replace(/\D/g, '').length >= 10,
  name: (name) => patterns.name.test(name) && name.trim().length >= 2,
  roomNumber: (roomNumber) => patterns.roomNumber.test(roomNumber),
  idNumber: (idNumber) => patterns.idNumber.test(idNumber),

  // Validate required fields
  required: (fields) => {
    const errors = [];
    fields.forEach(field => {
      if (!field.value || field.value.toString().trim() === '') {
        errors.push(`${field.name} is required`);
      }
    });
    return errors;
  },

  // Validate field length
  length: (value, min, max, fieldName) => {
    const len = value ? value.toString().length : 0;
    if (len < min) {
      return `${fieldName} must be at least ${min} characters long`;
    }
    if (len > max) {
      return `${fieldName} cannot exceed ${max} characters`;
    }
    return null;
  },

  // Validate date range
  dateRange: (startDate, endDate, fieldName = 'Date range') => {
    if (!startDate || !endDate) {
      return `${fieldName} requires both start and end dates`;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return `${fieldName}: End date must be after start date`;
    }
    return null;
  },

  // Validate future date
  futureDate: (date, fieldName = 'Date') => {
    if (!date) return `${fieldName} is required`;
    const inputDate = new Date(date);
    const now = new Date();
    if (inputDate < now) {
      return `${fieldName} cannot be in the past`;
    }
    return null;
  },

  // Validate positive number
  positiveNumber: (value, fieldName = 'Number') => {
    if (isNaN(value) || parseFloat(value) <= 0) {
      return `${fieldName} must be a positive number`;
    }
    return null;
  },

  // Validate integer
  integer: (value, fieldName = 'Number') => {
    if (isNaN(value) || !Number.isInteger(parseFloat(value))) {
      return `${fieldName} must be an integer`;
    }
    return null;
  },

  // Validate price (positive number with max 2 decimal places)
  price: (value, fieldName = 'Price') => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return `${fieldName} must be a positive number`;
    }
    const decimalPlaces = (num.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      return `${fieldName} can have maximum 2 decimal places`;
    }
    return null;
  }
};

// Error formatting utilities
export const formatErrors = {
  joi: (error) => {
    return error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      type: detail.type
    }));
  },

  custom: (errors) => {
    return errors.map(error => ({
      field: error.field || 'general',
      message: error,
      type: 'custom'
    }));
  }
};

export default {
  schemas,
  validate,
  formatErrors,
  patterns
};
