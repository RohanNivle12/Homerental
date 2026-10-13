import { Router } from 'express';
import {
  getStates,
  getDistricts,
  getSubdistricts,
  getVillages,
  searchLocations,
  lookupPincode,
  importLocations,
} from '../controllers/locationController';
import { geocodeAddress } from '../controllers/geocodingController';
import { authenticate, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/states', getStates);
router.get('/districts', getDistricts);
router.get('/subdistricts', getSubdistricts);
router.get('/villages', getVillages);
router.get('/search', searchLocations);
router.get('/pincode/:pincode', lookupPincode);
router.get('/geocode', geocodeAddress);
router.post('/import', authenticate, requireRole('ADMIN'), importLocations);

export default router;
