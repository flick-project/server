/**
 * @file TMDB content source. Wraps TMDB's discover endpoint and tracks
 * pagination per user so the pool can be replenished without repeating pages.
 * @module services/sources/tmdbSource
 * @author Hans Nilsson
 */
import { discoverMovies } from '../tmdbServices.js'
import { findDiscoverProgress, setDiscoverProgress } from '../../models/userModel.js'
import { toPoolItem } from './tmdbMapper.js'

export const tmdbSource = {
  /**
   * Fetches the next page of movies from TMDB based on the given filters.
   * Advances the user's page counter, or resets to page 1 if TMDB runs out.
   * Guests (no userId) always get page 1 without state tracking.
   * @param {number|null} userId - The user's ID, or null for guests.
   * @param {object} filters - TMDB discover filters (genres, keywords, etc.).
   * @returns {Promise<object[]>} The mapped PoolItems.
   */
  async discover (userId, filters) {
    const page = userId ? await findDiscoverProgress(userId) : 1
    const { results } = await discoverMovies(page, filters)
    if (!results.length) {
      if (userId) await setDiscoverProgress(userId, 1)
      return []
    }
    if (userId) await setDiscoverProgress(userId, page + 1)
    return results.filter(m => m.poster_path).map(toPoolItem)
  }
}
