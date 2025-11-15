const { supabase } = require('../config/supabaseClient');

// GET /api/reviews/movie/:movieId
async function listReviewsByMovie(req, res) {
  const { movieId } = req.params;

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, updated_at, user_id')
      .eq('movie_id', movieId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error listing reviews:', error);
      return res.status(500).json({ message: 'Error al obtener reseñas' });
    }

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: 'Error interno al listar reseñas', error: err.message });
  }
}

// POST /api/reviews/movie/:movieId (auth)
async function createReview(req, res) {
  const { movieId } = req.params;
  const { rating, comment } = req.body;

  if (!rating) {
    return res.status(400).json({ message: 'rating es requerido' });
  }

  const numericRating = Number(rating);
  if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ message: 'rating debe estar entre 1 y 5' });
  }

  const userId = req.user.sub;

  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        movie_id: movieId,
        user_id: userId,
        rating: numericRating,
        comment: comment || null
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating review:', error);
      return res.status(500).json({ message: 'Error al crear reseña' });
    }

    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ message: 'Error interno al crear reseña', error: err.message });
  }
}

// PUT /api/reviews/:id (auth, owner)
async function updateReview(req, res) {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.sub;

  try {
    // Verificar que la reseña pertenece al usuario
    const { data: existing, error: fetchError } = await supabase
      .from('reviews')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ message: 'Reseña no encontrada' });
    }

    if (existing.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No puedes editar esta reseña' });
    }

    const updateData = { updated_at: new Date().toISOString() };

    if (rating !== undefined) {
      const numericRating = Number(rating);
      if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({ message: 'rating debe estar entre 1 y 5' });
      }
      updateData.rating = numericRating;
    }

    if (comment !== undefined) {
      updateData.comment = comment;
    }

    const { data, error } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating review:', error);
      return res.status(500).json({ message: 'Error al actualizar reseña' });
    }

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: 'Error interno al actualizar reseña', error: err.message });
  }
}

// DELETE /api/reviews/:id (auth, owner o admin)
async function deleteReview(req, res) {
  const { id } = req.params;
  const userId = req.user.sub;

  try {
    const { data: existing, error: fetchError } = await supabase
      .from('reviews')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ message: 'Reseña no encontrada' });
    }

    if (existing.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No puedes eliminar esta reseña' });
    }

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting review:', error);
      return res.status(500).json({ message: 'Error al eliminar reseña' });
    }

    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ message: 'Error interno al eliminar reseña', error: err.message });
  }
}

module.exports = {
  listReviewsByMovie,
  createReview,
  updateReview,
  deleteReview
};
