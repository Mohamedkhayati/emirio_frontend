import { useState, useEffect, useCallback } from 'react';
import { favoritesApi } from '../lib/api';

export function useFavorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const res = await favoritesApi.getAll();
      setFavorites(res.data || []);
    } catch (err) {
      console.error('Failed to load favorites', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleFavorite = useCallback(async (articleId) => {
    const isFav = favorites.includes(articleId);
    try {
      if (isFav) {
        await favoritesApi.remove(articleId);
        setFavorites(prev => prev.filter(id => id !== articleId));
      } else {
        await favoritesApi.add(articleId);
        setFavorites(prev => [...prev, articleId]);
      }
    } catch (err) {
      console.error('Failed to toggle favorite', err);
      await loadFavorites(); // revert on error
    }
  }, [favorites, loadFavorites]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return { favorites, loading, toggleFavorite, reload: loadFavorites };
}