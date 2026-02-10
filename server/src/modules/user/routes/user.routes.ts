import { Router } from 'express';
import { protect, authorize } from '../../../middlewares/auth.middelware';
import {
  getProfile,
  updateProfile,
  uploadIDProof,
  reviewIDVerification,
  getPendingVerifications,
  addEmergencyContact,
  getEmergencyContacts,
  updateEmergencyContact,
  deleteEmergencyContact,
} from '../controller/user.controller.js';

const router = Router();

router.use(protect);

// Female user profile
router.get('/profile', authorize('FEMALE_USER'), getProfile);
router.put('/profile', authorize('FEMALE_USER'), updateProfile);
router.post('/id-proof', authorize('FEMALE_USER'), uploadIDProof);

// Emergency contacts
router.post('/emergency-contacts', authorize('FEMALE_USER'), addEmergencyContact);
router.get('/emergency-contacts', authorize('FEMALE_USER'), getEmergencyContacts);
router.put('/emergency-contacts/:id', authorize('FEMALE_USER'), updateEmergencyContact);
router.delete('/emergency-contacts/:id', authorize('FEMALE_USER'), deleteEmergencyContact);

// Super admin — ID verification review
router.get('/pending-verifications', authorize('SUPER_ADMIN'), getPendingVerifications);
router.patch('/:userId/review-id', authorize('SUPER_ADMIN'), reviewIDVerification);

export default router;