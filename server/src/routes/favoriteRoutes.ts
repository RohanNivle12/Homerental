import { Router } from 'express';
import {
  getFavorites,
  addFavorite,
  removeFavorite,
} from '../controllers/favoriteController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticate, getFavorites);
router.post('/:propertyId', authenticate, addFavorite);
router.delete('/:propertyId', authenticate, removeFavorite);

export default router;
