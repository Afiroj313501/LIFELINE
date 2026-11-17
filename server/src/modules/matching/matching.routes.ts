import { Router } from 'express';
import { matchingController } from './matching.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Protected matching endpoints
router.get('/requests/:requestId', authenticate, matchingController.getMatchingDonors);
router.get('/:requestId', authenticate, matchingController.getMatchingDonors);

export default router;
