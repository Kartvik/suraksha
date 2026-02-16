import { Router } from 'express';
import { protect, authorize } from '../../../middlewares/auth.middelware.js';
import {
  triggerSOS,
  acceptSOS,
  updateSOSStatus,
  getSOSHistory,
  getActiveSOSForStation,
} from '../controller/sos.controller.js';

const router = Router();

router.use(protect);

// Female user
router.post('/trigger', authorize('FEMALE_USER'), triggerSOS);
router.get('/history', authorize('FEMALE_USER'), getSOSHistory);

// Officer
router.patch('/:id/accept', authorize('POLICE_OFFICER'), acceptSOS);
router.patch('/:id/status', authorize('POLICE_OFFICER'), updateSOSStatus);
router.get('/station/active', authorize('POLICE_OFFICER', 'STATION_ADMIN'), getActiveSOSForStation);

export default router;