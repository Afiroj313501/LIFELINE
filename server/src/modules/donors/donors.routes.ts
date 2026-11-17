import { Router } from 'express';
import { donorsController } from './donors.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  updateDonorProfileSchema,
  toggleAvailabilitySchema,
} from './donors.validator';

const router = Router();

// Public discovery endpoint: Patients / public can find compatible donors in their area
router.get('/search', donorsController.searchDonors);

// Protected donor profile management routes
router.use(authenticate);

router.get('/me', donorsController.getMyProfile);
router.put('/me', validate(updateDonorProfileSchema), donorsController.updateMyProfile);
router.patch('/me/availability', validate(toggleAvailabilitySchema), donorsController.updateAvailability);

export default router;
