const express = require('express');
const {
  getAllECOs,
  getECOById,
  createECO,
  submitForReview,
  approveECO,
  rejectECO,
  applyECO,
} = require('../controllers/eco.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

const router = express.Router();

router.get('/', authenticate, getAllECOs);
router.get('/:id', authenticate, getECOById);
router.post('/', authenticate, authorize('ADMIN', 'ENGINEERING'), createECO);
router.post('/:id/submit', authenticate, authorize('ADMIN', 'ENGINEERING'), submitForReview);
router.post('/:id/approve', authenticate, authorize('ADMIN', 'APPROVER'), approveECO);
router.post('/:id/reject', authenticate, authorize('ADMIN', 'APPROVER'), rejectECO);
router.post('/:id/apply', authenticate, authorize('ADMIN', 'ENGINEERING'), applyECO);

module.exports = router;
