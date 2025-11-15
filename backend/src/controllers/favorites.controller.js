const { supabase } = require('../config/supabaseClient');

// GET /api/favorites/me (auth)
async function listMyFavorites(req, res) {
  const userId = req.user.sub;
  console.log('📋 Listando favoritos para user:', userId);

  try {
    // Obtener los favoritos del usuario directamente (sin cache)
    const { data: favoritesData, error: favoritesError } = await supabase
      .from('favorites')
      .select('id, movie_id, user_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (favoritesError) {
      console.error('❌ Error listing favorites:', favoritesError);
      return res.status(500).json({ message: 'Error al obtener favoritos: ' + favoritesError.message });
    }

    console.log('✅ Favoritos encontrados:', favoritesData?.length || 0);

    // Si no hay favoritos, retornar array vacío
    if (!favoritesData || favoritesData.length === 0) {
      return res.json([]);
    }

    // Obtener los IDs de las películas
    const movieIds = favoritesData.map(f => f.movie_id);

    // Obtener la información de las películas
    const { data: moviesData, error: moviesError } = await supabase
      .from('movies')
      .select('*')
      .in('id', movieIds);

    if (moviesError) {
      console.error('❌ Error getting movies:', moviesError);
      return res.status(500).json({ message: 'Error al obtener películas: ' + moviesError.message });
    }

    // Combinar favoritos con películas
    const result = favoritesData.map(fav => ({
      id: fav.id,
      created_at: fav.created_at,
      movie: moviesData.find(m => m.id === fav.movie_id) || null
    }));

    console.log('✅ Favoritos con películas:', result.length);
    return res.json(result);
  } catch (err) {
    console.error('❌ Error catch en listMyFavorites:', err);
    return res.status(500).json({ message: 'Error interno al listar favoritos', error: err.message });
  }
}

// POST /api/favorites/movie/:movieId (auth)
async function addFavorite(req, res) {
  const userId = req.user.sub;
  const { movieId } = req.params;
  console.log('❤️ Agregando favorito - User:', userId, 'Movie:', movieId);

  try {
    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        movie_id: movieId
      })
      .select('*')
      .single();

    if (error) {
      console.error('❌ Error adding favorite:', error);
      // Si viola la unique constraint, ya está en favoritos
      if (error.code === '23505') {
        return res.status(200).json({ message: 'La película ya está en favoritos' });
      }
      return res.status(500).json({ message: 'Error al añadir favorito: ' + error.message });
    }

    console.log('✅ Favorito agregado:', data);
    return res.status(201).json(data);
  } catch (err) {
    console.error('❌ Error catch en addFavorite:', err);
    return res.status(500).json({ message: 'Error interno al añadir favorito', error: err.message });
  }
}

// DELETE /api/favorites/movie/:movieId (auth)
async function removeFavorite(req, res) {
  const userId = req.user.sub;
  const { movieId } = req.params;

  try {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('movie_id', movieId);

    if (error) {
      console.error('Error removing favorite:', error);
      return res.status(500).json({ message: 'Error al eliminar favorito' });
    }

    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ message: 'Error interno al eliminar favorito', error: err.message });
  }
}

// GET /api/favorites/movie/:movieId (auth) - Verificar si está en favoritos
async function checkFavorite(req, res) {
  const userId = req.user.sub;
  const { movieId } = req.params;

  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .maybeSingle();

    if (error) {
      console.error('Error checking favorite:', error);
      return res.status(500).json({ message: 'Error al verificar favorito' });
    }

    return res.json({ isFavorite: !!data });
  } catch (err) {
    return res.status(500).json({ message: 'Error interno al verificar favorito', error: err.message });
  }
}

module.exports = {
  listMyFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite
};
