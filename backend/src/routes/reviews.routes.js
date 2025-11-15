const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const checkBanned = require('../middleware/checkBanned');
const reviewsController = require('../controllers/reviews.controller');

const router = express.Router();

router.get('/movie/:movieId', reviewsController.listReviewsByMovie);
router.post('/movie/:movieId', authMiddleware, checkBanned, reviewsController.createReview);
router.put('/:id', authMiddleware, checkBanned, reviewsController.updateReview);
router.delete('/:id', authMiddleware, checkBanned, reviewsController.deleteReview);

module.exports = router;
