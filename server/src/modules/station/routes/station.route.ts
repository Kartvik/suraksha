import { Router } from 'express';
import { protect, authorize } from '../../../middlewares/auth.middelware.js';
import {
  createStation,
  getAllStations,
  getStationById,
  updateStation,
  toggleStationStatus,
  createStationAdmin,
  removeStationAdmin,
} from "../controller/station.controller.js";

const router = Router();

router.use(protect);
router.use(authorize('SUPER_ADMIN'));

router.post('/', createStation);
router.get('/', getAllStations);
router.get('/:id', getStationById);
router.put('/:id', updateStation);
router.patch('/:id/toggle-status', toggleStationStatus);
router.post('/create-admin', createStationAdmin);
router.patch('/:id/remove-admin', removeStationAdmin);

export default router;