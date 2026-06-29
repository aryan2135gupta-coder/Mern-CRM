import { body, param, query } from 'express-validator';

const mongoIdMessage = 'Please provide a valid MongoDB id';

export const leadIdValidator = [
  param('id').isMongoId().withMessage(mongoIdMessage)
];

export const listLeadsValidator = [
  query('status')
    .optional()
    .isIn(['new', 'contacted', 'converted', 'lost'])
    .withMessage('Status must be new, contacted, converted, or lost'),
  query('agent').optional().isMongoId().withMessage('Agent must be a valid MongoDB id'),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be at least 1'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

export const createLeadValidator = [
  body('name').trim().notEmpty().withMessage('Lead name is required'),
  body('email').isEmail().withMessage('Please provide a valid lead email').normalizeEmail(),
  body('phone').optional().trim().isLength({ max: 30 }).withMessage('Phone is too long'),
  body('source').optional().trim(),
  body('status')
    .optional()
    .isIn(['new', 'contacted', 'converted', 'lost'])
    .withMessage('Status must be new, contacted, converted, or lost'),
  body('assignedAgent')
    .optional()
    .isMongoId()
    .withMessage('Assigned agent must be a valid MongoDB id'),
  body('notes').optional().trim().isLength({ max: 2000 }).withMessage('Notes are too long')
];

export const updateLeadValidator = [
  ...leadIdValidator,
  body('name').optional().trim().notEmpty().withMessage('Lead name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid lead email').normalizeEmail(),
  body('phone').optional().trim().isLength({ max: 30 }).withMessage('Phone is too long'),
  body('source').optional().trim(),
  body('status')
    .optional()
    .isIn(['new', 'contacted', 'converted', 'lost'])
    .withMessage('Status must be new, contacted, converted, or lost'),
  body('assignedAgent').optional().isMongoId().withMessage('Assigned agent must be a valid MongoDB id'),
  body('notes').optional().trim().isLength({ max: 2000 }).withMessage('Notes are too long')
];
