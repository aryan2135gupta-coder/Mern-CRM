import express from 'express';
import {
  createLead,
  deleteLead,
  getLead,
  getLeads,
  getLeadStats,
  updateLead,
  exportLeads,
  importLeads,
  addTask,
  toggleTask,
  deleteTask,
  getLeadAiInsightsController
} from '../controllers/leadController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createLeadValidator,
  leadIdValidator,
  listLeadsValidator,
  updateLeadValidator
} from '../validators/leadValidators.js';

const router = express.Router();

router.use(protect);

router.get('/stats', getLeadStats);
router.get('/export', exportLeads);
router.post('/import', authorize('admin'), importLeads);
router.get('/:id/ai-insights', leadIdValidator, validateRequest, getLeadAiInsightsController);

router
  .route('/')
  .get(listLeadsValidator, validateRequest, getLeads)
  .post(createLeadValidator, validateRequest, createLead);

router
  .route('/:id')
  .get(leadIdValidator, validateRequest, getLead)
  .patch(updateLeadValidator, validateRequest, updateLead)
  .delete(leadIdValidator, validateRequest, deleteLead);

router.post('/:id/tasks', leadIdValidator, validateRequest, addTask);
router.patch('/:id/tasks/:taskId', leadIdValidator, validateRequest, toggleTask);
router.delete('/:id/tasks/:taskId', leadIdValidator, validateRequest, deleteTask);

export default router;
