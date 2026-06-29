import express from 'express';
import { createUser, getAgents, getUsers, updateUser } from '../controllers/userController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createUserValidator, updateUserValidator } from '../validators/userValidators.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/agents', getAgents);
router
  .route('/')
  .get(getUsers)
  .post(createUserValidator, validateRequest, createUser);
router.patch('/:id', updateUserValidator, validateRequest, updateUser);

export default router;
