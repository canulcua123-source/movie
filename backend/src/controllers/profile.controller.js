const { supabase } = require('../config/supabaseClient');

// GET /api/profile/stats (auth)
async function getProfileStats(req, res) {
  const userId = req.user.sub;
  console.log('📊 Obteniendo estadísticas para user:', userId);

  try {
    // Contar favoritos
    const { count: favoritesCount, error: favError } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (favError) {
      console.error('❌ Error contando favoritos:', favError);
    }

    // Contar reviews y calcular promedio
    const { data: reviewsData, error: revError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('user_id', userId);

    if (revError) {
      console.error('❌ Error obteniendo reviews:', revError);
    }

    const totalReviews = reviewsData?.length || 0;
    const averageRating = totalReviews > 0
      ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    const stats = {
      totalFavorites: favoritesCount || 0,
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10 // Redondear a 1 decimal
    };

    console.log('✅ Estadísticas calculadas:', stats);
    return res.json(stats);
  } catch (err) {
    console.error('❌ Error catch en getProfileStats:', err);
    return res.status(500).json({ message: 'Error al obtener estadísticas', error: err.message });
  }
}

module.exports = {
  getProfileStats
};
