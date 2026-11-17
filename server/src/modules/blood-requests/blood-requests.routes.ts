import { Router } from 'express';
import { bloodRequestsController } from './blood-requests.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createBloodRequestSchema } from './blood-requests.validator';

const router = Router();

// Public routes for viewing emergency requests
router.get('/', bloodRequestsController.listRequests);
router.get('/:id', bloodRequestsController.getRequestById);

// Protected route for posting new blood requests
router.post('/', authenticate, validate(createBloodRequestSchema), bloodRequestsController.createRequest);

export default router;
