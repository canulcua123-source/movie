const { supabase } = require('../config/supabaseClient');

// GET /api/movies
// Soporta filtros básicos por query: title (q), year, genre
async function listMovies(req, res) {
  const { q, year, genre } = req.query;

  try {
    let query = supabase.from('movies').select('*').order('created_at', { ascending: false });

    if (q) {
      query = query.ilike('title', `%${q}%`);
    }

    if (year) {
      query = query.eq('year', Number(year));
    }

    if (genre) {
      // Busca el género dentro del array genres
      query = query.contains('genres', [genre]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error listing movies:', error);
      return res.status(500).json({ message: 'Error al obtener películas' });
    }

    if (data && data.length > 0) {
      console.log('🎬 Enviando películas. Primera película ID:', data[0].id);
    }

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: 'Error interno al listar películas', error: err.message });
  }
}

// GET /api/movies/:id
async function getMovieById(req, res) {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error getting movie:', error);
      return res.status(404).json({ message: 'Película no encontrada' });
    }

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: 'Error interno al obtener la película', error: err.message });
  }
}

// POST /api/movies (admin)
async function createMovie(req, res) {
  const { title, year, director, genres, synopsis, poster_url } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'title es requerido' });
  }

  try {
    const { data, error } = await supabase
      .from('movies')
      .insert({
        title,
        year: year ? Number(year) : null,
        director: director || null,
        genres: Array.isArray(genres) ? genres : genres ? [genres] : [],
        synopsis: synopsis || null,
        poster_url: poster_url || null
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating movie:', error);
      return res.status(500).json({ message: 'Error al crear película' });
    }

    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ message: 'Error interno al crear película', error: err.message });
  }
}

// PUT /api/movies/:id (admin)
async function updateMovie(req, res) {
  const { id } = req.params;
  const { title, year, director, genres, synopsis, poster_url } = req.body;

  try {
    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (year !== undefined) updateData.year = year ? Number(year) : null;
    if (director !== undefined) updateData.director = director;
    if (genres !== undefined) {
      updateData.genres = Array.isArray(genres) ? genres : genres ? [genres] : [];
    }
    if (synopsis !== undefined) updateData.synopsis = synopsis;
    if (poster_url !== undefined) updateData.poster_url = poster_url;

    const { data, error } = await supabase
      .from('movies')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating movie:', error);
      return res.status(500).json({ message: 'Error al actualizar película' });
    }

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: 'Error interno al actualizar película', error: err.message });
  }
}

// DELETE /api/movies/:id (admin)
async function deleteMovie(req, res) {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('movies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting movie:', error);
      return res.status(500).json({ message: 'Error al eliminar película' });
    }

    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ message: 'Error interno al eliminar película', error: err.message });
  }
}

module.exports = {
  listMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie
};
