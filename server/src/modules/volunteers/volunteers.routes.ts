import { Router } from 'express';
import { volunteersController } from './volunteers.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { registerVolunteerSchema } from './volunteers.validator';
import { Role } from '@prisma/client';

const router = Router();

// Public volunteer directory
router.get('/', volunteersController.listVolunteers);

// Protected volunteer routes
router.post(
  '/',
  authenticate,
  validate(registerVolunteerSchema),
  volunteersController.registerVolunteer
);

router.get('/me', authenticate, volunteersController.getMyProfile);
router.get('/me/dashboard', authenticate, volunteersController.getMyDashboard);

// Admin-only verification
router.patch(
  '/:id/verify',
  authenticate,
  requireRoles(Role.ADMIN),
  volunteersController.verifyVolunteer
);

export default router;
