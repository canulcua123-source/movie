const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');
const moviesController = require('../controllers/movies.controller');

const router = express.Router();

router.get('/', moviesController.listMovies);
router.get('/:id', moviesController.getMovieById);
router.post('/', authMiddleware, isAdmin, moviesController.createMovie);
router.put('/:id', authMiddleware, isAdmin, moviesController.updateMovie);
router.delete('/:id', authMiddleware, isAdmin, moviesController.deleteMovie);

module.exports = router;
