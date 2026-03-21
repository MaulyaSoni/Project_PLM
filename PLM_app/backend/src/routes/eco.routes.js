const express = require('express');
const {
  getAllECOs,
  getECOById,
  createECO,
  updateECO,
  deleteECO,
  submitForReview,
  approveECO,
  rejectECO,
  applyECO,
} = require('../controllers/eco.controller');
const { authenticate } = require('../middleware/auth');
const { authorize, ROLES } = require('../middleware/roles');

const router = express.Router();

router.get('/', authenticate, getAllECOs);
router.get('/:id', authenticate, getECOById);
router.post('/', authenticate, authorize([ROLES.ADMIN, ROLES.ENGINEERING]), createECO);
router.patch('/:id', authenticate, authorize([ROLES.ADMIN, ROLES.ENGINEERING]), updateECO);
router.delete('/:id', authenticate, authorize([ROLES.ADMIN], 'Only admins can delete ECOs'), deleteECO);

router.post('/:id/submit', authenticate, authorize([ROLES.ADMIN, ROLES.ENGINEERING]), submitForReview);

router.post('/:id/approve', authenticate, authorize([ROLES.ADMIN, ROLES.APPROVER]), approveECO);
router.patch('/:id/approve', authenticate, authorize([ROLES.ADMIN, ROLES.APPROVER]), approveECO);

router.post('/:id/reject', authenticate, authorize([ROLES.ADMIN, ROLES.APPROVER]), rejectECO);
router.patch('/:id/reject', authenticate, authorize([ROLES.ADMIN, ROLES.APPROVER]), rejectECO);

router.post('/:id/apply', authenticate, authorize([ROLES.ADMIN, ROLES.ENGINEERING]), applyECO);
router.patch('/:id/apply', authenticate, authorize([ROLES.ADMIN, ROLES.ENGINEERING]), applyECO);

module.exports = router;
