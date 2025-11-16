const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const moviesRoutes = require('./routes/movies.routes');
const reviewsRoutes = require('./routes/reviews.routes');
const favoritesRoutes = require('./routes/favorites.routes');
const adminRoutes = require('./routes/admin.routes');
const profileRoutes = require('./routes/profile.routes');

const app = express();

// Configuración de CORS
const corsOptions = {
  origin: ['http://localhost:4200', 'http://localhost:4000', 'https://cinenoir-api.onrender.com'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Endpoint de salud simple
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/movies', moviesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);

module.exports = app;
