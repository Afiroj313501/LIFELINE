import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  createReportSchema,
  resolveReportSchema,
  deactivateUserSchema,
} from './admin.validator';
import { Role } from '@prisma/client';

const router = Router();

// Authenticated users can file incident/fraud reports
router.post(
  '/reports',
  authenticate,
  validate(createReportSchema),
  adminController.createReport
);

// Admin-only moderation & security operations
router.use(authenticate, requireRoles(Role.ADMIN));

router.get('/metrics', adminController.getSystemMetrics);
router.get('/reports', adminController.listReports);
router.get('/reports/:id', adminController.getReportById);
router.patch(
  '/reports/:id/resolve',
  validate(resolveReportSchema),
  adminController.resolveReport
);

router.get('/audit-logs', adminController.listAuditLogs);
router.patch(
  '/users/:id/deactivate',
  validate(deactivateUserSchema),
  adminController.deactivateUser
);
router.patch('/users/:id/reactivate', adminController.reactivateUser);

export default router;
