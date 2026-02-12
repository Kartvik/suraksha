import { Router } from 'express';
import { protect, authorize } from '../../../middlewares/auth.middelware.js';
import {
  createOfficer,
  verifyOfficerOTP,
  resendOTP,
  getOfficersByStation,
  getOfficerById,
  updateOfficer,
  toggleDutyStatus,
  retireOfficer,
  deleteOfficer,
  transferOfficer,
} from '../controller/officer.controller.js';

const router = Router();

router.use(protect);

// Public to logged in officers — verify their own OTP
router.post('/verify-otp', verifyOfficerOTP);

// Station admin manages their officers
router.post('/', authorize('STATION_ADMIN'), createOfficer);
router.get('/', authorize('STATION_ADMIN', 'SUPER_ADMIN'), getOfficersByStation);
router.get('/:id', authorize('STATION_ADMIN', 'SUPER_ADMIN', 'POLICE_OFFICER'), getOfficerById);
router.put('/:id', authorize('STATION_ADMIN'), updateOfficer);
router.patch('/:id/duty', authorize('STATION_ADMIN'), toggleDutyStatus);
router.patch('/:id/resend-otp', authorize('STATION_ADMIN'), resendOTP);
router.patch('/:id/retire', authorize('STATION_ADMIN', 'SUPER_ADMIN'), retireOfficer);

// Super admin only
router.delete('/:id', authorize('SUPER_ADMIN'), deleteOfficer);
router.patch('/:id/transfer', authorize('SUPER_ADMIN'), transferOfficer);

export default router;