import { body, param } from 'express-validator';

export const userIdValidator = [
  param('id').isMongoId().withMessage('Please provide a valid user id')
];

export const createUserValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'sales_agent'])
    .withMessage('Role must be admin or sales_agent')
];

export const updateUserValidator = [
  ...userIdValidator,
  body('role')
    .optional()
    .isIn(['admin', 'sales_agent'])
    .withMessage('Role must be admin or sales_agent'),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false')
];
