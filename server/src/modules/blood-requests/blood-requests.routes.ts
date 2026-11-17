import { Router } from 'express';
import { bloodRequestsController } from './blood-requests.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  createBloodRequestSchema,
  updateRequestStatusSchema,
  respondToRequestSchema,
} from './blood-requests.validator';

const router = Router();

// Public routes for viewing emergency requests
router.get('/', bloodRequestsController.listRequests);

// Protected requester dashboard (MUST be defined before /:id)
router.get('/me/created', authenticate, bloodRequestsController.getMyRequests);

// Public single request details
router.get('/:id', bloodRequestsController.getRequestById);

// Protected blood request creation
router.post(
  '/',
  authenticate,
  validate(createBloodRequestSchema),
  bloodRequestsController.createRequest
);

// Protected state machine transition
router.patch(
  '/:id/status',
  authenticate,
  validate(updateRequestStatusSchema),
  bloodRequestsController.updateRequestStatus
);

// Protected donor response
router.post(
  '/:id/respond',
  authenticate,
  validate(respondToRequestSchema),
  bloodRequestsController.respondToRequest
);

export default router;
