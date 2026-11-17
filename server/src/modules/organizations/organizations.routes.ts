import { Router } from 'express';
import { organizationsController } from './organizations.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  createOrganizationSchema,
  addMemberSchema,
} from './organizations.validator';

const router = Router();

// Public routes
router.get('/', organizationsController.listOrganizations);
router.get('/:id', organizationsController.getOrganizationById);

// Protected routes
router.post(
  '/',
  authenticate,
  validate(createOrganizationSchema),
  organizationsController.createOrganization
);

router.get('/:id/dashboard', authenticate, organizationsController.getOrganizationDashboard);

router.post(
  '/:id/members',
  authenticate,
  validate(addMemberSchema),
  organizationsController.addMember
);

router.delete('/:id/members/:memberId', authenticate, organizationsController.removeMember);

export default router;
