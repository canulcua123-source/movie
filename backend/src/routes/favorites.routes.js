const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const checkBanned = require('../middleware/checkBanned');
const favoritesController = require('../controllers/favorites.controller');

const router = express.Router();

router.get('/me', authMiddleware, checkBanned, favoritesController.listMyFavorites);
router.post('/movie/:movieId', authMiddleware, checkBanned, favoritesController.addFavorite);
router.delete('/movie/:movieId', authMiddleware, checkBanned, favoritesController.removeFavorite);
router.get('/movie/:movieId', authMiddleware, checkBanned, favoritesController.checkFavorite);

module.exports = router;
